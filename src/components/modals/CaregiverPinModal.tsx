import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Check } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';
import { NimoMascot } from '../mascots/Mascots';

interface CaregiverPinModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const CaregiverPinModal: React.FC<CaregiverPinModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const { unlockCaregiver, voiceOutput } = useGestivoStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    playChime('pop');
    setError(false);
    setPin((prev) => {
      if (prev.length < 4) {
        const nextPin = prev + digit;
        if (nextPin.length === 4) {
          setTimeout(() => verifyPin(nextPin), 50);
        }
        return nextPin;
      }
      return prev;
    });
  };

  const handleClear = () => {
    playChime('bubble');
    setPin('');
    setError(false);
  };

  const verifyPin = (codeToVerify: string) => {
    const success = unlockCaregiver(codeToVerify);
    if (success) {
      playChime('success');
      speakText('Caregiver mode unlocked!', voiceOutput);
      onSuccess();
      onClose();
    } else {
      playChime('card');
      setError(true);
      speakText('Incorrect PIN. Default is 1234.', voiceOutput);
      setTimeout(() => setPin(''), 600);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-purple-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-sm rounded-[32px] card-light p-6 shadow-2xl border border-white/80 relative text-indigo-950"
        >
          {/* Close button */}
          <button
            onClick={() => {
              playChime('bubble');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
            aria-label="Close PIN modal"
          >
            <X size={20} />
          </button>

          {/* Mascot & Header */}
          <div className="flex flex-col items-center text-center mb-4">
            <NimoMascot size={56} showBubble={false} />
            <div className="mt-2 flex items-center gap-2">
              <Lock className="text-purple-600" size={20} />
              <h3 className="text-2xl font-black font-heading text-indigo-950">Caregiver Access</h3>
            </div>
            <p className="text-xs font-bold text-slate-500 mt-1">
              Please enter your 4-digit caregiver PIN (Default: 1234)
            </p>
          </div>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 my-4">
            {[0, 1, 2, 3].map((index) => {
              const filled = pin.length > index;
              return (
                <motion.div
                  key={index}
                  animate={error ? { x: [-8, 8, -6, 6, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`w-4 h-4 rounded-full border-2 transition-all ${
                    error
                      ? 'border-rose-500 bg-rose-500'
                      : filled
                      ? 'border-purple-600 bg-purple-600 scale-110 shadow-md shadow-purple-500/30'
                      : 'border-slate-300 bg-slate-100'
                  }`}
                />
              );
            })}
          </div>

          {error && (
            <p className="text-xs font-bold text-rose-500 text-center mb-3">
              Incorrect PIN. (Hint: default is 1234)
            </p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2.5 my-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                id={`btn-pin-${digit}`}
                onClick={() => handleDigit(digit)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-purple-100 font-heading font-black text-lg text-indigo-950 transition-all border border-slate-200/80 active:scale-95 shadow-sm cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 font-heading font-extrabold text-xs text-rose-700 transition-all border border-rose-200 active:scale-95 flex items-center justify-center"
            >
              Clear
            </button>
            <button
              onClick={() => handleDigit('0')}
              className="py-3 rounded-2xl bg-slate-100 hover:bg-purple-100 font-heading font-black text-lg text-indigo-950 transition-all border border-slate-200/80 active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              onClick={() => {
                if (pin.length === 4) verifyPin(pin);
              }}
              disabled={pin.length < 4}
              className="py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-heading font-extrabold text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Check size={16} />
              <span>OK</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
