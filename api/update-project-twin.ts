import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

const UPDATE_PROMPT = `Du bist OSION Load Pilot im UPDATE-Modus.

AUFGABE: Aktualisiere einen bestehenden Project Twin mit neuem Kontext.

WICHTIGE REGELN:
1. Bewahre den bestehenden Twin als Basis - verwerfe NICHT alles
2. Integriere den neuen Kontext INTELLIGENT
3. Aktualisiere das Next Move, wenn der neue Kontext dies rechtfertigt
4. Erhöhe confidence (low→medium→high), wenn wichtige Lücken geschlossen wurden
5. Reduziere missingContext für geklärte Punkte
6. Füge neue Akteure/Risiken/Aktionen nur hinzu, wenn sie im neuen Kontext erwähnt werden

VERHALTEN BEI CONFIDENCE:
- "low" → "medium" oder "high", wenn wichtige Lücken geschlossen
- Nur "low" behalten, wenn noch kritische Informationen fehlen

Antworte NUR mit validem JSON im ProjectTwinAnalysis-Schema. Keine Markdown-Fences.`

const ALLOWED_JOB_TYPE = 'loadpilot_project_twin_update'
const ALLOWED_PROMPT_VERSION = 'loadpilot_v2'

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
}

interface ContextAnswer {
  questionId: string
  label: string
  answer: string
  sourceMissingContext: string
}

interface TwinUpdateRequest {
  jobType?: string
  promptVersion?: string
  outputFormat?: string
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

interface TwinUpdateResponse {
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
    promptVersion: string
    jobType: string
    mode: string
  }
}

type BridgeRequest = {
  jobType: typeof ALLOWED_JOB_TYPE
  promptVersion: typeof ALLOWED_PROMPT_VERSION
  input: string
  outputFormat: 'project_twin_json'
  prompt: string
  agents: string[]
  context: {
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
}

type BridgeEnvelope = {
  result?: unknown
  outputs?: Array<{ text?: string }>
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

function stripJsonFences(value: string): string {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function validateAnalysis(data: unknown): data is ProjectTwinAnalysis {
  if (!isObject(data)) {
    console.log('[API] Validation failed: data is not an object')
    return false
  }

  const { project, nextMove, actors, dependencies, risks, scenarios, actions, quality } = data
  
  if (!isObject(project)) {
    console.log('[API] Validation failed: project is not an object')
    return false
  }
  if (!isObject(nextMove)) {
    console.log('[API] Validation failed: nextMove is not an object')
    return false
  }
  if (!isObject(quality)) {
    console.log('[API] Validation failed: quality is not an object')
    return false
  }
  if (!Array.isArray(actors)) {
    console.log('[API] Validation failed: actors is not an array')
    return false
  }
  if (!Array.isArray(dependencies)) {
    console.log('[API] Validation failed: dependencies is not an array')
    return false
  }
  if (!Array.isArray(risks)) {
    console.log('[API] Validation failed: risks is not an array')
    return false
  }
  if (!Array.isArray(scenarios)) {
    console.log('[API] Validation failed: scenarios is not an array')
    return false
  }
  if (!Array.isArray(actions)) {
    console.log('[API] Validation failed: actions is not an array')
    return false
  }

  const validProject =
    isString(project.title) &&
    isString(project.description) &&
    isString(project.type) &&
    isEnum(project.status, ['active', 'blocked', 'waiting', 'parked'] as const)

  if (!validProject) {
    console.log('[API] Validation failed: project fields invalid')
    return false
  }

  const validNextMove =
    isString(nextMove.title) &&
    isString(nextMove.reason) &&
    isEnum(nextMove.effort, ['low', 'medium', 'high'] as const) &&
    isEnum(nextMove.impact, ['low', 'medium', 'high'] as const) &&
    isNullableString(nextMove.deadline)

  if (!validNextMove) {
    console.log('[API] Validation failed: nextMove fields invalid')
    return false
  }

  const validActors = actors.every((actor) =>
    isObject(actor) &&
    isString(actor.name) &&
    isString(actor.role) &&
    isEnum(actor.influence, ['low', 'medium', 'high'] as const) &&
    isNullableString(actor.waitingFor)
  )

  if (!validActors) {
    console.log('[API] Validation failed: actors invalid')
    return false
  }

  const validDependencies = dependencies.every((dependency) =>
    isObject(dependency) &&
    isString(dependency.from) &&
    isString(dependency.to) &&
    isEnum(dependency.status, ['required', 'blocked', 'waiting', 'done'] as const) &&
    typeof dependency.isBlocker === 'boolean' &&
    isString(dependency.explanation)
  )

  if (!validDependencies) {
    console.log('[API] Validation failed: dependencies invalid')
    return false
  }

  const validRisks = risks.every((risk) =>
    isObject(risk) &&
    isString(risk.title) &&
    isEnum(risk.severity, ['low', 'medium', 'high'] as const) &&
    isString(risk.explanation)
  )

  if (!validRisks) {
    console.log('[API] Validation failed: risks invalid')
    return false
  }

  const validScenarios = scenarios.every((scenario) =>
    isObject(scenario) &&
    isString(scenario.title) &&
    isString(scenario.outcome) &&
    isEnum(scenario.riskLevel, ['low', 'medium', 'high'] as const) &&
    isString(scenario.recommendation)
  )

  if (!validScenarios) {
    console.log('[API] Validation failed: scenarios invalid')
    return false
  }

  const validActions = actions.every((action) =>
    isObject(action) &&
    isString(action.title) &&
    isString(action.owner) &&
    isEnum(action.priority, ['low', 'medium', 'high'] as const) &&
    (!('messageDraft' in action) || isNullableString(action.messageDraft))
  )

  if (!validActions) {
    console.log('[API] Validation failed: actions invalid')
    return false
  }

  const validQuality =
    isEnum(quality.inputQuality, ['insufficient', 'usable', 'strong'] as const) &&
    typeof quality.isActionable === 'boolean' &&
    isEnum(quality.confidence, ['low', 'medium', 'high'] as const) &&
    Array.isArray(quality.missingContext) &&
    quality.missingContext.every((item) => typeof item === 'string') &&
    isString(quality.reason)

  if (!validQuality) {
    console.log('[API] Validation failed: quality fields invalid')
    return false
  }

  return true
}

function validateUpdateRequest(body: unknown): body is TwinUpdateRequest {
  if (!isObject(body)) {
    console.log('[API] Request validation failed: body is not an object')
    return false
  }

  const { existingTwin, additionalInput, originalInput, updateMode } = body

  if (!isObject(existingTwin)) {
    console.log('[API] Request validation failed: existingTwin is not an object')
    return false
  }
  if (!isString(additionalInput)) {
    console.log('[API] Request validation failed: additionalInput is not a string')
    return false
  }
  if (!isString(originalInput)) {
    console.log('[API] Request validation failed: originalInput is not a string')
    return false
  }
  if (updateMode !== 'refine_existing_twin') {
    console.log('[API] Request validation failed: updateMode is not "refine_existing_twin"')
    return false
  }

  // Validate the existing twin structure
  if (!validateAnalysis(existingTwin)) {
    console.log('[API] Request validation failed: existingTwin is not a valid analysis')
    return false
  }

  return true
}

async function callBridgeUpdate(payload: TwinUpdateRequest): Promise<ProjectTwinAnalysis> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  console.log('[API] Bridge config check:', {
    hasUrl: !!bridgeUrl,
    hasSecret: !!bridgeSecret,
    urlPreview: bridgeUrl ? bridgeUrl.slice(0, 30) + '...' : 'missing'
  })

  if (!bridgeUrl || !bridgeSecret) {
    throw new Error('OpenClaw Bridge ist nicht konfiguriert. OPENCLAW_BRIDGE_URL oder OPENCLAW_BRIDGE_SECRET fehlt.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const bridgePayload: BridgeRequest = {
    jobType: ALLOWED_JOB_TYPE,
    promptVersion: ALLOWED_PROMPT_VERSION,
    input: payload.additionalInput,
    outputFormat: 'project_twin_json',
    prompt: UPDATE_PROMPT,
    agents: [
      'project_detector',
      'actor_mapper',
      'dependency_graph_builder',
      'risk_simulator',
      'scenario_generator',
      'next_move_synthesizer'
    ],
    context: {
      existingTwin: payload.existingTwin,
      additionalInput: payload.additionalInput,
      originalInput: payload.originalInput,
      updateMode: 'refine_existing_twin',
      contextAnswers: payload.contextAnswers,
      previousUpdates: payload.previousUpdates,
      currentProgress: payload.currentProgress
    }
  }

  console.log('[API] Sending to bridge:', {
    url: bridgeUrl.slice(0, 40) + '...',
    jobType: bridgePayload.jobType,
    hasExistingTwin: !!bridgePayload.context.existingTwin,
    additionalInputLength: bridgePayload.context.additionalInput.length,
    hasContextAnswers: !!bridgePayload.context.contextAnswers?.length
  })

  try {
    const response = await fetch(bridgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bridgeSecret}`
      },
      body: JSON.stringify(bridgePayload),
      signal: controller.signal
    })

    console.log('[API] Bridge response status:', response.status)

    const body = (await response.json().catch((err) => {
      console.log('[API] Failed to parse bridge response:', err)
      return {}
    })) as BridgeEnvelope

    if (!response.ok) {
      const errorMsg = body.error || `HTTP ${response.status}`
      console.log('[API] Bridge returned error:', errorMsg)
      throw new Error(`OpenClaw Bridge hat die Update-Anfrage abgelehnt: ${errorMsg}`)
    }

    // Handle different response structures
    let result: unknown
    
    if (body.outputs && Array.isArray(body.outputs) && body.outputs[0]?.text) {
      // OpenClaw infer model response with outputs array
      const content = body.outputs[0].text
      console.log('[API] Parsing outputs[0].text, length:', content.length)
      try {
        result = JSON.parse(stripJsonFences(content.trim()))
      } catch (err) {
        console.log('[API] Failed to parse outputs[0].text:', err)
        throw new Error('OpenClaw Bridge hat kein valides JSON zurückgegeben.')
      }
    } else if (body.result) {
      // Direct result object
      result = body.result
    } else {
      // Check if body itself is the analysis
      result = body
    }

    console.log('[API] Result type:', typeof result, 'isObject:', isObject(result))
    console.log('[API] Result keys:', isObject(result) ? Object.keys(result) : 'N/A')

    if (!validateAnalysis(result)) {
      console.log('[API] Validation failed for bridge result')
      throw new Error('OpenClaw Bridge hat kein valides Project-Twin-JSON zurückgegeben.')
    }

    console.log('[API] Successfully validated analysis from bridge')
    return result
  } finally {
    clearTimeout(timeout)
  }
}

function detectChangedFields(
  oldAnalysis: ProjectTwinAnalysis,
  newAnalysis: ProjectTwinAnalysis
): string[] {
  const changed: string[] = []

  if (oldAnalysis.nextMove.title !== newAnalysis.nextMove.title) {
    changed.push('nextMove.title')
  }
  if (oldAnalysis.quality.confidence !== newAnalysis.quality.confidence) {
    changed.push('quality.confidence')
  }
  if (oldAnalysis.quality.missingContext.length !== newAnalysis.quality.missingContext.length) {
    changed.push('quality.missingContext')
  }
  if (oldAnalysis.project.description !== newAnalysis.project.description) {
    changed.push('project.description')
  }
  if (oldAnalysis.actors.length !== newAnalysis.actors.length) {
    changed.push('actors.count')
  }
  if (oldAnalysis.risks.length !== newAnalysis.risks.length) {
    changed.push('risks.count')
  }
  if (oldAnalysis.actions.length !== newAnalysis.actions.length) {
    changed.push('actions.count')
  }

  return changed
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
  }

  const body = req.body

  console.log('[API] Received request:', {
    method: req.method,
    hasBody: !!body,
    bodyKeys: body ? Object.keys(body) : [],
    contentType: req.headers['content-type']
  })

  if (!validateUpdateRequest(body)) {
    console.log('[API] Request validation failed, returning 400')
    return res.status(400).json({
      error: 'Ungültiges Update-Request. Erwartet: existingTwin, additionalInput, originalInput, updateMode.',
      receivedKeys: body ? Object.keys(body) : []
    })
  }

  const { existingTwin, additionalInput, originalInput, contextAnswers, previousUpdates, currentProgress } = body

  if (additionalInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Additional Input ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  console.log('[API] Processing update:', {
    projectTitle: existingTwin.project.title,
    additionalInputLength: additionalInput.length,
    hasContextAnswers: !!contextAnswers?.length,
    hasPreviousUpdates: !!previousUpdates?.length,
    hasCurrentProgress: !!currentProgress
  })

  try {
    const updatedAnalysis = await callBridgeUpdate({
      existingTwin,
      additionalInput,
      originalInput,
      updateMode: 'refine_existing_twin',
      contextAnswers,
      previousUpdates,
      currentProgress
    })

    const response: TwinUpdateResponse = {
      analysis: updatedAnalysis,
      updateSummary: 'Project Twin mit neuem Kontext aktualisiert.',
      changedFields: detectChangedFields(existingTwin, updatedAnalysis).map(field => ({
        field,
        before: 'vorher',
        after: 'nachher'
      })),
      meta: {
        updatedAt: new Date().toISOString(),
        updateType: 'refinement',
        fieldsModified: detectChangedFields(existingTwin, updatedAnalysis),
        promptVersion: ALLOWED_PROMPT_VERSION,
        jobType: ALLOWED_JOB_TYPE,
        mode: 'openclaw-kimi'
      }
    }

    console.log('[API] Update successful, returning 200')
    return res.status(200).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Update-Fehler.'
    console.log('[API] Update failed:', message)
    return res.status(502).json({ error: message })
  }
}
