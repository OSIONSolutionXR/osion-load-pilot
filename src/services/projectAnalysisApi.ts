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
 * Response-Struktur vom Backend (Phase 5)
 */
export interface AnalyzeProjectResponse {
  ok: boolean
  projectId: string
  createdProject: boolean
  project?: {
    id: string
    name: string
    description?: string
    status: string
    created_at?: string
    updated_at?: string
  }
  analysis: ProjectTwinAnalysis
  meta?: {
    source?: string
    mode?: string
    elapsed?: number
  }
  processedAt?: string
}

/**
 * Analysiere Projekt-Input über externe Hostinger API
 * 
 * Phase 5: Backend erstellt automatisch neues Projekt wenn keine projectId
 * 
 * @param input - Der Projekt-Input vom Nutzer
 * @param existingProjectId - Optional: ID eines bestehenden Projekts (für Update)
 * @returns Vollständige Response mit projectId, analysis und createdProject-Flag
 */
export async function analyzeProjectInput(
  input: string,
  existingProjectId?: string
): Promise<AnalyzeProjectResponse> {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new ProjectAnalysisError('Bitte gib zuerst eine Projektlage ein.')
  }

  const url = getAnalyzeUrl()
  console.log('[analyzeProjectInput] URL:', url)
  console.log('[analyzeProjectInput] existingProjectId:', existingProjectId || 'keine (neues Projekt wird erstellt)')

  const requestBody: { input: string; projectId?: string } = {
    input: trimmed
  }

  // Nur projectId mitsenden wenn explizit vorhanden (Update-Modus)
  if (existingProjectId) {
    requestBody.projectId = existingProjectId
  }

  console.log('[analyzeProjectInput] Request body:', JSON.stringify(requestBody))

  try {
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

    // Phase 5: Neue Response-Struktur
    const data = payload as AnalyzeProjectResponse

    if (!data.ok || !data.analysis) {
      throw new ProjectAnalysisError('Analyse fehlgeschlagen', response.status)
    }

    // WICHTIG: projectId muss vorhanden sein
    if (!data.projectId) {
      console.error('[analyzeProjectInput] Backend returned no projectId:', data)
      throw new ProjectAnalysisError('Backend hat keine projectId zurückgegeben', response.status)
    }

    console.log('[analyzeProjectInput] Success:', {
      projectId: data.projectId,
      createdProject: data.createdProject,
      projectName: data.project?.name
    })

    return data

  } catch (error) {
    console.error('[analyzeProjectInput] Fetch error:', error)

    if (error instanceof ProjectAnalysisError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.message.includes('fetch') || error.message.includes('Network')) {
        throw new ProjectAnalysisError(`Netzwerkfehler: ${error.message}. Bitte prüfe deine Internetverbindung.`, 0)
      }
      throw new ProjectAnalysisError(`Fehler: ${error.message}`, 0)
    }

    throw new ProjectAnalysisError('Unbekannter Fehler bei der Analyse', 0)
  }
}
