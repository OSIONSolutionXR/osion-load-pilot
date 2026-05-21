import type { ProjectTwinAnalysis, ProjectTwinUpdate, ChangedField } from '../types/projectTwin'

export interface StoredProjectTwin {
  id: string
  createdAt: string
  updatedAt: string
  sourceInput: string
  analysis: ProjectTwinAnalysis
  updates: ProjectTwinUpdate[]
}

const STORAGE_KEY = 'osion-load-pilot.project-twins.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadStoredProjectTwins(): StoredProjectTwin[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is StoredProjectTwin =>
        item &&
        typeof item.id === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string' &&
        typeof item.sourceInput === 'string' &&
        item.analysis &&
        typeof item.analysis === 'object'
    )
  } catch {
    return []
  }
}

export function saveStoredProjectTwins(twins: StoredProjectTwin[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(twins))
}

export function createStoredProjectTwin(sourceInput: string, analysis: ProjectTwinAnalysis): StoredProjectTwin {
  const timestamp = new Date().toISOString()

  return {
    id: `twin-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceInput: sourceInput.trim(),
    analysis,
    updates: []
  }
}

// Helper: Extrahiere veränderte Felder zwischen zwei Analysen
function extractChangedFields(
  oldAnalysis: ProjectTwinAnalysis,
  newAnalysis: ProjectTwinAnalysis
): ChangedField[] {
  const changes: ChangedField[] = []

  // Next Move Änderungen
  if (oldAnalysis.nextMove.title !== newAnalysis.nextMove.title) {
    changes.push({
      field: 'nextMove.title',
      oldValue: oldAnalysis.nextMove.title,
      newValue: newAnalysis.nextMove.title
    })
  }

  // Confidence Änderung
  if (oldAnalysis.quality.confidence !== newAnalysis.quality.confidence) {
    changes.push({
      field: 'quality.confidence',
      oldValue: oldAnalysis.quality.confidence,
      newValue: newAnalysis.quality.confidence
    })
  }

  // Missing Context Reduktion
  const oldMissing = oldAnalysis.quality.missingContext.join(', ') || 'keine'
  const newMissing = newAnalysis.quality.missingContext.join(', ') || 'keine'
  if (oldMissing !== newMissing) {
    changes.push({
      field: 'quality.missingContext',
      oldValue: oldMissing,
      newValue: newMissing
    })
  }

  // Projektbeschreibung
  if (oldAnalysis.project.description !== newAnalysis.project.description) {
    changes.push({
      field: 'project.description',
      oldValue: oldAnalysis.project.description.substring(0, 100) + '...',
      newValue: newAnalysis.project.description.substring(0, 100) + '...'
    })
  }

  // Aktoren-Anzahl
  if (oldAnalysis.actors.length !== newAnalysis.actors.length) {
    changes.push({
      field: 'actors.count',
      oldValue: String(oldAnalysis.actors.length),
      newValue: String(newAnalysis.actors.length)
    })
  }

  // Risiken-Anzahl
  if (oldAnalysis.risks.length !== newAnalysis.risks.length) {
    changes.push({
      field: 'risks.count',
      oldValue: String(oldAnalysis.risks.length),
      newValue: String(newAnalysis.risks.length)
    })
  }

  return changes
}

// Aktualisiert einen bestehenden Project Twin mit neuem Kontext
export function updateStoredProjectTwin(
  existingTwin: StoredProjectTwin,
  additionalInput: string,
  updatedAnalysis: ProjectTwinAnalysis
): StoredProjectTwin {
  const timestamp = new Date().toISOString()
  const changedFields = extractChangedFields(existingTwin.analysis, updatedAnalysis)

  const updateEntry: ProjectTwinUpdate = {
    timestamp,
    input: additionalInput.trim(),
    summary: generateUpdateSummary(changedFields, updatedAnalysis),
    changedFields
  }

  return {
    ...existingTwin,
    updatedAt: timestamp,
    analysis: updatedAnalysis,
    updates: [...existingTwin.updates, updateEntry]
  }
}

// Generiert eine menschenlesbare Zusammenfassung des Updates
function generateUpdateSummary(
  changes: ChangedField[],
  analysis: ProjectTwinAnalysis
): string {
  const hasConfidenceIncrease = changes.some(
    c => c.field === 'quality.confidence' && 
    (c.oldValue === 'low' && c.newValue === 'medium') ||
    (c.oldValue === 'medium' && c.newValue === 'high') ||
    (c.oldValue === 'low' && c.newValue === 'high')
  )

  const hasContextReduction = changes.some(
    c => c.field === 'quality.missingContext' && 
    analysis.quality.missingContext.length === 0
  )

  const hasNextMoveChange = changes.some(c => c.field === 'nextMove.title')

  if (hasContextReduction && hasConfidenceIncrease) {
    return 'Projektlage vollständig verifiziert. Alle Kontextfragen geklärt, Entscheidungsvorlage jetzt hochvertrauenswürdig.'
  }

  if (hasContextReduction) {
    return 'Fehlender Kontext ergänzt. Analyse jetzt vollständiger und präziser.'
  }

  if (hasConfidenceIncrease) {
    return `Vertrauensniveau erhöht auf "${analysis.quality.confidence}". Bessere Entscheidungsbasis durch zusätzliche Informationen.`
  }

  if (hasNextMoveChange) {
    return 'Nächster Schritt neu priorisiert basierend auf aktualisiertem Kontext.'
  }

  return 'Project Twin mit zusätzlichem Kontext aktualisiert.'
}

// Aktualisiert einen Twin im Array und speichert
export function saveUpdatedProjectTwin(
  allTwins: StoredProjectTwin[],
  updatedTwin: StoredProjectTwin
): StoredProjectTwin[] {
  const newTwins = allTwins.map(t => t.id === updatedTwin.id ? updatedTwin : t)
  saveStoredProjectTwins(newTwins)
  return newTwins
}
