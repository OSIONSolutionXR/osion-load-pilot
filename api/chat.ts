import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

const CHAT_PROMPT = `Du bist OSION X ONE, die KI-Assistenz für den OSION Load Pilot Project Twin System.

Deine Aufgaben:
1. Natürlich, präzise und professionell antworten
2. Projektsteuerung unterstützen (Maßnahmen, Risiken, Kontakte, Freigaben)
3. Kontext aus dem Project Twin nutzen (Projekte, Maßnahmen, Risiken, Historie)
4. Wenn etwas unklar ist: nachfragen statt raten
5. Wenn Aktionen vorgeschlagen werden: strukturierte Vorschläge zurückgeben

Wichtig:
- Keine halluzinierten Daten
- Keine erfundenen Kontakte oder Maßnahmen
- Bei fehlenden Daten: ehrlich "Ich habe keine Informationen zu..."
- Strukturierte JSON-Antworten für Aktionen

Antwortformat:
- text: Natürliche Konversation
- suggestions: Optionale strukturierte Vorschläge
- actions: Konkrete ausführbare Aktionen`

const ALLOWED_JOB_TYPE = 'loadpilot_chat'
const ALLOWED_PROMPT_VERSION = 'loadpilot_chat_v1'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

type SuggestionType = 'measure' | 'email_draft' | 'checklist' | 'analysis' | 'contact' | 'risk'

type Suggestion = {
  type: SuggestionType
  title: string
  description: string
  data?: Record<string, unknown>
}

type ChatAction = {
  type: 'create_measure' | 'send_email' | 'add_contact' | 'analyze_risk'
  params: Record<string, unknown>
}

type ChatResponse = {
  text: string
  suggestions?: Suggestion[]
  actions?: ChatAction[]
}

type BridgeRequest = {
  jobType: typeof ALLOWED_JOB_TYPE
  promptVersion: typeof ALLOWED_PROMPT_VERSION
  input: string
  history: ChatMessage[]
  projectContext?: {
    projectId?: string
    projectTitle?: string
    measuresCount?: number
    risksCount?: number
    contactsCount?: number
  }
  outputFormat: 'chat_response_json'
  prompt: string
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

function isArrayOf<T>(arr: unknown, validator: (item: unknown) => item is T): arr is T[] {
  return Array.isArray(arr) && arr.every(validator)
}

function isValidSuggestion(item: unknown): item is Suggestion {
  if (!isObject(item)) return false
  const validTypes: SuggestionType[] = ['measure', 'email_draft', 'checklist', 'analysis', 'contact', 'risk']
  return (
    isString(item.title) &&
    isString(item.description) &&
    (item.type === undefined || (isString(item.type) && validTypes.includes(item.type as SuggestionType)))
  )
}

function isValidAction(item: unknown): item is ChatAction {
  if (!isObject(item)) return false
  return (
    isString(item.type) &&
    ['create_measure', 'send_email', 'add_contact', 'analyze_risk'].includes(item.type) &&
    isObject(item.params)
  )
}

function validateChatResponse(data: unknown): data is ChatResponse {
  if (!isObject(data)) return false
  if (!isString(data.text)) return false

  if (data.suggestions !== undefined) {
    if (!isArrayOf(data.suggestions, isValidSuggestion)) return false
  }

  if (data.actions !== undefined) {
    if (!isArrayOf(data.actions, isValidAction)) return false
  }

  return true
}

async function callBridge(input: string, history: ChatMessage[], projectContext?: BridgeRequest['projectContext']): Promise<ChatResponse> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  if (!bridgeUrl || !bridgeSecret) {
    throw new Error('KI-Verbindung nicht konfiguriert')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  const payload: BridgeRequest = {
    jobType: ALLOWED_JOB_TYPE,
    promptVersion: ALLOWED_PROMPT_VERSION,
    input,
    history,
    projectContext,
    outputFormat: 'chat_response_json',
    prompt: CHAT_PROMPT
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
      throw new Error(body.error || 'KI-Dienst nicht erreichbar')
    }

    const result = isObject(body) && 'result' in body ? body.result : body

    if (!validateChatResponse(result)) {
      throw new Error('KI-Antwort konnte nicht verarbeitet werden')
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

  const { message, history, projectContext } = req.body || {}
  const input = isString(message) ? message.trim() : ''
  const chatHistory = Array.isArray(history) ? history : []

  if (!input) {
    return res.status(400).json({ error: 'Nachricht fehlt.' })
  }

  if (input.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ error: `Nachricht ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` })
  }

  try {
    const response = await callBridge(input, chatHistory, projectContext)
    return res.status(200).json(response)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return res.status(502).json({ 
      error: 'KI-Verbindung nicht erreichbar',
      details: message
    })
  }
}
