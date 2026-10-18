import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Target, Bell, Gamepad2, Heart, Camera } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const QuickActionsCard: React.FC<{ onNavigate?: (view: string) => void }> = ({ onNavigate }) => {
  const { setActiveModal, voiceOutput } = useGestivoStore();

  const handleAction = (type: string) => {
    playChime('pop');
    if (type === 'cue-camera') {
      if (onNavigate) onNavigate('cue-camera');
      speakText('Opening Cue Camera', voiceOutput);
    } else if (type === 'history') {
      if (onNavigate) onNavigate('history');
      else setActiveModal('history');
      speakText('Opening history log', voiceOutput);
    } else if (type === 'goals') {
      setActiveModal('manageGoals');
      speakText('Managing goals', voiceOutput);
    } else if (type === 'reminder') {
      setActiveModal('setReminder');
      speakText('Set a reminder', voiceOutput);
    } else if (type === 'play') {
      if (onNavigate) onNavigate('play');
      else setActiveModal('memoryGame');
      speakText("Let's play and learn!", voiceOutput);
    }
  };

  return (
    <div className="w-full glass-panel-glow p-4 sm:p-5 rounded-[28px] border border-white/25 shadow-2xl flex flex-col justify-between relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

      <div>
        {/* Sparkle Header matching screenshot */}
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/15">
          <Sparkles className="text-amber-300" size={20} />
          <h3 className="text-lg sm:text-xl font-extrabold text-white font-heading tracking-wide">
            Quick Actions
          </h3>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          {/* Cue Camera Button */}
          <motion.button
            id="quick-action-cue-camera"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction('cue-camera')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-600/30 hover:from-cyan-500/30 hover:to-blue-600/40 text-white font-heading font-extrabold text-sm border border-cyan-400/40 shadow-md cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/30 flex items-center justify-center text-cyan-200">
              <Camera size={18} />
            </div>
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Cue Camera</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-400/30 text-cyan-100 uppercase">
                Live
              </span>
            </div>
          </motion.button>

          {/* View History Button */}
          <motion.button
            id="quick-action-history"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction('history')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-heading font-extrabold text-sm border border-white/20 shadow-md cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center text-sky-200">
              <Clock size={18} />
            </div>
            <span>View History</span>
          </motion.button>

          {/* Manage Goals Button */}
          <motion.button
            id="quick-action-goals"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction('goals')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-heading font-extrabold text-sm border border-white/20 shadow-md cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/30 flex items-center justify-center text-purple-200">
              <Target size={18} />
            </div>
            <span>Manage Goals</span>
          </motion.button>

          {/* Set Reminder Button */}
          <motion.button
            id="quick-action-reminder"
            whileHover={{ scale: 1.02, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleAction('reminder')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-heading font-extrabold text-sm border border-white/20 shadow-md cursor-pointer transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/30 flex items-center justify-center text-pink-200">
              <Bell size={18} />
            </div>
            <span>Set Reminder</span>
          </motion.button>

          {/* Play & Learn (Yellow/Gold Button with Controller Icon) matching screenshot */}
          <motion.button
            id="quick-action-play"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleAction('play')}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-indigo-950 font-heading font-black text-base shadow-xl shadow-amber-400/30 border-2 border-yellow-200 cursor-pointer transition-all mt-2"
          >
            <Gamepad2 size={22} className="text-indigo-900" />
            <span>Play & Learn</span>
          </motion.button>
        </div>
      </div>

      {/* Pink Cat Mascot + Wooden Signboard "You can do it!" with heart matching screenshot */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-end justify-between gap-2">
        {/* Wooden Signboard */}
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative px-3.5 py-2 rounded-xl bg-gradient-to-b from-[#8B5A2B] to-[#5C3A1E] border-2 border-[#D2B48C] text-amber-100 shadow-lg text-center select-none"
        >
          {/* Wooden post */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-2 h-3 bg-[#5C3A1E]" />
          <div className="flex items-center gap-1.5 justify-center">
            <span className="font-heading font-black text-xs sm:text-sm tracking-wide text-amber-100 drop-shadow">
              You can do it!
            </span>
            <Heart size={14} className="text-pink-400 fill-pink-400 animate-pulse" />
          </div>
        </motion.div>

        {/* Pink Cat Mascot Image matching screenshot */}
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 relative"
        >
          <img
            src="/assets/pink-cat.png"
            alt="Fluffy pink-and-white kitten mascot with purple star eyes"
            width={80}
            height={80}
            loading="lazy"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_10px_rgba(244,114,182,0.5)] cursor-pointer"
            onClick={() => {
              playChime('bubble');
              speakText('Meow! You are doing amazing! Keep shining!', voiceOutput);
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/pink-cat.jpeg';
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
