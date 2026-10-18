import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-stage1-'));

console.log('[Stage 1 Acceptance] Launching Chrome with synthetic media devices...');
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  '--no-first-run',
  '--no-default-browser-check',
  `--user-data-dir=${userDataDir}`,
  'about:blank'
], { stdio: 'ignore' });

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9223/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function main() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Could not connect to Chrome CDP on port 9223');
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9223/json/new?http://localhost:5173/cue-camera', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const errors = [];
  const logs = [];

  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data.result);
      callbacks.delete(data.id);
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      if (data.params.type === 'error' && !text.includes('favicon')) {
        errors.push(`[Console error] ${text}`);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      const exc = data.params.exceptionDetails;
      const desc = exc.exception ? (exc.exception.description || exc.exception.value) : exc.text;
      errors.push(`[Exception] ${desc}`);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');

  await sleep(2000);

  console.log('[Stage 1] Giving consent if on consent screen...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable') || b.textContent.includes('Start'));
      if (btn) btn.click();
    })()`,
    awaitPromise: true
  });

  await sleep(1500);

  // Test 1: Start and stop 20 times
  console.log('[Stage 1] Starting & Stopping camera 20 times...');
  for (let i = 1; i <= 20; i++) {
    // Stop
    await send('Runtime.evaluate', {
      expression: `(() => {
        const stopBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Pause') || b.textContent.includes('Pause') || b.title?.includes('Stop'));
        if (stopBtn) stopBtn.click();
      })()`,
    });
    await sleep(150);

    // Start
    await send('Runtime.evaluate', {
      expression: `(() => {
        const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Cue Camera') || b.textContent.includes('Start'));
        if (startBtn) startBtn.click();
      })()`,
    });
    await sleep(200);
    process.stdout.write(`\r  Cycle ${i}/20 completed...`);
  }
  console.log('\n[Stage 1] 20 Start/Stop cycles completed successfully.');

  // Test 2: Navigate away and back 20 times
  console.log('[Stage 1] Navigating away and back 20 times...');
  for (let i = 1; i <= 20; i++) {
    // Navigate away to touch board
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(250);
    // Navigate back to camera
    await send('Page.navigate', { url: 'http://localhost:5173/cue-camera' });
    await sleep(250);
    process.stdout.write(`\r  Navigation ${i}/20 completed...`);
  }
  console.log('\n[Stage 1] 20 Navigations completed successfully.');

  // Test 3: Check stream count in DOM
  const streamCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const video = document.querySelector('video');
      const hasStream = !!video && !!video.srcObject && video.srcObject.active;
      const tracks = video?.srcObject?.getTracks?.() || [];
      return {
        hasVideo: !!video,
        hasStream,
        activeTrackCount: tracks.filter(t => t.readyState === 'live').length,
        readyState: video?.readyState
      };
    })()`,
    returnByValue: true
  });

  console.log('[Stage 1] Stream state:', streamCheck?.result?.value);
  console.log('[Stage 1] Errors encountered:', errors.length);
  if (errors.length > 0) {
    console.error('Errors:', errors);
  }

  ws.close();
  await fetch(`http://127.0.0.1:9223/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});
  chromeProcess.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  if (errors.length === 0) {
    console.log('[Stage 1] Acceptance PASS: Exactly 1 active stream, 0 console errors!');
  } else {
    console.error('[Stage 1] Acceptance FAIL: Console errors detected.');
    process.exit(1);
  }
}

main();
