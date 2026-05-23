import http from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { analyzeProjectInput, updateProjectTwin } from './loadPilotAnalysisEngine.mjs'

const execFileAsync = promisify(execFile)
const HOST = process.env.OPENCLAW_BRIDGE_HOST || '0.0.0.0'
const PORT = Number(process.env.OPENCLAW_BRIDGE_PORT || 8788)
const SECRET = process.env.OPENCLAW_BRIDGE_SECRET
const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

const ALLOWED_JOB_TYPES = ['loadpilot_project_twin_analysis', 'loadpilot_project_twin_update', 'loadpilot_chat']
const ALLOWED_PROMPT_VERSION = 'loadpilot_v2'
const CHAT_PROMPT_VERSION = 'loadpilot_chat_v1'

if (!SECRET) {
  console.error('Missing OPENCLAW_BRIDGE_SECRET')
  process.exit(1)
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function unauthorized(res) {
  return sendJson(res, 401, { error: 'Unauthorized' })
}

function badRequest(res, message) {
  return sendJson(res, 400, { error: message })
}

function methodNotAllowed(res) {
  res.setHeader('Allow', 'POST')
  return sendJson(res, 405, { error: 'Only POST is allowed' })
}

async function callOpenClawForChat(messages) {
  const conversation = messages.map(m => {
    if (m.role === 'system') return `System: ${m.content}`
    if (m.role === 'user') return `User: ${m.content}`
    return `Assistant: ${m.content}`
  }).join('\n\n')

  const fullPrompt = `Du bist OSION X ONE, die KI-Assistenz für den OSION Load Pilot Project Twin System.

Deine Persönlichkeit:
- Professionell, präzise, direkt
- Keine überflüssigen Füllwörter wie "Gute Frage!" oder "Ich helfe dir gerne!"
- Taten zählen mehr als Versprechen
- Bei Unsicherheit: nachfragen statt raten

Deine Aufgaben:
1. Natürlich und hilfreich antworten
2. Projektsteuerung unterstützen (Maßnahmen, Risiken, Kontakte, Freigaben)
3. Bei fehlenden Daten: ehrlich "Ich habe keine Informationen dazu"

Wichtige Regeln:
- Keine halluzinierten Daten
- Keine erfundenen Kontakte oder Maßnahmen
- Konversationell und natürlich antworten

Gesprächsverlauf:
${conversation}

Assistant:`

  try {
    const { stdout } = await execFileAsync(
      'openclaw',
      ['infer', 'model', 'run', '--gateway', '--model', 'ollama/kimi-k2.5:cloud', '--prompt', fullPrompt, '--thinking', 'off'],
      { timeout: REQUEST_TIMEOUT_MS, maxBuffer: 1024 * 1024, encoding: 'utf8' }
    )

    // Parse the envelope response
    let response
    try {
      const parsed = JSON.parse(stdout)
      response = parsed.result || parsed.output || parsed.response || parsed.text || stdout
    } catch {
      response = stdout.trim()
    }

    return { text: response }
  } catch (error) {
    console.error('[Bridge Chat] Error:', error)
    throw new Error('KI-Dienst nicht erreichbar')
  }
}

const server = http.createServer((req, res) => {
  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${SECRET}`) {
    return unauthorized(res)
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  let raw = ''
  req.on('data', (chunk) => {
    raw += chunk
    if (raw.length > 500_000) {
      req.destroy()
    }
  })

  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}')
      
      // Route: /bridge/analyze-project (Input-Analyse)
      if (req.url === '/bridge/analyze-project') {
        return await handleAnalyzeProject(body, res)
      }
      
      // Route: /bridge/update-project-twin (Twin-Update)
      if (req.url === '/bridge/update-project-twin') {
        return await handleUpdateProject(body, res)
      }

      // Route: /bridge/chat (OSION Chat)
      if (req.url === '/bridge/chat') {
        return await handleChat(body, res)
      }
      
      return sendJson(res, 404, { error: 'Not found' })
    } catch (error) {
      return sendJson(res, 502, {
        error: error instanceof Error ? error.message : 'Bridge error'
      })
    }
  })
})

async function handleAnalyzeProject(body, res) {
  if (!ALLOWED_JOB_TYPES.includes(body.jobType)) {
    return badRequest(res, 'Unsupported jobType')
  }

  if (body.promptVersion !== ALLOWED_PROMPT_VERSION) {
    return badRequest(res, 'Unsupported promptVersion')
  }

  if (typeof body.input !== 'string' || !body.input.trim()) {
    return badRequest(res, 'Input missing')
  }

  if (body.input.length > MAX_INPUT_LENGTH) {
    return badRequest(res, `Input too long. Max ${MAX_INPUT_LENGTH} chars.`)
  }

  if (body.outputFormat !== 'project_twin_json') {
    return badRequest(res, 'Unsupported outputFormat')
  }

  console.log('[Bridge] analyze-project:', body.input.substring(0, 50), '...')
  
  const result = await analyzeProjectInput(body.input.trim())
  
  return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge', mode: 'openclaw-kimi', jobType: body.jobType } })
}

async function handleUpdateProject(body, res) {
  if (body.jobType !== 'loadpilot_project_twin_update') {
    return badRequest(res, 'Unsupported jobType for update')
  }

  if (body.promptVersion !== ALLOWED_PROMPT_VERSION) {
    return badRequest(res, 'Unsupported promptVersion')
  }

  if (typeof body.additionalInput !== 'string' || !body.additionalInput.trim()) {
    return badRequest(res, 'additionalInput missing')
  }

  if (body.additionalInput.length > MAX_INPUT_LENGTH) {
    return badRequest(res, `additionalInput too long. Max ${MAX_INPUT_LENGTH} chars.`)
  }
  const compactTwinContext = body.compactTwinContext && typeof body.compactTwinContext === 'object'
    ? body.compactTwinContext
    : buildCompactTwinContext(body.existingTwin)

  console.log('[Bridge] update-project-twin:', {
    additionalInputPreview: body.additionalInput.substring(0, 50),
    hasContextAnswers: !!body.contextAnswers?.length
  })
  
  const result = await updateProjectTwin({
    compactTwinContext,
    additionalInput: body.additionalInput.trim(),
    originalInput: body.originalInput || '',
    contextAnswers: body.contextAnswers
  })
  
  return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge', mode: 'openclaw-kimi', jobType: body.jobType } })
}

async function handleChat(body, res) {
  if (body.jobType !== 'loadpilot_chat') {
    return badRequest(res, 'Unsupported jobType for chat')
  }

  if (body.promptVersion !== CHAT_PROMPT_VERSION) {
    return badRequest(res, 'Unsupported promptVersion')
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return badRequest(res, 'Messages missing')
  }

  // Validate messages
  const validMessages = body.messages.filter(m => 
    typeof m.role === 'string' && ['user', 'assistant', 'system'].includes(m.role) &&
    typeof m.content === 'string'
  )

  if (validMessages.length === 0) {
    return badRequest(res, 'No valid messages')
  }

  console.log('[Bridge] chat:', validMessages.length, 'messages, last:', validMessages[validMessages.length - 1]?.content?.substring(0, 50))

  try {
    const result = await callOpenClawForChat(validMessages)
    return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge', mode: 'openclaw-kimi', jobType: body.jobType } })
  } catch (error) {
    console.error('[Bridge] Chat error:', error)
    return sendJson(res, 502, { error: 'KI-Dienst nicht erreichbar', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}

function buildCompactTwinContext(existingTwin) {
  const analysis = existingTwin?.analysis || {}
  const quality = analysis?.quality || {}
  const limitArray = (value, max) => Array.isArray(value) ? value.slice(0, max) : []

  return {
    project: analysis.project || null,
    nextMove: analysis.nextMove || null,
    actors: limitArray(analysis.actors, 8),
    dependencies: limitArray(analysis.dependencies, 8),
    risks: limitArray(analysis.risks, 8),
    scenarios: limitArray(analysis.scenarios, 5),
    actions: limitArray(analysis.actions, 8),
    quality: {
      confidence: quality.confidence || null,
      inputQuality: quality.inputQuality || null,
      isActionable: typeof quality.isActionable === "boolean" ? quality.isActionable : null,
      missingContext: Array.isArray(quality.missingContext) ? quality.missingContext : [],
      reason: quality.reason || null
    },
    progress: existingTwin?.progress || null,
    latestInput: existingTwin?.latestInput || null,
    updates: Array.isArray(existingTwin?.updates) ? existingTwin.updates.slice(-3) : []
  }
}


server.listen(PORT, HOST, () => {
  console.log(`OpenClaw bridge listening on http://${HOST}:${PORT}`)
  console.log(`  - POST /bridge/analyze-project (Input-Analyse)`)
  console.log(`  - POST /bridge/update-project-twin (Twin-Update)`)
  console.log(`  - POST /bridge/chat (OSION Chat)`)
})
