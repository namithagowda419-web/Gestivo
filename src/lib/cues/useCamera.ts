import { useState, useEffect, useRef, useCallback } from 'react';
import { createVirtualCameraStream, VirtualCameraSession } from './virtualCamera';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'not_found'
  | 'in_use'
  | 'unplugged'
  | 'insecure'
  | 'error';

export interface UseCameraOptions {
  idealWidth?: number;
  idealHeight?: number;
  facingMode?: 'user' | 'environment';
}

export function useCamera(options: UseCameraOptions = {}) {
  const {
    idealWidth = 1280,
    idealHeight = 720,
    facingMode: initialFacingMode = 'user',
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const virtualSessionRef = useRef<VirtualCameraSession | null>(null);

  // Generation counter to guard against race conditions & StrictMode double mounts
  const mountSessionIdRef = useRef<number>(0);
  const isAcquiringRef = useRef<boolean>(false);

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(initialFacingMode);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [isVirtualCamera, setIsVirtualCamera] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Enumerate video devices safely
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
    } catch (err) {
      console.warn('[useCamera] Could not enumerate devices:', err);
    }
  }, []);

  // Complete cleanup: stops every track and releases stream and video
  const stopCamera = useCallback(() => {
    mountSessionIdRef.current += 1;
    isAcquiringRef.current = false;

    if (virtualSessionRef.current) {
      virtualSessionRef.current.stop();
      virtualSessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.onended = null;
          track.stop();
        } catch (e) {
          console.warn('[useCamera] Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}
      videoRef.current.srcObject = null;
    }

    setIsVirtualCamera(false);
    setStream(null);
    setStatus('idle');
    setErrorMessage('');
  }, []);

  // Start Virtual Demo Camera
  const startVirtualCamera = useCallback(() => {
    stopCamera();
    const sessionId = ++mountSessionIdRef.current;
    setStatus('requesting');
    setErrorMessage('');

    try {
      const session = createVirtualCameraStream();
      virtualSessionRef.current = session;
      streamRef.current = session.stream;
      setStream(session.stream);
      setIsVirtualCamera(true);

      const video = videoRef.current;
      if (video) {
        video.srcObject = session.stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.play().catch(() => {});
      }

      if (mountSessionIdRef.current === sessionId) {
        setStatus('active');
      }
    } catch (err: any) {
      console.error('[useCamera] Virtual camera creation failed:', err);
      setStatus('error');
      setErrorMessage('Could not initialize virtual camera stream.');
    }
  }, [stopCamera]);

  const triggerVirtualGesture = useCallback(
    (type: 'smile' | 'point' | 'wave' | 'head_nod' | 'turn_away' | 'hand_mouth') => {
      if (virtualSessionRef.current) {
        virtualSessionRef.current.triggerGesture(type);
      }
    },
    []
  );

  // Start physical hardware webcam with progressive constraint fallback
  const startCamera = useCallback(
    async (deviceId?: string, targetFacingMode?: 'user' | 'environment') => {
      // 1. Guard insecure context
      const isSecure =
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (!isSecure) {
        setStatus('insecure');
        setErrorMessage(
          'Camera access requires HTTPS or localhost for privacy and security. You can access via HTTPS or try the Virtual Demo Camera.'
        );
        return;
      }

      // 2. Guard browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('error');
        setErrorMessage('Your browser does not support camera capture via getUserMedia.');
        return;
      }

      if (isAcquiringRef.current) return;
      isAcquiringRef.current = true;

      // Clean up previous virtual session or stream
      if (virtualSessionRef.current) {
        virtualSessionRef.current.stop();
        virtualSessionRef.current = null;
      }
      setIsVirtualCamera(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      const sessionId = ++mountSessionIdRef.current;
      setStatus('requesting');
      setErrorMessage('');

      const activeFacing = targetFacingMode || facingMode;

      let stream: MediaStream | null = null;
      let lastErr: any = null;

      // Tier 1: High definition / ideal constraints
      const tier1Constraints: MediaStreamConstraints = {
        video: {
          facingMode: deviceId ? undefined : activeFacing,
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: idealWidth },
          height: { ideal: idealHeight },
        },
        audio: false,
      };

      try {
        stream = await navigator.mediaDevices.getUserMedia(tier1Constraints);
      } catch (err: any) {
        lastErr = err;
        console.warn('[useCamera] Tier 1 constraint failed, trying generic facingMode fallback...', err.name);
      }

      // Tier 2: Generic facingMode fallback
      if (!stream && !deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: activeFacing },
            audio: false,
          });
        } catch (err: any) {
          lastErr = err;
          console.warn('[useCamera] Tier 2 fallback failed, trying basic { video: true }...', err.name);
        }
      }

      // Tier 3: Universal fallback
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (!stream) {
        if (mountSessionIdRef.current !== sessionId) return;
        isAcquiringRef.current = false;

        console.error('[useCamera] Camera acquisition failed after all tiers:', lastErr);
        const name = lastErr?.name || '';

        if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
          setStatus('denied');
          setErrorMessage('Camera access was denied. Please allow camera permissions in your browser bar.');
        } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
          setStatus('not_found');
          setErrorMessage('No camera was detected on this device. You can connect a webcam or use the Virtual Demo Camera.');
        } else if (name === 'NotReadableError' || name === 'TrackStartError') {
          setStatus('in_use');
          setErrorMessage('Camera is currently busy or in use by another application or tab.');
        } else {
          setStatus('error');
          setErrorMessage(lastErr?.message || 'Failed to open camera.');
        }
        return;
      }

      if (mountSessionIdRef.current !== sessionId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      setStream(stream);

      // Listen for mid-session disconnect
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (mountSessionIdRef.current === sessionId) {
            console.warn('[useCamera] Camera video track disconnected mid-session.');
            setStatus('unplugged');
            setErrorMessage('The camera was unplugged or disconnected mid-session. Please reconnect and retry.');
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((t) => t.stop());
              streamRef.current = null;
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        };

        const settings = videoTrack.getSettings?.();
        if (settings?.deviceId) {
          setActiveDeviceId(settings.deviceId);
        }
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        // Resilient metadata wait with 1200ms safety timeout to prevent freeze
        await new Promise<void>((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
            resolve();
            return;
          }
          const timeout = setTimeout(() => resolve(), 1200);
          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
        });

        if (mountSessionIdRef.current === sessionId) {
          try {
            await video.play();
          } catch (playErr: any) {
            if (playErr.name !== 'AbortError') {
              console.warn('[useCamera] video.play() warning:', playErr);
            }
          }
        }
      }

      if (mountSessionIdRef.current === sessionId) {
        setStatus('active');
        isAcquiringRef.current = false;
        refreshDevices();
      }
    },
    [facingMode, idealHeight, idealWidth, refreshDevices]
  );

  // Switch facing mode (front / back)
  const switchFacingMode = useCallback(() => {
    if (isVirtualCamera) return;
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
  }, [facingMode, isVirtualCamera, startCamera]);

  // Synchronize stream to video element whenever video mounts or status changes
  useEffect(() => {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (status === 'active' && stream && video) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        video.play().catch(() => {});
      }
    }
  });

  // Listen to hardware device change (plug / unplug)
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [refreshDevices]);

  // Unconditional teardown on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream,
    status,
    errorMessage,
    devices,
    activeDeviceId,
    facingMode,
    isVirtualCamera,
    startCamera,
    startVirtualCamera,
    triggerVirtualGesture,
    stopCamera,
    switchFacingMode,
    refreshDevices,
  };
}
