import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const SetReminderModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    reminders,
    addReminder,
    toggleReminder,
    deleteReminder,
    voiceOutput,
  } = useGestivoStore();

  const [title, setTitle] = useState('');
  const [time, setTime] = useState('11:00 AM');
  const [repeat, setRepeat] = useState<'daily' | 'weekdays' | 'once'>('daily');
  const [category, setCategory] = useState<'water' | 'food' | 'activity' | 'break'>('activity');
  const [notice, setNotice] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    playChime('success');
    addReminder({
      title: title.trim(),
      time,
      repeat,
      category,
    });
    speakText(`Reminder set: ${title}`, voiceOutput);
    setTitle('');
    setNotice('Reminder successfully scheduled!');
    setTimeout(() => setNotice(''), 3000);
  };

  if (activeModal !== 'setReminder') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#22124d] via-[#31186e] to-[#120a32] rounded-3xl p-5 sm:p-6 border-2 border-pink-400/40 shadow-2xl text-white relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className="text-3xl">⏰</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Set Reminder
              </h3>
              <p className="text-xs text-pink-200">
                Help Aarvi build routines and take healthy breaks
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

        {/* Add New Reminder Form */}
        <form onSubmit={handleAdd} className="my-4 space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
              Reminder Title:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Drink Water or Speech Practice"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-pink-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Time:
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-pink-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
              >
                <option value="activity">Activity</option>
                <option value="water">Hydration</option>
                <option value="food">Snack / Food</option>
                <option value="break">Calm Break</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Repeat:
              </label>
              <select
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/20 text-white text-sm focus:outline-none cursor-pointer"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="once">Once</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 font-heading font-extrabold text-sm text-white shadow-lg shadow-pink-500/25 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
          >
            <Plus size={17} />
            <span>Add Reminder</span>
          </button>

          {notice && (
            <p className="text-xs text-emerald-400 font-bold text-center mt-1">
              {notice}
            </p>
          )}
        </form>

        {/* Existing Reminders List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-2 font-heading">
            Active Reminders:
          </h4>
          <div className="space-y-2">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className="p-3 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleReminder(rem.id)}
                    className={`p-1.5 rounded-lg cursor-pointer ${
                      rem.active ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div>
                    <h5
                      className={`text-sm font-extrabold font-heading ${
                        rem.active ? 'text-white' : 'text-slate-400 line-through'
                      }`}
                    >
                      {rem.title}
                    </h5>
                    <p className="text-[11px] text-purple-200">
                      {rem.time} • <span className="capitalize">{rem.repeat}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => deleteReminder(rem.id)}
                  className="p-2 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                  aria-label="Delete reminder"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 mt-4 border-t border-white/15 text-right">
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
