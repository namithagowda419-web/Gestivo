import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Star,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  Heart,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { playChime } from '../utils/speech';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, signup, forgotPasswordReset, loginDemo } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Signup states
  const [caregiverName, setCaregiverName] = useState('');
  const [childName, setChildName] = useState('Aarvi');
  const [childAge, setChildAge] = useState<number>(6);
  const [caregiverPin, setCaregiverPin] = useState('1234');
  const [consentChecked, setConsentChecked] = useState(false);

  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleTabChange = (tab: 'login' | 'signup' | 'forgot') => {
    playChime('pop');
    setActiveTab(tab);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        playChime('success');
        navigate('/');
      } else {
        setErrorMessage(res.error || 'Login failed. Please check credentials.');
        playChime('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password || !caregiverName || !childName) {
      setErrorMessage('Please complete all required fields.');
      return;
    }

    if (!consentChecked) {
      setErrorMessage('Please agree to local assistive data processing.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        caregiverName,
        email,
        password,
        childName,
        childAge,
        caregiverPin,
      });

      if (res.success) {
        playChime('magic');
        navigate('/');
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
        playChime('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!resetEmail || !resetPin || !newPassword) {
      setErrorMessage('Please fill in all reset fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordReset(resetEmail, resetPin, newPassword);
      if (res.success) {
        playChime('star');
        setSuccessMessage('Password reset successfully! You can now log in.');
        setTimeout(() => {
          setActiveTab('login');
          setEmail(resetEmail);
          setPassword('');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Password reset failed. Verify PIN and email.');
        playChime('error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = () => {
    playChime('magic');
    loginDemo();
    navigate('/');
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0d061f] text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 overflow-x-hidden font-nunito">
      {/* Background enchanted glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[130px]" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[550px] h-[550px] rounded-full bg-cyan-500/15 blur-[140px]" />
        <div className="absolute top-3/4 left-1/3 w-[400px] h-[400px] rounded-full bg-fuchsia-600/15 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left hero display: kids-pets artwork + brand identity */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
          {/* Brand header */}
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white shadow-md">
              <Star size={18} className="fill-white" />
            </span>
            <div>
              <h1 className="text-xl font-black font-heading tracking-wider bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
                GESTIVO
              </h1>
              <p className="text-[10px] font-bold text-cyan-300 tracking-widest uppercase">
                Play • Learn • Grow
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading leading-tight text-white">
              Every Gesture <br />
              <span className="bg-gradient-to-r from-amber-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Has a Voice ✨
              </span>
            </h2>
            <p className="text-sm sm:text-base text-purple-200/80 max-w-md font-medium leading-relaxed">
              An enchanted, science-inspired AAC communication assistant and interactive learning companion for children of all abilities.
            </p>
          </div>

          {/* Hero characters art */}
          <div className="relative w-full max-w-md aspect-[16/10] rounded-3xl overflow-hidden bg-purple-950/40 border border-purple-400/30 p-2 shadow-2xl shadow-purple-950/60 group">
            <img
              src="/assets/kids-pets.png"
              alt="Gestivo friends and friendly mascot pets"
              width={480}
              height={300}
              className="w-full h-full object-contain filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)] transition-transform duration-700 group-hover:scale-105"
            />
            {/* Friendly floating sticker */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-md">
              <span>💖</span>
              <span>Child-first &amp; caregiver-guided</span>
            </div>
          </div>

          {/* Instant Demo Hero Callout */}
          <div className="w-full max-w-md p-4 rounded-2xl bg-gradient-to-r from-purple-900/60 via-fuchsia-900/40 to-cyan-900/60 border border-purple-400/30 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Sparkles size={14} /> Instant Access
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Ready to Test
              </span>
            </div>
            <button
              onClick={handleDemoClick}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 text-slate-950 font-black font-heading text-sm sm:text-base shadow-lg shadow-purple-900/50 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 group"
            >
              <Star size={18} className="fill-slate-950 group-hover:rotate-12 transition-transform" />
              <span>Try Demo (Aarvi, Age 6)</span>
              <ArrowRight size={18} />
            </button>
            <p className="text-[11px] text-slate-300 text-center mt-2">
              Pre-filled goals, speech board, mini-games &amp; cue camera. Zero typing required.
            </p>
          </div>
        </div>

        {/* Right card: Glass panel with Login / Signup / Forgot Password */}
        <div className="lg:col-span-6 w-full">
          <div className="relative rounded-[32px] p-6 sm:p-8 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-purple-950/80">
            {/* Top switcher tabs */}
            <div className="flex rounded-2xl bg-black/30 p-1 mb-6 border border-white/10">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`flex-1 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LogIn size={15} /> Log In
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('signup')}
                className={`flex-1 py-2.5 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'signup'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserPlus size={15} /> Create Account
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('forgot')}
                className={`py-2.5 px-3 rounded-xl font-heading font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === 'forgot'
                    ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Reset with Caregiver PIN"
              >
                <KeyRound size={14} /> PIN Reset
              </button>
            </div>

            {/* Error or Success notification */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center gap-2"
                >
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tab 1: Log In */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Caregiver Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleTabChange('forgot')}
                      className="text-xs text-purple-300 hover:text-purple-100 font-semibold cursor-pointer"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-400 transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white font-heading font-black text-sm shadow-lg shadow-purple-600/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <LogIn size={16} />
                  <span>{loading ? 'Verifying Credentials...' : 'Log In to GESTIVO'}</span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('demo@gestivo.app');
                      setPassword('demo123');
                    }}
                    className="text-xs text-cyan-300 hover:text-cyan-200 underline font-semibold cursor-pointer"
                  >
                    ✨ Click to prefill demo login (demo@gestivo.app)
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Create Account */}
            {activeTab === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Caregiver Name
                    </label>
                    <input
                      type="text"
                      required
                      value={caregiverName}
                      onChange={(e) => setCaregiverName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Caregiver Email
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sarah@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Caregiver 4-Digit PIN
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={caregiverPin}
                      onChange={(e) => setCaregiverPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-xs font-mono tracking-widest focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
                    <Heart size={12} /> Child Profile
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-300 mb-0.5 font-bold">Child's Name</label>
                      <input
                        type="text"
                        required
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        placeholder="e.g. Aarvi"
                        className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-300 mb-0.5 font-bold">Age</label>
                      <input
                        type="number"
                        min={1}
                        max={18}
                        value={childAge}
                        onChange={(e) => setChildAge(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-white text-xs focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 rounded border-white/20 text-purple-600 focus:ring-purple-400"
                  />
                  <span>
                    I consent to local camera cue processing and AAC data storage for my child. (No video or audio is ever uploaded).
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-600 to-cyan-500 text-white font-heading font-black text-sm shadow-lg shadow-purple-600/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  <span>{loading ? 'Creating Account...' : 'Create Account & Begin ✨'}</span>
                </button>
              </form>
            )}

            {/* Tab 3: Forgot Password (PIN Reset) */}
            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <p className="font-bold flex items-center gap-1 mb-1">
                    <ShieldCheck size={14} /> Caregiver PIN Reset
                  </p>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Reset your password locally by confirming your 4-digit Caregiver PIN (default is 1234 in demo).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Account Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Caregiver PIN (4 Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={resetPin}
                    onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="1234"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm font-mono tracking-widest focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New secure password"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className="px-4 py-3 rounded-xl bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-white font-heading font-black text-sm shadow-lg shadow-purple-600/40 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <KeyRound size={16} />
                    <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Prototype Security Notice */}
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-[11px] text-slate-400">
                🔒 <strong>Local Prototype Security:</strong> Passwords are cryptographically hashed using PBKDF2 with SHA-256 and unique salts. No data leaves this device.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
