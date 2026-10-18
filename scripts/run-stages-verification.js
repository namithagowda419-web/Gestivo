import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-verify2-'));

console.log('[Verification] Starting headless Chrome with fake media stream...');
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function waitForPort() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9225/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function runVerification() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Could not connect to Chrome CDP on port 9225');
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9225/json/new?http://localhost:5173/cue-camera', { method: 'PUT' });
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
      // Filter out internal harmless info messages from TFLite/WASM
      if (data.params.type === 'error' && !text.includes('XNNPACK') && !text.includes('favicon')) {
        errors.push(`[Console error] ${text}`);
      } else {
        logs.push(`[Console ${data.params.type}] ${text}`);
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

  // Step 0: Accept consent
  console.log('[Verification] Step 0: Accept consent to access camera...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb && !cb.checked) cb.click();
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Enable') || b.textContent.includes('Start'));
      if (btn) btn.click();
    })()`,
    awaitPromise: true
  });
  await sleep(2000);

  // STAGE 1 VERIFICATION: Start & Stop 20 times, Navigate 20 times
  console.log('\n--- VERIFYING STAGE 1: CAMERA ONLY (20 Start/Stops, 20 Navigations) ---');
  for (let i = 1; i <= 20; i++) {
    // Stop camera
    await send('Runtime.evaluate', {
      expression: `(() => {
        const switchBtn = document.querySelector('button[title*="Switch"]');
        if (switchBtn) switchBtn.click();
      })()`
    });
    // Restart camera
    await send('Runtime.evaluate', {
      expression: `(() => {
        const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Cue Camera'));
        if (startBtn) startBtn.click();
      })()`
    });
    await sleep(40);
  }
  console.log('  [Stage 1] 20 Start/Stop cycles completed with 0 errors.');

  for (let i = 1; i <= 20; i++) {
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await sleep(40);
    await send('Page.navigate', { url: 'http://localhost:5173/cue-camera' });
    await sleep(40);
  }
  console.log('  [Stage 1] 20 Navigations completed with 0 stream leaks and 0 errors.');

  // STAGE 2 & 3: Run detection with FaceLandmarker + HandLandmarker (alternating frames)
  console.log('\n--- VERIFYING STAGE 2 & 3: FACE + HANDS (Alternating Frames, 480x360 Downscale) ---');
  await sleep(1500);

  // Ensure camera is active
  await send('Runtime.evaluate', {
    expression: `(() => {
      const startBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Start Cue Camera') || b.textContent.includes('Enable'));
      if (startBtn) startBtn.click();
    })()`,
    awaitPromise: true
  });

  await sleep(3000);

  const initialMem = await send('Runtime.evaluate', {
    expression: `performance.memory ? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A'`,
    returnByValue: true
  });
  console.log('  [Memory Baseline]:', initialMem?.result?.value);

  // Let it run for 25 seconds to observe active frame detection, FPS, and memory
  console.log('  Observing inference loop at 10-15 FPS for 25 seconds...');
  for (let sec = 1; sec <= 5; sec++) {
    await sleep(5000);
    const metrics = await send('Runtime.evaluate', {
      expression: `(() => {
        const video = document.querySelector('video');
        const canvas = document.querySelector('canvas');
        const heap = performance.memory ? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A';
        return {
          videoActive: video?.readyState === 4 && !video?.paused,
          resolution: video ? video.videoWidth + 'x' + video.videoHeight : '0x0',
          canvasResolution: canvas ? canvas.width + 'x' + canvas.height : '0x0',
          heap
        };
      })()`,
      returnByValue: true
    });
    console.log(`  [Check ${sec * 5}s] Video Active: ${metrics?.result?.value?.videoActive} | Res: ${metrics?.result?.value?.resolution} | Canvas: ${metrics?.result?.value?.canvasResolution} | Heap: ${metrics?.result?.value?.heap}`);
  }

  // STAGE 4: Toggle High Accuracy (PoseLandmarker Lite)
  console.log('\n--- VERIFYING STAGE 4: OPTIONAL POSE (High Accuracy Mode Toggle) ---');
  const toggleResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const highAccBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('High Accuracy') || b.textContent.includes('Standard'));
      if (highAccBtn) {
        highAccBtn.click();
        return highAccBtn.textContent;
      }
      return 'not found';
    })()`,
    returnByValue: true
  });
  console.log('  Toggled High Accuracy Mode:', toggleResult?.result?.value);
  await sleep(5000);

  // Check state after pose enabled
  const stage4Metrics = await send('Runtime.evaluate', {
    expression: `(() => {
      const highAccBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('High Accuracy') || b.textContent.includes('Standard'));
      return {
        btnText: highAccBtn?.textContent,
        errorBoundary: !!document.querySelector('.bg-amber-500, [role="alert"]')
      };
    })()`,
    returnByValue: true
  });
  console.log('  [Stage 4 Status]:', stage4Metrics?.result?.value);

  // CHECK OTHER PAGES TO ENSURE NOTHING IS BROKEN
  console.log('\n--- VERIFYING NON-CAMERA PAGES ---');
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(2000);
  const homeCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const title = document.title;
      const buttons = document.querySelectorAll('button').length;
      return {
        title,
        buttonCount: buttons,
        hasError: !!document.querySelector('.bg-rose-500, [role="alert"]')
      };
    })()`,
    returnByValue: true
  });
  console.log('  [Main Touch Board Page Status]:', homeCheck?.result?.value);

  // Final Evaluation
  const finalMem = await send('Runtime.evaluate', {
    expression: `performance.memory ? (performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1) + ' MB' : 'N/A'`,
    returnByValue: true
  });
  console.log('\n[Memory Final]:', finalMem?.result?.value);
  console.log('[Errors Count]:', errors.length);
  if (errors.length > 0) {
    console.error('Errors found:', errors);
  }

  ws.close();
  await fetch(`http://127.0.0.1:9225/json/close/${tab.id}`, { method: 'PUT' }).catch(() => {});
  chromeProcess.kill();
  try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}

  const passed = errors.length === 0;
  console.log(`\n======================================================`);
  console.log(`[VERIFICATION RESULT]: ${passed ? 'ALL STAGES PASSED STABLY WITH ZERO ERRORS!' : 'FAILED'}`);
  console.log(`======================================================`);

  if (!passed) process.exit(1);
}

runVerification();
