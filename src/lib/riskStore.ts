import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RiskLevel = 'Kritisch' | 'Relevant' | 'Beobachten';
export type Probability = 1 | 2 | 3 | 4 | 5;
export type Impact = 1 | 2 | 3 | 4 | 5;

export interface Risk {
  id: string;
  title: string;
  description: string;
  level: RiskLevel;
  probability: Probability;
  impact: Impact;
  category: string;
  mitigations: string[];
  hasMeasure: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RiskFilters {
  showKritisch: boolean;
  showRelevant: boolean;
  showBeobachten: boolean;
}

interface RiskState {
  risks: Risk[];
  filters: RiskFilters;
  setFilters: (filters: Partial<RiskFilters>) => void;
  addRisk: (risk: Omit<Risk, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  toggleMeasureStatus: (id: string) => void;
  getFilteredRisks: () => Risk[];
  getRisksByMatrixPosition: (probability: Probability, impact: Impact) => Risk[];
  getRisksByLevel: (level: RiskLevel) => Risk[];
}

const generateId = () => `risk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten für die Risiko-Matrix
const initialRisks: Risk[] = [
  {
    id: 'risk-1',
    title: 'Budgetüberschreitung',
    description: 'Das Projekt könnte das genehmigte Budget überschreiten',
    level: 'Kritisch',
    probability: 4,
    impact: 5,
    category: 'Finanzen',
    mitigations: ['Regelmäßige Budgetkontrollen', 'Puffer reservieren'],
    hasMeasure: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'risk-2',
    title: 'Verzögerung durch Lieferant',
    description: 'Lieferant kann Material nicht termingerecht bereitstellen',
    level: 'Relevant',
    probability: 3,
    impact: 4,
    category: 'Logistik',
    mitigations: ['Alternative Lieferanten identifizieren', 'Frühbestellung'],
    hasMeasure: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'risk-3',
    title: 'Ressourcenengpass',
    description: 'Mangel an qualifiziertem Personal',
    level: 'Relevant',
    probability: 2,
    impact: 3,
    category: 'Personal',
    mitigations: ['Externe Ressourcen planen', 'Schulungsprogramm'],
    hasMeasure: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'risk-4',
    title: 'Technische Änderung',
    description: 'Anforderungen ändern sich während des Projekts',
    level: 'Beobachten',
    probability: 2,
    impact: 2,
    category: 'Technik',
    mitigations: ['Change-Management-Prozess', 'Regelmäßige Reviews'],
    hasMeasure: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'risk-5',
    title: 'Regulatorische Änderung',
    description: 'Neue Gesetze oder Vorschriften',
    level: 'Beobachten',
    probability: 1,
    impact: 4,
    category: 'Compliance',
    mitigations: ['Monitoring politischer Entwicklungen'],
    hasMeasure: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'risk-6',
    title: 'Sicherheitsincident',
    description: 'Datenleck oder Sicherheitsverletzung',
    level: 'Kritisch',
    probability: 2,
    impact: 5,
    category: 'Sicherheit',
    mitigations: ['Sicherheitsaudits', 'Penetrationstests'],
    hasMeasure: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useRiskStore = create<RiskState>()(
  persist(
    (set, get) => ({
      risks: initialRisks,
      filters: {
        showKritisch: true,
        showRelevant: true,
        showBeobachten: true,
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      addRisk: (risk) => {
        const now = new Date().toISOString();
        const newRisk: Risk = {
          ...risk,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          risks: [...state.risks, newRisk],
        }));
      },

      updateRisk: (id, updates) => {
        set((state) => ({
          risks: state.risks.map((risk) =>
            risk.id === id ? { ...risk, ...updates, updatedAt: new Date().toISOString() } : risk
          ),
        }));
      },

      deleteRisk: (id) => {
        set((state) => ({
          risks: state.risks.filter((risk) => risk.id !== id),
        }));
      },

      toggleMeasureStatus: (id) => {
        set((state) => ({
          risks: state.risks.map((risk) =>
            risk.id === id
              ? { ...risk, hasMeasure: !risk.hasMeasure, updatedAt: new Date().toISOString() }
              : risk
          ),
        }));
      },

      getFilteredRisks: () => {
        const { risks, filters } = get();
        return risks.filter((risk) => {
          if (risk.level === 'Kritisch' && !filters.showKritisch) return false;
          if (risk.level === 'Relevant' && !filters.showRelevant) return false;
          if (risk.level === 'Beobachten' && !filters.showBeobachten) return false;
          return true;
        });
      },

      getRisksByMatrixPosition: (probability, impact) => {
        return get().risks.filter(
          (risk) => risk.probability === probability && risk.impact === impact
        );
      },

      getRisksByLevel: (level) => {
        return get().risks.filter((risk) => risk.level === level);
      },
    }),
    {
      name: 'magwarm-risks',
      partialize: (state) => ({ risks: state.risks }),
    }
  )
);

// Hilfsfunktionen für die Risikobewertung
export const getRiskScore = (probability: Probability, impact: Impact): number => {
  return probability * impact;
};

export const getRiskLevelFromScore = (score: number): RiskLevel => {
  if (score >= 16) return 'Kritisch';
  if (score >= 9) return 'Relevant';
  return 'Beobachten';
};

export const calculateRiskLevel = (probability: Probability, impact: Impact): RiskLevel => {
  const score = getRiskScore(probability, impact);
  return getRiskLevelFromScore(score);
};

// Farben für Risikolevel
export const riskLevelColors: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Kritisch: {
    bg: 'bg-red-500/20 dark:bg-red-500/30',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/50',
  },
  Relevant: {
    bg: 'bg-amber-500/20 dark:bg-amber-500/30',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/50',
  },
  Beobachten: {
    bg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/50',
  },
};

// Matrix-Farbcodierung
export const getMatrixCellColor = (probability: Probability, impact: Impact): string => {
  const score = getRiskScore(probability, impact);
  if (score >= 16) return 'bg-red-500/30 dark:bg-red-500/40';
  if (score >= 9) return 'bg-amber-500/30 dark:bg-amber-500/40';
  return 'bg-emerald-500/30 dark:bg-emerald-500/40';
};
