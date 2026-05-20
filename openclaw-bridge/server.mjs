import http from 'node:http'
import { analyzeProjectInput } from './loadPilotAnalysisEngine.mjs'

const HOST = process.env.OPENCLAW_BRIDGE_HOST || '127.0.0.1'
const PORT = Number(process.env.OPENCLAW_BRIDGE_PORT || 8787)
const SECRET = process.env.OPENCLAW_BRIDGE_SECRET
const MAX_INPUT_LENGTH = 4000
const ALLOWED_JOB_TYPE = 'loadpilot_project_twin_analysis'
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

      if (body.jobType !== ALLOWED_JOB_TYPE) {
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

      const result = await analyzeProjectInput(body.input.trim())
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
