import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Mail,
  ListCheck,
  Phone,
  AlertTriangle,
  ArrowRight,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { AttentionQueueItem, AIAction, AIActionType } from '../../types/projectTwinV2'
import {
  generateQueueAIAction,
  generateAIActionId,
} from '../../services/queueAIActionService'

interface AIActionDialogProps {
  open: boolean
  onClose: () => void
  queueItem: AttentionQueueItem
  projectTitle: string
  onActionCreated: (action: AIAction) => void
  onActionDeleted?: (actionId: string) => void
}

const actionTypes: { type: AIActionType; label: string; icon: typeof Mail; description: string }[] = [
  {
    type: 'email',
    label: 'E-Mail/Text erstellen',
    icon: Mail,
    description: 'Professionelle E-Mail oder Nachricht',
  },
  {
    type: 'checklist',
    label: 'Checkliste generieren',
    icon: ListCheck,
    description: 'Strukturierte Checkliste mit Checkboxen',
  },
  {
    type: 'script',
    label: 'Anrufleitfaden',
    icon: Phone,
    description: 'Telefon- oder Gesprächsleitfaden',
  },
  {
    type: 'risk_assessment',
    label: 'Risiko-Bewertung',
    icon: AlertTriangle,
    description: 'Risikoanalyse mit Bewertung',
  },
  {
    type: 'next_steps',
    label: 'Nächste Schritte',
    icon: ArrowRight,
    description: 'Aktionsplan ableiten',
  },
]

export default function AIActionDialog({
  open,
  onClose,
  queueItem,
  projectTitle,
  onActionCreated,
  onActionDeleted,
}: AIActionDialogProps) {
  const [selectedType, setSelectedType] = useState<AIActionType | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generatedAction, setGeneratedAction] = useState<AIAction | null>(null)
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const handleGenerate = async (type: AIActionType) => {
    setSelectedType(type)
    setGenerating(true)
    setGeneratedAction(null)

    try {
      const response = await generateQueueAIAction({
        queueItemTitle: queueItem.title,
        queueItemDescription: queueItem.description,
        projectContext: projectTitle,
        actionType: type,
      })

      const action: AIAction = {
        id: generateAIActionId(),
        type,
        title: response.title,
        content: response.generatedContent,
        createdAt: new Date().toISOString(),
        used: false,
      }

      setGeneratedAction(action)
      onActionCreated(action)
    } catch (error) {
      console.error('Error generating AI action:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!generatedAction) return
    await navigator.clipboard.writeText(generatedAction.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const handleClose = () => {
    setSelectedType(null)
    setGeneratedAction(null)
    setExpandedSections(new Set())
    onClose()
  }

  const parseContent = (content: string) => {
    // Parse markdown-style sections
    const sections: { title: string; items: string[] }[] = []
    const lines = content.split('\n')
    let currentSection: { title: string; items: string[] } | null = null

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check for headers (## or ###)
      if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
        if (currentSection) sections.push(currentSection)
        currentSection = {
          title: trimmed.replace(/^#+\s*/, ''),
          items: [],
        }
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('[ ]') || trimmed.startsWith('[x]')) {
        // List items
        currentSection?.items.push(trimmed.replace(/^[-*\[\]x]\s*/, ''))
      } else if (trimmed.includes(':')) {
        // Key-value style
        currentSection?.items.push(trimmed)
      } else {
        // Regular text - add as paragraph
        currentSection?.items.push(trimmed)
      }
    }

    if (currentSection) sections.push(currentSection)
    return sections.length > 0 ? sections : [{ title: 'Inhalt', items: [content] }]
  }

  const renderEmailContent = (content: string) => {
    const lines = content.split('\n')
    const subject = lines.find(l => l.toLowerCase().startsWith('betreff:'))?.replace(/^betreff:/i, '').trim()
    const body = lines.filter(l => !l.toLowerCase().startsWith('betreff:')).join('\n')

    return (
      <div className="space-y-4">
        {subject && (
          <div className="bg-slate-50 p-3 rounded-lg">
            <span className="text-xs text-slate-500">Betreff:</span>
            <p className="text-sm font-medium text-slate-800">{subject}</p>
          </div>
        )}
        <div className="bg-white p-4 rounded-lg border border-slate-200 whitespace-pre-wrap text-sm text-slate-700">
          {body}
        </div>
      </div>
    )
  }

  const renderChecklistContent = (content: string) => {
    const sections = parseContent(content)
    return (
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-slate-50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(idx)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100 transition-colors"
            >
              <span className="font-medium text-sm text-slate-800">{section.title}</span>
              {expandedSections.has(idx) ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            <AnimatePresence>
              {(expandedSections.has(idx) || sections.length === 1) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <label key={itemIdx} className="flex items-start gap-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-slate-700 group-hover:text-slate-900">{item}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    )
  }

  const renderScriptContent = (content: string) => {
    const sections = parseContent(content)
    return (
      <div className="space-y-3">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-slate-50 rounded-lg p-3">
            <h4 className="font-medium text-sm text-slate-800 mb-2">{section.title}</h4>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => (
                <li key={itemIdx} className="text-sm text-slate-600 pl-3 border-l-2 border-violet-300">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (!generatedAction) return null

    switch (generatedAction.type) {
      case 'email':
        return renderEmailContent(generatedAction.content)
      case 'checklist':
        return renderChecklistContent(generatedAction.content)
      case 'script':
        return renderScriptContent(generatedAction.content)
      default:
        return (
          <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-slate-700">
            {generatedAction.content}
          </div>
        )
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--lp-panel)] border border-[var(--lp-border)] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--lp-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--lp-text)]">
                  Mit KI bearbeiten
                </h2>
                <p className="text-sm text-[var(--lp-muted)]">
                  {queueItem.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[var(--lp-surface)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--lp-muted)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Action Type Selection */}
            {!generatedAction && !generating && (
              <div className="space-y-3">
                <p className="text-sm text-[var(--lp-muted)] mb-4">
                  Wähle eine Arbeitshilfe die die KI für dich erstellen soll:
                </p>
                {actionTypes.map((action) => (
                  <button
                    key={action.type}
                    onClick={() => handleGenerate(action.type)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      selectedType === action.type
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-[var(--lp-border)] hover:border-violet-300 hover:bg-[var(--lp-surface-soft)]'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      selectedType === action.type
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-[var(--lp-text)]">{action.label}</h3>
                      <p className="text-sm text-[var(--lp-muted)]">{action.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[var(--lp-muted)]" />
                  </button>
                ))}
              </div>
            )}

            {/* Generating State */}
            {generating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
                <p className="text-[var(--lp-text)]">Arbeitshilfe wird generiert...</p>
                <p className="text-sm text-[var(--lp-muted)]">Das dauert nur einen Moment</p>
              </div>
            )}

            {/* Generated Content */}
            {generatedAction && !generating && (
              <div className="space-y-4">
                {/* Success Message */}
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg">
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {actionTypes.find(a => a.type === generatedAction.type)?.label} erstellt
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-[var(--lp-text)]">
                  {generatedAction.title}
                </h3>

                {/* Content */}
                {renderContent()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 p-4 border-t border-[var(--lp-border)]">
            <div className="flex gap-2">
              {generatedAction && (
                <>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--lp-surface)] hover:bg-[var(--lp-surface-soft)] rounded-lg text-sm font-medium text-[var(--lp-text)] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" />
                        Kopiert!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Kopieren
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onActionDeleted?.(generatedAction.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg text-sm font-medium text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {generatedAction ? (
                <button
                  onClick={() => {
                    setGeneratedAction(null)
                    setSelectedType(null)
                    setExpandedSections(new Set())
                  }}
                  className="px-4 py-2 text-sm font-medium text-[var(--lp-muted)] hover:text-[var(--lp-text)] transition-colors"
                >
                  Neue erstellen
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-[var(--lp-muted)] hover:text-[var(--lp-text)] transition-colors"
                >
                  Abbrechen
                </button>
              )}
              <button
                onClick={handleClose}
                className="lp-button-primary"
              >
                {generatedAction ? 'Fertig' : 'Schließen'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
