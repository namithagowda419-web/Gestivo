import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

interface Shape {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const SHAPES: Shape[] = [
  { id: 'star', name: 'Golden Star', icon: '⭐', color: 'from-amber-400 to-yellow-500' },
  { id: 'heart', name: 'Pink Heart', icon: '💖', color: 'from-pink-400 to-rose-500' },
  { id: 'circle', name: 'Blue Circle', icon: '🔵', color: 'from-sky-400 to-blue-500' },
  { id: 'square', name: 'Green Square', icon: '🟩', color: 'from-emerald-400 to-green-500' },
  { id: 'triangle', name: 'Orange Triangle', icon: '🔺', color: 'from-orange-400 to-amber-500' },
  { id: 'diamond', name: 'Purple Diamond', icon: '💎', color: 'from-purple-400 to-indigo-500' },
];

const ShapeMatchContent: React.FC = () => {
  const { setActiveModal, voiceOutput, addActivity } = useGestivoStore();
  const [targetIndex, setTargetIndex] = useState(() => Math.floor(Math.random() * SHAPES.length));
  const [score, setScore] = useState(0);
  const currentTarget = SHAPES[targetIndex];
  const [message, setMessage] = useState(() => `Can you find the ${currentTarget.name}?`);

  useEffect(() => {
    speakText(`Can you find the ${currentTarget.name}?`, voiceOutput);
  }, [currentTarget.name, voiceOutput]);

  const handleShapeClick = (shape: Shape) => {
    if (shape.id === currentTarget.id) {
      playChime('success');
      setScore((s) => s + 1);
      setMessage(`Yes! That is the ${shape.name}! Awesome! ⭐`);
      speakText(`Yes! That is the ${shape.name}! Awesome!`, voiceOutput);

      if (score + 1 >= 5) {
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then((confettiModule) => {
            confettiModule.default({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
          });
        }
        addActivity('Mastered Shape Matching Game ⭐', 'activity', '⭐');
      }

      setTimeout(() => {
        const nextIdx = (targetIndex + 1) % SHAPES.length;
        setTargetIndex(nextIdx);
        setMessage(`Now find the ${SHAPES[nextIdx].name}!`);
        speakText(`Now find the ${SHAPES[nextIdx].name}!`, voiceOutput);
      }, 1500);
    } else {
      playChime('pop');
      setMessage(`That's the ${shape.name}. Try looking for ${currentTarget.name}!`);
      speakText(`That's the ${shape.name}. Try looking for ${currentTarget.name}!`, voiceOutput);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#251554] via-[#331c77] to-[#140b36] rounded-3xl p-5 sm:p-6 border-2 border-yellow-300/40 shadow-2xl text-white relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🔷</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">Shape Match Adventure</h3>
              <p className="text-xs text-yellow-200">Tap the shape that matches the clue!</p>
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

        {/* Current Prompt Box */}
        <div className="my-5 p-4 rounded-2xl bg-white/10 border border-white/20 text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-yellow-300 block mb-1 font-heading">
            Your Target Shape:
          </span>
          <h4 className="text-2xl font-black font-heading text-white">{currentTarget.name}</h4>
          <p className="text-xs text-slate-300 mt-1">{message}</p>
        </div>

        {/* Shape Choices Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          {SHAPES.map((shape) => (
            <motion.button
              key={shape.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleShapeClick(shape)}
              className={`p-4 rounded-2xl bg-gradient-to-b ${shape.color} flex flex-col items-center justify-center gap-2 shadow-lg cursor-pointer border-2 border-white/30`}
            >
              <span className="text-3xl sm:text-4xl">{shape.icon}</span>
              <span className="text-xs font-bold font-heading text-white text-center leading-tight">
                {shape.name}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Footer Score */}
        <div className="pt-3 border-t border-white/20 flex items-center justify-between text-xs font-bold text-slate-300 font-heading">
          <span>Score: {score} Stars ⭐</span>
          <span>Goal: 5 Correct Matches</span>
        </div>
      </motion.div>
    </div>
  );
};

export const ShapeMatchModal: React.FC = () => {
  const { activeModal } = useGestivoStore();
  if (activeModal !== 'shapeMatch') return null;
  return <ShapeMatchContent />;
};
