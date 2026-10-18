import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { playChime } from '../../utils/speech';

export const HeroBanner: React.FC<{ onExploreClick?: () => void }> = ({ onExploreClick }) => {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden glass-panel-glow border border-white/30 p-2 sm:p-3 shadow-2xl">
      {/* Background glow and magical cave gradient backdrop */}
      <div className="relative w-full h-[230px] sm:h-[300px] md:h-[360px] lg:h-[400px] rounded-2xl overflow-hidden bg-gradient-to-tr from-purple-950 via-indigo-900 to-sky-950 flex items-center justify-center">
        {/* Glowing crystal accents */}
        <div className="absolute top-4 left-6 w-28 h-28 bg-cyan-400/25 rounded-full blur-2xl" />
        <div className="absolute bottom-6 right-8 w-36 h-36 bg-pink-500/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl" />

        {/* Hero image with kids and mascots - screen blend mode blends black into space background */}
        <motion.img
          src="/assets/kids-pets.png"
          alt="Boy in blue hoodie waving, girl in pink, and plush animal mascots exploring together"
          width={1536}
          height={1024}
          className="w-full h-full object-cover object-center filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.5)] transition-transform duration-700 hover:scale-[1.02] mix-blend-screen"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/assets/kids-pets.jpeg';
          }}
        />

        {/* Enchanted Star Ribbon Banner: "⭐ Explore & Play" matching screenshot */}
        <motion.button
          type="button"
          id="hero-explore-play"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          onClick={() => {
            playChime('star');
            if (onExploreClick) onExploreClick();
          }}
          className="absolute top-4 left-4 sm:top-6 sm:left-6 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white font-extrabold text-sm sm:text-base md:text-lg shadow-xl shadow-orange-500/40 border-2 border-yellow-200/80 flex items-center gap-2 cursor-pointer select-none font-heading"
          whileHover={{ scale: 1.06, rotate: -1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Star className="text-yellow-200 fill-yellow-200 animate-spin" style={{ animationDuration: '8s' }} size={18} />
          <span className="tracking-wide">Explore & Play</span>
          <Sparkles className="text-yellow-100" size={16} />
        </motion.button>

        {/* Ambient floating stars over hero */}
        <motion.div
          animate={{ y: [0, -8, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-8 right-8 text-yellow-300 text-2xl drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]"
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [0, 8, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1, ease: 'easeInOut' }}
          className="absolute bottom-12 left-12 text-cyan-300 text-xl drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]"
        >
          🌟
        </motion.div>
      </div>
    </div>
  );
};
