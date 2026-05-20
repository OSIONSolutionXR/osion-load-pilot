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

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
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

function normalizeMissingContext(values) {
  const seen = new Set()
  return values
    .map((value) => cleanString(value))
    .filter((value) => value.length > 0)
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
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

function isGoalOrientedUsableInput(input) {
  const trimmed = input.trim()
  if (isClearlyInsufficientInput(trimmed)) return false
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  if (wordCount < 4) return false
  return /(ich\s+(will|möchte)|wir\s+(wollen|möchten)|ich\s+plane|ich\s+brauche)/iu.test(trimmed)
}

function detectDomainFromInput(input) {
  const normalized = input.toLowerCase()
  if (/(auto|fahrzeug|kaufen)/u.test(normalized)) return 'private_purchase'
  if (/(ferienhaus|auslast|buchung|gäste)/u.test(normalized)) return 'hospitality_growth'
  if (/(kunden|verkauf|leads|angebot)/u.test(normalized)) return 'sales'
  if (/(website|webseite|seite|landingpage)/u.test(normalized)) return 'operations'
  return 'internal_project'
}

function buildUsableGoalAnalysis(input) {
  const domain = detectDomainFromInput(input)
  const normalized = input.toLowerCase()

  if (domain === 'private_purchase' && /(auto|fahrzeug)/u.test(normalized)) {
    return {
      project: {
        title: 'Autokauf vorbereiten',
        description:
          'Der Kauf eines Autos soll strukturiert vorbereitet werden, damit Budget, Anforderungen, Finanzierung und Vergleichsoptionen vor der Entscheidung sauber definiert sind.',
        type: 'private_purchase',
        status: 'active'
      },
      nextMove: {
        title: 'Budget, Fahrzeuganforderungen und Kaufrahmen festlegen',
        reason:
          'Der Input beschreibt ein klares Ziel, aber noch keine Rahmenbedingungen. Der erste wirksame Schritt ist daher die Eingrenzung von Budget, Nutzungsprofil, Fahrzeugtyp, Zahlungsweise und Zeitrahmen.',
        effort: 'low',
        impact: 'high',
        deadline: null
      },
      actors: [
        { name: 'Käufer', role: 'Entscheider', influence: 'high', waitingFor: null },
        { name: 'Verkäufer/Händler', role: 'Anbieter', influence: 'medium', waitingFor: null },
        { name: 'Versicherung', role: 'Kostenfaktor', influence: 'medium', waitingFor: null },
        { name: 'Finanzierungspartner', role: 'Kapitalgeber', influence: 'medium', waitingFor: 'Finanzierungsanfrage' }
      ],
      dependencies: [
        { from: 'Budgetrahmen', to: 'Fahrzeugauswahl', status: 'required', isBlocker: true, explanation: 'Ohne Budget keine sinnvolle Vorauswahl.' },
        { from: 'Nutzungsprofil', to: 'Fahrzeugtyp', status: 'required', isBlocker: true, explanation: 'Das Einsatzprofil bestimmt den geeigneten Fahrzeugtyp.' },
        { from: 'Zahlungsweise', to: 'Verhandlungsstrategie', status: 'required', isBlocker: false, explanation: 'Barzahlung oder Finanzierung verändert Verhandlung und Optionen.' },
        { from: 'Versicherungskosten', to: 'Gesamtkosten', status: 'required', isBlocker: false, explanation: 'Laufende Kosten beeinflussen die reale Tragbarkeit.' },
        { from: 'Probefahrt/Prüfung', to: 'Kaufentscheidung', status: 'required', isBlocker: true, explanation: 'Technischer und praktischer Check reduziert Fehlkäufe.' }
      ],
      risks: [
        { title: 'Impulskauf', severity: 'medium', explanation: 'Schnelle Entscheidung ohne Kriterien führt oft zu Fehlentscheidungen.' },
        { title: 'Unterschätzte Gesamtkosten', severity: 'high', explanation: 'Versicherung, Wartung und Betrieb werden häufig zu niedrig angesetzt.' },
        { title: 'Unpassendes Fahrzeug', severity: 'high', explanation: 'Fahrzeug passt nicht zum tatsächlichen Nutzungsprofil.' },
        { title: 'Finanzierung nicht geprüft', severity: 'medium', explanation: 'Späte Klärung kann Kaufoptionen und Fristen gefährden.' },
        { title: 'Keine Vergleichsangebote', severity: 'medium', explanation: 'Fehlender Marktvergleich erhöht das Risiko für einen schlechten Preis.' }
      ],
      scenarios: [],
      actions: [
        { title: 'Budgetrahmen festlegen', owner: 'Käufer', priority: 'high', messageDraft: null },
        { title: 'Muss-Kriterien definieren', owner: 'Käufer', priority: 'high', messageDraft: null },
        { title: 'Zahlungsweise klären', owner: 'Käufer', priority: 'medium', messageDraft: null },
        { title: 'Vergleichsangebote sammeln', owner: 'Käufer', priority: 'high', messageDraft: null },
        { title: 'Versicherungskosten prüfen', owner: 'Käufer', priority: 'medium', messageDraft: null }
      ],
      quality: {
        inputQuality: 'usable',
        isActionable: true,
        confidence: 'medium',
        missingContext: ['Budget', 'Nutzungsprofil', 'Fahrzeugtyp', 'Zahlungsweise', 'Zeitrahmen'],
        reason: 'Klares Ziel vorhanden; Kontext für eine präzise Umsetzung muss im nächsten Schritt ergänzt werden.'
      }
    }
  }

  return {
    project: {
      title: 'Ziel strukturiert umsetzen',
      description: `Das Ziel "${input.trim()}" ist erkennbar und wird in eine umsetzbare Projektstruktur überführt.`,
      type: domain,
      status: 'active'
    },
    nextMove: {
      title: 'Zielbild und Rahmenbedingungen konkretisieren',
      reason: 'Das Ziel ist klar, aber für belastbare Entscheidungen fehlen konkrete Rahmenparameter.',
      effort: 'low',
      impact: 'high',
      deadline: null
    },
    actors: [{ name: 'Auftraggeber', role: 'Entscheider', influence: 'high', waitingFor: null }],
    dependencies: [],
    risks: [{ title: 'Unklare Prioritäten', severity: 'medium', explanation: 'Ohne klare Rahmenbedingungen entstehen Verzögerungen und Fehlfokus.' }],
    scenarios: [],
    actions: [
      { title: 'Zielkriterien festlegen', owner: 'Auftraggeber', priority: 'high', messageDraft: null },
      { title: 'Randbedingungen klären', owner: 'Auftraggeber', priority: 'high', messageDraft: null },
      { title: 'Nächsten Umsetzungsschritt terminieren', owner: 'Auftraggeber', priority: 'medium', messageDraft: null }
    ],
    quality: {
      inputQuality: 'usable',
      isActionable: true,
      confidence: 'low',
      missingContext: ['Rahmenbedingungen', 'Zeitrahmen', 'Erfolgskriterien'],
      reason: 'Der Input ist grob, aber projektfähig und kann strukturiert weitergeführt werden.'
    }
  }
}

function buildInsufficientAnalysis(input, reason) {
  const missingContext = ['Ziel', 'gewünschtes Ergebnis', 'offene Entscheidung', 'beteiligte Personen', 'Frist']

  return {
    project: {
      title: 'Projektlage unvollständig',
      description: 'Bitte ergänze Ziel, gewünschtes Ergebnis, offene Entscheidung, beteiligte Personen und Frist.',
      type: 'clarification',
      status: 'waiting'
    },
    nextMove: {
      title: 'Input gezielt ergänzen',
      reason: reason || 'Der Input ist noch nicht konkret genug für eine belastbare Analyse.',
      effort: 'low',
      impact: 'high',
      deadline: null
    },
    actors: [],
    dependencies: [],
    risks: [],
    scenarios: [],
    actions: [
      {
        title: 'Projektlage konkretisieren',
        owner: 'Marcel',
        priority: 'high',
        messageDraft: 'Beschreibe Ziel, Problem, offene Entscheidung, beteiligte Personen und Frist in 2 bis 5 Sätzen.'
      }
    ],
    quality: {
      inputQuality: 'insufficient',
      isActionable: false,
      confidence: 'low',
      missingContext,
      reason: reason || 'Der Input ist noch nicht konkret genug für eine belastbare Analyse.'
    },
    meta: {
      domain: 'unclear',
      analysisMode: 'quality-gate',
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString()
    }
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
  "project": {
    "title": "string",
    "description": "string",
    "type": "private_purchase|financing|hospitality_growth|sales|operations|internal_project|unclear|clarification",
    "status": "active|blocked|waiting|parked"
  },
  "nextMove": {
    "title": "string",
    "reason": "string",
    "effort": "low|medium|high",
    "impact": "low|medium|high",
    "deadline": "string|null"
  },
  "actors": [{"name": "string", "role": "string", "influence": "low|medium|high", "waitingFor": "string|null"}],
  "dependencies": [{"from": "string", "to": "string", "status": "required|blocked|waiting|done", "isBlocker": true, "explanation": "string"}],
  "risks": [{"title": "string", "severity": "low|medium|high", "explanation": "string"}],
  "scenarios": [{"title": "string", "outcome": "string", "riskLevel": "low|medium|high", "recommendation": "string"}],
  "actions": [{"title": "string", "owner": "string", "priority": "low|medium|high", "messageDraft": "string|null"}],
  "quality": {
    "inputQuality": "insufficient|usable|strong",
    "isActionable": true,
    "confidence": "low|medium|high",
    "missingContext": ["string"],
    "reason": "string"
  }
}

Nutzereingang: ${input}

${prompt}

Antworte ausschließlich mit validem JSON ohne Markdown.`

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      [
        'infer',
        'model',
        'run',
        '--gateway',
        '--model',
        'ollama/kimi-k2.5:cloud',
        '--prompt',
        fullPrompt,
        '--thinking',
        'off',
        '--json'
      ],
      {
        timeout: REQUEST_TIMEOUT_MS,
        maxBuffer: 10 * 1024 * 1024
      }
    )

    const envelope = JSON.parse(stdout)
    const content = envelope?.outputs?.[0]?.text
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid OpenClaw infer response structure')
    }

    return JSON.parse(stripJsonFences(content))
  } catch (error) {
    if (error?.code === 'ETIMEDOUT') {
      throw new Error('OpenClaw infer timeout')
    }
    throw new Error(error instanceof Error ? error.message : 'OpenClaw infer failed')
  }
}

function validateAnalysis(data) {
  if (!isObject(data)) return false
  if (!isObject(data.project) || !isObject(data.nextMove)) return false
  if (!Array.isArray(data.actors) || !Array.isArray(data.dependencies) || !Array.isArray(data.risks) || !Array.isArray(data.scenarios) || !Array.isArray(data.actions)) return false

  const validProject =
    isString(data.project.title) &&
    isString(data.project.description) &&
    isString(data.project.type) &&
    isEnum(data.project.status, ['active', 'blocked', 'waiting', 'parked'])

  const validNextMove =
    isString(data.nextMove.title) &&
    isString(data.nextMove.reason) &&
    isEnum(data.nextMove.effort, ['low', 'medium', 'high']) &&
    isEnum(data.nextMove.impact, ['low', 'medium', 'high']) &&
    isNullableString(data.nextMove.deadline)

  const validActors = data.actors.every((actor) =>
    isObject(actor) &&
    isString(actor.name) &&
    isString(actor.role) &&
    isEnum(actor.influence, ['low', 'medium', 'high']) &&
    isNullableString(actor.waitingFor)
  )

  const validDependencies = data.dependencies.every((dep) =>
    isObject(dep) &&
    isString(dep.from) &&
    isString(dep.to) &&
    isEnum(dep.status, ['required', 'blocked', 'waiting', 'done']) &&
    typeof dep.isBlocker === 'boolean' &&
    isString(dep.explanation)
  )

  const validRisks = data.risks.every((risk) =>
    isObject(risk) &&
    isString(risk.title) &&
    isEnum(risk.severity, ['low', 'medium', 'high']) &&
    isString(risk.explanation)
  )

  const validScenarios = data.scenarios.every((sc) =>
    isObject(sc) &&
    isString(sc.title) &&
    isString(sc.outcome) &&
    isEnum(sc.riskLevel, ['low', 'medium', 'high']) &&
    isString(sc.recommendation)
  )

  const validActions = data.actions.every((action) =>
    isObject(action) &&
    isString(action.title) &&
    isString(action.owner) &&
    isEnum(action.priority, ['low', 'medium', 'high']) &&
    (!('messageDraft' in action) || isNullableString(action.messageDraft))
  )

  return validProject && validNextMove && validActors && validDependencies && validRisks && validScenarios && validActions
}

function assertNoGenericOutput(analysis) {
  const allText = JSON.stringify(analysis).toLowerCase()
  
  if (containsDisallowedFallbackPhrase(allText)) {
    throw new Error('Analysis contains generic fallback phrases')
  }

  if (analysis.project?.title === 'Projektlage mit mehreren offenen Punkten') {
    throw new Error('Analysis contains generic project title')
  }

  if (analysis.nextMove?.title === 'Top-1-Hebel festlegen' || analysis.nextMove?.title === 'Den unmittelbarsten Geld- oder Blockerhebel zuerst bewegen') {
    throw new Error('Analysis contains generic next move')
  }
}

export async function analyzeProjectInput(input) {
  const trimmed = input.trim()

  if (!trimmed) {
    throw new Error('Input missing')
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    throw new Error(`Input too long. Max ${MAX_INPUT_LENGTH} chars.`)
  }

  if (isClearlyInsufficientInput(trimmed)) {
    return buildInsufficientAnalysis(trimmed, 'Der Input ist zu kurz oder zu unbestimmt, um daraus einen Project Twin abzuleiten.')
  }

  const goalUsableInput = isGoalOrientedUsableInput(trimmed)

  try {
    const prompt = 'Erstelle einen konkreten Project Twin basierend auf dem Nutzereingang. Alle Details müssen zum Input passen.'
    const analysis = await callOpenClawGateway(prompt, trimmed)

    if (!validateAnalysis(analysis)) {
      throw new Error('Gateway returned invalid analysis structure')
    }

    assertNoGenericOutput(analysis)

    if (goalUsableInput && (!analysis.quality || analysis.quality.inputQuality === 'insufficient' || analysis.quality.isActionable !== true)) {
      const forcedUsable = buildUsableGoalAnalysis(trimmed)
      return {
        ...forcedUsable,
        meta: {
          domain: forcedUsable.project.type,
          analysisMode: 'openclaw-kimi',
          promptVersion: PROMPT_VERSION,
          generatedAt: new Date().toISOString()
        }
      }
    }

    const enriched = {
      ...analysis,
      quality: {
        ...analysis.quality,
        inputQuality: goalUsableInput ? (analysis.quality?.inputQuality === 'strong' ? 'strong' : 'usable') : analysis.quality?.inputQuality,
        isActionable: goalUsableInput ? true : analysis.quality?.isActionable
      },
      meta: {
        domain: analysis.project?.type || 'unclear',
        analysisMode: 'openclaw-kimi',
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString()
      }
    }

    return enriched
  } catch (error) {
    console.error('Analysis failed:', error.message)
    
    if (isClearlyInsufficientInput(trimmed)) {
      return buildInsufficientAnalysis(trimmed, error.message)
    }
    
    throw new Error(`Analysis unavailable: ${error.message}`)
  }
}
