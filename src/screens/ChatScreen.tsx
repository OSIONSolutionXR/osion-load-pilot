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
  MessageSquare,
  Zap,
  AlertCircle
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { sendChatMessage, checkChatConnection, type ChatMessage } from '../services/chatService'

interface ChatScreenProps {
  twins: StoredProjectTwin[]
  activeTwinId: string | null
  onOpenTwin: (_id: string) => void
}

type ProjectContextValue = 'all' | 'active' | { twinId: string; title: string }

const MAX_MESSAGE_LENGTH = 4000

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// Chat Theme Colors
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

export default function ChatScreen({ twins, activeTwinId, onOpenTwin: _onOpenTwin }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [projectContext, setProjectContext] = useState<ProjectContextValue>('active')
  const [isLoading, setIsLoading] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: generateMessageId(),
        role: 'assistant',
        content: 'Willkommen im OSION KI-Chat. Ich bin OSION X ONE, deine KI-Assistenz für Projektsteuerung.\n\nWie kann ich dir helfen?',
        timestamp: new Date().toISOString()
      }])
    }
  }, [messages.length])

  // Check connection on mount
  useEffect(() => {
    checkConnection()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  const contextLabel = useMemo(() => {
    if (projectContext === 'all') return 'Alle Projekte'
    if (projectContext === 'active') {
      const twin = twins.find(t => t.id === activeTwinId)
      return twin ? twin.title : 'Kein aktives Projekt'
    }
    return projectContext.title
  }, [projectContext, twins, activeTwinId])

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

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const response = await sendChatMessage(userMessage.content, history)

      if ('error' in response) {
        throw new Error(response.error)
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      setConnectionStatus('connected')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: `**KI-Verbindung nicht erreichbar**\n\n${errorMessage}\n\nBitte prüfe die Verbindung oder versuche es später erneut.`,
        timestamp: new Date().toISOString(),
        isError: true
      }

      setMessages(prev => [...prev, errorMsg])
      setConnectionStatus('error')
    } finally {
      setIsLoading(false)
    }
  }, [inputText, isLoading, messages])

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
      className="min-h-full p-6"
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        
        {/* Left: Chat Main Panel */}
        <section 
          className="flex min-h-[720px] flex-col overflow-hidden rounded-3xl border shadow-2xl"
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
                  <span className="font-medium">{contextLabel}</span>
                </div>
                <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform ${showContextDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showContextDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl"
                  >
                    <button
                      onClick={() => { setProjectContext('all'); setShowContextDropdown(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        projectContext === 'all' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                        <FolderKanban className="h-4 w-4 text-slate-500" />
                      </div>
                      Alle Projekte
                    </button>
                    <button
                      onClick={() => { setProjectContext('active'); setShowContextDropdown(false); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                        projectContext === 'active' ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                      Aktives Projekt
                    </button>
                    {twins.length > 0 && <div className="border-t border-slate-800 my-1" />}
                    {twins.map(twin => (
                      <button
                        key={twin.id}
                        onClick={() => { setProjectContext({ twinId: twin.id, title: twin.title }); setShowContextDropdown(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                          typeof projectContext === 'object' && projectContext.twinId === twin.id 
                            ? 'bg-violet-500/20 text-violet-300' 
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800">
                          <FolderKanban className="h-4 w-4 text-slate-500" />
                        </div>
                        <span className="truncate">{twin.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div 
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-br from-blue-600 to-violet-600' 
                        : msg.isError 
                          ? 'bg-rose-500/20 border border-rose-500/30' 
                          : 'bg-slate-800 border border-slate-700'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="h-5 w-5 text-white" />
                    ) : msg.isError ? (
                      <AlertCircle className="h-5 w-5 text-rose-400" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-violet-300" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div 
                    className={`max-w-[78%] rounded-2xl px-5 py-4 shadow-lg ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-violet-600 text-white'
                        : msg.isError
                          ? 'border border-rose-500/20 bg-rose-500/10 text-rose-100'
                          : 'border border-slate-700 bg-slate-900 text-slate-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {msg.content.split('\n').map((line, i) => {
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <span key={i}>
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                              }
                              return part
                            })}
                            {i < msg.content.split('\n').length - 1 && <br />}
                          </span>
                        )
                      })}
                    </div>
                    <div className={`mt-2 text-xs ${
                      msg.role === 'user' ? 'text-white/60' : 'text-slate-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                </div>
                <div className="max-w-[78%] rounded-2xl border border-slate-700 bg-slate-900 px-5 py-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">OSION X ONE denkt...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div 
            className="border-t p-4"
            style={{ borderColor: chatTheme.border, backgroundColor: 'rgba(15, 23, 42, 0.88)' }}
          >
            <form 
              className="rounded-2xl border p-3 transition-all focus-within:border-violet-500 focus-within:shadow-[0_0_0_4px_rgba(139,92,246,0.14)]"
              style={{ borderColor: 'rgba(148, 163, 184, 0.25)', backgroundColor: chatTheme.inputBg }}
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            >
              <div className="flex gap-3">
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
                    : "Schreibe an OSION..."
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
          className="rounded-3xl border p-5 shadow-2xl"
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

          <div className="space-y-3">
            {/* Empty State */}
            <div className="rounded-2xl border border-dashed p-6 text-center" style={{ borderColor: 'rgba(148, 163, 184, 0.25)', backgroundColor: 'rgba(15, 23, 42, 0.74)' }}>
              <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-500" />
              <p className="font-semibold text-slate-200">Noch keine Vorschläge</p>
              <p className="mt-1 text-sm text-slate-500">
                Sobald Du eine Frage stellst oder ein Projekt auswählst, erscheinen hier passende nächste Schritte.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-600">Schnellbefehle</p>
              <div className="flex flex-wrap gap-2">
                {['Blockierte Maßnahmen', 'Fällige Aufgaben', 'Freigaben prüfen'].map((label) => (
                  <button
                    key={label}
                    disabled={connectionStatus === 'error'}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-all hover:border-violet-500 hover:text-white disabled:opacity-50"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
