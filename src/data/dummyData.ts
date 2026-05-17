/**
 * OSION Load Pilot - Dummy Data
 * Goldfall: Martin/Bankfinanzierung
 */

import type { Project, Actor, Dependency, Risk, Action } from '../types';

export const dummyProject: Project = {
  id: 'proj-001',
  name: 'Bankfinanzierung KS19',
  description: 'Finanzierung für Sanierung des Kulturdenkmals Kirchstraße 19 in Bützfleth. Bank benötigt Unterlagen, Steuerberater liefert BWA verspätet.',
  goal: 'Kredit zur Sanierung von KS19 sicherstellen',
  status: 'active',
  confidence: 0.94,
  loadScore: 8,
  createdAt: new Date('2026-05-17'),
  updatedAt: new Date('2026-05-17'),
};

export const dummyActors: Actor[] = [
  {
    id: 'actor-001',
    name: 'Martin',
    type: 'internal',
    role: 'Eigentümer / Entscheider',
    responsiveness: 10,
    availability: 'available',
    mood: 'urgent',
    avatar: '👤',
  },
  {
    id: 'actor-002',
    name: 'Commerzbank',
    type: 'external',
    role: 'Kreditinstitut',
    contact: 'beratung@commerzbank.de',
    responsiveness: 4,
    availability: 'available',
    mood: 'neutral',
    avatar: '🏦',
  },
  {
    id: 'actor-003',
    name: 'Steuerberater Müller',
    type: 'external',
    role: 'Steuerberatung',
    contact: 'mueller@steuerkanzlei.de',
    responsiveness: 6,
    availability: 'limited',
    mood: 'relaxed',
    avatar: '📊',
  },
  {
    id: 'actor-004',
    name: 'Herr Schmidt',
    type: 'external',
    role: 'Verkäufer KS19',
    contact: '+49 1234 567890',
    responsiveness: 7,
    availability: 'available',
    mood: 'urgent',
    avatar: '🏠',
  },
  {
    id: 'actor-005',
    name: 'Finanzamt',
    type: 'system',
    role: 'Behörde',
    responsiveness: 2,
    availability: 'blocked',
    mood: 'neutral',
    avatar: '🏛️',
  },
];

export const dummyDependencies: Dependency[] = [
  {
    id: 'dep-001',
    from: 'actor-003',
    to: 'actor-002',
    type: 'document',
    description: 'BWA (Betriebswirtschaftliche Auswertung)',
    blocking: true,
    deadline: new Date('2026-05-19'), // Mittwoch
    flexible: false,
  },
  {
    id: 'dep-002',
    from: 'actor-002',
    to: 'proj-001',
    type: 'approval',
    description: 'Kreditprüfung und Zusage',
    blocking: true,
    flexible: false,
  },
  {
    id: 'dep-003',
    from: 'proj-001',
    to: 'actor-004',
    type: 'decision',
    description: 'Kaufentscheidung Verkäufer',
    blocking: false,
    deadline: new Date('2026-05-22'), // Freitag
    flexible: true,
  },
  {
    id: 'dep-004',
    from: 'actor-001',
    to: 'actor-003',
    type: 'information',
    description: 'Nachfrage BWA-Status',
    blocking: false,
    flexible: true,
  },
];

export const dummyRisks: Risk[] = [
  {
    id: 'risk-001',
    projectId: 'proj-001',
    description: 'Verkäufer zieht Angebot zurück bei Verzögerung',
    probability: 0.6,
    impact: 9,
    timeline: 'Wenn Bank keine Zusage bis Freitag',
    mitigation: [
      'Verkäufer frühzeitig informieren',
      'Zeitplan transparent kommunizieren',
      'Alternativangebot prüfen',
    ],
  },
  {
    id: 'risk-002',
    projectId: 'proj-001',
    description: 'Steuerberater überlastet, BWA weitere Woche verzögert',
    probability: 0.4,
    impact: 7,
    timeline: 'Wenn keine Dringlichkeit kommuniziert',
    mitigation: [
      'Dringlichkeit explizit kommunizieren',
      'Deadline nennen',
      'Alternative Steuerberater prüfen',
    ],
  },
  {
    id: 'risk-003',
    projectId: 'proj-001',
    description: 'Bank bricht Prüfung ab bei unvollständigen Unterlagen',
    probability: 0.2,
    impact: 8,
    timeline: 'Wenn BWA fehlt oder fehlerhaft',
    mitigation: [
      'Vorab mit Bank sprechen',
      'Zwischenstand kommunizieren',
    ],
  },
];

export const dummyActions: Action[] = [
  {
    id: 'action-001',
    projectId: 'proj-001',
    description: 'Steuerberater anschreiben: BWA bis Mittwoch benötigt',
    targetActor: 'actor-003',
    type: 'contact',
    priority: 9.2,
    effort: 'low',
    impact: 'high',
    deadline: new Date('2026-05-17'), // Heute
    dependencies: [],
    template: 'email-bwa-anforderung',
  },
  {
    id: 'action-002',
    projectId: 'proj-001',
    description: 'Bank informieren: BWA kommt bis Mittwoch',
    targetActor: 'actor-002',
    type: 'inform',
    priority: 8.5,
    effort: 'low',
    impact: 'medium',
    deadline: new Date('2026-05-17'),
    dependencies: ['action-001'],
    template: 'email-bank-update',
  },
  {
    id: 'action-003',
    projectId: 'proj-001',
    description: 'Verkäufer beruhigen: Prozess läuft, Feedback Freitag',
    targetActor: 'actor-004',
    type: 'contact',
    priority: 7.8,
    effort: 'low',
    impact: 'high',
    deadline: new Date('2026-05-17'),
    dependencies: ['action-002'],
    template: 'email-verkaeufer-update',
  },
  {
    id: 'action-004',
    projectId: 'proj-001',
    description: 'Alternative Steuerberater-Option prüfen (Notfall)',
    targetActor: 'actor-001',
    type: 'prepare',
    priority: 5.0,
    effort: 'medium',
    impact: 'medium',
    dependencies: ['action-001'],
  },
];

// Berechne Next Move (höchste Priorität)
export const getNextMove = (): Action => {
  return dummyActions.sort((a, b) => b.priority - a.priority)[0];
};

// Formatierungshilfen
export const formatPriority = (priority: number): string => {
  if (priority >= 8) return '🔴 Kritisch';
  if (priority >= 6) return '🟠 Hoch';
  if (priority >= 4) return '🟡 Mittel';
  return '🟢 Niedrig';
};

export const formatEffort = (effort: string): string => {
  const map: Record<string, string> = {
    low: '⚡ Gering (5 Min)',
    medium: '⏱️ Mittel (30 Min)',
    high: '🕐 Hoch (2+ Stunden)',
  };
  return map[effort] || effort;
};

export const formatImpact = (impact: string): string => {
  const map: Record<string, string> = {
    low: '↗️ Gering',
    medium: '⬆️ Mittel',
    high: '🚀 Hoch',
  };
  return map[impact] || impact;
};
