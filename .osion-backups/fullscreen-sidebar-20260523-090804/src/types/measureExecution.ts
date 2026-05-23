/**
 * Measure Execution Layer Types
 * Vorbereitung für spätere KI-Ausführung von Maßnahmen
 * Noch keine echte externe Tool-Ausführung – nur Planung
 */

export type ExecutionMode = 
  | 'plan_only'      // Nur Plan erstellen (aktuell aktiv)
  | 'draft'          // Entwurf vorbereiten (kommt später)
  | 'approval_required'  // Mit Freigabe ausführen (kommt später)
  | 'autonomous'     // Autonom später (kommt später)

export type ExecutionStatus =
  | 'not_started'
  | 'planning'
  | 'waiting_for_approval'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AgentType =
  | 'auto'           // KI wählt automatisch
  | 'research'       // Recherche-Agent
  | 'document'       // Dokument-Agent
  | 'email'          // E-Mail-Agent
  | 'analysis'       // Analyse-Agent
  | 'calendar'       // Termin-Agent
  | 'data'           // Daten-Agent
  | 'writing'        // Schreib-Agent

export type OutputFormat =
  | 'comparison_table'
  | 'report'
  | 'email_draft'
  | 'spreadsheet'
  | 'decision_template'
  | 'checklist'
  | 'presentation'
  | 'text'

export interface ExecutionStep {
  id: string
  order: number
  title: string
  description: string
  estimatedDuration: string
  requiresApproval: boolean
  dependencies: string[]  // IDs der vorherigen Schritte
}

export interface ExecutionRisk {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string
}

export interface ExecutionPlan {
  steps: ExecutionStep[]
  estimatedTotalDuration: string
  requiredResources: string[]
  risks: ExecutionRisk[]
  approvalPoints: number[]  // Step-IDs wo Freigabe nötig
}

export interface MeasureExecution {
  // Konfiguration
  mode: ExecutionMode
  status: ExecutionStatus
  agentType: AgentType
  
  // Auftragsdefinition
  objective: string
  successCriteria: string[]
  constraints: string[]
  allowedSources: string[]
  outputFormat: OutputFormat
  
  // Ergebnis
  executionPlan?: ExecutionPlan
  resultSummary?: string
  resultData?: Record<string, unknown>
  
  // Metadaten
  approvalRequired: boolean
  createdAt: string
  updatedAt: string
  plannedAt?: string
  startedAt?: string
  completedAt?: string
  lastRunAt?: string
  
  // Verlauf
  log: ExecutionLogEntry[]
}

export interface ExecutionLogEntry {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  stepId?: string
  metadata?: Record<string, unknown>
}

// Formular-Daten für neues Execution Panel
export interface ExecutionFormData {
  objective: string
  successCriteria: string
  constraints: string
  allowedSources: string[]
  outputFormat: OutputFormat
  mode: ExecutionMode
  agentType: AgentType
}

export const INITIAL_EXECUTION_FORM: ExecutionFormData = {
  objective: '',
  successCriteria: '',
  constraints: '',
  allowedSources: [],
  outputFormat: 'comparison_table',
  mode: 'plan_only',
  agentType: 'auto'
}

// Quellen-Optionen
export const ALLOWED_SOURCES_OPTIONS = [
  { id: 'mobile.de', label: 'Mobile.de', category: 'fahrzeuge' },
  { id: 'autoscout24', label: 'Autoscout24', category: 'fahrzeuge' },
  { id: 'ebay-kleinanzeigen', label: 'eBay Kleinanzeigen', category: 'fahrzeuge' },
  { id: 'google', label: 'Google', category: 'web' },
  { id: 'project_files', label: 'Projektdateien', category: 'internal' },
  { id: 'email', label: 'E-Mail-Verkehr', category: 'communication' },
  { id: 'web', label: 'Allgemeines Web', category: 'web' },
  { id: 'custom', label: 'Eigene Quelle', category: 'custom' }
]

// Agent-Beschreibungen
export const AGENT_TYPE_DESCRIPTIONS: Record<AgentType, { label: string; description: string; icon: string }> = {
  auto: {
    label: 'Auto wählen',
    description: 'KI wählt den passenden Agenten basierend auf der Maßnahme',
    icon: 'Sparkles'
  },
  research: {
    label: 'Research Agent',
    description: 'Recherchiert Informationen, vergleicht Optionen, sammelt Daten',
    icon: 'Search'
  },
  document: {
    label: 'Document Agent',
    description: 'Erstellt Dokumente, Briefe, Angebote, Verträge',
    icon: 'FileText'
  },
  email: {
    label: 'E-Mail Agent',
    description: 'Verfasst E-Mails, verwaltet Kommunikation, sendet Entwürfe',
    icon: 'Mail'
  },
  analysis: {
    label: 'Analysis Agent',
    description: 'Analysiert Daten, erkennt Muster, bewertet Risiken',
    icon: 'BarChart'
  },
  calendar: {
    label: 'Termin Agent',
    description: 'Plant Termine, sendet Einladungen, koordiniert Zeiten',
    icon: 'Calendar'
  },
  data: {
    label: 'Data Agent',
    description: 'Verarbeitet Daten, erstellt Listen, aktualisiert Tabellen',
    icon: 'Database'
  },
  writing: {
    label: 'Writing Agent',
    description: 'Schreibt Texte, formuliert um, erstellt Inhalte',
    icon: 'PenTool'
  }
}

// Ausführungsmodi-Beschreibungen
export const EXECUTION_MODE_DESCRIPTIONS: Record<ExecutionMode, { 
  label: string; 
  description: string; 
  available: boolean;
  comingSoon?: boolean 
}> = {
  plan_only: {
    label: 'Nur Plan erstellen',
    description: 'KI erstellt einen detaillierten Ausführungsplan. Keine externen Aktionen.',
    available: true
  },
  draft: {
    label: 'Entwurf vorbereiten',
    description: 'KI erstellt Materialien und Entwürfe. Noch keine externe Ausführung.',
    available: false,
    comingSoon: true
  },
  approval_required: {
    label: 'Mit Freigabe ausführen',
    description: 'KI führt aus, aber kritische Schritte brauchen deine Freigabe.',
    available: false,
    comingSoon: true
  },
  autonomous: {
    label: 'Autonom ausführen',
    description: 'KI arbeitet selbstständig im freigegebenen Rahmen.',
    available: false,
    comingSoon: true
  }
}

// Output-Format Beschreibungen
export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  comparison_table: 'Vergleichsliste',
  report: 'Bericht',
  email_draft: 'E-Mail-Entwurf',
  spreadsheet: 'Tabelle',
  decision_template: 'Entscheidungsvorlage',
  checklist: 'Checkliste',
  presentation: 'Präsentation',
  text: 'Freitext'
}
