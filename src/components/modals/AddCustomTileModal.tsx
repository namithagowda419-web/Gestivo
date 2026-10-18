import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

interface AddCustomTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'basics' | 'feelings' | 'needs' | 'play' | 'people' | 'more';
}

const EMOJI_OPTIONS = ['🫧', '🧱', '🎵', '🎪', '🛝', '🎨', '💃', '🚗', '🐶', '🐱', '🍪', '🍎', '🧸', '🚲', '🏖️', '⭐'];

const COLOR_THEMES = [
  { id: 'orange', label: 'Warm Orange', bgGradient: 'from-orange-100 to-amber-200', borderColor: 'border-orange-300', textColor: 'text-amber-950', shadowColor: 'rgba(251, 146, 60, 0.25)' },
  { id: 'sky', label: 'Sky Blue', bgGradient: 'from-sky-100 to-blue-200', borderColor: 'border-sky-300', textColor: 'text-sky-950', shadowColor: 'rgba(56, 189, 248, 0.25)' },
  { id: 'green', label: 'Playful Green', bgGradient: 'from-emerald-100 to-green-200', borderColor: 'border-emerald-300', textColor: 'text-emerald-950', shadowColor: 'rgba(52, 211, 153, 0.25)' },
  { id: 'purple', label: 'Magic Purple', bgGradient: 'from-purple-100 to-violet-200', borderColor: 'border-purple-300', textColor: 'text-purple-950', shadowColor: 'rgba(168, 85, 247, 0.25)' },
  { id: 'pink', label: 'Love Pink', bgGradient: 'from-pink-100 to-rose-200', borderColor: 'border-pink-300', textColor: 'text-pink-950', shadowColor: 'rgba(244, 114, 182, 0.25)' },
];

export const AddCustomTileModal: React.FC<AddCustomTileModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'play',
}) => {
  const { addCustomTile, voiceOutput } = useGestivoStore();
  const [label, setLabel] = useState('');
  const [phrase, setPhrase] = useState('');
  const [icon, setIcon] = useState('🫧');
  const [category, setCategory] = useState<'basics' | 'feelings' | 'needs' | 'play' | 'people' | 'more'>(defaultCategory);
  const [colorTheme, setColorTheme] = useState(COLOR_THEMES[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const finalPhrase = phrase.trim() || label.trim();
    addCustomTile({
      label: label.trim(),
      phrase: finalPhrase,
      icon,
      category,
      bgGradient: colorTheme.bgGradient,
      borderColor: colorTheme.borderColor,
      textColor: colorTheme.textColor,
      shadowColor: colorTheme.shadowColor,
    });

    speakText(`Added tile ${label}`, voiceOutput);
    onClose();
    setLabel('');
    setPhrase('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md rounded-[32px] card-light p-5 sm:p-6 shadow-2xl border border-white/80 relative text-indigo-950 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                <Sparkles size={20} />
              </span>
              <h3 className="text-xl font-black font-heading text-indigo-950">Add Communication Tile</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {/* Tile Label */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Button Label (Short)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Bubbles, Ball, Grandma"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            {/* Spoken Phrase */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Spoken Sentence (Read Aloud)
              </label>
              <input
                type="text"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                placeholder="e.g. I want to blow bubbles please!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-purple-500 shadow-sm"
              />
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-sm text-slate-800 focus:outline-none focus:border-purple-500 shadow-sm capitalize"
              >
                <option value="play">Play & Fun</option>
                <option value="people">People & Family</option>
                <option value="needs">Needs & Food</option>
                <option value="feelings">Feelings</option>
                <option value="basics">Basics</option>
                <option value="more">More</option>
              </select>
            </div>

            {/* Emoji Selection */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Choose Icon
              </label>
              <div className="flex flex-wrap gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                {EMOJI_OPTIONS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      playChime('pop');
                      setIcon(em);
                    }}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                      icon === em ? 'bg-purple-600 text-white scale-110 shadow-md' : 'hover:bg-slate-200'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                Color Theme
              </label>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setColorTheme(theme)}
                    className={`h-9 rounded-xl bg-gradient-to-r ${theme.bgGradient} border-2 ${
                      colorTheme.id === theme.id ? 'border-purple-700 scale-105 shadow-md' : 'border-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Live Preview:</span>
              <div className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-b ${colorTheme.bgGradient} border-2 ${colorTheme.borderColor} ${colorTheme.textColor} shadow-sm min-w-[90px]`}>
                <span className="text-xl">{icon}</span>
                <span className="font-heading font-black text-xs">{label || 'Sample'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-heading font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check size={16} />
                <span>Save Tile</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
