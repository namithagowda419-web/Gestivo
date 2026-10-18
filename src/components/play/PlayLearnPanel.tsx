import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Gamepad2, Sparkles } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const PlayLearnPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { setActiveModal, voiceOutput } = useGestivoStore();
  const [activeTab, setActiveTab] = useState<'games' | 'stories' | 'puzzles' | 'videos'>('games');
  const [selectedActivity, setSelectedActivity] = useState<string>('memory');

  const activities = [
    {
      id: 'memory',
      title: 'Memory Game',
      subtitle: 'Boost memory',
      icon: '🧠',
      bgGradient: 'from-purple-100 to-indigo-200',
      borderColor: 'border-purple-300',
      textColor: 'text-purple-950',
      color: 'bg-purple-500',
      modalKey: 'memoryGame',
    },
    {
      id: 'shapes',
      title: 'Shape Match',
      subtitle: 'Learn shapes',
      icon: '⭐',
      bgGradient: 'from-yellow-100 to-amber-200',
      borderColor: 'border-yellow-300',
      textColor: 'text-amber-950',
      color: 'bg-amber-500',
      modalKey: 'shapeMatch',
    },
    {
      id: 'animals',
      title: 'Animal Sounds',
      subtitle: 'Explore sounds',
      icon: '🦊',
      bgGradient: 'from-orange-100 to-amber-200',
      borderColor: 'border-orange-300',
      textColor: 'text-orange-950',
      color: 'bg-orange-500',
      modalKey: 'animalSounds',
    },
    {
      id: 'story',
      title: 'Story Time',
      subtitle: 'Listen & Imagine',
      icon: '📖',
      bgGradient: 'from-pink-100 to-rose-200',
      borderColor: 'border-pink-300',
      textColor: 'text-rose-950',
      color: 'bg-pink-500',
      modalKey: 'storyTime',
    },
  ];

  const handleTileClick = (act: typeof activities[0]) => {
    playChime('pop');
    setSelectedActivity(act.id);
    speakText(`Selected ${act.title}: ${act.subtitle}`, voiceOutput);
  };

  const handleLaunch = () => {
    playChime('star');
    const act = activities.find((a) => a.id === selectedActivity) || activities[0];
    setActiveModal(act.modalKey);
    speakText(`Let's play ${act.title}!`, voiceOutput);
  };

  const tabs: Array<{ id: 'games' | 'stories' | 'puzzles' | 'videos'; label: string }> = [
    { id: 'games', label: 'Games' },
    { id: 'stories', label: 'Stories' },
    { id: 'puzzles', label: 'Puzzles' },
    { id: 'videos', label: 'Videos' },
  ];

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between border border-white/60 h-full">
      <div>
        {/* Header with Title and close X matching screenshot */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 font-heading leading-tight">
                Play & Learn
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Fun activities to build skills!
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close play and learn panel"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tabs: Games | Stories | Puzzles | Videos matching screenshot */}
        <div className="flex items-center gap-1.5 my-3 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-heading font-extrabold text-xs transition-all text-center cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                    : 'text-slate-600 hover:text-indigo-950 hover:bg-white/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 4 Activity Tiles matching screenshot */}
        <div className="grid grid-cols-2 gap-2.5 my-2.5">
          {activities.map((act) => {
            const isSelected = selectedActivity === act.id;
            return (
              <motion.button
                key={act.id}
                id={`play-tile-${act.id}`}
                onClick={() => handleTileClick(act)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`p-3 rounded-2xl bg-gradient-to-b ${act.bgGradient} border-2 ${
                  isSelected ? 'border-indigo-600 ring-2 ring-indigo-400/40' : act.borderColor
                } ${act.textColor} text-left cursor-pointer transition-all shadow-sm select-none relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-2xl filter drop-shadow">{act.icon}</span>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                  )}
                </div>
                <h4 className="font-heading font-black text-xs sm:text-sm leading-tight">
                  {act.title}
                </h4>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 leading-tight mt-0.5">
                  {act.subtitle}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Blue "Let's Play!" Button with Mascot Icon matching screenshot */}
      <div className="mt-3 pt-2">
        <motion.button
          id="play-launch-button"
          onClick={handleLaunch}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-heading font-black text-sm sm:text-base shadow-xl shadow-blue-500/30 border border-cyan-300/60 cursor-pointer flex items-center justify-center gap-2 select-none"
        >
          <span className="text-xl">🎮</span>
          <span>Let's Play!</span>
          <Sparkles size={16} className="text-yellow-300 animate-spin" style={{ animationDuration: '6s' }} />
        </motion.button>
      </div>
    </div>
  );
};
