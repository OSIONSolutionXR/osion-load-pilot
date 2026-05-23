import type { ChatMessage, ChatResponse, ProjectContext } from '../types/chat'

const CHAT_API_URL = '/api/chat'

interface ChatServiceOptions {
  onError?: (error: string) => void
  onStatusChange?: (status: 'idle' | 'loading' | 'error' | 'success') => void
}

export class ChatService {
  private abortController: AbortController | null = null
  private options: ChatServiceOptions

  constructor(options: ChatServiceOptions = {}) {
    this.options = options
  }

  async sendMessage(
    message: string,
    history: ChatMessage[],
    projectContext?: ProjectContext
  ): Promise<ChatResponse | null> {
    // Cancel any pending request
    this.abortController?.abort()
    this.abortController = new AbortController()

    this.options.onStatusChange?.('loading')

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          history: history.slice(-10), // Send only last 10 messages for context
          projectContext
        }),
        signal: this.abortController.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!this.isValidChatResponse(data)) {
        throw new Error('Ungültige KI-Antwort')
      }

      this.options.onStatusChange?.('success')
      return data as ChatResponse
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null // Request was cancelled
      }

      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      this.options.onError?.(errorMessage)
      this.options.onStatusChange?.('error')
      return null
    }
  }

  cancel(): void {
    this.abortController?.abort()
    this.abortController = null
  }

  private isValidChatResponse(data: unknown): data is ChatResponse {
    if (typeof data !== 'object' || data === null) return false
    const response = data as Record<string, unknown>
    return typeof response.text === 'string'
  }
}

// Simple history item for API calls
interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

// Simple non-class version for direct use
export async function sendChatMessage(
  message: string,
  history: ChatHistoryItem[],
  projectContext?: ProjectContext
): Promise<ChatResponse | { error: string }> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        history: history.slice(-10),
        projectContext
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    
    if (!data || typeof data.text !== 'string') {
      return { error: 'Ungültige KI-Antwort' }
    }

    return data as ChatResponse
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'KI-Verbindung nicht erreichbar' }
  }
}
