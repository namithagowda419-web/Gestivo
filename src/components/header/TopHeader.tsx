import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Sun, Volume2, Delete, Trash2, Menu } from 'lucide-react';
import { StarMascot } from '../mascots/Mascots';
import { useGestivoStore } from '../../store/useGestivoStore';
import { SentenceHelperCard } from '../sentence/SentenceHelperCard';

interface TopHeaderProps {
  onToggleMobileMenu?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileMenu }) => {
  const { sentenceStrip, backspaceSentenceStrip, clearSentenceStrip, speakSentence } = useGestivoStore();
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const mins = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const formattedHours = hours.toString().padStart(2, '0');

      setCurrentDateTime(`${dayName}, ${dayNum} ${monthName} ${year} ${formattedHours}:${mins} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full flex flex-col gap-4 z-20">
      {/* Top greeting and live date bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Mobile menu trigger + Explorer Greeting */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2.5 rounded-2xl glass-panel text-white hover:bg-white/20 transition-all cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>
          )}

          {/* Greeting Speech Bubble matching the screenshot */}
          <div className="relative glass-panel-glow px-4 sm:px-5 py-2.5 rounded-3xl flex items-center gap-3 border border-purple-300/40">
            <div className="relative">
              <StarMascot size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-wide font-heading leading-tight">
                  Hello, Little Explorer!
                </h2>
                <span className="text-amber-300 text-sm">⭐</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-purple-200/90 leading-tight">
                Small steps... Big dreams! <span className="text-pink-300">💜</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Date/Time Badge matching screenshot: e.g. "Tue, 16 Oct 2026 10:24 AM" with sun/star icon */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl glass-panel border border-white/20 text-xs sm:text-sm font-bold text-sky-200 shadow-md ml-auto">
          <Sun size={17} className="text-amber-400 animate-spin" style={{ animationDuration: '12s' }} />
          <span>{currentDateTime || 'Tue, 16 Oct 2026 10:24 AM'}</span>
        </div>
      </div>

      {/* Interactive AAC Sentence Strip */}
      <div className="w-full glass-panel-glow p-3 sm:p-4 rounded-3xl border border-white/25 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Strip Area */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1 min-h-[52px] scrollbar-thin">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-300/80 px-2 shrink-0 flex items-center gap-1 font-heading">
            <Sparkles size={14} className="text-amber-300" />
            <span>Sentence:</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <AnimatePresence>
              {sentenceStrip.length === 0 ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  className="text-xs sm:text-sm text-slate-300 italic px-2"
                >
                  Tap buttons or tiles to build your sentence...
                </motion.span>
              ) : (
                sentenceStrip.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ scale: 0.6, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-400/90 to-orange-500/90 text-white font-extrabold text-xs sm:text-sm shadow-md border border-amber-200/60"
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="font-heading">{item.label}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Action Buttons for Sentence Strip */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={speakSentence}
            disabled={sentenceStrip.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/30 border border-cyan-300/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-heading"
            aria-label="Speak sentence aloud"
          >
            <Volume2 size={16} />
            <span>Speak</span>
          </button>

          <button
            onClick={backspaceSentenceStrip}
            disabled={sentenceStrip.length === 0}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold border border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Backspace"
            aria-label="Backspace"
          >
            <Delete size={17} />
          </button>

          <button
            onClick={clearSentenceStrip}
            disabled={sentenceStrip.length === 0}
            className="p-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-400/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Clear all"
            aria-label="Clear all"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Intelligent Sentence Helper Card */}
      <SentenceHelperCard />
    </header>
  );
};
