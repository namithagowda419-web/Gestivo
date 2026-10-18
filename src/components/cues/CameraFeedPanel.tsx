import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, CameraOff, RefreshCw, Eye, EyeOff, FlipHorizontal, Activity, Sparkles, Smile, Hand } from 'lucide-react';
import { TrackingQuality } from '../../lib/cues/types';
import { playChime } from '../../utils/speech';

interface CameraFeedPanelProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  isCameraActive: boolean;
  trackingQuality: TrackingQuality;
  isMirrored: boolean;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  onToggleMirror: () => void;
  onSwitchCamera: () => void;
  onStopCamera: () => void;
  onStartCamera: () => void;
  activityLevel: 'still' | 'calm' | 'very_active';
  isVirtualCamera?: boolean;
  onStartVirtualCamera?: () => void;
  onTriggerVirtualGesture?: (type: 'smile' | 'point' | 'wave' | 'head_nod' | 'turn_away' | 'hand_mouth') => void;
}

export const CameraFeedPanel: React.FC<CameraFeedPanelProps> = ({
  videoRef,
  canvasRef: externalCanvasRef,
  isCameraActive,
  trackingQuality,
  isMirrored,
  showOverlay,
  onToggleOverlay,
  onToggleMirror,
  onSwitchCamera,
  onStopCamera,
  onStartCamera,
  activityLevel,
  isVirtualCamera = false,
  onStartVirtualCamera,
  onTriggerVirtualGesture,
}) => {
  const internalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeCanvasRef = externalCanvasRef || internalCanvasRef;

  // Status glow color
  const statusBorderColor = !isCameraActive
    ? 'border-slate-500/50 shadow-slate-900/50'
    : !trackingQuality.faceFound
    ? 'border-blue-400/80 shadow-[0_0_30px_rgba(96,165,250,0.35)]'
    : trackingQuality.status === 'good'
    ? 'border-emerald-400 shadow-[0_0_35px_rgba(52,211,153,0.45)]'
    : 'border-amber-400/90 shadow-[0_0_35px_rgba(251,191,36,0.35)]';

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Status Bar Chips matching prompt */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Camera status chip */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-black font-heading flex items-center gap-1.5 border ${
              isCameraActive
                ? isVirtualCamera
                  ? 'bg-purple-500/25 text-purple-300 border-purple-400/50'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                : 'bg-slate-700/50 text-slate-300 border-slate-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive
                  ? isVirtualCamera
                    ? 'bg-purple-400 animate-pulse'
                    : 'bg-emerald-400 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {isCameraActive
                ? isVirtualCamera
                  ? 'Virtual Demo Camera Active'
                  : 'Hardware Camera Active'
                : 'Camera Paused'}
            </span>
          </div>

          {/* Tracking Quality Chip */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-black font-heading flex items-center gap-1.5 border ${
              trackingQuality.status === 'good'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                : trackingQuality.status === 'ok'
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
                : 'bg-amber-500/20 text-amber-200 border-amber-400/40'
            }`}
          >
            <Activity size={14} />
            <span className="capitalize">Quality: {trackingQuality.status}</span>
          </div>

          {/* Face found chip */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold font-heading flex items-center gap-1.5 border ${
              trackingQuality.faceFound
                ? 'bg-sky-500/20 text-sky-200 border-sky-400/40'
                : 'bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            <Smile size={14} />
            <span>{trackingQuality.faceFound ? 'Face Detected' : 'Looking for Face'}</span>
          </div>

          {/* Hands count chip */}
          <div
            className={`px-3 py-1 rounded-full text-xs font-bold font-heading flex items-center gap-1.5 border ${
              trackingQuality.handsFound > 0
                ? 'bg-purple-500/20 text-purple-200 border-purple-400/40'
                : 'bg-white/10 text-slate-400 border-white/10'
            }`}
          >
            <Hand size={14} />
            <span>
              {trackingQuality.handsFound === 0
                ? 'No Hands'
                : trackingQuality.handsFound === 1
                ? '1 Hand'
                : '2 Hands'}
            </span>
          </div>

          {/* Activity level chip */}
          <div className="px-3 py-1 rounded-full text-xs font-bold font-heading bg-white/10 border border-white/15 text-slate-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-purple-300" />
            <span className="capitalize">Movement: {activityLevel.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Virtual Demo Camera toggle button */}
          {onStartVirtualCamera && !isVirtualCamera && (
            <button
              onClick={() => {
                playChime('star');
                onStartVirtualCamera();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border border-purple-400/30 text-xs font-heading font-black transition-all cursor-pointer flex items-center gap-1"
              title="Switch to Virtual Demo Camera"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span className="hidden sm:inline">Virtual Demo</span>
            </button>
          )}

          {/* Overlay toggle button */}
          <button
            onClick={() => {
              playChime('pop');
              onToggleOverlay();
            }}
            className={`p-2 rounded-xl border text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showOverlay
                ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
            }`}
            title={showOverlay ? 'Hide Landmark Skeleton Overlay' : 'Show Landmark Skeleton Overlay'}
          >
            {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
            <span className="hidden sm:inline">Overlay</span>
          </button>

          {/* Mirror toggle button */}
          <button
            onClick={() => {
              playChime('pop');
              onToggleMirror();
            }}
            className={`p-2 rounded-xl border text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isMirrored
                ? 'bg-purple-500/30 text-purple-200 border-purple-400/50'
                : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
            }`}
            title="Mirror Camera View"
          >
            <FlipHorizontal size={16} />
            <span className="hidden sm:inline">Mirror</span>
          </button>

          {/* Pause / Resume camera button */}
          {isCameraActive ? (
            <button
              id="camera-pause-btn"
              onClick={() => {
                playChime('bubble');
                onStopCamera();
              }}
              className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 transition-all cursor-pointer flex items-center gap-1.5"
              title="Pause Camera"
            >
              <CameraOff size={16} />
              <span className="hidden sm:inline">Pause</span>
            </button>
          ) : (
            <button
              id="camera-resume-btn"
              onClick={() => {
                playChime('star');
                onStartCamera();
              }}
              className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 transition-all cursor-pointer flex items-center gap-1.5"
              title="Resume Camera"
            >
              <Camera size={16} />
              <span className="hidden sm:inline">Resume</span>
            </button>
          )}

          {/* Switch front/back camera */}
          {!isVirtualCamera && (
            <button
              onClick={() => {
                playChime('pop');
                onSwitchCamera();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all cursor-pointer"
              title="Switch Front/Back Camera"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Virtual Gesture Interactive Simulator Bar */}
      {isVirtualCamera && isCameraActive && (
        <div className="p-3 rounded-2xl bg-purple-950/60 border border-purple-400/30 flex flex-wrap items-center justify-between gap-2 shadow-lg backdrop-blur-md">
          <span className="text-xs font-heading font-black text-purple-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
            Trigger Simulated Gestures:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onTriggerVirtualGesture?.('smile')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              😊 Big Smile
            </button>
            <button
              onClick={() => onTriggerVirtualGesture?.('point')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              👉 Pointing
            </button>
            <button
              onClick={() => onTriggerVirtualGesture?.('wave')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              👋 Waving
            </button>
            <button
              onClick={() => onTriggerVirtualGesture?.('head_nod')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              🙇 Head Nod
            </button>
            <button
              onClick={() => onTriggerVirtualGesture?.('turn_away')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              👀 Turn Away
            </button>
            <button
              onClick={() => onTriggerVirtualGesture?.('hand_mouth')}
              className="px-3 py-1.5 rounded-xl bg-purple-500/25 hover:bg-purple-500/40 text-purple-100 text-xs font-bold border border-purple-300/30 cursor-pointer active:scale-95 transition-all"
            >
              🥤 Hand to Mouth
            </button>
            <button
              onClick={onStartCamera}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-200 text-xs font-black border border-emerald-400/40 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
              title="Switch back to Hardware Webcam"
            >
              <Camera size={13} />
              <span>Real Webcam</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Video View Panel with Status Glowing Border */}
      <div
        className={`relative w-full aspect-[4/3] sm:aspect-[16/10] max-h-[500px] rounded-[32px] overflow-hidden bg-slate-950 border-4 ${statusBorderColor} transition-all duration-300 shadow-2xl flex items-center justify-center`}
      >
        {/* Streamed HTML5 Video with iOS Safari guards */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover transition-transform ${
            isMirrored ? 'scale-x-[-1]' : ''
          } ${!isCameraActive ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Canvas for Soft Landmark Overlay drawn directly in RAF without React re-render overhead */}
        <canvas
          ref={activeCanvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 w-full h-full pointer-events-none object-cover ${
            isMirrored ? 'scale-x-[-1]' : ''
          }`}
        />

        {/* Camera Off Placeholder */}
        {!isCameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-gradient-to-b from-[#180838]/90 to-[#0e0622]/95 backdrop-blur-md">
            <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center text-slate-300 border border-white/20 shadow-lg">
              <CameraOff size={32} />
            </div>
            <h4 className="text-xl font-black font-heading text-white">
              Cue Camera is Paused
            </h4>
            <p className="text-xs sm:text-sm text-purple-200 max-w-md font-semibold">
              Begin gentle real-time cue observation. Processing runs 100% locally and privately on this device.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <button
                onClick={() => {
                  playChime('star');
                  onStartCamera();
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-black text-sm shadow-xl shadow-emerald-500/30 border border-emerald-300/50 cursor-pointer flex items-center gap-2"
              >
                <Camera size={18} />
                <span>Start Hardware Camera</span>
              </button>

              {onStartVirtualCamera && (
                <button
                  onClick={() => {
                    playChime('star');
                    onStartVirtualCamera();
                  }}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heading font-black text-sm shadow-xl shadow-purple-500/30 border border-purple-300/50 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles size={18} />
                  <span>Try Virtual Demo Camera</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tracking Guidance Overlay Note when poor tracking */}
        {isCameraActive && trackingQuality.status === 'poor' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 inset-x-4 sm:inset-x-8 px-4 py-2.5 rounded-2xl bg-amber-500/90 text-amber-950 font-heading font-extrabold text-xs sm:text-sm text-center shadow-lg border border-amber-300"
          >
            {trackingQuality.guidanceMessage}
          </motion.div>
        )}
      </div>
    </div>
  );
};
