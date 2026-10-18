import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { playChime } from '../../utils/speech';

interface CueCorrectionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPhrase: string;
  onSelectCorrection: (correctedPhrase: string, icon?: string) => void;
}

const COMMON_CORRECTION_TILES = [
  { phrase: 'I want water', icon: '🥤', category: 'Needs' },
  { phrase: 'I am hungry', icon: '🍔', category: 'Needs' },
  { phrase: 'Need bathroom', icon: '🚻', category: 'Needs' },
  { phrase: 'Need a break', icon: '🛌', category: 'Needs' },
  { phrase: 'I want to play', icon: '⚽', category: 'Requests' },
  { phrase: 'I want that', icon: '👉', category: 'Requests' },
  { phrase: 'Help me please', icon: '🙋', category: 'Requests' },
  { phrase: 'No / Stop', icon: '✋', category: 'Requests' },
  { phrase: 'I am happy', icon: '😊', category: 'Feelings' },
  { phrase: 'I am excited', icon: '🤩', category: 'Feelings' },
  { phrase: 'I am tired', icon: '😴', category: 'Feelings' },
  { phrase: 'I love you', icon: '❤️', category: 'Feelings' },
  { phrase: 'Look at that!', icon: '👀', category: 'Attention' },
  { phrase: 'Yes', icon: '✅', category: 'Responses' },
  { phrase: 'Thank you', icon: '💖', category: 'Responses' },
  { phrase: 'Music please', icon: '🎵', category: 'Play' },
];

export const CueCorrectionPickerModal: React.FC<CueCorrectionPickerModalProps> = ({
  isOpen,
  onClose,
  originalPhrase,
  onSelectCorrection,
}) => {
  const [customText, setCustomText] = useState('');

  const handleTilePick = (tile: typeof COMMON_CORRECTION_TILES[0]) => {
    playChime('pop');
    onSelectCorrection(tile.phrase, tile.icon);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    playChime('pop');
    onSelectCorrection(customText.trim(), '💬');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#241355] via-[#331c77] to-[#140b36] rounded-3xl p-5 sm:p-7 border-2 border-amber-400/50 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Correct Cue Suggestion
              </h3>
              <p className="text-xs text-amber-200">
                Teach the system what your child was actually communicating
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="my-3 p-3 bg-white/10 rounded-2xl border border-white/15 text-xs">
          <span className="text-slate-300">Suggested was: </span>
          <span className="font-heading font-black text-amber-300">"{originalPhrase}"</span>
        </div>

        {/* Custom text field */}
        <form onSubmit={handleCustomSubmit} className="my-3 flex gap-2">
          <input
            type="text"
            placeholder="Type custom message..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-amber-400 font-bold"
          />
          <button
            type="submit"
            disabled={!customText.trim()}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-40 text-indigo-950 font-heading font-black text-xs shadow-md cursor-pointer flex items-center gap-1"
          >
            <Check size={16} />
            <span>Confirm</span>
          </button>
        </form>

        {/* Board Tile Picker Grid */}
        <div className="my-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-300 block mb-2 font-heading">
            Or pick from Communication Board:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {COMMON_CORRECTION_TILES.map((tile, i) => (
              <button
                key={i}
                onClick={() => handleTilePick(tile)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex flex-col items-center justify-center text-center cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <span className="text-2xl mb-1">{tile.icon}</span>
                <span className="font-heading font-black text-xs text-white leading-tight line-clamp-1">
                  {tile.phrase}
                </span>
                <span className="text-[10px] text-purple-200 mt-0.5">{tile.category}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
