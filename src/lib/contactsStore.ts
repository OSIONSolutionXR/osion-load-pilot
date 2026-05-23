import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContactCategory = 
  | 'tax_advisor' | 'customer' | 'supplier' | 'craftsman' 
  | 'authority' | 'bank' | 'insurance' | 'internal' | 'external_partner' | 'other'

export type PreferredChannel = 'email' | 'phone' | 'whatsapp' | 'none'

export interface Contact {
  id: string
  projectId: string
  twinId: string
  name: string
  company?: string
  role?: string
  category: ContactCategory
  email?: string
  phone?: string
  mobile?: string
  website?: string
  address?: string
  notes?: string
  preferredChannel: PreferredChannel
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ContactsState {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateContact: (id: string, updates: Partial<Contact>) => void
  deleteContact: (id: string) => void
  getContactsByProject: (projectId: string) => Contact[]
  getContactsByCategory: (category: ContactCategory) => Contact[]
  getContactById: (id: string) => Contact | undefined
  getContactsByTwin: (twinId: string) => Contact[]
}

const generateId = () => `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Beispieldaten
const initialContacts: Contact[] = [
  {
    id: 'contact-1',
    projectId: 'project-1',
    twinId: 'twin-1',
    name: 'Max Mustermann',
    company: 'Musterfirma GmbH',
    role: 'Steuerberater',
    category: 'tax_advisor',
    email: 'max@mustermann.de',
    phone: '+49 40 123456',
    mobile: '+49 170 1234567',
    address: 'Musterstraße 1, 20095 Hamburg',
    notes: 'Langjähriger Steuerberater für das Projekt',
    preferredChannel: 'email',
    tags: ['wichtig', 'steuer'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'contact-2',
    projectId: 'project-1',
    twinId: 'twin-1',
    name: 'Erika Schmidt',
    company: 'Schmidt & Co',
    role: 'Kundenbetreuerin',
    category: 'customer',
    email: 'erika@schmidt.de',
    phone: '+49 40 987654',
    preferredChannel: 'phone',
    tags: ['kunde', 'hauptkontakt'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: initialContacts,

      addContact: (contact) => {
        const now = new Date().toISOString();
        const newContact: Contact = {
          ...contact,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          contacts: [...state.contacts, newContact],
        }));
        return newContact.id;
      },

      updateContact: (id, updates) => {
        set((state) => ({
          contacts: state.contacts.map((contact) =>
            contact.id === id
              ? { ...contact, ...updates, updatedAt: new Date().toISOString() }
              : contact
          ),
        }));
      },

      deleteContact: (id) => {
        set((state) => ({
          contacts: state.contacts.filter((contact) => contact.id !== id),
        }));
      },

      getContactsByProject: (projectId) => {
        return get().contacts.filter((contact) => contact.projectId === projectId);
      },

      getContactsByCategory: (category) => {
        return get().contacts.filter((contact) => contact.category === category);
      },

      getContactById: (id) => {
        return get().contacts.find((contact) => contact.id === id);
      },

      getContactsByTwin: (twinId) => {
        return get().contacts.filter((contact) => contact.twinId === twinId);
      },
    }),
    {
      name: 'magwarm-contacts',
    }
  )
);

// Hilfsfunktionen für Kontakt-Kategorien
export const contactCategoryLabels: Record<ContactCategory, string> = {
  tax_advisor: 'Steuerberater',
  customer: 'Kunde',
  supplier: 'Lieferant',
  craftsman: 'Handwerker',
  authority: 'Behörde',
  bank: 'Bank',
  insurance: 'Versicherung',
  internal: 'Intern',
  external_partner: 'Externer Partner',
  other: 'Sonstige',
};

export const contactCategoryColors: Record<ContactCategory, { bg: string; text: string }> = {
  tax_advisor: { bg: 'bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  customer: { bg: 'bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
  supplier: { bg: 'bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
  craftsman: { bg: 'bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  authority: { bg: 'bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
  bank: { bg: 'bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
  insurance: { bg: 'bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
  internal: { bg: 'bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' },
  external_partner: { bg: 'bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
  other: { bg: 'bg-gray-500/20', text: 'text-gray-600 dark:text-gray-400' },
};

export const preferredChannelLabels: Record<PreferredChannel, string> = {
  email: 'E-Mail',
  phone: 'Telefon',
  whatsapp: 'WhatsApp',
  none: 'Keine Präferenz',
};
