import React from 'react';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { NimoMascot } from '../mascots/Mascots';

interface NotSureCardProps {
  reason?: string;
  detectedSignals?: string[];
}

export const NotSureCard: React.FC<NotSureCardProps> = ({
  reason = "I'm watching carefully... I'm not sure yet 🤔",
  detectedSignals = [],
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full glass-panel-glow p-4 sm:p-5 rounded-3xl border border-white/20 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
    >
      <div className="flex items-center gap-3.5">
        {/* Nimo Mascot buddy */}
        <div className="shrink-0">
          <NimoMascot size={48} showBubble={false} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-black text-sm sm:text-base text-cyan-200">
              Honest Uncertainty
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
              No Guessing
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
            {reason}
          </p>

          {detectedSignals.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-purple-300 font-bold">Signals observed:</span>
              {detectedSignals.map((s, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-lg bg-white/10 text-[11px] font-semibold text-slate-200 border border-white/10"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 text-xs text-purple-200/80 font-bold bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
        <Eye size={15} className="text-cyan-300" />
        <span>Holding for steady cue</span>
      </div>
    </motion.div>
  );
};
