export interface Node {
  id: string
  step: number
  title: string
  subtitle: string
  status: 'complete' | 'active' | 'blocked' | 'pending'
  state?: string
  icon: string
}

export interface DemoProject {
  id: string
  name: string
  goal: string
  nodes: Node[]
  blockedBetween?: [number, number]
  riskText: string
}

export const demoProject: DemoProject = {
  id: 'finanzierung-2024',
  name: 'Finanzierungsrunde',
  goal: 'Schnelle, stressfreie Bankzusage',
  nodes: [
    {
      id: 'steuerberater',
      step: 1,
      title: 'Steuerberater Müller',
      subtitle: 'Auslöser',
      status: 'complete',
      icon: 'user'
    },
    {
      id: 'bwa',
      step: 2,
      title: 'BWA',
      subtitle: 'Fehlt',
      status: 'blocked',
      state: 'critical',
      icon: 'file-text'
    },
    {
      id: 'bank',
      step: 3,
      title: 'Bank',
      subtitle: 'Prüfung wartet',
      status: 'pending',
      icon: 'building'
    },
    {
      id: 'zusage',
      step: 4,
      title: 'Zusage',
      subtitle: 'Finanzierung',
      status: 'pending',
      icon: 'check-circle'
    }
  ],
  blockedBetween: [2, 3],
  riskText: 'Wenn heute nichts passiert: Risiko steigt, Bankprüfung bleibt blockiert.'
}

export const riskCurvePoints = [
  { x: 0, y: 20 },
  { x: 20, y: 25 },
  { x: 40, y: 35 },
  { x: 60, y: 55 },
  { x: 80, y: 80 },
  { x: 100, y: 100 }
]

export const actorTypes = {
  internal: { label: 'Intern', color: 'emerald' },
  external: { label: 'Extern', color: 'violet' },
  system: { label: 'System', color: 'blue' },
  ghost: { label: 'Ghost', color: 'amber' }
} as const

export const scenarioA = {
  title: 'Szenario A: Heute nichts tun',
  points: [
    'Bankprüfung bleibt blockiert',
    'Verkäufer wird unsicher',
    'Risiko steigt',
    'Mentale Last bleibt offen'
  ],
  type: 'negative' as const
}

export const scenarioB = {
  title: 'Szenario B: Steuerberater anschreiben',
  points: [
    'BWA kann beschleunigt werden',
    'Bankakte bleibt aktiv',
    'Verkäufer kann beruhigt werden',
    'Risiko sinkt'
  ],
  type: 'positive' as const,
  recommended: true
}

export const scenarioC = {
  title: 'Szenario C: Nachverfolgung delegieren',
  points: [
    'Operative Last sinkt',
    'Martin behält Entscheidungshoheit',
    'Prozess läuft weiter',
    'Kontrolle bleibt erhalten'
  ],
  type: 'neutral' as const
}
