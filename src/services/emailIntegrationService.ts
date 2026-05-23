/**
 * OSION Load Pilot - E-Mail-Integration Service
 * Generiert mailto:-Links für Maßnahmen-Sharing
 */

import type { Measure } from '../types/measures'
import type { StoredProjectTwinV2 } from '../types/projectTwinV2'

export interface EmailDraft {
  recipient: string
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
}

/**
 * Generiert einen mailto:-Link aus einem E-Mail-Draft
 */
export function generateEmailDraft(
  recipient: string,
  subject: string,
  body: string
): string {
  const params = new URLSearchParams()

  if (recipient) {
    params.set('to', recipient)
  }
  if (subject) {
    params.set('subject', subject)
  }
  if (body) {
    params.set('body', body)
  }

  const queryString = params.toString()
  return queryString ? `mailto:?${queryString}` : 'mailto:'
}

/**
 * Generiert einen mailto:-Link aus einem EmailDraft-Objekt
 */
export function generateMailtoLink(draft: EmailDraft): string {
  const params = new URLSearchParams()

  if (draft.recipient) {
    params.set('to', draft.recipient)
  }
  if (draft.cc && draft.cc.length > 0) {
    params.set('cc', draft.cc.join(','))
  }
  if (draft.bcc && draft.bcc.length > 0) {
    params.set('bcc', draft.bcc.join(','))
  }
  if (draft.subject) {
    params.set('subject', draft.subject)
  }
  if (draft.body) {
    params.set('body', draft.body)
  }

  const queryString = params.toString()
  return queryString ? `mailto:?${queryString}` : 'mailto:'
}

/**
 * Öffnet den Mail-Client mit dem generierten mailto:-Link
 */
export function openEmailClient(mailtoLink: string): void {
  window.location.href = mailtoLink
}

/**
 * Generiert einen E-Mail-Draft für eine Maßnahme
 */
export function generateMeasureEmailDraft(
  measure: Measure,
  options?: {
    recipient?: string
    includeProjectLink?: boolean
    includeDueDate?: boolean
    customMessage?: string
  }
): EmailDraft {
  const subject = `Maßnahme: ${measure.title}`

  const lines: string[] = [
    `Hallo,`,
    ``,
    `ich teile dir folgende Maßnahme mit:`,
    ``,
    `📋 ${measure.title}`,
  ]

  if (measure.description) {
    lines.push('')
    lines.push('Beschreibung:')
    lines.push(measure.description)
  }

  lines.push('')
  lines.push(`Projekt: ${measure.projectTitle}`)
  lines.push(`Priorität: ${measure.priority.toUpperCase()}`)
  lines.push(`Status: ${measure.status}`)

  if (measure.dueDate && options?.includeDueDate !== false) {
    lines.push(`Fällig bis: ${formatDate(measure.dueDate)}`)
  }

  if (measure.owner) {
    lines.push(`Verantwortlich: ${measure.owner}`)
  }

  if (measure.strategicGoal) {
    lines.push(`Strategisches Ziel: ${measure.strategicGoal}`)
  }

  if (options?.customMessage) {
    lines.push('')
    lines.push('—')
    lines.push(options.customMessage)
  }

  lines.push('')
  lines.push('—')
  lines.push('Gesendet von OSION Load Pilot')

  return {
    recipient: options?.recipient || measure.owner || '',
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Generiert einen E-Mail-Draft für mehrere Maßnahmen (Zusammenfassung)
 */
export function generateMeasuresSummaryEmailDraft(
  measures: Measure[],
  title: string,
  options?: {
    recipient?: string
    customMessage?: string
  }
): EmailDraft {
  const subject = `Maßnahmen-Übersicht: ${title}`

  const lines: string[] = [
    `Hallo,`,
    ``,
    `hier ist die Zusammenfassung der Maßnahmen:`,
    ``,
  ]

  // Gruppiere nach Status
  const grouped = groupMeasuresByStatus(measures)

  Object.entries(grouped).forEach(([status, items]) => {
    if (items.length > 0) {
      lines.push(`${getStatusEmoji(status as Measure['status'])} ${getStatusLabel(status as Measure['status'])} (${items.length})`)
      items.forEach(m => {
        const dueInfo = m.dueDate ? ` (Fällig: ${formatDate(m.dueDate)})` : ''
        lines.push(`  • ${m.title}${dueInfo}`)
      })
      lines.push('')
    }
  })

  if (options?.customMessage) {
    lines.push('—')
    lines.push(options.customMessage)
    lines.push('')
  }

  lines.push('—')
  lines.push('Gesendet von OSION Load Pilot')

  return {
    recipient: options?.recipient || '',
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Generiert einen E-Mail-Draft für einen kompletten Project Twin
 */
export function generateTwinEmailDraft(
  twin: StoredProjectTwinV2,
  options?: {
    recipient?: string
    includeRisks?: boolean
    includeMeasures?: boolean
    customMessage?: string
  }
): EmailDraft {
  const subject = `Project Twin: ${twin.title}`

  const lines: string[] = [
    `Hallo,`,
    ``,
    `ich teile dir den Project Twin mit:`,
    ``,
    `📊 ${twin.title}`,
    ``,
  ]

  if (twin.description) {
    lines.push(twin.description)
    lines.push('')
  }

  // Projekt-Status
  lines.push(`Fortschritt: ${twin.progress.percent}%`)
  lines.push(`Phase: ${getStageLabel(twin.progress.stage)}`)
  lines.push('')

  // Offene Maßnahmen
  if (options?.includeMeasures !== false && twin.measures && twin.measures.length > 0) {
    const openMeasures = twin.measures.filter(m => m.status !== 'done' && m.status !== 'discarded')
    if (openMeasures.length > 0) {
      lines.push(`📋 Offene Maßnahmen (${openMeasures.length}):`)
      openMeasures.slice(0, 10).forEach(m => {
        const priority = m.priority === 'critical' ? '🔴' : m.priority === 'high' ? '🟠' : '⚪'
        lines.push(`${priority} ${m.title}`)
      })
      if (openMeasures.length > 10) {
        lines.push(`... und ${openMeasures.length - 10} weitere`)
      }
      lines.push('')
    }
  }

  // Risiken
  if (options?.includeRisks !== false && twin.analysis?.risks && twin.analysis.risks.length > 0) {
    lines.push(`⚠️ Risiken:`)
    twin.analysis.risks.slice(0, 5).forEach(r => {
      const severity = r.severity === 'high' ? '🟠' : '🟡'
      lines.push(`${severity} ${r.title}`)
    })
    lines.push('')
  }

  if (options?.customMessage) {
    lines.push('—')
    lines.push(options.customMessage)
    lines.push('')
  }

  lines.push('—')
  lines.push('Gesendet von OSION Load Pilot')

  return {
    recipient: options?.recipient || '',
    subject,
    body: lines.join('\n'),
  }
}

/**
 * Kopiert E-Mail-Inhalt in die Zwischenablage
 */
export async function copyEmailToClipboard(draft: EmailDraft): Promise<void> {
  const text = [
    `An: ${draft.recipient}`,
    `Betreff: ${draft.subject}`,
    '',
    draft.body,
  ].join('\n')

  await navigator.clipboard.writeText(text)
}

// Helper-Funktionen

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

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
    if (!grouped[m.status]) {
      grouped[m.status] = []
    }
    grouped[m.status].push(m)
  })

  return grouped
}

function getStatusEmoji(status: Measure['status']): string {
  const map: Record<Measure['status'], string> = {
    idea: '💡',
    open: '📋',
    in_progress: '🔄',
    waiting: '⏳',
    blocked: '🚫',
    done: '✅',
    discarded: '🗑️',
  }
  return map[status] || '⚪'
}

function getStatusLabel(status: Measure['status']): string {
  const map: Record<Measure['status'], string> = {
    idea: 'Idee',
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    waiting: 'Wartend',
    blocked: 'Blockiert',
    done: 'Erledigt',
    discarded: 'Verworfen',
  }
  return map[status] || status
}

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