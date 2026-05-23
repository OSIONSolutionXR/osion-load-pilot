import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle,
  FolderKanban,
  ChevronDown,
  Wifi,
  WifiOff,
  Loader2,
  StopCircle,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { sendChatMessage } from '../services/chatService'
import type { ChatMessage, ChatStatus } from '../types/chat'

interface ChatScreenProps {
  twins: StoredProjectTwin[]
  activeTwinId: string | null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onOpenTwin: (_id: string) => void
}

type ProjectContextValue = 'all' | 'active' | { twinId: string; title: string }

const MAX_MESSAGE_LENGTH = 4000

// Utility functions
const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

export default function ChatScreen({ twins, activeTwinId, onOpenTwin: _onOpenTwin }: ChatScreenProps) {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [projectContext, setProjectContext] = useState<ProjectContextValue>('active')
  const [chatStatus, setChatStatus] = useState<ChatStatus>('idle')
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
        content: 'Willkommen im OSION KI-Chat. Ich helfe dir bei der Projektsteuerung, Maßnahmen und Freigaben.\n\nWähle ein Projekt aus dem Dropdown oder stelle mir eine Frage.',
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
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`
    }
  }, [inputText])

  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking')
    try {
      const response = await fetch('/api/chat', { method: 'HEAD' })
      setConnectionStatus(response.ok ? 'connected' : 'error')
    } catch {
      setConnectionStatus('error')
    }
  }, [])

  const activeTwin = useMemo(() => {
    if (projectContext === 'all') return null
    if (projectContext === 'active') {
      return twins.find(t => t.id === activeTwinId) || twins[0] || null
    }
    return twins.find(t => t.id === projectContext.twinId) || null
  }, [twins, activeTwinId, projectContext])

  const contextLabel = useMemo(() => {
    if (projectContext === 'all') return 'Alle Projekte'
    if (projectContext === 'active') {
      const twin = twins.find(t => t.id === activeTwinId)
      return twin ? twin.title : 'Kein aktives Projekt'
    }
    return projectContext.title
  }, [projectContext, twins, activeTwinId])

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || chatStatus === 'loading') return
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
    setChatStatus('loading')

    // Cancel any pending request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    try {
      const projectContextData = activeTwin ? {
        projectId: activeTwin.id,
        projectTitle: activeTwin.title,
        measuresCount: 0,
        risksCount: 0,
        contactsCount: 0
      } as const : undefined

      const response = await sendChatMessage(
        userMessage.content,
        messages.map(m => ({ 
          role: m.role, 
          content: m.content, 
          timestamp: m.timestamp 
        } as const)),
        projectContextData
      )

      if ('error' in response) {
        throw new Error(response.error)
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: response.text || 'Keine Antwort erhalten.',
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      setChatStatus('success')
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
      setChatStatus('error')
      setConnectionStatus('error')
    }
  }, [inputText, chatStatus, messages, activeTwin])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    setChatStatus('idle')
  }, [])

  const handleRetry = useCallback(() => {
    checkConnection()
  }, [checkConnection])

  // Status badge
  const StatusBadge = () => {
    if (connectionStatus === 'checking') {
      return (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-400 rounded-full text-xs">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Prüfe...</span>
        </div>
      )
    }
    if (connectionStatus === 'error') {
      return (
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs hover:bg-rose-500/20 transition-colors"
        >
          <WifiOff className="w-3 h-3" />
          <span>Nicht verbunden</span>
          <RefreshCw className="w-3 h-3 ml-1" />
        </button>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs">
        <Wifi className="w-3 h-3" />
        <span>KI verbunden</span>
      </div>
    )
  }

  // Suggestions panel (only show if we have actual suggestions in a real implementation)
  const hasSuggestions = false // Will be populated from actual AI responses

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">OSION KI-Chat</h2>
              <p className="text-sm text-zinc-500">Projektsteuerung, Maßnahmen, Freigaben und Verbindungen per KI bearbeiten</p>
            </div>
          </div>
        </div>
        <StatusBadge />
      </div>

      {/* Project Context Selector */}
      <div className="relative mb-6">
        <button
          onClick={() => setShowContextDropdown(!showContextDropdown)}
          className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm transition-all"
        >
          <FolderKanban className="w-4 h-4 text-zinc-400" />
          <div className="text-left">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Projektkontext</div>
            <div className="text-zinc-200 font-medium">{contextLabel}</div>
          </div>
          <ChevronDown className={`w-4 h-4 text-zinc-500 ml-4 transition-transform ${showContextDropdown ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showContextDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <button
                onClick={() => { setProjectContext('all'); setShowContextDropdown(false); }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-3 ${
                  projectContext === 'all' ? 'bg-zinc-800/50 text-violet-400' : 'text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <FolderKanban className="w-4 h-4 text-zinc-500" />
                </div>
                Alle Projekte
              </button>
              <button
                onClick={() => { setProjectContext('active'); setShowContextDropdown(false); }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-3 ${
                  projectContext === 'active' ? 'bg-zinc-800/50 text-violet-400' : 'text-zinc-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-zinc-500" />
                </div>
                Aktives Projekt
              </button>
              {twins.length > 0 && <div className="border-t border-zinc-800 my-1" />}
              {twins.map(twin => (
                <button
                  key={twin.id}
                  onClick={() => { setProjectContext({ twinId: twin.id, title: twin.title }); setShowContextDropdown(false); }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center gap-3 ${
                    typeof projectContext === 'object' && projectContext.twinId === twin.id 
                      ? 'bg-zinc-800/50 text-violet-400' 
                      : 'text-zinc-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="truncate">{twin.title}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index === messages.length - 1 ? 0 : 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-violet-600' 
                      : message.isError 
                        ? 'bg-rose-500/20' 
                        : 'bg-zinc-800'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : message.isError ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-violet-400" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-violet-600 text-white'
                      : message.isError
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-100'
                        : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-200'
                  }`}>
                    {/* Content with markdown-like formatting */}
                    <div className="whitespace-pre-wrap">
                      {message.content.split('\n').map((line, i) => {
                        // Bold text **text**
                        const parts = line.split(/(\*\*.*?\*\*)/g)
                        return (
                          <span key={i}>
                            {parts.map((part, j) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                              }
                              return part
                            })}
                            {i < message.content.split('\n').length - 1 && <br />}
                          </span>
                        )
                      })}
                    </div>
                    
                    {/* Timestamp */}
                    <div className={`text-[10px] mt-2 ${
                      message.role === 'user' ? 'text-violet-200/60' : 'text-zinc-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {chatStatus === 'loading' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-violet-400" />
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>KI arbeitet...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="relative">
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
                  : "Stelle eine Frage..."
                }
                disabled={chatStatus === 'loading' || connectionStatus === 'error'}
                className="w-full min-h-[56px] max-h-[160px] px-4 py-3 pr-14 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                rows={1}
              />
              
              {/* Send/Stop Button */}
              <div className="absolute right-3 bottom-3">
                {chatStatus === 'loading' ? (
                  <button
                    onClick={handleStop}
                    className="p-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg transition-colors"
                    title="Abbrechen"
                  >
                    <StopCircle className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || connectionStatus === 'error'}
                    className="p-2 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    title="Senden"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Character count */}
            <div className="flex justify-between items-center mt-2 text-xs text-zinc-500">
              <span>{inputText.length}/{MAX_MESSAGE_LENGTH} Zeichen</span>
              <span className="hidden sm:inline">Enter zum Senden, Shift+Enter für Zeilenumbruch</span>
            </div>
          </div>
        </div>

        {/* Right: Suggestions Panel */}
        <div className="w-80 flex-shrink-0 hidden lg:block">
          <div className="sticky top-0">
            <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              KI-Vorschläge
            </h3>
            
            {hasSuggestions ? (
              <div className="space-y-3">
                {/* Suggestions would go here */}
              </div>
            ) : (
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center">
                <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 mb-2">
                  Noch keine Vorschläge
                </p>
                <p className="text-xs text-zinc-600">
                  Sobald ein Projekt aktiv ist oder du eine Frage stellst, erscheinen hier passende Vorschläge.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
