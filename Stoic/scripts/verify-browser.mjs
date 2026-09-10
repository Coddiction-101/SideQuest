// Dependency-free browser smoke check. Uses a separate, temporary Chrome profile.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert/strict'

const executable = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const url = process.env.STOIC_URL || 'http://localhost:5173/'
const chrome = spawn(executable, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', '--user-data-dir=' + mkdtempSync(join(tmpdir(), 'stoic-verify-')), 'about:blank'], { windowsHide: true })
let socket
const timeout = setTimeout(() => { chrome.kill(); process.exit(1) }, 90000)
try {
  const endpoint = await new Promise((resolve, reject) => {
    let output = ''
    chrome.stderr.on('data', data => {
      output += data
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/)
      if (match) resolve(match[1])
    })
    chrome.on('error', reject)
    chrome.on('exit', code => reject(new Error(`Browser exited: ${code}`)))
  })
  const origin = endpoint.replace('ws:', 'http:').split('/devtools')[0]
  const target = await (await fetch(origin + '/json/new?about:blank', { method: 'PUT' })).json()
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))
  let id = 0
  const pending = new Map()
  const errors = []
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id)
      pending.delete(message.id)
      message.error ? reject(message.error) : resolve(message.result)
    }
  })
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
  const waitFor = async expression => {
    for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await sleep(100) }
    throw new Error(`Timed out: ${expression}`)
  }
  const click = async selector => { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(80) }
  const fill = async (selector, value) => {
    await evaluate(`(() => { const input = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(value)}); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); })()`)
    await sleep(50)
  }
  const add = async (label, value) => {
    await fill(`input[aria-label="${label}"]`, value)
    await evaluate(`document.querySelector('input[aria-label="${label}"]').form.requestSubmit()`)
    await sleep(80)
  }
  const navigate = async page => {
    await evaluate(`Array.from(document.querySelectorAll('.navigation button')).find(button => button.textContent.trim() === ${JSON.stringify(page)}).click()`)
    await sleep(100)
  }
  const screenshot = async name => {
    mkdirSync('artifacts', { recursive: true })
    writeFileSync(`artifacts/${name}.png`, Buffer.from((await call('Page.captureScreenshot', { format: 'png' })).data, 'base64'))
  }
  await call('Page.enable')
  await call('Runtime.enable')
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await call('Page.navigate', { url })
  await waitFor(`!!document.querySelector('input[aria-label="New task"]')`)
  await click('.app-menu > summary')
  await evaluate(`document.querySelector('.app-menu-panel').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))`)
  assert.equal(await evaluate(`document.querySelector('.app-menu').open`), true, 'Inside clicks keep app options open')
  await call('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: 200, button: 'left', clickCount: 1 })
  await call('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: 200, button: 'left', clickCount: 1 })
  assert.equal(await evaluate(`document.querySelector('.app-menu').open`), false, 'Outside clicks dismiss app options')
  await click('.app-menu > summary')
  await call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  await call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  assert.equal(await evaluate(`document.querySelector('.app-menu').open`), false, 'Escape dismisses app options')
  assert.equal(await evaluate(`document.activeElement === document.querySelector('.app-menu > summary')`), true, 'Escape restores focus')
  assert.equal(await evaluate(`getComputedStyle(document.documentElement).backgroundColor`), 'rgb(240, 240, 240)')
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('nav')).position`), 'fixed')
  await call('Emulation.setDeviceMetricsOverride', { width: 1240, height: 597, deviceScaleFactor: 1, mobile: false })
  await screenshot('today-browser-empty')
  await call('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await add('New task', 'Finish API practice')
  await add('New task', 'Morning workout')
  await add('New task', 'Read 20 minutes')
  await click('.today .task-row:nth-child(2) input')
  await click('.today .task-row:nth-child(3) summary')
  await click('.today .task-row:nth-child(3) .task-actions button:first-child')
  assert.match(await evaluate(`document.querySelector('.today .task-row:nth-child(2)').textContent`), /Read 20 minutes/)
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 3/)
  await navigate('Habits')
  for (const name of ['Drink Water', 'Read 20 Minutes', 'Workout']) await add('New habit', name)
  await click('.habit-row input')
  assert.equal(await evaluate(`document.querySelector('.streak').textContent`), '1 day')
  await click('.habit-row input')
  assert.equal(await evaluate(`document.querySelector('.streak').textContent`), '0 days')
  await click('.habit-row input')
  await screenshot('habits-mobile')
  await navigate('Today')
  assert.equal(await evaluate(`document.querySelector('.preview-list input').checked`), true)
  await screenshot('today-mobile')
  assert.equal(await evaluate(`!!document.querySelector('.focus-preview')`), false)
  await navigate('Clock')
  await click('.clock-controls button')
  await sleep(1200)
  assert.equal(await evaluate(`document.querySelector('.clock-controls button').textContent`), 'Pause')
  await click('.clock-controls button')
  const paused = await evaluate(`document.querySelector('.clock-time').textContent`)
  await sleep(1100)
  assert.equal(await evaluate(`document.querySelector('.clock-time').textContent`), paused)
  await click('.clock-controls button:last-child')
  await click('.duration-settings summary')
  await fill('.duration-settings input', '1')
  await evaluate(`document.querySelector('.duration-settings form').requestSubmit()`)
  await sleep(100)
  assert.equal(await evaluate(`document.querySelector('.clock-time').textContent`), '01:00')
  await screenshot('clock-mobile')
  await click('#tab-Stopwatch')
  await click('.clock-controls button')
  await sleep(1200)
  await click('.clock-controls button')
  assert.notEqual(await evaluate(`document.querySelector('.clock-time').textContent`), '00:00')
  await click('.clock-controls button:last-child')
  assert.equal(await evaluate(`document.querySelector('.clock-time').textContent`), '00:00')
  await click('#tab-Countdown')
  await fill('input[aria-label="Countdown target"]', '2030-01-01T12:00')
  assert.notEqual(await evaluate(`document.querySelector('.countdown-unit strong').textContent`), '00')
  await fill('input[aria-label="Countdown target"]', '2020-01-01T12:00')
  await waitFor(`document.querySelector('.clock-caption').textContent.includes('arrived')`)
  await navigate('Life')
  await fill('.life-form input[type="date"]', '2000-09-10')
  await evaluate(`document.querySelector('.life-form').requestSubmit()`)
  await waitFor(`!!document.querySelector('.life-ring')`)
  assert.equal(await evaluate(`document.querySelectorAll('[role="progressbar"]').length`), 4)
  await screenshot('life-mobile')
  await click('.theme-toggle')
  await waitFor(`document.documentElement.dataset.theme === 'dark'`)
  await screenshot('life-dark-mobile')
  await call('Page.reload')
  await waitFor(`!!document.querySelector('.task-count')`)
  assert.equal(await evaluate(`document.documentElement.dataset.theme`), 'dark')
  assert.match(await evaluate(`document.querySelector('.task-count').textContent`), /1 of 3/)
  assert.equal(await evaluate(`document.querySelectorAll('.preview-list li').length`), 3)
  await navigate('Life')
  assert.equal(await evaluate(`!!document.querySelector('.life-ring')`), true)
  await navigate('Today')
  await click('.today .task-row:nth-child(2) summary')
  await click('.today .task-row:nth-child(2) .task-actions button:last-child')
  assert.equal(await evaluate(`document.querySelectorAll('.today .task-row').length`), 2)
  await click('.undo-toast button')
  assert.equal(await evaluate(`document.querySelectorAll('.today .task-row').length`), 3)
  await click('.today .task-row:nth-child(2) summary')
  await click('.today .task-row:nth-child(2) .task-actions button:last-child')
  await navigate('Habits')
  await click('.habit-row:last-child summary')
  await click('.habit-row:last-child .task-actions button')
  assert.equal(await evaluate(`document.querySelectorAll('.habit-row').length`), 2)
  await click('.undo-toast button')
  assert.equal(await evaluate(`document.querySelectorAll('.habit-row').length`), 3)
  await click('.habit-row:last-child summary')
  await click('.habit-row:last-child .task-actions button')
  await click('.theme-toggle')
  await click('.toast-dismiss')
  for (const [width, height] of [[320, 568], [390, 667], [390, 844], [768, 520], [1024, 600], [1240, 597], [1440, 900], [1920, 1080], [844, 390]]) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 641 })
    for (const page of ['Today', 'Habits', 'Clock', 'Life']) {
      await navigate(page)
      assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth`), false, `${page} overflows at ${width}px`)
      const measurements = await evaluate(`({ documentHeight: document.documentElement.scrollHeight, height: innerHeight, controlsBottom: document.querySelector('.app-controls').getBoundingClientRect().bottom })`)
      console.log(`${page} ${width}x${height}: document=${measurements.documentHeight}, controls=${Math.round(measurements.controlsBottom)}`)
      if (page === 'Today') {
        const layout = await evaluate(`(() => { const tasks = document.querySelector('.today-content').getBoundingClientRect(); const habits = document.querySelector('.today-sidebar').getBoundingClientRect(); return { aligned: Math.abs(tasks.left - habits.left) < 1, stacked: habits.top >= tasks.bottom }; })()`)
        assert.ok(layout.aligned && layout.stacked, 'Today keeps tasks and habits in one aligned column')
      }
      if (page === 'Today' && height < 480) {
        await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
        assert.equal(await evaluate(`Math.round(document.querySelector('.desktop-header').getBoundingClientRect().top)`), 0, 'Header stays reachable in short windows')
        await evaluate('window.scrollTo(0, 0)')
      } else assert.ok(measurements.documentHeight <= height + 1, `${page} requires scrolling at ${width}x${height}`)
      if (page === 'Clock') {
        for (const mode of ['Timer', 'Stopwatch', 'Countdown']) {
          await click(`#tab-${mode}`)
          assert.ok(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1'), `${mode} requires scrolling at ${width}x${height}`)
          assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'), false, `${mode} overflows horizontally at ${width}x${height}`)
        }
      }
      if ((width === 768 && height === 520) || (width === 320 && height === 568)) await screenshot(`${page.toLowerCase()}-${width}x${height}`)
      if (width === 1920) await screenshot(`${page.toLowerCase()}-full-desktop`)
      if (width === 1240 && page === 'Today') await screenshot('today-browser-populated')
    }
  }
  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
  await navigate('Today')
  await screenshot('today-desktop')
  await navigate('Clock')
  await click('#tab-Timer')
  await click('.clock-controls button')
  await call('Page.reload')
  await waitFor(`!!document.querySelector('.today-page')`)
  await navigate('Clock')
  assert.equal(await evaluate(`document.querySelector('.clock-controls button').textContent`), 'Pause')
  await click('.clock-controls button:last-child')
  await navigate('Today')
  const oldDay = await evaluate(`document.querySelector('time').dateTime`)
  await evaluate(`(() => {
    const OriginalDate = Date;
    const current = new OriginalDate();
    const offset = new OriginalDate(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 1).getTime() - OriginalDate.now();
    globalThis.Date = class extends OriginalDate {
      constructor(...args) { super(...(args.length ? args : [OriginalDate.now() + offset])); }
      static now() { return OriginalDate.now() + offset; }
    };
  })()`)
  await waitFor(`document.querySelector('.task-count').textContent.includes('0 of 0')`)
  assert.equal(await evaluate(`document.querySelector('.preview-list input').checked`), false)
  await add('New task', 'A fresh day')
  assert.equal(await evaluate(`JSON.parse(localStorage.getItem('stoic.data.v1')).tasksByDay[${JSON.stringify(oldDay)}].length`), 2)
  await navigate('Habits')
  assert.equal(await evaluate(`document.querySelector('.streak').textContent`), '1 day')
  await evaluate(`localStorage.setItem('stoic.data.v1', 'invalid-json')`)
  await call('Page.reload')
  await waitFor(`!!document.querySelector('.storage-notice')`)
  assert.equal(await evaluate(`localStorage.getItem('stoic.data.v1')`), 'invalid-json')
  assert.equal(await evaluate(`!!document.querySelector('input[aria-label="New task"]')`), true)
  assert.deepEqual(errors, [])
  console.log('PASS: interactions, persistence, midnight/history, storage recovery, and all four pages plus every clock mode at nine viewport sizes; no horizontal overflow; standard content fits except natural Today scrolling in short landscape windows, and no browser exceptions.')
  await call('Browser.close')
} finally {
  clearTimeout(timeout)
  socket?.close()
  chrome.kill()
}
