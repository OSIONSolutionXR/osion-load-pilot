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

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TwinUpdateError'
    this.status = status
  }
}

function getTopLevelKeys(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []
  return Object.keys(value)
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getAnalysisCandidate(responseData: unknown): ProjectTwinAnalysis | null {
  if (isPlainObject(responseData) && isPlainObject(responseData.analysis)) return responseData.analysis as unknown as ProjectTwinAnalysis
  if (isPlainObject(responseData) && isPlainObject(responseData.updatedTwin) && isPlainObject(responseData.updatedTwin.analysis)) {
    return responseData.updatedTwin.analysis as unknown as ProjectTwinAnalysis
  }
  if (isPlainObject(responseData) && isPlainObject(responseData.result)) {
    const result = responseData.result as Record<string, unknown>
    if (isPlainObject(result.analysis)) return result.analysis as unknown as ProjectTwinAnalysis
    if (isPlainObject(result.updatedTwin) && isPlainObject(result.updatedTwin.analysis)) return result.updatedTwin.analysis as unknown as ProjectTwinAnalysis
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

  if (!additionalInput.trim()) {
    throw new TwinUpdateError('Bitte gib zusätzliche Informationen ein.')
  }

  const requestBody = {
    jobType: 'loadpilot_project_twin_update',
    promptVersion: 'loadpilot_v2',
    outputFormat: 'project_twin_json',
    updateMode: 'refine_existing_twin',
    existingTwin,
    additionalInput: additionalInput.trim(),
    originalInput,
    contextAnswers,
    previousUpdates,
    currentProgress
  }

  console.log('[TwinUpdate] submit', {
    jobType: requestBody.jobType,
    hasContextAnswers: Boolean(contextAnswers?.length),
    additionalInputLength: requestBody.additionalInput.length,
    previousUpdates: previousUpdates?.length ?? 0,
    currentProgress: currentProgress?.percent ?? null
  })

  const response = await fetch('/api/update-project-twin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  const responseData = await response.json().catch(() => null)
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
    throw new TwinUpdateError(message, response.status)
  }

  if (!validateUpdateResponse(responseData)) {
    console.log('[TwinUpdate] invalid response', {
      topLevelKeys: getTopLevelKeys(responseData),
      reason: 'missing analysis/updatedTwin/result wrapper'
    })
    throw new TwinUpdateError('Ungültige Update-Antwort von der API.')
  }

  return responseData as TwinUpdateResponse
}
