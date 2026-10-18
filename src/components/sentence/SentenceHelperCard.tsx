import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Edit3, X, Check } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';
import { interpretSentence, saveLearnedCorrection } from '../../lib/sentenceHelper/sentenceHelperApi';
import { SentenceCandidate } from '../../lib/sentenceHelper/types';
import { PinkCatMascot } from '../mascots/Mascots';

export const SentenceHelperCard: React.FC = () => {
  const { sentenceStrip, voiceOutput, addActivity } = useGestivoStore();
  const [candidates, setCandidates] = useState<SentenceCandidate[]>([]);
  const [engineSource, setEngineSource] = useState<'ai' | 'local'>('local');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const tokens = sentenceStrip.map((s) => s.label);
  const tokensKey = tokens.join(' ');

  // Fetch interpretations whenever the sentence strip changes
  useEffect(() => {
    if (!tokensKey) {
      return;
    }

    let isMounted = true;
    const words = tokensKey.split(' ').filter(Boolean);

    interpretSentence({ tappedWords: words })
      .then((res) => {
        if (isMounted) {
          setCandidates(res.candidates);
          setEngineSource(res.source);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCandidates([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tokensKey]);

  if (tokens.length === 0 || isDismissed || candidates.length === 0) {
    return null;
  }

  const handleSpeak = (candidate: SentenceCandidate, phraseToSpeak: string) => {
    playChime('star');
    // Strip "Maybe: " or "Or: " prefix for natural speech
    const cleanSpeech = phraseToSpeak
      .replace(/^Maybe:\s*['"]?|['"]?$/g, '')
      .replace(/^Or:\s*['"]?|['"]?$/g, '')
      .trim();

    speakText(cleanSpeech, voiceOutput);
    addActivity(cleanSpeech, 'communication', '💡', {
      suggestedPhrase: candidate.phrase,
      finalPhrase: cleanSpeech,
      confidenceBucket: candidate.confidence.toLowerCase() as any,
      signalsSummary: candidate.reason,
      decision: 'confirmed',
      source: 'sentence-helper',
    });
  };

  const handleStartEdit = (candidate: SentenceCandidate) => {
    playChime('pop');
    setEditingCandidateId(candidate.id);
    const cleanSpeech = candidate.phrase
      .replace(/^Maybe:\s*['"]?|['"]?$/g, '')
      .replace(/^Or:\s*['"]?|['"]?$/g, '')
      .trim();
    setEditText(cleanSpeech);
  };

  const handleSaveEdit = (candidate: SentenceCandidate) => {
    if (!editText.trim()) return;
    playChime('success');
    saveLearnedCorrection(tokens, editText.trim());
    handleSpeak(candidate, editText.trim());
    setEditingCandidateId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="w-full card-light p-3.5 sm:p-4 rounded-2xl border border-purple-200/90 shadow-xl my-2 relative overflow-hidden"
    >
      {/* Top Banner */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <PinkCatMascot size={36} showBubble={false} />
          <div>
            <h4 className="text-xs sm:text-sm font-black font-heading text-indigo-950 flex items-center gap-1.5">
              <span>Sentence Helper</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {engineSource === 'ai' ? '✨ Smart AI' : '📱 Local Engine'}
              </span>
            </h4>
            <p className="text-[11px] font-bold text-slate-500">
              Possible interpretations of [{tokens.join(' + ')}]
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playChime('bubble');
            setIsDismissed(true);
          }}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
        >
          Dismiss
        </button>
      </div>

      {/* Candidates List */}
      <div className="space-y-2 mt-3">
        {candidates.map((cand) => {
          const isEditing = editingCandidateId === cand.id;
          const confBadgeClass =
            cand.confidence === 'High'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : cand.confidence === 'Medium'
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-slate-100 text-slate-700 border-slate-300';

          return (
            <div
              key={cand.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-purple-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-purple-400 font-bold text-indigo-950 bg-white"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(cand)}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Check size={12} />
                      <span>Save & Speak</span>
                    </button>
                    <button
                      onClick={() => setEditingCandidateId(null)}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-indigo-950 font-heading">
                        {cand.phrase}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border rounded-md ${confBadgeClass}`}>
                        {cand.confidence}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      {cand.reason}
                    </p>
                  </>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleSpeak(cand, cand.phrase)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-heading font-extrabold text-xs shadow-sm hover:shadow active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 size={13} />
                    <span>Speak</span>
                  </button>
                  <button
                    onClick={() => handleStartEdit(cand)}
                    title="Edit interpretation"
                    className="p-1.5 rounded-xl bg-white hover:bg-purple-100 text-slate-600 border border-slate-200 text-xs cursor-pointer transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Option */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
        <span>Caregiver confirms before speaking</span>
        <button
          onClick={() => {
            playChime('pop');
            setIsDismissed(true);
          }}
          className="text-purple-600 hover:text-purple-800 cursor-pointer"
        >
          None of these
        </button>
      </div>
    </motion.div>
  );
};
