import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const BRIDGE_TIMEOUT_MS = 30000 // 30 Sekunden für Update (nicht 180s)

// Timing-Hilfe
function nowMs() {
  return Date.now()
}

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
  updates?: Array<{
    timestamp: string
    input: string
    summary: string
    changedFields?: unknown[]
  }>
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

// Kompakte Twin-Version für Bridge (Performance!)
function buildCompactTwin(twin: StoredProjectTwin): Record<string, unknown> {
  const analysis = twin.analysis
  
  return {
    id: twin.id,
    title: analysis.project.title,
    status: analysis.project.status,
    type: analysis.project.type,
    // Nur kurze Beschreibung
    description: analysis.project.description.substring(0, 200),
    nextMove: {
      title: analysis.nextMove.title,
      reason: analysis.nextMove.reason.substring(0, 100),
      effort: analysis.nextMove.effort,
      impact: analysis.nextMove.impact
    },
    // Nur Top-5 Aktionen
    actions: analysis.actions.slice(0, 5).map(a => ({
      title: a.title,
      owner: a.owner,
      priority: a.priority
    })),
    // Nur Top-5 Risiken
    risks: analysis.risks.slice(0, 5).map(r => ({
      title: r.title,
      severity: r.severity
    })),
    // Nur Top-5 Dependencies
    dependencies: analysis.dependencies.slice(0, 5).map(d => ({
      from: d.from,
      to: d.to,
      isBlocker: d.isBlocker
    })),
    // Nur Top-3 Szenarien
    scenarios: analysis.scenarios.slice(0, 3).map(s => ({
      title: s.title,
      riskLevel: s.riskLevel
    })),
    quality: {
      confidence: analysis.quality.confidence,
      missingContext: analysis.quality.missingContext.slice(0, 5), // Nur Top-5
      isActionable: analysis.quality.isActionable
    },
    progress: twin.progress || { percent: 35, level: 1, stage: 'needs_context' },
    // Nur letzte 3 Updates
    recentUpdates: (twin.updates || []).slice(-3).map(u => ({
      timestamp: u.timestamp,
      summary: u.summary?.substring(0, 50)
    })),
    latestInput: twin.latestInput?.substring(0, 100) || ''
  }
}

// Type guard für Analysis
function isValidAnalysis(obj: unknown): obj is ProjectTwinAnalysis {
  if (!obj || typeof obj !== 'object') return false
  const a = obj as Record<string, unknown>
  const hasProject = typeof a.project === 'object' && a.project !== null
  const hasNextMove = typeof a.nextMove === 'object' && a.nextMove !== null
  const hasQuality = typeof a.quality === 'object' && a.quality !== null
  const hasQualityIsActionable = typeof (a.quality as Record<string, unknown>)?.isActionable === 'boolean'
  return hasProject && hasNextMove && hasQuality && hasQualityIsActionable
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const handlerStart = nowMs()
  
  try {
    res.setHeader('Content-Type', 'application/json')

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
    }

    const bodyParsedAt = nowMs()
    const body = req.body as Record<string, unknown> | undefined

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ 
        error: 'invalid_body',
        message: 'Ungültiger Request-Body.' 
      })
    }

    const { existingTwin, additionalInput, originalInput, contextAnswers } = body as unknown as TwinUpdateRequest

    // Validierung
    if (!existingTwin || typeof existingTwin !== 'object') {
      return res.status(400).json({ 
        error: 'missing_existing_twin',
        message: 'existingTwin fehlt.' 
      })
    }

    if (!additionalInput || typeof additionalInput !== 'string') {
      return res.status(400).json({ 
        error: 'missing_additional_input',
        message: 'additionalInput fehlt.' 
      })
    }

    if (additionalInput.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({ 
        error: 'input_too_long',
        message: `Input zu lang. Max ${MAX_INPUT_LENGTH} Zeichen.` 
      })
    }

    const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
    const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

    if (!bridgeUrl || !bridgeSecret) {
      return res.status(500).json({ 
        error: 'bridge_not_configured',
        message: 'Bridge nicht konfiguriert.' 
      })
    }

    // URL bauen
    const baseUrl = bridgeUrl.replace(/\/bridge\/.*$/, '').replace(/\/+$/, '')
    const updateUrl = `${baseUrl}/bridge/update-project-twin`

    // KOMPAKTER TWIN für Bridge (Performance!)
    const compactTwin = buildCompactTwin(existingTwin)
    
    const bridgeRequestStart = nowMs()

    // Payload für Bridge - NUR kompakte Daten
    const payload = {
      jobType: 'loadpilot_project_twin_update',
      promptVersion: 'loadpilot_v2',
      outputFormat: 'project_twin_json',
      updateMode: 'refine_existing_twin',
      compactTwinContext: compactTwin, // Kompatibel mit Bridge
      additionalInput: additionalInput.substring(0, 500), // Max 500 chars
      originalInput: (originalInput || '').substring(0, 200),
      contextAnswers: (contextAnswers || []).slice(0, 3) // Max 3 Antworten
    }

    console.log('[UpdateRoute] Starting bridge call', {
      url: updateUrl.replace(/:\/\/[^:]+:/, '://***:'),
      compactTwinKeys: Object.keys(compactTwin),
      additionalInputLength: payload.additionalInput.length,
      timeoutMs: BRIDGE_TIMEOUT_MS
    })

    // Fetch zur Bridge mit kontrolliertem Timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
      console.log('[UpdateRoute] Bridge timeout after', BRIDGE_TIMEOUT_MS, 'ms')
    }, BRIDGE_TIMEOUT_MS)

    let bridgeResponse: Response
    let bridgeJson: Record<string, unknown> | null = null
    let fetchError: Error | null = null

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

      const bridgeResponseAt = nowMs()
      const bodyText = await bridgeResponse.text()
      
      try {
        bridgeJson = JSON.parse(bodyText) as Record<string, unknown>
      } catch {
        bridgeJson = null
      }

      const bridgeJsonParsedAt = nowMs()
      
      // Timing-Log
      console.log('[UpdateRoute] timing', {
        bodyParsedMs: bridgeRequestStart - handlerStart,
        bridgeRequestMs: bridgeResponseAt - bridgeRequestStart,
        bridgeParseMs: bridgeJsonParsedAt - bridgeResponseAt,
        bridgeTotalMs: bridgeJsonParsedAt - bridgeRequestStart,
        bridgeStatus: bridgeResponse.status,
        hasResult: Boolean(bridgeJson?.result),
        resultKeys: bridgeJson?.result ? Object.keys(bridgeJson.result as object).slice(0, 5) : []
      })

    } catch (err) {
      fetchError = err as Error
      console.error('[UpdateRoute] Fetch error:', fetchError.message)
    } finally {
      clearTimeout(timeoutId)
    }

    // Timeout behandeln
    if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('abort')) {
      return res.status(504).json({
        error: 'bridge_timeout',
        message: 'Die Bridge-Aktualisierung hat zu lange gedauert (>30s).',
        stage: 'bridge_fetch',
        debug: {
          timeoutMs: BRIDGE_TIMEOUT_MS,
          hasExistingTwin: true,
          additionalInputLength: additionalInput.length
        }
      })
    }

    // Anderer Fetch-Fehler
    if (fetchError) {
      return res.status(502).json({
        error: 'bridge_fetch_failed',
        message: `Bridge-Aufruf fehlgeschlagen: ${fetchError.message}`,
        stage: 'bridge_fetch'
      })
    }

    // Bridge-Error
    if (!bridgeResponse!.ok) {
      return res.status(502).json({
        error: 'bridge_error',
        message: `Bridge gab Status ${bridgeResponse!.status} zurück.`,
        stage: 'bridge_response',
        bridgeStatus: bridgeResponse!.status,
        bridgeError: bridgeJson?.error || 'Unknown'
      })
    }

    // Kein JSON
    if (!bridgeJson) {
      return res.status(502).json({ 
        error: 'bridge_invalid_json',
        message: 'Bridge gab kein gültiges JSON zurück.',
        stage: 'bridge_parse'
      })
    }

    // Extrahiere Analyse
    const bridgeResult = bridgeJson.result || bridgeJson
    const analysis = isValidAnalysis(bridgeResult) ? bridgeResult : null

    if (!analysis) {
      return res.status(502).json({
        error: 'bridge_invalid_analysis',
        message: 'Bridge-Response enthielt keine gültige Analyse.',
        stage: 'analysis_extraction',
        bridgeKeys: Object.keys(bridgeJson),
        resultType: typeof bridgeResult
      })
    }

    // Baue vollständigen StoredProjectTwin
    const updatedTwinBuiltAt = nowMs()
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

    const responseSentAt = nowMs()
    
    // Final timing
    console.log('[UpdateRoute] total timing', {
      totalMs: responseSentAt - handlerStart,
      bodyParseMs: bridgeRequestStart - handlerStart,
      bridgeTotalMs: updatedTwinBuiltAt - bridgeRequestStart,
      mergeMs: responseSentAt - updatedTwinBuiltAt
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
        processedAt: now,
        timingMs: responseSentAt - handlerStart
      }
    })

  } catch (globalError) {
    const message = globalError instanceof Error ? globalError.message : 'Unknown error'
    console.error('[UpdateRoute] Global error:', message)
    
    return res.status(500).json({
      error: 'unhandled_exception',
      message,
      stage: 'global_catch',
      debug: {
        hasBridgeUrl: Boolean(process.env.OPENCLAW_BRIDGE_URL),
        hasSecret: Boolean(process.env.OPENCLAW_BRIDGE_SECRET)
      }
    })
  }
}
