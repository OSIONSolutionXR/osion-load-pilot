import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AIMode = 'manual' | 'suggestion_only' | 'approval_required' | 'autonomous' | 'locked'

export interface ExecutionLogEntry {
  timestamp: string
  action: string
  aiMode: AIMode
  contactId?: string
  emailAccountId?: string
  resultId?: string
  status: string
  userDecision?: string
  error?: string
}

export interface MeasureV2 {
  id: string
  projectId: string
  twinId: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'blocked' | 'done' | 'discarded'
  priority: 'low' | 'medium' | 'high' | 'critical'
  aiMode: AIMode
  linkedContactIds: string[]
  allowedActions: string[]
  blockedActions: string[]
  requiredInputs: string[]
  outputs: any[]
  approvalStatus?: string
  executionLog: ExecutionLogEntry[]
  preferredEmailAccountId?: string
  senderMode?: 'login_email' | 'connected_account' | 'loadpilot_address' | 'project_default'
  dueDate?: string
  assignedTo?: string
  processStepId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface MeasuresV2State {
  measures: MeasureV2[]
  addMeasure: (measure: Omit<MeasureV2, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMeasure: (id: string, updates: Partial<MeasureV2>) => void
  deleteMeasure: (id: string) => void
  completeMeasure: (id: string) => void
  addExecutionLogEntry: (measureId: string, entry: Omit<ExecutionLogEntry, 'timestamp'>) => void
  getMeasuresByProject: (projectId: string) => MeasureV2[]
  getMeasuresByTwin: (twinId: string) => MeasureV2[]
  getMeasuresByStatus: (status: MeasureV2['status']) => MeasureV2[]
  getMeasuresByAIMode: (aiMode: AIMode) => MeasureV2[]
  getMeasureById: (id: string) => MeasureV2 | undefined
  getOverdueMeasures: () => MeasureV2[]
  linkContact: (measureId: string, contactId: string) => void
  unlinkContact: (measureId: string, contactId: string) => void
  setAIMode: (measureId: string, aiMode: AIMode) => void
}

const generateId = () => `measure-v2-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten
const initialMeasures: MeasureV2[] = [
  {
    id: 'measure-v2-1',
    projectId: 'project-1',
    twinId: 'twin-1',
    title: 'Budget-Controlling einrichten',
    description: 'Monatliche Budgetkontrollen und Berichte einrichten',
    status: 'in_progress',
    priority: 'high',
    aiMode: 'approval_required',
    linkedContactIds: ['contact-1'],
    allowedActions: ['create_report', 'send_email', 'schedule_meeting'],
    blockedActions: ['delete_budget', 'approve_spending'],
    requiredInputs: ['budget_data', 'timeline'],
    outputs: [],
    approvalStatus: 'pending',
    executionLog: [
      {
        timestamp: new Date().toISOString(),
        action: 'measure_created',
        aiMode: 'approval_required',
        status: 'success',
      },
    ],
    preferredEmailAccountId: 'email-acc-1',
    senderMode: 'project_default',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Finanzteam',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'measure-v2-2',
    projectId: 'project-1',
    twinId: 'twin-1',
    title: 'Lieferantenqualifizierung',
    description: 'Neue Lieferanten qualifizieren und bewerten',
    status: 'open',
    priority: 'medium',
    aiMode: 'suggestion_only',
    linkedContactIds: [],
    allowedActions: ['evaluate_supplier', 'request_documents'],
    blockedActions: ['approve_supplier'],
    requiredInputs: ['supplier_data'],
    outputs: [],
    executionLog: [
      {
        timestamp: new Date().toISOString(),
        action: 'measure_created',
        aiMode: 'suggestion_only',
        status: 'success',
      },
    ],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useMeasuresStoreV2 = create<MeasuresV2State>()(
  persist(
    (set, get) => ({
      measures: initialMeasures,

      addMeasure: (measure) => {
        const now = new Date().toISOString();
        const newMeasure: MeasureV2 = {
          ...measure,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          measures: [...state.measures, newMeasure],
        }));
        return newMeasure.id;
      },

      updateMeasure: (id, updates) => {
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === id
              ? { ...measure, ...updates, updatedAt: new Date().toISOString() }
              : measure
          ),
        }));
      },

      deleteMeasure: (id) => {
        set((state) => ({
          measures: state.measures.filter((measure) => measure.id !== id),
        }));
      },

      completeMeasure: (id) => {
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === id
              ? {
                  ...measure,
                  status: 'done',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },

      addExecutionLogEntry: (measureId, entry) => {
        const logEntry: ExecutionLogEntry = {
          ...entry,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === measureId
              ? {
                  ...measure,
                  executionLog: [...measure.executionLog, logEntry],
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },

      getMeasuresByProject: (projectId) => {
        return get().measures.filter((measure) => measure.projectId === projectId);
      },

      getMeasuresByTwin: (twinId) => {
        return get().measures.filter((measure) => measure.twinId === twinId);
      },

      getMeasuresByStatus: (status) => {
        return get().measures.filter((measure) => measure.status === status);
      },

      getMeasuresByAIMode: (aiMode) => {
        return get().measures.filter((measure) => measure.aiMode === aiMode);
      },

      getMeasureById: (id) => {
        return get().measures.find((measure) => measure.id === id);
      },

      getOverdueMeasures: () => {
        const now = new Date().toISOString();
        return get().measures.filter(
          (measure) =>
            measure.dueDate &&
            measure.dueDate < now &&
            measure.status !== 'done' &&
            measure.status !== 'discarded'
        );
      },

      linkContact: (measureId, contactId) => {
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === measureId && !measure.linkedContactIds.includes(contactId)
              ? {
                  ...measure,
                  linkedContactIds: [...measure.linkedContactIds, contactId],
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },

      unlinkContact: (measureId, contactId) => {
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === measureId
              ? {
                  ...measure,
                  linkedContactIds: measure.linkedContactIds.filter((id) => id !== contactId),
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },

      setAIMode: (measureId, aiMode) => {
        set((state) => ({
          measures: state.measures.map((measure) =>
            measure.id === measureId
              ? {
                  ...measure,
                  aiMode,
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },
    }),
    {
      name: 'magwarm-measures-v2',
    }
  )
);

// Hilfsfunktionen
export const aiModeLabels: Record<AIMode, string> = {
  manual: 'Manuell',
  suggestion_only: 'Nur Vorschläge',
  approval_required: 'Freigabe erforderlich',
  autonomous: 'Autonom',
  locked: 'Gesperrt',
};

export const aiModeDescriptions: Record<AIMode, string> = {
  manual: 'Keine automatische Unterstützung',
  suggestion_only: 'KI macht Vorschläge, aber keine automatischen Aktionen',
  approval_required: 'KI schlägt vor, aber jede Aktion erfordert Freigabe',
  autonomous: 'KI kann Maßnahmen eigenständig durchführen',
  locked: 'Maßnahme kann nicht verändert werden',
};

export const aiModeColors: Record<AIMode, { bg: string; text: string; border: string }> = {
  manual: { bg: 'bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/50' },
  suggestion_only: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/50' },
  approval_required: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/50' },
  autonomous: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/50' },
  locked: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/50' },
};

export const statusLabels: Record<MeasureV2['status'], string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  blocked: 'Blockiert',
  done: 'Abgeschlossen',
  discarded: 'Verworfen',
};

export const statusColors: Record<MeasureV2['status'], { bg: string; text: string }> = {
  open: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  in_progress: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  blocked: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
  done: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  discarded: { bg: 'bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
};

export const priorityLabels: Record<MeasureV2['priority'], string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

export const priorityColors: Record<MeasureV2['priority'], { bg: string; text: string }> = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  medium: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  high: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  critical: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
};

export const senderModeLabels: Record<NonNullable<MeasureV2['senderMode']>, string> = {
  login_email: 'Login-E-Mail',
  connected_account: 'Verbundenes Konto',
  loadpilot_address: 'LoadPilot-Adresse',
  project_default: 'Projekt-Standard',
};
