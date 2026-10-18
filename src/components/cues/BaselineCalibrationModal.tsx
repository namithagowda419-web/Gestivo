import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Check } from 'lucide-react';
import { useCueStore } from '../../store/useCueStore';
import { FrameSignals } from '../../lib/cues/types';
import { playChime, speakText } from '../../utils/speech';
import { PinkCatMascot } from '../mascots/Mascots';

interface BaselineCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  latestSignals: FrameSignals | null;
}

export const BaselineCalibrationModal: React.FC<BaselineCalibrationModalProps> = ({
  isOpen,
  onClose,
  latestSignals,
}) => {
  const { baseline, setBaseline } = useCueStore();

  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [isComplete, setIsComplete] = useState(false);

  const accumulatedSmile = useRef<number[]>([]);
  const accumulatedMotion = useRef<number[]>([]);

  useEffect(() => {
    if (isRecording && latestSignals) {
      accumulatedSmile.current.push(latestSignals.face.smileIntensity);
      accumulatedMotion.current.push(latestSignals.body.motionLevel);
    }
  }, [isRecording, latestSignals]);

  const startCalibration = () => {
    playChime('pop');
    setIsRecording(true);
    setSecondsRemaining(20);
    setIsComplete(false);
    accumulatedSmile.current = [];
    accumulatedMotion.current = [];

    const interval = setInterval(() => {
      setSecondsRemaining((sec) => {
        if (sec <= 1) {
          clearInterval(interval);
          finishCalibration();
          return 0;
        }
        return sec - 1;
      });
    }, 1000);
  };

  const finishCalibration = () => {
    setIsRecording(false);
    playChime('star');

    const smiles = accumulatedSmile.current;
    const motions = accumulatedMotion.current;

    const avgSmile = smiles.length > 0 ? smiles.reduce((a, b) => a + b, 0) / smiles.length : 0.15;
    const avgMotion = motions.length > 0 ? motions.reduce((a, b) => a + b, 0) / motions.length : 0.2;

    setBaseline({
      smileBaseline: Number(avgSmile.toFixed(2)),
      motionBaseline: Number(avgMotion.toFixed(2)),
      tremorBaseline: 0.1,
      gazeCenterOffset: [0, 0],
      recordedAt: new Date().toISOString(),
      isCalibrated: true,
    });

    setIsComplete(true);
    speakText('Baseline calibrated successfully!', true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#241355] via-[#331c77] to-[#140b36] rounded-3xl p-6 sm:p-7 border-2 border-indigo-400/50 shadow-2xl text-white relative text-center"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/20">
          <h3 className="text-xl font-black font-heading text-white">
            Neutral Baseline Calibration
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-200 my-3 font-semibold leading-relaxed">
          Children with Angelman syndrome frequently smile, flap, or have resting tremors.
          A <strong>20-second neutral recording</strong> measures their natural resting state so we don't treat everyday smiles or tremor as false cues.
        </p>

        <PinkCatMascot
          size={52}
          speechText="Relax and look naturally at the camera! You're doing great! 🌟"
          className="justify-center mb-3"
        />

        {/* 20s Progress Circle */}
        <div className="relative w-40 h-40 mx-auto my-6 flex items-center justify-center">
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
              stroke="#38BDF8"
              strokeWidth="8"
              strokeDasharray="276"
              strokeDashoffset={(276 * secondsRemaining) / 20}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-heading text-white">
              {secondsRemaining}s
            </span>
            <span className="text-[11px] font-bold text-sky-300">
              {isRecording ? 'Observing...' : isComplete ? 'Calibrated' : 'Ready'}
            </span>
          </div>
        </div>

        {isComplete && baseline && (
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-400/40 text-xs text-emerald-200 mb-4">
            <p className="font-bold">Natural Resting Baseline Recorded:</p>
            <p className="mt-1">
              Resting Smile: {Math.round(baseline.smileBaseline * 100)}% • Resting Motion: {Math.round(baseline.motionBaseline * 100)}%
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          {!isRecording && !isComplete && (
            <button
              onClick={startCalibration}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-heading font-black text-sm shadow-xl shadow-sky-500/30 cursor-pointer flex items-center gap-2"
            >
              <Play size={18} />
              <span>Start 20s Baseline Recording</span>
            </button>
          )}

          {isComplete && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-heading font-black text-sm shadow-md cursor-pointer flex items-center gap-2"
            >
              <Check size={18} />
              <span>Save & Close</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
