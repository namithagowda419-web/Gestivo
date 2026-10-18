import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Baby,
  HeartHandshake,
  MessageSquareText,
  Clock,
  User,
  Settings,
  Volume2,
  VolumeX,
  Sparkles,
  Camera,
  Gamepad2,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { StarMascot } from '../mascots/Mascots';
import { useGestivoStore } from '../../store/useGestivoStore';
import { useAuthStore } from '../../store/useAuthStore';
import { playChime } from '../../utils/speech';

import { CaregiverPinModal } from '../modals/CaregiverPinModal';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { mode, setMode, voiceOutput, toggleVoiceOutput, isCaregiverUnlocked } = useGestivoStore();
  const { session, resetDemoData, logout } = useAuthStore();
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, color: 'from-blue-500 to-cyan-400' },
    { id: 'cue-camera', label: 'Cue Camera', icon: Camera, color: 'from-cyan-400 to-blue-500' },
    { id: 'child', label: 'Child Mode', icon: Baby, color: 'from-amber-400 to-orange-500', isModeChild: true },
    { id: 'caregiver', label: 'Caregiver Mode', icon: HeartHandshake, color: 'from-purple-500 to-pink-500', isModeCaregiver: true },
    { id: 'board', label: 'Communication Board', icon: MessageSquareText, color: 'from-emerald-400 to-teal-500' },
    { id: 'play', label: 'Play & Learn', icon: Gamepad2, color: 'from-yellow-400 to-amber-500' },
    { id: 'history', label: 'History', icon: Clock, color: 'from-sky-400 to-indigo-500' },
    { id: 'profile', label: 'Profile', icon: User, color: 'from-pink-400 to-rose-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'from-violet-400 to-purple-600' },
  ];

  const handleItemClick = (item: (typeof navItems)[0]) => {
    playChime('pop');
    if (item.isModeChild) {
      setMode('child');
      onNavigate(item.id);
      if (onCloseMobile) onCloseMobile();
      return;
    }

    if (item.isModeCaregiver) {
      if (!isCaregiverUnlocked) {
        setIsPinModalOpen(true);
        return;
      }
      setMode('caregiver');
      onNavigate(item.id);
      if (onCloseMobile) onCloseMobile();
      return;
    }

    onNavigate(item.id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 md:w-72 glass-panel p-4 md:p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-white/20 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-white/15">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
              <StarMascot size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] leading-none font-heading">
                GESTIVO
              </h1>
              <p className="text-xs md:text-sm font-semibold tracking-wider text-cyan-300 mt-1 flex items-center gap-1 font-heading">
                Play • Learn • Grow <Sparkles size={13} className="text-amber-300 animate-pulse" />
              </p>
            </div>
          </div>

          {/* Current Active Mode Pill */}
          <div className="mb-3 px-2">
            <div
              className={`p-2.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all border ${
                mode === 'child'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-200'
                  : 'bg-purple-500/20 border-purple-400/40 text-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="uppercase tracking-wider">
                  {mode === 'child' ? 'Child Explorer' : 'Caregiver Hub'}
                </span>
              </div>
              <button
                onClick={() => setMode(mode === 'child' ? 'caregiver' : 'child')}
                className="text-[11px] underline hover:text-white transition-colors cursor-pointer"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Demo Mode Badge with Reset and Exit actions */}
          {session.isDemo && (
            <div className="mb-3 px-2">
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/25 to-purple-500/25 border border-amber-400/40 shadow-sm text-xs">
                <div className="flex items-center justify-between mb-1.5 font-bold text-amber-200">
                  <span className="flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-300 animate-spin" />
                    <span>Demo Mode</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-400/30 text-amber-100 font-extrabold">
                    Aarvi (6)
                  </span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button
                    onClick={() => {
                      playChime('pop');
                      resetDemoData();
                    }}
                    className="flex-1 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold text-amber-100 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Reset to default pre-filled data"
                  >
                    <RotateCcw size={10} /> Reset Data
                  </button>
                  <button
                    onClick={() => {
                      playChime('pop');
                      logout();
                    }}
                    className="py-1 px-2 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 text-[10px] font-bold text-rose-200 cursor-pointer transition-colors"
                    title="Exit demo session"
                  >
                    Exit Demo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nav Items */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentView === item.id ||
                (item.isModeChild && mode === 'child' && currentView === 'home') ||
                (item.isModeCaregiver && mode === 'caregiver' && currentView === 'caregiver');

              return (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => handleItemClick(item)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm md:text-base text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/35 border border-cyan-300/60 scale-[1.02]'
                      : 'text-slate-200 hover:text-white hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20' : 'bg-white/5'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-slate-300'} />
                  </div>
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activePillIndicator"
                      className="ml-auto w-2 h-2 rounded-full bg-white shadow-sm"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Audio & Helper Controls */}
        <div className="pt-4 border-t border-white/15 space-y-2 px-2">
          {/* Voice toggle button */}
          <button
            id="sidebar-voice-toggle"
            onClick={toggleVoiceOutput}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              voiceOutput
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {voiceOutput ? <Volume2 size={16} /> : <VolumeX size={16} />}
              Voice Output
            </span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/20">
              {voiceOutput ? 'ON' : 'MUTED'}
            </span>
          </button>

          {/* Logout button */}
          <button
            onClick={() => {
              playChime('pop');
              logout();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 transition-all cursor-pointer"
            aria-label="Log out of GESTIVO"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>

          {/* Child Mode Quick Watermark */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-purple-200/60 font-semibold pt-1">
            <span>GESTIVO AAC v1.0</span>
            <span>•</span>
            <span>Child-Safe</span>
          </div>
        </div>
      </aside>

      {/* Caregiver PIN Verification Modal */}
      <CaregiverPinModal
        isOpen={isPinModalOpen}
        onSuccess={() => {
          setMode('caregiver');
          onNavigate('caregiver');
          if (onCloseMobile) onCloseMobile();
        }}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
};
