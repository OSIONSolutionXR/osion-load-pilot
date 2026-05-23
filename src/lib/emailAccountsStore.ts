import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmailProvider = 'google' | 'microsoft' | 'smtp' | 'imap_smtp' | 'loadpilot' | 'custom'
export type ConnectionStatus = 'not_connected' | 'connected' | 'needs_reauth' | 'error'

export interface EmailAccount {
  id: string
  ownerType: 'user' | 'project' | 'system'
  projectId?: string
  twinId?: string
  label: string
  email: string
  displayName?: string
  provider: EmailProvider
  connectionStatus: ConnectionStatus
  isDefault: boolean
  canSend: boolean
  canReceive: boolean
  preferredForProjects: string[]
  createdAt: string
  updatedAt: string
  lastVerifiedAt?: string
}

export interface EmailAccountsState {
  accounts: EmailAccount[]
  addAccount: (account: Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateAccount: (id: string, updates: Partial<EmailAccount>) => void
  deleteAccount: (id: string) => void
  getDefaultForProject: (projectId: string) => EmailAccount | undefined
  setDefaultForProject: (projectId: string, accountId: string) => void
}

const generateId = () => `email-acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten
const initialAccounts: EmailAccount[] = [
  {
    id: 'email-acc-1',
    ownerType: 'system',
    label: 'LoadPilot System',
    email: 'noreply@loadpilot.app',
    displayName: 'LoadPilot',
    provider: 'loadpilot',
    connectionStatus: 'connected',
    isDefault: true,
    canSend: true,
    canReceive: false,
    preferredForProjects: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastVerifiedAt: new Date().toISOString(),
  },
  {
    id: 'email-acc-2',
    ownerType: 'user',
    label: 'Mein Gmail',
    email: 'user@gmail.com',
    displayName: 'Max User',
    provider: 'google',
    connectionStatus: 'not_connected',
    isDefault: false,
    canSend: true,
    canReceive: true,
    preferredForProjects: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useEmailAccountsStore = create<EmailAccountsState>()(
  persist(
    (set, get) => ({
      accounts: initialAccounts,

      addAccount: (account) => {
        const now = new Date().toISOString();
        const newAccount: EmailAccount = {
          ...account,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          accounts: [...state.accounts, newAccount],
        }));
        return newAccount.id;
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((account) =>
            account.id === id
              ? { ...account, ...updates, updatedAt: new Date().toISOString() }
              : account
          ),
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((account) => account.id !== id),
        }));
      },

      getDefaultForProject: (projectId) => {
        // Zuerst nach projektspezifischem Default suchen
        const projectSpecific = get().accounts.find(
          (account) => account.preferredForProjects.includes(projectId) && account.isDefault
        );
        if (projectSpecific) return projectSpecific;
        
        // Dann nach globalem Default suchen
        return get().accounts.find((account) => account.isDefault);
      },

      setDefaultForProject: (projectId, accountId) => {
        set((state) => ({
          accounts: state.accounts.map((account) => {
            if (account.id === accountId) {
              return {
                ...account,
                preferredForProjects: [...new Set([...account.preferredForProjects, projectId])],
                isDefault: true,
                updatedAt: new Date().toISOString(),
              };
            }
            // Entferne Projekt aus anderen Accounts
            if (account.preferredForProjects.includes(projectId)) {
              return {
                ...account,
                preferredForProjects: account.preferredForProjects.filter((p) => p !== projectId),
                isDefault: account.preferredForProjects.length > 1 ? account.isDefault : false,
                updatedAt: new Date().toISOString(),
              };
            }
            return account;
          }),
        }));
      },
    }),
    {
      name: 'magwarm-email-accounts',
    }
  )
);

// Hilfsfunktionen
export const emailProviderLabels: Record<EmailProvider, string> = {
  google: 'Google (Gmail)',
  microsoft: 'Microsoft (Outlook)',
  smtp: 'SMTP',
  imap_smtp: 'IMAP/SMTP',
  loadpilot: 'LoadPilot',
  custom: 'Benutzerdefiniert',
};

export const connectionStatusLabels: Record<ConnectionStatus, string> = {
  not_connected: 'Nicht verbunden',
  connected: 'Verbunden',
  needs_reauth: 'Neue Autorisierung nötig',
  error: 'Fehler',
};

export const connectionStatusColors: Record<ConnectionStatus, { bg: string; text: string }> = {
  not_connected: { bg: 'bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
  connected: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  needs_reauth: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  error: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
};

export const ownerTypeLabels: Record<EmailAccount['ownerType'], string> = {
  user: 'Benutzer',
  project: 'Projekt',
  system: 'System',
};
