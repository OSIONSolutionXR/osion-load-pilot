import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

// Type definitions
interface ProjectTwinAnalysis {
  project: {
    title: string
    description: string
    status: 'active' | 'blocked' | 'waiting' | 'parked'
    type: string
  }
  nextMove: {
    title: string
    reason: string
    effort: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    deadline: string | null
  }
  actors: Array<{
    name: string
    role: string
    influence: 'low' | 'medium' | 'high'
    waitingFor: string | null
  }>
  dependencies: Array<{
    from: string
    to: string
    status: 'required' | 'blocked' | 'waiting' | 'done'
    isBlocker: boolean
    explanation: string
  }>
  risks: Array<{
    title: string
    severity: 'low' | 'medium' | 'high'
    explanation: string
  }>
  scenarios: Array<{
    title: string
    outcome: string
    riskLevel: 'low' | 'medium' | 'high'
    recommendation: string
  }>
  actions: Array<{
    title: string
    owner: string
    priority: 'low' | 'medium' | 'high'
    messageDraft?: string | null
  }>
  quality: {
    inputQuality: 'insufficient' | 'usable' | 'strong'
    isActionable: boolean
    confidence: 'low' | 'medium' | 'high'
    missingContext: string[]
    reason: string
  }
  meta: {
    domain: string
    analysisMode: 'openclaw-kimi'
    promptVersion: string
    generatedAt: string
  }
}

interface StoredProjectTwin {
  id: string
  schemaVersion: number
  title: string
  description: string
  createdAt: string
  updatedAt: string
  originalInput: string
  latestInput?: string
  analysis: ProjectTwinAnalysis
  contextQuestions?: unknown[]
  updates?: unknown[]
  progress?: {
    percent: number
    level: number
    stage: string
    updatedAt: string
  }
  generatedSolutions?: unknown[]
  chatHistory?: unknown[]
  meta?: Record<string, unknown>
}

interface ContextAnswer {
  questionId: string
  label: string
  answer: string
  sourceMissingContext: string
}

interface TwinUpdateRequest {
  existingTwin: StoredProjectTwin
  additionalInput: string
  originalInput: string
  updateMode: 'refine_existing_twin'
  contextAnswers?: ContextAnswer[]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    res.setHeader('Content-Type', 'application/json')

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
    }

    const body = req.body as Record<string, unknown> | undefined

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Ungültiger Request-Body.' })
    }

    const { existingTwin, additionalInput, originalInput, contextAnswers } = body as unknown as TwinUpdateRequest

    // Validierung
    if (!existingTwin || typeof existingTwin !== 'object') {
      return res.status(400).json({ error: 'existingTwin fehlt.' })
    }

    if (!additionalInput || typeof additionalInput !== 'string') {
      return res.status(400).json({ error: 'additionalInput fehlt.' })
    }

    if (additionalInput.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ error: `Input zu lang. Max ${MAX_INPUT_LENGTH} Zeichen.` })
    }

    const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
    const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

    if (!bridgeUrl || !bridgeSecret) {
      return res.status(500).json({ error: 'Bridge nicht konfiguriert.' })
    }

    // URL bauen: Extrahiere Base, hänge /bridge/update-project-twin an
    const baseUrl = bridgeUrl.replace(/\/bridge\/.*$/, '').replace(/\/+$/, '')
    const updateUrl = `${baseUrl}/bridge/update-project-twin`

    // Payload für Bridge
    const payload = {
      jobType: 'loadpilot_project_twin_update',
      promptVersion: 'loadpilot_v2',
      outputFormat: 'project_twin_json',
      updateMode: 'refine_existing_twin',
      existingTwin,
      additionalInput,
      originalInput: originalInput || '',
      contextAnswers: contextAnswers || []
    }

    // Fetch zur Bridge
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    let bridgeResponse: Response
    let bridgeJson: Record<string, unknown> | null = null

    try {
      bridgeResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bridgeSecret}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      const bodyText = await bridgeResponse.text()
      try {
        bridgeJson = JSON.parse(bodyText) as Record<string, unknown>
      } catch {
        bridgeJson = null
      }
    } catch (fetchError) {
      clearTimeout(timeout)
      return res.status(502).json({
        error: 'Bridge-Aufruf fehlgeschlagen.',
        message: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!bridgeResponse.ok) {
      return res.status(502).json({
        error: 'Bridge-Fehler.',
        status: bridgeResponse.status,
        bridgeError: bridgeJson?.error || 'Unknown'
      })
    }

    if (!bridgeJson) {
      return res.status(502).json({ error: 'Bridge gab kein gültiges JSON zurück.' })
    }

    // Extrahiere Analyse aus Bridge-Response
    const bridgeResult = bridgeJson.result || bridgeJson
    
    // Type guard für Analysis-Struktur
    const isValidAnalysis = (obj: unknown): obj is ProjectTwinAnalysis => {
      if (!obj || typeof obj !== 'object') return false
      const a = obj as Record<string, unknown>
      const hasProject = typeof a.project === 'object' && a.project !== null
      const hasNextMove = typeof a.nextMove === 'object' && a.nextMove !== null
      const hasQuality = typeof a.quality === 'object' && a.quality !== null
      const hasQualityIsActionable = typeof (a.quality as Record<string, unknown>)?.isActionable === 'boolean'
      return hasProject && hasNextMove && hasQuality && hasQualityIsActionable
    }
    
    const analysis = isValidAnalysis(bridgeResult) ? bridgeResult : null

    if (!analysis) {
      return res.status(502).json({
        error: 'Bridge-Response enthielt keine gültige Analyse.',
        bridgeKeys: Object.keys(bridgeJson)
      })
    }

    // WICHTIG: Baue vollständigen StoredProjectTwin
    // Merge: Behalte existingTwin bei, überschreibe mit neuen Werten
    const now = new Date().toISOString()
    
    const updatedTwin: StoredProjectTwin = {
      ...existingTwin,
      id: existingTwin.id || `twin-${Date.now()}`,
      schemaVersion: 2,
      title: analysis.project?.title || existingTwin.title || 'Unbenanntes Projekt',
      description: analysis.project?.description || existingTwin.description || '',
      createdAt: existingTwin.createdAt || now,
      updatedAt: now,
      originalInput: existingTwin.originalInput || originalInput || '',
      latestInput: additionalInput,
      analysis: {
        project: analysis.project || existingTwin.analysis?.project,
        nextMove: analysis.nextMove || existingTwin.analysis?.nextMove,
        actors: Array.isArray(analysis.actors) ? analysis.actors : (existingTwin.analysis?.actors || []),
        dependencies: Array.isArray(analysis.dependencies) ? analysis.dependencies : (existingTwin.analysis?.dependencies || []),
        risks: Array.isArray(analysis.risks) ? analysis.risks : (existingTwin.analysis?.risks || []),
        scenarios: Array.isArray(analysis.scenarios) ? analysis.scenarios : (existingTwin.analysis?.scenarios || []),
        actions: Array.isArray(analysis.actions) ? analysis.actions : (existingTwin.analysis?.actions || []),
        quality: analysis.quality || existingTwin.analysis?.quality,
        meta: {
          domain: (analysis.project as any)?.type || existingTwin.analysis?.meta?.domain || 'unclear',
          analysisMode: 'openclaw-kimi',
          promptVersion: 'loadpilot_v2',
          generatedAt: now
        }
      },
      progress: {
        percent: analysis.quality?.confidence === 'high' ? 85 : 
                 analysis.quality?.confidence === 'medium' ? 60 : 35,
        level: analysis.quality?.confidence === 'high' ? 3 : 
               analysis.quality?.confidence === 'medium' ? 2 : 1,
        stage: (analysis.quality?.missingContext?.length || 0) === 0 ? 'clarified' : 'needs_context',
        updatedAt: now
      },
      updates: [
        ...(existingTwin.updates || []),
        {
          timestamp: now,
          input: additionalInput,
          summary: 'Project Twin aktualisiert',
          changedFields: []
        }
      ]
    }

    // DEBUG: Prüfe Struktur vor Rückgabe
    console.log('[UpdateRoute] returning', {
      hasUpdatedTwin: Boolean(updatedTwin),
      updatedTwinKeys: Object.keys(updatedTwin),
      hasAnalysis: Boolean(updatedTwin.analysis),
      analysisKeys: Object.keys(updatedTwin.analysis || {}),
      hasProject: Boolean(updatedTwin.analysis?.project),
      hasNextMove: Boolean(updatedTwin.analysis?.nextMove),
      hasQuality: Boolean(updatedTwin.analysis?.quality)
    })

    return res.status(200).json({
      updatedTwin,
      updateSummary: 'Project Twin erfolgreich aktualisiert.',
      changedFields: [],
      newProgress: updatedTwin.progress,
      meta: {
        source: 'vercel-update-route',
        bridgeMode: 'openclaw-kimi',
        jobType: 'loadpilot_project_twin_update',
        processedAt: now
      }
    })

  } catch (globalError) {
    const message = globalError instanceof Error ? globalError.message : 'Unknown error'
    return res.status(500).json({
      error: 'Unhandled exception',
      message,
      stage: 'global_catch'
    })
  }
}
