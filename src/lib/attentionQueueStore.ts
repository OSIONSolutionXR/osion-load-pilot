import type { AttentionQueueItem } from '../types/projectTwinV2'

const STORAGE_KEY = 'attentionQueue'

function getStorageKey(twinId: string): string {
  return `${STORAGE_KEY}_${twinId}`
}

/**
 * Lädt die Attention Queue Items für ein Twin aus dem LocalStorage
 */
export function loadAttentionQueue(twinId: string): AttentionQueueItem[] {
  try {
    const key = getStorageKey(twinId)
    const stored = localStorage.getItem(key)
    if (stored) {
      return JSON.parse(stored)
    }
    return []
  } catch (error) {
    console.error('Error loading attention queue:', error)
    return []
  }
}

/**
 * Speichert die Attention Queue Items für ein Twin im LocalStorage
 */
export function saveAttentionQueue(twinId: string, items: AttentionQueueItem[]): void {
  try {
    const key = getStorageKey(twinId)
    localStorage.setItem(key, JSON.stringify(items))
  } catch (error) {
    console.error('Error saving attention queue:', error)
  }
}

/**
 * Markiert ein Attention Queue Item als erledigt
 */
export function markAttentionQueueItemAsDone(
  twinId: string,
  itemId: string
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status: 'done' as const,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Aktualisiert die Notizen eines Attention Queue Items
 */
export function updateAttentionQueueItemNotes(
  twinId: string,
  itemId: string,
  notes: string
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          notes,
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Aktualisiert den Status eines Attention Queue Items
 */
export function updateAttentionQueueItemStatus(
  twinId: string,
  itemId: string,
  status: 'open' | 'blocked' | 'done'
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          status,
          completedAt: status === 'done' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Fügt ein neues Item zur Attention Queue hinzu oder aktualisiert ein bestehendes
 */
export function addOrUpdateAttentionQueueItem(
  twinId: string,
  item: AttentionQueueItem
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const existingIndex = items.findIndex((i) => i.id === item.id)

  let updatedItems: AttentionQueueItem[]
  if (existingIndex >= 0) {
    // Bestehendes Item aktualisieren, aber Notes und Status beibehalten
    const existingItem = items[existingIndex]
    updatedItems = [...items]
    updatedItems[existingIndex] = {
      ...item,
      notes: existingItem.notes,
      status: existingItem.status,
      completedAt: existingItem.completedAt,
      updatedAt: new Date().toISOString(),
    }
  } else {
    // Neues Item hinzufügen
    updatedItems = [...items, item]
  }

  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Löscht ein Attention Queue Item
 */
export function deleteAttentionQueueItem(
  twinId: string,
  itemId: string
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.filter((item) => item.id !== itemId)
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Synchronisiert die generierten Attention Queue Items mit den gespeicherten
 * Beibehaltung von User-Daten (Notes, Status)
 */
export function syncAttentionQueue(
  twinId: string,
  generatedItems: AttentionQueueItem[]
): AttentionQueueItem[] {
  const storedItems = loadAttentionQueue(twinId)
  
  const syncedItems = generatedItems.map((generatedItem) => {
    const storedItem = storedItems.find((s) => s.id === generatedItem.id)
    if (storedItem) {
      // Bestehendes Item: Behalte Notes, Status und completedAt bei
      return {
        ...generatedItem,
        notes: storedItem.notes,
        status: storedItem.status,
        completedAt: storedItem.completedAt,
        updatedAt: storedItem.updatedAt,
      }
    }
    return generatedItem
  })

  saveAttentionQueue(twinId, syncedItems)
  return syncedItems
}
