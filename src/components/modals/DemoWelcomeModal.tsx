import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, ShieldCheck, Camera, Check } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { playChime } from '../../utils/speech';

export function DemoWelcomeModal() {
  const { showDemoWelcomeModal, setShowDemoWelcomeModal } = useAuthStore();

  if (!showDemoWelcomeModal) return null;

  const handleClose = () => {
    playChime('star');
    setShowDemoWelcomeModal(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative w-full max-w-lg p-6 sm:p-8 rounded-[32px] bg-gradient-to-b from-[#241344] to-[#140b29] border-2 border-purple-400/40 shadow-2xl shadow-purple-900/60 text-white overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-welcome-title"
        >
          {/* Glowing background orb */}
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

          {/* Mascot Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
            <div className="relative w-24 h-24 flex-shrink-0">
              <motion.img
                animate={{ y: [0, -6, 0], rotate: [-1, 2, -1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                src="/assets/pink-cat.png"
                alt="Pink Cat Helper Mascot"
                width={96}
                height={96}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_16px_rgba(244,114,182,0.4)]"
              />
              <span className="absolute -bottom-1 -right-1 text-xl animate-bounce">💖</span>
            </div>

            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-[11px] font-black uppercase tracking-wider text-purple-200 mb-1.5">
                <Sparkles size={12} className="text-amber-300" /> Demo Session Active
              </div>
              <h2 id="demo-welcome-title" className="text-2xl font-black font-heading text-white">
                Welcome to GESTIVO! ✨
              </h2>
              <p className="text-xs text-purple-200/90 font-medium">
                "Small steps... Make big dreams!"
              </p>
            </div>
          </div>

          {/* Cat Speech Bubble */}
          <div className="relative p-4 rounded-2xl bg-white/10 border border-white/20 mb-5">
            <p className="text-sm font-semibold text-purple-100 leading-relaxed">
              👋 Hi! I'm your helper mascot! You are exploring <strong className="text-amber-300">Aarvi's profile</strong> (Age 6). Everything is pre-filled so you can test all features right away!
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="space-y-2 mb-6 text-xs text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <Check size={16} className="text-emerald-400 flex-shrink-0" />
              <span><strong>AAC Communication Board:</strong> Tap tiles to build phrases & hear text-to-speech.</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <Camera size={16} className="text-cyan-400 flex-shrink-0" />
              <span><strong>Real-Time Cue Camera:</strong> MediaPipe gesture & landmark assistant with teacher wizard.</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck size={16} className="text-amber-400 flex-shrink-0" />
              <span><strong>Caregiver PIN:</strong> The demo PIN is <code className="px-1.5 py-0.5 rounded bg-purple-500/40 text-amber-300 font-mono font-bold">1234</code>.</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-500 text-white font-heading font-black text-base shadow-lg shadow-purple-600/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Star size={18} className="fill-white" />
            Let's Explore!
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
