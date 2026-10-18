import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-preview-'));

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) return true;
    } catch (e) {}
    await sleep(250);
  }
  return false;
}

async function main() {
  console.log('[Production Check] Starting vite preview on port 4173...');
  const previewProcess = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    shell: true,
    stdio: 'ignore'
  });

  const isServerUp = await waitForServer('http://localhost:4173/');
  if (!isServerUp) {
    console.error('Vite preview failed to start on port 4173');
    previewProcess.kill();
    process.exit(1);
  }
  console.log('✅ Vite preview is up at http://localhost:4173');

  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: 'ignore' });

  let isCdpUp = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
      if (res.ok) {
        isCdpUp = true;
        break;
      }
    } catch (e) {}
    await sleep(200);
  }

  if (!isCdpUp) {
    console.error('Could not connect to Chrome CDP on port 9225');
    previewProcess.kill();
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9225/json/new?http://localhost:4173/', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const errors = [];
  const network404s = [];
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
    } else if (data.method === 'Network.responseReceived') {
      const status = data.params.response.status;
      const url = data.params.response.url;
      if (status >= 400 && !url.includes('favicon')) {
        network404s.push(`${status} - ${url}`);
      }
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await sleep(1500);

  console.log('[Production Check] Checking root page...');
  const title = await send('Runtime.evaluate', { expression: 'document.title' });
  console.log('  Page Title:', title?.result?.value);

  console.log('[Production Check] Checking Cue Camera on production build...');
  await send('Page.navigate', { url: 'http://localhost:4173/cue-camera' });
  await sleep(2500);

  const cueCameraReady = await send('Runtime.evaluate', {
    expression: `(() => {
      const video = document.querySelector('video');
      return {
        hasVideo: !!video,
        readyState: video ? video.readyState : null,
        heading: document.querySelector('h1')?.textContent || document.querySelector('h2')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('  Cue Camera info on preview:', cueCameraReady?.result?.value);

  ws.close();
  await fetch(`http://127.0.0.1:9225/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});
  chromeProcess.kill();
  previewProcess.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  console.log('\n=======================================');
  console.log('Production Preview Errors:', errors.length);
  console.log('Production Preview 404s:', network404s.length);
  if (errors.length > 0) console.error('Errors:', errors);
  if (network404s.length > 0) console.error('404s:', network404s);
  console.log('=======================================');

  if (errors.length === 0 && network404s.length === 0) {
    console.log('🎉 Production build preview PASSED with 0 errors and 0 404s!');
  } else {
    process.exit(1);
  }
}

main();
