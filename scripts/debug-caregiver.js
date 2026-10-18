import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9229',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

async function run() {
  await new Promise(r => setTimeout(r, 1000));
  const newTabRes = await fetch('http://127.0.0.1:9229/json/new?http://localhost:5173', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let msgId = 1;
  const callbacks = new Map();
  function send(method, params = {}) {
    return new Promise(resolve => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }
  ws.onmessage = e => {
    const d = JSON.parse(e.data);
    if (d.id && callbacks.has(d.id)) {
      callbacks.get(d.id)(d.result);
      callbacks.delete(d.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await new Promise(r => setTimeout(r, 2000));

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  const tabExists = await evalJs('!!document.getElementById("tab-caregiver-cues")');
  console.log('tab-caregiver-cues exists before click:', tabExists);

  const tabOuter = await evalJs('document.getElementById("tab-caregiver-cues")?.outerHTML');
  console.log('tab-caregiver-cues outerHTML:', tabOuter);

  await evalJs('document.getElementById("tab-caregiver-cues")?.click()');
  await new Promise(r => setTimeout(r, 500));

  const insightsExists = await evalJs('!!document.getElementById("cue-insights-card")');
  console.log('cue-insights-card exists after click:', insightsExists);

  const bodyTextSnippet = await evalJs('document.body.innerText.slice(0, 300)');
  console.log('bodyTextSnippet:', bodyTextSnippet);

  try { chromeProcess.kill('SIGINT'); } catch(e){}
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  try { chromeProcess.kill('SIGINT'); } catch(_){}
  process.exit(1);
});
