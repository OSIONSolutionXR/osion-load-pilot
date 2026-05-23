import type { AttentionQueueItem, AIAction, StoredProjectTwinV2 } from '../types/projectTwinV2'
import type { Measure, MeasureStatus, MeasurePriority } from '../types/measures'

const STORAGE_KEY = 'attentionQueue'

function getStorageKey(twinId: string): string {
  return `${STORAGE_KEY}_${twinId}`
}

/**
 * Mappt Measure-Status auf AttentionQueue-Status
 */
function mapMeasureStatus(measureStatus: MeasureStatus): AttentionQueueItem['status'] {
  switch (measureStatus) {
    case 'done':
    case 'discarded':
      return 'done'
    case 'blocked':
      return 'blocked'
    case 'in_progress':
    case 'open':
    case 'waiting':
    case 'idea':
    default:
      return 'open'
  }
}

/**
 * Mappt Measure-Priority auf AttentionQueue-Severity
 */
function mapMeasurePriority(priority: MeasurePriority): AttentionQueueItem['severity'] {
  switch (priority) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
    default:
      return 'low'
  }
}

/**
 * Mappt Measure-Status auf Category
 */
function getCategoryFromStatus(measure: Measure): AttentionQueueItem['category'] {
  if (measure.status === 'blocked') return 'blocker'
  if (measure.status === 'waiting') return 'dependency'
  return 'action'
}

/**
 * Konvertiert eine Maßnahme in ein Attention Queue Item
 */
function measureToQueueItem(measure: Measure, twin: StoredProjectTwinV2): AttentionQueueItem {
  return {
    id: `measure-${measure.id}`,
    twinId: twin.id,
    title: measure.title,
    description: measure.description,
    projectTitle: twin.title,
    severity: mapMeasurePriority(measure.priority),
    status: mapMeasureStatus(measure.status),
    category: getCategoryFromStatus(measure),
    reason: measure.strategicGoal || `Priorität: ${measure.priority}`,
    nextStep: measure.notes || (measure.dueDate ? `Fällig: ${new Date(measure.dueDate).toLocaleDateString('de-DE')}` : undefined),
    notes: measure.notes,
    createdAt: measure.createdAt,
    updatedAt: measure.createdAt,
    completedAt: measure.completedAt || undefined,
  }
}

// ============================================================================
// CORE STORAGE FUNCTIONS
// ============================================================================

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

// ============================================================================
// QUEUE REBUILD FUNCTIONS
// ============================================================================

/**
 * Baut die Attention Queue aus aktuellen Maßnahmen neu auf
 * Behält bestehende User-Daten (Notes, AIActions) bei
 */
export function rebuildAttentionQueueFromMeasures(
  twin: StoredProjectTwinV2
): AttentionQueueItem[] {
  const existingItems = loadAttentionQueue(twin.id)
  const existingItemsMap = new Map(existingItems.map(item => [item.id, item]))
  
  // Filtere abgeschlossene Maßnahmen raus
  const activeMeasures = (twin.measures || []).filter(m => 
    m.status !== 'done' && m.status !== 'discarded'
  )
  
  // Konvertiere Maßnahmen zu Queue Items
  const newQueueItems = activeMeasures.map(measure => {
    const queueItem = measureToQueueItem(measure, twin)
    const existingItem = existingItemsMap.get(queueItem.id)
    
    if (existingItem) {
      // Behalte User-Daten bei, aktualisiere aber Metadaten
      return {
        ...queueItem,
        notes: existingItem.notes,
        aiActions: existingItem.aiActions,
        status: existingItem.status, // Behalte manuell gesetzten Status bei
        completedAt: existingItem.completedAt,
      }
    }
    
    return queueItem
  })
  
  // Sortiere nach Priorität
  const sortedItems = sortAttentionQueue(newQueueItems)
  
  // Speichern
  saveAttentionQueue(twin.id, sortedItems)
  
  return sortedItems
}

/**
 * Sortiert die Queue nach Priorität:
 * 1. Blockiert + kritisch
 * 2. Heute fällig
 * 3. Morgen fällig
 * 4. Innerhalb 7 Tage
 * 5. Hoher Nutzwert (>7)
 * 6. Hohe Priorität (hoch/kritisch)
 * 7. Normale offene Maßnahmen
 */
export function sortAttentionQueue(items: AttentionQueueItem[]): AttentionQueueItem[] {
  return [...items].sort((a, b) => {
    // Berechne Score für beide Items
    const scoreA = calculateQueueItemScore(a)
    const scoreB = calculateQueueItemScore(b)
    
    return scoreB - scoreA // Absteigend
  })
}

/**
 * Berechnet den Sortierscore für ein Queue-Item
 */
function calculateQueueItemScore(item: AttentionQueueItem): number {
  let score = 0

  // 1. Blockiert + kritisch = höchste Priorität
  if (item.status === 'blocked' && item.severity === 'critical') {
    score += 10000
  } else if (item.status === 'blocked') {
    score += 5000
  }

  // 2. Frist-basiert aus nextStep parsen
  if (item.nextStep?.includes('Fällig:')) {
    const dateMatch = item.nextStep.match(/(\d{2})\.(\d{2})\.(\d{4})/)
    if (dateMatch) {
      const [, day, month, year] = dateMatch
      const dueDate = new Date(`${year}-${month}-${day}`)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        score += 800 + Math.abs(diffDays) * 10
      } else if (diffDays === 0) {
        score += 600
      } else if (diffDays === 1) {
        score += 400
      } else if (diffDays <= 7) {
        score += 200
      }
    }
  }

  // 3. Severity
  switch (item.severity) {
    case 'critical':
      score += 300
      break
    case 'high':
      score += 200
      break
    case 'medium':
      score += 100
      break
    case 'low':
      score += 50
      break
  }

  // 4. Category
  if (item.category === 'blocker') score += 500
  if (item.category === 'dependency') score += 100

  return score
}

// ============================================================================
// ITEM MANAGEMENT
// ============================================================================

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
  status: AttentionQueueItem['status']
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
    // Bestehendes Item aktualisieren, aber Notes, Status und AIActions beibehalten
    const existingItem = items[existingIndex]
    updatedItems = [...items]
    updatedItems[existingIndex] = {
      ...item,
      notes: existingItem.notes,
      status: existingItem.status,
      completedAt: existingItem.completedAt,
      aiActions: existingItem.aiActions,
      updatedAt: new Date().toISOString(),
    }
  } else {
    // Neues Item hinzufügen
    updatedItems = [...items, item]
  }

  const sortedItems = sortAttentionQueue(updatedItems)
  saveAttentionQueue(twinId, sortedItems)
  return sortedItems
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
 * Beibehaltung von User-Daten (Notes, Status, AIActions)
 */
export function syncAttentionQueue(
  twinId: string,
  generatedItems: AttentionQueueItem[]
): AttentionQueueItem[] {
  const storedItems = loadAttentionQueue(twinId)
  
  const syncedItems = generatedItems.map((generatedItem) => {
    const storedItem = storedItems.find((s) => s.id === generatedItem.id)
    if (storedItem) {
      // Bestehendes Item: Behalte Notes, Status, completedAt und AIActions bei
      return {
        ...generatedItem,
        notes: storedItem.notes,
        status: storedItem.status,
        completedAt: storedItem.completedAt,
        aiActions: storedItem.aiActions,
        updatedAt: storedItem.updatedAt,
      }
    }
    return generatedItem
  })

  const sortedItems = sortAttentionQueue(syncedItems)
  saveAttentionQueue(twinId, sortedItems)
  return sortedItems
}

// ============================================================================
// AI ACTION FUNCTIONS
// ============================================================================

/**
 * Fügt eine AI Action zu einem Attention Queue Item hinzu
 */
export function addAIActionToQueueItem(
  twinId: string,
  itemId: string,
  action: AIAction
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          aiActions: [...(item.aiActions || []), action],
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Markiert eine AI Action als verwendet
 */
export function markAIActionAsUsed(
  twinId: string,
  itemId: string,
  actionId: string
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          aiActions: item.aiActions?.map((action) =>
            action.id === actionId ? { ...action, used: true } : action
          ) || [],
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Löscht eine AI Action von einem Attention Queue Item
 */
export function deleteAIActionFromQueueItem(
  twinId: string,
  itemId: string,
  actionId: string
): AttentionQueueItem[] {
  const items = loadAttentionQueue(twinId)
  const updatedItems = items.map((item) =>
    item.id === itemId
      ? {
          ...item,
          aiActions: item.aiActions?.filter((action) => action.id !== actionId) || [],
          updatedAt: new Date().toISOString(),
        }
      : item
  )
  saveAttentionQueue(twinId, updatedItems)
  return updatedItems
}

/**
 * Lädt alle AI Actions für ein Attention Queue Item
 */
export function loadAIActionsForQueueItem(
  twinId: string,
  itemId: string
): AIAction[] {
  const items = loadAttentionQueue(twinId)
  const item = items.find((i) => i.id === itemId)
  return item?.aiActions || []
}
