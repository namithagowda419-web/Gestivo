import React from 'react';
import { motion } from 'framer-motion';

interface EnchantedForestBackgroundProps {
  isPaused?: boolean;
}

export const EnchantedForestBackground: React.FC<EnchantedForestBackgroundProps> = ({ isPaused = false }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#15072e] via-[#231154] to-[#0d1e4e]">
      {/* Deep ambient radial glow orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-600/25 blur-[120px]" />
      <div className="absolute top-1/4 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-500/20 blur-[140px]" />
      <div className="absolute top-2/3 left-1/3 w-[36rem] h-[36rem] rounded-full bg-cyan-600/15 blur-[150px]" />
      <div className="absolute -bottom-20 right-10 w-96 h-96 rounded-full bg-pink-600/18 blur-[130px]" />

      {/* Layered Silhouettes: Tree trunks and enchanted canopy branches */}
      <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <defs>
          <linearGradient id="treeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c1452" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0c051a" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="crystalGlow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5CC8FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#9333EA" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Left Enchanted Tree Trunk */}
        <path d="M-40 0 C60 120 40 400 -20 900 L0 900 L0 0 Z" fill="url(#treeGrad)" />
        <path d="M-20 180 C80 200 120 140 220 160 C150 175 100 230 40 240 Z" fill="url(#treeGrad)" />
        <path d="M-10 380 C110 390 140 330 260 350 C180 370 110 430 30 440 Z" fill="url(#treeGrad)" />

        {/* Right Enchanted Tree Trunk */}
        <path d="M1480 0 C1380 150 1400 450 1460 900 L1440 900 L1440 0 Z" fill="url(#treeGrad)" />
        <path d="M1460 160 C1360 180 1320 130 1220 150 C1290 170 1340 220 1400 230 Z" fill="url(#treeGrad)" />
        <path d="M1450 420 C1340 430 1300 370 1180 390 C1260 410 1330 470 1410 480 Z" fill="url(#treeGrad)" />
      </svg>

      {/* Hanging Magical Lanterns */}
      <div className="absolute top-0 left-28 hidden md:block">
        <svg width="40" height="110" viewBox="0 0 40 110" fill="none">
          <line x1="20" y1="0" x2="20" y2="70" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          {/* Lantern frame */}
          <polygon points="12,70 28,70 32,95 8,95" fill="#f59e0b" opacity="0.8" />
          <polygon points="15,74 25,74 28,91 12,91" fill="#fef08a" />
          {/* Glow */}
          <circle cx="20" cy="82" r="14" fill="#fef08a" opacity="0.3" filter="blur(6px)" />
        </svg>
      </div>

      <div className="absolute top-0 right-36 hidden md:block">
        <svg width="40" height="140" viewBox="0 0 40 140" fill="none">
          <line x1="20" y1="0" x2="20" y2="95" stroke="#fcd34d" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
          <polygon points="10,95 30,95 34,125 6,125" fill="#ec4899" opacity="0.8" />
          <polygon points="14,99 26,99 29,121 11,121" fill="#fbcfe8" />
          <circle cx="20" cy="110" r="16" fill="#fbcfe8" opacity="0.35" filter="blur(6px)" />
        </svg>
      </div>

      {/* Floating Glowing Crystals at Bottom Edges */}
      <div className="absolute -bottom-6 left-6 hidden lg:block opacity-75">
        <svg width="90" height="90" viewBox="0 0 100 100" fill="none">
          {/* Main Crystal */}
          <polygon points="50,10 70,40 60,85 40,85 30,40" fill="url(#crystalGrad1)" filter="drop-shadow(0 0 12px rgba(92,200,255,0.7))" />
          <polygon points="50,10 60,85 50,85" fill="#bae6fd" opacity="0.7" />
          {/* Small companion crystal */}
          <polygon points="25,35 40,55 35,85 20,85 15,55" fill="url(#crystalGrad2)" filter="drop-shadow(0 0 8px rgba(192,132,252,0.6))" />
          <defs>
            <linearGradient id="crystalGrad1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="crystalGrad2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e879f9" />
              <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Glowing Mushrooms at Bottom Right */}
      <div className="absolute -bottom-2 right-12 hidden lg:block opacity-80">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          {/* Stems */}
          <path d="M35 50 Q36 65 38 78 L46 78 Q43 65 41 50 Z" fill="#e2e8f0" opacity="0.8" />
          {/* Mushroom Cap */}
          <path d="M22 50 C22 30, 58 30, 58 50 C58 52, 22 52, 22 50 Z" fill="#ec4899" filter="drop-shadow(0 0 10px rgba(236,72,153,0.8))" />
          {/* Spots */}
          <circle cx="32" cy="40" r="3" fill="#ffffff" opacity="0.9" />
          <circle cx="46" cy="38" r="2.5" fill="#ffffff" opacity="0.9" />
          <circle cx="40" cy="46" r="2" fill="#ffffff" opacity="0.9" />
        </svg>
      </div>

      {/* Animated Fireflies and Twinkling Stars */}
      {[
        { top: '12%', left: '18%', delay: 0, dur: 4, size: 8, color: '#fef08a' },
        { top: '24%', left: '42%', delay: 1.2, dur: 3.5, size: 6, color: '#67e8f9' },
        { top: '18%', left: '76%', delay: 0.7, dur: 4.2, size: 7, color: '#fbcfe8' },
        { top: '48%', left: '88%', delay: 2.1, dur: 3.8, size: 9, color: '#fde047' },
        { top: '65%', left: '12%', delay: 1.5, dur: 4.5, size: 7, color: '#86efac' },
        { top: '82%', left: '48%', delay: 0.3, dur: 3.2, size: 8, color: '#c084fc' },
        { top: '35%', left: '26%', delay: 1.8, dur: 5, size: 6, color: '#fde047' },
        { top: '70%', left: '78%', delay: 2.4, dur: 3.7, size: 8, color: '#67e8f9' },
        { top: '88%', left: '28%', delay: 0.9, dur: 4.1, size: 6, color: '#fef08a' },
      ].map((star, idx) => (
        <motion.div
          key={idx}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            backgroundColor: star.color,
            boxShadow: `0 0 12px 2px ${star.color}`,
          }}
          animate={
            isPaused
              ? { opacity: 0.4, scale: 1, y: 0, x: 0 }
              : {
                  y: [0, -12, 0],
                  x: [0, 6, -4, 0],
                  opacity: [0.2, 0.95, 0.3],
                  scale: [0.8, 1.3, 0.8],
                }
          }
          transition={
            isPaused
              ? undefined
              : {
                  duration: star.dur,
                  repeat: Infinity,
                  delay: star.delay,
                  ease: 'easeInOut',
                }
          }
        />
      ))}
    </div>
  );
};
