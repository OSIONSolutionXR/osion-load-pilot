import type { ProjectTwinAnalysis } from '../types/projectTwin'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { logTwinUpdated, logProgressUpdated } from './activityLogService'

/**
 * Normalisiert verschiedene Update-Response-Formate von der Bridge
 * in ein einheitliches Format für den Frontend-Store.
 *
 * Unterstützte Formate:
 * Format A: { updatedTwin: {...} } → direkt übernehmen
 * Format B: { analysis: {...}, updateSummary, newProgress, ... } → aus API-Route
 * Format C: { result: { project, nextMove, ... }, meta: {...} } → aus Bridge direkt
 * Format D: { result: { analysis: {...} }, ... } → verschachtelt
 */

export interface NormalizedUpdateResult {
  analysis: ProjectTwinAnalysis
  updateSummary: string
  newProgress: {
    percent: number
    level: number
    stage: string
  }
  changedFields: Array<{
    field: string
    before?: string
    after?: string
  }>
}

export interface BridgeUpdateResponse {
  result?: {
    project?: unknown
    nextMove?: unknown
    actors?: unknown[]
    dependencies?: unknown[]
    risks?: unknown[]
    scenarios?: unknown[]
    actions?: unknown[]
    quality?: unknown
    progress?: unknown
    latestInput?: string
    updates?: unknown[]
    meta?: unknown
  }
  meta?: {
    source?: string
    mode?: string
    jobType?: string
  }
  updatedTwin?: { analysis?: ProjectTwinAnalysis }
  analysis?: ProjectTwinAnalysis
  updateSummary?: string
  newProgress?: {
    percent: number
    level: number
    stage: string
  }
  progress?: {
    percent: number
    level: number
    stage: string
  }
  changedFields?: Array<{
    field: string
    before?: string
    after?: string
  }>
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isProjectTwinAnalysis(value: unknown): value is ProjectTwinAnalysis {
  if (!isPlainObject(value)) return false
  const { project, nextMove, quality } = value
  return (
    isPlainObject(project) &&
    isPlainObject(nextMove) &&
    isPlainObject(quality) &&
    typeof project.title === 'string' &&
    typeof nextMove.title === 'string'
  )
}

function isStoredProjectTwin(value: unknown): value is StoredProjectTwin {
  if (!isPlainObject(value)) return false
  const { analysis } = value
  return isPlainObject(analysis) && isProjectTwinAnalysis(analysis)
}

/**
 * Extrahiert die Analysis aus verschiedenen Response-Formaten
 */
function extractAnalysis(response: BridgeUpdateResponse): ProjectTwinAnalysis | null {
  // Format A: response.updatedTwin ist ein vollständiger StoredProjectTwin
  if (response.updatedTwin && isStoredProjectTwin(response.updatedTwin)) {
    return response.updatedTwin.analysis
  }

  // Format B: direkte analysis
  if (response.analysis && isProjectTwinAnalysis(response.analysis)) {
    return response.analysis
  }

  // Format C: updatedTwin.analysis (altes Format)
  if (response.updatedTwin?.analysis && isProjectTwinAnalysis(response.updatedTwin.analysis)) {
    return response.updatedTwin.analysis
  }

  // Format D: result enthält die Felder direkt
  if (response.result) {
    const result = response.result
    // Wenn result.project/nextMove/quality hat, ist es eine komplette Analysis
    if (result.project && result.nextMove && result.quality) {
      return result as unknown as ProjectTwinAnalysis
    }
  }

  return null
}

/**
 * Extrahiert Progress aus verschiedenen Response-Formaten
 */
function extractProgress(
  response: BridgeUpdateResponse,
  existingTwin: { progress: { percent: number; level: number; stage: string } }
): { percent: number; level: number; stage: string } {
  // Direkte newProgress
  if (response.newProgress) {
    return response.newProgress
  }

  // Alternative: progress
  if (response.progress) {
    return response.progress
  }

  // Aus result.progress
  if (response.result?.progress && isPlainObject(response.result.progress)) {
    const rp = response.result.progress as { percent?: number; level?: number; stage?: string }
    return {
      percent: rp.percent ?? existingTwin.progress.percent,
      level: rp.level ?? existingTwin.progress.level,
      stage: (rp.stage as string) ?? existingTwin.progress.stage
    }
  }

  // Fallback: aus quality.confidence ableiten
  const quality = extractAnalysis(response)?.quality
  if (quality?.confidence) {
    const confidenceMap: Record<string, { percent: number; level: number }> = {
      high: { percent: 85, level: 3 },
      medium: { percent: 60, level: 2 },
      low: { percent: 35, level: 1 }
    }
    const mapped = confidenceMap[quality.confidence] || { percent: 50, level: 2 }
    return {
      percent: mapped.percent,
      level: mapped.level,
      stage: quality.missingContext?.length === 0 ? 'clarified' : 'needs_context'
    }
  }

  return existingTwin.progress
}

/**
 * Extrahiert Update-Summary
 */
function extractSummary(response: BridgeUpdateResponse): string {
  if (response.updateSummary) return response.updateSummary
  if (response.result?.latestInput) return `Project Twin aktualisiert: ${response.result.latestInput}`
  return 'Project Twin mit neuem Kontext aktualisiert.'
}

/**
 * Extrahiert Changed Fields
 */
function extractChangedFields(
  response: BridgeUpdateResponse
): Array<{ field: string; before?: string; after?: string }> {
  if (response.changedFields && Array.isArray(response.changedFields)) {
    return response.changedFields
  }
  return []
}

/**
 * Hauptfunktion: Normalisiert beliebige Bridge-Response
 */
export function normalizeProjectTwinUpdateResponse(
  response: unknown,
  _existingTwin: StoredProjectTwin,
  _additionalInput: string
): NormalizedUpdateResult | null {
  console.log('[Normalizer] Input response type:', typeof response)

  if (!isPlainObject(response)) {
    console.error('[Normalizer] Response is not an object')
    return null
  }

  const bridgeResponse = response as BridgeUpdateResponse

  // Logging ohne Secrets
  console.log('[Normalizer] Response keys:', Object.keys(bridgeResponse))
  if (bridgeResponse.result) {
    console.log('[Normalizer] result keys:', Object.keys(bridgeResponse.result))
  }

  // Analysis extrahieren
  const analysis = extractAnalysis(bridgeResponse)
  if (!analysis) {
    console.error('[Normalizer] Could not extract analysis from response')
    console.log('[Normalizer] Tried paths: response.analysis, response.updatedTwin.analysis, response.result')
    return null
  }

  console.log('[Normalizer] Extracted analysis:', {
    projectTitle: analysis.project?.title,
    hasNextMove: !!analysis.nextMove,
    confidence: analysis.quality?.confidence
  })

  // Progress extrahieren
  const newProgress = extractProgress(bridgeResponse, _existingTwin)

  // Summary extrahieren
  const updateSummary = extractSummary(bridgeResponse)

  // Changed fields extrahieren
  const changedFields = extractChangedFields(bridgeResponse)

  return {
    analysis,
    updateSummary,
    newProgress,
    changedFields
  }
}

/**
 * Baut einen aktualisierten StoredProjectTwin aus dem Normalized Result
 */
export function buildUpdatedTwinFromResult(
  normalized: NormalizedUpdateResult,
  existingTwin: StoredProjectTwin,
  additionalInput: string
): StoredProjectTwin {
  const now = new Date().toISOString()

  // Update-Entry für History
  const updateEntry = {
    id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    input: additionalInput.trim(),
    summary: normalized.updateSummary,
    source: 'manual_update' as const,
    changedFields: normalized.changedFields.map(f => ({
      field: f.field,
      before: f.before ?? 'vorher',
      after: f.after ?? 'nachher'
    })),
    previousProgressPercent: existingTwin.progress.percent,
    newProgressPercent: normalized.newProgress.percent,
    previousNextMoveTitle: existingTwin.analysis.nextMove.title,
    newNextMoveTitle: normalized.analysis.nextMove.title
  }

  // Deep merge: Neue Analysis übernimmt, aber IDs/Metadaten bleiben erhalten
  const updatedTwin = {
    ...existingTwin,
    updatedAt: now,
    latestInput: additionalInput.trim(),
    analysis: normalized.analysis,
    progress: {
      ...existingTwin.progress,
      percent: normalized.newProgress.percent,
      level: normalized.newProgress.level,
      stage: normalized.newProgress.stage as typeof existingTwin.progress.stage,
      updatedAt: now
    },
    updates: [...(existingTwin.updates || []), updateEntry],
    contextQuestions: [] // Nach Update sind Kontextfragen zurückgesetzt
  }

  // Logge den Update
  const twinWithLog = logTwinUpdated(updatedTwin, 'manual', normalized.updateSummary)

  // Logge Progress-Update falls sich etwas geändert hat
  if (existingTwin.progress.percent !== normalized.newProgress.percent) {
    return logProgressUpdated(
      twinWithLog,
      existingTwin.progress.percent,
      normalized.newProgress.percent,
      normalized.updateSummary
    )
  }

  return twinWithLog
}
