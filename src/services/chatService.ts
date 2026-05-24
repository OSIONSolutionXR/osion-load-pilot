/**
 * OSION Load Pilot - Enhanced Chat Service
 * Echte Projektsteuerung mit Intents und Suggestions
 */

import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { Measure } from '../types/measures'
import type {
  ChatMessage,
  ChatSuggestion,
  ChatSession
} from '../types/chat'
import { buildChatProjectContext, formatContextForAI } from './chatContextBuilder'

const CHAT_API_URL = '/api/osion-chat'
export const CHAT_STORAGE_KEY = 'osion-load-pilot.chat-session.v1'

export type { ChatMessage, ChatSuggestion }

// ============================================================================
// CHAT SESSION STORAGE
// ============================================================================

export function loadChatSession(): ChatSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ChatSession
  } catch {
    return null
  }
}

export function saveChatSession(session: ChatSession): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(session))
  } catch (e) {
    console.error('[ChatService] Failed to save session:', e)
  }
}

export function clearChatSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CHAT_STORAGE_KEY)
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
    content: `Willkommen im **OSION KI-Chat**.\n\nIch bin OSION X ONE, deine KI-Assistenz für Projektsteuerung. Ich kann:\n\n• **Projekte auflisten** → "Zeig mir alle Projekte"\n• **Maßnahmen anzeigen** → "Liste alle Maßnahmen"\n• **Maßnahmen erstellen** → "Erstelle Maßnahme XY"\n• **Projektkontext speichern** → "Budget ist 150.000 Euro"\n• **Twin öffnen** → "Öffne Projekt XY"\n\nWähle ein Projekt aus dem Dropdown oder frag mich projektübergreifend.`,
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
    const response = await fetch(CHAT_API_URL, {
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
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', projects: [] })
    })
    return { connected: response.ok }
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
    }
  }
}

// ============================================================================
// LEGACY ACTION HANDLERS (für Rückwärtskompatibilität)
// ============================================================================

export interface ChatAction {
  type: 'create_project' | 'add_measure' | 'update_measure' | 'show_twin' | 'none'
  projectId?: string
  payload?: Record<string, unknown>
  confirmation?: string
}

export interface ActionResult {
  success: boolean
  message: string
  twin?: StoredProjectTwin
  measure?: Measure
}

export async function executeChatAction(
  action: ChatAction,
  twins: StoredProjectTwin[],
  activeTwinId: string | null,
  callbacks: {
    createTwin: (input: string, title?: string) => Promise<StoredProjectTwin | null>
    addMeasure: (twinId: string, measure: Partial<Measure>) => Promise<Measure | null>
    updateMeasure: (twinId: string, measureId: string, updates: Partial<Measure>) => Promise<boolean>
    showTwin: (twinId: string) => void
  }
): Promise<ActionResult> {
  switch (action.type) {
    case 'create_project':
      return handleCreateProject(action, callbacks.createTwin)

    case 'add_measure':
      return handleAddMeasure(action, twins, activeTwinId, callbacks.addMeasure)

    case 'update_measure':
      return handleUpdateMeasure(action, twins, callbacks.updateMeasure)

    case 'show_twin':
      return handleShowTwin(action, twins, callbacks.showTwin)

    default:
      return Promise.resolve({ success: false, message: 'Unbekannte Aktion' })
  }
}

async function handleCreateProject(
  action: ChatAction,
  createTwin: (input: string, title?: string) => Promise<StoredProjectTwin | null>
): Promise<ActionResult> {
  const title = action.payload?.title as string || 'Neues Projekt'
  const description = action.payload?.description as string || ''
  const input = `${title}${description ? ': ' + description : ''}`

  const twin = await createTwin(input, title)

  if (twin) {
    return {
      success: true,
      message: `Projekt "${title}" wurde erstellt.`,
      twin
    }
  }

  return {
    success: false,
    message: 'Projekt konnte nicht erstellt werden.'
  }
}

async function handleAddMeasure(
  action: ChatAction,
  twins: StoredProjectTwin[],
  activeTwinId: string | null,
  addMeasure: (twinId: string, measure: Partial<Measure>) => Promise<Measure | null>
): Promise<ActionResult> {
  const projectId = action.projectId || activeTwinId

  if (!projectId) {
    return {
      success: false,
      message: 'Kein Projekt ausgewählt. Bitte wähle zuerst ein Projekt aus.'
    }
  }

  const twin = twins.find(t => t.id === projectId)
  if (!twin) {
    return {
      success: false,
      message: 'Projekt nicht gefunden.'
    }
  }

  const measureData = {
    title: (action.payload?.title as string) || 'Neue Maßnahme',
    description: action.payload?.description as string,
    dueDate: action.payload?.dueDate as string
  }

  const measure = await addMeasure(projectId, measureData)

  if (measure) {
    return {
      success: true,
      message: `Maßnahme "${measure.title}" wurde zu "${twin.title}" hinzugefügt.`,
      measure
    }
  }

  return {
    success: false,
    message: 'Maßnahme konnte nicht hinzugefügt werden.'
  }
}

async function handleUpdateMeasure(
  action: ChatAction,
  twins: StoredProjectTwin[],
  updateMeasure: (twinId: string, measureId: string, updates: Partial<Measure>) => Promise<boolean>
): Promise<ActionResult> {
  const projectId = action.projectId
  const measureId = action.payload?.measureId as string

  if (!projectId || !measureId) {
    const title = action.payload?.title as string
    if (title) {
      for (const twin of twins) {
        const measure = twin.measures?.find(m =>
          m.title.toLowerCase().includes(title.toLowerCase())
        )
        if (measure) {
          const success = await updateMeasure(twin.id, measure.id, action.payload || {})
          return {
            success,
            message: success ? `Maßnahme "${measure.title}" aktualisiert.` : 'Aktualisierung fehlgeschlagen.'
          }
        }
      }
    }

    return {
      success: false,
      message: 'Maßnahme nicht gefunden. Bitte gib den Titel oder die ID an.'
    }
  }

  const success = await updateMeasure(projectId, measureId, action.payload || {})

  return {
    success,
    message: success ? 'Maßnahme aktualisiert.' : 'Aktualisierung fehlgeschlagen.'
  }
}

async function handleShowTwin(
  action: ChatAction,
  twins: StoredProjectTwin[],
  showTwin: (twinId: string) => void
): Promise<ActionResult> {
  let projectId = action.projectId

  if (!projectId && action.payload?.title) {
    const title = action.payload.title as string
    const twin = twins.find(t =>
      t.title.toLowerCase().includes(title.toLowerCase())
    )
    if (twin) {
      projectId = twin.id
    }
  }

  if (!projectId) {
    return {
      success: false,
      message: 'Projekt nicht gefunden.'
    }
  }

  showTwin(projectId)

  const twin = twins.find(t => t.id === projectId)
  return {
    success: true,
    message: twin ? `Projekt "${twin.title}" wird angezeigt.` : 'Projekt wird angezeigt.'
  }
}
