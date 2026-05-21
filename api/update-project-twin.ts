import type { VercelRequest, VercelResponse } from '@vercel/node'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

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

// Helper functions
function stripJsonFences(value: string): string {
  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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

// Prüfe ob Update-Input zu schwach ist
function isInsufficientUpdateInput(additionalInput: string): boolean {
  const trimmed = additionalInput.trim()
  if (trimmed.length < 10) return true
  if (/^(test|abc|123|asdf|xyz|nein|ja|ok|nope|maybe)$/iu.test(trimmed)) return true
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 3) return true
  const concreteWords = /\b(budget|kosten|euro|€|termin|frist|datum|monat|woche|tag|entscheid|ja|nein|vielleicht|später|früher|mehr|weniger|neu|alt|web|app|desktop|mobile|version|mvp|pilot)\b/gi
  if (!concreteWords.test(trimmed) && wordCount < 5) return true
  return false
}

async function callOpenClawForUpdate(
  compactTwinContext: Record<string, unknown>, 
  additionalInput: string
): Promise<ProjectTwinAnalysis> {
  if (isInsufficientUpdateInput(additionalInput)) {
    throw new Error('INSUFFICIENT_UPDATE: Die Ergänzung ist noch zu allgemein. Bitte ergänze eine konkrete Information (z.B. Budget, Frist, Entscheidung, Status).')
  }

  const prompt = `Du bist OSION Load Pilot im UPDATE-Modus.

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

  const contextPrompt = [
    'AUFGABE: Aktualisiere einen bestehenden OSION Project Twin mit neuem Kontext.',
    '',
    'BESTEHENDER PROJECT TWIN (Kompakt):',
    JSON.stringify(compactTwinContext, null, 2),
    '',
    'NEUER KONTEXT:',
    additionalInput.trim(),
    '',
    prompt
  ].join('\n')

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['infer', 'model', 'run', '--gateway', '--model', 'ollama/kimi-k2.5:cloud', '--prompt', contextPrompt, '--thinking', 'off', '--json'],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }
    )

    // Parse envelope response
    const envelope = JSON.parse(stdout)
    
    let content: string
    if (envelope?.outputs && Array.isArray(envelope.outputs) && envelope.outputs[0]?.text) {
      content = envelope.outputs[0].text
    } else if (envelope?.result) {
      content = JSON.stringify(envelope.result)
    } else {
      content = stdout
    }

    const parsed = JSON.parse(stripJsonFences(content.trim()))
    
    if (!validateAnalysis(parsed)) {
      throw new Error('OpenClaw returned invalid analysis structure')
    }

    assertNoGenericOutput(parsed)

    return parsed
  } catch (error) {
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      throw new Error('TIMEOUT: OpenClaw infer timed out - Die Aktualisierung hat zu lange gedauert. Bitte versuche es mit weniger Text oder konkreteren Angaben erneut.')
    }
    throw error
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

  const { existingTwin, additionalInput, originalInput } = body as unknown as TwinUpdateRequest

  if (additionalInput.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Additional Input ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  // Prüfe auf zu schwachen Input
  if (isInsufficientUpdateInput(additionalInput)) {
    return res.status(400).json({
      error: 'Diese Ergänzung ist noch zu allgemein. Ergänze bitte eine konkrete neue Information (z.B. Budget, Frist, Entscheidung, Status).',
      errorType: 'insufficient_update_context'
    })
  }

  try {
    const compactContext = buildCompactTwinContext(existingTwin)
    const updatedAnalysis = await callOpenClawForUpdate(compactContext, additionalInput)

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
    
    // Timeout erkennen
    if (message.includes('TIMEOUT') || message.includes('timed out')) {
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
