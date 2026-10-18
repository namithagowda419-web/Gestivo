export type AppMode = 'child' | 'caregiver';

export interface ActivityItem {
  id: string;
  text: string;
  type: 'communication' | 'activity' | 'mood' | 'Cue Camera';
  source?: 'touch' | 'camera' | 'sentence-helper';
  timestamp: string; // e.g. "16 Oct 2026 · 10:24 AM"
  icon: string;
  category?: string;
  suggestedPhrase?: string;
  finalPhrase?: string;
  confidenceBucket?: 'high' | 'medium' | 'low';
  signalsSummary?: string;
  decision?: 'confirmed' | 'changed' | 'dismissed';
}

export interface GoalItem {
  id: string;
  title: string;
  current: number;
  target: number;
  unit?: string;
  isDaily?: boolean;
  category: string;
  color: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  time: string;
  repeat: 'daily' | 'weekdays' | 'once';
  category: 'water' | 'food' | 'activity' | 'break';
  active: boolean;
}

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarUrl: string;
  badges: string[];
  interests: string[];
  preferredLanguage: string;
  communicationStyle: string;
}

export interface CaregiverAccount {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  caregiverPin: string; // 4-digit PIN (default "1234")
  children: ChildProfile[];
  activeChildId: string;
  createdAt: string;
}

export interface AuthSession {
  isLoggedIn: boolean;
  isDemo: boolean;
  caregiver: CaregiverAccount | null;
  activeChild: ChildProfile | null;
}

export interface UserProfile {
  name: string;
  age: number;
  mode: AppMode;
  preferredLanguage: string;
  communicationStyle: string;
  avatarUrl: string;
  badges: string[];
  interests: string[];
}

export interface BoardTile {
  id: string;
  label: string;
  phrase: string;
  icon: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  shadowColor: string;
  category: 'basics' | 'feelings' | 'needs' | 'play' | 'people' | 'more';
  isCustom?: boolean;
}

export interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  phrase: string;
  icon: string;
  gradient: string;
  glowColor: string;
  accentBorder: string;
}
