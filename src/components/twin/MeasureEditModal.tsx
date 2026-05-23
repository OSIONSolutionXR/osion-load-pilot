import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X,
  Check,
  Bot,
  Users,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/Button'
import {
  useMeasuresStoreV2,
  type MeasureV2,
  type AIMode,
  aiModeLabels,
  aiModeColors,
  senderModeLabels,
} from '../../lib/measuresStoreV2'
import { useContactsStore } from '../../lib/contactsStore'
import { useEmailAccountsStore } from '../../lib/emailAccountsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface MeasureEditModalProps {
  measure: MeasureV2
  twin: StoredProjectTwinV2
  isOpen: boolean
  onClose: () => void
}

const aiModeOptions: AIMode[] = ['manual', 'suggestion_only', 'approval_required', 'autonomous', 'locked']
const senderModeOptions: ('login_email' | 'connected_account' | 'loadpilot_address' | 'project_default')[] = [
  'login_email',
  'connected_account',
  'loadpilot_address',
  'project_default',
]

export default function MeasureEditModal({
  measure,
  twin,
  isOpen,
  onClose,
}: MeasureEditModalProps) {
  const { updateMeasure } = useMeasuresStoreV2()
  const { contacts, getContactsByTwin } = useContactsStore()
  const { accounts, getDefaultForProject } = useEmailAccountsStore()

  const [formData, setFormData] = useState<Partial<MeasureV2>>({
    title: measure.title,
    description: measure.description,
    status: measure.status,
    priority: measure.priority,
    aiMode: measure.aiMode,
    linkedContactIds: [...measure.linkedContactIds],
    preferredEmailAccountId: measure.preferredEmailAccountId,
    senderMode: measure.senderMode,
    dueDate: measure.dueDate,
    assignedTo: measure.assignedTo,
  })

  const [showContactSelector, setShowContactSelector] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const twinContacts = useMemo(() => getContactsByTwin(twin.id), [getContactsByTwin, twin.id])
  const projectDefaultEmail = getDefaultForProject(twin.id)

  const linkedContacts = useMemo(() => {
    return formData.linkedContactIds
      ?.map((id) => contacts.find((c) => c.id === id))
      .filter(Boolean) || []
  }, [formData.linkedContactIds, contacts])

  const handleSave = () => {
    updateMeasure(measure.id, formData)
    onClose()
  }

  const handleAddContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedContactIds: [...(prev.linkedContactIds || []), contactId],
    }))
    setShowContactSelector(false)
  }

  const handleRemoveContact = (contactId: string) => {
    setFormData((prev) => ({
      ...prev,
      linkedContactIds: prev.linkedContactIds?.filter((id) => id !== contactId) || [],
    }))
  }

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
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Maßnahme bearbeiten
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {measure.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    Grundinformationen
                  </h4>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Beschreibung
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-slate-600 dark:text-slate-400">
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
                        <option value="open">Offen</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="blocked">Blockiert</option>
                        <option value="done">Erledigt</option>
                        <option value="discarded">Verworfen</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-slate-600 dark:text-slate-400">
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
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                        <option value="critical">Kritisch</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* AI Mode */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    KI-Modus
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    {aiModeOptions.map((mode) => {
                      const colors = aiModeColors[mode]
                      const isSelected = formData.aiMode === mode
                      return (
                        <button
                          key={mode}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, aiMode: mode }))
                          }
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? `${colors.bg} ${colors.border} ring-1 ring-current`
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected
                                ? `border-current ${colors.text}`
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-current" />}
                          </div>
                          <div>
                            <p
                              className={`font-medium ${
                                isSelected ? colors.text : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {aiModeLabels[mode]}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sender Mode */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Absender-Einstellung
                  </h4>

                  <div className="space-y-2">
                    {senderModeOptions.map((mode) => (
                      <label
                        key={mode}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer transition-colors"
                      >
                        <input
                          type="radio"
                          name="senderMode"
                          value={mode}
                          checked={formData.senderMode === mode}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              senderMode: e.target.value as MeasureV2['senderMode'],
                            }))
                          }
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {senderModeLabels[mode]}
                        </span>
                      </label>
                    ))}
                  </div>

                  {/* Preferred Email Account */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
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
                      <option value="">Projekt-Standard verwenden {projectDefaultEmail ? `(${projectDefaultEmail.label})` : ''}</option>
                      {accounts
                        .filter((a) => a.connectionStatus === 'connected')
                        .map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.label} ({account.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Linked Contacts */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Verknüpfte Kontakte
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {linkedContacts.map((contact) =>
                      contact ? (
                        <div
                          key={contact.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full text-sm"
                        >
                          {contact.name}
                          <button
                            onClick={() => handleRemoveContact(contact.id)}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null
                    )}
                    <button
                      onClick={() => setShowContactSelector(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 rounded-full text-sm hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                    >
                      + Kontakt hinzufügen
                    </button>
                  </div>
                </div>

                {/* Due Date & Assigned */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Fälligkeitsdatum
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate?.split('T')[0] || ''}
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
                    <label className="text-sm text-slate-600 dark:text-slate-400">
                      Zugewiesen an
                    </label>
                    <input
                      type="text"
                      value={formData.assignedTo || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, assignedTo: e.target.value || undefined }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Name oder E-Mail"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onClose}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleSave} icon={Check}>
                    Speichern
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Selector Modal */}
      <ContactSelectorModal
        isOpen={showContactSelector}
        onClose={() => setShowContactSelector(false)}
        contacts={twinContacts}
        linkedContactIds={formData.linkedContactIds || []}
        onSelect={handleAddContact}
      />

      {/* Delete Confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Maßnahme löschen?
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen
                    Daten werden entfernt.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                  Abbrechen
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const { deleteMeasure } = useMeasuresStoreV2.getState()
                    deleteMeasure(measure.id)
                    setShowDeleteConfirm(false)
                    onClose()
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Löschen
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ContactSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  contacts: ReturnType<typeof useContactsStore.getState>['contacts']
  linkedContactIds: string[]
  onSelect: (contactId: string) => void
}

function ContactSelectorModal({
  isOpen,
  onClose,
  contacts,
  linkedContactIds,
  onSelect,
}: ContactSelectorModalProps) {
  const availableContacts = contacts.filter((c) => !linkedContactIds.includes(c.id))

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Kontakt auswählen
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {availableContacts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Keine weiteren Kontakte verfügbar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => onSelect(contact.id)}
                      className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {contact.name}
                          </p>
                          {contact.company && (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {contact.company}
                            </p>
                          )}
                        </div>
                      </div>
                      {contact.email && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 ml-13">
                          {contact.email}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
