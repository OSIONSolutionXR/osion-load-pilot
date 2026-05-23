/**
 * OSION Load Pilot - Measures Normalization
 * 
 * Maßnahmen aus Twin-Daten tolerant ableiten und normalisieren
 */

import type { Measure, MeasureStatus, MeasurePriority, DueDateCategory } from '../types/measures'
import type { StoredProjectTwinV2 } from '../types/projectTwinV2'

/**
 * Generiert eine eindeutige Measure-ID
 */
function generateMeasureId(projectId: string, index: number, suffix?: string): string {
  return `M-${projectId.slice(-8)}-${index.toString().padStart(3, '0')}${suffix ? `-${suffix}` : ''}`
}

/**
 * Normalisiert Twin-Actions zu Measures
 */
function normalizeActionsToMeasures(twin: StoredProjectTwinV2): Measure[] {
  if (!twin.analysis?.actions || twin.analysis.actions.length === 0) {
    return []
  }

  return twin.analysis.actions.map((action, index) => ({
    id: generateMeasureId(twin.id, index, 'action'),
    projectId: twin.id,
    projectTitle: twin.title,
    parentId: null,
    title: action.title,
    description: action.messageDraft || undefined,
    status: mapPriorityToStatus(action.priority),
    priority: mapActionPriorityToMeasurePriority(action.priority),
    dueDate: null,
    createdAt: twin.createdAt,
    owner: action.owner || 'Unassigned',
    valueScore: action.priority === 'high' ? 9 : action.priority === 'medium' ? 6 : 3,
    strategicGoal: twin.analysis?.project?.type || 'Project Goal',
    notes: '',
    linkedProcessStepId: undefined,
    tags: [action.priority],
    source: 'twin_action' as const
  }))
}

/**
 * Mappt Action-Priorität zu Measure-Status
 */
function mapPriorityToStatus(priority: string): MeasureStatus {
  switch (priority) {
    case 'high': return 'open'
    case 'medium': return 'open'
    case 'low': return 'idea'
    default: return 'open'
  }
}

/**
 * Mappt Action-Priorität zu Measure-Priorität
 */
function mapActionPriorityToMeasurePriority(priority: string): MeasurePriority {
  switch (priority) {
    case 'high': return 'high'
    case 'medium': return 'medium'
    case 'low': return 'low'
    default: return 'medium'
  }
}

/**
 * Erstellt Measures aus dem Next Move
 */
function normalizeNextMoveToMeasure(twin: StoredProjectTwinV2): Measure[] {
  if (!twin.analysis?.nextMove?.title) {
    return []
  }

  const nextMove = twin.analysis.nextMove
  
  return [{
    id: generateMeasureId(twin.id, 0, 'next'),
    projectId: twin.id,
    projectTitle: twin.title,
    parentId: null,
    title: nextMove.title,
    description: nextMove.reason,
    status: 'open',
    priority: nextMove.impact === 'high' ? 'critical' : nextMove.impact === 'medium' ? 'high' : 'medium',
    dueDate: nextMove.deadline,
    createdAt: twin.createdAt,
    owner: 'Unassigned',
    valueScore: nextMove.impact === 'high' ? 10 : nextMove.impact === 'medium' ? 7 : 4,
    strategicGoal: twin.analysis?.project?.type || 'Project Goal',
    notes: `Aufwand: ${nextMove.effort}`,
    linkedProcessStepId: undefined,
    tags: ['next-best-action', nextMove.effort, nextMove.impact],
    source: 'twin_nextStep' as const
  }]
}

/**
 * Extrahiert Measures aus verschiedenen Twin-Datenquellen
 */
export function extractMeasuresFromTwin(twin: StoredProjectTwinV2): Measure[] {
  const measures: Measure[] = []

  // Aus Actions
  const actionMeasures = normalizeActionsToMeasures(twin)
  measures.push(...actionMeasures)

  // Aus Next Move (falls nicht bereits als Action vorhanden)
  const nextMoveMeasures = normalizeNextMoveToMeasure(twin)
  const existingTitles = new Set(actionMeasures.map(m => m.title.toLowerCase()))
  const uniqueNextMoveMeasures = nextMoveMeasures.filter(m => 
    !existingTitles.has(m.title.toLowerCase())
  )
  measures.push(...uniqueNextMoveMeasures)

  // Aus Dependencies (Blocker werden als blocked Measures)
  if (twin.analysis?.dependencies) {
    const blockerMeasures = twin.analysis.dependencies
      .filter(dep => dep.isBlocker || dep.status === 'blocked')
      .map((dep, index) => ({
        id: generateMeasureId(twin.id, index, 'blocker'),
        projectId: twin.id,
        projectTitle: twin.title,
        parentId: null,
        title: `Blocker auflösen: ${dep.from}`,
        description: dep.explanation,
        status: 'blocked' as MeasureStatus,
        priority: 'critical' as MeasurePriority,
        dueDate: null,
        createdAt: twin.createdAt,
        owner: 'Unassigned',
        valueScore: 10,
        strategicGoal: twin.analysis?.project?.type || 'Project Goal',
        notes: `Abhängigkeit zu: ${dep.to}`,
        linkedProcessStepId: undefined,
        tags: ['blocker', 'dependency'],
        source: 'twin_recommended' as const
      }))
    measures.push(...blockerMeasures)
  }

  return measures
}

/**
 * Normalisiert Measures aus allen Projekten
 */
export function normalizeMeasures(projects: StoredProjectTwinV2[]): Measure[] {
  if (!projects || projects.length === 0) {
    return []
  }

  const allMeasures: Measure[] = []

  for (const project of projects) {
    const projectMeasures = extractMeasuresFromTwin(project)
    allMeasures.push(...projectMeasures)
  }

  // Deduplizieren basierend auf Titel + Projekt
  const seen = new Set<string>()
  const uniqueMeasures = allMeasures.filter(measure => {
    const key = `${measure.projectId}-${measure.title.toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })

  console.log('[Measures] Normalized', {
    projects: projects.length,
    totalMeasures: allMeasures.length,
    uniqueMeasures: uniqueMeasures.length
  })

  return uniqueMeasures
}

/**
 * Berechnet die Frist-Kategorie
 */
export function calculateDueDateCategory(dueDate: string | null | undefined): DueDateCategory {
  if (!dueDate) {
    return 'no_due_date'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 7) return 'next_7_days'
  return 'later'
}

/**
 * Berechnet Measure-Statistiken
 */
export function calculateMeasureStats(measures: Measure[]): {
  critical: number
  high: number
  medium: number
  low: number
  open: number
  inProgress: number
  waiting: number
  blocked: number
  done: number
  overdue: number
  today: number
  next7Days: number
} {
  const stats = {
    critical: 0, high: 0, medium: 0, low: 0,
    open: 0, inProgress: 0, waiting: 0, blocked: 0, done: 0,
    overdue: 0, today: 0, next7Days: 0
  }

  for (const measure of measures) {
    // Priorität
    if (measure.priority === 'critical') stats.critical++
    else if (measure.priority === 'high') stats.high++
    else if (measure.priority === 'medium') stats.medium++
    else if (measure.priority === 'low') stats.low++

    // Status
    if (measure.status === 'open') stats.open++
    else if (measure.status === 'in_progress') stats.inProgress++
    else if (measure.status === 'waiting') stats.waiting++
    else if (measure.status === 'blocked') stats.blocked++
    else if (measure.status === 'done') stats.done++

    // Frist
    const dueCategory = calculateDueDateCategory(measure.dueDate)
    if (dueCategory === 'overdue') stats.overdue++
    else if (dueCategory === 'today') stats.today++
    else if (dueCategory === 'next_7_days') stats.next7Days++
  }

  return stats
}

/**
 * Sortiert Measures nach Priorität
 */
export function sortMeasuresByPriority(measures: Measure[]): Measure[] {
  const priorityOrder: Record<MeasurePriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3
  }

  const statusOrder: Record<MeasureStatus, number> = {
    blocked: 0,
    open: 1,
    in_progress: 2,
    waiting: 3,
    idea: 4,
    done: 5,
    discarded: 6
  }

  return [...measures].sort((a, b) => {
    // Zuerst nach Status (blockierte/zu erledigende zuerst)
    const statusDiff = statusOrder[a.status] - statusOrder[b.status]
    if (statusDiff !== 0) return statusDiff

    // Dann nach Priorität
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
    if (priorityDiff !== 0) return priorityDiff

    // Dann nach Frist (frühere zuerst)
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    if (a.dueDate) return -1
    if (b.dueDate) return 1

    // Dann nach Value Score
    return (b.valueScore || 0) - (a.valueScore || 0)
  })
}

/**
 * Filtert Measures
 */
export function filterMeasures(
  measures: Measure[],
  filters: {
    priority?: MeasurePriority[]
    status?: MeasureStatus[]
    dueCategory?: DueDateCategory[]
    projectId?: string[]
  }
): Measure[] {
  return measures.filter(measure => {
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(measure.priority)) {
      return false
    }
    if (filters.status && filters.status.length > 0 && !filters.status.includes(measure.status)) {
      return false
    }
    if (filters.projectId && filters.projectId.length > 0 && !filters.projectId.includes(measure.projectId)) {
      return false
    }
    if (filters.dueCategory && filters.dueCategory.length > 0) {
      const measureDueCategory = calculateDueDateCategory(measure.dueDate)
      if (!filters.dueCategory.includes(measureDueCategory)) {
        return false
      }
    }
    return true
  })
}

/**
 * Findet Projekte mit Blockern
 */
export function findProjectsWithBlockers(projects: StoredProjectTwinV2[]): string[] {
  return projects
    .filter(p => 
      p.analysis?.project?.status === 'blocked' ||
      p.analysis?.dependencies?.some(d => d.isBlocker)
    )
    .map(p => p.id)
}

/**
 * Findet Projekte die ein Update brauchen
 */
export function findProjectsNeedingUpdate(projects: StoredProjectTwinV2[]): string[] {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000
  const now = Date.now()

  return projects
    .filter(p => {
      // Kein Update seit 7 Tagen
      const lastUpdate = new Date(p.updatedAt).getTime()
      if (now - lastUpdate > SEVEN_DAYS) return true

      // Offene Kontextfragen
      if (p.contextQuestions?.some(q => q.status === 'open')) return true

      // Blockierte Dependencies
      if (p.analysis?.dependencies?.some(d => d.isBlocker)) return true

      return false
    })
    .map(p => p.id)
}

/**
 * Formatiert die verbleibenden Tage bis zur Frist
 */
export function formatDaysUntilDue(dueDate: string | null | undefined): string {
  if (!dueDate) return 'Keine Frist'

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `Überfällig: ${Math.abs(diffDays)} Tage`
  if (diffDays === 0) return 'Heute fällig'
  if (diffDays === 1) return 'Morgen'
  if (diffDays <= 7) return `Noch ${diffDays} Tage`
  return `In ${diffDays} Tagen`
}
