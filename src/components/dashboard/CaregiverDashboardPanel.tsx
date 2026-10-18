import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, MessageCircle, Smile, Target, Sparkles, ChevronRight, X, Camera } from 'lucide-react';
import { BabyDinoMascot } from '../mascots/Mascots';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';
import { CueCameraInsightsCard } from '../cues/CueCameraInsightsCard';

export const CaregiverDashboardPanel: React.FC<{ onClose?: () => void; isStandalone?: boolean }> = ({
  onClose,
  isStandalone: _isStandalone = false,
}) => {
  const { profile, goals, incrementGoal, setActiveModal, voiceOutput } = useGestivoStore();
  const [viewMode, setViewMode] = useState<'overview' | 'cues'>('overview');

  const completedGoalsCount = goals.filter((g) => g.current >= g.target).length;
  const totalGoals = goals.length;
  const progressPercent = Math.round((completedGoalsCount / totalGoals) * 100);

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between border border-white/60 h-full">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Aarvi Avatar */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400 shadow-md bg-gradient-to-br from-purple-200 to-pink-200 shrink-0">
              <img
                src="/assets/girl-bunny.png"
                alt="Aarvi profile avatar"
                width={48}
                height={48}
                loading="lazy"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
                }}
              />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 font-heading leading-tight flex items-center gap-1.5">
                <span>Caregiver Dashboard</span>
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Quick overview of your child's progress
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close panel"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 my-2.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            id="tab-caregiver-overview"
            onClick={() => {
              setViewMode('overview');
              playChime('pop');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl font-heading font-extrabold text-xs transition-all text-center cursor-pointer ${
              viewMode === 'overview'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:text-indigo-950 hover:bg-white/70'
            }`}
          >
            Overview
          </button>
          <button
            id="tab-caregiver-cues"
            onClick={() => {
              setViewMode('cues');
              playChime('pop');
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl font-heading font-extrabold text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              viewMode === 'cues'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-indigo-950 hover:bg-white/70'
            }`}
          >
            <Camera size={13} />
            <span>Cue Camera Insights</span>
          </button>
        </div>

        {viewMode === 'cues' ? (
          <div className="my-2">
            <CueCameraInsightsCard />
          </div>
        ) : (
          <>
            {/* Child Subtitle status */}
            <div className="py-1 flex items-center justify-between text-xs font-bold text-slate-600">
              <span>{profile.name} (Age {profile.age} • Child Mode)</span>
              <span className="text-purple-600 font-extrabold flex items-center gap-1">
                <Sparkles size={12} /> Active Today
              </span>
            </div>

        {/* 4 Stat Tiles matching screenshot */}
        <div className="grid grid-cols-2 gap-2.5 my-2">
          {/* Tile 1: Today's Activities */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/70 border border-amber-200">
            <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold font-heading">
              <Activity size={15} />
              <span>Today's Activities</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-amber-950 font-heading mt-1">
              6 Completed
            </p>
          </div>

          {/* Tile 2: Communications */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-100/70 border border-sky-200">
            <div className="flex items-center gap-1.5 text-sky-700 text-xs font-bold font-heading">
              <MessageCircle size={15} />
              <span>Communications</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-sky-950 font-heading mt-1">
              14 Today
            </p>
          </div>

          {/* Tile 3: Mood */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-100/70 border border-pink-200">
            <div className="flex items-center gap-1.5 text-pink-700 text-xs font-bold font-heading">
              <Smile size={15} />
              <span>Mood</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-pink-950 font-heading mt-1">
              Happy <span className="text-xs font-normal text-pink-800">(Most recent)</span>
            </p>
          </div>

          {/* Tile 4: Goals */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/70 border border-emerald-200">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold font-heading">
              <Target size={15} />
              <span>Goals</span>
            </div>
            <p className="text-lg sm:text-xl font-black text-emerald-950 font-heading mt-1">
              3/5 On track
            </p>
          </div>
        </div>

        {/* Progress & Goals Bar matching screenshot */}
        <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5 font-heading">
            <span className="text-slate-800">Progress & Goals (3/5 Goals)</span>
            <button
              onClick={() => {
                playChime('pop');
                setActiveModal('manageGoals');
              }}
              className="text-indigo-600 font-extrabold hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 rounded-full shadow-inner"
            />
          </div>

          {/* 4 Goal Chips matching screenshot */}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {goals.map((g) => (
              <motion.button
                key={g.id}
                onClick={() => incrementGoal(g.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-2 rounded-xl bg-white border border-slate-200 text-left cursor-pointer hover:border-indigo-400 transition-colors shadow-sm select-none"
              >
                <div className="flex items-center justify-between text-[11px] font-extrabold font-heading text-slate-800">
                  <span className="truncate">{g.title}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                      g.current >= g.target
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {g.isDaily ? 'Daily' : `${g.current}/${g.target}`}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
        </>
      )}
      </div>

      {/* Bottom pill matching screenshot: "Great progress! Keep going! 💚" with baby green dino mascot */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-800 font-heading font-black text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <span>Great progress! Keep going!</span>
          <span>💚</span>
        </div>

        <div
          className="cursor-pointer"
          onClick={() => {
            playChime('pop');
            speakText('Roar! Green dino says: Fantastic job, Aarvi!', voiceOutput);
          }}
        >
          <BabyDinoMascot size={46} />
        </div>
      </div>
    </div>
  );
};
