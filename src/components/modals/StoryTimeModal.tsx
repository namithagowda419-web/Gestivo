import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

interface Page {
  title: string;
  text: string;
  emoji: string;
  backdrop: string;
}

const STORY_PAGES: Page[] = [
  {
    title: 'Chapter 1: The Crystal Cave',
    text: 'Once upon a time in the glowing enchanted forest, little Aarvi and her fluffy blue bunny friend discovered a sparkly path lit by fireflies and magical purple crystals.',
    emoji: '✨🐰🌟',
    backdrop: 'from-purple-900 to-indigo-900',
  },
  {
    title: 'Chapter 2: Meeting Nimo',
    text: 'Along the winding trail, they met Nimo, the cheerful blue explorer buddy! "Welcome!" Nimo cheered. "Every step we take teaches us something wonderful!"',
    emoji: '💙🌳🐾',
    backdrop: 'from-blue-900 to-sky-950',
  },
  {
    title: 'Chapter 3: The Singing Dinosaur',
    text: 'Under a canopy of giant glowing mushrooms, a friendly baby green dino waved his little tail and sang a joyful tune. Together, all the forest friends held hands.',
    emoji: '🦖🍄🎵',
    backdrop: 'from-emerald-950 to-teal-900',
  },
  {
    title: 'Chapter 4: Big Dreams Come True',
    text: 'A golden star twinkled from the night sky: "You are brave, kind, and smart! Keep exploring, because small steps always lead to big dreams!"',
    emoji: '⭐💜🎉',
    backdrop: 'from-amber-950 to-purple-950',
  },
];

export const StoryTimeModal: React.FC = () => {
  const { activeModal, setActiveModal, voiceOutput, addActivity } = useGestivoStore();
  const [currentPage, setCurrentPage] = useState(0);

  const page = STORY_PAGES[currentPage];

  const handleReadAloud = () => {
    playChime('star');
    speakText(`${page.title}. ${page.text}`, voiceOutput);
  };

  const handleNext = () => {
    playChime('pop');
    if (currentPage < STORY_PAGES.length - 1) {
      setCurrentPage((p) => p + 1);
      speakText(STORY_PAGES[currentPage + 1].text, voiceOutput);
    } else {
      playChime('success');
      speakText('The end! What a wonderful story!', voiceOutput);
      addActivity('Read story: The Enchanted Forest Friends', 'activity', '📖');
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then((confettiModule) => {
          confettiModule.default({ particleCount: 70, spread: 60 });
        });
      }
    }
  };

  const handlePrev = () => {
    playChime('pop');
    if (currentPage > 0) {
      setCurrentPage((p) => p - 1);
      speakText(STORY_PAGES[currentPage - 1].text, voiceOutput);
    }
  };

  if (activeModal !== 'storyTime') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#25124f] via-[#351970] to-[#140a33] rounded-3xl p-5 sm:p-6 border-2 border-pink-400/50 shadow-2xl text-white relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">📖</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Enchanted Story Time
              </h3>
              <p className="text-xs text-pink-200">
                Page {currentPage + 1} of {STORY_PAGES.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Story Card Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className={`my-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-br ${page.backdrop} border border-white/20 shadow-xl flex flex-col justify-between min-h-[220px]`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl filter drop-shadow">{page.emoji}</span>
                <button
                  onClick={handleReadAloud}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold font-heading cursor-pointer border border-white/30"
                >
                  <Volume2 size={15} />
                  <span>Read to me</span>
                </button>
              </div>

              <h4 className="text-lg sm:text-xl font-black font-heading text-amber-200 mb-2">
                {page.title}
              </h4>
              <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-semibold">
                {page.text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Page Turn Controls */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15">
          <button
            onClick={handlePrev}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Previous</span>
          </button>

          <span className="text-xs font-bold text-purple-200">
            {currentPage + 1} / {STORY_PAGES.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer"
          >
            <span>{currentPage === STORY_PAGES.length - 1 ? 'Finish Story ⭐' : 'Next Page'}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
