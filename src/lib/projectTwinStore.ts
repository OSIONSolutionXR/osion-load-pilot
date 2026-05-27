/**
 * Project Twin Store V2
 * 
 * Erweiterter Store mit Schema Version 2 Unterstützung
 * Automatische Migration von V1 zu V2 beim Laden
 * Phase 5: Unterstützung für Backend-projectId
 */

import type { ProjectTwinAnalysis, ChangedField } from '../types/projectTwin'
import type { 
  StoredProjectTwinV2,
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
import { extractMeasuresFromTwin } from './measuresNormalize'

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
 * Phase 5: Nutzt backendProjectId falls vom Backend erhalten
 */
export function createStoredProjectTwin(
  sourceInput: string, 
  analysis: ProjectTwinAnalysis,
  backendProjectId?: string
): StoredProjectTwinV2 {
  const timestamp = new Date().toISOString()
  const trimmedInput = sourceInput.trim()
  
  // Phase 5: Verwende Backend-ID falls vorhanden, sonst generiere neue
  const twinId = backendProjectId || `twin-${timestamp}-${Math.random().toString(36).slice(2, 8)}`
  
  // Defaults aus Analyse generieren
  const progress = createDefaultProgress(analysis)
  const meta = createDefaultMeta(analysis)
  const contextQuestions = generateContextQuestionsFromMissing(
    analysis.quality.missingContext || []
  )

  // Initialisiere processSteps aus analysis.dependencies oder leer
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

  // Initialisiere measures aus Actions
  const measures = extractMeasuresFromTwin({
    id: twinId,
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
    attentionQueue: [],
    measures: [],
    activityLog: [],
    meta: {
      ...meta,
      source: 'analysis',
      localOnly: true
    }
  } as StoredProjectTwinV2)

  return {
    id: twinId,
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
    attentionQueue: [],
    measures,
    activityLog: [],
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
 * Aktualisiert einen bestehenden Twin
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

  return {
    ...existingTwin,
    analysis: updatedAnalysis,
    latestInput: additionalInput.trim(),
    updatedAt: timestamp,
    updates: [
      {
        id: `upd-${timestamp}`,
        createdAt: timestamp,
        input: additionalInput.trim(),
        summary,
        source: 'manual_update',
        changedFields
      },
      ...existingTwin.updates
    ],
    progress: newProgress
  }
}

/**
 * Speichert einen aktualisierten Twin in der Liste
 */
export function saveUpdatedProjectTwin(
  twins: StoredProjectTwinV2[],
  updatedTwin: StoredProjectTwinV2
): StoredProjectTwinV2[] {
  const index = twins.findIndex(t => t.id === updatedTwin.id)
  if (index === -1) {
    console.warn('[ProjectTwinStore] Twin not found:', updatedTwin.id)
    return twins
  }

  const newTwins = [...twins]
  newTwins[index] = updatedTwin
  return newTwins
}

// ============================================================================
// MEASURE FUNCTIONS
// ============================================================================

import type { Measure } from '../types/measures'

/**
 * Fügt eine Measure zu einem Twin hinzu
 */
export function addMeasureToTwin(
  twin: StoredProjectTwinV2,
  measure: Measure
): StoredProjectTwinV2 {
  console.log('[ProjectTwinStore] addMeasureToTwin:', measure.id)
  return {
    ...twin,
    measures: [...twin.measures, measure]
  }
}

/**
 * Aktualisiert eine Measure in einem Twin
 */
export function updateTwinMeasure(
  twin: StoredProjectTwinV2,
  measureId: string,
  updates: Partial<Measure>
): StoredProjectTwinV2 {
  const updatedMeasures = twin.measures.map(m => 
    m.id === measureId ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
  )
  
  return {
    ...twin,
    measures: updatedMeasures
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Löscht alle gespeicherten Twins
 */
export function clearStoredProjectTwins() {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(STORAGE_KEY_V1)
}

/**
 * Exportiert alle Twins als JSON
 */
export function exportTwinsToJSON(): string {
  const twins = loadStoredProjectTwins()
  return JSON.stringify(twins, null, 2)
}

/**
 * Importiert Twins aus JSON
 */
export function importTwinsFromJSON(json: string): StoredProjectTwinV2[] {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      const normalized = normalizeAllStoredTwins(parsed)
      saveStoredProjectTwins(normalized)
      return normalized
    }
    throw new Error('Invalid format: expected array')
  } catch (error) {
    console.error('[ProjectTwinStore] Failed to import:', error)
    throw error
  }
}
