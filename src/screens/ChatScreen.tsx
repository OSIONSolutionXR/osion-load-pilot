import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send,
  User,
  Wifi,
  WifiOff,
  Loader2,
  StopCircle,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { ChatMessage, ChatSession } from '../types/chat'
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
  mode?: 'general' | 'project'
}

const MAX_MESSAGE_LENGTH = 4000

const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

// Premium Chat Theme
const chatTheme = {
  pageBg: "#070A12",
  panelBg: "#0B1020",
  cardBg: "#121826",
  border: "rgba(148, 163, 184, 0.12)",
  borderStrong: "rgba(148, 163, 184, 0.25)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  userBubble: "#3B82F6",
  assistantBubble: "#1E293B"
}

export default function ChatScreen({
  twins,
  activeTwinId,
  mode = 'project'
}: ChatScreenProps) {
  // Session State
  const [session, setSession] = useState(() => {
    const saved = loadChatSession()
    return saved || createNewSession(activeTwinId)
  })

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Persist session
  useEffect(() => {
    saveChatSession(session)
  }, [session])

  // Update session when activeTwinId changes
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

  // Check connection
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
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`
    }
  }, [inputText])

  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking')
    const result = await checkChatConnection()
    setConnectionStatus(result.connected ? 'connected' : 'error')
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

    setSession((prev: ChatSession) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      updatedAt: new Date().toISOString()
    }))
    setInputText('')
    setIsLoading(true)

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const response = await sendChatMessageEnhanced(
        userMessage.content,
        twins,
        activeTwinId,
        session.messages
      )

      if ('error' in response) {
        throw new Error(response.error)
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toISOString()
      }

      setSession((prev: ChatSession) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        updatedAt: new Date().toISOString()
      }))

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
  }, [inputText, isLoading, twins, activeTwinId, session.messages])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setIsLoading(false)
  }, [])

  // Compact Status Chip - Top Right Corner
  const StatusChip = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Verbinde...</span>
        </div>
      )
    }
    if (connectionStatus === 'error') {
      return (
        <button
          onClick={checkConnection}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <WifiOff className="h-3 w-3" />
          <span>Nicht verbunden</span>
          <RefreshCw className="h-3 w-3" />
        </button>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
        <Wifi className="h-3 w-3" />
        <span>KI verbunden</span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Card Container */}
      <div 
        className="flex-1 flex flex-col rounded-3xl border overflow-hidden"
        style={{ 
          backgroundColor: chatTheme.panelBg,
          borderColor: chatTheme.border
        }}
      >
        {/* Header with Status */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: chatTheme.border }}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              mode === 'general' 
                ? 'bg-cyan-500/10 border border-cyan-500/30' 
                : 'bg-violet-500/10 border border-violet-500/30'
            }`}>
              <Sparkles className={`w-5 h-5 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">{mode === 'general' ? 'Allgemeiner Chat' : 'Projekt-Chat'}</h2>
              <p className="text-xs text-slate-500">
                {mode === 'general' 
                  ? 'Projektübergreifende Steuerung' 
                  : activeTwinId 
                    ? 'Projektspezifische Unterstützung'
                    : 'Wähle ein Projekt'
                }
              </p>
            </div>
          </div>
          <StatusChip />
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6"
          style={{ backgroundColor: 'rgba(7, 10, 18, 0.5)' }}
        >
          {session.messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                mode === 'general'
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'bg-violet-500/10 border border-violet-500/20'
              }`}>
                <Sparkles className={`w-8 h-8 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
              </div>
              <p className="text-lg font-medium text-slate-300 mb-2">
                {mode === 'general' ? 'Allgemeiner Chat' : 'Projekt-Chat'}
              </p>
              <p className="text-sm text-slate-500 max-w-sm">
                {mode === 'general'
                  ? 'Stelle projektübergreifende Fragen oder frage nach einer Übersicht aller Projekte.'
                  : 'Stelle Fragen zu deinem Projekt. OSION nutzt den aktuellen Stand für kontextsensitive Antworten.'
                }
              </p>
            </div>
          )}

          {session.messages.map((message: ChatMessage) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="mr-4 flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-violet-300" />
                  </div>
                </div>
              )}

              {message.role === 'system' && (
                <div className="mx-auto">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/50 bg-slate-800/50 px-4 py-1.5 text-xs text-slate-400">
                    {message.content.includes('✅') && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                    {message.content.includes('❌') && <AlertCircle className="h-3 w-3 text-rose-400" />}
                    {message.content.replace(/[✅❌]/g, '').trim()}
                  </div>
                </div>
              )}

              {message.role !== 'system' && (
                <div className="max-w-[75%]">
                  <div
                    className={`rounded-2xl px-5 py-4 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md'
                        : message.isError
                          ? 'border border-rose-500/30 bg-rose-500/10 text-rose-100 rounded-bl-md'
                          : 'bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-bl-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    <div className={`mt-2 text-[10px] ${
                      message.role === 'user' ? 'text-blue-200/70' : 'text-slate-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>                  
                </div>
              )}

              {message.role === 'user' && (
                <div className="ml-4 flex-shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                    <User className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-4 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-violet-300" />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 px-5 py-4 rounded-bl-md">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span className="text-sm text-slate-400">OSION denkt nach...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-6 py-4 border-t" style={{ borderColor: chatTheme.border, backgroundColor: chatTheme.panelBg }}>
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
            <div className="flex items-end gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-2 focus-within:border-violet-500/40 focus-within:bg-slate-900/80 transition-all">
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
                  ? "KI nicht verbunden..."
                  : mode === 'general'
                    ? "Frage zu allen Projekten stellen..."
                    : "Nachricht an OSION..."
                }
                disabled={isLoading || connectionStatus === 'error'}
                className="min-h-[44px] flex-1 resize-none bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none py-2.5 px-3"
                rows={1}
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || connectionStatus === 'error'}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-400 hover:scale-105 disabled:scale-100 disabled:opacity-40"
              >
                {isLoading ? (
                  <StopCircle className="h-4 w-4" onClick={(e) => { e.stopPropagation(); handleStop(); }} />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="mt-2 flex justify-between items-center text-[10px] text-slate-500">
              <span>Enter zum Senden · Shift+Enter für Zeilenumbruch</span>
              <span className={inputText.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-amber-400' : ''}>
                {inputText.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
