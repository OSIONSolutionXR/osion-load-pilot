import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Check,
  User,
  Bot,
  Plus,
  Trash2,
  AlertCircle,
  Edit3,
} from 'lucide-react'
import { Button } from '../ui/Button'
// @ts-expect-error Badge component reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Badge } from '../ui/Badge'
import {
  useMeasuresStoreV2,
  type MeasureV2,
  type AIMode,
  statusLabels,
  priorityLabels,
  aiModeLabels,
  aiModeColors,
  senderModeLabels,
} from '../../lib/measuresStoreV2'
import { useContactsStore, contactCategoryLabels } from '../../lib/contactsStore'
import { useEmailAccountsStore, emailProviderLabels } from '../../lib/emailAccountsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface MeasureEditModalProps {
  measure: MeasureV2 | null
  isOpen: boolean
  onClose: () => void
  twin: StoredProjectTwinV2
}

const statusOptions: MeasureV2['status'][] = ['open', 'in_progress', 'blocked', 'done', 'discarded']
const priorityOptions: MeasureV2['priority'][] = ['low', 'medium', 'high', 'critical']
const aiModeOptions: AIMode[] = ['manual', 'suggestion_only', 'approval_required', 'autonomous', 'locked']
const senderModeOptions: NonNullable<MeasureV2['senderMode']>[] = [
  'login_email',
  'connected_account',
  'loadpilot_address',
  'project_default',
]

export default function MeasureEditModal({
  measure,
  isOpen,
  onClose,
  twin,
}: MeasureEditModalProps) {
  const { updateMeasure, linkContact, unlinkContact, setAIMode: _setAIMode } = useMeasuresStoreV2()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void _setAIMode
  const { getContactsByTwin, contacts } = useContactsStore()
  const { accounts, getDefaultForProject } = useEmailAccountsStore()

  const twinContacts = getContactsByTwin(twin.id)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _projectDefaultEmail = getDefaultForProject(twin.id)

  const [formData, setFormData] = useState<Partial<MeasureV2>>({})
  const [activeTab, setActiveTab] = useState<'basic' | 'autopilot' | 'contacts'>('basic')
  const [showContactSelector, setShowContactSelector] = useState(false)

  useEffect(() => {
    if (measure) {
      setFormData({ ...measure })
    }
  }, [measure])

  const handleSubmit = () => {
    if (measure && formData.title?.trim()) {
      updateMeasure(measure.id, formData)
      onClose()
    }
  }

  const handleLinkContact = (contactId: string) => {
    if (measure) {
      linkContact(measure.id, contactId)
      setShowContactSelector(false)
    }
  }

  const handleUnlinkContact = (contactId: string) => {
    if (measure) {
      unlinkContact(measure.id, contactId)
    }
  }

  const linkedContacts = useMemo(() => {
    if (!measure) return []
    return contacts.filter((c) => measure.linkedContactIds.includes(c.id))
  }, [contacts, measure])

  const availableContacts = useMemo(() => {
    if (!measure) return []
    return twinContacts.filter((c) => !measure.linkedContactIds.includes(c.id))
  }, [twinContacts, measure])

  const selectedEmailAccount = useMemo(() => {
    if (!formData.preferredEmailAccountId) return null
    return accounts.find((a) => a.id === formData.preferredEmailAccountId)
  }, [accounts, formData.preferredEmailAccountId])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void selectedEmailAccount

  if (!measure) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Maßnahme bearbeiten
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {measure.title}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-slate-200 dark:border-slate-800 px-6">
                <div className="flex gap-1">
                  {[
                    { id: 'basic', label: 'Grunddaten', icon: Edit3 },
                    { id: 'autopilot', label: 'Autopilot', icon: Bot },
                    { id: 'contacts', label: 'Kontakte', icon: User },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Tab */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Titel *
                      </label>
                      <input
                        type="text"
                        value={formData.title || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Maßnahmentitel"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Beschreibung
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, description: e.target.value }))
                        }
                        rows={3}
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                        placeholder="Beschreibung der Maßnahme..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              status: e.target.value as MeasureV2['status'],
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {statusLabels[status]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Priorität
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              priority: e.target.value as MeasureV2['priority'],
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          {priorityOptions.map((priority) => (
                            <option key={priority} value={priority}>
                              {priorityLabels[priority]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Fälligkeitsdatum
                        </label>
                        <input
                          type="date"
                          value={formData.dueDate ? formData.dueDate.split('T')[0] : ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Zugewiesen an
                        </label>
                        <input
                          type="text"
                          value={formData.assignedTo || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, assignedTo: e.target.value }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          placeholder="Name oder Team"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Autopilot Tab */}
                {activeTab === 'autopilot' && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        KI-Modus
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {aiModeOptions.map((mode) => {
                          const colors = aiModeColors[mode]
                          const isSelected = formData.aiMode === mode
                          return (
                            <button
                              key={mode}
                              onClick={() => setFormData((prev) => ({ ...prev, aiMode: mode }))}
                              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? `${colors.bg} ${colors.border} ring-1 ring-current`
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  isSelected
                                    ? `border-current ${colors.text}`
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isSelected && (
                                  <div className={`w-2.5 h-2.5 rounded-full ${colors.bg.replace('/20', '').replace('/10', '')}`} />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className={`font-medium ${isSelected ? colors.text : 'text-slate-900 dark:text-slate-100'}`}>
                                  {aiModeLabels[mode]}
                                </p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        E-Mail-Konfiguration
                      </h4>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Absender-Modus
                        </label>
                        <select
                          value={formData.senderMode || 'project_default'}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              senderMode: e.target.value as NonNullable<MeasureV2['senderMode']>,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          {senderModeOptions.map((mode) => (
                            <option key={mode} value={mode}>
                              {senderModeLabels[mode]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Bevorzugtes E-Mail-Konto
                        </label>
                        <select
                          value={formData.preferredEmailAccountId || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              preferredEmailAccountId: e.target.value || undefined,
                            }))
                          }
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        >
                          <option value="">Standard verwenden ({_projectDefaultEmail?.label || 'Nicht konfiguriert'})</option>
                          {accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.label} ({account.email}) - {emailProviderLabels[account.provider]}
                            </option>
                          ))}
                        </select>
                      </div>

                      {formData.aiMode === 'autonomous' && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                              Autonomer Modus
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                              Im autonomen Modus kann die KI E-Mails und andere Aktionen eigenständig
                              durchführen. Stelle sicher, dass alle Kontakte und E-Mail-Einstellungen
                              korrekt konfiguriert sind.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contacts Tab */}
                {activeTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Verknüpfte Kontakte
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {linkedContacts.length} Kontakt{linkedContacts.length !== 1 ? 'e' : ''} verknüpft
                        </p>
                      </div>
                      <Button
                        size="sm"
                        icon={Plus}
                        onClick={() => setShowContactSelector(true)}
                        disabled={availableContacts.length === 0}
                      >
                        Kontakt verknüpfen
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {linkedContacts.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                          <User className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Keine Kontakte verknüpft
                          </p>
                        </div>
                      ) : (
                        linkedContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                                {contact.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {contact.name}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  {contactCategoryLabels[contact.category]}
                                  {contact.company && ` · ${contact.company}`}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleUnlinkContact(contact.id)}
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Verknüpfung entfernen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.title?.trim()}
                  icon={Check}
                >
                  Speichern
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Selector Modal */}
      <AnimatePresence>
        {showContactSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowContactSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Kontakt auswählen
                </h3>
                <button
                  onClick={() => setShowContactSelector(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-2">
                {availableContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => handleLinkContact(contact.id)}
                    className="w-full flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{contact.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {contactCategoryLabels[contact.category]}
                        {contact.email && ` · ${contact.email}`}
                      </p>
                    </div>
                  </button>
                ))}

                {availableContacts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-500 dark:text-slate-400">Keine weiteren Kontakte verfügbar</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowContactSelector(false)
                      }}
                      className="mt-4"
                    >
                      Kontakte verwalten
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
