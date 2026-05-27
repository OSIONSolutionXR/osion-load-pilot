import type { ProjectTwinAnalysis } from '../types/projectTwin'
import { getAnalyzeUrl } from '../lib/apiConfig'

export class ProjectAnalysisError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProjectAnalysisError'
    this.status = status
  }
}

export async function analyzeProjectInput(
  input: string,
  projectId?: string
): Promise<ProjectTwinAnalysis> {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new ProjectAnalysisError('Bitte gib zuerst eine Projektlage ein.')
  }

  const response = await fetch(getAnalyzeUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: trimmed,
      ...(projectId && { projectId })
    })
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

  // Phase 5: New API returns { ok, analysis, meta, projectId }
  const data = payload as { ok: boolean; analysis?: ProjectTwinAnalysis; error?: string }

  if (!data.ok || !data.analysis) {
    throw new ProjectAnalysisError(data.error || 'Analyse fehlgeschlagen', response.status)
  }

  return data.analysis
}
