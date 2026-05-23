import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle,
  FolderKanban,
  CheckSquare,
  Users,
  Mail,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  Plus
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { useMeasuresStoreV2, type MeasureV2 } from '../lib/measuresStoreV2'
import { useContactsStore } from '../lib/contactsStore'
import { useEmailAccountsStore } from '../lib/emailAccountsStore'
import { useApprovalQueueStore } from '../lib/approvalQueueStore'
import { useRiskStore } from '../lib/riskStore'

interface ChatScreenProps {
  twins: StoredProjectTwin[]
  activeTwinId: string | null
  onOpenTwin: (id: string) => void
}

type ProjectContext = 'all' | 'active' | { twinId: string; title: string }

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  context?: ProjectContext
}

interface SuggestionCard {
  id: string
  type: 'measure' | 'email_draft' | 'autopilot' | 'checklist' | 'risk' | 'summary'
  title: string
  description: string
  data?: any
  actions: { label: string; variant: 'primary' | 'secondary' | 'danger'; onClick: () => void }[]
}

export default function ChatScreen({ twins, activeTwinId, onOpenTwin }: ChatScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Willkommen im OSION KI-Chat. Ich helfe dir bei der Projektsteuerung, Maßnahmen, Freigaben und Verbindungen.\n\nWähle ein Projekt oder arbeite mit "Alle Projekte" projektübergreifend.',
      timestamp: new Date().toISOString()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [projectContext, setProjectContext] = useState<ProjectContext>('active')
  const [suggestions, setSuggestions] = useState<SuggestionCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showContextDropdown, setShowContextDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Stores
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { measures, addMeasure, updateMeasure: _updateMeasure } = useMeasuresStoreV2()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { contacts, addContact: _addContact } = useContactsStore()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { accounts: _accounts } = useEmailAccountsStore()
  const { items: approvalItems, addItem: addApprovalItem } = useApprovalQueueStore()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { risks: _risks } = useRiskStore()

  // Get active twin
  const activeTwin = useMemo(() => {
    if (projectContext === 'all') return null
    if (projectContext === 'active') {
      return twins.find(t => t.id === activeTwinId) || twins[0] || null
    }
    return twins.find(t => t.id === projectContext.twinId) || null
  }, [twins, activeTwinId, projectContext])

  // Get context label
  const contextLabel = useMemo(() => {
    if (projectContext === 'all') return 'Alle Projekte'
    if (projectContext === 'active') {
      const twin = twins.find(t => t.id === activeTwinId)
      return twin ? `Aktives: ${twin.title}` : 'Kein aktives Projekt'
    }
    return projectContext.title
  }, [projectContext, twins, activeTwinId])

  // Scroll to bottom
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

  // Filter data by context
  const contextMeasures = useMemo(() => {
    if (!activeTwin) return measures
    return measures.filter(m => m.twinId === activeTwin.id)
  }, [measures, activeTwin])

  const contextContacts = useMemo(() => {
    if (!activeTwin) return contacts
    return contacts.filter(c => c.twinId === activeTwin.id)
  }, [contacts, activeTwin])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const contextRisks = useMemo(() => {
    // Risk store doesn't have projectId filtering - use all risks
    return [] // TODO: Add project-specific risks when available
  }, [])

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim()) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      context: projectContext
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setSuggestions([])

    // Simulate AI processing
    setTimeout(() => {
      processUserMessage(userMessage.content)
      setIsLoading(false)
    }, 1000)
  }, [inputText, projectContext])

  // Process user message and generate response
  const processUserMessage = useCallback((content: string) => {
    const lowerContent = content.toLowerCase()
    let response = ''
    let newSuggestions: SuggestionCard[] = []

    // Blockierte Maßnahmen
    if (lowerContent.includes('blockiert') && lowerContent.includes('maßnahme')) {
      const blocked = contextMeasures.filter(m => m.status === 'blocked')
      if (blocked.length === 0) {
        response = 'Keine blockierten Maßnahmen gefunden.'
      } else {
        response = `Ich habe **${blocked.length} blockierte Maßnahme${blocked.length > 1 ? 'n' : ''}** gefunden:`
        newSuggestions = blocked.slice(0, 5).map(m => ({
          id: `blocked-${m.id}`,
          type: 'measure' as const,
          title: m.title,
          description: m.description || 'Keine Beschreibung',
          data: m,
          actions: [
            { label: 'Bearbeiten', variant: 'secondary', onClick: () => handleEditMeasure(m) },
            { label: 'In Twin öffnen', variant: 'primary', onClick: () => activeTwin && onOpenTwin(activeTwin.id) }
          ]
        }))
      }
    }
    // Maßnahme erstellen
    else if (lowerContent.includes('erstelle') && lowerContent.includes('maßnahme')) {
      const titleMatch = content.match(/maßnahme[:\s]+(.+?)(?:\.|$)/i)
      const title = titleMatch ? titleMatch[1].trim() : content.replace(/erstelle.*maßnahme/i, '').trim()
      
      response = `Soll ich eine neue Maßnahme erstellen?`
      newSuggestions = [{
        id: 'create-measure',
        type: 'measure',
        title: title || 'Neue Maßnahme',
        description: 'Vorschlag basierend auf deiner Anfrage',
        actions: [
          { 
            label: 'Übernehmen', 
            variant: 'primary', 
            onClick: () => handleCreateMeasure(title || 'Neue Maßnahme', '') 
          },
          { label: 'Bearbeiten', variant: 'secondary', onClick: () => {} },
          { label: 'Ablehnen', variant: 'danger', onClick: () => setSuggestions([]) }
        ]
      }]
    }
    // E-Mail an Steuerberater
    else if (lowerContent.includes('e-mail') && lowerContent.includes('steuerberater')) {
      response = 'Soll ich einen E-Mail-Entwurf für den Steuerberater erstellen?'
      newSuggestions = [{
        id: 'email-draft',
        type: 'email_draft',
        title: 'E-Mail an Steuerberater',
        description: 'Betreff: Fehlende Unterlagen für Projekt',
        actions: [
          { 
            label: 'In Freigabezentrale', 
            variant: 'primary', 
            onClick: () => handleCreateEmailDraft('Steuerberater', 'Fehlende Unterlagen') 
          },
          { label: 'Bearbeiten', variant: 'secondary', onClick: () => {} },
          { label: 'Ablehnen', variant: 'danger', onClick: () => setSuggestions([]) }
        ]
      }]
    }
    // Autopilot starten
    else if (lowerContent.includes('autopilot') && lowerContent.includes('start')) {
      response = 'Soll ich den Maßnahmen-Autopilot für dieses Projekt starten?'
      newSuggestions = [{
        id: 'autopilot',
        type: 'autopilot',
        title: 'Maßnahmen-Autopilot',
        description: 'KI-gestützte Analyse und Vorschläge für das Projekt',
        actions: [
          { label: 'Starten', variant: 'primary', onClick: () => handleStartAutopilot() },
          { label: 'Nur vorbereiten', variant: 'secondary', onClick: () => {} },
          { label: 'Abbrechen', variant: 'danger', onClick: () => setSuggestions([]) }
        ]
      }]
    }
    // Kontakte fehlen
    else if (lowerContent.includes('kontakt') && lowerContent.includes('fehl')) {
      if (contextContacts.length === 0) {
        response = 'Es sind noch keine Kontakte für dieses Projekt hinterlegt.'
      } else {
        response = `Das Projekt hat **${contextContacts.length} Kontakt(e)**:`
        newSuggestions = contextContacts.slice(0, 5).map(c => ({
          id: `contact-${c.id}`,
          type: 'summary' as const,
          title: c.name,
          description: `${c.category}${c.company ? ` bei ${c.company}` : ''}`,
          actions: [
            { label: 'Details', variant: 'secondary', onClick: () => {} }
          ]
        }))
      }
    }
    // E-Mail-Entwürfe Freigabe
    else if (lowerContent.includes('e-mail') && lowerContent.includes('freigabe')) {
      const pending = approvalItems.filter(i => i.status === 'waiting_for_approval')
      if (pending.length === 0) {
        response = 'Keine E-Mail-Entwürfe warten auf Freigabe.'
      } else {
        response = `**${pending.length} E-Mail-Entwurf(e)** warten auf Freigabe:`
        newSuggestions = pending.slice(0, 5).map(i => ({
          id: `approval-${i.id}`,
          type: 'email_draft',
          title: i.title,
          description: i.content.substring(0, 100) + '...',
          actions: [
            { label: 'Freigeben', variant: 'primary', onClick: () => handleApproveItem(i.id) },
            { label: 'Bearbeiten', variant: 'secondary', onClick: () => {} },
            { label: 'Ablehnen', variant: 'danger', onClick: () => {} }
          ]
        }))
      }
    }
    // Allgemeine Hilfe
    else {
      response = `Ich habe deine Anfrage verstanden. Für das Projekt **${activeTwin?.title || 'Alle Projekte'}** kann ich dir helfen mit:

• **Maßnahmen** anzeigen, erstellen, bearbeiten
• **Kontakte** verwalten und verknüpfen
• **E-Mail-Entwürfe** vorbereiten und freigeben
• **Risiken** analysieren
• **Autopilot** für automatisierte Vorschläge

Was möchtest du tun?`
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
      context: projectContext
    }

    setMessages(prev => [...prev, assistantMessage])
    setSuggestions(newSuggestions)
  }, [contextMeasures, contextContacts, contextRisks, approvalItems, activeTwin, projectContext, onOpenTwin])

  // Action handlers
  const handleCreateMeasure = (title: string, description: string) => {
    if (!activeTwin) return
    addMeasure({
      projectId: activeTwin.id,
      twinId: activeTwin.id,
      title,
      description,
      status: 'open',
      priority: 'medium',
      aiMode: 'manual',
      linkedContactIds: [],
      allowedActions: [],
      blockedActions: [],
      requiredInputs: [],
      outputs: [],
      executionLog: []
    })
    setSuggestions([])
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `✅ Maßnahme "${title}" wurde erstellt und im Projektverlauf dokumentiert.`,
      timestamp: new Date().toISOString()
    }])
  }

  const handleEditMeasure = (measure: MeasureV2) => {
    // Would open edit modal in real implementation
    console.log('Edit measure:', measure)
  }

  const handleCreateEmailDraft = (recipient: string, subject: string) => {
    if (!activeTwin) return
    addApprovalItem({
      projectId: activeTwin.id,
      twinId: activeTwin.id,
      measureId: '',
      title: `E-Mail: ${subject}`,
      resultType: 'email_draft',
      content: `Betreff: ${subject}\n\nAn: ${recipient}\n\nLieber ${recipient},\n\n...`,
      riskLevel: 'low',
      requiredAction: 'Freigabe erforderlich',
      linkedContactIds: [],
      status: 'waiting_for_approval'
    })
    setSuggestions([])
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `✅ E-Mail-Entwurf wurde in die Freigabezentrale übernommen.`,
      timestamp: new Date().toISOString()
    }])
  }

  const handleStartAutopilot = () => {
    setSuggestions([])
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `🤖 Autopilot wird vorbereitet...\n\nIch analysiere das Projekt und erstelle Vorschläge für Maßnahmen, Kontakte und nächste Schritte. Dies kann einen Moment dauern.`,
      timestamp: new Date().toISOString()
    }])
    // Simulate autopilot running
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `✅ Autopilot-Analyse abgeschlossen. Ich habe 3 neue Maßnahmenvorschläge und 2 Kontakt-Empfehlungen identifiziert.\n\nMöchtest du die Vorschläge sehen?`,
        timestamp: new Date().toISOString()
      }])
    }, 2000)
  }

  const handleApproveItem = (_itemId: string) => {
    setSuggestions([])
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `✅ Freigabe erteilt. Die Aktion wird ausgeführt und im Projektverlauf dokumentiert.`,
      timestamp: new Date().toISOString()
    }])
  }

  // Quick commands
  const quickCommands = [
    { label: 'Blockierte Maßnahmen', icon: AlertTriangle, onClick: () => setInputText('Liste mir alle blockierten Maßnahmen auf.') },
    { label: 'Neue Maßnahme', icon: Plus, onClick: () => setInputText('Erstelle eine Maßnahme: ') },
    { label: 'Kontakte prüfen', icon: Users, onClick: () => setInputText('Welche Kontakte fehlen?') },
    { label: 'Freigaben', icon: ShieldCheck, onClick: () => setInputText('Zeige alle E-Mail-Entwürfe zur Freigabe.') },
  ]

  return (
    <div className="h-full flex gap-6">
      {/* Left: Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Project Dropdown */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-zinc-100">OSION KI-Chat</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-4">
            Projektsteuerung, Maßnahmen, Freigaben und Verbindungen per KI bearbeiten
          </p>

          {/* Project Context Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowContextDropdown(!showContextDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm transition-colors"
            >
              <FolderKanban className="w-4 h-4 text-zinc-400" />
              <span className="text-zinc-300">Projektkontext:</span>
              <span className="text-zinc-100 font-medium">{contextLabel}</span>
              <ChevronDown className="w-4 h-4 text-zinc-500 ml-2" />
            </button>

            <AnimatePresence>
              {showContextDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <button
                    onClick={() => { setProjectContext('all'); setShowContextDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors ${projectContext === 'all' ? 'bg-zinc-800/50 text-violet-400' : 'text-zinc-300'}`}
                  >
                    Alle Projekte
                  </button>
                  <button
                    onClick={() => { setProjectContext('active'); setShowContextDropdown(false); }}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors ${projectContext === 'active' ? 'bg-zinc-800/50 text-violet-400' : 'text-zinc-300'}`}
                  >
                    Aktives Projekt
                  </button>
                  <div className="border-t border-zinc-800 my-1" />
                  {twins.map(twin => (
                    <button
                      key={twin.id}
                      onClick={() => { setProjectContext({ twinId: twin.id, title: twin.title }); setShowContextDropdown(false); }}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors ${
                        typeof projectContext === 'object' && projectContext.twinId === twin.id 
                          ? 'bg-zinc-800/50 text-violet-400' 
                          : 'text-zinc-300'
                      }`}
                    >
                      {twin.title}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-violet-600' : 'bg-zinc-800'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-violet-400" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300'
              }`}>
                {msg.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.replace(/\*\*(.+?)\*\*/g, '$1')}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }}
                    className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-violet-500 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Commands */}
        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          {quickCommands.map((cmd) => (
            <button
              key={cmd.label}
              onClick={cmd.onClick}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
            >
              <cmd.icon className="w-3.5 h-3.5" />
              {cmd.label}
            </button>
          ))}
        </div>

        {/* Input */}
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
            placeholder="Schreibe eine Nachricht..."
            className="w-full min-h-[60px] max-h-[200px] px-4 py-3 pr-12 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500/50"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className="absolute right-3 bottom-3 p-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Right: Suggestions Panel */}
      <div className="w-80 flex-shrink-0">
        <div className="sticky top-0">
          <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            KI-Vorschläge
          </h3>
          
          <AnimatePresence mode="popLayout">
            {suggestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-zinc-500 text-center py-8"
              >
                Schreibe im Chat, um Vorschläge zu erhalten
              </motion.div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {suggestion.type === 'measure' && <CheckSquare className="w-4 h-4 text-blue-400" />}
                      {suggestion.type === 'email_draft' && <Mail className="w-4 h-4 text-amber-400" />}
                      {suggestion.type === 'autopilot' && <Bot className="w-4 h-4 text-violet-400" />}
                      {suggestion.type === 'checklist' && <CheckCircle className="w-4 h-4 text-green-400" />}
                      {suggestion.type === 'risk' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      {suggestion.type === 'summary' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
                        {suggestion.type === 'measure' && 'Maßnahme'}
                        {suggestion.type === 'email_draft' && 'E-Mail-Entwurf'}
                        {suggestion.type === 'autopilot' && 'Autopilot'}
                        {suggestion.type === 'checklist' && 'Checkliste'}
                        {suggestion.type === 'risk' && 'Risiko'}
                        {suggestion.type === 'summary' && 'Info'}
                      </span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-zinc-100 mb-1">{suggestion.title}</h4>
                    <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{suggestion.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {suggestion.actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={action.onClick}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            action.variant === 'primary'
                              ? 'bg-violet-600 hover:bg-violet-500 text-white'
                              : action.variant === 'secondary'
                              ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
