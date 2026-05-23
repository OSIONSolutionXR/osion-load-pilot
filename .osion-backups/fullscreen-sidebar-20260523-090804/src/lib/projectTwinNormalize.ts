/**
 * Project Twin Normalization / Migration
 *
 * Konvertiert alte StoredProjectTwin (V1) zu StoredProjectTwinV2
 * Stellt sicher, dass alle neuen Felder mit sinnvollen Defaults gefüllt sind
 */

import type {
  StoredProjectTwinV2,
  ProjectTwinUpdate,
  ProjectTwinChangedField
} from '../types/projectTwinV2'
import type { ProjectTwinAnalysis } from '../types/projectTwin'
import {
  createDefaultProgress,
  createDefaultMeta,
  generateContextQuestionsFromMissing
} from '../types/projectTwinV2'

// Legacy Typ für V1 Twins
type StoredProjectTwinV1 = {
  id: string
  createdAt: string
  updatedAt: string
  sourceInput: string
  analysis: ProjectTwinAnalysis
  updates?: ProjectTwinUpdate[]
  // Keine schemaVersion oder andere V2 Felder
}

/**
 * Prüft, ob ein Objekt ein V2 Twin ist
 */
function isV2Twin(twin: unknown): twin is StoredProjectTwinV2 {
  return (
    typeof twin === 'object' &&
    twin !== null &&
    'schemaVersion' in twin &&
    (twin as StoredProjectTwinV2).schemaVersion === 2
  )
}

/**
 * Migriert ein einzelnes V1-Update zu V2-Format
 */
function migrateUpdateV1ToV2(update: unknown): ProjectTwinUpdate {
  // Altes Format: { timestamp, input, summary, changedFields: ChangedField[] }
  const oldUpdate = update as {
    timestamp?: string
    input?: string
    summary?: string
    changedFields?: ProjectTwinChangedField[]
  }

  return {
    id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: oldUpdate.timestamp || new Date().toISOString(),
    input: oldUpdate.input || '',
    summary: oldUpdate.summary || 'Update aus früherer Version migriert',
    source: 'manual_update', // Alte Updates als manual_update kategorisieren
    changedFields: oldUpdate.changedFields || [],
    previousProgressPercent: undefined,
    newProgressPercent: undefined,
    previousNextMoveTitle: undefined,
    newNextMoveTitle: undefined
  }
}

/**
 * Migriert V1-Updates-Array zu V2-Format
 */
function migrateUpdatesV1ToV2(updates: unknown[]): ProjectTwinUpdate[] {
  if (!Array.isArray(updates)) return []

  return updates.map(migrateUpdateV1ToV2)
}

/**
 * Normalisiert einen beliebigen Twin zu V2
 * - V2 Twins: Validieren und ggf. fehlende Felder ergänzen
 * - V1 Twins: Vollständige Migration
 */
export function normalizeStoredProjectTwin(raw: unknown): StoredProjectTwinV2 {
  // Bereits V2? Dann nur noch fehlende Felder ergänzen
  if (isV2Twin(raw)) {
    return normalizeV2Twin(raw)
  }

  // V1 Migration
  return migrateV1ToV2(raw as StoredProjectTwinV1)
}

/**
 * Normalisiert einen V2 Twin (füllt fehlende Felder)
 */
function normalizeV2Twin(twin: Partial<StoredProjectTwinV2>): StoredProjectTwinV2 {
  const now = new Date().toISOString()

  // Core Identity (required)
  const id = twin.id || `twin-${now}-${Math.random().toString(36).slice(2, 8)}`
  const createdAt = twin.createdAt || now
  const updatedAt = twin.updatedAt || now

  // Titel und Beschreibung
  const title = twin.title || twin.analysis?.project?.title || 'Unbenanntes Projekt'
  const description = twin.description || twin.analysis?.project?.description

  // Input History
  const originalInput = twin.originalInput || (twin as { sourceInput?: string }).sourceInput || ''
  const latestInput = twin.latestInput || originalInput

  // Analysis (required - muss vorhanden sein)
  if (!twin.analysis) {
    throw new Error('StoredProjectTwinV2 requires analysis')
  }

  // Neue Arrays (mit Fallback auf V1-Updates)
  const contextQuestions = twin.contextQuestions || 
    generateContextQuestionsFromMissing(
      twin.analysis.quality.missingContext || []
    )

  const updates = twin.updates || []

  const generatedSolutions = twin.generatedSolutions || []
  const chatHistory = twin.chatHistory || []

  // Progress
  const progress = twin.progress || createDefaultProgress(twin.analysis)

  // Meta
  const meta = twin.meta || createDefaultMeta(twin.analysis)

  return {
    id,
    schemaVersion: 2,
    title,
    description,
    createdAt,
    updatedAt,
    originalInput,
    latestInput,
    analysis: twin.analysis,
    contextQuestions,
    updates,
    progress,
    generatedSolutions,
    chatHistory,
    futureSimulation: twin.futureSimulation,
    meta: {
      ...meta,
      source: meta.source || 'analysis',
      localOnly: meta.localOnly ?? true
    }
  }
}

/**
 * Migriert V1 Twin zu V2
 */
function migrateV1ToV2(v1: StoredProjectTwinV1): StoredProjectTwinV2 {
  const now = new Date().toISOString()

  // Titel aus Analyse extrahieren
  const title = v1.analysis?.project?.title || 'Migriertes Projekt'
  const description = v1.analysis?.project?.description

  // Input History
  const originalInput = v1.sourceInput || ''

  // Migration von Updates
  const updates = migrateUpdatesV1ToV2(v1.updates || [])

  // Progress aus Analyse ableiten
  const progress = createDefaultProgress(v1.analysis)

  // Meta aus Analyse ableiten
  const meta = createDefaultMeta(v1.analysis)

  // Kontextfragen aus missingContext generieren
  const contextQuestions = generateContextQuestionsFromMissing(
    v1.analysis?.quality?.missingContext || []
  )

  return {
    id: v1.id || `twin-${now}-${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: 2,
    title,
    description,
    createdAt: v1.createdAt || now,
    updatedAt: v1.updatedAt || now,
    originalInput,
    latestInput: originalInput,
    analysis: v1.analysis,
    contextQuestions,
    updates,
    progress,
    generatedSolutions: [],
    chatHistory: [],
    futureSimulation: undefined,
    meta
  }
}

/**
 * Normalisiert alle Twins aus localStorage
 * Diese Funktion sollte beim App-Start aufgerufen werden
 */
export function normalizeAllStoredTwins(rawTwins: unknown[]): StoredProjectTwinV2[] {
  if (!Array.isArray(rawTwins)) {
    console.warn('[ProjectTwinNormalize] Expected array, got:', typeof rawTwins)
    return []
  }

  const normalized = rawTwins
    .map((twin, index) => {
      try {
        return normalizeStoredProjectTwin(twin)
      } catch (error) {
        console.error(`[ProjectTwinNormalize] Failed to normalize twin at index ${index}:`, error)
        return null
      }
    })
    .filter((twin): twin is StoredProjectTwinV2 => twin !== null)

  console.log(`[ProjectTwinNormalize] Normalized ${normalized.length}/${rawTwins.length} twins`)

  return normalized
}

/**
 * Prüft, ob ein Twin migriert werden muss
 */
export function needsMigration(twin: unknown): boolean {
  if (!twin || typeof twin !== 'object') return false

  // Keine schemaVersion = V1, muss migriert werden
  if (!('schemaVersion' in twin)) return true

  // schemaVersion vorhanden aber nicht 2
  const sv = (twin as { schemaVersion?: number }).schemaVersion
  return sv !== 2
}

/**
 * Zählt, wie viele Twins Migration benötigen
 */
export function countTwinsNeedingMigration(rawTwins: unknown[]): number {
  if (!Array.isArray(rawTwins)) return 0
  return rawTwins.filter(needsMigration).length
}
