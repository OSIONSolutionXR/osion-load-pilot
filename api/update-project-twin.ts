import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000
const PROMPT_VERSION = 'loadpilot_v2'

const DISALLOWED_FALLBACK_PHRASES = [
  'Projektlage mit mehreren offenen Punkten',
  'Top-1-Hebel festlegen',
  'Verzettelung',
  'Den unmittelbarsten Geld- oder Blockerhebel zuerst bewegen',
  'Ohne Priorisierung bleibt die Lage diffus',
  'Keine Nachrichtenvorlage erforderlich'
]

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
  previousUpdates?: unknown[]
  currentProgress?: {
    percent: number
    level: number
    stage: string
  }
}

type BridgeRequest = {
  jobType: 'loadpilot_project_twin_update'
  promptVersion: typeof PROMPT_VERSION
  existingTwin: Record<string, unknown>
  additionalInput: string
  originalInput: string
  contextAnswers?: ContextAnswer[]
  updateMode: 'refine_existing_twin'
  outputFormat: 'project_twin_json'
  compactTwinContext: Record<string, unknown>
}

type BridgeEnvelope = {
  result?: unknown
  error?: string
}

// Helper functions
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isEnum<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && allowed.includes(value as T)
}

function containsDisallowedFallbackPhrase(value: string): boolean {
  return DISALLOWED_FALLBACK_PHRASES.some((phrase) => value.includes(phrase))
}

function validateAnalysis(data: unknown): data is ProjectTwinAnalysis {
  if (!isObject(data)) return false
  
  const { project, nextMove, actors, dependencies, risks, scenarios, actions, quality } = data
  
  if (!isObject(project) || !isObject(nextMove) || !isObject(quality)) return false
  if (!Array.isArray(actors) || !Array.isArray(dependencies) || !Array.isArray(risks) || 
      !Array.isArray(scenarios) || !Array.isArray(actions)) return false

  const validProject =
    isString(project.title) &&
    isString(project.description) &&
    isEnum(project.status, ['active', 'blocked', 'waiting', 'parked'] as const)

  const validNextMove =
    isString(nextMove.title) &&
    isString(nextMove.reason) &&
    isEnum(nextMove.effort, ['low', 'medium', 'high'] as const) &&
    isEnum(nextMove.impact, ['low', 'medium', 'high'] as const)

  const validQuality =
    isEnum(quality.inputQuality, ['insufficient', 'usable', 'strong'] as const) &&
    typeof quality.isActionable === 'boolean' &&
    isEnum(quality.confidence, ['low', 'medium', 'high'] as const) &&
    Array.isArray(quality.missingContext) &&
    quality.missingContext.every((item) => typeof item === 'string') &&
    isString(quality.reason)

  return validProject && validNextMove && validQuality
}

function assertNoGenericOutput(analysis: ProjectTwinAnalysis): void {
  const allText = JSON.stringify(analysis).toLowerCase()
  if (containsDisallowedFallbackPhrase(allText)) {
    throw new Error('Analysis contains generic fallback phrases')
  }
}

// Kompakte Twin-Zusammenfassung für Updates bauen
function buildCompactTwinContext(existingTwin: ProjectTwinAnalysis): Record<string, unknown> {
  return {
    project: {
      title: existingTwin.project.title,
      description: existingTwin.project.description.substring(0, 500),
      type: existingTwin.project.type,
      status: existingTwin.project.status
    },
    nextMove: {
      title: existingTwin.nextMove.title,
      reason: existingTwin.nextMove.reason.substring(0, 300),
      effort: existingTwin.nextMove.effort,
      impact: existingTwin.nextMove.impact
    },
    actors: existingTwin.actors.slice(0, 5).map(a => ({ name: a.name, role: a.role })),
    dependencies: existingTwin.dependencies.slice(0, 5).map(d => ({ 
      from: d.from, to: d.to, isBlocker: d.isBlocker 
    })),
    risks: existingTwin.risks.slice(0, 5).map(r => ({ title: r.title, severity: r.severity })),
    actions: existingTwin.actions.slice(0, 5).map(a => ({ 
      title: a.title, priority: a.priority 
    })),
    quality: {
      confidence: existingTwin.quality.confidence,
      missingContext: existingTwin.quality.missingContext.slice(0, 10)
    }
  }
}

// Prüfe ob Update-Input zu schwach ist - erlaubt kurze konkrete Antworten aus Kontextfragen
function isInsufficientUpdateInput(additionalInput: string, contextAnswers?: ContextAnswer[]): boolean {
  const trimmed = additionalInput.trim()
  
  // Wenn es Kontext-Antworten gibt, ist der Input valid (wurde aus Fragen gebaut)
  if (contextAnswers && contextAnswers.length > 0) {
    return false
  }
  
  // Für manuelle Eingaben: striktere Prüfung
  if (trimmed.length < 10) return true
  if (/^(test|abc|123|asdf|xyz|nein|ja|ok|nope|maybe)$/iu.test(trimmed)) return true
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 3) return true
  const concreteWords = /\b(budget|kosten|euro|€|termin|frist|datum|monat|woche|tag|entscheid|ja|nein|vielleicht|später|früher|mehr|weniger|neu|alt|web|app|desktop|mobile|version|mvp|pilot)\b/gi
  if (!concreteWords.test(trimmed) && wordCount < 5) return true
  return false
}

// Update-Prompt für Kimi
const UPDATE_PROMPT = `Du bist OSION Load Pilot im UPDATE-Modus.

AUFGABE: Aktualisiere einen bestehenden Project Twin mit neuem Kontext.

WICHTIGE REGELN:
1. Bewahre den bestehenden Twin als Basis - verwerfe NICHT alles
2. Integriere den neuen Kontext INTELLIGENT
3. Aktualisiere das Next Move, wenn der neue Kontext dies rechtfertigt
4. Erhöhe confidence (low→medium→high), wenn wichtige Lücken geschlossen wurden
5. Reduziere missingContext für geklärte Punkte
6. Füge neue Akteure/Risiken/Aktionen nur hinzu, wenn sie im neuen Kontext erwähnt werden

Schema:
{
  "project": { "title": "string", "description": "string", "type": "string", "status": "active|blocked|waiting|parked" },
  "nextMove": { "title": "string", "reason": "string", "effort": "low|medium|high", "impact": "low|medium|high", "deadline": "string|null" },
  "actors": [{"name": "string", "role": "string", "influence": "low|medium|high", "waitingFor": "string|null"}],
  "dependencies": [{"from": "string", "to": "string", "status": "required|blocked|waiting|done", "isBlocker": true, "explanation": "string"}],
  "risks": [{"title": "string", "severity": "low|medium|high", "explanation": "string"}],
  "scenarios": [{"title": "string", "outcome": "string", "riskLevel": "low|medium|high", "recommendation": "string"}],
  "actions": [{"title": "string", "owner": "string", "priority": "low|medium|high", "messageDraft": "string|null"}],
  "quality": { "inputQuality": "insufficient|usable|strong", "isActionable": true, "confidence": "low|medium|high", "missingContext": ["string"], "reason": "string" }
}

Antworte NUR mit validem JSON. Keine Markdown-Fences.`

// Vereinheitlichter Bridge-Call (gleich wie Input-Analyse)
async function callBridgeForUpdate(
  compactTwinContext: Record<string, unknown>,
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

  const payload: BridgeRequest = {
    jobType: 'loadpilot_project_twin_update',
    promptVersion: PROMPT_VERSION,
    existingTwin: {}, // Legacy-Feld, wird nicht genutzt
    additionalInput: additionalInput.trim(),
    originalInput,
    contextAnswers,
    updateMode: 'refine_existing_twin',
    outputFormat: 'project_twin_json',
    compactTwinContext
  }

  console.log('[Update Bridge] Calling bridge:', {
    baseUrl: bridgeUrl?.replace(/\/bridge\/.*$/, '').replace(/\/+$/, ''),
    hasContextAnswers: Boolean(contextAnswers?.length),
    additionalInputLength: additionalInput.length
  })

  try {
    // Extrahiere Base-URL ohne Pfad (z.B. http://host:port)
    const baseUrl = bridgeUrl.replace(/\/bridge\/.*$/, '').replace(/\/+$/, '')
    const updateUrl = `${baseUrl}/bridge/update-project-twin`
    
    console.log('[Update Bridge] Final URL:', updateUrl)
    
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
      const errorMsg = body.error || `Bridge error: ${response.status}`
      console.error('[Update Bridge] Bridge error:', errorMsg)
      throw new Error(errorMsg)
    }

    const result = isObject(body) && 'result' in body ? body.result : body

    if (!validateAnalysis(result)) {
      console.error('[Update Bridge] Invalid analysis structure')
      throw new Error('OpenClaw Bridge hat kein valides Project-Twin-JSON zurückgegeben.')
    }

    assertNoGenericOutput(result as ProjectTwinAnalysis)

    return result as ProjectTwinAnalysis
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

  const body = req.body as unknown

  if (!isObject(body) || !isObject(body.existingTwin) || !isString(body.additionalInput) || 
      !isString(body.originalInput) || body.updateMode !== 'refine_existing_twin') {
    return res.status(400).json({
      error: 'Ungültiges Update-Request. Erwartet: existingTwin, additionalInput, originalInput, updateMode.',
      receivedKeys: isObject(body) ? Object.keys(body) : []
    })
  }

  const { existingTwin, additionalInput, originalInput, contextAnswers } = body as unknown as TwinUpdateRequest

  if (additionalInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Additional Input ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  // Prüfe auf zu schwachen Input (nur für manuelle Eingaben ohne Kontext-Antworten)
  if (!contextAnswers?.length && isInsufficientUpdateInput(additionalInput)) {
    return res.status(400).json({
      error: 'Diese Ergänzung ist noch zu allgemein. Ergänze bitte eine konkrete neue Information (z.B. Budget, Frist, Entscheidung, Status).',
      errorType: 'insufficient_update_context'
    })
  }

  try {
    const compactContext = buildCompactTwinContext(existingTwin)
    
    console.log('[Update API] Starting update:', {
      hasExistingTwin: !!existingTwin,
      hasContextAnswers: !!contextAnswers?.length,
      additionalInputLength: additionalInput.length
    })
    
    const updatedAnalysis = await callBridgeForUpdate(compactContext, additionalInput, originalInput, contextAnswers)
    
    console.log('[Update API] Bridge returned analysis:', {
      title: updatedAnalysis.project.title,
      confidence: updatedAnalysis.quality.confidence
    })

    const response = {
      analysis: updatedAnalysis,
      updateSummary: 'Project Twin mit neuem Kontext aktualisiert.',
      changedFields: detectChangedFields(existingTwin, updatedAnalysis).map(field => ({
        field,
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
        fieldsModified: detectChangedFields(existingTwin, updatedAnalysis),
        promptVersion: PROMPT_VERSION,
        jobType: 'loadpilot_project_twin_update',
        mode: 'openclaw-kimi'
      }
    }

    return res.status(200).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Update-Fehler.'
    
    console.error('[Update API] Error:', message)
    
    // Timeout erkennen
    if (message.includes('TIMEOUT') || message.includes('timed out') || message.includes('abort')) {
      return res.status(504).json({
        error: 'Die Aktualisierung hat zu lange gedauert. Deine Eingaben wurden nicht gelöscht. Bitte versuche es mit weniger Text oder konkreteren Angaben erneut.',
        errorType: 'timeout'
      })
    }
    
    // Insufficient input erkennen
    if (message.includes('INSUFFICIENT_UPDATE')) {
      return res.status(400).json({
        error: message.replace('INSUFFICIENT_UPDATE: ', ''),
        errorType: 'insufficient_update_context'
      })
    }
    
    return res.status(502).json({ error: message })
  }
}
