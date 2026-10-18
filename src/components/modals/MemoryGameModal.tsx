import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw, Trophy, Sparkles } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

interface Card {
  id: number;
  icon: string;
  name: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_DATA = [
  { icon: '🐰', name: 'Bunny' },
  { icon: '🐱', name: 'Kitten' },
  { icon: '🐶', name: 'Puppy' },
  { icon: '🦖', name: 'Dino' },
  { icon: '⭐', name: 'Star' },
  { icon: '🦊', name: 'Fox' },
];

function createShuffledDeck(): Card[] {
  return [...CARD_DATA, ...CARD_DATA]
    .map((item, index) => ({
      id: index,
      icon: item.icon,
      name: item.name,
      isFlipped: false,
      isMatched: false,
    }))
    .sort(() => Math.random() - 0.5);
}

export const MemoryGameModal: React.FC = () => {
  const { activeModal, setActiveModal, voiceOutput, addActivity, incrementGoal } = useGestivoStore();
  const [cards, setCards] = useState<Card[]>(createShuffledDeck);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const resetGame = useCallback(() => {
    setCards(createShuffledDeck());
    setFlippedCards([]);
    setMatches(0);
    setMoves(0);
    setIsWon(false);
    playChime('pop');
    speakText('Find the matching animal pairs!', voiceOutput);
  }, [voiceOutput]);

  const handleCardClick = (id: number) => {
    if (flippedCards.length === 2) return;
    const clickedCard = cards.find((c) => c.id === id);
    if (!clickedCard || clickedCard.isFlipped || clickedCard.isMatched) return;

    playChime('card');
    speakText(clickedCard.name, voiceOutput);

    const updated = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(updated);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [firstId, secondId] = newFlipped;
      const first = updated.find((c) => c.id === firstId);
      const second = updated.find((c) => c.id === secondId);

      if (first && second && first.icon === second.icon) {
        // Match!
        setTimeout(() => {
          playChime('success');
          speakText(`Match found! ${first.name}!`, voiceOutput);
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c))
          );
          setFlippedCards([]);
          setMatches((prev) => {
            const next = prev + 1;
            if (next === CARD_DATA.length) {
              handleWin();
            }
            return next;
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c))
          );
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const handleWin = () => {
    setIsWon(true);
    playChime('star');
    speakText('Hooray! You matched all pairs! You are a memory master!', voiceOutput);

    addActivity('Completed Memory Match Game ⭐', 'activity', '🧠');
    incrementGoal('goal-2'); // Play memory game goal

    if (typeof window !== 'undefined') {
      import('canvas-confetti').then((confettiModule) => {
        confettiModule.default({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      });
    }
  };

  if (activeModal !== 'memoryGame') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#21114d] via-[#2f186c] to-[#120a32] rounded-3xl p-5 sm:p-6 border-2 border-purple-400/50 shadow-2xl text-white relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🧠</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Memory Match Adventure
              </h3>
              <p className="text-xs text-purple-200">
                Matches: {matches}/{CARD_DATA.length} • Moves: {moves}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetGame}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              title="Restart Game"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Victory Screen Banner */}
        {isWon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="my-3 p-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-indigo-950 font-heading font-black text-center shadow-lg flex flex-col items-center justify-center gap-1"
          >
            <div className="flex items-center gap-2 text-2xl">
              <Trophy size={28} className="text-yellow-100" />
              <span>Great Job, Aarvi! You Won!</span>
              <Sparkles size={24} className="text-yellow-100" />
            </div>
            <p className="text-xs text-amber-950 font-bold">
              Memory goal updated in your Caregiver Dashboard!
            </p>
          </motion.div>
        )}

        {/* Card Grid (4x3) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 my-4">
          {cards.map((card) => {
            const isShown = card.isFlipped || card.isMatched;
            return (
              <motion.button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-24 sm:h-28 rounded-2xl font-heading text-3xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer select-none shadow-md ${
                  card.isMatched
                    ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-emerald-500/20'
                    : isShown
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-indigo-300 text-white shadow-indigo-500/30'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-purple-300'
                }`}
              >
                {isShown ? (
                  <>
                    <span className="text-3xl sm:text-4xl filter drop-shadow">{card.icon}</span>
                    <span className="text-[11px] font-bold mt-1 text-slate-100">{card.name}</span>
                  </>
                ) : (
                  <span className="text-2xl opacity-60">✨</span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Footer controls */}
        <div className="flex items-center justify-between pt-3 border-t border-white/15 text-xs font-semibold text-purple-200">
          <span>Tap 2 cards to find twin buddies</span>
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-heading font-extrabold cursor-pointer"
          >
            Done Playing
          </button>
        </div>
      </motion.div>
    </div>
  );
};
