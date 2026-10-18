import React, { useState } from 'react';
import { CueDetectionDebugInfo } from '../../lib/cues/useCueDetection';
import { TrackingQuality } from '../../lib/cues/types';
import { Bug, Activity, ChevronDown, ChevronUp } from 'lucide-react';

interface CueCameraDebugPanelProps {
  debugInfo: CueDetectionDebugInfo;
  trackingQuality: TrackingQuality;
  onTogglePerformanceMode?: () => void;
  isOpenDefault?: boolean;
}

export const CueCameraDebugPanel: React.FC<CueCameraDebugPanelProps> = ({
  debugInfo,
  trackingQuality,
  onTogglePerformanceMode,
  isOpenDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState(isOpenDefault);

  return (
    <div className="w-full rounded-2xl bg-slate-950/90 border border-cyan-500/40 text-slate-200 font-mono text-xs shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between cursor-pointer select-none hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug size={15} className="text-cyan-400" />
          <span className="font-bold text-cyan-300 uppercase tracking-wider">
            [CueCamera] Diagnostic Debug HUD
          </span>
          <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px]">
            {debugInfo.fps} FPS
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] border ${
              debugInfo.delegate === 'GPU'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}
          >
            {debugInfo.delegate} Delegate
          </span>
          {debugInfo.isPerformanceMode && (
            <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
              Perf Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px]">{isOpen ? 'Hide Details' : 'Show Details'}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded Metrics Content */}
      {isOpen && (
        <div className="p-4 space-y-4 text-[11px]">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Frame Rate</span>
              <span className="text-base font-bold text-cyan-400">{debugInfo.fps} FPS</span>
              <span className="text-[10px] text-slate-500 block">Frames: {debugInfo.frameCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Avg Latency</span>
              <span
                className={`text-base font-bold ${
                  debugInfo.totalLatencyMs > 120
                    ? 'text-amber-400'
                    : debugInfo.totalLatencyMs > 150
                    ? 'text-rose-400'
                    : 'text-emerald-400'
                }`}
              >
                {debugInfo.totalLatencyMs} ms
              </span>
              <span className="text-[10px] text-slate-500 block">Target: &lt; 100ms</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Resolution</span>
              <span className="text-base font-bold text-purple-300">{debugInfo.videoResolution}</span>
              <span className="text-[10px] text-slate-500 block">Aspect: User Facing</span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase">Tracking Quality</span>
              <span className="text-base font-bold text-sky-300 capitalize">
                {trackingQuality.status} ({Math.round(trackingQuality.score * 100)}%)
              </span>
              <span className="text-[10px] text-slate-500 block">
                Face: {trackingQuality.faceFound ? 'Yes' : 'No'} | Hands: {trackingQuality.handsFound}
              </span>
            </div>
          </div>

          {/* Model Breakdown Latency */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="flex justify-between text-slate-300 font-bold border-b border-white/10 pb-1">
              <span>Per-Model Inference Latency</span>
              <span>Execution Schedule</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400">FaceLandmarker:</span>
                <span className="text-cyan-300 font-bold">{debugInfo.faceLatencyMs} ms (100% frames)</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400">HandLandmarker:</span>
                <span className="text-purple-300 font-bold">{debugInfo.handsLatencyMs} ms (50% frames)</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-2 py-1.5 rounded-lg border border-white/5">
                <span className="text-slate-400">PoseLandmarker:</span>
                <span className="text-amber-300 font-bold">
                  {debugInfo.isPerformanceMode
                    ? 'Disabled (Perf Mode)'
                    : `${debugInfo.poseLatencyMs} ms (33% frames)`}
                </span>
              </div>
            </div>
          </div>

          {/* Watchdog status and toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-emerald-400" />
              <div>
                <span className="font-bold text-slate-300 block">Watchdog Liveness & Stall Guard:</span>
                <span className="text-[10px] text-slate-400">
                  {debugInfo.watchdogWarning || 'Active. Monitors frame intervals (<5s) & inference latency (<150ms).'}
                </span>
              </div>
            </div>
            {onTogglePerformanceMode && (
              <button
                onClick={onTogglePerformanceMode}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer"
              >
                Toggle {debugInfo.isPerformanceMode ? 'Standard Mode' : 'Performance Mode'}
              </button>
            )}
          </div>

          {/* Recent 20 errors/warnings ring buffer */}
          <div>
            <div className="flex items-center justify-between mb-1 text-slate-400">
              <span className="font-bold text-slate-300">Recent Diagnostic Event Logs (Max 20):</span>
              <span className="text-[10px]">{debugInfo.recentErrors.length} recorded</span>
            </div>
            <div className="max-h-28 overflow-y-auto bg-black/50 p-2 rounded-xl border border-white/5 space-y-1 text-[10px] scrollbar-thin">
              {debugInfo.recentErrors.length === 0 ? (
                <span className="text-emerald-400">✓ No errors or stalls recorded. Engine running smoothly.</span>
              ) : (
                debugInfo.recentErrors.map((err, idx) => (
                  <div key={idx} className="text-amber-300 leading-tight">
                    {err}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
