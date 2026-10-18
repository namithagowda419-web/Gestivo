import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Camera,
  AlertTriangle,
  RefreshCw,
  Lock,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import { playChime } from '../../utils/speech';
import { PinkCatMascot } from '../mascots/Mascots';

// 1. Caregiver Consent & Intro Screen
export const ConsentScreen: React.FC<{
  onAccept: () => void;
  onSwitchToBoard: () => void;
}> = ({ onAccept, onSwitchToBoard }) => {
  const [agreed, setAgreed] = useState(true);

  const handleStart = () => {
    if (!agreed) return;
    playChime('star');
    onAccept();
  };

  return (
    <div className="w-full max-w-xl mx-auto card-light p-6 sm:p-8 rounded-[32px] shadow-2xl border-2 border-purple-200/80 text-indigo-950">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
          <Camera size={26} />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black font-heading leading-tight">
            Welcome to Cue Camera
          </h3>
          <p className="text-xs font-bold text-slate-500">
            Gentle Real-Time Cue Suggestions for Caregivers
          </p>
        </div>
      </div>

      <div className="my-3 flex justify-center">
        <PinkCatMascot
          size={56}
          speechText="I'm here to help you observe Aarvi's unique cues! 💖"
        />
      </div>

      <div className="my-4 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
        {/* Privacy badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5">
          <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-heading font-black text-emerald-900 block text-sm">
              100% Private & In-Browser
            </span>
            <span className="text-emerald-800 text-xs">
              Video never leaves this device. No video frames, images, or audio are ever uploaded, recorded, or saved to any server.
            </span>
          </div>
        </div>

        {/* Product principle note */}
        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-2.5">
          <Info size={20} className="text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-heading font-black text-sky-900 block text-sm">
              Suggestions Only — Caregiver Decides
            </span>
            <span className="text-sky-800 text-xs">
              Cue Camera only suggests potential messages based on movement, gaze, and expressions. It never speaks automatically without your confirmation.
            </span>
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900">
          <p className="font-bold mb-1">Notice for Angelman Syndrome & Diverse Communicators:</p>
          <p className="text-slate-600">
            Children have unique individual expressions. You can teach custom cues or calibrate baseline movement anytime.
          </p>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="my-4 pt-3 border-t border-slate-200">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            id="consent-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded-lg text-purple-600 focus:ring-purple-400 mt-0.5 cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-800 leading-snug">
            I understand that Cue Camera provides uncertain suggestions that I must confirm, and I consent to enabling local camera detection on this device.
          </span>
        </label>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
        <button
          id="consent-agree-button"
          onClick={handleStart}
          disabled={!agreed}
          className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-black text-sm shadow-xl shadow-indigo-500/30 border border-indigo-300/50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Camera size={18} />
          <span>Enable Cue Camera 💜</span>
        </button>

        <button
          onClick={onSwitchToBoard}
          className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
        >
          <MessageSquare size={16} />
          <span>Back to Touch Board</span>
        </button>
      </div>
    </div>
  );
};

// 2. Requesting Camera Permission State
export const RequestingPermissionCard: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto glass-panel-glow p-6 rounded-3xl border border-white/20 text-white text-center">
      <PinkCatMascot
        size={56}
        speechText="Tap 'Allow' on your browser prompt! You can do it! ✨"
        className="justify-center mb-3"
      />
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-3 animate-pulse">
        <Camera size={30} />
      </div>
      <h4 className="text-lg font-black font-heading text-white">
        Waiting for Camera Permission...
      </h4>
      <p className="text-xs text-purple-200 mt-1 font-semibold leading-relaxed">
        Please look at your browser prompt and click <strong>"Allow"</strong> to enable the camera.
      </p>
    </div>
  );
};

// 3. Permission Denied Card with Step-by-Step Instructions
export const PermissionDeniedCard: React.FC<{
  onRetry: () => void;
  onSwitchToBoard: () => void;
  onStartVirtual?: () => void;
}> = ({ onRetry, onSwitchToBoard, onStartVirtual }) => {
  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-rose-300 shadow-2xl text-slate-900">
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
          <AlertTriangle size={26} />
        </div>
        <div>
          <h4 className="text-xl font-black font-heading text-rose-950">
            Camera Permission Denied
          </h4>
          <p className="text-xs text-slate-500 font-bold">
            How to allow camera access in your browser:
          </p>
        </div>
      </div>

      <div className="my-3 flex justify-center">
        <PinkCatMascot
          size={52}
          speechText="No worries! Follow the steps below, try our virtual demo camera, or use your touch board anytime! 💬"
        />
      </div>

      <div className="my-4 space-y-2.5 text-xs text-slate-700 font-semibold">
        <div className="p-2.5 rounded-xl bg-slate-100">
          <span className="font-heading font-extrabold text-indigo-900 block">Google Chrome / Edge:</span>
          <span>Click the tune/lock icon on the left of the address bar → Toggle <strong>Camera</strong> to "Allow" → Refresh page.</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100">
          <span className="font-heading font-extrabold text-indigo-900 block">Safari (macOS / iOS):</span>
          <span>Open Settings / Preferences → Websites → Camera → Set permissions for this website to "Allow".</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-100">
          <span className="font-heading font-extrabold text-indigo-900 block">Mobile Android:</span>
          <span>Tap the lock icon in Chrome → Site Settings → Permissions → Camera → Allow.</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200">
        {onStartVirtual && (
          <button
            onClick={onStartVirtual}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-heading font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Try Virtual Demo Camera Without Physical Webcam</span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onRetry}
            className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            <span>Try Again</span>
          </button>

          <button
            onClick={onSwitchToBoard}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <MessageSquare size={15} />
            <span>Continue with Touch Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. Insecure Context Card (Needs HTTPS or Localhost)
export const InsecureContextCard: React.FC<{
  onSwitchToBoard: () => void;
  onStartVirtual?: () => void;
}> = ({ onSwitchToBoard, onStartVirtual }) => {
  const httpsUrl = typeof window !== 'undefined' ? window.location.href.replace('http:', 'https:') : '#';

  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-amber-300 shadow-2xl text-slate-900 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
        <Lock size={28} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="Browsers require HTTPS for camera access! Tap below to switch to HTTPS or try the virtual demo camera! 🔒"
        className="justify-center mb-3"
      />
      <h4 className="text-xl font-black font-heading text-amber-950 mb-1">
        Secure HTTPS Required for Webcam
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
        Browsers block physical cameras over plain HTTP when accessed on network IP addresses. Please switch to the secure <strong>HTTPS</strong> address or test immediately with the <strong>Virtual Demo Camera</strong>.
      </p>

      <div className="flex flex-col gap-2.5">
        <a
          href={httpsUrl}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-heading font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <ShieldCheck size={16} />
          <span>Open Secure HTTPS Link</span>
        </a>

        {onStartVirtual && (
          <button
            onClick={onStartVirtual}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-heading font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Try Virtual Demo Camera (Interactive Gestures)</span>
          </button>
        )}

        <button
          onClick={onSwitchToBoard}
          className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
        >
          Switch to Touch Board
        </button>
      </div>
    </div>
  );
};

// 5. Model Loading Progress Card
export const ModelLoadingCard: React.FC<{
  progress: number;
  statusText: string;
}> = ({ progress, statusText }) => {
  return (
    <div className="w-full max-w-md mx-auto glass-panel-glow p-6 rounded-3xl border border-white/20 text-white text-center">
      <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto mb-3">
        <Sparkles size={28} className="animate-spin text-amber-300" style={{ animationDuration: '6s' }} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="Warming up our offline vision engine... Almost ready to play! 🚀"
        className="justify-center mb-3"
      />
      <h4 className="text-lg font-black font-heading text-white mb-1">
        Starting Vision Engine...
      </h4>
      <p className="text-xs text-purple-200 mb-3 font-semibold">
        {statusText || 'Loading local vision models for offline use...'}
      </p>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/15">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 rounded-full"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="text-[11px] font-bold text-cyan-300 mt-2 block">{progress}%</span>
    </div>
  );
};

// 6. Camera Busy / In Use Card
export const CameraBusyCard: React.FC<{
  onRetry: () => void;
  onSwitchToBoard: () => void;
}> = ({ onRetry, onSwitchToBoard }) => {
  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-amber-300 shadow-2xl text-slate-900 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={28} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="Close other apps using the webcam and we'll try again! 🎥"
        className="justify-center mb-3"
      />
      <h4 className="text-xl font-black font-heading text-amber-950 mb-1">
        Camera is Busy
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
        Your webcam might be in use by another tab (Zoom, Meet, Teams, or another browser window). Please close other apps using the camera and tap retry.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onRetry}
          className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} />
          <span>Retry Camera</span>
        </button>
        <button
          onClick={onSwitchToBoard}
          className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
        >
          Back to Touch Board
        </button>
      </div>
    </div>
  );
};

// 7. No Camera Found Card
export const CameraNotFoundCard: React.FC<{
  onRetry: () => void;
  onSwitchToBoard: () => void;
  onStartVirtual?: () => void;
}> = ({ onRetry, onSwitchToBoard, onStartVirtual }) => {
  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-sky-300 shadow-2xl text-slate-900 text-center">
      <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-3">
        <Camera size={28} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="Plug in your camera, or try our interactive virtual demo camera! 🎈"
        className="justify-center mb-3"
      />
      <h4 className="text-xl font-black font-heading text-sky-950 mb-1">
        No Physical Camera Detected
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
        We couldn't detect a physical webcam plugged into this device. You can connect a camera or test all cue gestures instantly with the <strong>Virtual Demo Camera</strong>!
      </p>
      <div className="flex flex-col gap-2.5">
        {onStartVirtual && (
          <button
            onClick={onStartVirtual}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-heading font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Launch Virtual Demo Camera (Simulated Cues)</span>
          </button>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={onRetry}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            <span>Check Hardware Again</span>
          </button>
          <button
            onClick={onSwitchToBoard}
            className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
          >
            Back to Touch Board
          </button>
        </div>
      </div>
    </div>
  );
};

// 8. Camera Unplugged / Disconnected Mid-Session Card
export const CameraUnpluggedCard: React.FC<{
  onRetry: () => void;
  onSwitchToBoard: () => void;
}> = ({ onRetry, onSwitchToBoard }) => {
  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-rose-300 shadow-2xl text-slate-900 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={28} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="Camera disconnected! Check your cable connection and tap reconnect! 🔌"
        className="justify-center mb-3"
      />
      <h4 className="text-xl font-black font-heading text-rose-950 mb-1">
        Camera Was Disconnected
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
        The camera stream was interrupted or unplugged mid-session. Please check your cable connection and reconnect.
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onRetry}
          className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
        >
          <RefreshCw size={15} />
          <span>Reconnect Camera</span>
        </button>
        <button
          onClick={onSwitchToBoard}
          className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
        >
          Back to Touch Board
        </button>
      </div>
    </div>
  );
};

// 9. General Camera Error Card
export const CameraErrorCard: React.FC<{
  errorMessage: string;
  onRetry: () => void;
  onSwitchToBoard: () => void;
  onStartVirtual?: () => void;
}> = ({ errorMessage, onRetry, onSwitchToBoard, onStartVirtual }) => {
  return (
    <div className="w-full max-w-lg mx-auto card-light p-6 sm:p-7 rounded-[32px] border-2 border-rose-300 shadow-2xl text-slate-900 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-3">
        <AlertTriangle size={28} />
      </div>
      <PinkCatMascot
        size={52}
        speechText="The camera had a hiccup, but you can try the virtual camera or touch board! 💖"
        className="justify-center mb-3"
      />
      <h4 className="text-xl font-black font-heading text-rose-950 mb-1">
        Camera Access Notice
      </h4>
      <p className="text-xs sm:text-sm text-slate-600 font-semibold mb-4 leading-relaxed">
        {errorMessage || 'An error occurred while accessing the camera.'}
      </p>
      <div className="flex flex-col gap-2.5">
        {onStartVirtual && (
          <button
            onClick={onStartVirtual}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-heading font-black text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Launch Virtual Demo Camera</span>
          </button>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <button
            onClick={onRetry}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-heading font-extrabold text-xs shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} />
            <span>Retry Camera</span>
          </button>
          <button
            onClick={onSwitchToBoard}
            className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs border border-slate-300 cursor-pointer"
          >
            Back to Touch Board
          </button>
        </div>
      </div>
    </div>
  );
};

