import type { ProjectTwinAnalysis } from '../types/projectTwin'

export interface TwinUpdatePayload {
  existingTwin: ProjectTwinAnalysis
  additionalInput: string
  originalInput: string
  updateMode: 'refine_existing_twin'
}

export interface TwinUpdateResponse {
  analysis: ProjectTwinAnalysis
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

export async function updateProjectTwin(payload: TwinUpdatePayload): Promise<TwinUpdateResponse> {
  const { existingTwin, additionalInput, originalInput } = payload

  if (!additionalInput.trim()) {
    throw new TwinUpdateError('Bitte gib zusätzliche Informationen ein.')
  }

  const response = await fetch('/api/update-project-twin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      existingTwin,
      additionalInput: additionalInput.trim(),
      originalInput,
      updateMode: 'refine_existing_twin'
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
