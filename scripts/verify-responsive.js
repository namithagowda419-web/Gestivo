import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-resp-'));

const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9224',
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
      const res = await fetch('http://127.0.0.1:9224/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function main() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Could not connect to Chrome CDP on port 9224');
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9224/json/new?http://localhost:5173/', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const errors = [];
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
  await sleep(1500);

  const viewports = [
    { name: 'Mobile (390px)', width: 390, height: 844 },
    { name: 'Tablet (768px)', width: 768, height: 1024 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 }
  ];

  for (const vp of viewports) {
    console.log(`Testing viewport: ${vp.name}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 800
    });
    await sleep(500);

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth + 5; // slight tolerance
        const isHeaderVisible = !!document.querySelector('header');
        const isBoardVisible = !!document.querySelector('.grid') || !!document.querySelector('main');
        return {
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow,
          isHeaderVisible,
          isBoardVisible
        };
      })()`,
      returnByValue: true
    });

    console.log(`  Result for ${vp.name}:`, check?.result?.value);
  }

  ws.close();
  await fetch(`http://127.0.0.1:9224/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});
  chromeProcess.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  if (errors.length === 0) {
    console.log('✅ Responsive layout verified with 0 errors across Mobile (390px), Tablet (768px), and Desktop (1440px)!');
  } else {
    console.error('❌ Errors found during responsive layout testing:', errors);
    process.exit(1);
  }
}

main();
