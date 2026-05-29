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

  // Compact Status Chip
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
      {/* Header - Fixed at top */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/30 flex-shrink-0 bg-[#0d1320]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            mode === 'general' 
              ? 'bg-cyan-500/10 border border-cyan-500/30' 
              : 'bg-violet-500/10 border border-violet-500/30'
          }`}>
            <Sparkles className={`w-4 h-4 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm">{mode === 'general' ? 'Allgemeiner Chat' : 'Projekt-Chat'}</h2>
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

      {/* Messages Area - SCROLLABLE ONLY THIS PART */}
      <div 
        className="flex-1 overflow-y-auto bg-[#0a0f1a]"
        style={{ padding: '20px 24px' }}
      >
        {session.messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              mode === 'general'
                ? 'bg-cyan-500/10 border border-cyan-500/20'
                : 'bg-violet-500/10 border border-violet-500/20'
            }`}>
              <Sparkles className={`w-7 h-7 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
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
            style={{ marginBottom: '16px' }}
          >
            {message.role === 'assistant' && (
              <div className="mr-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
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
              <div style={{ maxWidth: 'min(680px, 82%)' }}>
                <div
                  className={`text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-xl'
                      : message.isError
                        ? 'border border-rose-500/30 bg-rose-500/10 text-rose-100 rounded-bl-xl'
                        : 'bg-slate-800/80 text-slate-100 border border-slate-700/50 rounded-bl-xl'
                  }`}
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '16px',
                  }}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`mt-1.5 text-[10px] ${
                    message.role === 'user' ? 'text-blue-200/70' : 'text-slate-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>                  
              </div>
            )}

            {message.role === 'user' && (
              <div className="ml-3 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start" style={{ marginBottom: '16px' }}>
            <div className="mr-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-violet-300" />
              </div>
            </div>
            <div 
              className="border border-slate-700/50 bg-slate-800/80 rounded-bl-xl"
              style={{ padding: '12px 16px', borderRadius: '16px' }}
            >
              <div className="flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                <span className="text-sm text-slate-400">OSION denkt nach...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom */}
      <div 
        className="border-t border-slate-700/30 flex-shrink-0"
        style={{ padding: '14px 18px 18px', background: '#0d1320' }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <div 
            className="flex items-end gap-3 transition-all"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '10px',
              alignItems: 'end',
              borderRadius: '16px',
              background: '#1a2236',
              border: '1px solid rgba(148, 163, 184, 0.22)',
              padding: '10px 10px 10px 14px'
            }}
          >
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
              className="bg-transparent border-0 outline-0 text-slate-100 placeholder:text-slate-500 resize-none"
              style={{
                minHeight: '48px',
                maxHeight: '160px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              rows={1}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading || connectionStatus === 'error'}
              className="text-white transition-all hover:scale-105 disabled:scale-100 disabled:opacity-40 flex items-center justify-center"
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)'
              }}
            >
              {isLoading ? (
                <StopCircle className="h-5 w-5" onClick={(e) => { e.stopPropagation(); handleStop(); }} />
              ) : (
                <Send className="h-5 w-5" />
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
  )
}
