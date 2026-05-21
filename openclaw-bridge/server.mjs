import http from 'node:http'
import { analyzeProjectInput, updateProjectTwin } from './loadPilotAnalysisEngine.mjs'

const HOST = process.env.OPENCLAW_BRIDGE_HOST || '127.0.0.1'
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
  if (req.url !== '/bridge/analyze-project') {
    return sendJson(res, 404, { error: 'Not found' })
  }

  if (req.method !== 'POST') {
    return methodNotAllowed(res)
  }

  const auth = req.headers.authorization || ''
  if (auth !== `Bearer ${SECRET}`) {
    return unauthorized(res)
  }

  let raw = ''
  req.on('data', (chunk) => {
    raw += chunk
    if (raw.length > 100_000) {
      req.destroy()
    }
  })

  req.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}')

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

      // Route to appropriate handler based on jobType
      let result
      if (body.jobType === 'loadpilot_project_twin_analysis') {
        result = await analyzeProjectInput(body.input.trim())
      } else if (body.jobType === 'loadpilot_project_twin_update') {
        // Validate update context
        if (!body.context || typeof body.context !== 'object') {
          return badRequest(res, 'Update requires context object')
        }
        if (!body.context.existingTwin) {
          return badRequest(res, 'Update requires existingTwin')
        }
        result = await updateProjectTwin({
          existingTwin: body.context.existingTwin,
          additionalInput: body.input.trim(),
          originalInput: body.context.originalInput || ''
        })
      }
      
      return sendJson(res, 200, { result, meta: { source: 'openclaw-bridge', mode: 'openclaw-kimi' } })
    } catch (error) {
      return sendJson(res, 502, {
        error: error instanceof Error ? error.message : 'Analysis unavailable'
      })
    }
  })
})

server.listen(PORT, HOST, () => {
  console.log(`OpenClaw bridge listening on http://${HOST}:${PORT}/bridge/analyze-project`)
})
