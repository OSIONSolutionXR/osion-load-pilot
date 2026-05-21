import type { ProjectTwinAnalysis } from '../types/projectTwin'
import type { ProjectContextQuestion } from '../types/projectTwinV2'

export interface ContextAnswer {
  questionId: string
  label: string
  answer: string
  sourceMissingContext: string
}

export interface TwinUpdatePayload {
  existingTwin: ProjectTwinAnalysis
  additionalInput: string
  originalInput: string
  updateMode: 'refine_existing_twin'
  contextAnswers?: ContextAnswer[]
  previousUpdates?: unknown[]
  currentProgress?: {
    percent: number
    level: number
    stage: string
  }
}

export interface TwinUpdateResponse {
  analysis?: ProjectTwinAnalysis
  updatedTwin?: unknown
  updateSummary?: string
  changedFields?: Array<{
    field: string
    before?: string
    after?: string
    reason?: string
  }>
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
  update?: unknown
  meta?: {
    updatedAt?: string
    updateType?: 'refinement'
    fieldsModified?: string[]
    mode?: string
    promptVersion?: string
    jobType?: string
  }
}

export class TwinUpdateError extends Error {
  status?: number
  errorType?: 'insufficient_input' | 'timeout' | 'invalid_response' | 'network' | 'unknown'

  constructor(message: string, status?: number, errorType?: TwinUpdateError['errorType']) {
    super(message)
    this.name = 'TwinUpdateError'
    this.status = status
    this.errorType = errorType || 'unknown'
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getTopLevelKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.keys(value)
}

function getAnalysisCandidate(responseData: unknown): ProjectTwinAnalysis | null {
  if (isPlainObject(responseData) && isPlainObject(responseData.analysis)) 
    return responseData.analysis as unknown as ProjectTwinAnalysis
  if (isPlainObject(responseData) && isPlainObject(responseData.updatedTwin) && isPlainObject(responseData.updatedTwin.analysis)) {
    return (responseData.updatedTwin as { analysis?: ProjectTwinAnalysis }).analysis || null
  }
  if (isPlainObject(responseData) && isPlainObject(responseData.result)) {
    const result = responseData.result as Record<string, unknown>
    if (isPlainObject(result.analysis)) return result.analysis as unknown as ProjectTwinAnalysis
    if (isPlainObject(result.updatedTwin) && isPlainObject(result.updatedTwin.analysis)) 
      return (result.updatedTwin as { analysis?: ProjectTwinAnalysis }).analysis || null
  }
  return null
}

function validateUpdateResponse(data: unknown): data is TwinUpdateResponse {
  if (!isPlainObject(data)) return false
  return Boolean(getAnalysisCandidate(data) || data.updatedTwin || data.analysis)
}

export function buildAdditionalInputFromAnswers(
  answers: Record<string, string>,
  questions: ProjectContextQuestion[]
): string {
  const parts: string[] = []
  for (const [questionId, answer] of Object.entries(answers)) {
    if (!answer.trim()) continue
    const question = questions.find((q) => q.id === questionId)
    if (question) parts.push(`${question.label.replace(/\?$/, '')}: ${answer.trim()}`)
  }
  return parts.join('. ')
}

export function buildContextAnswers(
  answers: Record<string, string>,
  questions: ProjectContextQuestion[]
): ContextAnswer[] {
  return Object.entries(answers)
    .filter(([, answer]) => answer.trim() !== '')
    .map(([questionId, answer]) => {
      const question = questions.find((q) => q.id === questionId)
      return {
        questionId,
        label: question?.label || questionId,
        answer: answer.trim(),
        sourceMissingContext: question?.sourceMissingContext || ''
      }
    })
}

export async function updateProjectTwin(payload: TwinUpdatePayload): Promise<TwinUpdateResponse> {
  const { existingTwin, additionalInput, originalInput, contextAnswers, previousUpdates, currentProgress } = payload

  // Defensive Validierung
  if (!existingTwin) {
    console.error('[TwinUpdate] Missing existingTwin in payload')
    throw new TwinUpdateError('Kein aktiver Project Twin gefunden.', 400, 'insufficient_input')
  }

  if (!additionalInput.trim()) {
    throw new TwinUpdateError('Bitte gib zusätzliche Informationen ein.', 400, 'insufficient_input')
  }

  // Fallback für originalInput
  const effectiveOriginalInput = originalInput?.trim() || 
    (existingTwin as unknown as { meta?: { sourceInput?: string } })?.meta?.sourceInput || 
    existingTwin.project?.description?.substring(0, 200) || 
    ''
  
  if (!effectiveOriginalInput) {
    console.warn('[TwinUpdate] No originalInput found, using empty string')
  }

  const requestBody = {
    jobType: 'loadpilot_project_twin_update',
    promptVersion: 'loadpilot_v2',
    outputFormat: 'project_twin_json',
    updateMode: 'refine_existing_twin',
    existingTwin,
    originalInput: effectiveOriginalInput,
    additionalInput: additionalInput.trim(),
    contextAnswers: contextAnswers || [],
    previousUpdates: previousUpdates || [],
    currentProgress: currentProgress || {
      percent: 50,
      level: 2,
      stage: 'in_progress'
    }
  }

  console.log('[TwinUpdate] submit', {
    source: contextAnswers?.length ? 'context_form' : 'modal',
    hasExistingTwin: !!existingTwin,
    existingTwinTitle: existingTwin.project?.title,
    hasOriginalInput: !!effectiveOriginalInput,
    originalInputPreview: effectiveOriginalInput?.substring(0, 50),
    additionalInputLength: requestBody.additionalInput.length,
    additionalInputPreview: requestBody.additionalInput.substring(0, 100),
    contextAnswersCount: contextAnswers?.length || 0,
    updateMode: requestBody.updateMode,
    payloadTopLevelKeys: Object.keys(requestBody)
  })

  let response: Response
  try {
    response = await fetch('/api/update-project-twin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
  } catch (networkError) {
    console.error('[TwinUpdate] network error:', networkError)
    throw new TwinUpdateError(
      'Netzwerkfehler beim Update. Bitte prüfe deine Verbindung und versuche es erneut.',
      0,
      'network'
    )
  }

  let responseData: unknown
  try {
    responseData = await response.json()
  } catch {
    console.error('[TwinUpdate] JSON parse error, status:', response.status)
    throw new TwinUpdateError('Die Update-Antwort konnte nicht gelesen werden.', response.status, 'invalid_response')
  }

  console.log('[TwinUpdate] response', {
    status: response.status,
    ok: response.ok,
    topLevelKeys: getTopLevelKeys(responseData)
  })

  if (!response.ok) {
    const message =
      isPlainObject(responseData) && typeof responseData.error === 'string'
        ? responseData.error
        : 'Das Update konnte nicht durchgeführt werden.'
    
    // Timeout erkennen
    if (message.toLowerCase().includes('timeout') || message.includes('zu lange')) {
      throw new TwinUpdateError(
        'Die Aktualisierung hat zu lange gedauert. Deine Eingaben wurden nicht gelöscht. Bitte versuche es mit weniger Text oder konkreteren Angaben erneut.',
        response.status,
        'timeout'
      )
    }
    
    // Insufficient Input erkennen
    if (message.toLowerCase().includes('insufficient') || message.includes('zu allgemein')) {
      throw new TwinUpdateError(
        'Diese Ergänzung ist noch zu allgemein. Ergänze bitte eine konkrete neue Information.',
        response.status,
        'insufficient_input'
      )
    }
    
    throw new TwinUpdateError(message, response.status, 'unknown')
  }

  if (!validateUpdateResponse(responseData)) {
    console.log('[TwinUpdate] invalid response', {
      topLevelKeys: getTopLevelKeys(responseData),
      reason: 'missing analysis/updatedTwin/result wrapper'
    })
    throw new TwinUpdateError(
      'Ungültige Update-Antwort von der API.',
      502,
      'invalid_response'
    )
  }

  return responseData as TwinUpdateResponse
}
