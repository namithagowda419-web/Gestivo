import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Check, ArrowRight, ArrowLeft, Camera } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { FrameSignals } from '../../lib/cues/types';
import { playChime, speakText } from '../../utils/speech';
import { PinkCatMascot } from '../mascots/Mascots';

interface TeachCueWizardProps {
  isOpen: boolean;
  onClose: () => void;
  latestSignals: FrameSignals | null;
}

export const TeachCueWizard: React.FC<TeachCueWizardProps> = ({ isOpen, onClose, latestSignals }) => {
  const { addCustomCue } = useCueStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [phrase, setPhrase] = useState('');
  const [icon, setIcon] = useState('🌟');
  const [category, setCategory] = useState('Personal');

  // Step 2: Recording clips
  const [recordedClips, setRecordedClips] = useState<number[][]>([]);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);

  const currentClipVectors = useRef<number[][]>([]);

  // Sample phrases that caregiver can quickly pick
  const quickPhrases = [
    { text: 'I want water', icon: '🥤' },
    { text: 'More please', icon: '➕' },
    { text: 'Look at this!', icon: '👀' },
    { text: 'All done', icon: '✨' },
    { text: 'I feel happy', icon: '😊' },
    { text: 'Need a break', icon: '🛌' },
  ];

  // Capture signal vectors while recording
  useEffect(() => {
    if (isRecordingClip && latestSignals) {
      currentClipVectors.current.push([...latestSignals.featureVector]);
    }
  }, [isRecordingClip, latestSignals]);

  // Handle 3-second clip recording
  const startRecordingClip = () => {
    if (!latestSignals) return;
    playChime('pop');
    setIsRecordingClip(true);
    setRecordingProgress(0);
    currentClipVectors.current = [];

    const durationMs = 3000;
    const intervalMs = 100;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += intervalMs;
      setRecordingProgress(Math.min(100, (elapsed / durationMs) * 100));

      if (elapsed >= durationMs) {
        clearInterval(timer);
        setIsRecordingClip(false);
        playChime('success');
        if (currentClipVectors.current.length > 0) {
          // Average the vectors in this 3s clip into one representative vector
          const clipLength = currentClipVectors.current.length;
          const vectorDim = currentClipVectors.current[0].length;
          const avgVector = new Array(vectorDim).fill(0);

          for (const vec of currentClipVectors.current) {
            for (let i = 0; i < vectorDim; i++) {
              avgVector[i] += vec[i] / clipLength;
            }
          }

          setRecordedClips((prev) => [...prev, avgVector]);
        }
      }
    }, intervalMs);
  };

  // Compute live confidence on Step 3
  const tryItConfidence = useMemo(() => {
    if (step === 3 && recordedClips.length > 0 && latestSignals) {
      const currentVec = latestSignals.featureVector;
      let minDistance = Infinity;

      for (const sample of recordedClips) {
        let dist = 0;
        for (let i = 0; i < currentVec.length; i++) {
          const d = currentVec[i] - sample[i];
          dist += d * d;
        }
        dist = Math.sqrt(dist);
        if (dist < minDistance) minDistance = dist;
      }

      return Math.max(0, Math.min(1.0, 1.0 - minDistance / 2.0));
    }
    return 0;
  }, [step, recordedClips, latestSignals]);

  const handleSaveCue = () => {
    playChime('star');
    addCustomCue(
      {
        phrase: phrase.trim(),
        icon,
        category,
        active: true,
        isStarter: false,
      },
      recordedClips
    );

    speakText(`Taught new cue: ${phrase}`, true);
    setStep(4);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-2xl bg-gradient-to-b from-[#241355] via-[#331c77] to-[#140b36] rounded-3xl p-5 sm:p-7 border-2 border-purple-400/50 shadow-2xl text-white relative max-h-[92vh] overflow-y-auto"
      >
        {/* Wizard Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🎓</span>
            <div>
              <h3 className="text-xl font-black font-heading tracking-wide">
                Teach a Cue Wizard
              </h3>
              <p className="text-xs text-purple-200">
                Step {step} of 4 • Train personalized gestures for your child
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between my-4 px-2">
          {['1. Choose Message', '2. Record Clips', '3. Test Live', '4. Finished'].map((name, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs font-bold font-heading">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  step > i + 1
                    ? 'bg-emerald-500 text-white'
                    : step === i + 1
                    ? 'bg-amber-400 text-indigo-950 ring-2 ring-amber-300'
                    : 'bg-white/10 text-slate-400'
                }`}
              >
                {step > i + 1 ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline text-purple-200">{name}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Choose Message */}
        {step === 1 && (
          <div className="space-y-4 my-2">
            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
              What message does this movement or expression represent for your child?
            </p>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                Message / Phrase:
              </label>
              <input
                type="text"
                placeholder="e.g. I want to play or Drink water"
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>

            {/* Quick Pick suggestions */}
            <div>
              <span className="text-xs text-purple-300 font-bold block mb-1.5 font-heading">
                Or pick from common phrases:
              </span>
              <div className="flex flex-wrap gap-2">
                {quickPhrases.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setPhrase(q.text);
                      setIcon(q.icon);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-200 border border-white/15 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{q.icon}</span>
                    <span>{q.text}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 font-heading">
                  Icon (Emoji):
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xl focus:outline-none"
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
                  <option value="Requests">Requests</option>
                  <option value="Needs">Needs</option>
                  <option value="Feelings">Feelings</option>
                  <option value="Social">Social</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={!phrase.trim()}
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-950 font-heading font-black text-sm shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Next: Record Examples</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Record Clips */}
        {step === 2 && (
          <div className="space-y-4 my-2 text-center">
            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed max-w-lg mx-auto">
              Have your child make the movement (or guide gently) while you record 3-second example clips.
              We recommend <strong>10–30 clips</strong> for best accuracy. Only signal measurements are stored, never video.
            </p>

            {/* Recording Progress Ring */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="transparent"
                    stroke="#F59E0B"
                    strokeWidth="8"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * recordingProgress) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-100"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl">{icon}</span>
                  <span className="text-xs font-black font-heading text-white mt-1">
                    {recordedClips.length} Clips
                  </span>
                </div>
              </div>

              <button
                disabled={isRecordingClip}
                onClick={startRecordingClip}
                className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 disabled:opacity-50 text-white font-heading font-black text-sm shadow-xl shadow-rose-500/30 cursor-pointer flex items-center gap-2"
              >
                <Camera size={18} />
                <span>{isRecordingClip ? 'Recording 3s Clip...' : '+ Record 3-Second Clip'}</span>
              </button>
            </div>

            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 text-xs text-purple-200 flex items-center justify-between">
              <span>Recorded Examples: <strong>{recordedClips.length}</strong> (Minimum 3 to test)</span>
              {recordedClips.length > 0 && (
                <button
                  onClick={() => setRecordedClips([])}
                  className="text-rose-300 hover:underline cursor-pointer"
                >
                  Reset Clips
                </button>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/15">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>

              <button
                disabled={recordedClips.length < 3}
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-950 font-heading font-black text-sm shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Next: Test Live</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Test Live */}
        {step === 3 && (
          <div className="space-y-4 my-2 text-center">
            <p className="text-xs sm:text-sm text-slate-200 font-semibold leading-relaxed">
              Try performing the cue in front of the camera now to see the live confidence score!
            </p>

            {/* Live confidence meter */}
            <div className="p-5 rounded-3xl bg-white/10 border border-white/20 max-w-sm mx-auto space-y-3">
              <span className="text-4xl">{icon}</span>
              <h4 className="text-lg font-black font-heading text-white">
                "{phrase}"
              </h4>

              <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/20">
                <motion.div
                  className={`h-full rounded-full transition-all duration-300 ${
                    tryItConfidence >= 0.8
                      ? 'bg-emerald-400'
                      : tryItConfidence >= 0.55
                      ? 'bg-amber-400'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.round(tryItConfidence * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold font-heading">
                <span>Confidence:</span>
                <span className="text-amber-300">{Math.round(tryItConfidence * 100)}%</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-white/15">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-heading font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                <span>Add More Clips</span>
              </button>

              <button
                onClick={handleSaveCue}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-heading font-black text-sm shadow-xl shadow-emerald-500/30 cursor-pointer flex items-center gap-2"
              >
                <Check size={18} />
                <span>Save to Child Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success & Profile Management */}
        {step === 4 && (
          <div className="space-y-4 my-2 text-center">
            <PinkCatMascot
              size={64}
              speechText={`Awesome job! "${phrase}" is now saved! You can do it! 🎉`}
              className="justify-center mb-2"
            />

            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto mb-2 border border-emerald-400/40">
              <Check size={36} />
            </div>

            <h4 className="text-xl font-black font-heading text-white">
              Cue Successfully Taught! ⭐
            </h4>
            <p className="text-xs sm:text-sm text-purple-200 max-w-md mx-auto">
              "{phrase}" has been saved to your child's profile and will now be prioritized during Cue Camera observation.
            </p>

            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-heading font-black text-sm shadow-md cursor-pointer"
            >
              Done & Return to Camera
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
