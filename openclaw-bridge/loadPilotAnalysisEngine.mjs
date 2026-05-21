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

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value) {
  return typeof value === 'string'
}

function isNullableString(value) {
  return value === null || typeof value === 'string'
}

function isEnum(value, allowed) {
  return typeof value === 'string' && allowed.includes(value)
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function stripJsonFences(value) {
  return value.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim()
}

function containsDisallowedFallbackPhrase(value) {
  return DISALLOWED_FALLBACK_PHRASES.some((phrase) => value.includes(phrase))
}

function isClearlyInsufficientInput(input) {
  const trimmed = input.trim()
  if (!trimmed) return true
  if (trimmed.length < 4) return true
  if (/^[\W\d_?!.+\-=\/\\]+$/u.test(trimmed)) return true
  if (/^(abc|test|hallo|hello|hi|123|\?+|auto)$/iu.test(trimmed)) return true
  if (trimmed.split(/\s+/).length === 1 && trimmed.length < 10) return true
  return false
}

function detectDomainFromInput(input) {
  const normalized = input.toLowerCase()
  if (/(auto|fahrzeug|kaufen)/u.test(normalized)) return 'private_purchase'
  if (/(ferienhaus|auslast|buchung|gäste)/u.test(normalized)) return 'hospitality_growth'
  if (/(kunden|verkauf|leads|angebot)/u.test(normalized)) return 'sales'
  if (/(website|webseite|seite|landingpage)/u.test(normalized)) return 'operations'
  return 'internal_project'
}

// Kompakte Twin-Zusammenfassung für Updates bauen
function buildCompactTwinContext(existingTwin) {
  if (!existingTwin) return {}

  // Nur die wesentlichen Felder extrahieren
  const compact = {
    project: {
      title: existingTwin.project?.title || '',
      description: existingTwin.project?.description?.substring(0, 500) || '',
      type: existingTwin.project?.type || 'internal_project',
      status: existingTwin.project?.status || 'active'
    },
    nextMove: {
      title: existingTwin.nextMove?.title || '',
      reason: existingTwin.nextMove?.reason?.substring(0, 300) || '',
      effort: existingTwin.nextMove?.effort || 'low',
      impact: existingTwin.nextMove?.impact || 'medium'
    },
    actors: (existingTwin.actors || []).slice(0, 5).map(a => ({ name: a.name, role: a.role })),
    dependencies: (existingTwin.dependencies || []).slice(0, 5).map(d => ({ from: d.from, to: d.to, isBlocker: d.isBlocker })),
    risks: (existingTwin.risks || []).slice(0, 5).map(r => ({ title: r.title, severity: r.severity })),
    actions: (existingTwin.actions || []).slice(0, 5).map(a => ({ title: a.title, priority: a.priority })),
    quality: {
      confidence: existingTwin.quality?.confidence || 'low',
      missingContext: (existingTwin.quality?.missingContext || []).slice(0, 10)
    }
  }

  return compact
}

// Prüfe ob Update-Input zu schwach ist
function isInsufficientUpdateInput(additionalInput) {
  const trimmed = additionalInput.trim()
  if (trimmed.length < 10) return true
  if (/^(test|abc|123|asdf|xyz|nein|ja|ok|nope|maybe)$/iu.test(trimmed)) return true
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 3) return true
  // Prüfe auf konkrete Information
  const concreteWords = /\b(budget|kosten|euro|€|termin|frist|datum|monat|woche|tag|entscheid|ja|nein|vielleicht|später|früher|mehr|weniger|neu|alt|web|app|desktop|mobile|version|mvp|pilot)\b/gi
  if (!concreteWords.test(trimmed) && wordCount < 5) return true
  return false
}

function validateAnalysis(data) {
  if (!isObject(data)) return false
  if (!isObject(data.project) || !isObject(data.nextMove)) return false

  return (
    isString(data.project.title) &&
    isString(data.project.description) &&
    isEnum(data.project.status, ['active', 'blocked', 'waiting', 'parked'])
  )
}

function assertNoGenericOutput(analysis) {
  const allText = JSON.stringify(analysis).toLowerCase()
  if (containsDisallowedFallbackPhrase(allText)) {
    throw new Error('Analysis contains generic fallback phrases')
  }
}

async function callOpenClawGateway(prompt, input) {
  const fullPrompt = `Du bist OSION Load Pilot. Antworte nur mit validem JSON, ohne Markdown, ohne Einleitung.
Keine Demo-Daten und keine generischen Platzhalter.
Bewerte streng nach diesen Klassen:
1) Müllinput (z.B. "ABC", "Test", "???", "123", "Hallo", "asdf", isolierte Einzelwörter): inputQuality="insufficient", isActionable=false.
2) Grober Zielinput mit klarem Zielsatz (z.B. "Ich will ein Auto kaufen", "Ich will mein Ferienhaus besser auslasten"): inputQuality="usable", isActionable=true, confidence="low|medium", missingContext füllen.
3) Konkrete Lage mit Blockern/Akteuren/Fristen: inputQuality="usable|strong", isActionable=true, confidence="medium|high".
Nicht jeden kurzen Input als Müll werten. Ein klarer Zielsatz ist speicherfähig.

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

Nutzereingang: ${input}

${prompt}

Antworte ausschließlich mit validem JSON ohne Markdown.`

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['infer', 'model', 'run', '--gateway', '--model', 'ollama/kimi-k2.5:cloud', '--prompt', fullPrompt, '--thinking', 'off', '--json'],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 }
    )

    console.log('[Bridge Engine] Raw stdout length:', stdout.length)
    console.log('[Bridge Engine] stdout preview:', stdout.substring(0, 200))

    // Try to parse as envelope first
    let envelope
    try {
      envelope = JSON.parse(stdout)
      console.log('[Bridge Engine] Parsed envelope, keys:', Object.keys(envelope))
    } catch (err) {
      console.log('[Bridge Engine] Failed to parse as JSON envelope:', err.message)
      // Try direct parsing (old format)
      return JSON.parse(stripJsonFences(stdout.trim()))
    }

    // Extract content from envelope.outputs
    if (envelope?.outputs && Array.isArray(envelope.outputs) && envelope.outputs[0]?.text) {
      const content = envelope.outputs[0].text
      console.log('[Bridge Engine] Extracted from outputs[0].text, length:', content.length)
      return JSON.parse(stripJsonFences(content.trim()))
    }

    // Fallback: if envelope has result directly
    if (envelope?.result) {
      console.log('[Bridge Engine] Using envelope.result')
      return envelope.result
    }

    // Last resort: envelope itself might be the result
    console.log('[Bridge Engine] Using envelope as result')
    return envelope
  } catch (error) {
    console.error('[Bridge Engine] Error in callOpenClawGateway:', error.message)
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      throw new Error('TIMEOUT: OpenClaw infer timed out')
    }
    throw new Error(error instanceof Error ? error.message : 'OpenClaw infer failed')
  }
}

export async function analyzeProjectInput(input) {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('Input missing')
  if (trimmed.length > MAX_INPUT_LENGTH) throw new Error(`Input too long. Max ${MAX_INPUT_LENGTH} chars.`)

  try {
    const prompt = 'Erstelle einen konkreten Project Twin basierend auf dem Nutzereingang. Alle Details müssen zum Input passen.'
    const analysis = await callOpenClawGateway(prompt, trimmed)

    if (!validateAnalysis(analysis)) {
      throw new Error('Gateway returned invalid analysis structure')
    }

    assertNoGenericOutput(analysis)

    return {
      ...analysis,
      meta: {
        domain: analysis.project?.type || 'unclear',
        analysisMode: 'openclaw-kimi',
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Analysis failed:', error.message)
    throw new Error(`Analysis unavailable: ${error.message}`)
  }
}

// ==================== UPDATE / REFINEMENT (VEREINFACHT) ====================

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

async function callOpenClawGatewayForUpdate(compactTwinContext, additionalInput) {
  // Prüfe auf zu schwachen Update-Input
  if (isInsufficientUpdateInput(additionalInput)) {
    throw new Error('INSUFFICIENT_UPDATE: Die Ergänzung ist noch zu allgemein. Bitte ergänze eine konkrete Information (z.B. Budget, Frist, Entscheidung, Status).')
  }

  const contextPrompt = [
    'AUFGABE: Aktualisiere einen bestehenden OSION Project Twin mit neuem Kontext.',
    '',
    'BESTEHENDER PROJECT TWIN (Kompakt):',
    JSON.stringify(compactTwinContext, null, 2),
    '',
    'NEUER KONTEXT:',
    additionalInput.trim(),
    '',
    UPDATE_PROMPT
  ].join('\n')

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['infer', 'model', 'run', '--gateway', '--model', 'ollama/kimi-k2.5:cloud', '--prompt', contextPrompt, '--thinking', 'off', '--json'],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 1024 * 1024, encoding: 'utf8' }
    )

    console.log('[Bridge Engine Update] Raw stdout length:', stdout.length)
    console.log('[Bridge Engine Update] stdout preview:', stdout.substring(0, 200))

    // Try to parse as envelope first
    let envelope
    try {
      envelope = JSON.parse(stdout)
      console.log('[Bridge Engine Update] Parsed envelope, keys:', Object.keys(envelope))
    } catch (err) {
      console.log('[Bridge Engine Update] Failed to parse as JSON envelope:', err.message)
      // Try direct parsing (old format)
      return JSON.parse(stripJsonFences(stdout.trim()))
    }

    // Extract content from envelope.outputs
    if (envelope?.outputs && Array.isArray(envelope.outputs) && envelope.outputs[0]?.text) {
      const content = envelope.outputs[0].text
      console.log('[Bridge Engine Update] Extracted from outputs[0].text, length:', content.length)
      return JSON.parse(stripJsonFences(content.trim()))
    }

    // Fallback: if envelope has result directly
    if (envelope?.result) {
      console.log('[Bridge Engine Update] Using envelope.result')
      return envelope.result
    }

    // Last resort: envelope itself might be the result
    console.log('[Bridge Engine Update] Using envelope as result')
    return envelope
  } catch (error) {
    console.error('[Bridge Engine Update] Error:', error.message)
    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout') || error?.message?.includes('TIMEOUT')) {
      throw new Error('TIMEOUT: OpenClaw infer timed out - Die Aktualisierung hat zu lange gedauert. Bitte versuche es mit weniger Text oder konkreteren Angaben erneut.')
    }
    throw error
  }
}

export async function updateProjectTwin({ existingTwin, additionalInput, originalInput }) {
  const trimmedAdditional = additionalInput?.trim()

  if (!trimmedAdditional) {
    throw new Error('Additional input missing')
  }

  if (trimmedAdditional.length > MAX_INPUT_LENGTH) {
    throw new Error(`Additional input too long. Max ${MAX_INPUT_LENGTH} chars.`)
  }

  try {
    console.log('[Bridge Engine] Starting updateProjectTwin:', {
      hasExistingTwin: !!existingTwin,
      existingTwinTitle: existingTwin?.project?.title,
      additionalInputLength: trimmedAdditional.length,
      additionalInputPreview: trimmedAdditional.substring(0, 100)
    })

    // Kompakte Zusammenfassung bauen
    const compactContext = buildCompactTwinContext(existingTwin)
    console.log('[Bridge Engine] Built compact context:', {
      projectTitle: compactContext.project?.title,
      actorsCount: compactContext.actors?.length,
      risksCount: compactContext.risks?.length
    })

    const updatedAnalysis = await callOpenClawGatewayForUpdate(compactContext, trimmedAdditional)
    console.log('[Bridge Engine] Received updated analysis:', {
      projectTitle: updatedAnalysis?.project?.title,
      hasNextMove: !!updatedAnalysis?.nextMove,
      confidence: updatedAnalysis?.quality?.confidence
    })

    return {
      ...updatedAnalysis,
      meta: {
        domain: updatedAnalysis.project?.type || existingTwin?.project?.type || 'unclear',
        analysisMode: 'openclaw-kimi',
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('[Bridge Engine] Update failed:', error.message)
    throw error
  }
}
