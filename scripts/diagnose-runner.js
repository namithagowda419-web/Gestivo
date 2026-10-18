import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-diag-'));

console.log('[Diag] Launching Chrome headless with fake media devices...');
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9222',
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
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function testUrl(targetUrl, runScript, durationSec = 6) {
  console.log(`\n======================================================`);
  console.log(`[Diag] Testing URL: ${targetUrl}`);
  console.log(`======================================================`);

  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(targetUrl), { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const consoleLogs = [];
  const errors = [];
  const failedRequests = [];

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
      const type = data.params.type;
      const text = data.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      consoleLogs.push(`[Console ${type}] ${text}`);
      if (type === 'error') {
        errors.push(`[Console error] ${text}`);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      const exc = data.params.exceptionDetails;
      const desc = exc.exception ? (exc.exception.description || exc.exception.value) : exc.text;
      errors.push(`[Exception] ${desc} at ${exc.url}:${exc.lineNumber}:${exc.columnNumber}`);
    } else if (data.method === 'Network.responseReceived') {
      const res = data.params.response;
      if (res.status >= 400) {
        failedRequests.push(`[HTTP ${res.status}] ${res.url}`);
      }
    } else if (data.method === 'Network.loadingFailed') {
      failedRequests.push(`[Network Failed] ${data.params.errorText}: ${data.params.requestId}`);
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  await sleep(2000);

  if (runScript) {
    console.log(`[Diag] Executing interaction script on ${targetUrl}...`);
    await send('Runtime.evaluate', { expression: runScript, awaitPromise: true });
  }

  console.log(`[Diag] Waiting ${durationSec}s to observe stability, errors, and frame execution...`);
  await sleep(durationSec * 1000);

  // Evaluate DOM state / crash status
  const pageState = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 500),
        statusEl: document.getElementById('status')?.innerText || null,
        errorBoundary: document.querySelector('.bg-amber-500, [role="alert"]')?.innerText || null,
        videoReadyState: document.querySelector('video')?.readyState,
        videoDimensions: document.querySelector('video') ? (document.querySelector('video').videoWidth + 'x' + document.querySelector('video').videoHeight) : 'no video',
        isPaused: document.querySelector('video')?.paused
      };
    })()`,
    returnByValue: true
  });

  console.log('[Diag] Page Evaluation State:', pageState?.result?.value);
  console.log(`[Diag] Console Logs (${consoleLogs.length}):`);
  consoleLogs.slice(-15).forEach(l => console.log('  ', l));
  
  console.log(`[Diag] Errors (${errors.length}):`);
  if (errors.length === 0) console.log('   None!');
  errors.forEach(e => console.log('   🚨', e));

  console.log(`[Diag] Failed Network Requests (${failedRequests.length}):`);
  if (failedRequests.length === 0) console.log('   None!');
  failedRequests.forEach(r => console.log('   🚨', r));

  ws.close();
  await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});

  return {
    pageState: pageState?.result?.value,
    consoleLogs,
    errors,
    failedRequests
  };
}

async function run() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Could not connect to Chrome CDP on port 9222');
    process.exit(1);
  }

  try {
    // 1. Test Standalone HTML first
    const standaloneResult = await testUrl(
      'http://localhost:5173/camera-test.html',
      `(() => {
        const btn = document.getElementById('startBtn');
        if (btn) btn.click();
      })()`,
      6
    );

    // 2. Test React Camera Page
    const reactResult = await testUrl(
      'http://localhost:5173/cue-camera',
      `(() => {
        // Check consent checkbox if present
        const checkbox = document.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.click();
        }
        // Click accept/start button
        const startBtns = Array.from(document.querySelectorAll('button'));
        const targetBtn = startBtns.find(b => b.textContent.includes('Start') || b.textContent.includes('Enable') || b.textContent.includes('Consent') || b.textContent.includes('Begin'));
        if (targetBtn) {
          targetBtn.click();
        }
      })()`,
      10
    );

    fs.writeFileSync(
      path.resolve(process.cwd(), 'diagnosis-report.json'),
      JSON.stringify({ standaloneResult, reactResult }, null, 2)
    );
    console.log('\n[Diag] Completed diagnosis run. Saved to diagnosis-report.json');
  } finally {
    chromeProcess.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run();
