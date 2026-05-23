import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, CheckCircle2, Target, AlertCircle, Flag, FileText, Sparkles, Bot, Copy, Check, ChevronDown, ChevronUp, Edit3, AlertTriangle } from 'lucide-react'
import type { AttentionQueueItem, AIAction, AttentionQueueItemSeverity, AttentionQueueItemStatus, AttentionQueueItemCategory } from '../../types/projectTwinV2'
import { useState } from 'react'
import AIActionDialog from './AIActionDialog'
import { addAIActionToQueueItem, deleteAIActionFromQueueItem, markAIActionAsUsed, updateAttentionQueueItemNotes } from '../../lib/attentionQueueStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import { logTwinUpdated } from '../../services/activityLogService'

interface AttentionQueueDetailModalProps {
  item: AttentionQueueItem | null
  twinId: string
  twin?: StoredProjectTwinV2
  onClose: () => void
  onOpenTwin: () => void
  onStatusChange?: (itemId: string, newStatus: 'open' | 'blocked' | 'done') => void
  onNotesChange?: (itemId: string, notes: string) => void
  onItemUpdate?: (updatedItem: AttentionQueueItem) => void
  onTwinUpdate?: (updatedTwin: StoredProjectTwinV2) => void
}

export default function AttentionQueueDetailModal({
  item,
  twinId,
  twin,
  onClose,
  onOpenTwin,
  onStatusChange,
  onNotesChange,
  onItemUpdate,
  onTwinUpdate,
}: AttentionQueueDetailModalProps) {
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null)
  const [expandedActionId, setExpandedActionId] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<{
    title: string
    description: string
    status: AttentionQueueItemStatus
    severity: AttentionQueueItemSeverity
    category: AttentionQueueItemCategory
    nextStep: string
    notes: string
  }>({
    title: '',
    description: '',
    status: 'open',
    severity: 'medium',
    category: 'action',
    nextStep: '',
    notes: ''
  })

  if (!item) return null

  const getSeverityBadge = (severity: AttentionQueueItemSeverity) => {
    const styles = {
      critical: 'bg-rose-500/20 text-rose-100 border-rose-500/50',
      high: 'bg-amber-500/20 text-amber-100 border-amber-500/50',
      medium: 'bg-blue-500/20 text-blue-100 border-blue-500/50',
      low: 'bg-slate-500/20 text-slate-100 border-slate-500/50',
    }
    return styles[severity] || styles.medium
  }

  const getSeverityLabel = (severity: AttentionQueueItemSeverity) => {
    const labels = {
      critical: 'Kritisch',
      high: 'Hoch',
      medium: 'Mittel',
      low: 'Niedrig'
    }
    return labels[severity]
  }

  const getStatusBadge = (status: AttentionQueueItemStatus) => {
    const styles = {
      open: 'bg-emerald-500/20 text-emerald-100 border-emerald-500/50',
      blocked: 'bg-rose-500/20 text-rose-100 border-rose-500/50',
      done: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/50',
    }
    return styles[status] || styles.open
  }

  const getStatusLabel = (status: AttentionQueueItemStatus) => {
    const labels = {
      open: 'Offen',
      blocked: 'Blockiert',
      done: 'Erledigt'
    }
    return labels[status]
  }

  const getCategoryLabel = (category: AttentionQueueItemCategory) => {
    const labels = {
      blocker: 'Blocker',
      risk: 'Risiko',
      action: 'Aktion',
      dependency: 'Abhängigkeit',
    }
    return labels[category] || category
  }

  const startEditing = () => {
    setEditForm({
      title: item.title,
      description: item.description || '',
      status: item.status,
      severity: item.severity,
      category: item.category,
      nextStep: item.nextStep || '',
      notes: item.notes || ''
    })
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditForm({
      title: '',
      description: '',
      status: 'open',
      severity: 'medium',
      category: 'action',
      nextStep: '',
      notes: ''
    })
  }

  const saveChanges = () => {
    // Track changes
    const changes: string[] = []
    if (editForm.title !== item.title) changes.push(`Titel: "${item.title}" → "${editForm.title}"`)
    if (editForm.status !== item.status) changes.push(`Status: "${getStatusLabel(item.status)}" → "${getStatusLabel(editForm.status)}"`)
    if (editForm.severity !== item.severity) changes.push(`Schwere: "${getSeverityLabel(item.severity)}" → "${getSeverityLabel(editForm.severity)}"`)
    if (editForm.nextStep !== (item.nextStep || '')) changes.push(`Nächster Schritt aktualisiert`)

    // Update item
    const updatedItem: AttentionQueueItem = {
      ...item,
      title: editForm.title,
      description: editForm.description || undefined,
      status: editForm.status,
      severity: editForm.severity,
      category: editForm.category,
      nextStep: editForm.nextStep || undefined,
      notes: editForm.notes || undefined,
      updatedAt: new Date().toISOString()
    }

    // Persist to storage
    const itemsWithNotes = updateAttentionQueueItemNotes(twinId, item.id, editForm.notes)
    
    // Find the updated item
    const finalItem = itemsWithNotes.find(i => i.id === item.id)
    if (finalItem && onItemUpdate) {
      onItemUpdate(finalItem)
    }

    // Log activity if twin is available
    if (twin && onTwinUpdate) {
      let updatedTwin: StoredProjectTwinV2 = {
        ...twin,
        attentionQueue: twin.attentionQueue.map(i => i.id === item.id ? updatedItem : i),
        updatedAt: new Date().toISOString()
      }

      updatedTwin = logTwinUpdated(
        updatedTwin,
        'user',
        `Attention Queue Item "${item.title}" bearbeitet: ${changes.join(', ') || 'keine Änderungen'}`
      )

      onTwinUpdate(updatedTwin)
    }

    setIsEditing(false)
  }

  const handleMarkAsDone = () => {
    if (onStatusChange) {
      onStatusChange(item.id, 'done')
    }
  }

  const handleReopen = () => {
    if (onStatusChange) {
      onStatusChange(item.id, 'open')
    }
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onNotesChange) {
      onNotesChange(item.id, e.target.value)
    }
  }

  const handleAIActionCreated = (action: AIAction) => {
    const updatedItems = addAIActionToQueueItem(twinId, item.id, action)
    const updatedItem = updatedItems.find(i => i.id === item.id)
    if (updatedItem && onItemUpdate) {
      onItemUpdate(updatedItem)
    }
    setAiDialogOpen(false)
  }

  const handleAIActionDeleted = (actionId: string) => {
    const updatedItems = deleteAIActionFromQueueItem(twinId, item.id, actionId)
    const updatedItem = updatedItems.find(i => i.id === item.id)
    if (updatedItem && onItemUpdate) {
      onItemUpdate(updatedItem)
    }
  }

  const handleCopyAction = async (action: AIAction) => {
    await navigator.clipboard.writeText(action.content)
    setCopiedActionId(action.id)
    markAIActionAsUsed(twinId, item.id, action.id)
    setTimeout(() => setCopiedActionId(null), 2000)
  }

  const toggleActionExpand = (actionId: string) => {
    setExpandedActionId(expandedActionId === actionId ? null : actionId)
  }

  const getActionIcon = (type: AIAction['type']) => {
    switch (type) {
      case 'email': return '📧'
      case 'checklist': return '✅'
      case 'script': return '📞'
      case 'risk_assessment': return '⚠️'
      case 'next_steps': return '➡️'
      default: return '🤖'
    }
  }

  const getActionTypeLabel = (type: AIAction['type']) => {
    switch (type) {
      case 'email': return 'E-Mail'
      case 'checklist': return 'Checkliste'
      case 'script': return 'Leitfaden'
      case 'risk_assessment': return 'Risikoanalyse'
      case 'next_steps': return 'Nächste Schritte'
      default: return 'KI-Aktion'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header mit Status-Zeile */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {/* Status-Zeile: Severity + Status + Category */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {!isEditing ? (
                  <>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getSeverityBadge(item.severity)}`}>
                      {getSeverityLabel(item.severity)}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusBadge(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-700 text-zinc-300">
                      {getCategoryLabel(item.category)}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={editForm.severity}
                      onChange={(e) => setEditForm({ ...editForm, severity: e.target.value as AttentionQueueItemSeverity })}
                      className="px-2.5 py-1 text-xs rounded-full border bg-zinc-800 border-zinc-600 text-zinc-100"
                    >
                      <option value="critical">Kritisch</option>
                      <option value="high">Hoch</option>
                      <option value="medium">Mittel</option>
                      <option value="low">Niedrig</option>
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as AttentionQueueItemStatus })}
                      className="px-2.5 py-1 text-xs rounded-full border bg-zinc-800 border-zinc-600 text-zinc-100"
                    >
                      <option value="open">Offen</option>
                      <option value="blocked">Blockiert</option>
                      <option value="done">Erledigt</option>
                    </select>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value as AttentionQueueItemCategory })}
                      className="px-2.5 py-1 text-xs rounded-full border bg-zinc-800 border-zinc-600 text-zinc-100"
                    >
                      <option value="blocker">Blocker</option>
                      <option value="risk">Risiko</option>
                      <option value="action">Aktion</option>
                      <option value="dependency">Abhängigkeit</option>
                    </select>
                  </div>
                )}
              </div>
              
              {/* Titel */}
              {!isEditing ? (
                <h2 className="text-xl font-semibold text-zinc-100">{item.title}</h2>
              ) : (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-lg font-semibold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              )}
            </div>
            
            <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            {/* Projekt */}
            <div className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
              <Target className="w-4 h-4 text-violet-400" />
              <span className="text-sm text-zinc-400">Projekt:</span>
              <span className="text-sm font-medium text-zinc-100">{item.projectTitle}</span>
            </div>

            {/* Beschreibung */}
            {(item.description || isEditing) && (
              <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                <p className="text-sm text-zinc-400 mb-2">Beschreibung:</p>
                {!isEditing ? (
                  <p className="text-sm text-zinc-100">{item.description}</p>
                ) : (
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                )}
              </div>
            )}

            {/* Warum wichtig */}
            {item.reason && !isEditing && (
              <div className="p-4 bg-zinc-800 rounded-xl border-l-4 border-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-zinc-100">Warum wichtig:</span>
                </div>
                <p className="text-sm text-zinc-200">{item.reason}</p>
              </div>
            )}

            {/* Was blockiert (nur bei blocked) */}
            {item.status === 'blocked' && !isEditing && (
              <div className="p-4 bg-rose-500/10 rounded-xl border-l-4 border-rose-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium text-rose-300">Status: Blockiert</span>
                </div>
                <p className="text-sm text-rose-200">
                  Diese Aktion ist aktuell blockiert. Prüfe das Twin für Details.
                </p>
              </div>
            )}

            {/* Nächster Schritt */}
            {(item.nextStep || isEditing) && (
              <div className="p-4 bg-zinc-800 rounded-xl border-l-4 border-teal-500">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-4 h-4 text-teal-400" />
                  <span className="text-sm font-medium text-zinc-100">Nächster Schritt:</span>
                </div>
                {!isEditing ? (
                  <p className="text-sm text-zinc-200">{item.nextStep}</p>
                ) : (
                  <textarea
                    value={editForm.nextStep}
                    onChange={(e) => setEditForm({ ...editForm, nextStep: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                )}
              </div>
            )}

            {/* KI-Aktionen - only show when not editing */}
            {!isEditing && item.aiActions && item.aiActions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-zinc-100">
                    KI-Arbeitshilfen ({item.aiActions.length}):
                  </span>
                </div>
                <div className="space-y-2">
                  {item.aiActions.map((action) => (
                    <div key={action.id} className="bg-violet-900/20 rounded-xl overflow-hidden border border-violet-700/30">
                      <button
                        onClick={() => toggleActionExpand(action.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-violet-900/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{getActionIcon(action.type)}</span>
                          <div className="text-left">
                            <p className="text-sm font-medium text-violet-200">
                              {action.title}
                            </p>
                            <p className="text-xs text-violet-400">
                              {getActionTypeLabel(action.type)} • {new Date(action.createdAt).toLocaleDateString('de-DE')}
                              {action.used && ' • Verwendet'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyAction(action)
                            }}
                            className="p-1.5 hover:bg-violet-700/50 rounded transition-colors"
                            title="Inhalt kopieren"
                          >
                            {copiedActionId === action.id ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Copy className="w-4 h-4 text-violet-400" />
                            )}
                          </button>
                          {expandedActionId === action.id ? (
                            <ChevronUp className="w-4 h-4 text-violet-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-violet-400" />
                          )}
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedActionId === action.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 pb-3">
                              <div className="bg-zinc-900 p-3 rounded-lg border border-violet-700/30 whitespace-pre-wrap text-sm text-zinc-200">
                                {action.content}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notizen */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-100">Notizen:</span>
              </div>
              {!isEditing ? (
                <textarea
                  value={item.notes || ''}
                  onChange={handleNotesChange}
                  placeholder="Eigene Notizen zu diesem Item..."
                  className="w-full p-4 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3}
                />
              ) : (
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Eigene Notizen zu diesem Item..."
                  rows={3}
                  className="w-full p-4 bg-zinc-900 border border-zinc-600 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              )}
            </div>

            {/* Metadaten */}
            <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2 border-t border-zinc-700">
              <span>Erstellt: {new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
              <span>Aktualisiert: {new Date(item.updatedAt).toLocaleDateString('de-DE')}</span>
              {item.completedAt && (
                <span>Erledigt: {new Date(item.completedAt).toLocaleDateString('de-DE')}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isEditing ? (
            <div className="flex flex-wrap gap-2">
              {item.status !== 'done' && (
                <button
                  onClick={handleMarkAsDone}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Als erledigt markieren
                </button>
              )}
              {item.status === 'done' && (
                <button
                  onClick={handleReopen}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Wieder öffnen
                </button>
              )}
              
              <button
                className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
                onClick={onOpenTwin}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Im Twin öffnen
              </button>
              
              <button
                onClick={() => setAiDialogOpen(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 font-medium rounded-xl transition-colors border border-violet-600/30"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Mit KI bearbeiten
              </button>
              
              <button
                onClick={startEditing}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Bearbeiten
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={saveChanges}
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
              >
                Speichern
              </button>
              <button
                onClick={cancelEditing}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* AI Action Dialog */}
      <AIActionDialog
        open={aiDialogOpen}
        onClose={() => setAiDialogOpen(false)}
        queueItem={item}
        projectTitle={item.projectTitle}
        onActionCreated={handleAIActionCreated}
        onActionDeleted={handleAIActionDeleted}
      />
    </AnimatePresence>
  )
}
