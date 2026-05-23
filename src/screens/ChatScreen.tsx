import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  Bot,
  User,
  Wifi,
  WifiOff,
  Loader2,
  StopCircle,
  RefreshCw,
  FolderKanban,
  ChevronDown,
  Sparkles,
  MessageSquare
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

  // @ts-expect-error - activeTwin wird später für Projektkontext an KI übergeben
  const _activeTwin = useMemo(() => {
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

    // Cancel any pending request
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
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs text-amber-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Verbinde...</span>
        </div>
      )
    }
    if (connectionStatus === 'error') {
      return (
        <button
          onClick={checkConnection}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-xs text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <WifiOff className="w-3 h-3" />
          <span>Nicht verbunden</span>
          <RefreshCw className="w-3 h-3 ml-1" />
        </button>
      )
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400">
        <Wifi className="w-3 h-3" />
        <span>KI verbunden</span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">OSION KI-Chat</h1>
            <p className="text-sm text-white/50">Projektsteuerung, Maßnahmen, Freigaben und Verbindungen per KI bearbeiten</p>
          </div>
        </div>
        <StatusBadge />
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/50 rounded-2xl border border-white/10 overflow-hidden">
          {/* Project Context Selector */}
          <div className="px-6 py-4 border-b border-white/10">
            <div className="relative">
              <button
                onClick={() => setShowContextDropdown(!showContextDropdown)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
              >
                <FolderKanban className="w-4 h-4 text-white/50" />
                <div className="text-left">
                  <div className="text-xs text-white/40 uppercase tracking-wide">Projektkontext</div>
                  <div className="text-white font-medium">{contextLabel}</div>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/50 ml-4 transition-transform ${showContextDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showContextDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => { setProjectContext('all'); setShowContextDropdown(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 ${
                        projectContext === 'all' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <FolderKanban className="w-4 h-4 text-white/50" />
                      </div>
                      Alle Projekte
                    </button>
                    <button
                      onClick={() => { setProjectContext('active'); setShowContextDropdown(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 ${
                        projectContext === 'active' ? 'bg-violet-500/20 text-violet-300' : 'text-zinc-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      Aktives Projekt
                    </button>
                    {twins.length > 0 && <div className="border-t border-white/10 my-1" />}
                    {twins.map(twin => (
                      <button
                        key={twin.id}
                        onClick={() => { setProjectContext({ twinId: twin.id, title: twin.title }); setShowContextDropdown(false); }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-white/5 transition-colors flex items-center gap-3 ${
                          typeof projectContext === 'object' && projectContext.twinId === twin.id 
                            ? 'bg-violet-500/20 text-violet-300' 
                            : 'text-zinc-300'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <FolderKanban className="w-4 h-4 text-white/50" />
                        </div>
                        <span className="truncate">{twin.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((msg, _index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user' 
                      ? 'bg-violet-500' 
                      : msg.isError 
                        ? 'bg-rose-500/20 border border-rose-500/30' 
                        : 'bg-white/10 border border-white/20'
                  }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : msg.isError ? (
                      <div className="text-rose-400 font-bold text-sm">!</div>
                    ) : (
                      <Bot className="w-5 h-5 text-violet-300" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-white text-black'
                      : msg.isError
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-100'
                        : 'bg-zinc-900 border border-white/10 text-white'
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
                    
                    <div className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-black/40' : 'text-white/30'
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
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-300" />
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-3 text-white/50">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">OSION X ONE denkt...</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-white/10">
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
                  : "Schreibe eine Nachricht..."
                }
                disabled={isLoading || connectionStatus === 'error'}
                className="w-full min-h-[60px] max-h-[160px] px-5 py-4 pr-16 bg-white text-black rounded-xl text-sm placeholder:text-black/40 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                rows={1}
              />
              
              <div className="absolute right-3 bottom-3">
                {isLoading ? (
                  <button
                    onClick={handleStop}
                    className="p-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-colors"
                    title="Abbrechen"
                  >
                    <StopCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || connectionStatus === 'error'}
                    className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:bg-black/20 disabled:text-black/40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    title="Senden"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-white/30">
              <span>{inputText.length}/{MAX_MESSAGE_LENGTH} Zeichen</span>
              <span className="hidden sm:inline">Enter zum Senden, Shift+Enter für Zeilenumbruch</span>
            </div>
          </div>
        </div>

        {/* Right: Suggestions Panel */}
        <div className="w-80 flex-shrink-0 hidden xl:block">
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              KI-Vorschläge
            </h3>
            
            <div className="bg-black/50 border border-white/5 rounded-xl p-6 text-center">
              <MessageSquare className="w-10 h-10 text-white/20 mx-auto mb-4" />
              <p className="text-sm text-white/50 mb-2">
                Noch keine Vorschläge
              </p>
              <p className="text-xs text-white/30">
                Sobald ein Projekt aktiv ist oder du eine Frage stellst, erscheinen hier passende nächste Schritte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
