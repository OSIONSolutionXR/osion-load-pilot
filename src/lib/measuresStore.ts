import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Risk } from './riskStore';

export type MeasureStatus = 'Offen' | 'In Bearbeitung' | 'Abgeschlossen' | 'Überfällig';
export type MeasurePriority = 'Hoch' | 'Mittel' | 'Niedrig';

export interface Measure {
  id: string;
  title: string;
  description: string;
  status: MeasureStatus;
  priority: MeasurePriority;
  dueDate: string | null;
  assignedTo: string | null;
  riskId: string | null; // Verknüpfung mit einem Risiko
  riskTitle?: string; // Für die Anzeige
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface MeasureState {
  measures: Measure[];
  addMeasure: (measure: Omit<Measure, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>) => string;
  updateMeasure: (id: string, updates: Partial<Measure>) => void;
  deleteMeasure: (id: string) => void;
  completeMeasure: (id: string) => void;
  getMeasuresByRisk: (riskId: string) => Measure[];
  getMeasuresByStatus: (status: MeasureStatus) => Measure[];
  getOverdueMeasures: () => Measure[];
}

const generateId = () => `measure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten
const initialMeasures: Measure[] = [
  {
    id: 'measure-1',
    title: 'Budget-Controlling einrichten',
    description: 'Monatliche Budgetkontrollen und Berichte',
    status: 'In Bearbeitung',
    priority: 'Hoch',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    assignedTo: 'Finanzteam',
    riskId: 'risk-1',
    riskTitle: 'Budgetüberschreitung',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
];

export const useMeasureStore = create<MeasureState>()(
  persist(
    (set, get) => ({
      measures: initialMeasures,

      addMeasure: (measure) => {
        const now = new Date().toISOString();
        const newMeasure: Measure = {
          ...measure,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          completedAt: null,
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
                  status: 'Abgeschlossen',
                  completedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : measure
          ),
        }));
      },

      getMeasuresByRisk: (riskId) => {
        return get().measures.filter((measure) => measure.riskId === riskId);
      },

      getMeasuresByStatus: (status) => {
        return get().measures.filter((measure) => measure.status === status);
      },

      getOverdueMeasures: () => {
        const now = new Date().toISOString();
        return get().measures.filter(
          (measure) =>
            measure.dueDate &&
            measure.dueDate < now &&
            measure.status !== 'Abgeschlossen'
        );
      },
    }),
    {
      name: 'magwarm-measures',
    }
  )
);

/**
 * Erstellt eine Gegenmaßnahme aus einem Risiko
 * @param risk - Das Risiko, aus dem eine Maßnahme erstellt werden soll
 * @returns Die ID der erstellten Maßnahme
 */
export const createMeasureFromRisk = (risk: Risk): string => {
  const store = useMeasureStore.getState();

  // Priorität basierend auf Risikolevel
  const priority: MeasurePriority =
    risk.level === 'Kritisch' ? 'Hoch' : risk.level === 'Relevant' ? 'Mittel' : 'Niedrig';

  // Fälligkeitsdatum: Kritisch = 7 Tage, Relevant = 14 Tage, Beobachten = 30 Tage
  const daysUntilDue =
    risk.level === 'Kritisch' ? 7 : risk.level === 'Relevant' ? 14 : 30;
  const dueDate = new Date(Date.now() + daysUntilDue * 24 * 60 * 60 * 1000).toISOString();

  // Titel für die Maßnahme
  const title = `Gegenmaßnahme: ${risk.title}`;

  // Beschreibung mit Risikodetails
  const description = `Automatisch aus Risiko erstellt:\n\n${risk.description}\n\nKategorie: ${risk.category}\nWahrscheinlichkeit: ${risk.probability}/5\nAuswirkung: ${risk.impact}/5\n\n${risk.mitigations.length > 0 ? 'Vorgeschlagene Mitigationen:\n- ' + risk.mitigations.join('\n- ') : ''}`;

  const newMeasure: Omit<Measure, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'> = {
    title,
    description,
    status: 'Offen',
    priority,
    dueDate,
    assignedTo: null,
    riskId: risk.id,
    riskTitle: risk.title,
  };

  // Speichere die Maßnahme und hole die ID zurück
  const measureId = store.addMeasure(newMeasure);
  
  return measureId;
};

// Hilfsfunktionen für Maßnahmen-Status
export const measureStatusColors: Record<MeasureStatus, { bg: string; text: string }> = {
  Offen: {
    bg: 'bg-blue-500/20 dark:bg-blue-500/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  'In Bearbeitung': {
    bg: 'bg-amber-500/20 dark:bg-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
  },
  Abgeschlossen: {
    bg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  Überfällig: {
    bg: 'bg-red-500/20 dark:bg-red-500/30',
    text: 'text-red-600 dark:text-red-400',
  },
};

export const priorityColors: Record<MeasurePriority, string> = {
  Hoch: 'text-red-600 dark:text-red-400',
  Mittel: 'text-amber-600 dark:text-amber-400',
  Niedrig: 'text-emerald-600 dark:text-emerald-400',
};
