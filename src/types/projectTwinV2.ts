/**
 * Project Twin V2 - Erweitertes Datenmodell für wachsende Project Twins
 * Schema Version 2
 */

import type { ProjectTwinAnalysis } from './projectTwin'
import type { SimulationRun } from './simulation'

// ============================================================================
// ENUMS
// ============================================================================

export type ContextQuestionStatus = 'open' | 'answered' | 'skipped'
export type ContextQuestionPriority = 'high' | 'medium' | 'low'
export type ContextQuestionInputType = 'text' | 'date' | 'number' | 'choice' | 'yes_no'

export type UpdateSource = 'context_form' | 'manual_update' | 'project_chat' | 'action_update'

export type ProgressStage = 
  | 'created' 
  | 'needs_context' 
  | 'clarified' 
  | 'in_progress' 
  | 'blocked' 
  | 'decision_ready' 
  | 'completed'

export type SolutionType = 
  | 'email' 
  | 'whatsapp' 
  | 'phone_script' 
  | 'checklist' 
  | 'decision_note' 
  | 'risk_argument' 
  | 'next_steps'

export type SolutionStatus = 'draft' | 'used' | 'archived'

export type ChatRole = 'user' | 'assistant' | 'system'

export type SimulationMode = 'agent_council_mvp' | 'hundred_perspective_simulation'

export type TwinSource = 'analysis' | 'import' | 'manual'

export type AnalysisMode = 'openclaw-kimi' | 'manual'

// ============================================================================
// PROJECT CONTEXT QUESTION
// ============================================================================

export interface ProjectContextQuestion {
  id: string
  label: string
  reason: string
  sourceMissingContext: string
  suggestedInputType: ContextQuestionInputType
  priority: ContextQuestionPriority
  options?: string[]
  answer?: string
  answeredAt?: string
  status: ContextQuestionStatus
}

// ============================================================================
// PROJECT TWIN UPDATE (Erweitert)
// ============================================================================

export interface ProjectTwinChangedField {
  field: string
  before?: string
  after?: string
  reason?: string
}

export interface ProjectTwinUpdate {
  id: string
  createdAt: string
  input: string
  summary: string
  source: UpdateSource
  changedFields: ProjectTwinChangedField[]
  previousProgressPercent?: number
  newProgressPercent?: number
  previousNextMoveTitle?: string
  newNextMoveTitle?: string
}

// ============================================================================
// PROJECT TWIN PROGRESS
// ============================================================================

export interface ProjectTwinProgress {
  percent: number
  level: number
  stage: ProgressStage
  completedActions: string[] // IDs oder Titel der abgeschlossenen Aktionen
  openActions: string[] // IDs oder Titel der offenen Aktionen
  lastProgressReason: string
  updatedAt: string
}

// ============================================================================
// GENERATED SOLUTION
// ============================================================================

export interface GeneratedSolution {
  id: string
  createdAt: string
  actionTitle: string
  solutionType: SolutionType
  title: string
  content: string
  relatedActionId?: string
  status: SolutionStatus
}

// ============================================================================
// PROJECT TWIN CHAT
// ============================================================================

export interface ProjectTwinChatMessage {
  id: string
  createdAt: string
  role: ChatRole
  content: string
  relatedActionId?: string
  generatedSolutionId?: string
}

// ============================================================================
// FUTURE SIMULATION
// ============================================================================

export interface ProjectSimulationAgentOpinion {
  id: string
  role: string
  perspective: string
  chance: string
  risk: string
  blindSpot: string
  recommendation: string
  probability?: number
}

export interface ProjectSimulationSynthesis {
  summary: string
  topRisks: string[]
  topChances: string[]
  mostLikelyScenario: string
  bestNextMove: string
  decisionRecommendation: string
}

export interface ProjectFutureSimulation {
  id: string
  createdAt: string
  simulationMode: SimulationMode
  agents: ProjectSimulationAgentOpinion[]
  synthesis: ProjectSimulationSynthesis
}

// ============================================================================
// STORAGE META
// ============================================================================

export interface ProjectTwinStorageMeta {
  source: TwinSource
  model?: string
  promptVersion?: string
  analysisMode?: AnalysisMode
  lastSyncedAt?: string
  localOnly: boolean
}

// ============================================================================
// PROCESS STEP (Prozesspfad)
// ============================================================================

export type ProcessStepStatus = 'done' | 'active' | 'blocked' | 'next' | 'pending' | 'skipped'

export interface ProcessStep {
  id: string
  title: string
  description: string
  status: ProcessStepStatus
  order: number
  dependsOn: string[] // IDs der vorherigen Schritte
  blockerReason: string
  linkedMeasureIds: string[] // IDs verknüpfter Maßnahmen
  updatedAt: string
}

// ============================================================================
// STORED PROJECT TWIN V2
// ============================================================================

export interface StoredProjectTwinV2 {
  // Core Identity
  id: string
  schemaVersion: 2
  title: string
  description?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
  
  // Input History
  originalInput: string
  latestInput?: string
  
  // Analysis (bestehende Struktur)
  analysis: ProjectTwinAnalysis

  // Prozesspfad (dynamische Prozessschritte)
  processSteps: ProcessStep[]
  
  // Neue V2 Features
  contextQuestions: ProjectContextQuestion[]
  updates: ProjectTwinUpdate[]
  progress: ProjectTwinProgress
  generatedSolutions: GeneratedSolution[]
  chatHistory: ProjectTwinChatMessage[]
  futureSimulation?: ProjectFutureSimulation
  simulationRuns?: SimulationRun[]
  
  // Meta
  meta: ProjectTwinStorageMeta
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const DEFAULT_PROGRESS: ProjectTwinProgress = {
  percent: 10,
  level: 1,
  stage: 'created',
  completedActions: [],
  openActions: [],
  lastProgressReason: 'Project Twin initial erstellt',
  updatedAt: new Date().toISOString()
}

export const DEFAULT_META: ProjectTwinStorageMeta = {
  source: 'analysis',
  localOnly: true
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Bestimmt den initialen Progress-Stage basierend auf Analyse-Qualität
 */
export function determineInitialStage(analysis: ProjectTwinAnalysis): ProgressStage {
  const { quality, project } = analysis
  
  // Wenn blockiert
  if (project.status === 'blocked') {
    return 'blocked'
  }
  
  // Wenn hohes Vertrauen und keine fehlenden Kontexte
  if (quality.confidence === 'high' && quality.missingContext.length === 0) {
    return 'clarified'
  }
  
  // Wenn nutzbar aber fehlender Kontext
  if (quality.inputQuality === 'usable' && quality.missingContext.length > 0) {
    return 'needs_context'
  }
  
  // Wenn unzureichend
  if (quality.inputQuality === 'insufficient') {
    return 'created'
  }
  
  // Default
  return 'created'
}

/**
 * Berechnet initialen Progress-Prozentsatz
 */
export function calculateInitialProgress(analysis: ProjectTwinAnalysis): number {
  const { quality } = analysis
  let progress = 10 // Base
  
  // Input Quality Bonus
  if (quality.inputQuality === 'usable') progress += 10
  if (quality.inputQuality === 'strong') progress += 20
  
  // Confidence Bonus
  if (quality.confidence === 'medium') progress += 10
  if (quality.confidence === 'high') progress += 20
  
  // Missing Context Penalty
  const missingPenalty = Math.min(quality.missingContext.length * 5, 20)
  progress -= missingPenalty
  
  // Cap auf 15-95
  return Math.max(15, Math.min(95, progress))
}

/**
 * Erstellt Default-Progress für neuen Twin
 */
export function createDefaultProgress(analysis: ProjectTwinAnalysis): ProjectTwinProgress {
  const stage = determineInitialStage(analysis)
  const percent = calculateInitialProgress(analysis)
  
  return {
    percent,
    level: 1,
    stage,
    completedActions: [],
    openActions: analysis.actions?.map(a => a.title) || [],
    lastProgressReason: stage === 'needs_context' 
      ? 'Projektlage erkannt. Weiterer Kontext wird für präzisere Empfehlungen benötigt.'
      : stage === 'clarified'
      ? 'Projektlage vollständig verstanden. Bereit für Umsetzung.'
      : 'Project Twin initial erstellt und bereit für Entwicklung.',
    updatedAt: new Date().toISOString()
  }
}

/**
 * Erstellt Default-Meta aus Analyse
 */
export function createDefaultMeta(analysis: ProjectTwinAnalysis): ProjectTwinStorageMeta {
  return {
    source: 'analysis',
    model: analysis.meta?.analysisMode === 'openclaw-kimi' ? 'ollama/kimi-k2.5:cloud' : undefined,
    promptVersion: analysis.meta?.promptVersion,
    analysisMode: analysis.meta?.analysisMode,
    localOnly: true
  }
}

/**
 * Generiert Kontextfragen aus missingContext
 */
export function generateContextQuestionsFromMissing(
  missingContext: string[]
): ProjectContextQuestion[] {
  const questionMap: Record<string, { label: string; reason: string; inputType: ContextQuestionInputType }> = {
    'Budget': { 
      label: 'Welcher Budgetrahmen ist geplant?', 
      reason: 'Der Budgetrahmen beeinflusst alle weiteren Entscheidungen maßgeblich.',
      inputType: 'number'
    },
    'Nutzungsprofil': { 
      label: 'Wofür wird das Hauptziel hauptsächlich genutzt?', 
      reason: 'Das Nutzungsprofil bestimmt Prioritäten und Anforderungen.',
      inputType: 'text'
    },
    'Fahrzeugtyp': { 
      label: 'Welcher Typ ist gewünscht?', 
      reason: 'Die Typ-Entscheidung schränkt die Optionen ein.',
      inputType: 'choice'
    },
    'Zahlungsweise': { 
      label: 'Welche Zahlungsweise bevorzugst du?', 
      reason: 'Bar, Finanzierung oder Leasing beeinflussen Verhandlungsspielraum.',
      inputType: 'choice'
    },
    'Zeitrahmen': { 
      label: 'Bis wann soll die Entscheidung fallen?', 
      reason: 'Der Zeitrahmen beeinflusst Dringlichkeit und Optionen.',
      inputType: 'date'
    },
    'Zielmarkt': { 
      label: 'Was ist der gewünschte Zielmarkt?', 
      reason: 'Der Markt bestimmt Strategie und Ressourcenbedarf.',
      inputType: 'text'
    },
    'Zielgruppe': { 
      label: 'Welche Zielgruppe soll zuerst validieren?', 
      reason: 'Die erste Zielgruppe prägt Produktentwicklung und Go-to-Market.',
      inputType: 'text'
    },
    'Erfolgskriterien': { 
      label: 'Was gilt als Erfolg?', 
      reason: 'Klare Erfolgskriterien ermöglichen Fokus und Messbarkeit.',
      inputType: 'choice'
    },
    'Ressourcen': { 
      label: 'Welche Ressourcen stehen bereit?', 
      reason: 'Verfügbare Ressourcen bestimmen Umsetzungsgeschwindigkeit.',
      inputType: 'text'
    },
    'Rahmenbedingungen': { 
      label: 'Gibt es harte Rahmenbedingungen?', 
      reason: 'Constraints begrenzen die Lösungsoptionen.',
      inputType: 'text'
    },
    'Erfolgskriterium': { 
      label: 'Woran erkennst du den Erfolg?', 
      reason: 'Ein klares Erfolgskriterium ermöglicht Fokus.',
      inputType: 'text'
    },
    'beteiligte Personen': { 
      label: 'Wer ist an der Entscheidung beteiligt?', 
      reason: 'Stakeholder müssen frühzeitig identifiziert werden.',
      inputType: 'text'
    },
    'Frist': { 
      label: 'Gibt es einen festen Termin?', 
      reason: 'Fristen beeinflussen Dringlichkeit und Priorisierung.',
      inputType: 'date'
    },
    'Ziel': { 
      label: 'Welches konkrete Ziel soll erreicht werden?', 
      reason: 'Ein klares Ziel ermöglicht zielgerichtete Planung.',
      inputType: 'text'
    },
    'gewünschtes Ergebnis': { 
      label: 'Was ist das gewünschte Ergebnis?', 
      reason: 'Das Ergebnisbild lenkt alle Entscheidungen.',
      inputType: 'text'
    },
    'offene Entscheidung': { 
      label: 'Welche Entscheidung steht aus?', 
      reason: 'Die offene Entscheidung blockiert den Fortschritt.',
      inputType: 'text'
    }
  }

  return missingContext.map((ctx, index) => {
    const mapped = questionMap[ctx] || { 
      label: `Details zu: ${ctx}`, 
      reason: 'Dieser Kontext fehlt für eine vollständige Analyse.',
      inputType: 'text'
    }
    
    return {
      id: `ctxq-${Date.now()}-${index}`,
      label: mapped.label,
      reason: mapped.reason,
      sourceMissingContext: ctx,
      suggestedInputType: mapped.inputType,
      priority: index < 3 ? 'high' : index < 5 ? 'medium' : 'low',
      status: 'open'
    }
  })
}
