/**
 * OSION Load Pilot - Slack-Share Service
 * Generiert formatierten Text für Slack-Sharing
 */

import type { StoredProjectTwinV2 } from '../types/projectTwinV2'
import type { Measure } from '../types/measures'
import type { ProjectRisk } from '../types/projectTwin'

export type SlackHighlight = 'measures' | 'risks' | 'summary' | 'next_step'

export interface SlackMessageOptions {
  highlight?: SlackHighlight
  includeDueDates?: boolean
  maxMeasures?: number
  maxRisks?: number
}

/**
 * Generiert formatierten Slack-Text für einen Twin
 */
export function generateSlackMessage(
  twin: StoredProjectTwinV2,
  options?: SlackMessageOptions
): string {
  const highlight = options?.highlight || 'summary'

  switch (highlight) {
    case 'measures':
      return generateMeasuresMessage(twin, options)
    case 'risks':
      return generateRisksMessage(twin, options)
    case 'next_step':
      return generateNextStepMessage(twin)
    case 'summary':
    default:
      return generateSummaryMessage(twin, options)
  }
}

/**
 * Kopiert Slack-Text in die Zwischenablage
 */
export async function copySlackMessage(
  twin: StoredProjectTwinV2,
  options?: SlackMessageOptions
): Promise<void> {
  const message = generateSlackMessage(twin, options)
  await navigator.clipboard.writeText(message)
}

/**
 * Generiert eine Zusammenfassung
 */
function generateSummaryMessage(
  twin: StoredProjectTwinV2,
  options?: SlackMessageOptions
): string {
  const lines: string[] = []

  // Header mit Emoji
  lines.push(`📊 *${twin.title}*`)
  lines.push('')

  // Kurzbeschreibung
  if (twin.description) {
    const shortDesc = twin.description.split('.')[0]
    lines.push(`_${shortDesc}_`)
    lines.push('')
  }

  // Status-Block
  const progressBar = generateProgressBar(twin.progress.percent)
  lines.push(`Fortschritt: ${progressBar} ${twin.progress.percent}%`)
  lines.push(`Phase: ${getStageLabel(twin.progress.stage)}`)
  lines.push('')

  // Maßnahmen-Übersicht
  if (twin.measures && twin.measures.length > 0) {
    const open = twin.measures.filter(m => m.status !== 'done' && m.status !== 'discarded').length
    const done = twin.measures.filter(m => m.status === 'done').length
    const critical = twin.measures.filter(m => m.priority === 'critical' && m.status !== 'done').length

    lines.push(`📋 *Maßnahmen:* ${open} offen (${done} erledigt)`)
    if (critical > 0) {
      lines.push(`:rotating_light: *${critical} kritische Maßnahme${critical > 1 ? 'n' : ''}* braucht Aufmerksamkeit`)
    }
    lines.push('')

    // Top 3 Maßnahmen
    const topMeasures = twin.measures
      .filter(m => m.status !== 'done' && m.status !== 'discarded')
      .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
      .slice(0, options?.maxMeasures || 3)

    if (topMeasures.length > 0) {
      lines.push('*Top-Prioritäten:*')
      topMeasures.forEach(m => {
        const emoji = getPriorityEmoji(m.priority)
        const due = m.dueDate && options?.includeDueDates !== false
          ? ` (Fällig: ${formatSlackDate(m.dueDate)})`
          : ''
        lines.push(`${emoji} ${m.title}${due}`)
      })
      lines.push('')
    }
  }

  // Risiken
  if (twin.analysis?.risks && twin.analysis.risks.length > 0) {
    const highRisks = twin.analysis.risks.filter(r => r.severity === 'high' || r.severity === 'medium')
    if (highRisks.length > 0) {
      lines.push(`⚠️ *Risiken:* ${highRisks.length}`)
      highRisks.slice(0, options?.maxRisks || 2).forEach((r: { title: string }) => {
        lines.push(`• ${r.title}`)
      })
      lines.push('')
    }
  }

  // Nächster Schritt
  if (twin.analysis?.nextMove) {
    lines.push(`🎯 *Nächster Schritt:*`)
    lines.push(`>${twin.analysis.nextMove.title}`)
    lines.push('')
  }

  // Footer
  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}

/**
 * Generiert Nachricht mit Fokus auf Maßnahmen
 */
function generateMeasuresMessage(
  twin: StoredProjectTwinV2,
  options?: SlackMessageOptions
): string {
  const lines: string[] = []

  lines.push(`📋 *Maßnahmen: ${twin.title}*`)
  lines.push('')

  if (!twin.measures || twin.measures.length === 0) {
    lines.push('Keine Maßnahmen vorhanden.')
    return lines.join('\n')
  }

  // Gruppiere nach Status
  const byStatus = groupMeasuresByStatus(twin.measures)

  // Offene Maßnahmen zuerst
  if (byStatus.open.length > 0 || byStatus.in_progress.length > 0 || byStatus.blocked.length > 0) {
    lines.push('*Offen/In Bearbeitung:*')
    lines.push('```')

    const active = [
      ...byStatus.blocked.map(m => ({ ...m, statusFlag: '🚫' })),
      ...byStatus.in_progress.map(m => ({ ...m, statusFlag: '🔄' })),
      ...byStatus.open.map(m => ({ ...m, statusFlag: '⬜' })),
    ]
    .sort((a, b) => priorityScore(b.priority) - priorityScore(a.priority))
    .slice(0, options?.maxMeasures || 10)

    active.forEach(m => {
      const due = m.dueDate ? ` [${formatSlackDate(m.dueDate)}]` : ''
      lines.push(`${m.statusFlag} ${m.title}${due}`)
    })

    lines.push('```')
    lines.push('')
  }

  // Überfällige
  const overdue = twin.measures.filter(m =>
    m.dueDate &&
    m.status !== 'done' &&
    m.status !== 'discarded' &&
    new Date(m.dueDate) < new Date()
  )

  if (overdue.length > 0) {
    lines.push(`:alert: *Überfällig:*`)
    overdue.forEach(m => {
      lines.push(`• ${m.title} (war fällig: ${formatSlackDate(m.dueDate!)})`)
    })
    lines.push('')
  }

  // Erledigte
  if (byStatus.done.length > 0) {
    lines.push(`✅ *Kürzlich erledigt:*`)
    byStatus.done.slice(-3).forEach(m => {
      lines.push(`• ${m.title}`)
    })
    lines.push('')
  }

  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}

/**
 * Generiert Nachricht mit Fokus auf Risiken
 */
function generateRisksMessage(
  twin: StoredProjectTwinV2,
  options?: SlackMessageOptions
): string {
  const lines: string[] = []

  lines.push(`⚠️ *Risiken: ${twin.title}*`)
  lines.push('')

  if (!twin.analysis?.risks || twin.analysis.risks.length === 0) {
    lines.push('Keine Risiken dokumentiert.')
    return lines.join('\n')
  }

  const risks = twin.analysis.risks
    .sort((a, b) => severityScore(b.severity) - severityScore(a.severity))
    .slice(0, options?.maxRisks || 5)

  lines.push('```')
  risks.forEach((r: ProjectRisk) => {
    const emoji = getSeverityEmoji(r.severity)
    lines.push(`${emoji} ${r.title}`)
    if (r.explanation) {
      lines.push(`   ↳ ${r.explanation}`)
    }
  })
  lines.push('```')
  lines.push('')

  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}

/**
 * Generiert Nachricht mit Fokus auf Next Step
 */
function generateNextStepMessage(twin: StoredProjectTwinV2): string {
  const lines: string[] = []

  lines.push(`🎯 *Nächster Schritt: ${twin.title}*`)
  lines.push('')

  if (!twin.analysis?.nextMove) {
    lines.push('Kein nächster Schritt definiert.')
    return lines.join('\n')
  }

  const nextMove = twin.analysis.nextMove

  lines.push(`*${nextMove.title}*`)
  lines.push('')

  if (nextMove.reason) {
    lines.push(nextMove.reason)
    lines.push('')
  }

  lines.push(`*Aufwand:* ${nextMove.effort} | *Impact:* ${nextMove.impact}`)
  if (nextMove.deadline) {
    lines.push(`*Deadline:* ${nextMove.deadline}`)
  }
  lines.push('')

  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}

/**
 * Generiert Progress-Bar für Slack
 */
function generateProgressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return '█'.repeat(filled) + '░'.repeat(empty)
}

/**
 * Formatiert Datum für Slack (kurz)
 */
function formatSlackDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Heute'
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Morgen'
  }

  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
  })
}

/**
 * Konvertiert Priorität in numerischen Score
 */
function priorityScore(priority: Measure['priority']): number {
  const scores: Record<Measure['priority'], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }
  return scores[priority] || 0
}

/**
 * Konvertiert Severity in numerischen Score
 */
function severityScore(severity: string): number {
  const scores: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }
  return scores[severity] || 0
}

/**
 * Gibt Emoji für Priorität
 */
function getPriorityEmoji(priority: Measure['priority']): string {
  const map: Record<Measure['priority'], string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '⚪',
  }
  return map[priority] || '⚪'
}

/**
 * Gibt Emoji für Severity
 */
function getSeverityEmoji(severity: string): string {
  const map: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '⚪',
  }
  return map[severity] || '⚪'
}

/**
 * Label für Stage
 */
function getStageLabel(stage: string): string {
  const map: Record<string, string> = {
    created: 'Erstellt',
    needs_context: 'Kontext erforderlich',
    clarified: 'Geklärt',
    in_progress: 'In Bearbeitung',
    blocked: 'Blockiert',
    decision_ready: 'Entscheidungsreif',
    completed: 'Abgeschlossen',
  }
  return map[stage] || stage
}

/**
 * Gruppiert Maßnahmen nach Status
 */
function groupMeasuresByStatus(measures: Measure[]): Record<Measure['status'], Measure[]> {
  const grouped: Record<string, Measure[]> = {
    idea: [],
    open: [],
    in_progress: [],
    waiting: [],
    blocked: [],
    done: [],
    discarded: [],
  }

  measures.forEach(m => {
    if (!grouped[m.status]) grouped[m.status] = []
    grouped[m.status].push(m)
  })

  return grouped
}

/**
 * Generiert Slack-Text für eine einzelne Maßnahme
 */
export function generateSingleMeasureSlackMessage(measure: Measure): string {
  const lines: string[] = []

  lines.push(`📋 *${measure.title}*`)
  lines.push('')

  if (measure.description) {
    lines.push(measure.description)
    lines.push('')
  }

  lines.push(`*Projekt:* ${measure.projectTitle}`)
  lines.push(`*Priorität:* ${measure.priority}`)
  lines.push(`*Status:* ${measure.status}`)

  if (measure.dueDate) {
    lines.push(`*Fällig:* ${formatSlackDate(measure.dueDate)}`)
  }

  if (measure.owner) {
    lines.push(`*Verantwortlich:* ${measure.owner}`)
  }

  if (measure.strategicGoal) {
    lines.push(`*Strategisches Ziel:* ${measure.strategicGoal}`)
  }

  lines.push('')
  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}

/**
 * Generiert Slack-Status-Update für tägliche Updates
 */
export function generateDailyStatusUpdate(
  twins: StoredProjectTwinV2[]
): string {
  const lines: string[] = []

  lines.push('📊 *Täglicher Projekt-Status*')
  lines.push('')

  if (twins.length === 0) {
    lines.push('Keine aktiven Projekte.')
    return lines.join('\n')
  }

  twins.forEach(twin => {
    const progressBar = generateProgressBar(twin.progress.percent)
    const openMeasures = twin.measures?.filter(m => m.status !== 'done' && m.status !== 'discarded').length || 0
    const critical = twin.measures?.filter(m => m.priority === 'critical' && m.status !== 'done').length || 0

    lines.push(`*${twin.title}*`)
    lines.push(`${progressBar} ${twin.progress.percent}%`)
    lines.push(`${openMeasures} offene Maßnahmen`)
    if (critical > 0) {
      lines.push(`:rotating_light: ${critical} kritisch`)
    }
    lines.push('')
  })

  lines.push('— _OSION Load Pilot_')

  return lines.join('\n')
}