import http from 'node:http'
import { analyzeProjectInput, updateProjectTwin } from './loadPilotAnalysisEngine.mjs'

const HOST = process.env.OPENCLAW_BRIDGE_HOST || '0.0.0.0'
const PORT = Number(process.env.OPENCLAW_BRIDGE_PORT || 8788)
const SECRET = process.env.OPENCLAW_BRIDGE_SECRET
const MAX_INPUT_LENGTH = 4000
const ALLOWED_JOB_TYPES = ['loadpilot_project_twin_analysis', 'loadpilot_project_twin_update']
const ALLOWED_PROMPT_VERSION = 'loadpilot_v2'

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

  if (!body.compactTwinContext || typeof body.compactTwinContext !== 'object') {
    return badRequest(res, 'compactTwinContext required')
  }

  console.log('[Bridge] update-project-twin:', {
    additionalInputPreview: body.additionalInput.substring(0, 50),
    hasContextAnswers: !!body.contextAnswers?.length
  })
  
  const result = await updateProjectTwin({
    compactTwinContext: body.compactTwinContext,
    additionalInput: body.additionalInput.trim(),
    originalInput: body.originalInput || '',
    contextAnswers: body.contextAnswers
  })
  
  return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge', mode: 'openclaw-kimi', jobType: body.jobType } })
}

server.listen(PORT, HOST, () => {
  console.log(`OpenClaw bridge listening on http://${HOST}:${PORT}`)
  console.log(`  - POST /bridge/analyze-project (Input-Analyse)`)
  console.log(`  - POST /bridge/update-project-twin (Twin-Update)`)
})
