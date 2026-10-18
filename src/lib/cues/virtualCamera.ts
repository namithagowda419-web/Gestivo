// Interactive Virtual Demo Camera Stream Generator
// Generates a live HTML5 MediaStream with animated face expressions (smiling, looking around, head tilting)
// and hand gestures (pointing, waving, clapping) for testing cue detection when a physical webcam is unavailable.

export interface VirtualCameraSession {
  stream: MediaStream;
  stop: () => void;
  triggerGesture: (type: 'smile' | 'point' | 'wave' | 'head_nod' | 'turn_away' | 'hand_mouth') => void;
}

export function createVirtualCameraStream(): VirtualCameraSession {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let isRunning = true;
  let rafId: number | null = null;
  let activeGesture: string | null = null;
  let gestureStartTime = 0;

  const triggerGesture = (type: 'smile' | 'point' | 'wave' | 'head_nod' | 'turn_away' | 'hand_mouth') => {
    activeGesture = type;
    gestureStartTime = performance.now();
  };

  const drawFrame = (time: number) => {
    if (!isRunning || !ctx) return;

    // Check if gesture expired after 3.5s
    if (activeGesture && time - gestureStartTime > 3500) {
      activeGesture = null;
    }

    const t = time / 1000;

    // 1. Background (gentle enchanted gradient)
    const bgGradient = ctx.createLinearGradient(0, 0, 640, 480);
    bgGradient.addColorStop(0, '#1a103c');
    bgGradient.addColorStop(0.5, '#281754');
    bgGradient.addColorStop(1, '#12072b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 640, 480);

    // Grid dots in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    for (let x = 40; x < 640; x += 60) {
      for (let y = 40; y < 480; y += 60) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Badge: "Virtual Camera Mode"
    ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
    ctx.strokeStyle = 'rgba(216, 180, 254, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(16, 16, 210, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 12px Nunito, sans-serif';
    ctx.fillText('✨ Virtual Demo Camera Active', 28, 36);

    // 2. Animated Head Coordinates & Orientation
    let headYawAngle = Math.sin(t * 0.8) * 0.08;
    let headPitchAngle = Math.cos(t * 1.2) * 0.06;
    let headRollAngle = Math.sin(t * 0.5) * 0.04;

    let smileAmount = 0.35 + Math.sin(t * 1.5) * 0.2; // 0.15 - 0.55
    let isPointing = false;
    let isWaving = false;
    let handToMouth = false;

    if (activeGesture === 'smile') {
      smileAmount = 0.85;
    } else if (activeGesture === 'point') {
      isPointing = true;
      smileAmount = 0.5;
    } else if (activeGesture === 'wave') {
      isWaving = true;
      smileAmount = 0.75;
    } else if (activeGesture === 'turn_away') {
      headYawAngle = 0.45; // Turn head strongly
      smileAmount = 0.1;
    } else if (activeGesture === 'head_nod') {
      headPitchAngle = Math.sin(t * 8) * 0.18; // Fast nod
      smileAmount = 0.6;
    } else if (activeGesture === 'hand_mouth') {
      handToMouth = true;
      smileAmount = 0.3;
    }

    const headCenterX = 320 + Math.sin(t * 0.7) * 12;
    const headCenterY = 220 + Math.cos(t * 0.9) * 8 + headPitchAngle * 30;

    ctx.save();
    ctx.translate(headCenterX, headCenterY);
    ctx.rotate(headRollAngle);

    // Torso / Shoulders
    ctx.fillStyle = '#6d28d9';
    ctx.beginPath();
    ctx.moveTo(-110, 160);
    ctx.quadraticCurveTo(0, 110, 110, 160);
    ctx.lineTo(130, 260);
    ctx.lineTo(-130, 260);
    ctx.closePath();
    ctx.fill();

    // Neck
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(-22, 70, 44, 40);

    // Head base (Skin)
    ctx.fillStyle = '#fce7f3';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(headYawAngle * 25, 0, 75, 85, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hair
    ctx.fillStyle = '#581c87';
    ctx.beginPath();
    ctx.arc(headYawAngle * 25, -25, 82, Math.PI, 2 * Math.PI);
    ctx.quadraticCurveTo(headYawAngle * 25 + 85, 30, headYawAngle * 25 + 75, 50);
    ctx.quadraticCurveTo(headYawAngle * 25, -20, headYawAngle * 25 - 75, 50);
    ctx.closePath();
    ctx.fill();

    // Eyes (with natural blink cycle)
    const isBlinking = Math.sin(t * 2.5) > 0.96;
    const eyeOffsetX = headYawAngle * 18;

    ctx.fillStyle = '#1e1b4b';
    if (isBlinking) {
      // Closed curved line
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#312e81';
      ctx.beginPath();
      ctx.arc(-26 + eyeOffsetX, -5, 10, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(26 + eyeOffsetX, -5, 10, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    } else {
      // Big friendly child eyes
      ctx.beginPath();
      ctx.ellipse(-26 + eyeOffsetX, -5, 11, 14, 0, 0, 2 * Math.PI);
      ctx.ellipse(26 + eyeOffsetX, -5, 11, 14, 0, 0, 2 * Math.PI);
      ctx.fill();

      // Eye highlight sparkle
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-23 + eyeOffsetX, -9, 4, 0, 2 * Math.PI);
      ctx.arc(29 + eyeOffsetX, -9, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Cheeks (cute blush)
    ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-42 + eyeOffsetX, 22, 14, 8, 0, 0, 2 * Math.PI);
    ctx.ellipse(42 + eyeOffsetX, 22, 14, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(eyeOffsetX, 18, 4.5, 0, 2 * Math.PI);
    ctx.fill();

    // Smile / Mouth (dynamically curves with smileAmount)
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const mouthW = 20 + smileAmount * 16;
    const mouthH = smileAmount * 18;
    ctx.moveTo(-mouthW / 2 + eyeOffsetX, 44);
    ctx.quadraticCurveTo(eyeOffsetX, 44 + mouthH, mouthW / 2 + eyeOffsetX, 44);
    ctx.stroke();

    ctx.restore();

    // 3. Hands (Pointing, Waving, Hand-to-Mouth, or Rest)
    ctx.save();
    ctx.fillStyle = '#fce7f3';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;

    if (isPointing) {
      // Pointing forward toward camera
      const px = 280 + Math.sin(t * 4) * 8;
      const py = 260 + Math.cos(t * 3) * 6;
      ctx.beginPath();
      // Palm
      ctx.arc(px, py, 26, 0, 2 * Math.PI);
      ctx.fill();
      // Pointing index finger extended toward center
      ctx.beginPath();
      ctx.roundRect(px - 6, py - 48, 14, 46, 7);
      ctx.fill();
      ctx.stroke();
    } else if (isWaving) {
      // Waving hand
      const waveAngle = Math.sin(t * 12) * 0.35;
      const wx = 460;
      const wy = 230;
      ctx.translate(wx, wy);
      ctx.rotate(waveAngle);
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 32, 0, 0, 2 * Math.PI);
      ctx.fill();
      // 4 fingers
      for (let i = -12; i <= 12; i += 8) {
        ctx.beginPath();
        ctx.roundRect(i - 3, -42, 7, 24, 4);
        ctx.fill();
      }
    } else if (handToMouth) {
      // Hand near mouth
      const mx = headCenterX - 10;
      const my = headCenterY + 45;
      ctx.beginPath();
      ctx.arc(mx, my, 22, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else {
      // Gentle natural resting hands at bottom corners
      const h1x = 180 + Math.sin(t * 1.5) * 6;
      const h1y = 420;
      const h2x = 460 + Math.cos(t * 1.5) * 6;
      const h2y = 420;

      ctx.beginPath();
      ctx.arc(h1x, h1y, 28, 0, 2 * Math.PI);
      ctx.arc(h2x, h2y, 28, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();

    rafId = requestAnimationFrame(drawFrame);
  };

  rafId = requestAnimationFrame(drawFrame);

  // Capture 30fps MediaStream from canvas
  const stream: MediaStream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : (canvas as any).mozCaptureStream(30);

  const stop = () => {
    isRunning = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {}
    });
  };

  return {
    stream,
    stop,
    triggerGesture,
  };
}
