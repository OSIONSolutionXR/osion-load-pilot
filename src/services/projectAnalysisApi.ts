import type { ProjectTwinAnalysis } from '../types/projectTwin'

export class ProjectAnalysisError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProjectAnalysisError'
    this.status = status
  }
}

export async function analyzeProjectInput(input: string): Promise<ProjectTwinAnalysis> {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new ProjectAnalysisError('Bitte gib zuerst eine Projektlage ein.')
  }

  const response = await fetch('/api/analyze-project', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: trimmed })
  })

  let payload: unknown
  try {
    payload = await response.json()
  } catch {
    throw new ProjectAnalysisError('Die Analyse-Antwort konnte nicht gelesen werden.', response.status)
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Die Analyse konnte nicht durchgeführt werden.'

    throw new ProjectAnalysisError(message, response.status)
  }

  return payload as ProjectTwinAnalysis
}
