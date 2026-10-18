import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, User, Heart, Globe, Settings, ShieldCheck } from 'lucide-react';
import { useGestivoStore } from '../../store/useGestivoStore';
import { playChime, speakText } from '../../utils/speech';

export const MyProfileCard: React.FC<{ onOpenSettings?: () => void }> = ({ onOpenSettings }) => {
  const { profile, mode, setActiveModal, voiceOutput } = useGestivoStore();

  const handleOpenSettings = (tabName: string) => {
    playChime('pop');
    if (onOpenSettings) onOpenSettings();
    else setActiveModal('profileSettings');
    speakText(`Opening ${tabName}`, voiceOutput);
  };

  const rows = [
    { id: 'personal', label: 'Personal Information', icon: User, color: 'text-blue-500' },
    { id: 'interests', label: 'Interests', icon: Heart, color: 'text-pink-500' },
    { id: 'language', label: 'Language', icon: Globe, color: 'text-amber-500' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-purple-500' },
  ];

  return (
    <div className="card-light p-4 sm:p-5 rounded-[28px] shadow-2xl relative flex flex-col justify-between">
      <div>
        {/* Profile Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
          <div className="relative shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-purple-400 shadow-lg shadow-purple-500/20 bg-gradient-to-br from-purple-200 to-pink-200">
              <img
                src={profile.avatarUrl || '/assets/girl-bunny.png'}
                alt={`${profile.name} - Little Explorer avatar`}
                width={64}
                height={64}
                loading="lazy"
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/girl-bunny.jpeg';
                }}
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-indigo-950 font-heading tracking-wide">
                {profile.name}
              </h3>
              <Star size={18} className="text-amber-400 fill-amber-400" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Age: {profile.age} • {mode === 'child' ? 'Child Mode' : 'Caregiver Mode'}
            </p>
          </div>
        </div>

        {/* Badge chips: "Brave • Kind • Smart" with a star matching screenshot */}
        <div className="my-3.5 flex flex-wrap items-center gap-1.5">
          <div className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1 font-heading">
            <Star size={13} className="text-amber-500 fill-amber-500" />
            <span>Brave</span>
          </div>
          <span className="text-slate-400 text-xs">•</span>
          <div className="px-3 py-1 rounded-full bg-pink-100 border border-pink-300 text-pink-900 text-xs font-black flex items-center gap-1 font-heading">
            <Heart size={13} className="text-pink-500 fill-pink-500" />
            <span>Kind</span>
          </div>
          <span className="text-slate-400 text-xs">•</span>
          <div className="px-3 py-1 rounded-full bg-cyan-100 border border-cyan-300 text-cyan-900 text-xs font-black flex items-center gap-1 font-heading">
            <ShieldCheck size={13} className="text-cyan-600" />
            <span>Smart</span>
          </div>
        </div>

        {/* Navigation Rows with Chevrons matching screenshot */}
        <div className="divide-y divide-slate-100 mt-1">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <motion.button
                key={row.id}
                onClick={() => handleOpenSettings(row.label)}
                whileHover={{ x: 3, backgroundColor: 'rgba(241, 245, 249, 0.6)' }}
                className="w-full py-2.5 px-2 flex items-center justify-between text-left rounded-xl transition-colors cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={17} className={row.color} />
                  <span className="font-heading font-extrabold text-xs sm:text-sm text-slate-800">
                    {row.label}
                  </span>
                </div>
                <ChevronRight size={17} className="text-slate-400" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Footer Profile status */}
      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
        <span>Language: {profile.preferredLanguage}</span>
        <button
          onClick={() => handleOpenSettings('Edit Profile')}
          className="text-indigo-600 font-extrabold hover:underline cursor-pointer"
        >
          Edit
        </button>
      </div>
    </div>
  );
};
