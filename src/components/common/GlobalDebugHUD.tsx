import React, { useState, useEffect } from 'react';
import { Bug, X, ChevronDown, ChevronUp, CheckCircle, RefreshCw } from 'lucide-react';
import { getRecentDiagnostics, subscribeDiagnostics } from '../../utils/diagnosticLogger';
import { useCueStore } from '../../store/useCueStore';

interface GlobalDebugHUDProps {
  currentView: string;
}

export const GlobalDebugHUD: React.FC<GlobalDebugHUDProps> = ({ currentView }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isVisible, setIsVisible] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('debug=1');
  });

  const [fps, setFps] = useState(60);
  const [logs, setLogs] = useState(getRecentDiagnostics());
  const { settings, mappings } = useCueStore();

  // Listen to diagnostic logs ring buffer
  useEffect(() => {
    return subscribeDiagnostics(() => {
      setLogs(getRecentDiagnostics());
    });
  }, []);

  // Compute live browser FPS
  useEffect(() => {
    if (!isVisible) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Global Diagnostics HUD"
      className="fixed bottom-3 right-3 z-50 max-w-sm sm:max-w-md w-full font-mono select-none"
    >
      <div className="rounded-2xl bg-slate-950/95 border border-cyan-500/50 text-slate-200 text-xs shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Header Bar */}
        <div className="px-3.5 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug size={14} className="text-cyan-400" />
            <span className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
              GESTIVO ?debug=1 HUD
            </span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px]">
              {fps} FPS
            </span>
            <span className="px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
              View: {currentView}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 cursor-pointer"
              title={isOpen ? 'Collapse panel' : 'Expand panel'}
            >
              {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-white/10 cursor-pointer"
              title="Close debug panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        {isOpen && (
          <div className="p-3.5 space-y-3 text-[11px] max-h-80 overflow-y-auto scrollbar-thin">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 block uppercase">Cue Camera Feature</span>
                <span className="font-bold text-emerald-400">
                  {settings.featureEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="text-slate-500 block">
                  Consent: {settings.consentGiven ? 'Given' : 'Pending'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <span className="text-slate-400 block uppercase">Active Cues Count</span>
                <span className="font-bold text-cyan-300">
                  {mappings.filter((m) => m.active).length} / {mappings.length}
                </span>
                <span className="text-slate-500 block">Hold: {settings.holdTimeMs}ms</span>
              </div>
            </div>

            {/* Error / Diagnostic Ring Buffer */}
            <div>
              <div className="flex items-center justify-between mb-1 text-slate-400 text-[10px]">
                <span className="font-bold text-slate-300">Last 20 Diagnostics & Errors:</span>
                <span>{logs.length} logged</span>
              </div>

              <div className="max-h-36 overflow-y-auto bg-black/60 p-2 rounded-xl border border-white/5 space-y-1 text-[10px] scrollbar-thin">
                {logs.length === 0 ? (
                  <div className="text-emerald-400 flex items-center gap-1.5 py-1">
                    <CheckCircle size={12} />
                    <span>0 errors recorded. Engine is healthy.</span>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div
                      key={log.id}
                      className={`leading-tight font-mono ${
                        log.type === 'error'
                          ? 'text-rose-300'
                          : log.type === 'warn'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }`}
                    >
                      <span className="text-slate-500">[{log.time}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer with actions */}
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
              <span>Press URL without ?debug=1 to hide</span>
              <button
                onClick={() => window.location.reload()}
                className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={10} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
