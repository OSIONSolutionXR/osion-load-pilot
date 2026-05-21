import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000
const PROMPT_VERSION = 'loadpilot_v2'

const UPDATE_PROMPT = `Du bist OSION Load Pilot im UPDATE-Modus.

AUFGABE: Aktualisiere einen bestehenden Project Twin mit neuem Kontext.

WICHTIGE REGELN:
1. Bewahre den bestehenden Twin als Basis - verwerfe NICHT alles
2. Integriere den neuen Kontext INTELLIGENT
3. Aktualisiere das Next Move, wenn der neue Kontext dies rechtfertigt
4. Erhöhe confidence (low→medium→high), wenn wichtige Lücken geschlossen wurden
5. Reduziere missingContext für geklärte Punkte
6. Füge neue Akteure/Risiken/Aktionen nur hinzu, wenn sie im neuen Kontext erwähnt werden

Antworte NUR mit validem JSON im Project-Twin-Schema. Keine Markdown-Fences.`

// Type definitions - identisch zu analyze-project.ts
type ProjectStatus = 'active' | 'blocked' | 'waiting' | 'parked'
type EffortLevel = 'low' | 'medium' | 'high'
type ImpactLevel = 'low' | 'medium' | 'high'
type InfluenceLevel = 'low' | 'medium' | 'high'
type DependencyStatus = 'required' | 'blocked' | 'waiting' | 'done'
type RiskSeverity = 'low' | 'medium' | 'high'
type ActionPriority = 'low' | 'medium' | 'high'
type InputQuality = 'insufficient' | 'usable' | 'strong'
type ConfidenceLevel = 'low' | 'medium' | 'high'

interface ProjectTwinAnalysis {
  project: {
    title: string
    description: string
    status: ProjectStatus
    type: string
  }
  nextMove: {
    title: string
    reason: string
    effort: EffortLevel
    impact: ImpactLevel
    deadline: string | null
  }
  actors: Array<{
    name: string
    role: string
    influence: InfluenceLevel
    waitingFor: string | null
  }>
  dependencies: Array<{
    from: string
    to: string
    status: DependencyStatus
    isBlocker: boolean
    explanation: string
  }>
  risks: Array<{
    title: string
    severity: RiskSeverity
    explanation: string
  }>
  scenarios: Array<{
    title: string
    outcome: string
    riskLevel: RiskSeverity
    recommendation: string
  }>
  actions: Array<{
    title: string
    owner: string
    priority: ActionPriority
    messageDraft?: string | null
  }>
  quality: {
    inputQuality: InputQuality
    isActionable: boolean
    confidence: ConfidenceLevel
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

interface ContextAnswer {
  questionId: string
  label: string
  answer: string
  sourceMissingContext: string
}

interface TwinUpdateRequest {
  existingTwin: ProjectTwinAnalysis
  additionalInput: string
  originalInput: string
  updateMode: 'refine_existing_twin'
  contextAnswers?: ContextAnswer[]
}

type BridgeEnvelope = {
  result?: unknown
  error?: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function validateAnalysis(data: unknown): data is ProjectTwinAnalysis {
  if (!isObject(data)) return false

  const { project, nextMove, actors, dependencies, risks, scenarios, actions, quality, meta } = data
  
  if (!isObject(project) || !isObject(nextMove) || !isObject(quality) || !isObject(meta)) return false
  if (!Array.isArray(actors) || !Array.isArray(dependencies) || !Array.isArray(risks) || 
      !Array.isArray(scenarios) || !Array.isArray(actions)) return false

  const validProject =
    isString(project.title) &&
    isString(project.description) &&
    isString(project.type) &&
    isEnum(project.status, ['active', 'blocked', 'waiting', 'parked'] as const)

  const validNextMove =
    isString(nextMove.title) &&
    isString(nextMove.reason) &&
    isEnum(nextMove.effort, ['low', 'medium', 'high'] as const) &&
    isEnum(nextMove.impact, ['low', 'medium', 'high'] as const) &&
    isNullableString(nextMove.deadline)

  const validActors = actors.every((actor) =>
    isObject(actor) &&
    isString(actor.name) &&
    isString(actor.role) &&
    isEnum(actor.influence, ['low', 'medium', 'high'] as const) &&
    isNullableString(actor.waitingFor)
  )

  const validDependencies = dependencies.every((dependency) =>
    isObject(dependency) &&
    isString(dependency.from) &&
    isString(dependency.to) &&
    isEnum(dependency.status, ['required', 'blocked', 'waiting', 'done'] as const) &&
    typeof dependency.isBlocker === 'boolean' &&
    isString(dependency.explanation)
  )

  const validRisks = risks.every((risk) =>
    isObject(risk) &&
    isString(risk.title) &&
    isEnum(risk.severity, ['low', 'medium', 'high'] as const) &&
    isString(risk.explanation)
  )

  const validScenarios = scenarios.every((scenario) =>
    isObject(scenario) &&
    isString(scenario.title) &&
    isString(scenario.outcome) &&
    isEnum(scenario.riskLevel, ['low', 'medium', 'high'] as const) &&
    isString(scenario.recommendation)
  )

  const validActions = actions.every((action) =>
    isObject(action) &&
    isString(action.title) &&
    isString(action.owner) &&
    isEnum(action.priority, ['low', 'medium', 'high'] as const) &&
    (!('messageDraft' in action) || isNullableString(action.messageDraft))
  )

  const validQuality =
    isEnum(quality.inputQuality, ['insufficient', 'usable', 'strong'] as const) &&
    typeof quality.isActionable === 'boolean' &&
    isEnum(quality.confidence, ['low', 'medium', 'high'] as const) &&
    Array.isArray(quality.missingContext) &&
    quality.missingContext.every((item) => typeof item === 'string') &&
    isString(quality.reason)

  const validMeta =
    isString(meta.domain) &&
    meta.analysisMode === 'openclaw-kimi' &&
    isString(meta.promptVersion) &&
    isString(meta.generatedAt)

  return validProject && validNextMove && validActors && validDependencies && 
         validRisks && validScenarios && validActions && validQuality && validMeta
}

// Prüfe ob Update-Input zu schwach ist
function isInsufficientUpdateInput(additionalInput: string, contextAnswers?: ContextAnswer[]): boolean {
  const trimmed = additionalInput.trim()
  if (contextAnswers && contextAnswers.length > 0) return false
  if (trimmed.length < 10) return true
  if (/^(test|abc|123|asdf|xyz|nein|ja|ok|nope|maybe)$/iu.test(trimmed)) return true
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 3) return true
  return false
}

async function callBridgeForUpdate(
  existingTwin: ProjectTwinAnalysis,
  additionalInput: string,
  originalInput: string,
  contextAnswers?: ContextAnswer[]
): Promise<ProjectTwinAnalysis> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  if (!bridgeUrl || !bridgeSecret) {
    throw new Error('OpenClaw Bridge ist nicht konfiguriert.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  // Extrahiere Base-URL
  const baseUrl = bridgeUrl.replace(/\/bridge\/.*$/, '').replace(/\/+$/, '')
  const updateUrl = `${baseUrl}/bridge/update-project-twin`

  // Baue Input für Update: Kombiniere bestehenden Kontext + neue Info
  const contextSummary = `
BESTEHENDER PROJECT TWIN:
Titel: ${existingTwin.project.title}
Beschreibung: ${existingTwin.project.description.substring(0, 300)}
Status: ${existingTwin.project.status}
Aktuelles Next Move: ${existingTwin.nextMove.title}
Confidence: ${existingTwin.quality.confidence}
Fehlender Kontext: ${existingTwin.quality.missingContext.join(', ')}

NEUER KONTEXT:
${additionalInput}
`.trim()

  const payload = {
    jobType: 'loadpilot_project_twin_update',
    promptVersion: PROMPT_VERSION,
    input: contextSummary,
    outputFormat: 'project_twin_json',
    prompt: UPDATE_PROMPT,
    agents: ['update_synthesizer'],
    contextAnswers,
    existingTwin,
    additionalInput,
    originalInput
  }

  console.log('[Update Bridge] Calling:', updateUrl)

  try {
    const response = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bridgeSecret}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    })

    const body = (await response.json().catch(() => ({}))) as BridgeEnvelope

    if (!response.ok) {
      throw new Error(body.error || `Bridge error: ${response.status}`)
    }

    const result = isObject(body) && 'result' in body ? body.result : body

    console.log('[Update Bridge] Response type:', typeof result)
    if (isObject(result)) {
      console.log('[Update Bridge] Result keys:', Object.keys(result))
    }

    if (!validateAnalysis(result)) {
      console.error('[Update Bridge] Validation failed')
      throw new Error('OpenClaw Bridge hat kein valides Project-Twin-JSON zurückgegeben.')
    }

    return result
  } finally {
    clearTimeout(timeout)
  }
}

function detectChangedFields(oldAnalysis: ProjectTwinAnalysis, newAnalysis: ProjectTwinAnalysis): string[] {
  const changed: string[] = []

  if (oldAnalysis.nextMove.title !== newAnalysis.nextMove.title) changed.push('nextMove.title')
  if (oldAnalysis.quality.confidence !== newAnalysis.quality.confidence) changed.push('quality.confidence')
  if (oldAnalysis.quality.missingContext.length !== newAnalysis.quality.missingContext.length) {
    changed.push('quality.missingContext')
  }
  if (oldAnalysis.project.description !== newAnalysis.project.description) changed.push('project.description')
  if (oldAnalysis.actors.length !== newAnalysis.actors.length) changed.push('actors.count')
  if (oldAnalysis.risks.length !== newAnalysis.risks.length) changed.push('risks.count')
  if (oldAnalysis.actions.length !== newAnalysis.actions.length) changed.push('actions.count')

  return changed
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
  }

  const body = req.body as unknown

  // Validierung
  if (!isObject(body) || !isObject(body.existingTwin) || !isString(body.additionalInput)) {
    return res.status(400).json({
      error: 'Ungültiger Request. Erwartet: existingTwin, additionalInput.',
      receivedKeys: isObject(body) ? Object.keys(body) : []
    })
  }

  const { existingTwin, additionalInput, originalInput, contextAnswers } = body as unknown as TwinUpdateRequest

  if (additionalInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Input zu lang. Max ${MAX_INPUT_LENGTH} Zeichen.` })
  }

  if (!contextAnswers?.length && isInsufficientUpdateInput(additionalInput)) {
    return res.status(400).json({
      error: 'Ergänzung zu allgemein. Bitte konkrete Info (Budget, Frist, Entscheidung).',
      errorType: 'insufficient_update_context'
    })
  }

  try {
    console.log('[Update API] Starting update:', {
      projectTitle: existingTwin.project.title,
      additionalInputPreview: additionalInput.substring(0, 50)
    })

    const updatedAnalysis = await callBridgeForUpdate(
      existingTwin,
      additionalInput,
      originalInput || '',
      contextAnswers
    )

    console.log('[Update API] Success:', {
      newTitle: updatedAnalysis.project.title,
      newConfidence: updatedAnalysis.quality.confidence
    })

    // Antwort im Format das Frontend erwartet
    return res.status(200).json({
      analysis: updatedAnalysis,
      updateSummary: 'Project Twin aktualisiert.',
      changedFields: detectChangedFields(existingTwin, updatedAnalysis).map(f => ({
        field: f,
        before: 'vorher',
        after: 'nachher'
      })),
      newProgress: {
        percent: updatedAnalysis.quality.confidence === 'high' ? 85 : 
                 updatedAnalysis.quality.confidence === 'medium' ? 60 : 35,
        level: updatedAnalysis.quality.confidence === 'high' ? 3 : 
               updatedAnalysis.quality.confidence === 'medium' ? 2 : 1,
        stage: updatedAnalysis.quality.missingContext.length === 0 ? 'clarified' : 'needs_context'
      },
      meta: {
        updatedAt: new Date().toISOString(),
        updateType: 'refinement',
        promptVersion: PROMPT_VERSION
      }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler.'
    console.error('[Update API] Error:', message)
    
    if (message.includes('TIMEOUT') || message.includes('timed out')) {
      return res.status(504).json({
        error: 'Die Aktualisierung hat zu lange gedauert. Bitte versuche es erneut.',
        errorType: 'timeout'
      })
    }
    
    return res.status(502).json({ error: message })
  }
}
