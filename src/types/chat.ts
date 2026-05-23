/**
 * Chat-related types for OSION Load Pilot
 */

export type ChatRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: string
  isError?: boolean
}

export type SuggestionType = 'measure' | 'email_draft' | 'checklist' | 'analysis' | 'contact' | 'risk'

export interface Suggestion {
  type: SuggestionType
  title: string
  description: string
  data?: Record<string, unknown>
}

export interface ChatAction {
  type: 'create_measure' | 'send_email' | 'add_contact' | 'analyze_risk'
  params: Record<string, unknown>
}

export interface ChatResponse {
  text: string
  suggestions?: Suggestion[]
  actions?: ChatAction[]
}

export interface ProjectContextData {
  projectId: string
  projectTitle: string
  measuresCount: number
  risksCount: number
  contactsCount: number
}

export type ProjectContext = 'all' | 'active' | { projectId: string; title: string } | ProjectContextData

export type ChatStatus = 'idle' | 'loading' | 'error' | 'success'

export interface AIStatus {
  connected: boolean
  status: ChatStatus
  lastError?: string
}
