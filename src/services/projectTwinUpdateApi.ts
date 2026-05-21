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
  analysis: ProjectTwinAnalysis
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
  meta: {
    updatedAt: string
    updateType: 'refinement'
    fieldsModified: string[]
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

/**
 * Baut additionalInput aus Kontext-Antworten zusammen
 */
export function buildAdditionalInputFromAnswers(
  answers: Record<string, string>,
  questions: ProjectContextQuestion[]
): string {
  const parts: string[] = []
  
  for (const [questionId, answer] of Object.entries(answers)) {
    if (!answer.trim()) continue
    
    const question = questions.find(q => q.id === questionId)
    if (question) {
      parts.push(`${question.label.replace(/\?$/, '')}: ${answer.trim()}`)
    }
  }
  
  return parts.join('. ')
}

/**
 * Konvertiert Record zu ContextAnswer[]
 */
export function buildContextAnswers(
  answers: Record<string, string>,
  questions: ProjectContextQuestion[]
): ContextAnswer[] {
  return Object.entries(answers)
    .filter(([, answer]) => answer.trim() !== '')
    .map(([questionId, answer]) => {
      const question = questions.find(q => q.id === questionId)
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

  const response = await fetch('/api/update-project-twin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
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
    })
  })

  let responseData: unknown
  try {
    responseData = await response.json()
  } catch {
    throw new TwinUpdateError('Die Update-Antwort konnte nicht gelesen werden.', response.status)
  }

  if (!response.ok) {
    const message =
      typeof responseData === 'object' &&
      responseData !== null &&
      'error' in responseData &&
      typeof responseData.error === 'string'
        ? responseData.error
        : 'Das Update konnte nicht durchgeführt werden.'

    throw new TwinUpdateError(message, response.status)
  }

  const data = responseData as TwinUpdateResponse

  if (!data.analysis || typeof data.analysis !== 'object') {
    throw new TwinUpdateError('Ungültiges Update-Ergebnis von der API.')
  }

  return data
}
