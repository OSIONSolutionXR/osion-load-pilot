import type { VercelRequest, VercelResponse } from '@vercel/node'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 180000

const ALLOWED_JOB_TYPE = 'loadpilot_chat'
const ALLOWED_PROMPT_VERSION = 'loadpilot_chat_v1'

type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

interface ChatResponse {
  text: string
  suggestions?: Suggestion[]
}

type SuggestionType = 'measure' | 'email_draft' | 'checklist' | 'analysis' | 'contact' | 'risk'

interface Suggestion {
  type: SuggestionType
  title: string
  description: string
  data?: Record<string, unknown>
}

// Call the OpenClaw Bridge for chat
async function callBridge(messages: ChatMessage[]): Promise<ChatResponse> {
  const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL || 'http://187.124.184.137:8788'
  const bridgeSecret = process.env.OPENCLAW_BRIDGE_SECRET

  if (!bridgeSecret) {
    throw new Error('OPENCLAW_BRIDGE_SECRET nicht konfiguriert')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(`${bridgeUrl}/bridge/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bridgeSecret}`
      },
      body: JSON.stringify({
        jobType: ALLOWED_JOB_TYPE,
        promptVersion: ALLOWED_PROMPT_VERSION,
        messages: messages.slice(-10), // Last 10 messages for context
        outputFormat: 'chat_response'
      }),
      signal: controller.signal as AbortSignal
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Bridge HTTP ${response.status}: ${errorText}`)
    }

    const data = await response.json() as { result?: unknown; error?: string; text?: string }
    
    if (data.error) {
      throw new Error(data.error)
    }

    // Handle different response formats
    if (typeof data.text === 'string') {
      return { text: data.text }
    }

    if (data.result && typeof (data.result as { text?: string }).text === 'string') {
      return { text: (data.result as { text: string }).text }
    }

    // Fallback: try to extract any text
    const text = typeof data.result === 'string' 
      ? data.result 
      : JSON.stringify(data.result)
    
    return { text }
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

  const { message, history } = req.body || {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Nachricht fehlt.' })
  }

  if (message.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ 
      error: `Nachricht ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` 
    })
  }

  // Build message history
  const messages: ChatMessage[] = Array.isArray(history) 
    ? history.filter((m: ChatMessage) => 
        typeof m.role === 'string' && 
        ['user', 'assistant', 'system'].includes(m.role) &&
        typeof m.content === 'string'
      ).map((m: ChatMessage) => ({ 
        role: m.role, 
        content: m.content 
      }))
    : []

  // Add current message
  messages.push({ role: 'user', content: message.trim() })

  try {
    const response = await callBridge(messages)
    return res.status(200).json(response)
  } catch (error) {
    console.error('Chat error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return res.status(502).json({ 
      error: 'KI-Verbindung nicht erreichbar',
      details: errorMessage
    })
  }
}
