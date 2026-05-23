import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 60000

const SYSTEM_PROMPT = `Du bist die interne KI des OSION Load Pilot. 

Antworte direkt, professionell und umsetzungsorientiert. 
Hilf bei Projekten, Maßnahmen, Risiken, Abhängigkeiten und nächsten Schritten. 
Gib keine internen Systemdetails preis.

Dein Stil:
- Präzise und klar
- Keine überflüssigen Füllwörter
- Taten zählen mehr als Versprechen
- Bei Unsicherheit: nachfragen statt raten`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY nicht konfiguriert' })
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

  const openai = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  // Build messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT }
  ]

  // Add history if provided
  if (Array.isArray(history)) {
    for (const m of history) {
      if (typeof m.role === 'string' && typeof m.content === 'string') {
        if (['user', 'assistant'].includes(m.role)) {
          messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
        }
      }
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message.trim() })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const completion = await openai.chat.completions.create(
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        signal: controller.signal as AbortSignal
      }
    )

    clearTimeout(timeout)

    const answer = completion.choices[0]?.message?.content?.trim()
    
    if (!answer) {
      throw new Error('Keine Antwort von OpenAI erhalten')
    }

    return res.status(200).json({ answer })
  } catch (error) {
    console.error('OpenAI error:', error)
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 502).json({ 
        error: `OpenAI Fehler: ${error.message}`,
        code: error.code
      })
    }

    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return res.status(502).json({ 
      error: 'KI-Verbindung nicht erreichbar',
      details: errorMessage
    })
  }
}
