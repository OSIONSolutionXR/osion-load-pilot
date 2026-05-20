import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 20000

const ANALYSIS_PROMPT = `Du bist OSION Load Pilot, eine Project-Twin-Analyse-Engine für überladene Unternehmer.

Du arbeitest intern mit folgenden Analyse-Rollen:
1. PROJECT-DETECTION-AGENT – erkennt Hauptprojekt, Nebenprojekte und Projektart.
2. ACTOR-MAPPING-AGENT – erkennt Personen, Institutionen, Rollen und wartende Parteien.
3. DEPENDENCY-GRAPH-AGENT – erkennt Abhängigkeiten, Dokumente, Fristen und Blocker.
4. RISK-SIMULATION-AGENT – simuliert, was passiert, wenn heute nichts passiert.
5. SCENARIO-AGENT – erzeugt 2 bis 4 sinnvolle Handlungsszenarien.
6. NEXT-MOVE-AGENT – ermittelt den nächsten wirksamsten Schritt.
7. SYNTHESIS-AGENT – verdichtet alles zu einem strukturierten Project-Twin-Ergebnis.

Wichtig:
- Keine freie Erzählantwort
- Keine Markdown-Antwort
- Keine Einleitung
- Nur valides JSON im vorgegebenen Schema`

const ALLOWED_JOB_TYPE = 'loadpilot_project_twin_analysis'
const ALLOWED_PROMPT_VERSION = 'loadpilot_v1'

type ProjectStatus = 'active' | 'blocked' | 'waiting' | 'parked'
type EffortLevel = 'low' | 'medium' | 'high'
type ImpactLevel = 'low' | 'medium' | 'high'
type InfluenceLevel = 'low' | 'medium' | 'high'
type DependencyStatus = 'required' | 'blocked' | 'waiting' | 'done'
type RiskSeverity = 'low' | 'medium' | 'high'
type ActionPriority = 'low' | 'medium' | 'high'

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
}

type BridgeRequest = {
  jobType: typeof ALLOWED_JOB_TYPE
  promptVersion: typeof ALLOWED_PROMPT_VERSION
  input: string
  outputFormat: 'project_twin_json'
  prompt: string
  agents: string[]
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

  const { project, nextMove, actors, dependencies, risks, scenarios, actions } = data
  if (!isObject(project) || !isObject(nextMove)) return false
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

  return validProject && validNextMove && validActors && validDependencies && validRisks && validScenarios && validActions
}

async function callBridge(input: string): Promise<ProjectTwinAnalysis> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  if (!bridgeUrl || !bridgeSecret) {
    throw new Error('OpenClaw Bridge ist nicht konfiguriert.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const payload: BridgeRequest = {
    jobType: ALLOWED_JOB_TYPE,
    promptVersion: ALLOWED_PROMPT_VERSION,
    input,
    outputFormat: 'project_twin_json',
    prompt: ANALYSIS_PROMPT,
    agents: [
      'project_detector',
      'actor_mapper',
      'dependency_graph_builder',
      'risk_simulator',
      'scenario_generator',
      'next_move_synthesizer'
    ]
  }

  try {
    const response = await fetch(bridgeUrl, {
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
      throw new Error(body.error || 'OpenClaw Bridge hat die Anfrage abgelehnt.')
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
  }

  const input = typeof req.body?.input === 'string' ? req.body.input.trim() : ''

  if (!input) {
    return res.status(400).json({ error: 'Input fehlt.' })
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Input ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  try {
    const analysis = await callBridge(input)
    return res.status(200).json(analysis)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Analysefehler.'
    return res.status(502).json({ error: message })
  }
}
