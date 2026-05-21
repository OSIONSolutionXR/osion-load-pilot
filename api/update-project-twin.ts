import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

const UPDATE_PROMPT = `Du bist OSION Load Pilot, eine Project-Twin-Update-Engine für überladene Unternehmer.

Deine Aufgabe: Aktualisiere einen bestehenden Project Twin basierend auf zusätzlichem Kontext.

Regeln:
1. Bewahre alle relevanten Informationen aus dem bestehenden Twin
2. Integriere den neuen Kontext sinnvoll
3. Aktualisiere das Next Move, wenn der neue Kontext dies rechtfertigt
4. Erhöhe das Confidence-Level, wenn wichtige Lücken geschlossen wurden
5. Reduziere missingContext für geklärte Punkte
6. Füge neue Akteure hinzu, wenn sie im neuen Kontext erwähnt werden
7. Passe Risiken an, wenn neue Informationen die Risikolage verändern
8. Aktualisiere Abhängigkeiten, wenn der Kontext neue Blocker oder Pfade aufzeigt

Wichtig:
- Keine freie Erzählantwort
- Keine Markdown-Antwort
- Keine Einleitung
- Nur valides JSON im vorgegebenen Schema
- Der Twin sollte sich SUBSTANTIELL verbessern, nicht nur kosmetisch ändern`

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
  meta: {
    domain: string
    analysisMode: 'openclaw-kimi'
    promptVersion: string
    generatedAt: string
  }
}

interface TwinUpdateRequest {
  existingTwin: ProjectTwinAnalysis
  additionalInput: string
  originalInput: string
  updateMode: 'refine_existing_twin'
}

interface TwinUpdateResponse {
  analysis: ProjectTwinAnalysis
  meta: {
    updatedAt: string
    updateType: 'refinement'
    fieldsModified: string[]
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
  }
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
  if (!Array.isArray(actors) || !Array.isArray(dependencies) || !Array.isArray(risks) || !Array.isArray(scenarios) || !Array.isArray(actions)) return false

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

  return validProject && validNextMove && validActors && validDependencies && validRisks && validScenarios && validActions && validQuality && validMeta
}

function validateUpdateRequest(body: unknown): body is TwinUpdateRequest {
  if (!isObject(body)) return false

  const { existingTwin, additionalInput, originalInput, updateMode } = body

  if (!isObject(existingTwin)) return false
  if (!isString(additionalInput)) return false
  if (!isString(originalInput)) return false
  if (updateMode !== 'refine_existing_twin') return false

  return validateAnalysis(existingTwin)
}

async function callBridgeUpdate(payload: TwinUpdateRequest): Promise<ProjectTwinAnalysis> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  if (!bridgeUrl || !bridgeSecret) {
    throw new Error('OpenClaw Bridge ist nicht konfiguriert.')
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
      updateMode: 'refine_existing_twin'
    }
  }

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

    const body = (await response.json().catch(() => ({}))) as BridgeEnvelope

    if (!response.ok) {
      throw new Error(body.error || 'OpenClaw Bridge hat die Update-Anfrage abgelehnt.')
    }

    const result = isObject(body) && 'result' in body ? body.result : body

    if (!validateAnalysis(result)) {
      throw new Error('OpenClaw Bridge hat kein valides Project-Twin-JSON zurückgegeben.')
    }

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

  if (!validateUpdateRequest(body)) {
    return res.status(400).json({
      error: 'Ungültiges Update-Request. Erwartet: existingTwin, additionalInput, originalInput, updateMode.'
    })
  }

  const { existingTwin, additionalInput, originalInput } = body

  if (additionalInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Additional Input ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  try {
    const updatedAnalysis = await callBridgeUpdate({
      existingTwin,
      additionalInput,
      originalInput,
      updateMode: 'refine_existing_twin'
    })

    const response: TwinUpdateResponse = {
      analysis: updatedAnalysis,
      meta: {
        updatedAt: new Date().toISOString(),
        updateType: 'refinement',
        fieldsModified: detectChangedFields(existingTwin, updatedAnalysis)
      }
    }

    return res.status(200).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Update-Fehler.'
    return res.status(502).json({ error: message })
  }
}
