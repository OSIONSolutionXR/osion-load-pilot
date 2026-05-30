/**
 * Project Twin Normalization / Migration
 *
 * Konvertiert alte StoredProjectTwin (V1) zu StoredProjectTwinV2
 * Stellt sicher, dass alle neuen Felder mit sinnvollen Defaults gefüllt sind
 * Phase 1 Fix: Schema-Normalisierung mit Titel-Extraktion und dynamischer Output-Tiefe
 */

import type {
  ProjectTwinAnalysis,
  ProjectRisk,
} from '../types/projectTwin'
import type {
  StoredProjectTwinV2,
  ProjectTwinUpdate,
  ProjectTwinChangedField,
  ProcessStep,
  ProjectContextQuestion,
} from '../types/projectTwinV2'
import { extractMeasuresFromTwin } from './measuresNormalize'
import {
  createDefaultProgress,
  createDefaultMeta,
  generateContextQuestionsFromMissing,
} from '../types/projectTwinV2'
import {
  extractProjectTitle,
  normalizeTitle,
  normalizeDescription,
  extractRisks,
  extractQuestions,
  extractProcessSteps,
  detectComplexity,
} from './schemaNormalize'

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
    newNextMoveTitle: undefined,
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
 * Extrahiert und normalisiert Risiken aus verschiedenen Quellen
 */
function normalizeRisks(
  analysis: ProjectTwinAnalysis,
  rawTwin: Record<string, unknown>
): ProjectRisk[] {
  // Zuerst aus analysis.risks
  const analysisRisks = Array.isArray(analysis.risks) ? analysis.risks : []

  // Dann aus anderen Pfaden (für Schema-Mismatch)
  const extractedRisks = extractRisks(rawTwin)

  // Kombinieren ohne Duplikate (basierend auf Titel)
  const allRisks = [...analysisRisks]
  const existingTitles = new Set(analysisRisks.map((r) => r.title?.toLowerCase()))

  for (const risk of extractedRisks) {
    const raw = risk as Record<string, unknown>
    const title =
      (raw.title as string) ||
      (raw.name as string) ||
      (raw.label as string) ||
      'Unbekanntes Risiko'

    if (!existingTitles.has(title.toLowerCase())) {
      allRisks.push({
        title: normalizeTitle(title, 90),
        severity: (raw.severity as ProjectRisk['severity']) || 'medium',
        explanation: normalizeDescription(
          (raw.explanation as string) ||
            (raw.description as string) ||
            (raw.reason as string) ||
            '',
          320
        ),
      })
      existingTitles.add(title.toLowerCase())
    }
  }

  return allRisks
}

/**
 * Normalisiert einen V2 Twin (füllt fehlende Felder)
 * Phase 1 Fix: Intelligente Titel-Extraktion, robuste Risiken/Blocker/Fragen/Optionen
 */
function normalizeV2Twin(twin: Partial<StoredProjectTwinV2>): StoredProjectTwinV2 {
  const now = new Date().toISOString()

  // Core Identity (required)
  const id = twin.id || `twin-${now}-${Math.random().toString(36).slice(2, 8)}`
  const createdAt = twin.createdAt || now
  const updatedAt = twin.updatedAt || now

  // Analysis (required - muss vorhanden sein)
  if (!twin.analysis) {
    throw new Error('StoredProjectTwinV2 requires analysis')
  }

  const analysis = twin.analysis

  // Phase 1 Fix: Intelligente Titel-Extraktion
  // Extrahiere Titel aus originalInput falls "Projekt namens" Muster
  const rawTwin = twin as Record<string, unknown>
  const extractedTitle = extractProjectTitle(twin.originalInput || '')

  // Titel mit Priorität: extrahiert > analysis > twin > Fallback
  const title =
    extractedTitle ||
    normalizeTitle(
      twin.title ||
        analysis.project?.title ||
        (twin.originalInput
          ? twin.originalInput.replace(/^(Ich\s+möchte|Ich\s+will)\s*/i, '').split('.')[0]
          : ''),
      60
    ) ||
    'Unbenanntes Projekt'

  const description = normalizeDescription(
    twin.description || analysis.project?.description || '',
    700
  )

  // Input History
  const originalInput = twin.originalInput || ''
  const latestInput = twin.latestInput || originalInput

  // Phase 1 Fix: Robuste Extraktion von Arrays
  const processStepsRaw = extractProcessSteps(rawTwin)
  const processSteps: ProcessStep[] =
    twin.processSteps ||
    (processStepsRaw.length > 0
      ? processStepsRaw.map((step, index) => {
          const raw = step as Record<string, unknown>
          return {
            id: String(raw.id || `step-${index}`),
            title: normalizeTitle(
              (raw.title as string) || (raw.name as string) || (raw.label as string) || `Schritt ${index + 1}`,
              64
            ),
            description: normalizeDescription(
              (raw.description as string) || (raw.summary as string) || '',
              300
            ),
            status: (raw.status as ProcessStep['status']) || 'pending',
            order: Number(raw.order) || index + 1,
            dependsOn: Array.isArray(raw.dependsOn)
              ? raw.dependsOn.map(String)
              : [],
            blockerReason: String(raw.blockerReason || raw.blocker || ''),
            linkedMeasureIds: Array.isArray(raw.linkedMeasureIds)
              ? raw.linkedMeasureIds.map(String)
              : [],
            updatedAt: String(raw.updatedAt || now),
          }
        })
      : // Fallback: aus dependencies ableiten
        analysis.dependencies?.map((dep, index) => ({
          id: `dep-${index}`,
          title: normalizeTitle(dep.from, 64),
          description: normalizeDescription(dep.explanation, 300),
          status: dep.isBlocker
            ? 'blocked'
            : dep.status === 'done'
              ? 'done'
              : dep.status === 'required'
                ? 'next'
                : 'pending',
          order: index + 1,
          dependsOn: [],
          blockerReason: dep.isBlocker ? dep.explanation : '',
          linkedMeasureIds: [],
          updatedAt: updatedAt,
        })) ||
        [])

  // Phase 1 Fix: Risiken, Blocker, Fragen, Optionen normalisieren
  // Diese werden aktuell aus den Twin-Daten extrahiert und stehen für zukünftige Features bereit
  const risks = normalizeRisks(analysis, rawTwin)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _questions = extractQuestions(rawTwin) 
  
  // Hinweis: Blocker und Options werden extrahiert, aber aktuell nicht direkt verwendet
  // Sie können bei Bedarf hier verarbeitet werden:
  // const blockers = normalizeBlockers(analysis, rawTwin)
  // const options = extractOptions(rawTwin)

  // Kontextfragen (kombiniert aus missingContext und extrahierten Fragen)
  const contextQuestionsFromMissing = generateContextQuestionsFromMissing(
    analysis.quality?.missingContext || []
  )

  // Extrahierte Fragen zu ContextQuestions konvertieren
  const contextQuestionsFromExtracted: ProjectContextQuestion[] = _questions.map(
    (q, index) => {
      const raw = q as Record<string, unknown>
      return {
        id: String(raw.id || `ctxq-${now}-${index}`),
        label: normalizeTitle(
          (raw.label as string) || (raw.title as string) || 'Kontextfrage',
          60
        ),
        question: normalizeTitle(
          (raw.question as string) ||
            (raw.text as string) ||
            (raw.label as string) ||
            'Zusätzliche Information benötigt',
          180
        ),
        helperText: normalizeDescription((raw.helperText as string) || '', 200),
        reason: normalizeDescription(
          (raw.reason as string) ||
            (raw.explanation as string) ||
            'Für eine vollständige Analyse benötigt',
          200
        ),
        sourceMissingContext: String(raw.sourceMissingContext || 'extracted'),
        suggestedInputType:
          (raw.suggestedInputType as ProjectContextQuestion['suggestedInputType']) ||
          'text',
        priority:
          (raw.priority as ProjectContextQuestion['priority']) ||
          (index < 3 ? 'high' : index < 5 ? 'medium' : 'low'),
        options: Array.isArray(raw.options) ? raw.options.map(String) : undefined,
        status: (raw.status as ProjectContextQuestion['status']) || 'open',
      }
    }
  )

  // Kombiniere ohne Duplikate
  const existingQuestionLabels = new Set(
    contextQuestionsFromMissing.map((q) => q.label.toLowerCase())
  )
  const combinedContextQuestions = [
    ...contextQuestionsFromMissing,
    ...contextQuestionsFromExtracted.filter(
      (q) => !existingQuestionLabels.has(q.label.toLowerCase())
    ),
  ]

  const contextQuestions = twin.contextQuestions || combinedContextQuestions
  const updates = twin.updates || []
  const generatedSolutions = twin.generatedSolutions || []
  const chatHistory = twin.chatHistory || []

  // Progress
  const progress = twin.progress || createDefaultProgress(analysis)

  // Meta
  const meta = twin.meta || createDefaultMeta(analysis)

  // Phase 1 Fix: Komplexitätserkennung
  const complexity = detectComplexity(originalInput, {
    moduleCount: processSteps.length,
    openQuestions: contextQuestions.filter((q) => q.status === 'open').length,
    stakeholderCount: analysis.actors?.length || 0,
    hasInfrastructure: /infrastruktur|versorgung|system/i.test(originalInput),
    hasCrisis: /katastrophe|krise|notfall|überschwemmung|hochwasser/i.test(originalInput),
    hasMultiLocation: /multi|region|standort|kommunen/i.test(originalInput),
  })

  // Measures normalisieren
  const measures = twin.measures ||
    extractMeasuresFromTwin({
      id,
      schemaVersion: 2,
      title,
      description,
      createdAt,
      updatedAt,
      originalInput,
      latestInput,
      analysis: {
        ...analysis,
        // Überschreibe mit normalisierten Arrays
        risks,
        project: {
          ...analysis.project,
          title,
          description,
        },
      },
      processSteps,
      contextQuestions,
      updates,
      progress,
      generatedSolutions,
      chatHistory,
      futureSimulation: twin.futureSimulation,
      attentionQueue: twin.attentionQueue || [],
      measures: [],
      activityLog: [],
      meta: {
        ...meta,
        source: meta.source || 'analysis',
        localOnly: meta.localOnly ?? true,
      },
    } as StoredProjectTwinV2)

  // Simulations normalisieren
  const simulations = twin.simulations || {
    scenarios: [],
    results: [],
  }

  // Activity Log (neu in V2, Migration)
  const activityLog = twin.activityLog || []

  return {
    id,
    schemaVersion: 2,
    title,
    description,
    createdAt,
    updatedAt,
    originalInput,
    latestInput,
    analysis: {
      ...analysis,
      project: {
        ...analysis.project,
        title,
        description,
      },
      risks,
    },
    processSteps,
    contextQuestions,
    updates,
    progress,
    generatedSolutions,
    chatHistory,
    futureSimulation: twin.futureSimulation,
    attentionQueue: twin.attentionQueue || [],
    measures,
    simulations,
    activityLog,
    meta: {
      ...meta,
      source: meta.source || 'analysis',
      localOnly: meta.localOnly ?? true,
      // Phase 1 Fix: Speichere Komplexität
      promptVersion: `${meta.promptVersion || 'unknown'}_complexity:${complexity}`,
    },
  }
}

/**
 * Migriert V1 Twin zu V2
 */
function migrateV1ToV2(v1: StoredProjectTwinV1): StoredProjectTwinV2 {
  const now = new Date().toISOString()

  // Phase 1 Fix: Intelligente Titel-Extraktion
  const extractedTitle = extractProjectTitle(v1.sourceInput || '')

  // Titel mit Priorität: extrahiert > analysis > Fallback
  const title =
    extractedTitle ||
    normalizeTitle(
      v1.analysis?.project?.title ||
        v1.sourceInput?.replace(/^(Ich\s+möchte|Ich\s+will)\s*/i, '').split('.')[0],
      60
    ) ||
    'Migriertes Projekt'

  const description = normalizeDescription(v1.analysis?.project?.description || '', 700)

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

  // ProcessSteps aus dependencies ableiten für V1 Migration
  const processSteps: ProcessStep[] =
    v1.analysis?.dependencies?.map((dep, index) => ({
      id: `dep-${index}`,
      title: normalizeTitle(dep.from, 64),
      description: normalizeDescription(dep.explanation, 300),
      status: dep.isBlocker
        ? 'blocked'
        : dep.status === 'done'
          ? 'done'
          : dep.status === 'required'
            ? 'next'
            : 'pending',
      order: index + 1,
      dependsOn: [],
      blockerReason: dep.isBlocker ? dep.explanation : '',
      linkedMeasureIds: [],
      updatedAt: v1.updatedAt || now,
    })) || []

  // Phase 1 Fix: Risiken normalisieren
  const rawV1 = v1 as unknown as Record<string, unknown>
  const risks = normalizeRisks(v1.analysis, rawV1)

  // Measures aus V1 Analyse ableiten
  const measures: import('../types/measures').Measure[] = extractMeasuresFromTwin({
    id: v1.id || `twin-${now}-${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: 2,
    title,
    description,
    createdAt: v1.createdAt || now,
    updatedAt: v1.updatedAt || now,
    originalInput,
    latestInput: originalInput,
    analysis: {
      ...v1.analysis,
      project: {
        ...v1.analysis.project,
        title,
        description,
      },
      risks,
    },
    processSteps,
    contextQuestions,
    updates,
    progress,
    generatedSolutions: [],
    chatHistory: [],
    futureSimulation: undefined,
    attentionQueue: [],
    measures: [],
    activityLog: [],
    meta,
  } as unknown as StoredProjectTwinV2)

  return {
    id: v1.id || `twin-${now}-${Math.random().toString(36).slice(2, 8)}`,
    schemaVersion: 2,
    title,
    description,
    createdAt: v1.createdAt || now,
    updatedAt: v1.updatedAt || now,
    originalInput,
    latestInput: originalInput,
    analysis: {
      ...v1.analysis,
      project: {
        ...v1.analysis.project,
        title,
        description,
      },
      risks,
    },
    processSteps,
    contextQuestions,
    updates,
    progress,
    generatedSolutions: [],
    chatHistory: [],
    futureSimulation: undefined,
    attentionQueue: [],
    measures,
    simulations: { scenarios: [], results: [] },
    activityLog: [],
    meta,
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
