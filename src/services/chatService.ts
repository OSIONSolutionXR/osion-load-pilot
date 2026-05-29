/**
 * OSION Load Pilot - Enhanced Chat Service
 * Phase 5: External Hostinger API
 */

import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { Measure } from '../types/measures'
import type {
  ChatMessage,
  ChatSuggestion,
  ChatSession
} from '../types/chat'
import { buildChatProjectContext, formatContextForAI } from './chatContextBuilder'
import { getChatUrl } from '../lib/apiConfig'

export const CHAT_STORAGE_KEY_BASE = 'osion-load-pilot-chat-session'

// Get storage key based on mode and projectId
export function getChatStorageKey(mode: 'general' | 'project', projectId?: string | null): string {
  if (mode === 'project' && projectId) {
    return `${CHAT_STORAGE_KEY_BASE}:project:${projectId}`
  }
  return `${CHAT_STORAGE_KEY_BASE}:general`
}

export type { ChatMessage, ChatSuggestion }

// ============================================================================
// CHAT SESSION STORAGE - MODE/PROJECT ISOLATED
// ============================================================================

export function loadChatSession(mode: 'general' | 'project', projectId?: string | null): ChatSession | null {
  if (typeof window === 'undefined') return null
  try {
    const key = getChatStorageKey(mode, projectId)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as ChatSession
  } catch {
    return null
  }
}

export function saveChatSession(session: ChatSession, mode: 'general' | 'project', projectId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const key = getChatStorageKey(mode, projectId)
    localStorage.setItem(key, JSON.stringify(session))
  } catch (e) {
    console.error('[ChatService] Failed to save session:', e)
  }
}

export function clearChatSession(mode: 'general' | 'project', projectId?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const key = getChatStorageKey(mode, projectId)
    localStorage.removeItem(key)
  } catch (e) {
    console.error('[ChatService] Failed to clear session:', e)
  }
}

// Clear ALL chat sessions (use with caution)
export function clearAllChatSessions(): void {
  if (typeof window === 'undefined') return
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(CHAT_STORAGE_KEY_BASE)) {
        localStorage.removeItem(key)
      }
    })
  } catch (e) {
    console.error('[ChatService] Failed to clear all sessions:', e)
  }
}

export function createNewSession(selectedProjectId: string | null): ChatSession {
  const now = new Date().toISOString()
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    messages: [createWelcomeMessage()],
    suggestions: [],
    selectedProjectId,
    scope: selectedProjectId ? 'selected' : 'all',
    createdAt: now,
    updatedAt: now
  }
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: `msg-${Date.now()}-welcome`,
    role: 'assistant',
    content: `Willkommen im **OSION KI-Chat**.

Ich bin OSION X ONE, deine KI-Assistenz für Projektsteuerung. Ich kann:

• **Projekte auflisten** → "Zeig mir alle Projekte"
• **Maßnahmen anzeigen** → "Liste alle Maßnahmen"
• **Maßnahmen erstellen** → "Erstelle Maßnahme XY"
• **Projektkontext speichern** → "Budget ist 150.000 Euro"
• **Twin öffnen** → "Öffne Projekt XY"

Wähle ein Projekt aus dem Dropdown oder frag mich projektübergreifend.`,
    timestamp: new Date().toISOString()
  }
}

// ============================================================================
// INTENT DETECTION (Frontend-Seite)
// ============================================================================

export type ChatIntent =
  | 'list_projects'
  | 'open_project'
  | 'summarize_project'
  | 'list_measures'
  | 'list_blocked_measures'
  | 'list_due_measures'
  | 'create_project'
  | 'create_measure'
  | 'update_measure'
  | 'update_project_context'
  | 'add_project_note'
  | 'general_chat'

interface IntentMatch {
  intent: ChatIntent
  confidence: number
  entities: Record<string, string | undefined>
}

export function detectIntent(message: string): IntentMatch {
  const lower = message.toLowerCase()

  // Pattern für verschiedene Intents
  const patterns: { intent: ChatIntent; patterns: RegExp[]; confidence: number }[] = [
    {
      intent: 'list_projects',
      patterns: [
        /zeig.*projekte/,
        /liste.*projekte/,
        /welche projekte/,
        /meine projekte/,
        /alle projekte/,
        /projektübersicht/
      ],
      confidence: 0.95
    },
    {
      intent: 'open_project',
      patterns: [
        /öffne.*projekt/,
        /zeig.*projekt/,
        /zu.*projekt/,
        /project twin öffnen/,
        /twin öffnen/
      ],
      confidence: 0.9
    },
    {
      intent: 'list_measures',
      patterns: [
        /zeig.*maßnahmen/,
        /liste.*maßnahmen/,
        /welche maßnahmen/,
        /alle maßnahmen/,
        /maßnahmen anzeigen/
      ],
      confidence: 0.95
    },
    {
      intent: 'list_blocked_measures',
      patterns: [
        /blockierte.*maßnahmen/,
        /was ist blockiert/,
        /welche.*blockiert/,
        /blocker anzeigen/,
        /hindernisse/
      ],
      confidence: 0.9
    },
    {
      intent: 'list_due_measures',
      patterns: [
        /fällig.*maßnahmen/,
        /was ist fällig/,
        /welche.*fällig/,
        /dieser woche/,
        /fristen/
      ],
      confidence: 0.9
    },
    {
      intent: 'create_measure',
      patterns: [
        /erstelle.*maßnahme/,
        /neue.*maßnahme/,
        /maßnahme hinzufügen/,
        /füge.*maßnahme/,
        /aufgabe erstellen/
      ],
      confidence: 0.9
    },
    {
      intent: 'create_project',
      patterns: [
        /lege.*projekt/,
        /neues.*projekt/,
        /projekt anlegen/,
        /erstelle.*projekt/,
        /neuer project twin/
      ],
      confidence: 0.9
    },
    {
      intent: 'update_measure',
      patterns: [
        /markiere.*erledigt/,
        /erledigt/,
        /status.*ändern/,
        /maßnahme.*aktualisieren/,
        /abschließen/
      ],
      confidence: 0.85
    },
    {
      intent: 'update_project_context',
      patterns: [
        /budget.*\d+/,
        /kosten.*\d+/,
        /termin.*\d+/,
        /wichtig.*ist/,
        /hinweis.*projekt/
      ],
      confidence: 0.8
    }
  ]

  for (const p of patterns) {
    if (p.patterns.some(pattern => pattern.test(lower))) {
      return {
        intent: p.intent,
        confidence: p.confidence,
        entities: extractEntities(message)
      }
    }
  }

  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {}
  }
}

function extractEntities(message: string): Record<string, string | undefined> {
  const entities: Record<string, string | undefined> = {}

  // Beträge/Budgets erkennen
  const budgetMatch = message.match(/(\d+[\s.]?\d*)\s*(€|euro|eur)/i)
  if (budgetMatch) {
    entities.budget = budgetMatch[1].replace(/\s/g, '')
  }

  // Daten erkennen
  const dateMatch = message.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/)
  if (dateMatch) {
    entities.date = `${dateMatch[1]}.${dateMatch[2]}.${dateMatch[3]}`
  }

  // Priorität erkennen
  if (/dringend|kritisch|wichtig/.test(message.toLowerCase())) {
    entities.priority = 'high'
  } else if (/niedrig|optional/.test(message.toLowerCase())) {
    entities.priority = 'low'
  }

  return entities
}

// ============================================================================
// SUGGESTION BUILDERS
// ============================================================================

export function buildProjectListSuggestions(
  twins: StoredProjectTwin[]
): ChatSuggestion[] {
  return twins.slice(0, 5).map(t => ({
    id: `sugg-open-${t.id}`,
    source: 'system' as const,
    type: 'open_project',
    title: `Projekt öffnen: ${t.title}`,
    description: t.description || `Fortschritt: ${t.progress?.percent || 0}%`,
    projectId: t.id,
    twinId: t.id,
    requiresApproval: false,
    status: 'suggested' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

export function buildMeasureSuggestions(
  twin: StoredProjectTwin,
  measures: Measure[]
): ChatSuggestion[] {
  return measures.slice(0, 5).map(m => ({
    id: `sugg-measure-${m.id}`,
    source: 'system' as const,
    type: 'update_measure',
    title: `Maßnahme: ${m.title}`,
    description: `Status: ${m.status}, Priorität: ${m.priority}`,
    projectId: twin.id,
    twinId: twin.id,
    targetMeasureIds: [m.id],
    requiresApproval: false,
    status: 'suggested' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// ============================================================================
// MAIN CHAT FUNCTION
// ============================================================================

export interface ChatResponse {
  text: string
  suggestions?: ChatSuggestion[]
  intent?: ChatIntent
}

export async function sendChatMessageEnhanced(
  message: string,
  twins: StoredProjectTwin[],
  selectedProjectId: string | null,
  history: ChatMessage[] = []
): Promise<ChatResponse | { error: string }> {
  try {
    // Build context
    const contextResult = buildChatProjectContext(twins, selectedProjectId)
    const contextPrompt = formatContextForAI(contextResult)

    // Detect intent locally
    const intentMatch = detectIntent(message)

    // Call API with enhanced context
    const response = await window.fetch(getChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-10).map(m => ({
          role: m.role,
          content: m.content
        })),
        projects: contextResult.globalContext.projects,
        activeProjectId: selectedProjectId,
        contextPrompt
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { error: errorData.error || `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.error) {
      return { error: data.error }
    }

    // Build suggestions based on intent and context
    const suggestions = generateSuggestions(
      intentMatch.intent,
      contextResult,
      twins,
      selectedProjectId
    )

    return {
      text: data.answer || data.text || 'Keine Antwort erhalten',
      suggestions,
      intent: intentMatch.intent
    }
  } catch (error) {
    console.error('[ChatService] Error:', error)
    return { error: error instanceof Error ? error.message : 'KI-Verbindung nicht erreichbar' }
  }
}

function generateSuggestions(
  intent: ChatIntent,
  _context: ReturnType<typeof buildChatProjectContext>,
  twins: StoredProjectTwin[],
  selectedProjectId: string | null
): ChatSuggestion[] {
  const suggestions: ChatSuggestion[] = []

  switch (intent) {
    case 'list_projects':
      suggestions.push(...buildProjectListSuggestions(twins))
      break

    case 'list_measures':
    case 'list_blocked_measures':
    case 'list_due_measures':
      if (selectedProjectId) {
        const twin = twins.find(t => t.id === selectedProjectId)
        if (twin?.measures) {
          let filtered = twin.measures
          if (intent === 'list_blocked_measures') {
            filtered = twin.measures.filter(m => m.status === 'blocked')
          } else if (intent === 'list_due_measures') {
            // Fällige Maßnahmen filtern
            filtered = twin.measures.filter(m => {
              if (!m.dueDate) return false
              const due = new Date(m.dueDate)
              const today = new Date()
              return due <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            })
          }
          suggestions.push(...buildMeasureSuggestions(twin, filtered))
        }
      }
      break

    case 'create_project':
      suggestions.push({
        id: `sugg-new-project-${Date.now()}`,
        source: 'system' as const,
        type: 'create_project',
        title: 'Neues Projekt anlegen',
        description: 'Erstelle einen neuen Project Twin',
        requiresApproval: true,
        status: 'suggested' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      break

    case 'open_project':
      if (!selectedProjectId && twins.length > 0) {
        suggestions.push(...buildProjectListSuggestions(twins))
      }
      break
  }

  return suggestions
}

// ============================================================================
// CONNECTION CHECK
// ============================================================================

export async function checkChatConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await fetch(getChatUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'ping',
        history: [],
        projects: [],
        activeProjectId: null
      })
    })

    // Even if we get an error response, the connection works
    return { connected: true }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
