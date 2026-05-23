import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ApprovalStatus = 
  | 'waiting_for_approval' | 'approved' | 'rejected' | 'edited' 
  | 'executed' | 'execution_pending' | 'needs_email_account' | 'needs_contact'

export type ResultType = 
  | 'email_draft' | 'checklist' | 'analysis' | 'summary' 
  | 'next_steps' | 'offer_request' | 'risk_evaluation' | 'decision_basis'

export interface ApprovalItem {
  id: string
  projectId: string
  twinId: string
  measureId: string
  title: string
  resultType: ResultType
  content: string
  riskLevel: 'low' | 'medium' | 'high'
  requiredAction: string
  linkedContactIds: string[]
  senderEmailAccountId?: string
  senderMode?: 'login_email' | 'connected_account' | 'loadpilot_address' | 'project_default'
  status: ApprovalStatus
  createdAt: string
  updatedAt: string
  executedAt?: string
  executedBy?: string
}

export interface ApprovalQueueState {
  items: ApprovalItem[]
  addItem: (item: Omit<ApprovalItem, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateItem: (id: string, updates: Partial<ApprovalItem>) => void
  deleteItem: (id: string) => void
  getItemsByProject: (projectId: string) => ApprovalItem[]
  getItemsByMeasure: (measureId: string) => ApprovalItem[]
  getItemsByStatus: (status: ApprovalStatus) => ApprovalItem[]
}

const generateId = () => `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten
const initialItems: ApprovalItem[] = [
  {
    id: 'approval-1',
    projectId: 'project-1',
    twinId: 'twin-1',
    measureId: 'measure-1',
    title: 'E-Mail-Entwurf: Budgetanfrage',
    resultType: 'email_draft',
    content: 'Sehr geehrte Damen und Herren,\n\nwir benötigen eine Budgeterhöhung für...',
    riskLevel: 'medium',
    requiredAction: 'E-Mail senden an Steuerberater',
    linkedContactIds: ['contact-1'],
    senderMode: 'project_default',
    status: 'waiting_for_approval',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'approval-2',
    projectId: 'project-1',
    twinId: 'twin-1',
    measureId: 'measure-2',
    title: 'Risikoanalyse: Lieferverzug',
    resultType: 'risk_evaluation',
    content: 'Das Risiko eines Lieferverzugs wurde analysiert...',
    riskLevel: 'high',
    requiredAction: 'Risikominderungsmaßnahmen prüfen',
    linkedContactIds: [],
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    executedAt: new Date().toISOString(),
    executedBy: 'system',
  },
];

export const useApprovalQueueStore = create<ApprovalQueueState>()(
  persist(
    (set, get) => ({
      items: initialItems,

      addItem: (item) => {
        const now = new Date().toISOString();
        const newItem: ApprovalItem = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
        return newItem.id;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      getItemsByProject: (projectId) => {
        return get().items.filter((item) => item.projectId === projectId);
      },

      getItemsByMeasure: (measureId) => {
        return get().items.filter((item) => item.measureId === measureId);
      },

      getItemsByStatus: (status) => {
        return get().items.filter((item) => item.status === status);
      },
    }),
    {
      name: 'magwarm-approval-queue',
    }
  )
);

// Hilfsfunktionen
export const approvalStatusLabels: Record<ApprovalStatus, string> = {
  waiting_for_approval: 'Wartet auf Freigabe',
  approved: 'Freigegeben',
  rejected: 'Abgelehnt',
  edited: 'Bearbeitet',
  executed: 'Ausgeführt',
  execution_pending: 'Ausführung läuft',
  needs_email_account: 'E-Mail-Konto erforderlich',
  needs_contact: 'Kontakt erforderlich',
};

export const approvalStatusColors: Record<ApprovalStatus, { bg: string; text: string }> = {
  waiting_for_approval: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
  edited: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  executed: { bg: 'bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  execution_pending: { bg: 'bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  needs_email_account: { bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  needs_contact: { bg: 'bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
};

export const resultTypeLabels: Record<ResultType, string> = {
  email_draft: 'E-Mail-Entwurf',
  checklist: 'Checkliste',
  analysis: 'Analyse',
  summary: 'Zusammenfassung',
  next_steps: 'Nächste Schritte',
  offer_request: 'Angebotsanfrage',
  risk_evaluation: 'Risikobewertung',
  decision_basis: 'Entscheidungsgrundlage',
};

export const resultTypeIcons: Record<ResultType, string> = {
  email_draft: '✉️',
  checklist: '☑️',
  analysis: '📊',
  summary: '📝',
  next_steps: '➡️',
  offer_request: '💰',
  risk_evaluation: '⚠️',
  decision_basis: '🎯',
};

export const senderModeLabels: Record<NonNullable<ApprovalItem['senderMode']>, string> = {
  login_email: 'Login-E-Mail',
  connected_account: 'Verbundenes Konto',
  loadpilot_address: 'LoadPilot-Adresse',
  project_default: 'Projekt-Standard',
};

export const riskLevelLabels: Record<ApprovalItem['riskLevel'], string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
};

export const riskLevelColors: Record<ApprovalItem['riskLevel'], { bg: string; text: string }> = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  high: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
};
