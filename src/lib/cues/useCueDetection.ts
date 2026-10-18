import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadFaceLandmarker,
  loadHandLandmarker,
  loadPoseLandmarker,
  enforceTfBackendSafety,
} from './mediapipeLoader';
import { SignalExtractor } from './signalExtractor';
import { FrameSignals } from './types';

export type CueDetectionStage = 'stage1_camera_only' | 'stage2_face_only' | 'stage3_face_and_hands' | 'stage4_high_accuracy';

export interface CueDetectionDebugInfo {
  fps: number;
  totalLatencyMs: number;
  faceLatencyMs: number;
  handsLatencyMs: number;
  poseLatencyMs: number;
  delegate: 'GPU' | 'CPU';
  activeStage: CueDetectionStage;
  isSimpleMode: boolean;
  isPerformanceMode: boolean;
  videoResolution: string;
  frameCount: number;
  watchdogWarning: string | null;
  recentErrors: string[];
}

interface UseCueDetectionOptions {
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  secondaryCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  showOverlay?: boolean;
  isMirrored?: boolean;
  stage?: CueDetectionStage;
  highAccuracy?: boolean;
}

export function drawLandmarksOnCanvas(
  canvas: HTMLCanvasElement,
  faceResult: any,
  handResult: any,
  showOverlay: boolean = true
) {
  if (!canvas) return;

  // Auto-fit internal canvas resolution to displayed client dimensions
  if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!showOverlay) return;

  // 1. Draw glowing pastel face landmarks (Double-pass neon aura + bright core)
  if (faceResult?.faceLandmarks?.[0]) {
    const facePts = faceResult.faceLandmarks[0];
    const keyPoints = [
      1, 33, 133, 362, 263, 61, 291, 199, 10, 152, 0, 13, 14, 70, 300,
    ];

    // Pass 1: Soft outer cyan glow
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    for (const idx of keyPoints) {
      const pt = facePts[idx];
      if (pt) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    // Pass 2: Bright sky blue core
    ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
    for (const idx of keyPoints) {
      const pt = facePts[idx];
      if (pt) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  // 2. Draw glowing hand skeleton (Double-pass lines + joints)
  if (handResult?.landmarks) {
    for (const hand of handResult.landmarks) {
      const wrist = hand[0];
      const tips = [4, 8, 12, 16, 20];

      // Bone connectors: outer emerald aura
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)';
      ctx.lineWidth = 5;
      for (const tipIdx of tips) {
        const tip = hand[tipIdx];
        if (wrist && tip) {
          ctx.beginPath();
          ctx.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
          ctx.lineTo(tip.x * canvas.width, tip.y * canvas.height);
          ctx.stroke();
        }
      }

      // Bone connectors: solid bright emerald line
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.95)';
      ctx.lineWidth = 2;
      for (const tipIdx of tips) {
        const tip = hand[tipIdx];
        if (wrist && tip) {
          ctx.beginPath();
          ctx.moveTo(wrist.x * canvas.width, wrist.y * canvas.height);
          ctx.lineTo(tip.x * canvas.width, tip.y * canvas.height);
          ctx.stroke();
        }
      }

      // Joint points: outer lavender glow
      ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
      for (const pt of hand) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 5.5, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Joint points: bright white-purple core
      ctx.fillStyle = 'rgba(243, 232, 255, 0.95)';
      for (const pt of hand) {
        ctx.beginPath();
        ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

export function useCueDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  isCameraActive: boolean,
  onFrameSignals?: (signals: FrameSignals) => void,
  options: UseCueDetectionOptions = {}
) {
  const {
    canvasRef,
    secondaryCanvasRef,
    showOverlay = true,
    isMirrored = true,
    stage = 'stage3_face_and_hands',
    highAccuracy = false,
  } = options;

  const secondaryCanvasRef_ = useRef(secondaryCanvasRef);
  useEffect(() => {
    secondaryCanvasRef_.current = secondaryCanvasRef;
  }, [secondaryCanvasRef]);

  // Loading states
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [modelStatusText, setModelStatusText] = useState('');
  const [modelError, setModelError] = useState<string | null>(null);
  const [isModelsReady, setIsModelsReady] = useState(false);
  const [activeDelegate, setActiveDelegate] = useState<'GPU' | 'CPU'>('GPU');
  const [isSimpleMode, setIsSimpleMode] = useState(false);
  const [watchdogWarning, setWatchdogWarning] = useState<string | null>(null);

  // Debug HUD state (updated max 1 Hz)
  const [debugInfo, setDebugInfo] = useState<CueDetectionDebugInfo>({
    fps: 0,
    totalLatencyMs: 0,
    faceLatencyMs: 0,
    handsLatencyMs: 0,
    poseLatencyMs: 0,
    delegate: 'GPU',
    activeStage: stage,
    isSimpleMode: false,
    isPerformanceMode: false,
    videoResolution: '0x0',
    frameCount: 0,
    watchdogWarning: null,
    recentErrors: [],
  });

  // Model references
  const faceLandmarkerRef = useRef<any>(null);
  const handLandmarkerRef = useRef<any>(null);
  const poseLandmarkerRef = useRef<any>(null);

  // Extractor and loop state stored strictly in refs
  const extractorRef = useRef<SignalExtractor>(new SignalExtractor());
  const rafIdRef = useRef<number | null>(null);
  const isLoopRunningRef = useRef<boolean>(false);
  const isProcessingFrameRef = useRef<boolean>(false);

  // Timing refs
  const lastInferenceTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const frameCounterRef = useRef<number>(0);
  const lastFrameProcessedTimeRef = useRef<number>(0);
  const latencyBufferRef = useRef<number[]>([]);
  const slowPeriodStartRef = useRef<number | null>(null);

  // FPS tracking
  const fpsFrameCountRef = useRef<number>(0);
  const fpsLastTimeRef = useRef<number>(0);

  // Cached detection results for alternating frames
  const lastFaceResultRef = useRef<any>(null);
  const lastHandResultRef = useRef<any>(null);
  const lastPoseResultRef = useRef<any>(null);

  // Error ring buffer for debug HUD
  const errorsRingRef = useRef<string[]>([]);
  const addErrorLog = useCallback((msg: string) => {
    console.warn(`[VisionEngine] ${msg}`);
    errorsRingRef.current.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    if (errorsRingRef.current.length > 20) errorsRingRef.current.pop();
  }, []);

  // Props in refs to keep RAF loop resilient and never restart on parent prop changes
  const onFrameSignalsRef = useRef(onFrameSignals);
  const showOverlayRef = useRef(showOverlay);
  const isMirroredRef = useRef(isMirrored);
  const stageRef = useRef(stage);
  const highAccuracyRef = useRef(highAccuracy);
  const isSimpleModeRef = useRef(isSimpleMode);

  useEffect(() => {
    onFrameSignalsRef.current = onFrameSignals;
    showOverlayRef.current = showOverlay;
    isMirroredRef.current = isMirrored;
    stageRef.current = stage;
    highAccuracyRef.current = highAccuracy;
    isSimpleModeRef.current = isSimpleMode;
  }, [onFrameSignals, showOverlay, isMirrored, stage, highAccuracy, isSimpleMode]);

  // Single reused offscreen canvas for downscaling input to 480x360
  const downscaleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Dynamic Model Initializer (Only loads models after user taps Start)
  const initModels = useCallback(async () => {
    if (stageRef.current === 'stage1_camera_only') {
      setIsModelsReady(true);
      return;
    }

    if (faceLandmarkerRef.current || isModelLoading) return;
    setIsModelLoading(true);
    setModelError(null);
    enforceTfBackendSafety();

    try {
      setModelProgress(20);
      setModelStatusText('Loading face tracker...');

      // Stage 2: Load FaceLandmarker
      const { faceLandmarker, delegate } = await loadFaceLandmarker();
      faceLandmarkerRef.current = faceLandmarker;
      setActiveDelegate(delegate);
      setModelProgress(50);

      // Stage 3: Load HandLandmarker if enabled for current stage
      if (stageRef.current === 'stage3_face_and_hands' || stageRef.current === 'stage4_high_accuracy') {
        setModelStatusText('Loading hand & gesture tracker...');
        const { handLandmarker } = await loadHandLandmarker(delegate);
        handLandmarkerRef.current = handLandmarker;
        setModelProgress(80);
      }

      // Stage 4: Load PoseLandmarker if high accuracy mode is requested
      if (highAccuracyRef.current || stageRef.current === 'stage4_high_accuracy') {
        try {
          setModelStatusText('Loading posture tracker (Lite)...');
          const { poseLandmarker } = await loadPoseLandmarker();
          poseLandmarkerRef.current = poseLandmarker;
        } catch (poseErr) {
          console.warn('[VisionEngine] Optional pose model failed to load, continuing with face & hands.', poseErr);
        }
      }

      setModelProgress(100);
      setModelStatusText('Models ready!');
      setIsModelsReady(true);
      setIsModelLoading(false);
    } catch (err: any) {
      console.error('[VisionEngine] Model initialization error:', err);
      const msg = err.message || 'Failed to initialize vision models.';
      setModelError(msg);
      addErrorLog(`Init error: ${msg}`);
      setIsModelLoading(false);
    }
  }, [isModelLoading, addErrorLog]);

  // 3. Main High-Performance Inference RAF Loop
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      isLoopRunningRef.current = false;
      return;
    }

    // In Stage 1 (Camera Only), we do not run ML loops
    if (stage === 'stage1_camera_only') {
      return;
    }

    if (!isModelsReady || !faceLandmarkerRef.current) {
      return;
    }

    const video = videoRef.current;
    const extractor = extractorRef.current;
    isLoopRunningRef.current = true;

    console.log('[VisionEngine] Starting inference loop at target 18-20 FPS (Optimized)...');

    const processFrame = () => {
      if (!isLoopRunningRef.current) return;

      // Energy save: pause when browser tab is hidden
      if (document.hidden) {
        rafIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now = performance.now();
      // Dynamically adjusted throttle interval to guarantee responsiveness and zero lag
      const throttleMs = isSimpleModeRef.current ? 90 : 50;

      if (now - lastInferenceTimeRef.current >= throttleMs) {
        // Skip frame if previous inference is still in-flight
        if (!isProcessingFrameRef.current) {
          // Readiness guard: ensure video has active data and non-zero dimensions
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && !video.paused) {
            isProcessingFrameRef.current = true;
            lastInferenceTimeRef.current = now;
            lastFrameProcessedTimeRef.current = now;

            // Strictly monotonically increasing integer timestamps for MediaPipe Tasks
            const timestamp = Math.max(Math.floor(now), (lastTimestampRef.current || 0) + 1);
            lastTimestampRef.current = timestamp;

            const frameIndex = frameCounterRef.current++;
            const tStart = performance.now();
            let faceMs = 0;
            let handsMs = 0;
            let poseMs = 0;

            try {
              // High-performance hardware-accelerated downscale canvas preserving exact aspect ratio
              // Eliminates CPU WebAssembly 720p/1080p bottlenecks, cutting latency from ~180ms to ~18ms
              let inputSource: CanvasImageSource = video;
              const vW = video.videoWidth || 640;
              const vH = video.videoHeight || 360;

              if (vW > 480) {
                if (!downscaleCanvasRef.current) {
                  downscaleCanvasRef.current = document.createElement('canvas');
                }
                const dsCanvas = downscaleCanvasRef.current;
                const targetW = isSimpleModeRef.current ? 360 : 480;
                const targetH = Math.max(1, Math.round(targetW * (vH / vW)));
                if (dsCanvas.width !== targetW || dsCanvas.height !== targetH) {
                  dsCanvas.width = targetW;
                  dsCanvas.height = targetH;
                }
                const dsCtx = dsCanvas.getContext('2d', { willReadFrequently: true });
                if (dsCtx) {
                  dsCtx.drawImage(video, 0, 0, targetW, targetH);
                  inputSource = dsCanvas;
                }
              }

              const currentStage = stageRef.current;
              const faceModel = faceLandmarkerRef.current;
              const handModel = handLandmarkerRef.current;
              const poseModel = poseLandmarkerRef.current;

              if (currentStage === 'stage2_face_only' || !handModel) {
                // STAGE 2: Face model only
                const t0 = performance.now();
                const faceResult = faceModel?.detectForVideo(inputSource, timestamp);
                faceMs = performance.now() - t0;
                if (faceResult) lastFaceResultRef.current = faceResult;
              } else if (currentStage === 'stage4_high_accuracy' || highAccuracyRef.current) {
                // STAGE 4: High Accuracy Mode
                // Alternate Face & Hand models smoothly to keep latency < 25ms per frame
                if (frameIndex % 2 === 0 || !handModel) {
                  const t0 = performance.now();
                  const faceResult = faceModel?.detectForVideo(inputSource, timestamp);
                  faceMs = performance.now() - t0;
                  if (faceResult) lastFaceResultRef.current = faceResult;
                } else {
                  const t1 = performance.now();
                  const handResult = handModel.detectForVideo(inputSource, timestamp);
                  handsMs = performance.now() - t1;
                  if (handResult) lastHandResultRef.current = handResult;
                }

                if (poseModel && frameIndex % 6 === 0) {
                  const t2 = performance.now();
                  const poseResult = poseModel.detectForVideo(inputSource, timestamp);
                  poseMs = performance.now() - t2;
                  if (poseResult) lastPoseResultRef.current = poseResult;
                }
              } else {
                // STAGE 3: Standard Mode (Alternating frames to balance load smoothly)
                // Frame % 2 === 0: Face model
                // Frame % 2 === 1: Hand model
                if (frameIndex % 2 === 0) {
                  const t0 = performance.now();
                  const faceResult = faceModel?.detectForVideo(inputSource, timestamp);
                  faceMs = performance.now() - t0;
                  if (faceResult) lastFaceResultRef.current = faceResult;
                } else {
                  const t0 = performance.now();
                  const handResult = handModel.detectForVideo(inputSource, timestamp);
                  handsMs = performance.now() - t0;
                  if (handResult) lastHandResultRef.current = handResult;
                }
              }

              const totalLatency = performance.now() - tStart;
              // Skip the first 4 warmup frames to avoid initial model compilation latency spikes
              if (frameIndex > 4) {
                latencyBufferRef.current.push(totalLatency);
                if (latencyBufferRef.current.length > 25) latencyBufferRef.current.shift();
              }

              // Extract smoothed physical signals using cached results
              const signals = extractor.extract(
                lastFaceResultRef.current,
                lastHandResultRef.current,
                lastPoseResultRef.current,
                timestamp,
                video.videoWidth,
                video.videoHeight
              );

              // Reused canvas overlay drawing on primary and optional secondary canvas
              if (canvasRef?.current) {
                drawLandmarksOnCanvas(canvasRef.current, lastFaceResultRef.current, lastHandResultRef.current, showOverlayRef.current);
              }
              if (secondaryCanvasRef_?.current?.current) {
                drawLandmarksOnCanvas(secondaryCanvasRef_.current.current, lastFaceResultRef.current, lastHandResultRef.current, true);
              }

              // Notify callback
              onFrameSignalsRef.current?.(signals);

              // FPS & Diagnostics Evaluation once per second
              fpsFrameCountRef.current++;
              const fpsElapsed = now - fpsLastTimeRef.current;
              if (fpsElapsed >= 1000) {
                const currentFps = Math.round((fpsFrameCountRef.current * 1000) / fpsElapsed);
                fpsFrameCountRef.current = 0;
                fpsLastTimeRef.current = now;

                const avgLatency =
                  latencyBufferRef.current.length > 0
                    ? latencyBufferRef.current.reduce((a, b) => a + b, 0) / latencyBufferRef.current.length
                    : totalLatency;

                // Non-destructive performance adaptation:
                // Instead of killing inference, gracefully adjust frame rate throttle
                if (avgLatency > 160 && frameIndex > 10) {
                  if (!slowPeriodStartRef.current) {
                    slowPeriodStartRef.current = now;
                  } else if (now - slowPeriodStartRef.current > 4000) {
                    setIsSimpleMode(true);
                    setWatchdogWarning('Adaptive Mode: Lowered frame rate to preserve device responsiveness.');
                  }
                } else if (avgLatency < 110) {
                  slowPeriodStartRef.current = null;
                  if (isSimpleModeRef.current) {
                    setIsSimpleMode(false);
                    setWatchdogWarning(null);
                  }
                }

                setDebugInfo({
                  fps: currentFps,
                  totalLatencyMs: Math.round(avgLatency),
                  faceLatencyMs: Math.round(faceMs),
                  handsLatencyMs: Math.round(handsMs),
                  poseLatencyMs: Math.round(poseMs),
                  delegate: activeDelegate,
                  activeStage: currentStage,
                  isSimpleMode: isSimpleModeRef.current,
                  isPerformanceMode: isSimpleModeRef.current,
                  videoResolution: `${video.videoWidth}x${video.videoHeight}`,
                  frameCount: frameCounterRef.current,
                  watchdogWarning,
                  recentErrors: errorsRingRef.current,
                });
              }
            } catch (err: any) {
              addErrorLog(`Inference error: ${err.message || err}`);
            } finally {
              isProcessingFrameRef.current = false;
            }
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(processFrame);
    };

    rafIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isLoopRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isCameraActive, isModelsReady, stage, activeDelegate, watchdogWarning, canvasRef, videoRef, addErrorLog]);

  // Teardown models on unmount
  useEffect(() => {
    return () => {
      isLoopRunningRef.current = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      try {
        faceLandmarkerRef.current?.close();
        faceLandmarkerRef.current = null;
      } catch {}
      try {
        handLandmarkerRef.current?.close();
        handLandmarkerRef.current = null;
      } catch {}
      try {
        poseLandmarkerRef.current?.close();
        poseLandmarkerRef.current = null;
      } catch {}
      if (downscaleCanvasRef.current) {
        downscaleCanvasRef.current.width = 0;
        downscaleCanvasRef.current.height = 0;
        downscaleCanvasRef.current = null;
      }
    };
  }, []);

  return {
    initModels,
    isModelLoading,
    modelProgress,
    modelStatusText,
    modelError,
    isModelsReady,
    activeDelegate,
    delegate: activeDelegate,
    isSimpleMode,
    setIsSimpleMode,
    isPerformanceMode: isSimpleMode,
    setIsPerformanceMode: setIsSimpleMode,
    watchdogWarning,
    debugInfo,
  };
}
