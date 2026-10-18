import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Clock } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const RecentActivityCard: React.FC<{ onViewAll?: () => void }> = ({ onViewAll }) => {
  const { activities, setActiveModal, voiceOutput } = useGestivoStore();

  // Grab the top 4 recent activities
  const recentItems = activities.slice(0, 4);

  const handleRowClick = (item: typeof activities[0]) => {
    playChime('pop');
    speakText(item.text, voiceOutput);
  };

  const handleViewAll = () => {
    playChime('pop');
    if (onViewAll) onViewAll();
    else setActiveModal('history');
  };

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between">
      <div>
        {/* Header with Title and "View All" link matching screenshot */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Clock size={18} />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-indigo-950 font-heading tracking-wide">
              Recent Activity
            </h3>
          </div>
          <button
            onClick={handleViewAll}
            className="text-xs sm:text-sm font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center gap-0.5 font-heading"
          >
            <span>View All</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* 4 Activity Rows */}
        <div className="divide-y divide-slate-100 mt-2">
          {recentItems.map((act) => (
            <motion.div
              key={act.id}
              onClick={() => handleRowClick(act)}
              whileHover={{ x: 3, backgroundColor: 'rgba(241, 245, 249, 0.6)' }}
              className="py-2.5 sm:py-3 px-2 flex items-center justify-between gap-3 cursor-pointer rounded-xl transition-colors select-none"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl filter drop-shadow-sm shrink-0">{act.icon}</span>
                <div>
                  <h4 className="font-heading font-black text-xs sm:text-sm text-slate-800 leading-tight">
                    {act.text}
                  </h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    {act.timestamp}
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-slate-400 shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Encouragement footer badge */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500 px-1">
        <span>Logged automatically</span>
        <span className="text-emerald-600 font-extrabold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
        </span>
      </div>
    </div>
  );
};
