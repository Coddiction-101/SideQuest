import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'

// A dedicated local server lets the test stop the origin completely.
const testServer = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  const file = resolve('dist', '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!file.startsWith(resolve('dist') + '/'.replace('/', process.platform === 'win32' ? '\\' : '/'))) { response.writeHead(403); response.end(); return }
  try {
    const type = file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.webmanifest') ? 'application/manifest+json' : file.endsWith('.png') ? 'image/png' : file.endsWith('.svg') ? 'image/svg+xml' : 'text/html'
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' })
    response.end(readFileSync(file))
  } catch { response.writeHead(404); response.end() }
})
await new Promise(resolve => testServer.listen(0, '127.0.0.1', resolve))
const appUrl = `http://127.0.0.1:${testServer.address().port}/`
const manifestId = new URL('/', appUrl).href
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-pipe', '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'stoic-install-test-')), 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] })
let browser, pwa, installed = false
const timeout = setTimeout(() => { chrome.kill(); process.exit(1) }, 120000)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function connectPipe() {
  let id = 0
  let buffer = ''
  const pending = new Map()
  chrome.stdio[4].setEncoding('utf8')
  chrome.stdio[4].on('data', data => {
    buffer += data
    let end
    while ((end = buffer.indexOf('\0')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end))
      buffer = buffer.slice(end + 1)
      const request = pending.get(message.id)
      if (request) { clearTimeout(request.timeout); pending.delete(message.id); message.error ? request.reject(new Error(JSON.stringify(message.error))) : request.resolve(message.result) }
    }
  })
  return {
    call: (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const key = ++id
      pending.set(key, { resolve, reject, timeout: setTimeout(() => { pending.delete(key); reject(new Error(`Timed out: ${method}`)) }, 25000) })
      chrome.stdio[3].write(JSON.stringify({ id: key, method, params, sessionId }) + '\0')
    }),
  }
}

try {
  browser = connectPipe()
  const attach = async targetId => {
    const { sessionId } = await browser.call('Target.attachToTarget', { targetId, flatten: true })
    return { call: (method, params) => browser.call(method, params, sessionId) }
  }
  const target = await browser.call('Target.createTarget', { url: 'about:blank' })
  let page = await attach(target.targetId)
  const evaluate = async expression => {
    const result = await page.call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const waitFor = async expression => {
    for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100) }
    throw new Error(`Timed out: ${expression}`)
  }
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(100) }
  const reload = async () => {
    const previous = await evaluate('performance.timeOrigin')
    await page.call('Page.reload', { ignoreCache: true })
    await waitFor(`performance.timeOrigin !== ${previous} && !!document.querySelector('input[aria-label="New task"]')`)
  }
  const addTask = async text => {
    await evaluate(`(() => { const input = document.querySelector('input[aria-label="New task"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(text)}); input.dispatchEvent(new Event('input', { bubbles: true })); })()`)
    await sleep(50)
    await evaluate(`document.querySelector('input[aria-label="New task"]').form.requestSubmit()`)
    await sleep(100)
  }
  const screenshot = async name => {
    mkdirSync('artifacts', { recursive: true })
    writeFileSync(`artifacts/${name}.png`, Buffer.from((await page.call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  }
  await page.call('Page.enable')
  await page.call('Page.navigate', { url: appUrl })
  await waitFor(`!!document.querySelector('input[aria-label="New task"]')`)
  await waitFor(`!!navigator.serviceWorker.controller`)
  const manifest = await page.call('Page.getAppManifest')
  assert.equal(JSON.parse(manifest.data).display, 'standalone')
  assert.equal((await page.call('Page.getInstallabilityErrors')).installabilityErrors.length, 0)
  console.log('PASS: manifest, installability, service worker, and offline cache ready.')
  pwa = browser
  await pwa.call('PWA.install', { manifestId, installUrlOrBundleUrl: appUrl })
  installed = true
  await pwa.call('PWA.changeAppUserSettings', { manifestId, displayMode: 'standalone' })
  const launched = await pwa.call('PWA.launch', { manifestId })
  let appTarget
  for (let i = 0; i < 50 && !appTarget; i++) {
    const { targetInfos } = await browser.call('Target.getTargets')
    appTarget = targetInfos.find(info => info.type === 'page' && info.targetId !== target.targetId && info.url.startsWith(appUrl))
    if (!appTarget) await sleep(100)
  }
  page = await attach(appTarget?.targetId ?? launched.targetId)
  await page.call('Page.enable')
  await page.call('Runtime.enable')
  await waitFor(`!!document.querySelector('input[aria-label="New task"]')`)
  const standalone = await evaluate(`matchMedia('(display-mode: standalone)').matches`)
  if (!standalone) console.log('App target diagnostics:', JSON.stringify({ launched, appTarget, targets: await browser.call('Target.getTargets') }))
  assert.equal(standalone, true)
  console.log('PASS: installed and launched Stoic in a standalone app window.')
  await addTask('Try Stoic after installation')
  await click('.today .task-row input')
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 1/)
  await screenshot('installed-stoic')
  const downloads = mkdtempSync(join(tmpdir(), 'stoic-backup-test-'))
  await browser.call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads })
  await click('.app-menu > summary')
  await evaluate(`Array.from(document.querySelectorAll('.menu-action')).find(button => button.textContent.includes('Export backup')).click()`)
  for (let i = 0; i < 40 && !readdirSync(downloads).some(file => file.endsWith('.json')); i++) await sleep(100)
  const backupPath = join(downloads, readdirSync(downloads).find(file => file.endsWith('.json')))
  assert.equal(JSON.parse(readFileSync(backupPath, 'utf8')).app, 'Stoic')
  await click('.app-menu > summary')
  await click('.today .task-row summary')
  await click('.today .task-actions button:last-child')
  await click('.undo-toast button')
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 1/)
  await click('.today .task-row summary')
  await click('.today .task-actions button:last-child')
  await click('.app-menu > summary')
  const root = await page.call('DOM.getDocument')
  const fileInput = await page.call('DOM.querySelector', { nodeId: root.root.nodeId, selector: '.app-menu input[type="file"]' })
  await page.call('DOM.setFileInputFiles', { nodeId: fileInput.nodeId, files: [resolve(backupPath)] })
  await waitFor(`!!document.querySelector('.restore-confirmation')`)
  await click('.restore-confirmation .soft-button')
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 1/)
  console.log('PASS: task creation/completion, undo, export download, and restore in the installed app.')
  await click('.app-menu > summary')
  await addTask('Drag this task')
  await evaluate(`(() => { window.testTransfer = new DataTransfer(); document.querySelector('.drag-handle').dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: window.testTransfer })); })()`)
  await sleep(100)
  await evaluate(`document.querySelector('.today .task-row:last-child').dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: window.testTransfer }))`)
  await sleep(100)
  assert.match(await evaluate(`document.querySelector('.today .task-row').textContent`), /Drag this task/)
  await click('.today .task-row summary')
  await click('.today .task-actions button:last-child')
  await evaluate(`Array.from(document.querySelectorAll('.navigation button')).find(button => button.textContent.trim() === 'Clock').click()`)
  await sleep(100)
  await evaluate(`(() => { window.chimeNotes = 0; const original = AudioContext.prototype.createOscillator; AudioContext.prototype.createOscillator = function(...args) { window.chimeNotes++; return original.apply(this, args); }; })()`)
  await click('.sound-controls input')
  await click('.sound-controls button')
  await waitFor('window.chimeNotes === 2')
  await click('.clock-controls button')
  await evaluate(`window.originalNow = Date.now; Date.now = () => window.originalNow() + 25 * 60000 + 1000`)
  await waitFor('window.chimeNotes === 4')
  await evaluate('Date.now = window.originalNow')
  console.log('PASS: drag reorder and actual Web Audio notes for preview and timer completion.')
  await evaluate(`localStorage.setItem('stoic.data.v1', 'invalid-json')`)
  await reload()
  await waitFor(`!!document.querySelector('.storage-notice')`)
  await click('.app-menu > summary')
  const recoveryRoot = await page.call('DOM.getDocument')
  const recoveryInput = await page.call('DOM.querySelector', { nodeId: recoveryRoot.root.nodeId, selector: '.app-menu input[type="file"]' })
  await page.call('DOM.setFileInputFiles', { nodeId: recoveryInput.nodeId, files: [resolve(backupPath)] })
  await waitFor(`!!document.querySelector('.restore-confirmation')`)
  await click('.restore-confirmation .soft-button')
  await reload()
  assert.equal(await evaluate(`!!document.querySelector('.storage-notice')`), false)
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 1/)
  console.log('PASS: backup restore recovers unreadable storage and saves normally afterward.')
  await new Promise(resolve => { testServer.close(resolve); testServer.closeAllConnections() })
  await assert.rejects(fetch(appUrl), /fetch failed/)
  await reload()
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 1/)
  await addTask('Works offline too')
  await reload()
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 2/)
  for (const section of ['Habits', 'Clock', 'Life', 'Today']) {
    await evaluate(`Array.from(document.querySelectorAll('.navigation button')).find(button => button.textContent.trim() === ${JSON.stringify(section)}).click()`)
    await sleep(100)
    assert.equal(await evaluate(`!!document.querySelector('h1')`), true)
  }
  await screenshot('installed-stoic-offline')
  console.log('PASS: installed app reloads offline, saves new offline tasks, and opens all four sections.')
} finally {
  if (installed && pwa) await pwa.call('PWA.uninstall', { manifestId }).catch(console.error)
  if (browser) await browser.call('Browser.close').catch(() => {})
  clearTimeout(timeout)
  chrome.stdio[3].destroy()
  chrome.stdio[4].destroy()
  chrome.kill()
  testServer.closeAllConnections()
  testServer.close()
}
