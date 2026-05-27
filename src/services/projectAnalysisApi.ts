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

/**
 * Analysiere Projekt-Input über externe Hostinger API
 * Verwendet explizit window.fetch für Browser-Kompatibilität
 */
export async function analyzeProjectInput(
  input: string,
  projectId?: string
): Promise<ProjectTwinAnalysis> {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new ProjectAnalysisError('Bitte gib zuerst eine Projektlage ein.')
  }

  const url = getAnalyzeUrl()
  console.log('[analyzeProjectInput] URL:', url)
  console.log('[analyzeProjectInput] ProjectId:', projectId || 'keine')

  const requestBody = {
    input: trimmed,
    ...(projectId && { projectId })
  }

  console.log('[analyzeProjectInput] Request body:', JSON.stringify(requestBody))

  try {
    // EXPLIZIT window.fetch verwenden (nicht importierter fetch)
    const response = await window.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('[analyzeProjectInput] Response status:', response.status)

    let payload: unknown
    try {
      payload = await response.json()
      console.log('[analyzeProjectInput] Response payload:', payload)
    } catch (parseError) {
      console.error('[analyzeProjectInput] JSON parse error:', parseError)
      throw new ProjectAnalysisError('Die Analyse-Antwort konnte nicht gelesen werden.', response.status)
    }

    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'error' in payload && typeof (payload as Record<string, unknown>).error === 'string'
          ? (payload as Record<string, string>).error
          : 'Die Analyse konnte nicht durchgeführt werden.'

      throw new ProjectAnalysisError(message, response.status)
    }

    // Phase 5: New API returns { ok, analysis, meta, projectId }
    const data = payload as { ok: boolean; analysis?: ProjectTwinAnalysis; error?: string; meta?: unknown }

    if (!data.ok || !data.analysis) {
      throw new ProjectAnalysisError(data.error || 'Analyse fehlgeschlagen', response.status)
    }

    console.log('[analyzeProjectInput] Success, returning analysis')
    return data.analysis

  } catch (error) {
    console.error('[analyzeProjectInput] Fetch error:', error)
    
    // Detaillierte Fehlermeldung
    if (error instanceof ProjectAnalysisError) {
      throw error
    }
    
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        throw new ProjectAnalysisError(`Netzwerkfehler: ${error.message}. Bitte prüfe deine Internetverbindung.`, 0)
      }
      throw new ProjectAnalysisError(`Fehler: ${error.message}`, 0)
    }
    
    throw new ProjectAnalysisError('Unbekannter Fehler bei der Analyse', 0)
  }
}
