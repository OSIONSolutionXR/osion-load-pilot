import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle, XCircle, Send, Edit3, Trash2, X } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  useApprovalQueueStore,
  type ApprovalItem,
  type ApprovalStatus,
  approvalStatusLabels,
  approvalStatusColors,
  resultTypeLabels,
  resultTypeIcons,
  senderModeLabels,
  riskLevelLabels,
  riskLevelColors,
} from '../../lib/approvalQueueStore'
import { useContactsStore } from '../../lib/contactsStore'
import { useEmailAccountsStore, connectionStatusColors } from '../../lib/emailAccountsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface ApprovalQueuePanelProps {
  twin: StoredProjectTwinV2
}

const statusOptions: ApprovalStatus[] = [
  'waiting_for_approval',
  'approved',
  'rejected',
  'edited',
  'executed',
  'execution_pending',
  'needs_email_account',
  'needs_contact',
]

export default function ApprovalQueuePanel({ twin }: ApprovalQueuePanelProps) {
  const { updateItem, deleteItem, getItemsByProject } = useApprovalQueueStore()
  const { getContactById } = useContactsStore()
  const { accounts, getDefaultForProject } = useEmailAccountsStore()

  const projectItems = getItemsByProject(twin.id)
  const projectDefaultEmail = getDefaultForProject(twin.id)

  const [selectedStatus, setSelectedStatus] = useState<ApprovalStatus | 'all'>('waiting_for_approval')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ApprovalItem | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState<string | null>(null)

  const [editContent, setEditContent] = useState('')

  const filteredItems = useMemo(() => {
    if (selectedStatus === 'all') return projectItems
    return projectItems.filter((item) => item.status === selectedStatus)
  }, [projectItems, selectedStatus])

  const stats = useMemo(() => {
    return {
      total: projectItems.length,
      waiting: projectItems.filter((i) => i.status === 'waiting_for_approval').length,
      approved: projectItems.filter((i) => i.status === 'approved').length,
      executed: projectItems.filter((i) => i.status === 'executed').length,
      needsAction: projectItems.filter(
        (i) =>
          i.status === 'needs_email_account' ||
          i.status === 'needs_contact' ||
          i.status === 'waiting_for_approval'
      ).length,
    }
  }, [projectItems])

  const handleApprove = (item: ApprovalItem) => {
    updateItem(item.id, { status: 'approved' })
  }

  const handleReject = (item: ApprovalItem) => {
    updateItem(item.id, { status: 'rejected' })
  }

  const handleExecute = async (item: ApprovalItem) => {
    setIsExecuting(item.id)

    // Check email account
    const emailAccount = item.senderEmailAccountId
      ? accounts.find((a) => a.id === item.senderEmailAccountId)
      : projectDefaultEmail

    if (!emailAccount || emailAccount.connectionStatus !== 'connected') {
      updateItem(item.id, { status: 'needs_email_account' })
      setIsExecuting(null)
      return
    }

    // Check contacts for email drafts
    if (item.resultType === 'email_draft' && item.linkedContactIds.length === 0) {
      updateItem(item.id, { status: 'needs_contact' })
      setIsExecuting(null)
      return
    }

    // Simulate execution
    await new Promise((resolve) => setTimeout(resolve, 1500))

    updateItem(item.id, {
      status: 'executed',
      executedAt: new Date().toISOString(),
      executedBy: 'user',
    })

    setIsExecuting(null)
    setExpandedItem(null)
  }

  const handleEdit = (item: ApprovalItem) => {
    setEditingItem(item)
    setEditContent(item.content)
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      updateItem(editingItem.id, {
        content: editContent,
        status: 'edited',
      })
      setEditingItem(null)
      setEditContent('')
    }
  }

  const handleDelete = (id: string) => {
    deleteItem(id)
    setShowDeleteConfirm(null)
  }

  const getContactInfo = (contactId: string) => {
    const contact = getContactById(contactId)
    return contact
      ? `${contact.name}${contact.company ? ` (${contact.company})` : ''}`
      : contactId
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Freigabezentrale</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {stats.waiting} wartet auf Freigabe · {stats.needsAction} benötigen Aktion
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4">
          <p className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{stats.waiting}</p>
          <p className="text-sm text-amber-600 dark:text-amber-500">Wartend</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
          <p className="text-2xl font-semibold text-emerald-700 dark:text-emerald-400">{stats.approved}</p>
          <p className="text-sm text-emerald-600 dark:text-emerald-500">Freigegeben</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <p className="text-2xl font-semibold text-slate-700 dark:text-slate-400">{stats.executed}</p>
          <p className="text-sm text-slate-600 dark:text-slate-500">Ausgeführt</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
          <p className="text-2xl font-semibold text-blue-700 dark:text-blue-400">{stats.total}</p>
          <p className="text-sm text-blue-600 dark:text-blue-500">Gesamt</p>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedStatus('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedStatus === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Alle
        </button>
        {statusOptions.map((status) => {
          const colors = approvalStatusColors[status]
          const count = projectItems.filter((i) => i.status === status).length
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedStatus === status
                  ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {approvalStatusLabels[status]}
              {count > 0 && (
                <span className="text-xs opacity-70 bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <CheckCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Keine Einträge in dieser Kategorie</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const statusColors = approvalStatusColors[item.status]
            const riskColors = riskLevelColors[item.riskLevel]
            const isExpanded = expandedItem === item.id

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-800 border rounded-xl overflow-hidden transition-all ${
                  isExpanded
                    ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
                }`}
              >
                <div
                  className="p-5 cursor-pointer"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{resultTypeIcons[item.resultType]}</span>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.title}</h3>
                        <Badge className={`${statusColors.bg} ${statusColors.text} border-0`}>
                          {approvalStatusLabels[item.status]}
                        </Badge>
                        <Badge className={`${riskColors.bg} ${riskColors.text} border-0`}>
                          {riskLevelLabels[item.riskLevel]}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Maßnahme: {item.measureId} · Erstellt:{' '}
                        {new Date(item.createdAt).toLocaleDateString('de-DE')}
                      </p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                          {resultTypeLabels[item.resultType]}
                        </span>
                        {item.senderMode && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full">
                            {senderModeLabels[item.senderMode]}
                          </span>
                        )}
                      </div>

                      {item.linkedContactIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Verknüpfte Kontakte:</span>
                          {item.linkedContactIds.map((id) => (
                            <span
                              key={id}
                              className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full"
                            >
                              {getContactInfo(id)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'waiting_for_approval' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApprove(item)
                            }}
                            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Freigeben"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReject(item)
                            }}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Ablehnen"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}

                      {item.status === 'approved' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleExecute(item)
                          }}
                          disabled={isExecuting === item.id}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {isExecuting === item.id ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Wird ausgeführt...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Ausführen
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(item.id)
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-200 dark:border-slate-700"
                    >
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Inhalt</h4>
                          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                            <pre className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap font-sans">
                              {item.content}
                            </pre>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Erforderliche Aktion
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{item.requiredAction}</p>
                          </div>

                          {item.senderEmailAccountId && (
                            <div>
                              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Absender-Konto
                              </h4>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const acc = accounts.find((a) => a.id === item.senderEmailAccountId)
                                  return acc ? (
                                    <>
                                      <span className="text-sm text-slate-600 dark:text-slate-400">{acc.label}</span>
                                      <Badge
                                        className={`${connectionStatusColors[acc.connectionStatus].bg} ${
                                          connectionStatusColors[acc.connectionStatus].text
                                        } border-0 text-xs`}
                                      >
                                        {acc.connectionStatus === 'connected' ? 'Verbunden' : 'Nicht verbunden'}
                                      </Badge>
                                    </>
                                  ) : (
                                    <span className="text-sm text-slate-400">Konto nicht gefunden</span>
                                  )
                                })()}
                              </div>
                            </div>
                          )}
                        </div>

                        {item.executedAt && (
                          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-3">
                            <p className="text-sm text-emerald-700 dark:text-emerald-400">
                              <CheckCircle className="w-4 h-4 inline mr-2" />
                              Ausgeführt am {new Date(item.executedAt).toLocaleString('de-DE')}
                              {item.executedBy && ` von ${item.executedBy}`}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <Button variant="ghost" onClick={() => setExpandedItem(null)}>
                            Schließen
                          </Button>
                          <Button variant="secondary" onClick={() => handleEdit(item)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Bearbeiten
                          </Button>
                          {item.status === 'waiting_for_approval' && (
                            <>
                              <Button
                                variant="secondary"
                                onClick={() => handleReject(item)}
                                className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Ablehnen
                              </Button>
                              <Button onClick={() => handleApprove(item)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Freigeben
                              </Button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <Button onClick={() => handleExecute(item)} disabled={isExecuting === item.id}>
                              <Send className="w-4 h-4 mr-2" />
                              {isExecuting === item.id ? 'Wird ausgeführt...' : 'Ausführen'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setEditingItem(null)
              setEditContent('')
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Inhalt bearbeiten</h3>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setEditContent('')
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none font-mono"
                  placeholder="Inhalt bearbeiten..."
                />
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingItem(null)
                    setEditContent('')
                  }}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Speichern
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Eintrag löschen?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>
                  Abbrechen
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Löschen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
