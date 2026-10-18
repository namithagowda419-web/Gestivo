import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CarouselItem } from '../../types';
import { useGestivoStore } from '../../store/useGestivoStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { playChime } from '../../utils/speech';

const quickButtonsData: CarouselItem[] = [
  {
    id: 'i-want',
    title: 'I want',
    subtitle: 'Express needs & wants',
    phrase: 'I want',
    icon: '✋',
    gradient: 'from-[#FFB347] to-[#FF8C42]',
    glowColor: 'rgba(255, 140, 66, 0.45)',
    accentBorder: 'border-amber-200/60',
  },
  {
    id: 'im-hungry',
    title: "I'm hungry",
    subtitle: 'Food & Drink',
    phrase: "I'm hungry, I want food",
    icon: '🍔',
    gradient: 'from-[#FF8DA1] to-[#FF5E7E]',
    glowColor: 'rgba(255, 94, 126, 0.45)',
    accentBorder: 'border-pink-200/60',
  },
  {
    id: 'im-thirsty',
    title: "I'm thirsty",
    subtitle: 'Water & Drinks',
    phrase: "I'm thirsty, please give me water",
    icon: '🥤',
    gradient: 'from-[#5CC8FF] to-[#3D8BFF]',
    glowColor: 'rgba(61, 139, 255, 0.45)',
    accentBorder: 'border-sky-200/60',
  },
  {
    id: 'want-to-play',
    title: 'I want to play',
    subtitle: 'Games & Fun',
    phrase: 'I want to play and have fun',
    icon: '⚽',
    gradient: 'from-[#6BE675] to-[#2ECC71]',
    glowColor: 'rgba(46, 204, 113, 0.45)',
    accentBorder: 'border-emerald-200/60',
  },
  {
    id: 'i-feel',
    title: 'I feel',
    subtitle: 'Emotions',
    phrase: 'I feel',
    icon: '💜',
    gradient: 'from-[#C084FC] to-[#7C4DFF]',
    glowColor: 'rgba(124, 77, 255, 0.45)',
    accentBorder: 'border-purple-200/60',
  },
  {
    id: 'yes-no',
    title: 'Yes / No',
    subtitle: 'Responses',
    phrase: 'Yes or No',
    icon: '😊',
    gradient: 'from-[#35E0FF] to-[#0EA5E9]',
    glowColor: 'rgba(14, 165, 233, 0.45)',
    accentBorder: 'border-cyan-200/60',
  },
];

export const QuickCommunicationCarousel: React.FC = () => {
  const { addToSentenceStrip } = useGestivoStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const handleButtonClick = (item: CarouselItem) => {
    addToSentenceStrip({
      label: item.title,
      icon: item.icon,
      phrase: item.phrase,
    });
  };

  const nextSlide = () => {
    playChime('pop');
    setActiveIndex((prev) => (prev + 1) % quickButtonsData.length);
  };

  const prevSlide = () => {
    playChime('pop');
    setActiveIndex((prev) => (prev - 1 + quickButtonsData.length) % quickButtonsData.length);
  };

  return (
    <div className="relative w-full glass-panel-glow p-4 sm:p-5 rounded-3xl border border-white/25 shadow-2xl">
      {/* Header title */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base sm:text-lg font-extrabold text-white font-heading tracking-wide flex items-center gap-2">
          <span>Quick Communication</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
            Tap to Speak
          </span>
        </h3>

        {/* Carousel arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={prevSlide}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="Previous button"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextSlide}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            aria-label="Next button"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* 6 Chunky Buttons Grid / Carousel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {quickButtonsData.map((item) => {
          return (
            <motion.button
              key={item.id}
              id={`quick-btn-${item.id}`}
              onClick={() => handleButtonClick(item)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.95, y: 3 }}
              className={`btn-chunky relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-[26px] bg-gradient-to-b ${item.gradient} text-white border-2 ${item.accentBorder} text-center select-none cursor-pointer w-full min-h-[115px] sm:min-h-[135px] overflow-hidden`}
              style={{
                boxShadow: `0 8px 0 rgba(0,0,0,0.22), 0 14px 20px ${item.glowColor}`,
              }}
            >
              {/* Inner highlight sheen */}
              <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none rounded-t-[24px]" />

              {/* Big Icon */}
              <span className="text-3xl sm:text-4xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)] mb-1 transform group-hover:scale-110 transition-transform">
                {item.icon}
              </span>

              {/* Bold Label */}
              <span className="font-heading font-black text-sm sm:text-base leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] tracking-wide">
                {item.title}
              </span>

              {/* Smaller Subtitle */}
              <span className="text-[10px] sm:text-[11px] font-bold text-white/90 leading-tight mt-0.5 line-clamp-1">
                {item.subtitle}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Carousel dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {quickButtonsData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              playChime('pop');
              setActiveIndex(idx);
            }}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              activeIndex === idx
                ? 'w-6 h-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-md shadow-cyan-400/50'
                : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
