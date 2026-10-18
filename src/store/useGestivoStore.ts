import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActivityItem, AppMode, GoalItem, ReminderItem, UserProfile, BoardTile } from '../types';
import { playChime, speakText, setSelectedVoice } from '../utils/speech';

export interface SentenceItem {
  id: string;
  label: string;
  icon: string;
  phrase: string;
}

interface GestivoState {
  profile: UserProfile;
  mode: AppMode;
  caregiverPin: string;
  isCaregiverUnlocked: boolean;
  selectedVoiceName: string | null;
  voiceOutput: boolean;
  speechPitch: number;
  speechRate: number;
  soundEffects: boolean;
  sentenceStrip: SentenceItem[];
  activities: ActivityItem[];
  goals: GoalItem[];
  reminders: ReminderItem[];
  customTiles: BoardTile[];
  activeModal: string | null;
  historyFilter: 'all' | 'communication' | 'activity' | 'mood' | 'Cue Camera';
  historyPage: number;

  // Actions
  setMode: (mode: AppMode) => void;
  unlockCaregiver: (pin: string) => boolean;
  lockCaregiver: () => void;
  setCaregiverPin: (pin: string) => void;
  setSelectedVoiceName: (name: string | null) => void;
  setSpeechPitch: (pitch: number) => void;
  setSpeechRate: (rate: number) => void;
  toggleVoiceOutput: () => void;
  setVoiceOutput: (enabled: boolean) => void;
  addToSentenceStrip: (item: { label: string; icon: string; phrase: string }) => void;
  backspaceSentenceStrip: () => void;
  clearSentenceStrip: () => void;
  speakSentence: () => void;
  addActivity: (
    text: string,
    type?: 'communication' | 'activity' | 'mood' | 'Cue Camera',
    icon?: string,
    meta?: {
      suggestedPhrase?: string;
      finalPhrase?: string;
      confidenceBucket?: 'high' | 'medium' | 'low';
      signalsSummary?: string;
      decision?: 'confirmed' | 'changed' | 'dismissed';
      source?: 'touch' | 'camera' | 'sentence-helper';
    }
  ) => void;
  incrementGoal: (goalId: string) => void;
  addGoal: (goal: Omit<GoalItem, 'id'>) => void;
  editGoal: (id: string, goal: Partial<GoalItem>) => void;
  deleteGoal: (id: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addReminder: (reminder: Omit<ReminderItem, 'id' | 'active'>) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;
  addCustomTile: (tile: Omit<BoardTile, 'id' | 'isCustom'>) => void;
  editCustomTile: (id: string, tile: Partial<BoardTile>) => void;
  deleteCustomTile: (id: string) => void;
  exportHistory: () => { json: string; csv: string };
  setActiveModal: (modal: string | null) => void;
  setHistoryFilter: (filter: 'all' | 'communication' | 'activity' | 'mood' | 'Cue Camera') => void;
  setHistoryPage: (page: number) => void;
  resetToDemoData: () => void;
}

const initialProfile: UserProfile = {
  name: 'Aarvi',
  age: 6,
  mode: 'child',
  preferredLanguage: 'English',
  communicationStyle: 'Voice + Touch',
  avatarUrl: '/assets/girl-bunny.png',
  badges: ['Brave', 'Kind', 'Smart'],
  interests: ['Storybooks', 'Animal Sounds', 'Color Matching', 'Friendly Puzzles'],
};

const initialActivities: ActivityItem[] = [
  {
    id: 'act-1',
    text: 'I want water',
    type: 'communication',
    timestamp: '16 Oct 2026 · 10:24 AM',
    icon: '🥤',
    category: 'Needs',
  },
  {
    id: 'act-2',
    text: 'Played memory game',
    type: 'activity',
    timestamp: '16 Oct 2026 · 09:52 AM',
    icon: '🧠',
    category: 'Games',
  },
  {
    id: 'act-3',
    text: 'I am happy',
    type: 'mood',
    timestamp: '16 Oct 2026 · 08:32 AM',
    icon: '😊',
    category: 'Feelings',
  },
  {
    id: 'act-4',
    text: 'Need help',
    type: 'communication',
    timestamp: '15 Oct 2026 · 06:12 PM',
    icon: '🙋',
    category: 'Basics',
  },
  {
    id: 'act-5',
    text: 'I want to play',
    type: 'communication',
    timestamp: '15 Oct 2026 · 04:20 PM',
    icon: '⚽',
    category: 'Play',
  },
  {
    id: 'act-6',
    text: 'Story time: Bunny Adventure',
    type: 'activity',
    timestamp: '15 Oct 2026 · 02:15 PM',
    icon: '📖',
    category: 'Stories',
  },
  {
    id: 'act-7',
    text: 'Expressed: Thank you',
    type: 'communication',
    timestamp: '15 Oct 2026 · 11:40 AM',
    icon: '💖',
    category: 'Basics',
  },
  {
    id: 'act-8',
    text: 'Animal sound: Happy Cat',
    type: 'activity',
    timestamp: '14 Oct 2026 · 05:10 PM',
    icon: '🐱',
    category: 'Games',
  },
];

const initialGoals: GoalItem[] = [
  {
    id: 'goal-1',
    title: 'Learn new words',
    current: 2,
    target: 5,
    unit: 'words',
    category: 'Vocabulary',
    color: '#FF8C42',
  },
  {
    id: 'goal-2',
    title: 'Play memory game',
    current: 1,
    target: 1,
    unit: 'Daily',
    isDaily: true,
    category: 'Cognitive',
    color: '#B084FF',
  },
  {
    id: 'goal-3',
    title: 'Express basic needs',
    current: 3,
    target: 5,
    unit: 'phrases',
    category: 'Communication',
    color: '#3D8BFF',
  },
  {
    id: 'goal-4',
    title: 'Follow daily routine',
    current: 4,
    target: 7,
    unit: 'days',
    category: 'Independence',
    color: '#2ECC71',
  },
];

const initialReminders: ReminderItem[] = [
  {
    id: 'rem-1',
    title: 'Morning Communication Check',
    time: '09:00 AM',
    repeat: 'daily',
    category: 'activity',
    active: true,
  },
  {
    id: 'rem-2',
    title: 'Hydration & Water Break',
    time: '11:00 AM',
    repeat: 'daily',
    category: 'water',
    active: true,
  },
  {
    id: 'rem-3',
    title: 'Play & Memory Fun',
    time: '03:30 PM',
    repeat: 'weekdays',
    category: 'activity',
    active: true,
  },
];

function formatCurrentTimestamp(): string {
  const d = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year} · ${hours.toString().padStart(2, '0')}:${mins} ${ampm}`;
}

export const useGestivoStore = create<GestivoState>()(
  persist(
    (set, get) => ({
      profile: initialProfile,
      mode: 'child',
      caregiverPin: '1234',
      isCaregiverUnlocked: false,
      selectedVoiceName: null,
      voiceOutput: true,
      speechPitch: 1.25,
      speechRate: 0.95,
      soundEffects: true,
      sentenceStrip: [],
      activities: initialActivities,
      goals: initialGoals,
      reminders: initialReminders,
      customTiles: [],
      activeModal: null,
      historyFilter: 'all',
      historyPage: 1,

      unlockCaregiver: (pin: string) => {
        if (pin === get().caregiverPin) {
          set({ isCaregiverUnlocked: true });
          return true;
        }
        return false;
      },

      lockCaregiver: () => set({ isCaregiverUnlocked: false }),

      setCaregiverPin: (pin: string) => {
        set({ caregiverPin: pin });
        playChime('success');
        speakText('Caregiver PIN updated successfully', get().voiceOutput);
      },

      setSelectedVoiceName: (name: string | null) => {
        set({ selectedVoiceName: name });
        setSelectedVoice(name);
      },

      setSpeechPitch: (pitch: number) => set({ speechPitch: pitch }),
      setSpeechRate: (rate: number) => set({ speechRate: rate }),

      setMode: (mode) => {
        playChime('magic');
        set({ mode });
        const text = mode === 'child' ? "Switched to Child Mode! Let's play!" : "Switched to Caregiver Dashboard!";
        speakText(text, get().voiceOutput);
      },

      toggleVoiceOutput: () => {
        playChime('pop');
        const next = !get().voiceOutput;
        set({ voiceOutput: next });
        if (next) {
          speakText('Voice output enabled', true);
        }
      },

      setVoiceOutput: (enabled) => set({ voiceOutput: enabled }),

      addToSentenceStrip: (item) => {
        playChime('pop');
        const newItem: SentenceItem = {
          id: `sent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          label: item.label,
          icon: item.icon,
          phrase: item.phrase,
        };

        const updatedStrip = [...get().sentenceStrip, newItem];
        set({ sentenceStrip: updatedStrip });

        // Speak the individual tile phrase immediately
        speakText(item.phrase, get().voiceOutput, get().speechPitch, get().speechRate, get().selectedVoiceName || undefined);

        // Also log to activities
        get().addActivity(item.phrase, 'communication', item.icon);
      },

      backspaceSentenceStrip: () => {
        playChime('bubble');
        const current = get().sentenceStrip;
        if (current.length > 0) {
          set({ sentenceStrip: current.slice(0, current.length - 1) });
        }
      },

      clearSentenceStrip: () => {
        playChime('bubble');
        set({ sentenceStrip: [] });
      },

      speakSentence: () => {
        const strip = get().sentenceStrip;
        if (strip.length === 0) {
          speakText('Sentence strip is empty. Tap a tile to start!', get().voiceOutput);
          return;
        }
        playChime('star');
        const fullSentence = strip.map((s) => s.phrase).join(' ');
        speakText(fullSentence, true, get().speechPitch, get().speechRate, get().selectedVoiceName || undefined);

        get().addActivity(fullSentence, 'communication', '🗣️');
      },

      addActivity: (text, type = 'communication', icon = '💬', meta) => {
        const newAct: ActivityItem = {
          id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          text,
          type,
          timestamp: formatCurrentTimestamp(),
          icon,
          ...meta,
        };
        set({ activities: [newAct, ...get().activities] });
      },

      incrementGoal: (goalId) => {
        const goals = get().goals.map((g) => {
          if (g.id === goalId) {
            const nextVal = Math.min(g.target, g.current + 1);
            if (nextVal === g.target && g.current < g.target) {
              // Goal completed!
              playChime('success');
              speakText(`Awesome job! You reached your goal: ${g.title}!`, get().voiceOutput);
              // Trigger confetti dynamically
              if (typeof window !== 'undefined') {
                import('canvas-confetti').then((confettiModule) => {
                  confettiModule.default({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FF8C42', '#3D8BFF', '#2ECC71', '#B084FF', '#FF7AA2'],
                  });
                });
              }
              get().addActivity(`Goal reached: ${g.title}! ⭐`, 'activity', '🏆');
            } else {
              playChime('pop');
            }
            return { ...g, current: nextVal };
          }
          return g;
        });
        set({ goals });
      },

      addGoal: (goalData) => {
        playChime('star');
        const newGoal: GoalItem = {
          ...goalData,
          id: `goal-${Date.now()}`,
        };
        set({ goals: [...get().goals, newGoal] });
        get().addActivity(`Created new goal: ${goalData.title}`, 'activity', '🎯');
      },

      editGoal: (id, goalData) => {
        playChime('pop');
        set({
          goals: get().goals.map((g) => (g.id === id ? { ...g, ...goalData } : g)),
        });
      },

      deleteGoal: (id) => {
        playChime('bubble');
        set({ goals: get().goals.filter((g) => g.id !== id) });
      },

      updateProfile: (profileData) => {
        playChime('star');
        set({ profile: { ...get().profile, ...profileData } });
        speakText('Profile updated successfully!', get().voiceOutput);
      },

      addReminder: (remData) => {
        playChime('star');
        const newRem: ReminderItem = {
          ...remData,
          id: `rem-${Date.now()}`,
          active: true,
        };
        set({ reminders: [...get().reminders, newRem] });
        get().addActivity(`Reminder set: ${remData.title} at ${remData.time}`, 'activity', '⏰');
      },

      toggleReminder: (id) => {
        playChime('pop');
        set({
          reminders: get().reminders.map((r) => (r.id === id ? { ...r, active: !r.active } : r)),
        });
      },

      deleteReminder: (id) => {
        playChime('bubble');
        set({ reminders: get().reminders.filter((r) => r.id !== id) });
      },

      addCustomTile: (tileData) => {
        playChime('star');
        const newTile: BoardTile = {
          ...tileData,
          id: `custom-tile-${Date.now()}`,
          isCustom: true,
        };
        set({ customTiles: [...get().customTiles, newTile] });
        get().addActivity(`New tile added: ${tileData.label}`, 'activity', tileData.icon);
      },

      editCustomTile: (id, partialTile) => {
        playChime('pop');
        set({
          customTiles: get().customTiles.map((t) => (t.id === id ? { ...t, ...partialTile } : t)),
        });
      },

      deleteCustomTile: (id) => {
        playChime('bubble');
        set({ customTiles: get().customTiles.filter((t) => t.id !== id) });
      },

      exportHistory: () => {
        const activities = get().activities;
        const json = JSON.stringify(activities, null, 2);
        const headers = ['ID', 'Timestamp', 'Type', 'Source', 'Text', 'Icon', 'Category', 'Decision', 'Suggested Phrase', 'Signals'];
        const rows = activities.map((a) => [
          `"${a.id}"`,
          `"${a.timestamp}"`,
          `"${a.type}"`,
          `"${a.source || 'touch'}"`,
          `"${(a.text || '').replace(/"/g, '""')}"`,
          `"${a.icon || ''}"`,
          `"${a.category || ''}"`,
          `"${a.decision || ''}"`,
          `"${(a.suggestedPhrase || '').replace(/"/g, '""')}"`,
          `"${(a.signalsSummary || '').replace(/"/g, '""')}"`,
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return { json, csv };
      },

      setActiveModal: (modal) => {
        if (modal) playChime('pop');
        set({ activeModal: modal });
      },

      setHistoryFilter: (filter) => {
        playChime('pop');
        set({ historyFilter: filter, historyPage: 1 });
      },

      setHistoryPage: (page) => {
        playChime('pop');
        set({ historyPage: page });
      },

      resetToDemoData: () => {
        playChime('magic');
        set({
          profile: initialProfile,
          mode: 'child',
          caregiverPin: '1234',
          isCaregiverUnlocked: false,
          sentenceStrip: [],
          activities: initialActivities,
          goals: initialGoals,
          reminders: initialReminders,
          customTiles: [],
          historyFilter: 'all',
          historyPage: 1,
        });
      },
    }),
    {
      name: 'gestivo-app-storage-v2',
      partialize: (state) => ({
        profile: state.profile,
        mode: state.mode,
        caregiverPin: state.caregiverPin,
        selectedVoiceName: state.selectedVoiceName,
        voiceOutput: state.voiceOutput,
        speechPitch: state.speechPitch,
        speechRate: state.speechRate,
        activities: state.activities,
        goals: state.goals,
        reminders: state.reminders,
        customTiles: state.customTiles,
      }),
    }
  )
);
