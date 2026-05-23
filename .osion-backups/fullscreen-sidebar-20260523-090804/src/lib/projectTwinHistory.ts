/**
 * Project Twin History Utilities
 * 
 * Hilfsfunktionen für die Anzeige des Projektverlaufs
 */

import type { StoredProjectTwinV2 as StoredProjectTwin, ProjectTwinUpdate } from '../types/projectTwinV2'

// Quellen-Mapping für nutzerfreundliche Labels
export const SOURCE_LABELS: Record<string, string> = {
  context_form: 'Kontext ergänzt',
  manual_update: 'Manuelles Projektupdate',
  project_chat: 'KI-Interaktion',
  action_update: 'Aktion aktualisiert',
  system: 'System-Update'
}

// Mapping für technische Feldnamen zu nutzerfreundlichen Labels
export const FIELD_NAME_MAPPING: Record<string, string> = {
  'analysis.nextMove.title': 'Nächster Schritt',
  'analysis.nextMove.reason': 'Begründung',
  'analysis.quality.confidence': 'Analyse-Sicherheit',
  'analysis.quality.missingContext': 'Fehlender Kontext',
  'progress.percent': 'Projektfortschritt',
  'progress.stage': 'Projektphase',
  'analysis.risks': 'Risiken',
  'analysis.risks.count': 'Risiken',
  'analysis.dependencies': 'Abhängigkeiten',
  'analysis.dependencies.count': 'Abhängigkeiten',
  'analysis.actions': 'Aktionen',
  'analysis.actions.count': 'Aktionen',
  'analysis.project.status': 'Projektstatus',
  'analysis.project.description': 'Projektbeschreibung',
  'actors.count': 'Anzahl Akteure',
  'quality.confidence': 'Analyse-Sicherheit',
  'quality.missingContext': 'Fehlender Kontext',
  'nextMove.title': 'Nächster Schritt'
}

// Interface für den Verlaufseintrag im UI
export interface HistoryEntry {
  id: string
  type: 'creation' | 'update'
  timestamp: string
  source: string
  sourceLabel: string
  summary: string
  input?: string
  progressBefore?: number
  progressAfter?: number
  nextMoveBefore?: string
  nextMoveAfter?: string
  changedFields: { field: string; label: string; before?: string; after?: string }[]
}

/**
 * Formatiert ein Datum nutzerfreundlich
 */
export function formatHistoryDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  const timeString = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  
  if (diffDays === 0) {
    return `Heute, ${timeString}`
  } else if (diffDays === 1) {
    return `Gestern, ${timeString}`
  } else if (diffDays < 7) {
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
    return `${weekdays[date.getDay()]}, ${timeString}`
  } else {
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + `, ${timeString}`
  }
}

/**
 * Mapped einen technischen Feldnamen zu einem nutzerfreundlichen Label
 */
export function getFieldLabel(fieldName: string): string {
  return FIELD_NAME_MAPPING[fieldName] || fieldName
}

/**
 * Mapped eine Quelle zu einem nutzerfreundlichen Label
 */
export function getSourceLabel(source: string): string {
  return SOURCE_LABELS[source] || source
}

/**
 * Erzeugt den initialen Erstellungseintrag
 */
export function createCreationEntry(twin: StoredProjectTwin): HistoryEntry {
  const analysis = twin.analysis
  
  return {
    id: `creation-${twin.id}`,
    type: 'creation',
    timestamp: twin.createdAt,
    source: 'creation',
    sourceLabel: 'Project Twin erstellt',
    summary: 'Die Projektlage wurde erstmals analysiert und als Project Twin übernommen.',
    input: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
    progressAfter: twin.progress?.percent ?? 0,
    nextMoveAfter: analysis?.nextMove?.title,
    changedFields: []
  }
}

/**
 * Konvertiert ein Update zu einem HistoryEntry
 */
export function updateToHistoryEntry(update: ProjectTwinUpdate): HistoryEntry {
  return {
    id: update.id,
    type: 'update',
    timestamp: update.createdAt,
    source: update.source,
    sourceLabel: getSourceLabel(update.source),
    summary: update.summary,
    input: update.input,
    progressBefore: update.previousProgressPercent,
    progressAfter: update.newProgressPercent,
    nextMoveBefore: update.previousNextMoveTitle,
    nextMoveAfter: update.newNextMoveTitle,
    changedFields: (update.changedFields || []).map(cf => ({
      field: cf.field,
      label: getFieldLabel(cf.field),
      before: cf.before,
      after: cf.after
    }))
  }
}

/**
 * Erzeugt die komplette History-Liste für einen Twin
 * Neueste Einträge zuerst
 */
export function buildTwinHistory(twin: StoredProjectTwin): HistoryEntry[] {
  const entries: HistoryEntry[] = []
  
  // Initiale Erstellung
  entries.push(createCreationEntry(twin))
  
  // Updates
  if (twin.updates && twin.updates.length > 0) {
    twin.updates.forEach((update: ProjectTwinUpdate) => {
      entries.push(updateToHistoryEntry(update))
    })
  }
  
  // Sortieren: Neueste zuerst
  return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * Berechnet die Anzahl der echten Updates (ohne initiale Erstellung)
 */
export function getRealUpdateCount(twin: StoredProjectTwin): number {
  return twin.updates?.length || 0
}

/**
 * Formatiert den Fortschrittsunterschied
 */
export function formatProgressChange(before?: number, after?: number): string | null {
  if (after === undefined || after === null) return null
  if (before === undefined || before === null) return `${after}%`
  
  const diff = after - before
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : ''
  return `${before}% → ${after}% (${sign}${Math.abs(diff)}%)`
}

/**
 * Prüft ob ein Eintrag veränderte Felder hat
 */
export function hasChangedFields(entry: HistoryEntry): boolean {
  return entry.changedFields.length > 0
}
