import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Target, Sparkles, HeartHandshake, Smile } from 'lucide-react';
import { StarMascot } from '../mascots/Mascots';
import { playChime, speakText } from '../../utils/speech';
import { useGestivoStore } from '../../store/useGestivoStore';

const CURRENT_YEAR = new Date().getFullYear();

export const FeatureStrip: React.FC = () => {
  const { voiceOutput } = useGestivoStore();

  const features = [
    { label: 'Builds Communication', icon: MessageCircle, color: 'text-cyan-300' },
    { label: 'Improves Focus', icon: Target, color: 'text-amber-300' },
    { label: 'Encourages Independence', icon: Sparkles, color: 'text-emerald-300' },
    { label: 'Supports Families', icon: HeartHandshake, color: 'text-pink-300' },
    { label: 'Creates Happy Moments', icon: Smile, color: 'text-purple-300' },
  ];

  return (
    <footer className="w-full mt-8 pt-4 pb-6 z-20">
      {/* Glass Bar matching screenshot */}
      <div className="w-full glass-panel-glow p-4 sm:p-5 rounded-3xl border border-white/25 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-5 relative overflow-hidden">
        {/* Left text: "More Than an App..." matching screenshot */}
        <div className="text-center lg:text-left shrink-0">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-300 block font-heading">
            Our Purpose
          </span>
          <h4 className="text-lg sm:text-xl font-extrabold text-white font-heading tracking-wide">
            More Than an App...
          </h4>
        </div>

        {/* 5 items with icons matching screenshot:
            Builds Communication · Improves Focus · Encourages Independence · Supports Families · Creates Happy Moments */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-5 text-xs sm:text-sm font-heading font-extrabold text-white">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 transition-all cursor-default select-none shadow-sm"
              >
                <Icon size={16} className={feat.color} />
                <span>{feat.label}</span>
              </div>
            );
          })}
        </div>

        {/* Right Sticky Note: "Small steps... Make big dreams! 💜" matching screenshot */}
        <motion.div
          animate={{ rotate: [-2, 2, -2] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          onClick={() => {
            playChime('star');
            speakText('Small steps... Make big dreams!', voiceOutput);
          }}
          className="relative px-4 py-2.5 rounded-2xl bg-gradient-to-tr from-amber-300 to-yellow-200 text-indigo-950 font-heading font-black text-xs sm:text-sm shadow-xl shadow-amber-400/30 border border-yellow-100 flex items-center gap-2 cursor-pointer select-none shrink-0"
        >
          {/* Push pin decoration */}
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          <span>Small steps... Make big dreams!</span>
          <span className="text-purple-700">💜</span>
        </motion.div>
      </div>

      {/* GESTIVO Logo Watermark at bottom-right matching screenshot */}
      <div className="w-full flex items-center justify-between text-xs text-purple-200/60 font-semibold px-4 pt-4">
        <span>© {CURRENT_YEAR} GESTIVO. All rights reserved. AAC Accessibility First.</span>

        <div className="flex items-center gap-2 font-heading font-black tracking-wider text-sm text-white/50 select-none">
          <StarMascot size={18} />
          <span>GESTIVO</span>
        </div>
      </div>
    </footer>
  );
};
