import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  User,
  Wifi,
  WifiOff,
  Loader2,
  StopCircle,
  RefreshCw,
  FolderKanban,
  ChevronDown,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
  Plus,
  List,
  LayoutGrid,
  X
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { ChatMessage, ChatSuggestion, ChatSession } from '../types/chat'
import {
  sendChatMessageEnhanced,
  checkChatConnection,
  loadChatSession,
  saveChatSession,
  createNewSession
} from '../services/chatService'

interface ChatScreenProps {
  twins: StoredProjectTwin[]
  activeTwinId: string | null
  onOpenTwin: (id: string) => void
  onCreateTwin?: (input: string, title?: string) => Promise<StoredProjectTwin | null>
  onAddMeasure?: (twinId: string, measure: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low'
  }) => Promise<boolean>
  onUpdateMeasure?: (twinId: string, measureId: string, updates: { status?: string }) => Promise<boolean>
  onUpdateTwin?: (twinId: string, updates: { latestInput?: string; memory?: string[] }) => Promise<boolean>
}

// Project Context Types
type ProjectContextOption =
  | { type: 'none'; label: string }
  | { type: 'all'; label: string }
  | { type: 'project'; id: string; label: string; description?: string }

const MAX_MESSAGE_LENGTH = 4000

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// Chat Theme
const chatTheme = {
  pageBg: "#070A12",
  panelBg: "#0B1020",
  panelBgSoft: "#111827",
  cardBg: "#121826",
  cardBgHover: "#172033",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(148, 163, 184, 0.32)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  inputBg: "#0F172A",
  assistantBubble: "#111827",
  userBubble: "#2563EB",
  accent: "#8B5CF6",
  accent2: "#EC4899",
  danger: "#FB7185",
  success: "#22C55E"
}

// ============================================================================
// INLINE SUGGESTION BUTTONS COMPONENT
// ============================================================================

interface InlineSuggestionButtonsProps {
  suggestions: ChatSuggestion[]
  onAction: (suggestion: ChatSuggestion, action: 'accept' | 'reject' | 'edit') => void
  executingId: string | null
}

function InlineSuggestionButtons({ suggestions, onAction, executingId }: InlineSuggestionButtonsProps) {
  if (!suggestions || suggestions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <motion.div
          key={suggestion.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex"
        >
          {executingId === suggestion.id ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium py-2 px-3">
              <Loader2 className="h-3 w-3 animate-spin" />
              Wird ausgeführt...
            </span>
          ) : (
            <button
              onClick={() => onAction(suggestion, 'accept')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-xs font-medium py-2 px-3 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3" />
              {suggestion.type === 'create_project' && 'Projekt erstellen'}
              {suggestion.type === 'create_measure' && 'Maßnahme erstellen'}
              {suggestion.type === 'project_update' && 'Speichern'}
              {suggestion.type === 'update_measure' && 'Aktualisieren'}
              {suggestion.type === 'open_project' && 'Öffnen'}
              {suggestion.type === 'show_twin' && 'Twin anzeigen'}
              {!['create_project', 'create_measure', 'project_update', 'update_measure', 'open_project', 'show_twin'].includes(suggestion.type) && suggestion.title}
            </button>
          )}
        </motion.div>
      ))}
    </div>
  )
}

export default function ChatScreen({
  twins,
  activeTwinId,
  onOpenTwin,
  onCreateTwin,
  onAddMeasure,
  onUpdateMeasure,
  onUpdateTwin
}: ChatScreenProps) {
  // Session State (persisted)
  const [session, setSession] = useState(() => {
    const saved = loadChatSession()
    return saved || createNewSession(activeTwinId)
  })

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [pendingSuggestions, setPendingSuggestions] = useState<ChatSuggestion[]>([])
  const [executingSuggestionId, setExecutingSuggestionId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Selected project context
  const selectedProjectId = session.selectedProjectId

  // Build context options from real projects
  const contextOptions: ProjectContextOption[] = useMemo(() => {
    const options: ProjectContextOption[] = [
      { type: 'none', label: 'Kein aktives Projekt' },
      { type: 'all', label: 'Alle Projekte' }
    ]

    twins.forEach(twin => {
      options.push({
        type: 'project',
        id: twin.id,
        label: twin.title,
        description: twin.description?.slice(0, 60) + (twin.description && twin.description.length > 60 ? '...' : '') || undefined
      })
    })

    return options
  }, [twins])

  const currentContextLabel = useMemo(() => {
    if (!selectedProjectId) return 'Kein aktives Projekt'
    if (selectedProjectId === 'all') return 'Alle Projekte'
    const twin = twins.find(t => t.id === selectedProjectId)
    return twin?.title || 'Unbekanntes Projekt'
  }, [selectedProjectId, twins])

  // Persist session on change
  useEffect(() => {
    saveChatSession(session)
  }, [session])

  // Update session when activeTwinId changes from outside
  useEffect(() => {
    if (activeTwinId && activeTwinId !== session.selectedProjectId) {
      setSession((prev: ChatSession) => ({
        ...prev,
        selectedProjectId: activeTwinId,
        scope: 'selected',
        updatedAt: new Date().toISOString()
      }))
    }
  }, [activeTwinId])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session.messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [inputText])

  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking')
    const result = await checkChatConnection()
    setConnectionStatus(result.connected ? 'connected' : 'error')
  }, [])

  const handleContextSelect = useCallback((option: ProjectContextOption) => {
    const newProjectId = option.type === 'project' ? option.id :
      option.type === 'all' ? 'all' : null

    setSession((prev: ChatSession) => ({
      ...prev,
      selectedProjectId: newProjectId,
      scope: option.type === 'all' ? 'all' : option.type === 'project' ? 'selected' : 'none',
      updatedAt: new Date().toISOString()
    }))

    setShowContextDropdown(false)

    // Add system message about context change
    if (option.type === 'project') {
      addSystemMessage(`Projektkontext gewechselt zu: ${option.label}`)
    } else if (option.type === 'all') {
      addSystemMessage('Projektkontext: Alle Projekte')
    } else {
      addSystemMessage('Kein aktives Projekt ausgewählt')
    }
  }, [])

  const addSystemMessage = useCallback((content: string) => {
    setSession((prev: ChatSession) => ({
      ...prev,
      messages: [...prev.messages, {
        id: generateMessageId(),
        role: 'system',
        content,
        timestamp: new Date().toISOString()
      }],
      updatedAt: new Date().toISOString()
    }))
  }, [])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isLoading) return
    if (inputText.length > MAX_MESSAGE_LENGTH) {
      alert(`Nachricht ist zu lang. Maximal ${MAX_MESSAGE_LENGTH} Zeichen erlaubt.`)
      return
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString()
    }

    // Add user message and clear input
    setSession((prev: ChatSession) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      updatedAt: new Date().toISOString()
    }))
    setInputText('')
    setIsLoading(true)
    setPendingSuggestions([])

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const response = await sendChatMessageEnhanced(
        userMessage.content,
        twins,
        selectedProjectId,
        session.messages
      )

      if ('error' in response) {
        throw new Error(response.error)
      }

      // Debug logging
      console.log('[Chat] API Response:', response)
      console.log('[Chat] Suggestions:', response.suggestions)

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString(),
        suggestions: response.suggestions
      }

      setSession((prev: ChatSession) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      }))

      // Ensure suggestions are properly typed and have required fields
      const validSuggestions = (response.suggestions || []).filter((s): s is ChatSuggestion => 
        s && typeof s.id === 'string' && typeof s.type === 'string'
      )
      console.log('[Chat] Valid suggestions:', validSuggestions)
      setPendingSuggestions(validSuggestions)
      setConnectionStatus('connected')
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `**KI-Verbindung nicht erreichbar**\n\n${error instanceof Error ? error.message : 'Unbekannter Fehler'}\n\nBitte prüfe die Verbindung oder versuche es später erneut.`,
        timestamp: new Date().toISOString(),
        isError: true
      }

      setSession((prev: ChatSession) => ({
        ...prev,
        messages: [...prev.messages, errorMsg],
        updatedAt: new Date().toISOString()
      }))
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, twins, selectedProjectId, session.messages])

  const handleSuggestionAction = useCallback(async (suggestion: ChatSuggestion, action: 'accept' | 'reject' | 'edit') => {
    if (action === 'reject') {
      setPendingSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
      return
    }

    if (action === 'edit') {
      // TODO: Implement edit mode
      return
    }

    // Execute accepted suggestion
    setExecutingSuggestionId(suggestion.id)

    try {
      let success = false
      let message = ''

      switch (suggestion.type) {
        case 'create_measure':
          if (onAddMeasure && suggestion.projectId) {
            const title = suggestion.payload?.title as string || suggestion.title.replace('Maßnahme erstellen: ', '')
            success = await onAddMeasure(suggestion.projectId, {
              title,
              description: suggestion.payload?.description as string,
              dueDate: suggestion.payload?.dueDate as string,
              priority: (suggestion.payload?.priority as any) || 'medium'
            })
            message = success ? `Maßnahme "${title}" erstellt` : 'Fehler beim Erstellen'
          }
          break

        case 'project_update':
          if (onUpdateTwin && suggestion.projectId) {
            success = await onUpdateTwin(suggestion.projectId, {
              latestInput: suggestion.description,
              memory: [suggestion.description]
            })
            message = success ? 'Projektkontext aktualisiert' : 'Fehler beim Speichern'
          }
          break

        case 'open_project':
        case 'show_twin':
          if (suggestion.projectId) {
            onOpenTwin(suggestion.projectId)
            success = true
            message = 'Projekt wird geöffnet'
          }
          break

        case 'create_project':
          if (onCreateTwin) {
            const newTwin = await onCreateTwin(suggestion.title, suggestion.title)
            if (newTwin) {
              success = true
              message = `Projekt "${newTwin.title}" erstellt`
            }
          }
          break

        case 'update_measure':
          if (onUpdateMeasure && suggestion.projectId && suggestion.targetMeasureIds?.[0]) {
            success = await onUpdateMeasure(
              suggestion.projectId,
              suggestion.targetMeasureIds[0],
              { status: 'done' }
            )
            message = success ? 'Maßnahme aktualisiert' : 'Fehler beim Aktualisieren'
          }
          break
      }

      if (success) {
        addSystemMessage(`✅ ${message}`)
        setPendingSuggestions((prev: ChatSuggestion[]) => prev.filter(s => s.id !== suggestion.id))
      } else {
        addSystemMessage(`❌ ${message || 'Aktion konnte nicht ausgeführt werden'}`)
      }
    } catch (e) {
      addSystemMessage(`❌ Fehler: ${e instanceof Error ? e.message : 'Unbekannter Fehler'}`)
    } finally {
      setExecutingSuggestionId(null)
    }
  }, [onAddMeasure, onUpdateTwin, onOpenTwin, onCreateTwin, onUpdateMeasure, addSystemMessage])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  const StatusBadge = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Verbinde...</span>
        </div>
      )
    }
    if (connectionStatus === 'error') {
      return (
        <button
          onClick={checkConnection}
          className="inline-flex items-center gap-2 rounded-full border border-rose-500/35 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition-all hover:bg-rose-500/20"
        >
          <WifiOff className="h-4 w-4" />
          <span>Nicht verbunden</span>
          <RefreshCw className="h-3.5 w-3.5 ml-1" />
        </button>
      )
    }
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
        <Wifi className="h-4 w-4" />
        <span>KI verbunden</span>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-full flex-col p-4 sm:p-6"
      style={{
        background: `radial-gradient(circle at top left, rgba(139, 92, 246, 0.16), transparent 34%),
                    radial-gradient(circle at top right, rgba(37, 99, 235, 0.12), transparent 28%),
                    ${chatTheme.pageBg}`,
        color: chatTheme.textPrimary
      }}
    >
      {/* Header */}
      <header className="mb-6 flex items-center justify-between gap-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-slate-50">
            OSION KI-Chat
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Projektsteuerung, Maßnahmen, Freigaben und Verbindungen per KI bearbeiten
          </p>
        </div>
        <StatusBadge />
      </header>

      {/* Main Grid */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">

        {/* Left: Chat Main Panel */}
        <section
          className="flex h-[60vh] min-h-[400px] max-h-[600px] flex-col overflow-hidden rounded-3xl border shadow-2xl lg:h-[55vh] lg:max-h-[520px]"
          style={{
            backgroundColor: chatTheme.panelBg,
            borderColor: chatTheme.border
          }}
        >
          {/* Toolbar / Project Context */}
          <div
            className="border-b p-4"
            style={{ borderColor: chatTheme.border, backgroundColor: 'rgba(15, 23, 42, 0.78)' }}
          >
            <div className="relative">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Projektkontext
              </label>
              <button
                onClick={() => setShowContextDropdown(!showContextDropdown)}
                className="mt-2 flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left text-slate-100 transition-all hover:border-violet-500/50"
              >
                <div className="flex items-center gap-3">
                  <FolderKanban className="h-5 w-5 text-slate-500" />
                  <div className="flex flex-col">
                    <span className="font-medium truncate">{currentContextLabel}</span>
                    {twins.length > 0 && (
                      <span className="text-xs text-slate-500">{twins.length} Projekt{twins.length !== 1 ? 'e' : ''} verfügbar</span>
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${showContextDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showContextDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl max-h-[300px] overflow-y-auto"
                  >
                    {contextOptions.map((option, idx) => (
                      <button
                        key={option.type === 'project' ? option.id : option.type}
                        onClick={() => handleContextSelect(option)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                          (option.type === 'project' && option.id === selectedProjectId) ||
                          (option.type === 'none' && !selectedProjectId) ||
                          (option.type === 'all' && selectedProjectId === 'all')
                            ? 'bg-violet-500/20 text-violet-300'
                            : 'text-slate-300 hover:bg-slate-800'
                        } ${idx !== 0 ? 'border-t border-slate-800' : ''}`}
                      >
                        {option.type === 'none' && <List className="h-5 w-5 mt-0.5 text-slate-500" />}
                        {option.type === 'all' && <LayoutGrid className="h-5 w-5 mt-0.5 text-slate-500" />}
                        {option.type === 'project' && <FolderKanban className="h-5 w-5 mt-0.5 text-slate-500" />}

                        <div className="flex-1 min-w-0">
                          <span className="block font-medium truncate">{option.label}</span>
                          {option.type === 'project' && option.description && (
                            <span className="block text-xs text-slate-500 truncate">{option.description}</span>
                          )}
                        </div>
                        {(option.type === 'project' && option.id === selectedProjectId) ||
                          (option.type === 'none' && !selectedProjectId) && (
                          <CheckCircle2 className="h-4 w-4 text-violet-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{ backgroundColor: 'rgba(11, 16, 32, 0.6)' }}
          >
            {session.messages.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="mr-3 flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
                      <Sparkles className="h-4 w-4 text-violet-300" />
                    </div>
                  </div>
                )}

                {message.role === 'system' && (
                  <div className="mx-auto max-w-[80%]">
                    <div className="rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-2 text-center text-xs text-slate-400">
                      {message.content}
                    </div>
                  </div>
                )}

                {message.role !== 'system' && (
                  <div className="max-w-[80%]">
                    <div
                      className={`rounded-2xl px-5 py-4 ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                          : message.isError
                            ? 'border border-rose-500/30 bg-rose-500/10 text-rose-200'
                            : 'border border-slate-700/50 bg-slate-800/80 text-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                      <div className={`mt-2 text-[10px] ${
                        message.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {/* Inline Suggestion Buttons */}
                    {message.role === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                      <InlineSuggestionButtons 
                        suggestions={message.suggestions}
                        onAction={handleSuggestionAction}
                        executingId={executingSuggestionId}
                      />
                    )}
                  </div>
                )}

                {message.role === 'user' && (
                  <div className="ml-3 flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-700">
                      <User className="h-4 w-4 text-slate-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="mr-3 flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    <span className="text-sm text-slate-400">OSION denkt nach...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            className="border-t p-4"
            style={{ borderColor: chatTheme.border, backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
          >
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 p-3 focus-within:border-violet-500/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={connectionStatus === 'error'
                    ? "KI nicht verbunden. Bitte Verbindung prüfen..."
                    : selectedProjectId
                      ? `Nachricht an "${currentContextLabel}"...`
                      : "Nachricht an OSION..."
                  }
                  disabled={isLoading || connectionStatus === 'error'}
                  className="min-h-[54px] flex-1 resize-none bg-transparent text-base text-slate-50 placeholder:text-slate-500 outline-none"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading || connectionStatus === 'error'}
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 disabled:scale-100 disabled:opacity-40"
                >
                  {isLoading ? (
                    <StopCircle className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleStop(); }} />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Enter zum Senden, Shift+Enter für Zeilenumbruch</span>
                <span>{inputText.length}/{MAX_MESSAGE_LENGTH} Zeichen</span>
              </div>
            </form>
          </div>
        </section>

        {/* Right: Suggestions Panel */}
        <aside
          className="rounded-3xl border p-5 shadow-2xl flex flex-col"
          style={{ backgroundColor: chatTheme.panelBg, borderColor: chatTheme.border }}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-50">KI-Vorschläge</h2>
              <p className="text-xs text-slate-500">Aktionen und nächste Schritte</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {pendingSuggestions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-6 text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-3 text-slate-600" />
                <p className="text-sm text-slate-400 mb-2">Noch keine Vorschläge</p>
                <p className="text-xs text-slate-500">Stelle eine Frage oder wähle ein Projekt aus, damit OSION nächste Schritte vorbereiten kann.</p>

                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Beispiele:</p>
                  {[
                    'Zeig mir alle Projekte',
                    'Liste alle Maßnahmen',
                    'Was ist blockiert?',
                    'Erstelle Maßnahme XY'
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setInputText(example)}
                      className="block w-full text-left text-xs text-slate-400 hover:text-violet-300 transition-colors"
                    >
                      • {example}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              pendingSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAction={handleSuggestionAction}
                  isExecuting={executingSuggestionId === suggestion.id}
                />
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

// ============================================================================
// SUGGESTION CARD COMPONENT
// ============================================================================

interface SuggestionCardProps {
  suggestion: ChatSuggestion
  onAction: (suggestion: ChatSuggestion, action: 'accept' | 'reject' | 'edit') => void
  isExecuting: boolean
}

function SuggestionCard({ suggestion, onAction, isExecuting }: SuggestionCardProps) {
  const typeIcons: Record<string, React.ReactNode> = {
    create_project: <Plus className="h-4 w-4" />,
    open_project: <FolderKanban className="h-4 w-4" />,
    show_twin: <FolderKanban className="h-4 w-4" />,
    create_measure: <CheckCircle2 className="h-4 w-4" />,
    update_measure: <CheckCircle2 className="h-4 w-4" />,
    project_update: <Zap className="h-4 w-4" />,
    add_project_note: <Sparkles className="h-4 w-4" />,
    list_result: <List className="h-4 w-4" />,
    draft_email: <Send className="h-4 w-4" />,
    approval_item: <AlertCircle className="h-4 w-4" />,
    run_autopilot: <Zap className="h-4 w-4" />
  }

  const typeColors: Record<string, { bg: string; border: string; text: string }> = {
    create_project: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-300' },
    open_project: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
    show_twin: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300' },
    create_measure: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-300' },
    update_measure: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
    project_update: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-300' },
    add_project_note: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' },
    list_result: { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-300' },
    draft_email: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-300' },
    approval_item: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300' },
    run_autopilot: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-300' }
  }

  const colors = typeColors[suggestion.type] || typeColors.list_result

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${colors.bg} ${colors.border}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg p-1.5 ${colors.bg} ${colors.text}`}>
          {typeIcons[suggestion.type] || <Sparkles className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 text-sm truncate">{suggestion.title}</h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{suggestion.description}</p>

          {suggestion.requiresApproval && (
            <div className="mt-2 flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              <span className="text-[10px] text-amber-400">Erfordert Bestätigung</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onAction(suggestion, 'accept')}
          disabled={isExecuting}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 px-3 transition-colors disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Wird ausgeführt...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Übernehmen</span>
            </>
          )}
        </button>

        <button
          onClick={() => onAction(suggestion, 'reject')}
          disabled={isExecuting}
          className="rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-300 p-2 transition-colors disabled:opacity-50"
          title="Ablehnen"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}
