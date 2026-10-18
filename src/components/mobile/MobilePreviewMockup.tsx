import React from 'react';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Clock, User, Mic } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const MobilePreviewMockup: React.FC = () => {
  const { profile, addToSentenceStrip, voiceOutput } = useGestivoStore();

  const miniButtons = [
    { label: 'I want', phrase: 'I want', icon: '✋', color: 'from-amber-400 to-orange-500' },
    { label: "I'm hungry", phrase: "I'm hungry", icon: '🍔', color: 'from-pink-400 to-rose-500' },
    { label: "I'm thirsty", phrase: "I'm thirsty", icon: '🥤', color: 'from-sky-400 to-blue-500' },
    { label: 'I want to play', phrase: 'I want to play', icon: '⚽', color: 'from-emerald-400 to-green-500' },
    { label: 'I feel', phrase: 'I feel', icon: '💜', color: 'from-purple-400 to-violet-500' },
    { label: 'Yes / No', phrase: 'Yes or No', icon: '😊', color: 'from-cyan-400 to-teal-500' },
  ];

  const handleMiniClick = (item: typeof miniButtons[0]) => {
    addToSentenceStrip({
      label: item.label,
      icon: item.icon,
      phrase: item.phrase,
    });
  };

  return (
    <div className="w-full flex flex-col xl:flex-row items-center justify-center gap-4 py-2">
      {/* Realistic Smartphone Mockup */}
      <div className="relative w-[270px] sm:w-[290px] h-[550px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 ring-2 ring-purple-500/30 flex flex-col justify-between overflow-hidden">
        {/* Phone Speaker & Dynamic Island Camera Notch */}
        <div className="absolute top-4 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end px-3">
            <div className="w-2 h-2 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Screen Content */}
        <div className="w-full h-full rounded-[34px] overflow-hidden bg-gradient-to-b from-[#180838] via-[#241355] to-[#0f1f50] p-3 pt-7 flex flex-col justify-between text-white border border-white/10 relative">
          <div>
            {/* Mobile Header: GESTIVO - Play • Learn • Grow matching screenshot */}
            <div className="text-center pb-2 border-b border-white/15">
              <h4 className="text-sm font-black tracking-wide text-white font-heading">
                GESTIVO
              </h4>
              <p className="text-[9px] font-bold text-cyan-300">
                Play • Learn • Grow
              </p>
            </div>

            {/* Greeting: "Hello, Aarvi! Let's explore together 💜" */}
            <div className="my-2 p-2 rounded-xl bg-white/10 border border-white/15 text-center">
              <p className="text-[11px] font-extrabold font-heading text-white leading-tight">
                Hello, {profile.name}! Let's explore together <span className="text-pink-300">💜</span>
              </p>
            </div>

            {/* 2x3 Mini Grid of buttons matching screenshot */}
            <div className="grid grid-cols-2 gap-2 my-2">
              {miniButtons.map((btn, i) => (
                <button
                  key={i}
                  onClick={() => handleMiniClick(btn)}
                  className={`p-2 rounded-2xl bg-gradient-to-r ${btn.color} text-white font-heading font-black text-[11px] flex flex-col items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer`}
                >
                  <span className="text-xl mb-0.5">{btn.icon}</span>
                  <span className="leading-tight truncate">{btn.label}</span>
                </button>
              ))}
            </div>

            {/* "Tap to speak..." Voice Bar matching screenshot */}
            <div
              onClick={() => {
                playChime('pop');
                speakText('Tap to speak: Voice recognition ready', voiceOutput);
              }}
              className="mt-2 px-3 py-2 rounded-full bg-white/10 border border-cyan-300/40 flex items-center justify-between text-[11px] cursor-pointer hover:bg-white/15"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-200">
                  <Mic size={13} />
                </div>
                <span className="font-heading font-bold text-slate-200">Tap to speak...</span>
              </div>
              <span className="text-[10px] text-cyan-300">🎙️</span>
            </div>
          </div>

          {/* Bottom Tab Bar: Home, Board, History, Profile matching screenshot */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-around text-slate-300 text-[10px] font-heading font-bold">
            <div className="flex flex-col items-center gap-0.5 text-cyan-300">
              <Home size={15} />
              <span>Home</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white cursor-pointer">
              <MessageSquare size={15} />
              <span>Board</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white cursor-pointer">
              <Clock size={15} />
              <span>History</span>
            </div>
            <div className="flex flex-col items-center gap-0.5 hover:text-white cursor-pointer">
              <User size={15} />
              <span>Profile</span>
            </div>
          </div>
        </div>
      </div>

      {/* Speech Bubble beside it: "Different abilities... Same big dreams! 💙" with girl-with-bunny image */}
      <div className="flex flex-col items-center sm:items-start gap-3 max-w-[280px]">
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative bg-white/95 text-slate-800 p-4 rounded-3xl shadow-xl border-2 border-sky-300 text-sm font-extrabold font-heading text-center sm:text-left leading-snug select-none"
        >
          Different abilities...
          <br />
          <span className="text-blue-600">Same big dreams! 💙</span>
          {/* Bubble tail */}
          <div className="hidden sm:block absolute top-1/2 -left-3 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-r-[12px] border-r-white/95 border-b-[8px] border-b-transparent" />
        </motion.div>

        {/* Decorative Girl with Bunny Image matching prompt */}
        <motion.div
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-purple-400/80 shadow-xl shadow-purple-500/20 bg-gradient-to-br from-purple-200 to-pink-200 cursor-pointer"
          onClick={() => {
            playChime('star');
            speakText('Different abilities... Same big dreams!', voiceOutput);
          }}
        >
          <img
            src="/assets/girl-bunny.png"
            alt="Girl with Bunny Companion"
            width={144}
            height={144}
            loading="lazy"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};
