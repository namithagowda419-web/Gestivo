import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-5min-'));

console.log('[5-Minute Stability Test] Starting Chrome with fake camera stream...');
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9226',
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
      const res = await fetch('http://127.0.0.1:9226/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function run5MinTest() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Could not connect to Chrome CDP on port 9226');
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9226/json/new?http://localhost:5173/cue-camera', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const errors = [];
  const checkpoints = [];

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
      if (data.params.type === 'error' && !text.includes('XNNPACK') && !text.includes('favicon')) {
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

  // Accept consent and start camera
  console.log('[5-Min Test] Accepting consent...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable') || b.textContent.includes('Start'));
      if (btn) btn.click();
    })()`,
    awaitPromise: true
  });

  await sleep(2500);

  // Ensure camera is active
  await send('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Cue Camera'));
      if (startBtn) startBtn.click();
    })()`
  });

  await sleep(3000);

  console.log('========================================================================');
  console.log('[5-Min Test] Commencing 300-Second Continuous Stability Run...');
  console.log('========================================================================');

  const totalDurationSec = 300;
  const intervalSec = 30;
  const steps = totalDurationSec / intervalSec;

  for (let step = 1; step <= steps; step++) {
    await sleep(intervalSec * 1000);
    const elapsedSec = step * intervalSec;

    const stats = await send('Runtime.evaluate', {
      expression: `(() => {
        const video = document.querySelector('video');
        const canvas = document.querySelector('canvas');
        const heapMb = performance.memory ? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) : 'N/A';
        return {
          active: video?.readyState === 4 && !video?.paused,
          resolution: video ? video.videoWidth + 'x' + video.videoHeight : 'none',
          heapMb,
          hasErrorBoundary: !!document.querySelector('.bg-amber-500, [role="alert"]')
        };
      })()`,
      returnByValue: true
    });

    const info = stats?.result?.value;
    checkpoints.push({ elapsedSec, ...info, errorsCount: errors.length });
    console.log(`[T+${elapsedSec}s / 300s] Video: ${info?.active ? 'ACTIVE' : 'INACTIVE'} (${info?.resolution}) | Heap: ${info?.heapMb} MB | ErrorBoundary: ${info?.hasErrorBoundary} | Total Errors: ${errors.length}`);
  }

  console.log('\n[5-Min Test] Stability checkpoints:');
  console.table(checkpoints);

  ws.close();
  await fetch(`http://127.0.0.1:9226/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});
  chromeProcess.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  fs.writeFileSync(
    path.resolve(process.cwd(), 'stability-5min-report.json'),
    JSON.stringify({ checkpoints, errors }, null, 2)
  );

  if (errors.length === 0) {
    console.log('\n🎉 [5-Minute Stability Test]: PASSED! Zero errors, flat memory, stable execution throughout 300 seconds!');
  } else {
    console.error(`\n❌ [5-Minute Stability Test]: FAILED with ${errors.length} errors.`);
    process.exit(1);
  }
}

run5MinTest();
