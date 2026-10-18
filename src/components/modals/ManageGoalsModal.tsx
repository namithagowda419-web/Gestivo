import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, PlusCircle } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const ManageGoalsModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    goals,
    incrementGoal,
    addGoal,
    deleteGoal,
    voiceOutput,
  } = useGestivoStore();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(5);
  const [category, setCategory] = useState('Communication');
  const [isDaily, setIsDaily] = useState(false);
  const [notice, setNotice] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playChime('star');
    addGoal({
      title: title.trim(),
      current: 0,
      target: Number(target),
      unit: isDaily ? 'Daily' : 'times',
      isDaily,
      category,
      color: '#3D8BFF',
    });
    speakText(`New goal added: ${title}`, voiceOutput);
    setTitle('');
    setNotice('Goal successfully created!');
    setTimeout(() => setNotice(''), 3000);
  };

  if (activeModal !== 'manageGoals') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-xl bg-gradient-to-b from-[#22124d] via-[#31186e] to-[#120a32] rounded-3xl p-5 sm:p-6 border-2 border-purple-400/40 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Manage Learning Goals
              </h3>
              <p className="text-xs text-purple-200">
                Track progress, celebrate achievements, and inspire milestones
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

        {/* Existing Goals with progress & increment button */}
        <div className="my-4 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-heading">
            Current Goals ({goals.length}):
          </h4>

          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.current / g.target) * 100));
            const isCompleted = g.current >= g.target;

            return (
              <div
                key={g.id}
                className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-black font-heading text-white flex items-center gap-2">
                      <span>{g.title}</span>
                      {isCompleted && (
                        <span className="text-xs bg-emerald-500/30 text-emerald-300 border border-emerald-400 px-2 py-0.5 rounded-full font-bold">
                          Completed ⭐
                        </span>
                      )}
                    </h5>
                    <p className="text-[11px] text-purple-200">
                      Category: {g.category} • Target: {g.target} {g.unit || 'units'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => incrementGoal(g.id)}
                      disabled={isCompleted}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-extrabold text-xs shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                      title="Add 1 progress"
                    >
                      <PlusCircle size={15} />
                      <span>+1 Step</span>
                    </button>

                    <button
                      onClick={() => deleteGoal(g.id)}
                      className="p-1.5 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white font-heading">
                    {g.current}/{g.target} ({percent}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add New Goal Form */}
        <form onSubmit={handleCreate} className="my-4 bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-heading flex items-center gap-1.5">
            <Plus size={15} />
            <span>Create New Milestone:</span>
          </h4>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
              Goal Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Try 3 new foods or Greet friends"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Target Count:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
              >
                <option value="Communication">Communication</option>
                <option value="Vocabulary">Vocabulary</option>
                <option value="Independence">Independence</option>
                <option value="Cognitive">Cognitive</option>
                <option value="Social">Social</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 font-heading">
            <input
              type="checkbox"
              checked={isDaily}
              onChange={(e) => setIsDaily(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 accent-purple-500 cursor-pointer"
            />
            <span>Track as Daily Habit (resets every day)</span>
          </label>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 font-heading font-extrabold text-sm text-white shadow-lg shadow-purple-500/25 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus size={17} />
            <span>Create Goal</span>
          </button>

          {notice && (
            <p className="text-xs text-emerald-400 font-bold text-center mt-1">
              {notice}
            </p>
          )}
        </form>

        <div className="pt-3 border-t border-white/15 text-right">
          <button
            onClick={() => setActiveModal(null)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
