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
    throw new Error(`Timed out: ${expression}; ${JSON.stringify(await evaluate("({url:location.href,metrics:window.WatcherAPI?.getMetrics(),error:window.WatcherAPI?.getError()})"))}`)
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

  await call('Page.enable'); await call('Runtime.enable');
  await call('Page.navigate', { url });
  await waitFor('!!window.WatcherAPI && window.WatcherAPI.getMetrics().length === 1');
  await waitFor('window.WatcherAPI.getMetrics()[0].fcp > 0');
  assert.ok(await evaluate('window.WatcherAPI.getMetrics()[0].pageLoadTime >= 0'));
  assert.ok(await evaluate('!JSON.stringify(window.WatcherAPI.getMetrics()).includes("userAgent")'));
  await evaluate('localStorage.setItem("stoic.pulse-test-marker", "keep")');
  await call('Page.navigate', {url: url + 'pulse/index.html'});
  await waitFor('!!document.getElementById("total-samples") && document.getElementById("total-samples").textContent === "1"');
  await sleep(500);
  assert.equal(await evaluate('window.WatcherAPI.getMetrics().length'), 1, 'Dashboard does not record itself');
  await evaluate('window.WatcherAPI.clearMetrics()');
  assert.equal(await evaluate('document.getElementById("total-samples").textContent'), '0');
  assert.equal(await evaluate('localStorage.getItem("stoic.pulse-test-marker")'), 'keep');
  assert.equal(await evaluate('document.getElementById("empty").hidden'), false);
  await evaluate('localStorage.setItem("pulse.metrics.v2", JSON.stringify([{id:"untrusted",timestamp:new Date().toISOString(),url:"<img src=x onerror=alert(1)>",pageLoadTime:1,fcp:2,lcp:null,cls:0,viewport:"390 x 844"}]));window.dispatchEvent(new Event("pulse-update"))');
  assert.equal(await evaluate('document.querySelectorAll("tbody img").length'), 0);
  assert.ok(await evaluate('document.querySelector("tbody").textContent.includes("<img")'));
  for (const [width,height] of [[320,568],[390,844],[1440,900]]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<641});
    assert.equal(await evaluate('document.documentElement.scrollWidth > innerWidth'),false);
  }
  await screenshot('pulse-desktop');
  await evaluate('localStorage.setItem("pulse.metrics.v2", "broken");window.dispatchEvent(new Event("pulse-update"))');
  assert.ok(await evaluate('document.getElementById("status").textContent.includes("unreadable")'));
  await call('Page.navigate',{url});
  await waitFor('!!window.WatcherAPI'); await sleep(500);
  assert.equal(await evaluate('localStorage.getItem("pulse.metrics.v2")'),'broken');
  await evaluate('window.WatcherAPI.clearMetrics()');
  const beforeReload = await evaluate('performance.timeOrigin');
  await call('Page.reload');
  await waitFor(`performance.timeOrigin !== ${beforeReload} && !!window.WatcherAPI && window.WatcherAPI.getMetrics().length >= 1`);
  await waitFor('!!navigator.serviceWorker.controller');
  // Simulate a failed network with the service worker still available.
  await call('Network.enable');
  await call('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
  await call('Page.navigate',{url:url+'pulse/index.html'});
  await waitFor('document.title.includes("Pulse") && !!document.querySelector("#total-samples")');
  assert.ok(Number(await evaluate('document.getElementById("total-samples").textContent')) >= 1);
  assert.deepEqual(errors,[]);
  console.log('PASS: Pulse collection, correct paint source, dashboard isolation, safe rendering, storage recovery, responsive fit, and offline dashboard.');
  await call('Browser.close');
} finally { clearTimeout(timeout); socket?.close(); chrome.kill(); }
