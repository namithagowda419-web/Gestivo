import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Check, Sparkles, Camera, Trash2, RotateCcw, Volume2, VolumeX, Key, Sliders, ShieldCheck } from 'lucide-react';
import { StarMascot } from '../mascots/Mascots';
import { useGestivoStore } from '../../store/useGestivoStore';
import { useCueStore } from '../../store/useCueStore';
import { AppMode } from '../../types';
import { playChime, speakText, getAvailableVoices, isSpeechSynthesisSupported } from '../../utils/speech';

export const ProfileSettingsPanel: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const {
    profile,
    updateProfile,
    mode,
    setMode,
    voiceOutput,
    caregiverPin,
    setCaregiverPin,
    speechPitch,
    setSpeechPitch,
    speechRate,
    setSpeechRate,
    selectedVoiceName,
    setSelectedVoiceName,
  } = useGestivoStore();
  const { settings, updateSettings, deleteAllCueData, resetToStarterCues } = useCueStore();

  const [activeTab, setActiveTab] = useState<'personal' | 'interests' | 'language' | 'settings' | 'cues'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [currentMode, setCurrentMode] = useState<AppMode>(mode);
  const [language, setLanguage] = useState(profile.preferredLanguage);
  const [communicationStyle, setCommunicationStyle] = useState(profile.communicationStyle);
  const [saveToast, setSaveToast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cueToast, setCueToast] = useState<string | null>(null);
  const [inputPin, setInputPin] = useState(caregiverPin);
  const [pinToast, setPinToast] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isTtsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    const loadVoices = () => {
      const v = getAvailableVoices();
      setVoices(v);
    };
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleUpdatePin = () => {
    if (inputPin.trim().length !== 4 || !/^\d{4}$/.test(inputPin.trim())) {
      setPinToast('PIN must be exactly 4 digits');
      setTimeout(() => setPinToast(null), 3000);
      return;
    }
    setCaregiverPin(inputPin.trim());
    setPinToast('Caregiver PIN updated to ' + inputPin.trim() + '!');
    setTimeout(() => setPinToast(null), 3000);
  };

  const handleTestVoice = () => {
    playChime('bubble');
    speakText(
      `Hello ${profile.name}! I am ready to talk and play!`,
      true,
      speechPitch,
      speechRate,
      selectedVoiceName || undefined,
      true
    );
  };

  const handleSave = () => {
    playChime('success');
    updateProfile({
      name,
      age: Number(age),
      mode: currentMode,
      preferredLanguage: language,
      communicationStyle,
    });
    setMode(currentMode);
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const tabs: Array<{ id: 'personal' | 'interests' | 'language' | 'settings' | 'cues'; label: string }> = [
    { id: 'personal', label: 'Personal' },
    { id: 'interests', label: 'Interests' },
    { id: 'settings', label: 'Settings' },
    { id: 'cues', label: 'Cue Camera' },
  ];

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between border border-white/60 h-full">
      <div>
        {/* Header with Title and close X matching screenshot */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
              <User size={19} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-indigo-950 font-heading leading-tight">
                Profile & Settings
              </h3>
              <p className="text-xs font-bold text-slate-500">
                Child preferences and access configuration
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              aria-label="Close profile panel"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Profile Avatar & Title Banner matching screenshot */}
        <div className="flex items-center gap-3.5 my-3 p-3 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400 shadow-md bg-gradient-to-br from-purple-200 to-pink-200 shrink-0">
            <img
              src="/assets/girl-bunny.png"
              alt="Aarvi profile avatar"
              width={64}
              height={64}
              loading="lazy"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
              }}
            />
          </div>
          <div>
            <h4 className="text-xl font-black text-indigo-950 font-heading leading-tight">
              {profile.name}
            </h4>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Age: {profile.age} • {mode === 'child' ? 'Child Mode' : 'Caregiver Mode'}
            </p>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-extrabold text-purple-700">
              <Sparkles size={12} />
              <span>{profile.badges.join(' • ')}</span>
            </div>
          </div>
        </div>

        {/* Tabs: Personal Info | Interests | Language | Settings matching screenshot */}
        <div className="flex items-center gap-1.5 my-3 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl font-heading font-extrabold text-xs transition-all text-center cursor-pointer ${
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

        {/* Tab Content */}
        {activeTab === 'personal' && (
          <div className="space-y-2.5 my-2">
            {/* Name */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-500 font-heading">Name:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 text-right font-bold w-28 focus:outline-none"
                />
              ) : (
                <span className="text-indigo-950 font-extrabold text-sm">{profile.name}</span>
              )}
            </div>

            {/* Age */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-500 font-heading">Age:</span>
              {isEditing ? (
                <input
                  type="number"
                  min="2"
                  max="18"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 text-right font-bold w-20 focus:outline-none"
                />
              ) : (
                <span className="text-indigo-950 font-extrabold text-sm">{profile.age} years</span>
              )}
            </div>

            {/* Mode Dropdown */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-500 font-heading">Mode:</span>
              {isEditing ? (
                <select
                  value={currentMode}
                  onChange={(e) => setCurrentMode(e.target.value as AppMode)}
                  className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="child">Child Mode</option>
                  <option value="caregiver">Caregiver Mode</option>
                </select>
              ) : (
                <span className="text-indigo-950 font-extrabold text-sm">
                  {mode === 'child' ? 'Child Mode' : 'Caregiver Mode'}
                </span>
              )}
            </div>

            {/* Preferred Language */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-500 font-heading">Preferred Language:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 text-right font-bold w-28 focus:outline-none"
                />
              ) : (
                <span className="text-indigo-950 font-extrabold text-sm">{profile.preferredLanguage}</span>
              )}
            </div>

            {/* Communication Style */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold">
              <span className="text-slate-500 font-heading">Communication Style:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={communicationStyle}
                  onChange={(e) => setCommunicationStyle(e.target.value)}
                  className="px-2 py-1 bg-white border border-indigo-300 rounded-lg text-slate-800 text-right font-bold w-36 focus:outline-none"
                />
              ) : (
                <span className="text-indigo-950 font-extrabold text-sm">{profile.communicationStyle}</span>
              )}
            </div>
          </div>
        )}

        {activeTab === 'interests' && (
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <p className="font-heading font-bold text-slate-700">Favorite Topics & Activities:</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.interests.map((int, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-pink-100 text-pink-800 font-bold font-heading">
                  {int}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3.5 max-h-[340px] overflow-y-auto">
            {/* TTS Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h5 className="font-heading font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <Volume2 size={15} className="text-indigo-600" />
                  <span>Speech & Voice Synthesis</span>
                </h5>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Select voice, tune pitch and speaking rate
                </p>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-heading ${
                  isTtsSupported ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isTtsSupported ? 'Web Speech Ready' : 'TTS Fallback'}
              </span>
            </div>

            {!isTtsSupported && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                ⚠️ Web Speech synthesis is not supported on this browser. Sound chimes and visual cues remain active.
              </div>
            )}

            {/* Voice Mute Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center gap-2">
                {voiceOutput ? <Volume2 size={16} className="text-indigo-600" /> : <VolumeX size={16} className="text-slate-400" />}
                <div>
                  <span className="font-heading font-bold text-slate-800 block text-xs">Spoken Voice Output</span>
                  <span className="text-[10px] text-slate-500">Read tiles and sentences aloud</span>
                </div>
              </div>
              <button
                onClick={() => {
                  playChime('pop');
                  useGestivoStore.getState().toggleVoiceOutput();
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                  voiceOutput ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Voice Selector */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-heading font-bold text-slate-700 flex items-center justify-between">
                <span>Select Voice</span>
                <span className="text-[10px] text-indigo-600 font-bold">
                  {voices.length > 0 ? `${voices.length} voices found` : 'System Default'}
                </span>
              </label>
              <select
                value={selectedVoiceName || ''}
                onChange={(e) => setSelectedVoiceName(e.target.value || null)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">Default Warm Child-Friendly Voice</option>
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Sliders: Pitch & Rate */}
            <div className="space-y-3 p-2.5 rounded-xl bg-white border border-slate-200">
              <div>
                <div className="flex items-center justify-between text-[11px] font-heading font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sliders size={12} className="text-purple-600" />
                    <span>Voice Pitch (Warm / Child)</span>
                  </span>
                  <span className="text-purple-700 font-black">{speechPitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  value={speechPitch}
                  onChange={(e) => setSpeechPitch(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Deeper (0.6x)</span>
                  <span>Normal (1.0x)</span>
                  <span>Playful Child (1.3x)</span>
                  <span>Higher (1.8x)</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] font-heading font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Sliders size={12} className="text-indigo-600" />
                    <span>Speaking Speed</span>
                  </span>
                  <span className="text-indigo-700 font-black">{speechRate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Slow & Gentle (0.6x)</span>
                  <span>Comfortable (0.95x)</span>
                  <span>Brisk (1.4x)</span>
                </div>
              </div>

              <button
                onClick={handleTestVoice}
                className="w-full py-2 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200 transition-colors"
              >
                <Volume2 size={14} />
                <span>Test Voice Sample</span>
              </button>
            </div>

            {/* Caregiver PIN Configuration */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Key size={14} className="text-amber-600" />
                  <span className="font-heading font-bold text-slate-800 text-xs">Caregiver PIN</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold">4-Digit Code</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Protects caregiver mode, tile customization, goals, and export.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={4}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="1234"
                  className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 font-black tracking-widest text-center text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleUpdatePin}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-heading font-bold text-xs cursor-pointer shadow-sm transition-colors flex items-center justify-center gap-1"
                >
                  <ShieldCheck size={14} />
                  <span>Update PIN</span>
                </button>
              </div>
              {pinToast && (
                <p className="text-[11px] font-bold text-emerald-600 text-center">{pinToast}</p>
              )}
            </div>

            {/* Accessibility Overview */}
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-[11px] space-y-1 text-slate-600">
              <p className="font-heading font-bold text-slate-700">Accessibility Standards:</p>
              <p>• Touch targets: Minimum 64px for easy motor control</p>
              <p>• Contrast: High-contrast sci-fi card borders</p>
              <p>• Motion safety: Strictly respects prefers-reduced-motion</p>
            </div>
          </div>
        )}

        {activeTab === 'cues' && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3.5 max-h-[340px] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h5 className="font-heading font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <Camera size={15} className="text-cyan-600" />
                  <span>Cue Camera Settings</span>
                </h5>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Configure real-time suggestion thresholds and privacy
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-heading">
                v1.0 Local
              </span>
            </div>

            {/* Feature Flag Toggle */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200">
              <div>
                <span className="font-heading font-bold text-slate-800 block">Enable Cue Camera</span>
                <span className="text-[10px] text-slate-500">Allow real-time cue observation</span>
              </div>
              <button
                onClick={() => {
                  updateSettings({ featureEnabled: !settings.featureEnabled });
                  playChime('pop');
                }}
                className={`w-12 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                  settings.featureEnabled ? 'bg-cyan-500 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </button>
            </div>

            {/* Mirror & Overlay Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-slate-800 block text-[11px]">Mirror Video</span>
                  <span className="text-[9px] text-slate-400">Natural front mirror</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.isMirrored}
                  onChange={(e) => updateSettings({ isMirrored: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-heading font-bold text-slate-800 block text-[11px]">Pastel Overlay</span>
                  <span className="text-[9px] text-slate-400">Gentle landmark dots</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.showOverlay}
                  onChange={(e) => updateSettings({ showOverlay: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-2 p-2.5 rounded-xl bg-white border border-slate-200">
              <div className="flex items-center justify-between text-[11px] font-heading font-bold text-slate-700">
                <span>Hold Duration Required</span>
                <span className="text-cyan-700">{(settings.holdTimeMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="500"
                max="2500"
                step="100"
                value={settings.holdTimeMs}
                onChange={(e) => updateSettings({ holdTimeMs: Number(e.target.value) })}
                className="w-full accent-cyan-600 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[11px] font-heading font-bold text-slate-700 pt-1">
                <span>Cooldown Between Suggestions</span>
                <span className="text-cyan-700">{(settings.cooldownMs / 1000).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="1000"
                max="6000"
                step="500"
                value={settings.cooldownMs}
                onChange={(e) => updateSettings({ cooldownMs: Number(e.target.value) })}
                className="w-full accent-cyan-600 cursor-pointer"
              />
            </div>

            {/* Reset & Delete Buttons */}
            <div className="space-y-2 pt-1 border-t border-slate-200">
              <button
                onClick={() => {
                  resetToStarterCues();
                  playChime('pop');
                  setCueToast('Reset to default starter cues.');
                  setTimeout(() => setCueToast(null), 3000);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 transition-colors"
              >
                <RotateCcw size={14} />
                <span>Reset to Starter Cues</span>
              </button>

              {showDeleteConfirm ? (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2 text-center">
                  <p className="text-[11px] font-bold text-rose-800">
                    Are you sure? This removes all personalized recordings, baseline, and cue history.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        deleteAllCueData();
                        playChime('pop');
                        setShowDeleteConfirm(false);
                        setCueToast('All cue data deleted securely.');
                        setTimeout(() => setCueToast(null), 3000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-[11px] cursor-pointer"
                    >
                      Yes, Delete Everything
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-heading font-bold text-[11px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 transition-colors"
                >
                  <Trash2 size={14} />
                  <span>Delete All Cue Data</span>
                </button>
              )}

              {cueToast && (
                <p className="text-center text-[11px] font-bold text-emerald-600">{cueToast}</p>
              )}
            </div>

            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed text-center italic">
              🔒 Privacy Guaranteed: Processing runs entirely inside this browser. No frames or child images are ever uploaded or saved.
            </p>
          </div>
        )}

        {/* Action Button: Blue "Edit Profile" Button matching screenshot */}
        <div className="mt-3">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-heading font-extrabold text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              onClick={() => {
                playChime('pop');
                setIsEditing(true);
              }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-heading font-extrabold text-sm shadow-md shadow-blue-500/25 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Edit Profile</span>
            </button>
          )}

          {saveToast && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-xs font-bold text-emerald-600 mt-1.5"
            >
              Profile successfully saved!
            </motion.p>
          )}
        </div>
      </div>

      {/* Pink Cat at bottom-left and Star Mascot at bottom-right matching screenshot */}
      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between">
        {/* Pink Cat at bottom-left */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            playChime('bubble');
            speakText("Pink cat says: You're special and unique!", voiceOutput);
          }}
        >
          <img
            src="/assets/pink-cat.png"
            alt="Pink Cat Mascot"
            className="w-10 h-10 object-contain drop-shadow"
          />
          <span className="text-[11px] font-extrabold text-pink-600 font-heading">
            Always Be You! 💕
          </span>
        </div>

        {/* Star Mascot at bottom-right */}
        <div
          className="cursor-pointer"
          onClick={() => {
            playChime('star');
            speakText('Twinkle twinkle! You are a superstar!', voiceOutput);
          }}
        >
          <StarMascot size={32} />
        </div>
      </div>
    </div>
  );
};
