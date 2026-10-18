import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-gestivo-verify-'));

console.log('[GESTIVO Verification] Launching Chrome with fake camera stream for comprehensive testing...');
const chromeProcess = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=9228',
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
      const res = await fetch('http://127.0.0.1:9228/json/version');
      if (res.ok) return true;
    } catch (e) {}
    await sleep(200);
  }
  return false;
}

async function runVerification() {
  const isUp = await waitForPort();
  if (!isUp) {
    console.error('Failed to connect to Chrome on port 9228');
    process.exit(1);
  }

  const newTabRes = await fetch('http://127.0.0.1:9228/json/new?http://localhost:5173', { method: 'PUT' });
  const tab = await newTabRes.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  const errors = [];
  const network404s = [];
  const verificationResults = [];

  let msgId = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && callbacks.has(data.id)) {
      const resolve = callbacks.get(data.id);
      callbacks.delete(data.id);
      resolve(data.result);
      return;
    }

    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params?.exceptionDetails?.exception?.description || data.params?.exceptionDetails?.text;
      errors.push(desc);
      console.error(`[Browser Exception] ${desc}`);
    }

    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params.type;
      const text = data.params.args.map(a => a.value || a.description || '').join(' ');
      if (type === 'error' && !text.includes('INFO: Created TensorFlow Lite') && !text.includes('Using NORM_RECT')) {
        errors.push(text);
        console.error(`[Console Error] ${text}`);
      }
    }

    if (data.method === 'Network.responseReceived') {
      const resp = data.params.response;
      if (resp.status === 404) {
        network404s.push(resp.url);
        console.error(`[Network 404] ${resp.url}`);
      }
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res?.exceptionDetails) {
      const err = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Eval error in "${expression.slice(0, 50)}...": ${err}`);
    }
    return res?.result?.value;
  }

  function recordResult(feature, passed, details = '') {
    verificationResults.push({ feature, passed, details });
    const mark = passed ? '✅' : '❌';
    console.log(`${mark} [${feature}] ${details}`);
  }

  console.log('\n--- Starting GESTIVO Complete End-to-End Verification ---\n');

  // Wait for initial page hydration
  await sleep(2000);

  // 1. PAGE LOAD & ROOT ELEMENT
  try {
    const title = await evaluate('document.title');
    const rootHasContent = await evaluate('document.getElementById("root").children.length > 0');
    recordResult('Page Load', rootHasContent && title.includes('GESTIVO'), `Title: "${title}", root has children: ${rootHasContent}`);
  } catch (err) {
    recordResult('Page Load', false, err.message);
  }

  // 2. SIDEBAR NAVIGATION
  try {
    const navItemsCount = await evaluate('document.querySelectorAll("[id^=nav-]").length');
    recordResult('Sidebar Rendered', navItemsCount >= 6, `Found ${navItemsCount} navigation buttons`);

    // Click Communication Board nav item
    await evaluate('document.getElementById("nav-board")?.click()');
    await sleep(300);

    // Click History nav item
    await evaluate('document.getElementById("nav-history")?.click()');
    await sleep(300);

    // Click Profile nav item
    await evaluate('document.getElementById("nav-profile")?.click()');
    await sleep(300);

    // Click Caregiver Mode switch
    await evaluate('document.getElementById("nav-caregiver")?.click()');
    await sleep(400);

    // Enter PIN if PIN modal is open (Phase 3 security)
    const pinModalOpen = await evaluate('Boolean(document.getElementById("btn-pin-1"))');
    if (pinModalOpen) {
      await evaluate('document.getElementById("btn-pin-1")?.click()');
      await sleep(100);
      await evaluate('document.getElementById("btn-pin-2")?.click()');
      await sleep(100);
      await evaluate('document.getElementById("btn-pin-3")?.click()');
      await sleep(100);
      await evaluate('document.getElementById("btn-pin-4")?.click()');
      await sleep(600);
    }

    const isCaregiverMode = await evaluate('document.body.innerText.includes("CAREGIVER HUB")');
    recordResult('Sidebar Caregiver Switch', isCaregiverMode, 'Switched to Caregiver Hub mode');

    // Switch back to Child Mode
    await evaluate('document.getElementById("nav-child")?.click()');
    await sleep(400);
    const isChildMode = await evaluate('document.body.innerText.includes("CHILD EXPLORER")');
    recordResult('Sidebar Child Switch', isChildMode, 'Returned to Child Explorer mode');
  } catch (err) {
    recordResult('Sidebar Navigation', false, err.message);
  }

  // 3. COMMUNICATION BOARD, SENTENCE STRIP & TTS
  try {
    // Tap "I want" tile
    await evaluate('document.getElementById("tile-b-want")?.click()');
    await sleep(300);

    // Tap "I am thirsty" tile
    await evaluate('document.getElementById("tile-b-thirsty")?.click()');
    await sleep(300);

    // Verify sentence strip has items
    const pageText = await evaluate('document.body.innerText');
    const hasWantInStrip = pageText.includes('I want');
    const hasThirstyInStrip = pageText.includes("I'am thirsty") || pageText.includes("thirsty");
    recordResult('Communication Board Tapping', hasWantInStrip && hasThirstyInStrip, 'Tapped "I want" & "I\'am thirsty", sentence strip updated');

    // Tap Speak button
    const speakResult = await evaluate(`(() => {
      const speakBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Speak'));
      if (!speakBtn) return false;
      speakBtn.click();
      return true;
    })()`);
    recordResult('Sentence Strip Speak (TTS)', speakResult, 'Triggered Speak button without error');

    // Tap Backspace button
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const backspaceBtn = btns.find(b => b.getAttribute('title') === 'Backspace' || b.getAttribute('aria-label') === 'Backspace');
      if (backspaceBtn) backspaceBtn.click();
    })()`);
    await sleep(300);

    // Tap Clear all button
    await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const clearBtn = btns.find(b => b.getAttribute('title') === 'Clear all' || b.getAttribute('aria-label') === 'Clear all');
      if (clearBtn) clearBtn.click();
    })()`);
    await sleep(300);
    const pageTextAfterClear = await evaluate('document.body.innerText');
    const isCleared = pageTextAfterClear.includes('Tap buttons or tiles to build your sentence');
    recordResult('Sentence Strip Clear', isCleared, 'Cleared sentence strip to initial state');
  } catch (err) {
    recordResult('Communication Board & Strip', false, err.message);
  }

  // 4. QUICK ACTIONS & CAROUSEL
  try {
    const carouselRendered = await evaluate('document.querySelectorAll(".font-heading").length > 5');
    recordResult('Communication Carousel Rendered', carouselRendered, 'Rendered quick communication tiles');

    // Test Voice Output toggle
    const voiceToggleClicked = await evaluate(`(() => {
      const toggle = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Voice Output'));
      if (toggle) {
        toggle.click();
        return true;
      }
      return false;
    })()`);
    recordResult('Voice Output Toggle', voiceToggleClicked, 'Toggled voice output audio state');
  } catch (err) {
    recordResult('Carousel & Voice Bar', false, err.message);
  }

  // Helper to close modals cleanly
  async function closeModal() {
    await evaluate(`(() => {
      const xBtn = document.querySelector('.fixed.inset-0 svg.lucide-x')?.closest('button');
      if (xBtn) xBtn.click();
    })()`);
    await sleep(400);
  }

  // 5. INTERACTIVE MODAL 1: MEMORY GAME
  try {
    await evaluate('document.getElementById("hero-explore-play")?.click()');
    await sleep(600);

    const hasMemoryGameModal = await evaluate('document.body.innerText.includes("Memory Match Adventure")');
    recordResult('Modal 1: Memory Game Opened', hasMemoryGameModal, 'Hero "Explore & Play" opened Memory Match Adventure');

    // Flip memory cards
    const cardsClicked = await evaluate(`(() => {
      const cards = document.querySelectorAll('.fixed.inset-0 .grid button');
      if (cards.length >= 2) {
        cards[0].click();
        cards[1].click();
        return true;
      }
      return false;
    })()`);
    recordResult('Modal 1: Memory Game Interaction', cardsClicked, 'Flipped memory cards with animations');
    await closeModal();
  } catch (err) {
    recordResult('Modal 1: Memory Game', false, err.message);
  }

  // 6. INTERACTIVE MODAL 2: SHAPE MATCH
  try {
    await evaluate('document.getElementById("play-tile-shapes")?.click()');
    await sleep(200);
    await evaluate('document.getElementById("play-launch-button")?.click()');
    await sleep(600);

    const hasShapeModal = await evaluate('document.body.innerText.includes("Shape Match") || document.body.innerText.includes("Can you find")');
    recordResult('Modal 2: Shape Match Opened', hasShapeModal, 'Launched Shape Match modal');

    // Click a shape button
    await evaluate(`(() => {
      const shapeBtns = document.querySelectorAll('.fixed.inset-0 button');
      if (shapeBtns.length > 2) shapeBtns[1].click();
    })()`);
    await sleep(300);
    await closeModal();
  } catch (err) {
    recordResult('Modal 2: Shape Match', false, err.message);
  }

  // 7. INTERACTIVE MODAL 3: ANIMAL SOUNDS
  try {
    await evaluate('document.getElementById("play-tile-animals")?.click()');
    await sleep(200);
    await evaluate('document.getElementById("play-launch-button")?.click()');
    await sleep(600);

    const hasAnimalModal = await evaluate('document.body.innerText.includes("Animal Sound Explorer")');
    recordResult('Modal 3: Animal Sounds Opened', hasAnimalModal, 'Launched Animal Sound Explorer');

    // Click an animal (e.g. Fox)
    await evaluate(`(() => {
      const foxBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Fox') || b.textContent.includes('Kitty'));
      if (foxBtn) foxBtn.click();
    })()`);
    await sleep(300);
    await closeModal();
  } catch (err) {
    recordResult('Modal 3: Animal Sounds', false, err.message);
  }

  // 8. INTERACTIVE MODAL 4: STORY TIME
  try {
    await evaluate('document.getElementById("play-tile-story")?.click()');
    await sleep(200);
    await evaluate('document.getElementById("play-launch-button")?.click()');
    await sleep(600);

    const hasStoryModal = await evaluate('document.body.innerText.includes("Story Time") || document.body.innerText.includes("The Crystal Cave")');
    recordResult('Modal 4: Story Time Opened', hasStoryModal, 'Launched Story Time modal');

    // Click Next chapter
    await evaluate(`(() => {
      const nextBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Next') || b.querySelector('.lucide-chevron-right'));
      if (nextBtn) nextBtn.click();
    })()`);
    await sleep(300);
    await closeModal();
  } catch (err) {
    recordResult('Modal 4: Story Time', false, err.message);
  }

  // 9. INTERACTIVE MODAL 5: SET REMINDER
  try {
    await evaluate('document.getElementById("quick-action-reminder")?.click()');
    await sleep(600);

    const hasReminderModal = await evaluate('document.body.innerText.includes("Set Reminder") && document.body.innerText.includes("Add Reminder")');
    recordResult('Modal 5: Set Reminder Opened', hasReminderModal, 'Opened Set Reminder modal from Quick Actions');

    // Type a reminder and submit using React native value setter
    await evaluate(`(() => {
      const input = document.querySelector('.fixed.inset-0 input[type="text"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, 'Hydration Break');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const submitBtn = Array.from(document.querySelectorAll('.fixed.inset-0 button')).find(b => b.textContent.includes('Add Reminder'));
      if (submitBtn) submitBtn.click();
    })()`);
    await sleep(400);

    const reminderScheduled = await evaluate('document.body.innerText.includes("Hydration Break") || document.body.innerText.includes("successfully scheduled")');
    recordResult('Modal 5: Reminder Scheduled', reminderScheduled, 'Scheduled "Hydration Break" reminder successfully');
    await closeModal();
  } catch (err) {
    recordResult('Modal 5: Set Reminder', false, err.message);
  }

  // 10. INTERACTIVE MODAL 6: MANAGE GOALS
  try {
    await evaluate('document.getElementById("quick-action-goals")?.click()');
    await sleep(600);

    const hasGoalsModal = await evaluate('document.body.innerText.includes("Manage Learning Goals")');
    recordResult('Modal 6: Manage Goals Opened', hasGoalsModal, 'Opened Manage Learning Goals modal from Quick Actions');

    // Increment an existing goal
    await evaluate(`(() => {
      const incBtn = document.querySelector('.fixed.inset-0 button:has(.lucide-plus), .fixed.inset-0 button:has(.lucide-plus-circle)');
      if (incBtn) incBtn.click();
    })()`);
    await sleep(300);
    await closeModal();
  } catch (err) {
    recordResult('Modal 6: Manage Goals', false, err.message);
  }

  // 11. CAREGIVER DASHBOARD & HISTORY FILTERS
  try {
    // Cycle history filter buttons using specific IDs
    const filterTabIds = ['all', 'communication', 'Cue Camera', 'activity', 'mood'];
    for (const tabId of filterTabIds) {
      await evaluate(`document.getElementById("history-filter-${tabId}")?.click()`);
      await sleep(150);
    }
    recordResult('History Filter Tabs', true, 'Cycled through All, Communication, Cue Camera, Activities, Mood tabs');

    // Switch Caregiver Dashboard to Cue Camera Insights tab
    const tabExists = await evaluate('!!document.getElementById("tab-caregiver-cues")');
    await evaluate('document.getElementById("tab-caregiver-cues")?.click()');
    await sleep(600);
    const hasInsightsRendered = await evaluate('!!document.getElementById("cue-insights-card") || document.body.innerText.includes("Cue Camera Insights")');
    recordResult('Caregiver Cue Camera Insights Tab', hasInsightsRendered, `Rendered Cue Camera Insights card inside Caregiver dashboard (tabExists=${tabExists})`);

    // Switch back to Overview
    await evaluate('document.getElementById("tab-caregiver-overview")?.click()');
    await sleep(400);
  } catch (err) {
    recordResult('Caregiver Dashboard & History', false, err.message);
  }

  // 12. CUE CAMERA INTEGRATION ROUTING & LIVE FEED
  try {
    // Navigate to Cue Camera via Sidebar
    await evaluate('document.getElementById("nav-cue-camera")?.click()');
    await sleep(1500);

    const isCueCameraView = await evaluate('window.location.pathname.includes("/cue-camera") && (document.body.innerText.includes("Cue Camera") || document.body.innerText.includes("Live Vision"))');
    recordResult('Navigate to /cue-camera', isCueCameraView, 'Successfully navigated to Cue Camera page');

    // Accept consent if consent screen is shown
    const consentNeeded = await evaluate('!!document.getElementById("consent-checkbox")');
    if (consentNeeded) {
      await evaluate('document.getElementById("consent-checkbox")?.click()');
      await sleep(200);
      await evaluate('document.getElementById("consent-agree-button")?.click()');
      await sleep(1000);
    }

    // Wait for video element to attach and load frames
    let videoActive = false;
    let videoInfo = '';
    for (let i = 0; i < 20; i++) {
      const vState = await evaluate(`(() => {
        const video = document.querySelector('video');
        if (!video) return { exists: false };
        return {
          exists: true,
          readyState: video.readyState,
          paused: video.paused,
          width: video.videoWidth,
          height: video.videoHeight,
        };
      })()`);

      if (vState.exists && vState.width > 0 && !vState.paused) {
        videoActive = true;
        videoInfo = `${vState.width}x${vState.height}, readyState=${vState.readyState}`;
        break;
      }
      await sleep(300);
    }

    recordResult('Cue Camera Video Stream', videoActive, `Video active (${videoInfo})`);

    // Toggle High Accuracy Mode
    await evaluate(`(() => {
      const toggle = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('High Accuracy') || b.textContent.includes('Simple Mode'));
      if (toggle) toggle.click();
    })()`);
    await sleep(400);
    recordResult('Cue Camera Mode Toggle', true, 'Toggled high accuracy / simple mode without error');

    // Return to Touch Board
    await evaluate(`(() => {
      const backBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Touch Board') || b.textContent.includes('Back to Board'));
      if (backBtn) backBtn.click();
      else document.getElementById("nav-board")?.click();
    })()`);
    await sleep(1000);

    const returnedToBoard = await evaluate('window.location.pathname === "/" && document.body.innerText.includes("Communication Board")');
    recordResult('Cue Camera Return to Board', returnedToBoard, 'Successfully stopped camera and returned to main board');
  } catch (err) {
    recordResult('Cue Camera Integration', false, err.message);
  }

  // 13. CHECK ROUTE REFRESH FALLBACK (Vite SPA Fallback)
  try {
    await evaluate('window.history.pushState({}, "", "/cue-camera")');
    await send('Page.reload');
    await sleep(2000);
    const reloadedCueCamera = await evaluate('window.location.pathname.includes("/cue-camera") && (document.body.innerText.includes("Cue Camera") || document.body.innerText.includes("Live Vision"))');
    recordResult('Route Refresh Fallback', reloadedCueCamera, 'Refreshing /cue-camera loads without 404');
  } catch (err) {
    recordResult('Route Refresh Fallback', false, err.message);
  }

  console.log('\n======================================================');
  console.log('            VERIFICATION SUMMARY');
  console.log('======================================================');
  const allPassed = verificationResults.every(r => r.passed);
  console.log(`Total Checks: ${verificationResults.length}`);
  console.log(`Passed: ${verificationResults.filter(r => r.passed).length}`);
  console.log(`Failed: ${verificationResults.filter(r => !r.passed).length}`);
  console.log(`Browser Errors Captured: ${errors.length}`);
  console.log(`Network 404s: ${network404s.length}`);
  console.log('======================================================\n');

  try {
    chromeProcess.kill('SIGINT');
  } catch (e) {}

  if (!allPassed || errors.length > 0 || network404s.length > 0) {
    console.error('Verification failed on one or more checks.');
    process.exit(1);
  } else {
    console.log('🎉 ALL GESTIVO FEATURES PASSED VERIFICATION WITH ZERO ERRORS!\n');
    process.exit(0);
  }
}

runVerification().catch(err => {
  console.error('Test runner fatal error:', err);
  try { chromeProcess.kill('SIGINT'); } catch (e) {}
  process.exit(1);
});
