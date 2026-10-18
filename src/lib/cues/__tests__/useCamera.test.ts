import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { useCamera } from '../useCamera';

describe('STAGE 1: useCamera Hook & Lifecycle Stability', () => {
  let createdStreams: Array<{ tracks: Array<{ stop: any; onended: any }> }> = [];

  function createMockStream() {
    const track = {
      kind: 'video',
      stop: vi.fn(),
      onended: null as any,
      getSettings: vi.fn(() => ({ deviceId: 'cam-1' })),
    };
    const stream = {
      getTracks: vi.fn(() => [track]),
      getVideoTracks: vi.fn(() => [track]),
      tracks: [track],
    };
    createdStreams.push(stream);
    return stream as any;
  }

  beforeEach(() => {
    createdStreams = [];
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      configurable: true,
    });

    const mediaDevicesMock = {
      getUserMedia: vi.fn(async () => createMockStream()),
      enumerateDevices: vi.fn(async () => [
        { kind: 'videoinput', deviceId: 'cam-1', label: 'FaceTime HD' } as MediaDeviceInfo,
      ]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(navigator, 'mediaDevices', {
      value: mediaDevicesMock,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes in idle status and acquires camera stream with ideal 640x480 constraints', async () => {
    const { result } = renderHook(() => useCamera());
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('active');
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      video: {
        facingMode: 'user',
        deviceId: undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });
  });

  it('cleans up fully on unmount (stops all tracks and releases stream)', async () => {
    const { result, unmount } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });
    expect(result.current.status).toBe('active');
    expect(createdStreams.length).toBe(1);

    const activeTrack = createdStreams[0].tracks[0];
    expect(activeTrack.stop).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(activeTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('guarantees start and stop 20 times without leaking streams or tracks', async () => {
    const { result } = renderHook(() => useCamera());

    for (let i = 0; i < 20; i++) {
      await act(async () => {
        await result.current.startCamera();
      });
      expect(result.current.status).toBe('active');

      act(() => {
        result.current.stopCamera();
      });
      expect(result.current.status).toBe('idle');
    }

    // Exactly 20 streams were created, and every one of them was cleanly stopped
    expect(createdStreams.length).toBe(20);
    createdStreams.forEach((stream) => {
      expect(stream.tracks[0].stop).toHaveBeenCalled();
    });
  });

  it('survives React StrictMode double-mounting without leaking streams', async () => {
    let hookResult: any;

    const { unmount } = renderHook(
      () => {
        hookResult = useCamera();
        return hookResult;
      },
      {
        wrapper: StrictMode,
      }
    );

    await act(async () => {
      await hookResult.startCamera();
    });

    expect(hookResult.status).toBe('active');

    act(() => {
      unmount();
    });

    // All streams created are stopped on unmount
    createdStreams.forEach((stream) => {
      expect(stream.tracks[0].stop).toHaveBeenCalled();
    });
  });

  it('handles permission denied (NotAllowedError)', async () => {
    const deniedErr = new Error('Permission denied');
    deniedErr.name = 'NotAllowedError';
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(deniedErr);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('denied');
    expect(result.current.errorMessage).toContain('denied');
  });

  it('handles no camera found (NotFoundError)', async () => {
    const notFoundErr = new Error('Device not found');
    notFoundErr.name = 'NotFoundError';
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(notFoundErr);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('not_found');
    expect(result.current.errorMessage).toContain('No camera was detected');
  });

  it('handles camera busy (NotReadableError)', async () => {
    const busyErr = new Error('Camera in use');
    busyErr.name = 'NotReadableError';
    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValueOnce(busyErr);

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('in_use');
    expect(result.current.errorMessage).toContain('busy or in use');
  });

  it('handles mid-session track disconnection (unplugged)', async () => {
    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('active');
    const track = createdStreams[0].tracks[0];

    // Trigger track disconnection
    act(() => {
      if (track.onended) {
        track.onended();
      }
    });

    expect(result.current.status).toBe('unplugged');
    expect(result.current.errorMessage).toContain('unplugged or disconnected');
  });

  it('handles insecure context gracefully without crashing', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    Object.defineProperty(window, 'location', {
      value: { hostname: '192.168.1.100' },
      configurable: true,
    });

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.startCamera();
    });

    expect(result.current.status).toBe('insecure');
    expect(result.current.errorMessage).toContain('HTTPS or localhost');
  });
});
