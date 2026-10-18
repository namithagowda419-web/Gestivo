import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BaselineCalibration, CueCameraSettings, CueDecisionLog, CueMapping, TrainedSample } from '../lib/cues/types';
import { DEFAULT_STARTER_CUES } from '../lib/cues/starterCues';

interface CueStoreState {
  settings: CueCameraSettings;
  mappings: CueMapping[];
  trainedSamples: TrainedSample[];
  baseline: BaselineCalibration | null;
  decisionLogs: CueDecisionLog[];

  // Actions
  updateSettings: (settings: Partial<CueCameraSettings>) => void;
  giveConsent: () => void;
  addCustomCue: (cueData: Omit<CueMapping, 'id' | 'createdAt'>, samples: number[][]) => void;
  addRuleCue: (cueData: Omit<CueMapping, 'id' | 'createdAt'>) => void;
  editCue: (id: string, updates: Partial<CueMapping>, newSamples?: number[][]) => void;
  resetSingleCue: (id: string) => void;
  deleteCue: (id: string) => void;
  toggleCueActive: (id: string) => void;
  setBaseline: (baseline: BaselineCalibration) => void;
  logDecision: (log: Omit<CueDecisionLog, 'id' | 'timestamp' | 'rawTimestamp'>) => void;
  deleteAllCueData: () => void;
  resetToStarterCues: () => void;
}

const defaultSettings: CueCameraSettings = {
  featureEnabled: true,
  consentGiven: false,
  activeDeviceId: '',
  isMirrored: true,
  showOverlay: false,
  sensitivity: 1.0,
  holdTimeMs: 1000,
  cooldownMs: 3000,
  voiceConfirmEnabled: true,
  pauseSuggestions: false,
};

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

export const useCueStore = create<CueStoreState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      mappings: DEFAULT_STARTER_CUES,
      trainedSamples: [],
      baseline: null,
      decisionLogs: [],

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      giveConsent: () =>
        set((state) => ({
          settings: { ...state.settings, consentGiven: true },
        })),

      addCustomCue: (cueData, sampleVectors) => {
        const id = `cue-custom-${Date.now()}`;
        const newCue: CueMapping = {
          ...cueData,
          id,
          isStarter: false,
          isPersonalized: true,
          trainedSamplesCount: sampleVectors.length,
          createdAt: new Date().toISOString().split('T')[0],
        };

        const newSamples: TrainedSample[] = sampleVectors.map((vec, i) => ({
          id: `sample-${id}-${i}`,
          cueId: id,
          vector: vec,
          timestamp: Date.now(),
        }));

        set((state) => ({
          mappings: [newCue, ...state.mappings],
          trainedSamples: [...state.trainedSamples, ...newSamples],
        }));
      },

      addRuleCue: (cueData) => {
        const id = `cue-rule-${Date.now()}`;
        const newCue: CueMapping = {
          ...cueData,
          id,
          isStarter: false,
          isPersonalized: true,
          createdAt: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          mappings: [newCue, ...state.mappings],
        }));
      },

      editCue: (id, updates, newSamples) =>
        set((state) => {
          const sampleObjects: TrainedSample[] = (newSamples || []).map((vec, i) => ({
            id: `sample-${id}-${Date.now()}-${i}`,
            cueId: id,
            vector: vec,
            timestamp: Date.now(),
          }));

          const updatedMappings = state.mappings.map((m) => {
            if (m.id !== id) return m;
            const updatedSamplesCount =
              newSamples && newSamples.length > 0
                ? (m.trainedSamplesCount || 0) + newSamples.length
                : m.trainedSamplesCount;
            return {
              ...m,
              ...updates,
              isPersonalized: true,
              ...(newSamples && newSamples.length > 0
                ? { trainedSamplesCount: updatedSamplesCount }
                : {}),
            };
          });

          return {
            mappings: updatedMappings,
            trainedSamples:
              sampleObjects.length > 0
                ? [...state.trainedSamples, ...sampleObjects]
                : state.trainedSamples,
          };
        }),

      resetSingleCue: (id) => {
        const starter = DEFAULT_STARTER_CUES.find((s) => s.id === id);
        if (!starter) return;
        set((state) => ({
          mappings: state.mappings.map((m) => (m.id === id ? { ...starter } : m)),
        }));
      },

      deleteCue: (id) =>
        set((state) => ({
          mappings: state.mappings.filter((m) => m.id !== id),
          trainedSamples: state.trainedSamples.filter((s) => s.cueId !== id),
        })),

      toggleCueActive: (id) =>
        set((state) => ({
          mappings: state.mappings.map((m) => (m.id === id ? { ...m, active: !m.active } : m)),
        })),

      setBaseline: (baseline) => set({ baseline }),

      logDecision: (logData) => {
        const newLog: CueDecisionLog = {
          ...logData,
          id: `decision-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: formatCurrentTimestamp(),
          rawTimestamp: Date.now(),
        };

        set((state) => ({
          decisionLogs: [newLog, ...state.decisionLogs].slice(0, 100), // keep latest 100
        }));
      },

      deleteAllCueData: () => {
        set({
          mappings: DEFAULT_STARTER_CUES,
          trainedSamples: [],
          baseline: null,
          decisionLogs: [],
          settings: { ...defaultSettings, consentGiven: false },
        });
      },

      resetToStarterCues: () => {
        set({ mappings: DEFAULT_STARTER_CUES });
      },
    }),
    {
      name: 'gestivo-cue-camera-v1',
    }
  )
);
