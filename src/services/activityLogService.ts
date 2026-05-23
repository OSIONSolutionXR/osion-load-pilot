/**
 * Activity Log Service
 * 
 * Zentrale Verwaltung des Project Twin Activity Logs
 * - Loggt alle relevanten Aktivitäten
 * - Bietet Filter- und Abfragefunktionen
 */

import type {
  StoredProjectTwinV2,
  ActivityLogEntry,
  ActivityLogType,
  ActivityLogActor
} from '../types/projectTwinV2'

// ============================================================================
// ACTIVITY LOG OPERATIONS
// ============================================================================

/**
 * Erzeugt eine eindeutige ID für einen Log-Eintrag
 */
function generateLogId(): string {
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Fügt einen neuen Activity-Log-Eintrag hinzu
 * Gibt den aktualisierten Twin zurück
 */
export function logActivity(
  twin: StoredProjectTwinV2,
  entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>
): StoredProjectTwinV2 {
  const newEntry: ActivityLogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    type: entry.type,
    actor: entry.actor,
    description: entry.description,
    details: entry.details,
    relatedEntityId: entry.relatedEntityId
  }

  return {
    ...twin,
    updatedAt: new Date().toISOString(),
    activityLog: [...(twin.activityLog || []), newEntry]
  }
}

/**
 * Holt alle Activity-Log-Einträge eines Twins
 * Optional gefiltert nach Typ und/oder Zeitpunkt
 */
export function getActivityLog(
  twin: StoredProjectTwinV2,
  filters?: { type?: ActivityLogType[], since?: Date, limit?: number }
): ActivityLogEntry[] {
  let logs = twin.activityLog || []

  // Filter nach Typ
  if (filters?.type && filters.type.length > 0) {
    logs = logs.filter(entry => filters.type!.includes(entry.type))
  }

  // Filter nach Zeitpunkt (seit...)
  if (filters?.since) {
    const sinceTimestamp = filters.since.toISOString()
    logs = logs.filter(entry => entry.timestamp >= sinceTimestamp)
  }

  // Sortiere nach Zeitstempel (neueste zuerst)
  logs = logs.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )

  // Limit anwenden
  if (filters?.limit && filters.limit > 0) {
    logs = logs.slice(0, filters.limit)
  }

  return logs
}

// ============================================================================
// CONVENIENCE LOGGERS
// ============================================================================

/**
 * Loggt die Projekterstellung
 */
export function logProjectCreated(
  twin: StoredProjectTwinV2,
  source: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'project_created',
    actor: 'user',
    description: `Projekt "${twin.title}" erstellt`,
    details: { source, inputLength: twin.originalInput?.length }
  })
}

/**
 * Loggt eine beantwortete Kontextfrage
 */
export function logContextAnswered(
  twin: StoredProjectTwinV2,
  questionId: string,
  questionLabel: string,
  answer: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'context_answered',
    actor: 'user',
    description: `Kontextfrage beantwortet: "${questionLabel}"`,
    details: { questionLabel, answerPreview: answer.slice(0, 100) },
    relatedEntityId: questionId
  })
}

/**
 * Loggt eine übersprungene Kontextfrage
 */
export function logQuestionSkipped(
  twin: StoredProjectTwinV2,
  questionId: string,
  questionLabel: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'question_skipped',
    actor: 'user',
    description: `Kontextfrage übersprungen: "${questionLabel}"`,
    relatedEntityId: questionId
  })
}

/**
 * Loggt das Hinzufügen einer Maßnahme
 */
export function logMeasureAdded(
  twin: StoredProjectTwinV2,
  measureId: string,
  measureTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'measure_added',
    actor: 'user',
    description: `Maßnahme hinzugefügt: "${measureTitle}"`,
    relatedEntityId: measureId
  })
}

/**
 * Loggt die Aktualisierung einer Maßnahme
 */
export function logMeasureUpdated(
  twin: StoredProjectTwinV2,
  measureId: string,
  measureTitle: string,
  changes: Record<string, unknown>
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'measure_updated',
    actor: 'user',
    description: `Maßnahme aktualisiert: "${measureTitle}"`,
    details: { changes },
    relatedEntityId: measureId
  })
}

/**
 * Loggt das Abschließen einer Maßnahme
 */
export function logMeasureCompleted(
  twin: StoredProjectTwinV2,
  measureId: string,
  measureTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'measure_completed',
    actor: 'user',
    description: `Maßnahme abgeschlossen: "${measureTitle}"`,
    details: { completedAt: new Date().toISOString() },
    relatedEntityId: measureId
  })
}

/**
 * Loggt das Löschen einer Maßnahme
 */
export function logMeasureDeleted(
  twin: StoredProjectTwinV2,
  measureId: string,
  measureTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'measure_deleted',
    actor: 'user',
    description: `Maßnahme gelöscht: "${measureTitle}"`,
    relatedEntityId: measureId
  })
}

/**
 * Loggt eine Simulation
 */
export function logScenarioRun(
  twin: StoredProjectTwinV2,
  scenarioId: string,
  scenarioName: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'scenario_run',
    actor: 'user',
    description: `Simulation gestartet: "${scenarioName}"`,
    relatedEntityId: scenarioId
  })
}

/**
 * Loggt einen abgeschlossenen Szenario-Durchlauf
 */
export function logScenarioCompleted(
  twin: StoredProjectTwinV2,
  scenarioId: string,
  scenarioName: string,
  outcome: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'scenario_completed',
    actor: 'system',
    description: `Simulation abgeschlossen: "${scenarioName}" - Ergebnis: ${outcome}`,
    details: { outcome },
    relatedEntityId: scenarioId
  })
}

/**
 * Loggt eine generierte Queue-Aktion
 */
export function logQueueActionGenerated(
  twin: StoredProjectTwinV2,
  actionId: string,
  actionType: string,
  actionTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'queue_action_generated',
    actor: 'ai',
    description: `KI-Aktion generiert: "${actionTitle}" (${actionType})`,
    details: { actionType },
    relatedEntityId: actionId
  })
}

/**
 * Loggt ein Twin-Update
 */
export function logTwinUpdated(
  twin: StoredProjectTwinV2,
  source: string,
  summary: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'twin_updated',
    actor: source === 'ai' ? 'ai' : 'user',
    description: summary,
    details: { source }
  })
}

/**
 * Loggt ein abgeschlossenes Future Simulation
 */
export function logSimulationCompleted(
  twin: StoredProjectTwinV2,
  simulationId: string,
  mode: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'simulation_completed',
    actor: 'ai',
    description: `Zukunftssimulation abgeschlossen (${mode})`,
    details: { mode, simulationId },
    relatedEntityId: simulationId
  })
}

/**
 * Loggt einen Fortschritts-Update
 */
export function logProgressUpdated(
  twin: StoredProjectTwinV2,
  oldPercent: number,
  newPercent: number,
  reason: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'progress_updated',
    actor: 'system',
    description: `Fortschritt aktualisiert: ${oldPercent}% → ${newPercent}%`,
    details: { oldPercent, newPercent, reason }
  })
}

/**
 * Loggt eine generierte Lösung
 */
export function logSolutionGenerated(
  twin: StoredProjectTwinV2,
  solutionId: string,
  solutionType: string,
  actionTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'solution_generated',
    actor: 'ai',
    description: `Lösungsvorschlag generiert für "${actionTitle}"`,
    details: { solutionType },
    relatedEntityId: solutionId
  })
}

/**
 * Loggt die Verwendung einer Lösung
 */
export function logSolutionUsed(
  twin: StoredProjectTwinV2,
  solutionId: string,
  solutionTitle: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'solution_used',
    actor: 'user',
    description: `Lösung verwendet: "${solutionTitle}"`,
    relatedEntityId: solutionId
  })
}

/**
 * Loggt eine Chat-Nachricht
 */
export function logChatMessage(
  twin: StoredProjectTwinV2,
  messageId: string,
  role: 'user' | 'assistant',
  preview: string
): StoredProjectTwinV2 {
  return logActivity(twin, {
    type: 'chat_message',
    actor: role === 'user' ? 'user' : 'ai',
    description: `Chat: ${role === 'user' ? 'Nachricht gesendet' : 'Antwort erhalten'}`,
    details: { preview: preview.slice(0, 100) },
    relatedEntityId: messageId
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Formatiert einen Zeitstempel relativ ("vor 5 Minuten", "Gestern", etc.)
 */
export function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'gerade eben'
  if (diffMins < 60) return `vor ${diffMins} Minute${diffMins > 1 ? 'n' : ''}`
  if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours > 1 ? 'n' : ''}`
  if (diffDays === 1) return 'Gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Woche${Math.floor(diffDays / 7) > 1 ? 'n' : ''}`
  
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * Gruppiert Log-Einträge nach Zeitperioden
 */
export function groupActivityLogByPeriod(
  entries: ActivityLogEntry[]
): { period: string; entries: ActivityLogEntry[] }[] {
  const groups: Record<string, ActivityLogEntry[]> = {
    'Heute': [],
    'Gestern': [],
    'Diese Woche': [],
    'Älter': []
  }

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  entries.forEach(entry => {
    const entryDate = new Date(entry.timestamp)
    const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate())

    if (entryDay.getTime() === today.getTime()) {
      groups['Heute'].push(entry)
    } else if (entryDay.getTime() === yesterday.getTime()) {
      groups['Gestern'].push(entry)
    } else if (entryDate > weekAgo) {
      groups['Diese Woche'].push(entry)
    } else {
      groups['Älter'].push(entry)
    }
  })

  return Object.entries(groups)
    .filter(([_, entries]) => entries.length > 0)
    .map(([period, entries]) => ({ period, entries }))
}

/**
 * Gibt ein Icon für einen Activity-Typ zurück
 */
export function getActivityIcon(type: ActivityLogType): string {
  const icons: Record<ActivityLogType, string> = {
    'project_created': '🆕',
    'context_answered': '✅',
    'question_skipped': '⏭️',
    'measure_added': '➕',
    'measure_updated': '✏️',
    'measure_completed': '🏁',
    'measure_deleted': '🗑️',
    'scenario_run': '▶️',
    'scenario_completed': '📊',
    'queue_action_generated': '🤖',
    'twin_updated': '📝',
    'simulation_completed': '🔮',
    'progress_updated': '📈',
    'solution_generated': '💡',
    'solution_used': '✨',
    'chat_message': '💬'
  }
  return icons[type] || '📌'
}

/**
 * Gibt eine Farbe für einen Actor zurück
 */
export function getActorColor(actor: ActivityLogActor): string {
  const colors: Record<ActivityLogActor, string> = {
    'user': 'bg-blue-100 text-blue-800',
    'system': 'bg-gray-100 text-gray-800',
    'ai': 'bg-purple-100 text-purple-800'
  }
  return colors[actor]
}

/**
 * Gibt einen deutschen Label für einen Activity-Typ zurück
 */
export function getActivityTypeLabel(type: ActivityLogType): string {
  const labels: Record<ActivityLogType, string> = {
    'project_created': 'Projekterstellung',
    'context_answered': 'Kontext beantwortet',
    'question_skipped': 'Frage übersprungen',
    'measure_added': 'Maßnahme hinzugefügt',
    'measure_updated': 'Maßnahme aktualisiert',
    'measure_completed': 'Maßnahme abgeschlossen',
    'measure_deleted': 'Maßnahme gelöscht',
    'scenario_run': 'Simulation gestartet',
    'scenario_completed': 'Simulation abgeschlossen',
    'queue_action_generated': 'KI-Aktion generiert',
    'twin_updated': 'Twin aktualisiert',
    'simulation_completed': 'Zukunftssimulation',
    'progress_updated': 'Fortschritt aktualisiert',
    'solution_generated': 'Lösung generiert',
    'solution_used': 'Lösung verwendet',
    'chat_message': 'Chat-Nachricht'
  }
  return labels[type] || type
}
