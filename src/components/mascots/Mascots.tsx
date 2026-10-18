import React from 'react';
import { motion } from 'framer-motion';

// Pink Cat Mascot: The fluffy pink-and-white kitten with purple star eyes, pink bow and heart collar
export const NimoMascot: React.FC<{
  size?: number;
  speechText?: string;
  className?: string;
  showBubble?: boolean;
}> = ({
  size = 64,
  speechText = "Hi! I'm your learning buddy! Let's explore together! 💖",
  className = '',
  showBubble = true,
}) => {
  return (
    <div className={`relative flex items-center gap-3 select-none ${className}`}>
      <motion.div
        animate={{ y: [0, -5, 0], rotate: [0, -1.5, 1.5, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative shrink-0 cursor-pointer"
        whileHover={{ scale: 1.12, rotate: 3 }}
        whileTap={{ scale: 0.94 }}
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-pink-400/20 to-purple-500/20 p-1 border border-pink-300/40 shadow-lg shadow-pink-500/20 backdrop-blur-sm flex items-center justify-center">
          <img
            src="/assets/pink-cat.png"
            alt="Fluffy pink-and-white kitten helper mascot with star eyes"
            width={size}
            height={size}
            loading="lazy"
            className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(244,114,182,0.4)]"
            onError={(e) => {
              // Graceful fallback to jpeg if png is unavailable
              (e.currentTarget as HTMLImageElement).src = '/assets/pink-cat.jpeg';
            }}
          />
        </div>
      </motion.div>

      {showBubble && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: -10 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="relative bg-white/95 text-slate-800 text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg border border-pink-200/90 max-w-[260px] sm:max-w-xs leading-snug"
        >
          {speechText}
          {/* Speech bubble tail */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-r-[9px] border-r-white/95 border-b-[7px] border-b-transparent" />
        </motion.div>
      )}
    </div>
  );
};

// Direct export alias for PinkCatMascot
export const PinkCatMascot = NimoMascot;

// Girl Bunny Avatar: Circular/rounded blob avatar for child profile & empty states
export const GirlBunnyAvatar: React.FC<{
  size?: number;
  className?: string;
  showOnlineDot?: boolean;
}> = ({ size = 64, className = '', showOnlineDot = false }) => {
  return (
    <div className={`relative shrink-0 select-none ${className}`} style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden border-2 border-purple-400/80 shadow-lg shadow-purple-500/25 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
        <img
          src="/assets/girl-bunny.png"
          alt="Girl holding a white bunny with pink bow headband"
          width={size}
          height={size}
          loading="lazy"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
          }}
        />
      </div>
      {showOnlineDot && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
      )}
    </div>
  );
};


// Green Dino Mascot: Friendly cute herbivore baby dino
export const BabyDinoMascot: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => {
  return (
    <motion.div
      animate={{ rotate: [-2, 2, -2], y: [0, -3, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Back spikes */}
        <polygon points="20,25 25,15 30,25" fill="#2ECC71" />
        <polygon points="32,22 37,12 42,22" fill="#2ECC71" />
        <polygon points="44,22 49,14 54,22" fill="#2ECC71" />
        {/* Body */}
        <ellipse cx="42" cy="46" rx="26" ry="22" fill="#4ADE80" filter="drop-shadow(0 4px 8px rgba(74,222,128,0.4))" />
        <ellipse cx="46" cy="50" rx="16" ry="14" fill="#BBF7D0" />
        {/* Head */}
        <circle cx="30" cy="36" r="16" fill="#4ADE80" />
        {/* Eye */}
        <circle cx="26" cy="33" r="3.5" fill="#064E3B" />
        <circle cx="27" cy="32" r="1.3" fill="#FFFFFF" />
        {/* Blush */}
        <ellipse cx="23" cy="40" rx="3.5" ry="2" fill="#F472B6" />
        {/* Cute Smile */}
        <path d="M28 41 Q32 44 36 41" stroke="#064E3B" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* Feet */}
        <ellipse cx="32" cy="67" rx="6" ry="4" fill="#22C55E" />
        <ellipse cx="50" cy="67" rx="6" ry="4" fill="#22C55E" />
        {/* Tail */}
        <path d="M64 48 Q74 44 76 36 Q71 52 62 56 Z" fill="#4ADE80" />
      </svg>
    </motion.div>
  );
};

// Purple Blob Mascot: Squishy glowing friendly buddy
export const PurpleBlobMascot: React.FC<{ size?: number; className?: string }> = ({ size = 44, className = '' }) => {
  return (
    <motion.div
      animate={{ scaleY: [1, 1.08, 0.95, 1], scaleX: [1, 0.96, 1.05, 1], y: [0, -4, 0] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-block ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M35 10 C48 10, 60 20, 60 38 C60 52, 48 60, 35 60 C22 60, 10 52, 10 38 C10 20, 22 10, 35 10 Z"
          fill="url(#purpleBlobGrad)"
          filter="drop-shadow(0 4px 10px rgba(168,85,247,0.5))"
        />
        {/* Antenna / Star puff */}
        <circle cx="35" cy="8" r="4" fill="#E9D5FF" />
        {/* Eyes */}
        <circle cx="28" cy="32" r="3.5" fill="#2E1065" />
        <circle cx="29" cy="31" r="1.3" fill="#FFFFFF" />
        <circle cx="42" cy="32" r="3.5" fill="#2E1065" />
        <circle cx="43" cy="31" r="1.3" fill="#FFFFFF" />
        {/* Cheeks */}
        <ellipse cx="22" cy="38" rx="3.5" ry="2" fill="#F472B6" opacity="0.8" />
        <ellipse cx="48" cy="38" rx="3.5" ry="2" fill="#F472B6" opacity="0.8" />
        {/* Smile */}
        <path d="M31 38 Q35 43 39 38" stroke="#2E1065" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        <defs>
          <linearGradient id="purpleBlobGrad" x1="10" y1="10" x2="60" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C084FC" />
            <stop offset="1" stopColor="#7E22CE" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

// Glowing Yellow Star Mascot: GESTIVO star icon
export const StarMascot: React.FC<{ size?: number; className?: string }> = ({ size = 32, className = '' }) => {
  return (
    <motion.div
      animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon
          points="20,2 25,14 38,15 28,24 31,37 20,30 9,37 12,24 2,15 15,14"
          fill="url(#starGrad)"
          filter="drop-shadow(0 2px 6px rgba(251,191,36,0.6))"
        />
        {/* Cute Face */}
        <circle cx="16" cy="20" r="1.6" fill="#78350F" />
        <circle cx="24" cy="20" r="1.6" fill="#78350F" />
        <path d="M18 24 Q20 26 22 24" stroke="#78350F" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <defs>
          <linearGradient id="starGrad" x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};
