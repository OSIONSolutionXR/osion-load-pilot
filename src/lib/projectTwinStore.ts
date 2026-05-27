/**
 * Project Twin Store V2
 * 
 * Erweiterter Store mit Schema Version 2 Unterstützung
 * Automatische Migration von V1 zu V2 beim Laden
 */

import type { ProjectTwinAnalysis, ChangedField } from '../types/projectTwin'
import type { Measure } from '../types/measures'
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
import { extractMeasuresFromTwin } from './measuresNormalize'
import { rebuildAttentionQueueFromMeasures } from './attentionQueueStore'
import { 
  logProjectCreated,
  logContextAnswered,
  logMeasureAdded,
  logMeasureUpdated,
  logMeasureCompleted,
  logMeasureDeleted
  // logTwinUpdated, logProgressUpdated werden in projectTwinUpdateNormalizer verwendet
} from '../services/activityLogService'

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
    // 1. Versuche V2 zu laden
    const v2Data = window.localStorage.getItem(STORAGE_KEY)
    if (v2Data) {
      const parsed = JSON.parse(v2Data) as unknown[]
      if (Array.isArray(parsed)) {
        return normalizeAllStoredTwins(parsed)
      }
    }

    // 2. Fallback: V1 laden und migrieren
    const v1Data = window.localStorage.getItem(STORAGE_KEY_V1)
    if (v1Data) {
      const v1Twins = JSON.parse(v1Data) as Array<{
        id: string
        sourceInput: string
        analysis: ProjectTwinAnalysis
        createdAt: string
      }>
      if (Array.isArray(v1Twins)) {
        console.log(`[ProjectTwinStore] Migrating ${v1Twins.length} V1 twins to V2`)
        const migrated = v1Twins.map((v1) => migrateV1ToV2(v1))
        // Speichere als V2
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
        return migrated
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

  // Initialisiere measures aus Actions
  const measures: Measure[] = extractMeasuresFromTwin({
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

  const newTwin: StoredProjectTwinV2 = {
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
      localOnly: true,
      backendSynced: !!backendProjectId
    }
  }

  // Logge die Projekterstellung
  return logProjectCreated(newTwin, 'analysis')
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

  if (oldAnalysis.project.status !== newAnalysis.project.status) {
    changes.push({
      field: 'project.status',
      oldValue: oldAnalysis.project.status,
      newValue: newAnalysis.project.status
    })
  }

  return changes
}

// Helper: Generiere zusammenfassenden Update-Text
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
 * Regeneriert Measures aus aktualisierter Analyse, behält aber bestehende User-Daten bei
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

  // Merge measures: Neue aus Analyse + bestehende User-Daten beibehalten
  const newMeasures = extractMeasuresFromTwin({
    ...existingTwin,
    analysis: updatedAnalysis
  } as StoredProjectTwinV2)

  // Bestehende Measures mergen (User-Daten beibehalten)
  const mergedMeasures = mergeMeasures(existingTwin.measures || [], newMeasures)

  // Attention Queue neu berechnen
  const newAttentionQueue = rebuildAttentionQueueFromMeasures(
    mergedMeasures,
    newProgress,
    timestamp
  )

  // V2: Logge das Update
  const logEntry = {
    id: `log-${timestamp}`,
    timestamp,
    type: 'update' as const,
    summary,
    details: {
      changedFields: changedFields.map(c => `${c.field}: "${c.oldValue}" → "${c.newValue}"`),
      progressChange: `${existingTwin.progress.percent}% → ${newProgress.percent}%`,
      newMeasuresCount: newMeasures.length,
      inputLength: additionalInput.length
    }
  }

  return {
    ...existingTwin,
    analysis: updatedAnalysis,
    latestInput: additionalInput.trim(),
    updatedAt: timestamp,
    updates: [updateEntry, ...(existingTwin.updates || [])],
    progress: newProgress,
    measures: mergedMeasures,
    attentionQueue: newAttentionQueue,
    activityLog: [...existingTwin.activityLog, logEntry]
  }
}

/**
 * Vereint alte und neue Measures, behält User-Daten bei
 */
function mergeMeasures(existing: Measure[], generated: Measure[]): Measure[] {
  const merged: Measure[] = []
  const usedExisting = new Set<string>()

  // Versuche, generated measures mit existing zu matchen
  for (const gen of generated) {
    const match = existing.find(e => 
      e.title.toLowerCase() === gen.title.toLowerCase() ||
      (e.source === gen.source && e.source === 'twin_analysis')
    )
    
    if (match) {
      // Behalte bestehende User-Daten, aktualisiere aber Beschreibung/Impact
      merged.push({
        ...gen,
        id: match.id, // Behalte ID bei
        completed: match.completed, // Behalte Status bei
        dueDate: match.dueDate, // Behalte Due Date bei
        notes: match.notes, // Behalte Notizen bei
        updatedAt: new Date().toISOString()
      })
      usedExisting.add(match.id)
    } else {
      // Neue Measure
      merged.push(gen)
    }
  }

  // Füge nicht-gematchte bestehende Measures hinzu (z.B. manuell erstellte)
  for (const existingMeasure of existing) {
    if (!usedExisting.has(existingMeasure.id)) {
      merged.push(existingMeasure)
    }
  }

  return merged
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
    console.warn('[ProjectTwinStore] Twin not found for update:', updatedTwin.id)
    return twins
  }
  
  const newTwins = [...twins]
  newTwins[index] = updatedTwin
  return newTwins
}

/**
 * Fügt eine Maßnahme zu einem Twin hinzu
 */
export function addMeasureToTwin(
  twin: StoredProjectTwinV2,
  measure: Measure
): StoredProjectTwinV2 {
  return logMeasureAdded(twin, measure)
}

/**
 * Aktualisiert eine Maßnahme in einem Twin
 */
export function updateTwinMeasure(
  twin: StoredProjectTwinV2,
  measureId: string,
  updates: Partial<Measure>
): StoredProjectTwinV2 {
  const measure = twin.measures.find(m => m.id === measureId)
  if (!measure) {
    console.warn('[ProjectTwinStore] Measure not found:', measureId)
    return twin
  }

  const updatedMeasure = { ...measure, ...updates, updatedAt: new Date().toISOString() }
  const updatedMeasures = twin.measures.map(m => 
    m.id === measureId ? updatedMeasure : m
  )

  // Nur loggen wenn sich completed-Status ändert
  if (updates.completed !== undefined && updates.completed !== measure.completed) {
    if (updates.completed) {
      return logMeasureCompleted({ ...twin, measures: updatedMeasures }, updatedMeasure)
    }
  }

  return logMeasureUpdated({ ...twin, measures: updatedMeasures }, updatedMeasure)
}

// ============================================================================
// MIGRATION
// ============================================================================

/**
 * Migriert einen V1 Twin zu V2
 */
function migrateV1ToV2(v1: {
  id: string
  sourceInput: string
  analysis: ProjectTwinAnalysis
  createdAt: string
}): StoredProjectTwinV2 {
  const timestamp = v1.createdAt || new Date().toISOString()
  const progress = createDefaultProgress(v1.analysis)
  const meta = createDefaultMeta(v1.analysis)
  const contextQuestions = generateContextQuestionsFromMissing(
    v1.analysis.quality.missingContext || []
  )

  // Erstelle einen minimalen V2 Twin aus V1 Daten
  return {
    id: v1.id,
    schemaVersion: 2,
    title: v1.analysis.project.title || 'Migriertes Projekt',
    description: v1.analysis.project.description,
    createdAt: timestamp,
    updatedAt: timestamp,
    originalInput: v1.sourceInput,
    latestInput: v1.sourceInput,
    analysis: v1.analysis,
    processSteps: [],
    contextQuestions,
    updates: [],
    progress,
    generatedSolutions: [],
    chatHistory: [],
    futureSimulation: undefined,
    attentionQueue: [],
    measures: extractMeasuresFromTwin({
      id: v1.id,
      schemaVersion: 2,
      title: v1.analysis.project.title || 'Migriertes Projekt',
      description: v1.analysis.project.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      originalInput: v1.sourceInput,
      latestInput: v1.sourceInput,
      analysis: v1.analysis,
      processSteps: [],
      contextQuestions,
      updates: [],
      progress,
      generatedSolutions: [],
      chatHistory: [],
      futureSimulation: undefined,
      attentionQueue: [],
      measures: [],
      activityLog: [],
      meta: { ...meta, source: 'analysis', localOnly: true }
    } as StoredProjectTwinV2),
    activityLog: [{
      id: `mig-${timestamp}`,
      timestamp: new Date().toISOString(),
      type: 'system',
      summary: 'V1 → V2 Migration',
      details: { sourceVersion: 1, targetVersion: 2 }
    }],
    meta: { ...meta, source: 'analysis', localOnly: true }
  }
}

/**
 * Löscht alle gespeicherten Twins (für Debugging/Reset)
 */
export function clearStoredProjectTwins() {
  if (!canUseStorage()) {
    return
  }
  window.localStorage.removeItem(STORAGE_KEY)
  window.localStorage.removeItem(STORAGE_KEY_V1)
}

/**
 * Exportiert alle Twins als JSON (für Backup)
 */
export function exportTwinsToJSON(): string {
  const twins = loadStoredProjectTwins()
  return JSON.stringify(twins, null, 2)
}

/**
 * Importiert Twins aus JSON (für Restore)
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
    console.error('[ProjectTwinStore] Failed to import twins:', error)
    throw error
  }
}
