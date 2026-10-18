import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, X, HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { SuggestionCandidate } from '../../lib/cues/types';
import { playChime } from '../../utils/speech';

interface SuggestionCardProps {
  primaryCandidate: SuggestionCandidate;
  secondaryCandidate: SuggestionCandidate | null;
  holdProgress: number;
  onConfirm: (candidate: SuggestionCandidate) => void;
  onCorrect: (candidate: SuggestionCandidate) => void;
  onDismiss: (candidate: SuggestionCandidate) => void;
}

export const SuggestionCard: React.FC<SuggestionCardProps> = ({
  primaryCandidate,
  secondaryCandidate,
  holdProgress,
  onConfirm,
  onCorrect,
  onDismiss,
}) => {
  const [showWhy, setShowWhy] = useState(false);

  // Confidence styling
  const getConfidenceBadge = (bucket: 'high' | 'medium' | 'low', score: number) => {
    if (bucket === 'high') {
      return (
        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 text-xs font-black font-heading flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>High Confidence ({Math.round(score * 100)}%)</span>
        </span>
      );
    }
    if (bucket === 'medium') {
      return (
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/50 text-xs font-black font-heading flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Medium Confidence ({Math.round(score * 100)}%)</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full bg-slate-500/20 text-slate-300 border border-slate-400/50 text-xs font-black font-heading flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-slate-400" />
        <span>Low Confidence ({Math.round(score * 100)}%)</span>
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-full card-light p-4 sm:p-6 rounded-[32px] shadow-2xl border-2 border-indigo-200/80 relative overflow-hidden"
    >
      {/* Top Header: Phrasing note matching product principle #2 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          <span className="text-xs font-extrabold text-slate-600 font-heading uppercase tracking-wider">
            Possible Message Suggested by Cue Camera
          </span>
        </div>
        {getConfidenceBadge(primaryCandidate.confidenceBucket, primaryCandidate.confidence)}
      </div>

      {/* Live Hold Time Progress Bar */}
      {holdProgress > 0 && holdProgress < 1 && (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-75"
            style={{ width: `${Math.round(holdProgress * 100)}%` }}
          />
        </div>
      )}

      {/* Main Suggestion Banner */}
      <div className="my-4 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Big Icon */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-amber-100 to-yellow-200 border-2 border-amber-300 flex items-center justify-center text-4xl sm:text-5xl shadow-md shrink-0">
          {primaryCandidate.cue.icon}
        </div>

        <div className="flex-1 text-center sm:text-left">
          <span className="text-xs font-bold text-indigo-600 font-heading">
            {primaryCandidate.isPersonalized ? 'Personalized Learned Cue' : 'Starter Cue Pattern'}
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-indigo-950 font-heading leading-tight tracking-wide">
            "{primaryCandidate.cue.phrase}"
          </h3>

          {/* Detected signals chips */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-2.5">
            {primaryCandidate.matchedSignals.map((signal, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-heading"
              >
                {signal}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dual candidate option ("This or this?") if secondary candidate is close */}
      {secondaryCandidate && (
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
          <p className="text-xs font-extrabold text-purple-900 font-heading mb-2">
            Close match detected — could also be:
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{secondaryCandidate.cue.icon}</span>
              <span className="font-heading font-black text-sm text-slate-800">
                "{secondaryCandidate.cue.phrase}"
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                ({Math.round(secondaryCandidate.confidence * 100)}%)
              </span>
            </div>
            <button
              onClick={() => {
                playChime('pop');
                onConfirm(secondaryCandidate);
              }}
              className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-heading font-extrabold text-xs shadow-sm cursor-pointer"
            >
              Choose this instead
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons: 3 Big accessible buttons matching prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        {/* Button 1: Yes, say it */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            playChime('success');
            onConfirm(primaryCandidate);
          }}
          className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-black text-sm sm:text-base shadow-lg shadow-emerald-500/30 border border-emerald-300/60 cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <Check size={20} className="stroke-[3]" />
          <span>Yes, say it</span>
        </motion.button>

        {/* Button 2: Change it */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            playChime('pop');
            onCorrect(primaryCandidate);
          }}
          className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-heading font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 border border-amber-200 cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <Edit3 size={19} />
          <span>Change it</span>
        </motion.button>

        {/* Button 3: Not that */}
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            playChime('bubble');
            onDismiss(primaryCandidate);
          }}
          className="py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-black text-sm sm:text-base border border-slate-300 cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <X size={19} />
          <span>Not that</span>
        </motion.button>
      </div>

      {/* Expandable "Why this suggestion?" section */}
      <div className="pt-2 border-t border-slate-200/80">
        <button
          onClick={() => setShowWhy((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs font-bold font-heading text-slate-600 hover:text-indigo-900 cursor-pointer py-1"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle size={15} />
            Why this suggestion?
          </span>
          {showWhy ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <AnimatePresence>
          {showWhy && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5"
            >
              <p className="font-semibold">{primaryCandidate.explanation}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Signals evaluated: {primaryCandidate.matchedSignals.join(', ')}.
                Confidence is calculated from signal consistency, duration held, and tracking stability.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Disclaimer note matching product principle #5 */}
      <p className="text-[11px] font-semibold text-slate-500 text-center mt-3">
        Suggestions are guesses based on movement and expressions. A caregiver always decides.
      </p>
    </motion.div>
  );
};
