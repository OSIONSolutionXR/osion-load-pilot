/**
 * Project Twin Store V2
 * 
 * Erweiterter Store mit Schema Version 2 Unterstützung
 * Automatische Migration von V1 zu V2 beim Laden
 */

import type { ProjectTwinAnalysis, ChangedField } from '../types/projectTwin'
import type { 
  StoredProjectTwinV2,
  ProjectTwinProgress,
  ProjectTwinStorageMeta,
  ProcessStep 
} from '../types/projectTwinV2'
import { 
  normalizeAllStoredTwins
} from './projectTwinNormalize'
import { 
  createDefaultProgress,
  createDefaultMeta,
  generateContextQuestionsFromMissing
} from '../types/projectTwinV2'

// Re-export V2 als primären Typ (backward compatibility)
export type StoredProjectTwin = StoredProjectTwinV2

// Storage Key für V2
const STORAGE_KEY = 'osion-load-pilot.project-twins.v2'
// Altes V1 Key (für Migration)
const STORAGE_KEY_V1 = 'osion-load-pilot.project-twins.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

/**
 * Lädt Twins aus localStorage mit automatischer V1→V2 Migration
 */
export function loadStoredProjectTwins(): StoredProjectTwinV2[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    // Zuerst V2 probieren
    const rawV2 = window.localStorage.getItem(STORAGE_KEY)
    if (rawV2) {
      const parsed = JSON.parse(rawV2)
      if (Array.isArray(parsed)) {
        const normalized = normalizeAllStoredTwins(parsed)
        
        // Wenn V1 noch existiert, löschen wir es nach erfolgreicher Migration
        window.localStorage.removeItem(STORAGE_KEY_V1)
        
        return normalized
      }
    }

    // Fallback zu V1 (für Migration)
    const rawV1 = window.localStorage.getItem(STORAGE_KEY_V1)
    if (rawV1) {
      const parsed = JSON.parse(rawV1)
      if (Array.isArray(parsed)) {
        console.log('[ProjectTwinStore] Migrating V1 twins to V2...')
        const normalized = normalizeAllStoredTwins(parsed)
        
        // Sofort in V2 speichern
        saveStoredProjectTwins(normalized)
        
        // V1 löschen
        window.localStorage.removeItem(STORAGE_KEY_V1)
        
        console.log(`[ProjectTwinStore] Migrated ${normalized.length} twins to V2`)
        return normalized
      }
    }

    return []
  } catch (error) {
    console.error('[ProjectTwinStore] Failed to load twins:', error)
    return []
  }
}

/**
 * Speichert Twins in localStorage (immer als V2)
 */
export function saveStoredProjectTwins(twins: StoredProjectTwinV2[]) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(twins))
  } catch (error) {
    console.error('[ProjectTwinStore] Failed to save twins:', error)
  }
}

/**
 * Erstellt einen neuen Twin mit V2 Defaults
 */
export function createStoredProjectTwin(
  sourceInput: string, 
  analysis: ProjectTwinAnalysis
): StoredProjectTwinV2 {
  const timestamp = new Date().toISOString()
  const trimmedInput = sourceInput.trim()
  
  // Defaults aus Analyse generieren
  const progress = createDefaultProgress(analysis)
  const meta = createDefaultMeta(analysis)
  const contextQuestions = generateContextQuestionsFromMissing(
    analysis.quality.missingContext || []
  )

  // Initialisiere processSteps aus twin.analysis.dependencies oder leer
  const processSteps: ProcessStep[] = analysis.dependencies?.map((dep, index) => ({
    id: `dep-${index}`,
    title: dep.from,
    description: dep.explanation,
    status: dep.isBlocker ? 'blocked' : dep.status === 'done' ? 'done' : dep.status === 'required' ? 'next' : 'pending',
    order: index + 1,
    dependsOn: [],
    blockerReason: dep.isBlocker ? dep.explanation : '',
    linkedMeasureIds: [],
    updatedAt: timestamp
  })) || []

  return {
    id: `twin-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: 2,
    title: analysis.project.title || 'Neues Projekt',
    description: analysis.project.description,
    createdAt: timestamp,
    updatedAt: timestamp,
    originalInput: trimmedInput,
    latestInput: trimmedInput,
    analysis,
    processSteps,
    contextQuestions,
    updates: [],
    progress,
    generatedSolutions: [],
    chatHistory: [],
    futureSimulation: undefined,
    meta: {
      ...meta,
      source: 'analysis',
      localOnly: true
    }
  }
}

// ============================================================================
// UPDATE FUNCTIONS (backward compatible)
// ============================================================================

// Helper: Extrahiere veränderte Felder zwischen zwei Analysen
function extractChangedFields(
  oldAnalysis: ProjectTwinAnalysis,
  newAnalysis: ProjectTwinAnalysis
): ChangedField[] {
  const changes: ChangedField[] = []

  if (oldAnalysis.nextMove.title !== newAnalysis.nextMove.title) {
    changes.push({
      field: 'nextMove.title',
      oldValue: oldAnalysis.nextMove.title,
      newValue: newAnalysis.nextMove.title
    })
  }

  if (oldAnalysis.quality.confidence !== newAnalysis.quality.confidence) {
    changes.push({
      field: 'quality.confidence',
      oldValue: oldAnalysis.quality.confidence,
      newValue: newAnalysis.quality.confidence
    })
  }

  const oldMissing = oldAnalysis.quality.missingContext.join(', ') || 'keine'
  const newMissing = newAnalysis.quality.missingContext.join(', ') || 'keine'
  if (oldMissing !== newMissing) {
    changes.push({
      field: 'quality.missingContext',
      oldValue: oldMissing,
      newValue: newMissing
    })
  }

  return changes
}

// Generiert Zusammenfassung
function generateUpdateSummary(
  changes: ChangedField[],
  analysis: ProjectTwinAnalysis
): string {
  const hasConfidenceIncrease = changes.some(
    c => c.field === 'quality.confidence' && 
    ((c.oldValue === 'low' && c.newValue === 'medium') ||
     (c.oldValue === 'medium' && c.newValue === 'high') ||
     (c.oldValue === 'low' && c.newValue === 'high'))
  )

  const hasContextReduction = changes.some(
    c => c.field === 'quality.missingContext' && 
    analysis.quality.missingContext.length === 0
  )

  if (hasContextReduction && hasConfidenceIncrease) {
    return 'Projektlage vollständig verifiziert'
  }
  if (hasContextReduction) {
    return 'Fehlender Kontext ergänzt'
  }
  if (hasConfidenceIncrease) {
    return `Vertrauensniveau erhöht auf "${analysis.quality.confidence}"`
  }
  return 'Project Twin aktualisiert'
}

/**
 * Aktualisiert einen bestehenden Twin (backward compatible)
 */
export function updateStoredProjectTwin(
  existingTwin: StoredProjectTwinV2,
  additionalInput: string,
  updatedAnalysis: ProjectTwinAnalysis
): StoredProjectTwinV2 {
  const timestamp = new Date().toISOString()
  const changedFields = extractChangedFields(existingTwin.analysis, updatedAnalysis)
  const summary = generateUpdateSummary(changedFields, updatedAnalysis)

  // Progress neu berechnen
  const newProgress = createDefaultProgress(updatedAnalysis)
  
  // Update erstellen
  const updateEntry = {
    id: `upd-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: timestamp,
    input: additionalInput.trim(),
    summary,
    source: 'manual_update' as const,
    changedFields,
    previousProgressPercent: existingTwin.progress.percent,
    newProgressPercent: newProgress.percent,
    previousNextMoveTitle: existingTwin.analysis.nextMove.title,
    newNextMoveTitle: updatedAnalysis.nextMove.title
  }

  return {
    ...existingTwin,
    updatedAt: timestamp,
    latestInput: additionalInput.trim(),
    analysis: updatedAnalysis,
    progress: newProgress,
    updates: [...existingTwin.updates, updateEntry],
    // Neue Kontextfragen falls sich missingContext geändert hat
    contextQuestions: updatedAnalysis.quality.missingContext.length > 0
      ? generateContextQuestionsFromMissing(
          updatedAnalysis.quality.missingContext
        )
      : existingTwin.contextQuestions
  }
}

/**
 * Speichert aktualisierten Twin im Array
 */
export function saveUpdatedProjectTwin(
  allTwins: StoredProjectTwinV2[],
  updatedTwin: StoredProjectTwinV2
): StoredProjectTwinV2[] {
  const newTwins = allTwins.map(t => t.id === updatedTwin.id ? updatedTwin : t)
  saveStoredProjectTwins(newTwins)
  return newTwins
}

// ============================================================================
// V2 SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Aktualisiert den Progress eines Twins
 */
export function updateTwinProgress(
  twin: StoredProjectTwinV2,
  progressUpdate: Partial<ProjectTwinProgress>
): StoredProjectTwinV2 {
  return {
    ...twin,
    updatedAt: new Date().toISOString(),
    progress: {
      ...twin.progress,
      ...progressUpdate,
      updatedAt: new Date().toISOString()
    }
  }
}

/**
 * Markiert eine Kontextfrage als beantwortet
 */
export function answerContextQuestion(
  twin: StoredProjectTwinV2,
  questionId: string,
  answer: string
): StoredProjectTwinV2 {
  return {
    ...twin,
    updatedAt: new Date().toISOString(),
    contextQuestions: twin.contextQuestions.map(q =>
      q.id === questionId
        ? { ...q, status: 'answered' as const, answer, answeredAt: new Date().toISOString() }
        : q
    )
  }
}

/**
 * Aktualisiert Meta-Informationen
 */
export function updateTwinMeta(
  twin: StoredProjectTwinV2,
  metaUpdate: Partial<ProjectTwinStorageMeta>
): StoredProjectTwinV2 {
  return {
    ...twin,
    updatedAt: new Date().toISOString(),
    meta: {
      ...twin.meta,
      ...metaUpdate
    }
  }
}
