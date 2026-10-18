import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';

export const CueCameraInsightsCard: React.FC = () => {
  const { decisionLogs } = useCueStore();

  const totalDecisions = decisionLogs.length;
  const confirmedCount = decisionLogs.filter((d) => d.decision === 'confirmed').length;
  const changedCount = decisionLogs.filter((d) => d.decision === 'changed').length;
  const dismissedCount = decisionLogs.filter((d) => d.decision === 'dismissed').length;

  const confirmationRate = totalDecisions > 0 ? Math.round((confirmedCount / totalDecisions) * 100) : 0;
  const correctionRate = totalDecisions > 0 ? Math.round((changedCount / totalDecisions) * 100) : 0;

  // Most frequent confirmed phrases
  const phraseCounts: { [key: string]: number } = {};
  decisionLogs
    .filter((d) => d.decision === 'confirmed' || d.decision === 'changed')
    .forEach((d) => {
      phraseCounts[d.finalPhrase] = (phraseCounts[d.finalPhrase] || 0) + 1;
    });

  const topPhrases = Object.entries(phraseCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div id="cue-insights-card" className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between border border-white/60">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-lg font-black font-heading text-indigo-950 leading-tight">
                Cue Camera Insights
              </h4>
              <p className="text-xs font-bold text-slate-500">
                Based on caregiver feedback for this child
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-heading">
            Per-Child
          </span>
        </div>

        {totalDecisions === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-semibold italic">
            No cue decisions recorded yet. As you confirm or change suggestions, personalized insights will appear here.
          </div>
        ) : (
          <div className="space-y-3.5 my-3">
            {/* Stat numbers */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-heading font-bold block">Confirmed</span>
                <span className="text-lg font-black text-emerald-950 font-heading">
                  {confirmedCount} ({confirmationRate}%)
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-xs text-amber-800 font-heading font-bold block">Corrected</span>
                <span className="text-lg font-black text-amber-950 font-heading">
                  {changedCount} ({correctionRate}%)
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-100 border border-slate-200">
                <span className="text-xs text-slate-600 font-heading font-bold block">Dismissed</span>
                <span className="text-lg font-black text-slate-800 font-heading">
                  {dismissedCount}
                </span>
              </div>
            </div>

            {/* Most frequent cues */}
            {topPhrases.length > 0 && (
              <div>
                <span className="text-xs font-extrabold text-slate-700 block mb-1.5 font-heading">
                  Most Frequent Confirmed Cues:
                </span>
                <div className="space-y-1.5">
                  {topPhrases.map(([phrase, count], idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold font-heading"
                    >
                      <span className="text-slate-800 truncate">"{phrase}"</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-black shrink-0">
                        {count} times
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-semibold flex items-center justify-between">
        <span>Caregiver Accuracy: {confirmationRate}%</span>
        <span className="text-indigo-600 font-bold">Privacy: Local Only</span>
      </div>
    </div>
  );
};
