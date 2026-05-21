import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const BRIDGE_TIMEOUT_MS = 120000

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

// Robuste Analyse-Extraktion aus verschiedenen Bridge-Formaten
function extractAnalysisFromBridgeResponse(bridgeJson: unknown): { 
  analysis: ProjectTwinAnalysis | null
  debug: Record<string, unknown>
} {
  const debug: Record<string, unknown> = {
    inputType: typeof bridgeJson,
    topLevelKeys: isObject(bridgeJson) ? Object.keys(bridgeJson) : null
  }

  if (!isObject(bridgeJson)) {
    return { analysis: null, debug: { ...debug, error: 'bridgeJson is not an object' } }
  }

  const b = bridgeJson

  // Pfad 1: bridgeJson.updatedTwin?.analysis
  if (isObject(b.updatedTwin) && isValidAnalysis(b.updatedTwin.analysis)) {
    return { analysis: b.updatedTwin.analysis as ProjectTwinAnalysis, debug: { ...debug, path: 'updatedTwin.analysis' } }
  }

  // Pfad 2: bridgeJson.analysis
  if (isValidAnalysis(b.analysis)) {
    return { analysis: b.analysis as ProjectTwinAnalysis, debug: { ...debug, path: 'analysis' } }
  }

  // Pfad 3: bridgeJson.result?.analysis
  if (isObject(b.result) && isValidAnalysis(b.result.analysis)) {
    return { analysis: b.result.analysis as ProjectTwinAnalysis, debug: { ...debug, path: 'result.analysis' } }
  }

  // Pfad 4: bridgeJson.result direkt (wenn project/nextMove/quality vorhanden)
  if (isObject(b.result) && hasProjectTwinFields(b.result)) {
    return { analysis: b.result as unknown as ProjectTwinAnalysis, debug: { ...debug, path: 'result' } }
  }

  // Pfad 5: bridgeJson.result?.result
  if (isObject(b.result) && isObject(b.result.result) && hasProjectTwinFields(b.result.result)) {
    return { analysis: b.result.result as unknown as ProjectTwinAnalysis, debug: { ...debug, path: 'result.result' } }
  }

  // Pfad 6: bridgeJson.result?.updatedTwin?.analysis
  if (isObject(b.result) && isObject(b.result.updatedTwin) && isValidAnalysis(b.result.updatedTwin.analysis)) {
    return { analysis: b.result.updatedTwin.analysis as ProjectTwinAnalysis, debug: { ...debug, path: 'result.updatedTwin.analysis' } }
  }

  // Pfad 7: bridgeJson.result?.result?.analysis
  if (isObject(b.result) && isObject(b.result.result) && isValidAnalysis(b.result.result.analysis)) {
    return { analysis: b.result.result.analysis as ProjectTwinAnalysis, debug: { ...debug, path: 'result.result.analysis' } }
  }

  // Nichts gefunden - Diagnose
  return { 
    analysis: null, 
    debug: { 
      ...debug,
      error: 'No valid analysis path found',
      hasUpdatedTwin: isObject(b.updatedTwin),
      hasUpdatedTwinAnalysis: isObject(b.updatedTwin) && isObject(b.updatedTwin.analysis),
      hasAnalysis: isObject(b.analysis),
      hasResult: isObject(b.result),
      resultKeys: isObject(b.result) ? Object.keys(b.result) : null,
      resultHasProject: isObject(b.result) && isObject(b.result.project),
      resultHasNextMove: isObject(b.result) && isObject(b.result.nextMove),
      resultHasQuality: isObject(b.result) && isObject(b.result.quality)
    } 
  }
}

// Type guards
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidAnalysis(obj: unknown): obj is ProjectTwinAnalysis {
  if (!isObject(obj)) return false
  const a = obj
  const hasProject = isObject(a.project) && typeof a.project.title === 'string'
  const hasNextMove = isObject(a.nextMove) && typeof a.nextMove.title === 'string'
  const hasQuality = isObject(a.quality) && typeof a.quality.isActionable === 'boolean'
  return hasProject && hasNextMove && hasQuality
}

function hasProjectTwinFields(obj: Record<string, unknown>): boolean {
  const hasProject = isObject(obj.project) && typeof obj.project.title === 'string'
  const hasNextMove = isObject(obj.nextMove) && typeof obj.nextMove.title === 'string'
  const hasQuality = isObject(obj.quality) && typeof obj.quality.isActionable === 'boolean'
  return hasProject && hasNextMove && hasQuality
}

// Kompakter Twin für Bridge
function buildCompactTwin(twin: StoredProjectTwin): Record<string, unknown> {
  const fallbackAnalysis = isObject(twin as unknown as Record<string, unknown>) && hasProjectTwinFields(twin as unknown as Record<string, unknown>)
    ? (twin as unknown as ProjectTwinAnalysis)
    : null

  const analysis = isObject(twin.analysis) ? twin.analysis : fallbackAnalysis

  if (!analysis || !isObject(analysis)) {
    throw new Error('existingTwin.analysis fehlt oder ist ungültig')
  }

  const project = (isObject(analysis.project) ? analysis.project : {}) as Record<string, unknown>
  const nextMove = (isObject(analysis.nextMove) ? analysis.nextMove : {}) as Record<string, unknown>
  const quality = (isObject(analysis.quality) ? analysis.quality : {}) as Record<string, unknown>
  const actions = Array.isArray(analysis.actions) ? analysis.actions : []
  const risks = Array.isArray(analysis.risks) ? analysis.risks : []
  const dependencies = Array.isArray(analysis.dependencies) ? analysis.dependencies : []
  const scenarios = Array.isArray(analysis.scenarios) ? analysis.scenarios : []
  const updates = Array.isArray(twin.updates) ? twin.updates : []

  return {
    id: typeof twin.id === 'string' ? twin.id : '',
    title: typeof project.title === 'string' ? project.title : (typeof twin.title === 'string' ? twin.title : 'Unbekanntes Projekt'),
    status: typeof project.status === 'string' ? project.status : 'active',
    type: typeof project.type === 'string' ? project.type : 'unknown',
    description: typeof project.description === 'string' ? project.description.substring(0, 200) : '',
    nextMove: {
      title: typeof nextMove.title === 'string' ? nextMove.title : 'Nächsten Schritt klären',
      reason: typeof nextMove.reason === 'string' ? nextMove.reason.substring(0, 100) : '',
      effort: typeof nextMove.effort === 'string' ? nextMove.effort : 'medium',
      impact: typeof nextMove.impact === 'string' ? nextMove.impact : 'medium'
    },
    actions: actions.slice(0, 5).map((a) => ({
      title: isObject(a) && typeof a.title === 'string' ? a.title : 'Unbenannte Aktion',
      owner: isObject(a) && typeof a.owner === 'string' ? a.owner : 'Unbekannt',
      priority: isObject(a) && typeof a.priority === 'string' ? a.priority : 'medium'
    })),
    risks: risks.slice(0, 5).map((r) => ({
      title: isObject(r) && typeof r.title === 'string' ? r.title : 'Unbenanntes Risiko',
      severity: isObject(r) && typeof r.severity === 'string' ? r.severity : 'medium'
    })),
    dependencies: dependencies.slice(0, 5).map((d) => ({
      from: isObject(d) && typeof d.from === 'string' ? d.from : 'Unbekannt',
      to: isObject(d) && typeof d.to === 'string' ? d.to : 'Unbekannt',
      isBlocker: isObject(d) ? Boolean(d.isBlocker) : false
    })),
    scenarios: scenarios.slice(0, 3).map((s) => ({
      title: isObject(s) && typeof s.title === 'string' ? s.title : 'Unbenanntes Szenario',
      riskLevel: isObject(s) && typeof s.riskLevel === 'string' ? s.riskLevel : 'medium'
    })),
    quality: {
      confidence: typeof quality.confidence === 'string' ? quality.confidence : 'low',
      missingContext: Array.isArray(quality.missingContext) ? quality.missingContext.slice(0, 5) : [],
      isActionable: Boolean(quality.isActionable)
    },
    progress: twin.progress || { percent: 35, level: 1, stage: 'needs_context' },
    recentUpdates: updates.slice(-3).map((u) => ({
      timestamp: isObject(u) && typeof u.timestamp === 'string' ? u.timestamp : '',
      summary: isObject(u) && typeof u.summary === 'string' ? u.summary.substring(0, 50) : ''
    })),
    latestInput: typeof twin.latestInput === 'string' ? twin.latestInput.substring(0, 100) : ''
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let stage = 'initialize'
  let body: Record<string, unknown> | undefined = undefined
  
  try {
    res.setHeader('Content-Type', 'application/json')

    stage = 'check_method'
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'method_not_allowed',
        message: 'Nur POST ist erlaubt.',
        stage
      })
    }

    stage = 'parse_body'
    body = req.body as Record<string, unknown> | undefined

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ 
        error: 'invalid_body',
        message: 'Request body fehlt oder ist kein Objekt.',
        stage,
        debug: { bodyType: typeof body }
      })
    }

    stage = 'validate_payload'
    const { existingTwin, additionalInput, originalInput, updateMode, contextAnswers } = body as {
      existingTwin?: unknown
      additionalInput?: unknown
      originalInput?: unknown
      updateMode?: unknown
      contextAnswers?: unknown
    }

    if (!existingTwin || typeof existingTwin !== 'object') {
      return res.status(400).json({
        error: 'missing_existing_twin',
        message: 'existingTwin fehlt oder ist ungültig.',
        stage,
        debug: {
          payloadKeys: Object.keys(body),
          hasExistingTwin: Boolean(existingTwin),
          existingTwinType: typeof existingTwin
        }
      })
    }

    const existing = existingTwin as StoredProjectTwin

    if (!additionalInput || typeof additionalInput !== 'string') {
      return res.status(400).json({
        error: 'missing_additional_input',
        message: 'additionalInput fehlt oder ist kein String.',
        stage,
        debug: {
          hasAdditionalInput: Boolean(additionalInput),
          additionalInputType: typeof additionalInput
        }
      })
    }

    if (additionalInput.length > MAX_INPUT_LENGTH) {
      return res.status(400).json({
        error: 'input_too_long',
        message: `Input zu lang. Max ${MAX_INPUT_LENGTH} Zeichen.`,
        stage,
        debug: { inputLength: additionalInput.length }
      })
    }

    stage = 'check_config'
    const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
    const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

    if (!bridgeUrl || !bridgeSecret) {
      return res.status(500).json({
        error: 'bridge_not_configured',
        message: 'Bridge nicht konfiguriert.',
        stage,
        debug: {
          hasBridgeUrl: Boolean(bridgeUrl),
          hasSecret: Boolean(bridgeSecret)
        }
      })
    }

    stage = 'build_bridge_url'
    const baseUrl = bridgeUrl.replace(/\/bridge\/.*$/, '').replace(/\/+$/, '')
    const updateUrl = `${baseUrl}/bridge/update-project-twin`

    stage = 'build_compact_twin'
    let compactTwin: Record<string, unknown>
    try {
      compactTwin = buildCompactTwin(existing)
    } catch (twinError) {
      return res.status(500).json({
        error: 'build_compact_twin_failed',
        message: twinError instanceof Error ? twinError.message : 'Unknown error building compact twin',
        stage,
        debug: {
          existingTwinKeys: Object.keys(existing),
          hasAnalysis: Boolean(existing.analysis),
          hasProject: Boolean(existing.analysis?.project)
        }
      })
    }

    stage = 'call_bridge'
    const payload = {
      jobType: 'loadpilot_project_twin_update',
      promptVersion: 'loadpilot_v2',
      outputFormat: 'project_twin_json',
      updateMode: updateMode || 'refine_existing_twin',
      compactTwinContext: compactTwin,
      additionalInput: additionalInput.substring(0, 500),
      originalInput: String(originalInput || '').substring(0, 200),
      contextAnswers: Array.isArray(contextAnswers) ? contextAnswers.slice(0, 3) : []
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), BRIDGE_TIMEOUT_MS)

    let bridgeResponse: Response | null = null
    let bridgeText = ''
    let fetchError: Error | null = null

    try {
      console.log('[UpdateRoute] Calling bridge', { 
        url: updateUrl.replace(/:\/\/[^:]+:/, '://***:'),
        payloadKeys: Object.keys(payload),
        compactTwinKeys: Object.keys(compactTwin)
      })

      bridgeResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${bridgeSecret}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      bridgeText = await bridgeResponse.text()
      
      console.log('[UpdateRoute] Bridge response', {
        status: bridgeResponse.status,
        ok: bridgeResponse.ok,
        textLength: bridgeText.length,
        preview: bridgeText.substring(0, 500)
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
        message: `Die Bridge-Aktualisierung hat zu lange gedauert (>${BRIDGE_TIMEOUT_MS}ms).`,
        stage: 'bridge_fetch',
        debug: {
          timeoutMs: BRIDGE_TIMEOUT_MS,
          additionalInputLength: additionalInput.length
        }
      })
    }

    if (fetchError) {
      return res.status(502).json({
        error: 'bridge_fetch_failed',
        message: `Bridge-Aufruf fehlgeschlagen: ${fetchError.message}`,
        stage: 'bridge_fetch',
        debug: {
          errorName: fetchError.name,
          errorMessage: fetchError.message
        }
      })
    }

    if (!bridgeResponse) {
      return res.status(502).json({
        error: 'bridge_no_response',
        message: 'Bridge gab keine Response zurück.',
        stage: 'bridge_fetch'
      })
    }

    stage = 'check_bridge_status'
    if (!bridgeResponse.ok) {
      return res.status(502).json({
        error: 'bridge_error',
        message: `Bridge gab Status ${bridgeResponse.status} zurück.`,
        stage,
        debug: {
          bridgeStatus: bridgeResponse.status,
          bridgeTextPreview: bridgeText.substring(0, 200)
        }
      })
    }

    stage = 'parse_bridge_response'
    let bridgeJson: unknown = null
    try {
      bridgeJson = JSON.parse(bridgeText)
    } catch (parseError) {
      return res.status(502).json({
        error: 'bridge_json_parse_failed',
        message: `Bridge-Antwort konnte nicht als JSON geparst werden: ${parseError instanceof Error ? parseError.message : 'Unknown'}`,
        stage,
        debug: {
          bridgeTextLength: bridgeText.length,
          bridgeTextPreview: bridgeText.substring(0, 500)
        }
      })
    }

    stage = 'extract_analysis'
    const { analysis, debug: extractDebug } = extractAnalysisFromBridgeResponse(bridgeJson)

    if (!analysis) {
      return res.status(502).json({
        error: 'analysis_extraction_failed',
        message: 'Keine gültige Analyse aus Bridge-Response extrahiert.',
        stage,
        debug: {
          ...extractDebug,
          bridgeResponsePreview: JSON.stringify(bridgeJson).substring(0, 800)
        }
      })
    }

    console.log('[UpdateRoute] Analysis extracted', {
      path: extractDebug.path,
      projectTitle: analysis.project?.title,
      confidence: analysis.quality?.confidence
    })

    stage = 'build_updated_twin'
    const now = new Date().toISOString()
    
    let updatedTwin: StoredProjectTwin
    try {
      updatedTwin = {
        ...existing,
        id: existing.id,
        schemaVersion: 2,
        title: analysis.project?.title || existing.title || 'Unbenanntes Projekt',
        description: analysis.project?.description || existing.description || '',
        createdAt: existing.createdAt,
        updatedAt: now,
        originalInput: existing.originalInput || String(originalInput || ''),
        latestInput: additionalInput,
        analysis: {
          project: analysis.project || existing.analysis?.project,
          nextMove: analysis.nextMove || existing.analysis?.nextMove,
          actors: Array.isArray(analysis.actors) ? analysis.actors : (existing.analysis?.actors || []),
          dependencies: Array.isArray(analysis.dependencies) ? analysis.dependencies : (existing.analysis?.dependencies || []),
          risks: Array.isArray(analysis.risks) ? analysis.risks : (existing.analysis?.risks || []),
          scenarios: Array.isArray(analysis.scenarios) ? analysis.scenarios : (existing.analysis?.scenarios || []),
          actions: Array.isArray(analysis.actions) ? analysis.actions : (existing.analysis?.actions || []),
          quality: analysis.quality || existing.analysis?.quality,
          meta: {
            ...(existing.analysis?.meta || {}),
            ...(analysis.meta || {}),
            domain: (analysis.project as any)?.type || existing.analysis?.meta?.domain || 'unclear',
            analysisMode: 'openclaw-kimi',
            promptVersion: 'loadpilot_v2',
            generatedAt: now
          }
        },
        progress: (() => {
          const bridgeProgress = (bridgeJson as any)?.result?.progress || (bridgeJson as any)?.progress
          return bridgeProgress || {
            percent: analysis.quality?.confidence === 'high' ? 85 : 
                     analysis.quality?.confidence === 'medium' ? 60 : 35,
            level: analysis.quality?.confidence === 'high' ? 3 : 
                   analysis.quality?.confidence === 'medium' ? 2 : 1,
            stage: (analysis.quality?.missingContext?.length || 0) === 0 ? 'clarified' : 'needs_context',
            updatedAt: now
          }
        })(),
        updates: [
          ...(existing.updates || []),
          {
            timestamp: now,
            input: additionalInput,
            summary: 'Project Twin aktualisiert',
            changedFields: []
          }
        ]
      }
    } catch (buildError) {
      return res.status(500).json({
        error: 'build_updated_twin_failed',
        message: buildError instanceof Error ? buildError.message : 'Unknown error building updated twin',
        stage,
        debug: {
          hasExistingAnalysis: Boolean(existing.analysis),
          hasExtractedAnalysis: Boolean(analysis),
          analysisKeys: Object.keys(analysis || {})
        }
      })
    }

    stage = 'return_response'
    console.log('[UpdateRoute] Success', {
      updatedTwinId: updatedTwin.id,
      hasAnalysis: Boolean(updatedTwin.analysis),
      projectTitle: updatedTwin.analysis?.project?.title
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
    const message = globalError instanceof Error ? globalError.message : String(globalError)
    console.error('[UpdateRoute] Global error at stage:', stage, message)
    
    return res.status(500).json({
      error: 'update_project_twin_failed',
      message,
      stage,
      debug: {
        hasBridgeUrl: Boolean(process.env.OPENCLAW_BRIDGE_URL),
        hasSecret: Boolean(process.env.OPENCLAW_BRIDGE_SECRET),
        payloadKeys: body ? Object.keys(body) : [],
        hasExistingTwin: body ? Boolean(body.existingTwin) : false,
        hasExistingTwinAnalysis: body?.existingTwin ? Boolean((body.existingTwin as any)?.analysis) : false,
        hasAdditionalInput: body ? Boolean(body.additionalInput) : false,
        additionalInputLength: body?.additionalInput ? String(body.additionalInput).length : 0,
        hasUpdateMode: body ? Boolean(body.updateMode) : false,
        existingTwinTitle: body?.existingTwin ? 
          ((body.existingTwin as any)?.title || (body.existingTwin as any)?.analysis?.project?.title || null) : null
      }
    })
  }
}
