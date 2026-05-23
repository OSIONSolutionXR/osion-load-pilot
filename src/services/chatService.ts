/**
 * OSION Chat Service
 * Connects to the OpenClaw Bridge for real AI responses
 */

const CHAT_API_URL = '/api/chat'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isError?: boolean
}

export interface ChatResponse {
  text: string
}

export type ChatStatus = 'idle' | 'loading' | 'error' | 'success'

/**
 * Send a message to the chat API and get a real AI response
 */
export async function sendChatMessage(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[]
): Promise<ChatResponse | { error: string }> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history: history.slice(-10) // Send last 10 messages for context
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json() as ChatResponse | { error: string }
    
    if ('error' in data) {
      return { error: data.error }
    }

    if (!data || typeof data.text !== 'string') {
      return { error: 'Ungültige KI-Antwort' }
    }

    return data
  } catch (error) {
    console.error('Chat service error:', error)
    return { error: error instanceof Error ? error.message : 'KI-Verbindung nicht erreichbar' }
  }
}

/**
 * Check if the chat API is reachable
 */
export async function checkChatConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping' })
    })
    
    return { connected: response.ok }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen' 
    }
  }
}
