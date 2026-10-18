import React from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Clock, Download } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const HistoryPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    activities,
    historyFilter,
    setHistoryFilter,
    historyPage,
    setHistoryPage,
    voiceOutput,
    exportHistory,
  } = useGestivoStore();

  const handleExport = (format: 'json' | 'csv') => {
    playChime('star');
    const { json, csv } = exportHistory();
    const content = format === 'json' ? json : csv;
    const mimeType = format === 'json' ? 'application/json' : 'text/csv';
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestivo-communication-history-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    speakText(`Exported history as ${format.toUpperCase()}`, voiceOutput);
  };

  const filtered = activities.filter((act) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'communication') return act.type === 'communication';
    if (historyFilter === 'activity') return act.type === 'activity';
    if (historyFilter === 'mood') return act.type === 'mood';
    if (historyFilter === 'Cue Camera') return act.type === 'Cue Camera';
    return true;
  });

  const itemsPerPage = 5;
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const currentPage = Math.min(historyPage, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const tabs: Array<{ id: 'all' | 'communication' | 'activity' | 'mood' | 'Cue Camera'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'communication', label: 'Communication' },
    { id: 'Cue Camera', label: 'Cue Camera' },
    { id: 'activity', label: 'Activities' },
    { id: 'mood', label: 'Mood' },
  ];

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between border border-white/60 h-full">
      <div>
        {/* Header with Title and close X matching screenshot */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Clock size={19} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 font-heading leading-tight">
                History
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Detailed timeline of child interactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              title="Export communication logs to CSV for therapists"
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 text-[11px] font-extrabold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Download size={13} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('json')}
              title="Export communication logs to JSON"
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 text-[11px] font-extrabold flex items-center gap-1 border border-slate-200 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <Download size={13} />
              <span>JSON</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Close history panel"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs matching screenshot: All | Communication | Activities | Mood */}
        <div className="flex items-center gap-1.5 my-3 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = historyFilter === tab.id;
            return (
              <button
                key={tab.id}
                id={`history-filter-${tab.id}`}
                onClick={() => setHistoryFilter(tab.id)}
                className={`flex-1 min-w-[70px] py-1.5 px-2.5 rounded-xl font-heading font-extrabold text-xs transition-all text-center cursor-pointer ${
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

        {/* Activity List matching screenshot */}
        <div className="space-y-1.5 my-2">
          {currentItems.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs italic">
              No activity logs for this filter yet.
            </div>
          ) : (
            currentItems.map((act) => (
              <motion.div
                key={act.id}
                onClick={() => {
                  playChime('pop');
                  speakText(act.text, voiceOutput);
                }}
                whileHover={{ x: 2, backgroundColor: 'rgba(241, 245, 249, 0.7)' }}
                className="p-2.5 rounded-xl border border-slate-100 bg-white/70 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl shrink-0">{act.icon}</span>
                  <div>
                    <h4 className="font-heading font-black text-xs sm:text-sm text-slate-800 leading-tight">
                      {act.text}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] font-semibold text-slate-500">
                      <span>{act.timestamp}</span>
                      {act.signalsSummary && (
                        <span className="text-purple-600 truncate max-w-[200px]">
                          • {act.signalsSummary}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {act.confidenceBucket && (
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        act.confidenceBucket === 'high'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.confidenceBucket === 'medium'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {act.confidenceBucket}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                      act.type === 'Cue Camera'
                        ? 'bg-cyan-100 text-cyan-800 font-extrabold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {act.type}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Pagination & "Good job! ⭐" bubble matching screenshot */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Pagination: "Page 1 of 5" with arrows */}
        <div className="flex items-center gap-2 text-xs font-bold font-heading text-slate-600">
          <button
            onClick={() => setHistoryPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setHistoryPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* "Good job! ⭐" speech bubble matching screenshot */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="px-3.5 py-1.5 rounded-full bg-amber-400 text-indigo-950 font-heading font-black text-xs shadow-md border border-amber-300 flex items-center gap-1 select-none"
        >
          <span>Good job!</span>
          <span>⭐</span>
        </motion.div>
      </div>
    </div>
  );
};
