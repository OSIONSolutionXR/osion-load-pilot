/**
 * OSION Load Pilot - Schema Normalization Helpers
 * 
 * Extrahiert Daten aus verschiedenen Backend-Response-Strukturen
 * Robustes Mapping für analysis.actions, risks, blockers, questions, options
 */

import type { Measure, MeasureStatus, MeasurePriority } from '../types/measures'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Findet das erste gültige Array aus einer Liste von Kandidaten
 */
export function firstArray(candidates: unknown[]): unknown[] {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate.filter(Boolean)
    }
  }
  return []
}

/**
 * Kürzt Text an Wortgrenze
 */
export function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || ''
  
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  // Wenn kein Leerzeichen gefunden oder zu nah am Anfang, hart kürzen
  if (lastSpace <= maxLength * 0.8) {
    return truncated + '...'
  }
  
  return truncated.slice(0, lastSpace) + '...'
}

/**
 * Normalisiert einen Titel (Länge begrenzen, bereinigen)
 */
export function normalizeTitle(text: string, maxLength: number): string {
  if (!text) return ''
  
  // Bereinigen
  let cleaned = text.trim()
    .replace(/\s+/g, ' ')           // Mehrfache Leerzeichen entfernen
    .replace(/[\r\n\t]/g, ' ')      // Zeilenumbrüche entfernen
    .replace(/^["']|["']$/g, '')    // Anführungszeichen am Anfang/Ende entfernen
  
  // Auf Länge kürzen
  if (cleaned.length > maxLength) {
    cleaned = truncateAtWordBoundary(cleaned, maxLength)
  }
  
  return cleaned
}

/**
 * Normalisiert eine Beschreibung (Länge begrenzen, bereinigen)
 */
export function normalizeDescription(text: string, maxLength: number): string {
  if (!text) return ''
  
  // Bereinigen
  let cleaned = text.trim()
    .replace(/\s+/g, ' ')           // Mehrfache Leerzeichen entfernen
    .replace(/[\r\n\t]+/g, ' ')     // Zeilenumbrüche zu Leerzeichen
  
  // Auf Länge kürzen
  if (cleaned.length > maxLength) {
    cleaned = truncateAtWordBoundary(cleaned, maxLength)
  }
  
  return cleaned
}

/**
 * Extrahiert Projekttitel aus Input-Text
 * Erkennt Muster wie "Projekt namens 'X'" oder "Projekt namens \"X\""
 */
export function extractProjectTitle(input: string): string | null {
  if (!input) return null
  
  const trimmed = input.trim()
  
  // Muster 1: Projekt namens "..." oder '...'
  const namedQuoteMatch = trimmed.match(/(?:Projekt|Project)\s+namens\s+["']([^"']+)["']/i)
  if (namedQuoteMatch) {
    const title = namedQuoteMatch[1].trim()
    if (title.length >= 2 && title.length <= 60) {
      return normalizeTitle(title, 60)
    }
  }
  
  // Muster 2: Projekt namens ... (ohne Anführungszeichen, bis nächster Satzende)
  const namedMatch = trimmed.match(/(?:Projekt|Project)\s+namens\s+(.+?)(?:\.|,|;|\s+aufbauen|\s+erstellen|\s+starten|\s+planen)/i)
  if (namedMatch) {
    const title = namedMatch[1].trim()
    if (title.length >= 2 && title.length <= 60) {
      return normalizeTitle(title, 60)
    }
  }
  
  // Muster 3: "Ich möchte X" oder "Ich will X" - X extrahieren
  const wantMatch = trimmed.match(/^(?:Ich\s+(?:möchte|will|muss|plane|mache|erstelle)|Wir\s+(?:möchten|wollen|müssen|planen|machen|erstellen))\s+(.+?)(?:\.|,|;|$)/i)
  if (wantMatch) {
    const title = wantMatch[1].trim()
      .replace(/^(ein|eine|einen|mein|meine)\s+/i, '') // Artikel entfernen
    if (title.length >= 2 && title.length <= 60) {
      return normalizeTitle(title, 60)
    }
  }
  
  return null
}

// ============================================================================
// SCHEMA EXTRACTION
// ============================================================================

interface RawAnalysisData {
  [key: string]: unknown
}

/**
 * Extrahiert Prozessschritte aus verschiedenen Pfaden
 */
export function extractProcessSteps(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.processSteps,
    (raw.analysis as RawAnalysisData)?.processSteps,
    (raw.projectTwin as RawAnalysisData)?.processSteps,
    (raw.twin as RawAnalysisData)?.processSteps,
    (raw.result as RawAnalysisData)?.processSteps,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.processSteps
  ])
}

/**
 * Extrahiert Maßnahmen/Actions aus verschiedenen Pfaden
 */
export function extractMeasures(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.measures,
    (raw.analysis as RawAnalysisData)?.measures,
    (raw.analysis as RawAnalysisData)?.actions,
    raw.actions,
    (raw.projectTwin as RawAnalysisData)?.measures,
    (raw.twin as RawAnalysisData)?.measures,
    (raw.result as RawAnalysisData)?.measures,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.measures,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.actions
  ])
}

/**
 * Extrahiert Risiken aus verschiedenen Pfaden
 */
export function extractRisks(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.risks,
    (raw.analysis as RawAnalysisData)?.risks,
    (raw.projectTwin as RawAnalysisData)?.risks,
    (raw.twin as RawAnalysisData)?.risks,
    (raw.result as RawAnalysisData)?.risks,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.risks
  ])
}

/**
 * Extrahiert Blocker aus verschiedenen Pfaden
 */
export function extractBlockers(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.blockers,
    (raw.analysis as RawAnalysisData)?.blockers,
    (raw.projectTwin as RawAnalysisData)?.blockers,
    (raw.twin as RawAnalysisData)?.blockers,
    (raw.result as RawAnalysisData)?.blockers,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.blockers
  ])
}

/**
 * Extrahiert Fragen aus verschiedenen Pfaden
 */
export function extractQuestions(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.questions,
    (raw.analysis as RawAnalysisData)?.questions,
    (raw.projectTwin as RawAnalysisData)?.questions,
    (raw.twin as RawAnalysisData)?.questions,
    (raw.result as RawAnalysisData)?.questions,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.questions
  ])
}

/**
 * Extrahiert Optionen aus verschiedenen Pfaden
 */
export function extractOptions(raw: RawAnalysisData): unknown[] {
  return firstArray([
    raw.options,
    (raw.analysis as RawAnalysisData)?.options,
    (raw.projectTwin as RawAnalysisData)?.options,
    (raw.twin as RawAnalysisData)?.options,
    (raw.result as RawAnalysisData)?.options,
    ((raw.result as RawAnalysisData)?.analysis as RawAnalysisData)?.options
  ])
}

// ============================================================================
// ACTION TO MEASURE MAPPING
// ============================================================================

interface RawAction {
  title?: string
  name?: string
  description?: string
  summary?: string
  messageDraft?: string | null
  status?: string
  priority?: string
  effort?: string
  impact?: string
  deadline?: string | null
  isActionable?: boolean
  owner?: string
}

/**
 * Mappt eine Action zu einer Measure
 */
export function mapActionToMeasure(
  action: RawAction,
  projectId: string,
  projectTitle: string,
  index: number,
  createdAt: string
): Measure {
  const title = normalizeTitle(action.title || action.name || 'Maßnahme', 90)
  const description = normalizeDescription(
    action.description || action.summary || action.messageDraft || '',
    360
  )
  
  // Status mappen
  let status: MeasureStatus = 'open'
  if (action.status) {
    const s = action.status.toLowerCase()
    if (['done', 'completed', 'erledigt'].includes(s)) status = 'done'
    else if (['in_progress', 'in-progress', 'active'].includes(s)) status = 'in_progress'
    else if (['waiting', 'wartet'].includes(s)) status = 'waiting'
    else if (['blocked', 'blockiert'].includes(s)) status = 'blocked'
    else if (['idea', 'idee'].includes(s)) status = 'idea'
  }
  
  // Priorität mappen
  let priority: MeasurePriority = 'medium'
  if (action.priority) {
    const p = action.priority.toLowerCase()
    if (['critical', 'kritisch'].includes(p)) priority = 'critical'
    else if (['high', 'hoch'].includes(p)) priority = 'high'
    else if (['medium', 'mittel'].includes(p)) priority = 'medium'
    else if (['low', 'niedrig'].includes(p)) priority = 'low'
  } else if (action.effort && action.impact) {
    // Effort/Impact zu Priority ableiten
    const effort = action.effort.toLowerCase()
    const impact = action.impact.toLowerCase()
    if (impact === 'high' && effort === 'low') priority = 'high'
    else if (impact === 'high') priority = 'high'
    else if (impact === 'low' && effort === 'high') priority = 'low'
  }
  
  // Effort/Impact zu valueScore
  let valueScore = 5
  if (action.impact) {
    const impactMap: Record<string, number> = { high: 9, medium: 6, low: 3 }
    valueScore = impactMap[action.impact.toLowerCase()] || 5
  }
  
  return {
    id: `M-${projectId.slice(-8)}-${index.toString().padStart(3, '0')}`,
    projectId,
    projectTitle,
    parentId: null,
    title,
    description: description || undefined,
    status,
    priority,
    dueDate: action.deadline || null,
    createdAt,
    owner: action.owner || 'Unassigned',
    valueScore,
    strategicGoal: projectTitle,
    notes: '',
    linkedProcessStepId: undefined,
    tags: [priority, 'twin_action'],
    source: 'twin_action'
  }
}

/**
 * Konvertiert Actions zu Measures
 */
export function convertActionsToMeasures(
  actions: unknown[],
  projectId: string,
  projectTitle: string,
  createdAt: string
): Measure[] {
  if (!Array.isArray(actions) || actions.length === 0) {
    return []
  }
  
  return actions
    .filter((a): a is RawAction => 
      a !== null && 
      typeof a === 'object' &&
      (('title' in a && typeof (a as RawAction).title === 'string') ||
       ('name' in a && typeof (a as RawAction).name === 'string'))
    )
    .map((action, index) => mapActionToMeasure(action, projectId, projectTitle, index, createdAt))
}

// ============================================================================
// COMPLEXITY DETECTION
// ============================================================================

export type ProjectComplexity = 'simple' | 'medium' | 'complex' | 'high_end'

interface ComplexityIndicators {
  inputLength: number
  moduleCount: number
  openQuestions: number
  stakeholderCount: number
  hasRegulation: boolean
  hasSafety: boolean
  hasInfrastructure: boolean
  hasCrisis: boolean
  hasMultiLocation: boolean
  hasMultiActor: boolean
}

/**
 * Erkennt Projektkomplexität basierend auf Input und Kontext
 */
export function detectComplexity(
  input: string,
  indicators: Partial<ComplexityIndicators> = {}
): ProjectComplexity {
  const normalized = input.toLowerCase()
  
  // High-End Indikatoren
  const highEndKeywords = [
    'infrastruktur', 'katastrophe', 'krise', 'notfall', 'versorgung',
    'klinik', 'krankenhaus', 'flughafen', 'deich', 'hochwasser',
    'system', 'plattform', 'multi', 'enterprise', 'organisation',
    'region', 'bundesweit', 'überregional', 'gesetzlich', 'regulatorisch'
  ]
  
  // Complex Indikatoren
  const complexKeywords = [
    'app', 'datenbank', 'backend', 'frontend', 'ki', 'ai', 'api',
    'integration', 'automation', 'prozess', 'workflow',
    'funnel', 'conversion', 'marketing'
  ]
  
  // Einfache Indikatoren
  const simpleKeywords = [
    'wohnwagen', 'mieten', 'kaufen', 'einfach', 'klein',
    'ferienhaus', 'auto', 'motorrad', 'website', 'büro'
  ]
  
  const hasHighEnd = highEndKeywords.some(k => normalized.includes(k)) ||
    indicators.hasInfrastructure ||
    indicators.hasCrisis ||
    indicators.hasMultiLocation
  
  const hasComplex = complexKeywords.some(k => normalized.includes(k)) ||
    indicators.hasRegulation ||
    indicators.moduleCount && indicators.moduleCount > 3 ||
    indicators.stakeholderCount && indicators.stakeholderCount > 5
  
  const hasSimple = simpleKeywords.some(k => normalized.includes(k))
  
  // Entscheidungslogik
  if (hasHighEnd) return 'high_end'
  if (hasComplex) return 'complex'
  if (hasSimple) return 'simple'
  
  // Fallback auf Input-Länge
  if (normalized.length > 500) return 'complex'
  if (normalized.length > 200) return 'medium'
  return 'simple'
}

/**
 * Gibt erwartete Output-Tiefe basierend auf Komplexität zurück
 */
export function getExpectedOutputDepth(complexity: ProjectComplexity): {
  processSteps: { min: number; max: number }
  measures: { min: number; max: number }
  risks: { min: number; max: number }
  questions: { min: number; max: number }
  blockers: { min: number; max: number }
  options: { min: number; max: number }
} {
  const depths: Record<ProjectComplexity, ReturnType<typeof getExpectedOutputDepth>> = {
    simple: {
      processSteps: { min: 5, max: 8 },
      measures: { min: 5, max: 12 },
      risks: { min: 2, max: 5 },
      questions: { min: 2, max: 5 },
      blockers: { min: 0, max: 3 },
      options: { min: 1, max: 3 }
    },
    medium: {
      processSteps: { min: 8, max: 12 },
      measures: { min: 12, max: 25 },
      risks: { min: 4, max: 8 },
      questions: { min: 5, max: 10 },
      blockers: { min: 2, max: 6 },
      options: { min: 2, max: 5 }
    },
    complex: {
      processSteps: { min: 12, max: 18 },
      measures: { min: 25, max: 50 },
      risks: { min: 8, max: 15 },
      questions: { min: 8, max: 15 },
      blockers: { min: 5, max: 10 },
      options: { min: 4, max: 8 }
    },
    high_end: {
      processSteps: { min: 14, max: 24 },
      measures: { min: 40, max: 80 },
      risks: { min: 12, max: 25 },
      questions: { min: 12, max: 25 },
      blockers: { min: 8, max: 15 },
      options: { min: 5, max: 10 }
    }
  }
  
  return depths[complexity]
}
