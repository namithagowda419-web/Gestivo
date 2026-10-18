import React from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Edit3, XCircle } from 'lucide-react';
import { CueDecisionLog } from '../../lib/cues/types';
import { playChime, speakText } from '../../utils/speech';

interface RecentCuesTimelineProps {
  logs: CueDecisionLog[];
}

export const RecentCuesTimeline: React.FC<RecentCuesTimelineProps> = ({ logs }) => {
  const recent10 = logs.slice(0, 10);

  return (
    <div className="w-full glass-panel-glow p-4 sm:p-5 rounded-3xl border border-white/20 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-cyan-300" />
          <h4 className="text-base sm:text-lg font-black font-heading text-white">
            Recent Cue Activity
          </h4>
        </div>
        <span className="text-xs font-bold text-purple-200">
          Last {recent10.length} Caregiver Decisions
        </span>
      </div>

      {recent10.length === 0 ? (
        <div className="py-8 text-center text-xs text-purple-200/70 italic">
          No cue decisions recorded yet. Start camera to begin cue detection.
        </div>
      ) : (
        <div className="divide-y divide-white/10 mt-2">
          {recent10.map((log) => {
            const isConfirmed = log.decision === 'confirmed';
            const isChanged = log.decision === 'changed';

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  {/* Outcome Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isConfirmed
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : isChanged
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                    }`}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 size={17} />
                    ) : isChanged ? (
                      <Edit3 size={16} />
                    ) : (
                      <XCircle size={17} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-black text-sm text-white">
                        {log.finalPhrase}
                      </span>
                      {isChanged && (
                        <span className="text-[11px] text-slate-300">
                          (Suggested: "{log.suggestedPhrase}")
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isConfirmed
                            ? 'bg-emerald-400/20 text-emerald-200'
                            : isChanged
                            ? 'bg-amber-400/20 text-amber-200'
                            : 'bg-rose-400/20 text-rose-200'
                        }`}
                      >
                        {log.decision}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-purple-200/80 mt-0.5">
                      <span>{log.timestamp}</span>
                      {log.signals?.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{log.signals.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Re-speak button if confirmed or changed */}
                {(isConfirmed || isChanged) && (
                  <button
                    onClick={() => {
                      playChime('pop');
                      speakText(log.finalPhrase, true);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    title="Speak Phrase"
                  >
                    🔊
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
