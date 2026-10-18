import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CaregiverAccount, ChildProfile, AuthSession } from '../types';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { useGestivoStore } from './useGestivoStore';

export const DEMO_CHILD_AARVI: ChildProfile = {
  id: 'child-aarvi',
  name: 'Aarvi',
  age: 6,
  avatarUrl: '/assets/girl-bunny.png',
  badges: ['Brave', 'Kind', 'Smart'],
  interests: ['Storybooks', 'Animal Sounds', 'Color Matching', 'Friendly Puzzles'],
  preferredLanguage: 'English',
  communicationStyle: 'Voice + Touch',
};

export const DEMO_CAREGIVER: CaregiverAccount = {
  id: 'demo-caregiver-1',
  email: 'demo@gestivo.app',
  name: 'Caregiver Demo',
  passwordHash: '',
  passwordSalt: '',
  caregiverPin: '1234',
  children: [DEMO_CHILD_AARVI],
  activeChildId: 'child-aarvi',
  createdAt: new Date().toISOString(),
};

interface AuthState {
  accounts: CaregiverAccount[];
  session: AuthSession;
  showDemoWelcomeModal: boolean;
  setShowDemoWelcomeModal: (show: boolean) => void;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    caregiverName: string;
    email: string;
    password: string;
    childName: string;
    childAge: number;
    caregiverPin?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  forgotPasswordReset: (
    email: string,
    pin: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string }>;
  loginDemo: () => void;
  resetDemoData: () => void;
  logout: () => void;
  switchChild: (childId: string) => void;
  addChild: (child: Omit<ChildProfile, 'id'>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accounts: [],
      session: {
        isLoggedIn: false,
        isDemo: false,
        caregiver: null,
        activeChild: null,
      },
      showDemoWelcomeModal: false,
      setShowDemoWelcomeModal: (show) => set({ showDemoWelcomeModal: show }),

      login: async (email, password) => {
        const trimmedEmail = email.trim().toLowerCase();

        // 1. Direct Demo login support (demo@gestivo.app, demo, or caregiver@example.com)
        if (
          trimmedEmail === 'demo@gestivo.app' ||
          trimmedEmail === 'demo' ||
          trimmedEmail === 'caregiver@example.com'
        ) {
          get().loginDemo();
          return { success: true };
        }

        const account = get().accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
        if (!account) {
          // If no accounts exist yet, auto-create this account seamlessly so the user isn't blocked
          if (get().accounts.length === 0 && trimmedEmail && password) {
            return get().signup({
              caregiverName: trimmedEmail.split('@')[0] || 'Caregiver',
              email: trimmedEmail,
              password: password,
              childName: 'Aarvi',
              childAge: 6,
              caregiverPin: '1234',
            });
          }
          return {
            success: false,
            error: 'No account found. Use demo@gestivo.app, click "Try Demo", or use the "Create Account" tab.',
          };
        }

        const isValid = await verifyPassword(password, account.passwordHash, account.passwordSalt);
        if (!isValid) {
          return { success: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
        }

        const activeChild = account.children.find((c) => c.id === account.activeChildId) || account.children[0] || null;

        // Synchronize child profile with GestivoStore
        if (activeChild) {
          useGestivoStore.getState().updateProfile({
            name: activeChild.name,
            age: activeChild.age,
            avatarUrl: activeChild.avatarUrl,
            badges: activeChild.badges,
            interests: activeChild.interests,
            preferredLanguage: activeChild.preferredLanguage,
            communicationStyle: activeChild.communicationStyle,
          });
          useGestivoStore.getState().setCaregiverPin(account.caregiverPin);
        }

        set({
          session: {
            isLoggedIn: true,
            isDemo: false,
            caregiver: account,
            activeChild,
          },
          showDemoWelcomeModal: false,
        });

        return { success: true };
      },


      signup: async (data) => {
        const trimmedEmail = data.email.trim().toLowerCase();
        if (!trimmedEmail) return { success: false, error: 'Email is required.' };
        if (get().accounts.some((a) => a.email.toLowerCase() === trimmedEmail)) {
          return { success: false, error: 'An account with this email already exists.' };
        }

        const { hash, salt } = await hashPassword(data.password);
        const childId = 'child-' + Date.now();
        const child: ChildProfile = {
          id: childId,
          name: data.childName.trim() || 'Little Explorer',
          age: data.childAge || 6,
          avatarUrl: '/assets/girl-bunny.png',
          badges: ['Brave', 'Kind', 'Smart'],
          interests: ['Storybooks', 'Animal Sounds', 'Color Matching'],
          preferredLanguage: 'English',
          communicationStyle: 'Voice + Touch',
        };

        const newAccount: CaregiverAccount = {
          id: 'cg-' + Date.now(),
          email: trimmedEmail,
          name: data.caregiverName.trim() || 'Caregiver',
          passwordHash: hash,
          passwordSalt: salt,
          caregiverPin: data.caregiverPin?.trim() || '1234',
          children: [child],
          activeChildId: childId,
          createdAt: new Date().toISOString(),
        };

        // Update profile in gestivo store
        useGestivoStore.getState().updateProfile({
          name: child.name,
          age: child.age,
          avatarUrl: child.avatarUrl,
          badges: child.badges,
          interests: child.interests,
          preferredLanguage: child.preferredLanguage,
          communicationStyle: child.communicationStyle,
        });
        useGestivoStore.getState().setCaregiverPin(newAccount.caregiverPin);

        set((state) => ({
          accounts: [...state.accounts, newAccount],
          session: {
            isLoggedIn: true,
            isDemo: false,
            caregiver: newAccount,
            activeChild: child,
          },
          showDemoWelcomeModal: false,
        }));

        return { success: true };
      },

      forgotPasswordReset: async (email, pin, newPassword) => {
        const trimmedEmail = email.trim().toLowerCase();
        const account = get().accounts.find((a) => a.email.toLowerCase() === trimmedEmail);
        if (!account) {
          return { success: false, error: 'No account found with this email address.' };
        }

        if (account.caregiverPin !== pin.trim()) {
          return { success: false, error: 'Invalid 4-digit Caregiver PIN for this account.' };
        }

        const { hash, salt } = await hashPassword(newPassword);
        const updated = get().accounts.map((acc) =>
          acc.id === account.id ? { ...acc, passwordHash: hash, passwordSalt: salt } : acc
        );

        set({ accounts: updated });
        return { success: true };
      },

      loginDemo: () => {
        // Reset Gestivo store to default Aarvi data
        useGestivoStore.getState().resetToDemoData();

        set({
          session: {
            isLoggedIn: true,
            isDemo: true,
            caregiver: DEMO_CAREGIVER,
            activeChild: DEMO_CHILD_AARVI,
          },
          showDemoWelcomeModal: true,
        });
      },

      resetDemoData: () => {
        useGestivoStore.getState().resetToDemoData();
      },

      logout: () => {
        set({
          session: {
            isLoggedIn: false,
            isDemo: false,
            caregiver: null,
            activeChild: null,
          },
          showDemoWelcomeModal: false,
        });
      },

      switchChild: (childId: string) => {
        const { session, accounts } = get();
        if (!session.caregiver) return;

        const child = session.caregiver.children.find((c) => c.id === childId);
        if (!child) return;

        const updatedCaregiver = {
          ...session.caregiver,
          activeChildId: childId,
        };

        const updatedAccounts = accounts.map((a) => (a.id === updatedCaregiver.id ? updatedCaregiver : a));

        useGestivoStore.getState().updateProfile({
          name: child.name,
          age: child.age,
          avatarUrl: child.avatarUrl,
          badges: child.badges,
          interests: child.interests,
          preferredLanguage: child.preferredLanguage,
          communicationStyle: child.communicationStyle,
        });

        set({
          accounts: updatedAccounts,
          session: {
            ...session,
            caregiver: updatedCaregiver,
            activeChild: child,
          },
        });
      },

      addChild: (childData) => {
        const { session, accounts } = get();
        if (!session.caregiver) return;

        const newChild: ChildProfile = {
          id: 'child-' + Date.now(),
          name: childData.name,
          age: childData.age,
          avatarUrl: childData.avatarUrl || '/assets/girl-bunny.png',
          badges: childData.badges || ['Brave', 'Kind', 'Smart'],
          interests: childData.interests || ['Storybooks', 'Animal Sounds'],
          preferredLanguage: childData.preferredLanguage || 'English',
          communicationStyle: childData.communicationStyle || 'Voice + Touch',
        };

        const updatedCaregiver = {
          ...session.caregiver,
          children: [...session.caregiver.children, newChild],
        };

        const updatedAccounts = accounts.map((a) => (a.id === updatedCaregiver.id ? updatedCaregiver : a));

        set({
          accounts: updatedAccounts,
          session: {
            ...session,
            caregiver: updatedCaregiver,
          },
        });
      },
    }),
    {
      name: 'gestivo-auth-storage',
    }
  )
);
