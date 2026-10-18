import { CueMapping } from './types';

// Starter suggestions: clearly labelled as starter ideas for caregivers to personalize.
// Children with Angelman syndrome have diverse individual communication signals.
export const DEFAULT_STARTER_CUES: CueMapping[] = [
  {
    id: 'starter-gaze-side',
    phrase: "Looks like they're looking at something",
    icon: '👀',
    category: 'Attention',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Sustained side gaze'],
      requireGaze: 'left', // will match left or right in signal matcher
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-reach-point',
    phrase: 'I want that',
    icon: '👉',
    category: 'Requests',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Hand reaching / pointing'],
      requireReaching: true,
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-turn-away',
    phrase: "No / I don't want that",
    icon: '✋',
    category: 'Rejection',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Head turned away'],
      requireTurnAway: true,
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-hand-mouth',
    phrase: 'Maybe hungry or thirsty',
    icon: '🥤',
    category: 'Needs',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Hand near mouth'],
      requireHandNearMouth: true,
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-smile-flap',
    phrase: 'Excited / happy',
    icon: '😊',
    category: 'Feelings',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Warm smile', 'Hand movement'],
      minSmile: 0.30,
      requireFlapping: true,
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-wave-hello',
    phrase: 'Hello / Play with me',
    icon: '👋',
    category: 'Social',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Hand waving', 'Smiling'],
      requireWaving: true,
    },
    createdAt: '2026-10-18',
  },
  {
    id: 'starter-lean-in',
    phrase: 'I want to interact',
    icon: '🤝',
    category: 'Social',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Leaning toward camera'],
      requireLeanIn: true,
    },
    createdAt: '2026-10-17',
  },
  {
    id: 'starter-tired-still',
    phrase: 'Maybe tired',
    icon: '😴',
    category: 'State',
    active: true,
    isStarter: true,
    rules: {
      requiredSignals: ['Low movement', 'Looking away'],
      requireStillness: true,
    },
    createdAt: '2026-10-17',
  },
];
