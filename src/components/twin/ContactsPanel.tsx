import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Users, Plus, Search, Edit3, Trash2, Mail, Phone, Building2, Tag, X, Check } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  useContactsStore,
  type Contact,
  type ContactCategory,
  contactCategoryLabels,
  contactCategoryColors,
  preferredChannelLabels,
} from '../../lib/contactsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface ContactsPanelProps {
  twin: StoredProjectTwinV2
}

const categoryOptions: ContactCategory[] = [
  'tax_advisor',
  'customer',
  'supplier',
  'craftsman',
  'authority',
  'bank',
  'insurance',
  'internal',
  'external_partner',
  'other',
]

export default function ContactsPanel({ twin }: ContactsPanelProps) {
  const { addContact, updateContact, deleteContact, getContactsByTwin } = useContactsStore()
  const twinContacts = getContactsByTwin(twin.id)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ContactCategory | 'all'>('all')
  const [isAdding, setIsAdding] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const [formData, setFormData] = useState<Partial<Contact>>({
    name: '',
    company: '',
    role: '',
    category: 'other',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    address: '',
    notes: '',
    preferredChannel: 'email',
    tags: [],
  })

  const [tagInput, setTagInput] = useState('')

  const filteredContacts = useMemo(() => {
    return twinContacts.filter((contact) => {
      const matchesSearch =
        searchQuery === '' ||
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = selectedCategory === 'all' || contact.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [twinContacts, searchQuery, selectedCategory])

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }))
  }

  const handleSubmit = () => {
    if (!formData.name?.trim()) return

    if (editingContact) {
      updateContact(editingContact.id, formData)
      setEditingContact(null)
    } else {
      addContact({
        ...formData,
        projectId: twin.id,
        twinId: twin.id,
        name: formData.name || '',
        category: (formData.category as ContactCategory) || 'other',
        preferredChannel: formData.preferredChannel || 'email',
        tags: formData.tags || [],
      } as Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>)
    }

    setIsAdding(false)
    setFormData({
      name: '',
      company: '',
      role: '',
      category: 'other',
      email: '',
      phone: '',
      mobile: '',
      website: '',
      address: '',
      notes: '',
      preferredChannel: 'email',
      tags: [],
    })
  }

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({ ...contact })
    setIsAdding(true)
  }

  const handleDelete = (id: string) => {
    deleteContact(id)
    setShowDeleteConfirm(null)
  }

  const stats = useMemo(() => {
    return {
      total: twinContacts.length,
      byCategory: categoryOptions.map((cat) => ({
        category: cat,
        count: twinContacts.filter((c) => c.category === cat).length,
      })),
    }
  }, [twinContacts])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kontakte</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {stats.total} Kontakt{stats.total !== 1 ? 'e' : ''} im Twin
          </p>
        </div>
        <Button
          icon={Plus}
          onClick={() => {
            setEditingContact(null)
            setFormData({
              name: '',
              company: '',
              role: '',
              category: 'other',
              email: '',
              phone: '',
              mobile: '',
              website: '',
              address: '',
              notes: '',
              preferredChannel: 'email',
              tags: [],
            })
            setIsAdding(true)
          }}
        >
          Kontakt hinzufügen
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Kontakte durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as ContactCategory | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        >
          <option value="all">Alle Kategorien</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>
              {contactCategoryLabels[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Category Stats */}
      <div className="flex flex-wrap gap-2">
        {stats.byCategory
          .filter((s) => s.count > 0)
          .map(({ category, count }) => {
            const colors = contactCategoryColors[category]
            return (
              <button
                key={category}
                onClick={() =>
                  setSelectedCategory(selectedCategory === category ? 'all' : category)
                }
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-slate-900 ring-current`
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {contactCategoryLabels[category]}
                <span className="text-xs opacity-70">{count}</span>
              </button>
            )
          })}
      </div>

      {/* Contacts List */}
      <div className="space-y-3">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery
                ? 'Keine Kontakte gefunden'
                : 'Noch keine Kontakte vorhanden'}
            </p>
            {!searchQuery && (
              <Button
                variant="ghost"
                icon={Plus}
                onClick={() => setIsAdding(true)}
                className="mt-4"
              >
                Ersten Kontakt erstellen
              </Button>
            )}
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const colors = contactCategoryColors[contact.category]
            return (
              <motion.div
                key={contact.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                        {contact.name}
                      </h3>
                      <Badge
                        className={`${colors.bg} ${colors.text} border-0`}
                      >
                        {contactCategoryLabels[contact.category]}
                      </Badge>
                      {contact.preferredChannel !== 'none' && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {preferredChannelLabels[contact.preferredChannel]}
                        </span>
                      )}
                    </div>

                    {(contact.company || contact.role) && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {contact.company && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {contact.company}
                          </span>
                        )}
                        {contact.role && (
                          <span className={contact.company ? 'ml-2' : ''}>
                            {contact.role}
                          </span>
                        )}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-4 mt-3">
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </a>
                      )}
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {contact.phone}
                        </a>
                      )}
                      {contact.mobile && (
                        <a
                          href={`tel:${contact.mobile}`}
                          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Mobil: {contact.mobile}
                        </a>
                      )}
                    </div>

                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {contact.notes && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">
                        {contact.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(contact.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {editingContact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
                </h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Name eingeben"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Kategorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value as ContactCategory,
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat} value={cat}>
                          {contactCategoryLabels[cat]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Unternehmen
                    </label>
                    <input
                      type="text"
                      value={formData.company || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, company: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Firmenname"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Rolle / Position
                    </label>
                    <input
                      type="text"
                      value={formData.role || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, role: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="z.B. Projektleiter"
                    />
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="email@beispiel.de"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bevorzugter Kanal
                    </label>
                    <select
                      value={formData.preferredChannel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          preferredChannel: e.target.value as Contact['preferredChannel'],
                        }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    >
                      <option value="email">E-Mail</option>
                      <option value="phone">Telefon</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="none">Keine Präferenz</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="+49 40 123456"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Mobil
                    </label>
                    <input
                      type="tel"
                      value={formData.mobile || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, mobile: e.target.value }))
                      }
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="+49 170 1234567"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, website: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="https://www.beispiel.de"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Adresse
                  </label>
                  <textarea
                    value={formData.address || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, address: e.target.value }))
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Straße, PLZ Ort"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-600 dark:hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="Tag hinzufügen..."
                    />
                    <Button
                      variant="secondary"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Notizen
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    placeholder="Zusätzliche Informationen..."
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setIsAdding(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name?.trim()}
                  icon={Check}
                >
                  {editingContact ? 'Speichern' : 'Erstellen'}
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
                Kontakt löschen?
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Diese Aktion kann nicht rückgängig gemacht werden.
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
