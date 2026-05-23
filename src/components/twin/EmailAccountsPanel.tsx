import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Mail,
  Plus,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit3,
  Shield,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  useEmailAccountsStore,
  type EmailAccount,
  type EmailProvider,
  emailProviderLabels,
  connectionStatusLabels,
  connectionStatusColors,
} from '../../lib/emailAccountsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface EmailAccountsPanelProps {
  twin: StoredProjectTwinV2
}

const providerOptions: EmailProvider[] = [
  'google',
  'microsoft',
  'smtp',
  'imap_smtp',
  'loadpilot',
  'custom',
]

export default function EmailAccountsPanel({ twin }: EmailAccountsPanelProps) {
  const { accounts, addAccount, updateAccount, deleteAccount, getDefaultForProject, setDefaultForProject } =
    useEmailAccountsStore()

  const [isAdding, setIsAdding] = useState(false)
  const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<EmailAccount>>({
    label: '',
    email: '',
    displayName: '',
    provider: 'loadpilot',
    connectionStatus: 'not_connected',
    isDefault: false,
    canSend: true,
    canReceive: true,
    preferredForProjects: [],
    ownerType: 'user',
  })

  const projectDefault = getDefaultForProject(twin.id)

  const userAccounts = useMemo(() => {
    return accounts.filter(
      (account) =>
        account.ownerType === 'user' ||
        (account.ownerType === 'project' && account.projectId === twin.id)
    )
  }, [accounts, twin.id])

  const handleSubmit = () => {
    if (!formData.label?.trim() || !formData.email?.trim()) return

    if (editingAccount) {
      updateAccount(editingAccount.id, formData)
      setEditingAccount(null)
    } else {
      addAccount({
        ...formData,
        ownerType: 'user',
        label: formData.label || '',
        email: formData.email || '',
        provider: (formData.provider as EmailProvider) || 'loadpilot',
        connectionStatus: 'not_connected',
        isDefault: accounts.length === 0,
        canSend: formData.canSend ?? true,
        canReceive: formData.canReceive ?? true,
        preferredForProjects: [],
      } as Omit<EmailAccount, 'id' | 'createdAt' | 'updatedAt'>)
    }

    setIsAdding(false)
    setFormData({
      label: '',
      email: '',
      displayName: '',
      provider: 'loadpilot',
      connectionStatus: 'not_connected',
      isDefault: false,
      canSend: true,
      canReceive: true,
      preferredForProjects: [],
      ownerType: 'user',
    })
  }

  const handleEdit = (account: EmailAccount) => {
    setEditingAccount(account)
    setFormData({ ...account })
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    deleteAccount(id)
    setShowDeleteConfirm(null)
  }

  const handleConnect = async (account: EmailAccount) => {
    setIsConnecting(account.id)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    updateAccount(account.id, {
      connectionStatus: 'connected',
      lastVerifiedAt: new Date().toISOString(),
    })
    setIsConnecting(null)
  }

  const handleSetDefault = (accountId: string) => {
    setDefaultForProject(twin.id, accountId)
  }

  const getProviderIcon = (provider: EmailProvider) => {
    switch (provider) {
      case 'google':
        return 'G'
      case 'microsoft':
        return 'M'
      case 'loadpilot':
        return 'LP'
      default:
        return '●'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            E-Mail-Konten
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verwalte E-Mail-Verbindungen für den Versand
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            setEditingAccount(null)
            setFormData({
              label: '',
              email: '',
              displayName: '',
              provider: 'loadpilot',
              connectionStatus: 'not_connected',
              isDefault: false,
              canSend: true,
              canReceive: true,
              preferredForProjects: [],
              ownerType: 'user',
            })
            setIsAdding(true)
          }}
        >
          Konto hinzufügen
        </Button>
      </div>

      {/* Security Notice */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Sicherheitshinweis
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
            Passwörter und Zugangsdaten werden nicht im Frontend gespeichert. Für externe Provider
            wird eine sichere OAuth-Verbindung verwendet.
          </p>
        </div>
      </div>

      {/* Accounts List */}
      <div className="space-y-3">
        {userAccounts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <Mail className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Noch keine E-Mail-Konten vorhanden</p>
            <Button
              variant="ghost"
              icon={Plus}
              onClick={() => setIsAdding(true)}
              className="mt-4"
            >
              Erstes Konto verbinden
            </Button>
          </div>
        ) : (
          userAccounts.map((account) => {
            const statusColors = connectionStatusColors[account.connectionStatus]
            const isDefault = projectDefault?.id === account.id

            return (
              <motion.div
                key={account.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-slate-800 border rounded-xl p-5 transition-all ${
                  isDefault
                    ? 'border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                        account.provider === 'google'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                          : account.provider === 'microsoft'
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {getProviderIcon(account.provider)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {account.label}
                        </h3>
                        {isDefault && (
                          <Badge
                            className="bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-0"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Standard
                          </Badge>
                        )}
                        <Badge
                          className={`${statusColors.bg} ${statusColors.text} border-0`}
                        >
                          {connectionStatusLabels[account.connectionStatus]}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        {account.email}
                      </p>

                      {account.displayName && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Anzeigename: {account.displayName}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
                          {emailProviderLabels[account.provider]}
                        </span>
                        {account.canSend && (
                          <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 rounded-full">
                            Senden
                          </span>
                        )}
                        {account.canReceive && (
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full">
                            Empfangen
                          </span>
                        )}
                      </div>

                      {account.lastVerifiedAt && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          Zuletzt geprüft: {new Date(account.lastVerifiedAt).toLocaleString('de-DE')}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(account.id)}
                        className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Als Standard festlegen"
                      >
                        Als Standard
                      </button>
                    )}

                    {account.connectionStatus !== 'connected' &&
                      account.provider !== 'loadpilot' && (
                        <button
                          onClick={() => handleConnect(account)}
                          disabled={isConnecting === account.id}
                          className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                          title="Verbinden"
                        >
                          <RefreshCw
                            className={`w-4 h-4 ${isConnecting === account.id ? 'animate-spin' : ''}`}
                          />
                        </button>
                      )}

                    <button
                      onClick={() => handleEdit(account)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {account.ownerType !== 'system' && (
                      <button
                        onClick={() => setShowDeleteConfirm(account.id)}
                        className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsAdding(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingAccount ? 'Konto bearbeiten' : 'E-Mail-Konto hinzufügen'}
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Provider Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Provider
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {providerOptions.map((provider) => (
                      <button
                        key={provider}
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, provider }))
                        }
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          formData.provider === provider
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        {emailProviderLabels[provider]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bezeichnung *
                    </label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, label: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="z.B. Mein Gmail"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      E-Mail-Adresse *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="name@beispiel.de"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Anzeigename (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.displayName || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, displayName: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Max Mustermann"
                    />
                  </div>
                </div>

                {/* Capabilities */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Berechtigungen
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canSend}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, canSend: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">E-Mails senden</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.canReceive}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, canReceive: e.target.checked }))
                        }
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">E-Mails empfangen</span>
                    </label>
                  </div>
                </div>

                {formData.provider !== 'loadpilot' && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                          OAuth-Verbindung
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                          Nach dem Speichern wirst du zum Provider weitergeleitet, um die Verbindung
                          zu autorisieren. Keine Passwörter werden gespeichert.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.label?.trim() || !formData.email?.trim()}
                  icon={Check}
                >
                  {editingAccount ? 'Speichern' : 'Hinzufügen'}
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
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Konto löschen?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Diese Aktion kann nicht rückgängig gemacht werden. Bereits gesendete E-Mails
                bleiben davon unberührt.
              </p>
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
