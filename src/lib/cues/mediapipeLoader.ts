// Safe, resilient dynamic loader for MediaPipe Tasks Vision models and WASM

export interface LoadedModels {
  faceLandmarker: any | null;
  handLandmarker: any | null;
  poseLandmarker: any | null;
  delegate: 'GPU' | 'CPU';
  close: () => void;
}

const LOCAL_WASM = '/wasm';
const CDN_WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';

const LOCAL_MODELS = {
  face: '/models/face_landmarker.task',
  hand: '/models/hand_landmarker.task',
  pose: '/models/pose_landmarker_lite.task',
};

const CDN_MODELS = {
  face: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
  hand: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  pose: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
};

// Check if a URL serves an actual binary asset (and not Vite's index.html fallback)
export async function testBinaryUrlAccessible(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      return false;
    }
    const contentLength = Number(res.headers.get('content-length') || 0);
    if (contentLength > 0 && contentLength < 1000) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Safety net: Force TensorFlow.js backend away from WebGL if present
export function enforceTfBackendSafety() {
  if (typeof window !== 'undefined' && (window as any).tf) {
    try {
      const tf = (window as any).tf;
      if (typeof tf.setBackend === 'function') {
        const currentBackend = tf.getBackend ? tf.getBackend() : '';
        if (currentBackend === 'webgl') {
          console.warn('[VisionEngine] Forcing TensorFlow.js backend to CPU/WASM to avoid WebGL context contention.');
          tf.setBackend('cpu');
        }
      }
    } catch (e) {
      console.warn('[VisionEngine] Error setting tf backend:', e);
    }
  }
}

// Cache the FilesetResolver singleton promise
let visionResolverPromise: Promise<any> | null = null;

export async function getVisionResolver(): Promise<any> {
  if (visionResolverPromise) return visionResolverPromise;

  visionResolverPromise = (async () => {
    enforceTfBackendSafety();

    const { FilesetResolver } = await import('@mediapipe/tasks-vision');

    let wasmPath = LOCAL_WASM;
    const isLocalWasmAvailable = await testBinaryUrlAccessible(`${LOCAL_WASM}/vision_wasm_internal.wasm`);
    if (!isLocalWasmAvailable) {
      console.warn('[VisionEngine] Local WASM not found or returned HTML; switching to CDN fallback.');
      wasmPath = CDN_WASM;
    } else {
      console.log('[VisionEngine] Using verified local WASM runtime at', LOCAL_WASM);
    }

    try {
      return await FilesetResolver.forVisionTasks(wasmPath);
    } catch (err) {
      console.warn('[VisionEngine] Failed to resolve WASM from primary path, trying CDN fallback...', err);
      return await FilesetResolver.forVisionTasks(CDN_WASM);
    }
  })().catch((err) => {
    visionResolverPromise = null;
    throw err;
  });

  return visionResolverPromise;
}

// Generic model creator with GPU -> CPU fallback and Local -> CDN fallback
async function createModelWithFallback(
  modelName: string,
  localPath: string,
  cdnPath: string,
  createFn: (path: string, delegate: 'GPU' | 'CPU') => Promise<any>
): Promise<{ model: any; delegate: 'GPU' | 'CPU' }> {
  const isLocalOk = await testBinaryUrlAccessible(localPath);
  const primaryUrl = isLocalOk ? localPath : cdnPath;
  const fallbackUrl = isLocalOk ? cdnPath : null;

  async function tryWithUrl(url: string): Promise<{ model: any; delegate: 'GPU' | 'CPU' }> {
    try {
      console.log(`[VisionEngine] Creating ${modelName} with GPU delegate from ${url}...`);
      const model = await createFn(url, 'GPU');
      return { model, delegate: 'GPU' };
    } catch (gpuErr: any) {
      console.warn(`[VisionEngine] GPU delegate failed for ${modelName} (${gpuErr.message || gpuErr}), retrying with CPU...`);
      const model = await createFn(url, 'CPU');
      return { model, delegate: 'CPU' };
    }
  }

  try {
    return await tryWithUrl(primaryUrl);
  } catch (err: any) {
    if (fallbackUrl) {
      console.warn(`[VisionEngine] Primary URL failed for ${modelName}, retrying fallback ${fallbackUrl}...`);
      return await tryWithUrl(fallbackUrl);
    }
    throw err;
  }
}

// 1. Stage 2: Load FaceLandmarker only
export async function loadFaceLandmarker(): Promise<{ faceLandmarker: any; delegate: 'GPU' | 'CPU' }> {
  const vision = await getVisionResolver();
  const { FaceLandmarker } = await import('@mediapipe/tasks-vision');

  const { model, delegate } = await createModelWithFallback(
    'FaceLandmarker',
    LOCAL_MODELS.face,
    CDN_MODELS.face,
    (modelAssetPath, d) =>
      FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: d,
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      })
  );

  return { faceLandmarker: model, delegate };
}

// 2. Stage 3: Load HandLandmarker
export async function loadHandLandmarker(preferredDelegate: 'GPU' | 'CPU' = 'GPU'): Promise<{ handLandmarker: any; delegate: 'GPU' | 'CPU' }> {
  const vision = await getVisionResolver();
  const { HandLandmarker } = await import('@mediapipe/tasks-vision');

  const { model, delegate } = await createModelWithFallback(
    'HandLandmarker',
    LOCAL_MODELS.hand,
    CDN_MODELS.hand,
    (modelAssetPath, d) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: d === 'GPU' && preferredDelegate === 'CPU' ? 'CPU' : d,
        },
        runningMode: 'VIDEO',
        numHands: 2,
      })
  );

  return { handLandmarker: model, delegate };
}

// 3. Stage 4: Load PoseLandmarker (Lite)
export async function loadPoseLandmarker(): Promise<{ poseLandmarker: any; delegate: 'GPU' | 'CPU' }> {
  const vision = await getVisionResolver();
  const { PoseLandmarker } = await import('@mediapipe/tasks-vision');

  const { model, delegate } = await createModelWithFallback(
    'PoseLandmarkerLite',
    LOCAL_MODELS.pose,
    CDN_MODELS.pose,
    (modelAssetPath, d) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath,
          delegate: d,
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      })
  );

  return { poseLandmarker: model, delegate };
}
