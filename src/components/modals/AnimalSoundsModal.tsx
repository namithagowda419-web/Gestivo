import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

interface Animal {
  id: string;
  name: string;
  sound: string;
  icon: string;
  gradient: string;
  border: string;
}

const ANIMALS: Animal[] = [
  { id: 'fox', name: 'Curious Fox', sound: 'Yip yip yip!', icon: '🦊', gradient: 'from-orange-400 to-amber-500', border: 'border-orange-300' },
  { id: 'cat', name: 'Pink Kitty', sound: 'Meow meow, purr!', icon: '🐱', gradient: 'from-pink-400 to-rose-500', border: 'border-pink-300' },
  { id: 'dog', name: 'Happy Puppy', sound: 'Woof woof! Arf!', icon: '🐶', gradient: 'from-amber-400 to-orange-500', border: 'border-amber-300' },
  { id: 'bunny', name: 'Blue Bunny', sound: 'Hop hop hop, squeak!', icon: '🐰', gradient: 'from-sky-400 to-blue-500', border: 'border-sky-300' },
  { id: 'dino', name: 'Baby Dino', sound: 'Roar! Stomp stomp!', icon: '🦖', gradient: 'from-emerald-400 to-green-500', border: 'border-emerald-300' },
  { id: 'lion', name: 'Brave Lion', sound: 'Rrrrroar! King of the forest!', icon: '🦁', gradient: 'from-yellow-400 to-amber-600', border: 'border-yellow-300' },
  { id: 'cow', name: 'Friendly Cow', sound: 'Moooooo!', icon: '🐮', gradient: 'from-slate-200 to-slate-400', border: 'border-slate-300' },
  { id: 'bird', name: 'Singing Bird', sound: 'Chirp chirp! Tweet tweet!', icon: '🐦', gradient: 'from-cyan-400 to-teal-500', border: 'border-cyan-300' },
];

export const AnimalSoundsModal: React.FC = () => {
  const { activeModal, setActiveModal, voiceOutput, addActivity } = useGestivoStore();

  const handleAnimalClick = (animal: Animal) => {
    playChime('bubble');
    speakText(`${animal.name} says: ${animal.sound}`, voiceOutput);
    addActivity(`Listened to ${animal.name} (${animal.sound})`, 'activity', animal.icon);
  };

  if (activeModal !== 'animalSounds') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#21114d] via-[#2f186c] to-[#120a32] rounded-3xl p-5 sm:p-6 border-2 border-orange-400/50 shadow-2xl text-white relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🦊</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Animal Sound Explorer
              </h3>
              <p className="text-xs text-orange-200">
                Tap any friend to hear what they say!
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

        {/* Animals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {ANIMALS.map((animal) => (
            <motion.button
              key={animal.id}
              onClick={() => handleAnimalClick(animal)}
              whileHover={{ scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.92, y: 2 }}
              className={`p-3 rounded-2xl bg-gradient-to-b ${animal.gradient} text-white font-heading font-black flex flex-col items-center justify-center border-2 ${animal.border} shadow-lg cursor-pointer min-h-[110px] select-none`}
            >
              <span className="text-4xl filter drop-shadow mb-1">{animal.icon}</span>
              <span className="text-xs sm:text-sm leading-tight text-center drop-shadow">
                {animal.name}
              </span>
              <span className="text-[10px] text-white/90 font-bold mt-1 bg-black/20 px-2 py-0.5 rounded-full">
                {animal.sound}
              </span>
            </motion.button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/15 text-xs text-purple-200">
          <span>Tap to hear each voice</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-heading font-extrabold cursor-pointer"
          >
            Done Exploring
          </button>
        </div>
      </motion.div>
    </div>
  );
};
