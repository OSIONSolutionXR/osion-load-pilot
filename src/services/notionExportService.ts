/**
 * OSION Load Pilot - Notion-Export Service
 * Generiert JSON für Notion Import (CSV/Markdown kompatibel)
 */

import type { StoredProjectTwinV2 } from '../types/projectTwinV2'
import type { Measure } from '../types/measures'

export interface NotionPage {
  object: 'page'
  parent: {
    database_id?: string
    page_id?: string
  }
  properties: Record<string, NotionProperty>
  children?: NotionBlock[]
}

export type NotionProperty =
  | { title: Array<{ text: { content: string } }> }
  | { rich_text: Array<{ text: { content: string } }> }
  | { select: { name: string } }
  | { multi_select: Array<{ name: string }> }
  | { date?: { start: string; end?: string } }
  | { checkbox: boolean }
  | { number?: number }
  | { url: string | null }
  | { email: string | null }

export interface NotionBlock {
  object: 'block'
  type: string
  [key: string]: unknown
}

export interface NotionDatabase {
  object: 'database'
  title: Array<{ text: { content: string } }>
  properties: Record<string, unknown>
}

export interface NotionImportData {
  projectPage: NotionPage
  measuresDatabase: NotionDatabase
  measures: NotionPage[]
  risksDatabase?: NotionDatabase
  risks?: NotionPage[]
}

/**
 * Generiert Notion-kompatibles JSON für Twin-Import
 */
export function generateNotionImportJSON(
  twin: StoredProjectTwinV2
): NotionImportData {
  const projectPage = createProjectPage(twin)
  const measuresDb = createMeasuresDatabase(twin.title)
  const measures = twin.measures?.map(m => createMeasurePage(m, twin.id)) || []

  let risksDb: NotionDatabase | undefined
  let risks: NotionPage[] | undefined

  if (twin.analysis?.risks && twin.analysis.risks.length > 0) {
    risksDb = createRisksDatabase(twin.title)
    risks = twin.analysis.risks.map((r, index) =>
      createRiskPage(r, twin.id, index)
    )
  }

  return {
    projectPage,
    measuresDatabase: measuresDb,
    measures,
    risksDatabase: risksDb,
    risks,
  }
}

/**
 * Exportiert Maßnahmen als CSV für Notion-Import
 */
export function exportMeasuresToCSV(measures: Measure[]): string {
  const headers = [
    'Name',
    'Status',
    'Priorität',
    'Projekt',
    'Fällig am',
    'Verantwortlich',
    'Beschreibung',
    'Tags',
  ]

  const rows = measures.map(m => [
    escapeCSV(m.title),
    m.status,
    m.priority,
    escapeCSV(m.projectTitle),
    m.dueDate || '',
    m.owner || '',
    escapeCSV(m.description || ''),
    (m.tags || []).join(', '),
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Exportiert als Notion-kompatibles Markdown
 */
export function exportToNotionMarkdown(twin: StoredProjectTwinV2): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${twin.title}`)
  lines.push('')

  if (twin.description) {
    lines.push(twin.description)
    lines.push('')
  }

  // Meta
  lines.push('## 📊 Projekt-Status')
  lines.push('')
  lines.push(`- **Fortschritt:** ${twin.progress.percent}%`)
  lines.push(`- **Phase:** ${twin.progress.stage}`)
  lines.push(`- **Letztes Update:** ${formatDate(twin.updatedAt)}`)
  lines.push('')

  // Maßnahmen als To-Do-Liste
  if (twin.measures && twin.measures.length > 0) {
    lines.push('## 📋 Maßnahmen')
    lines.push('')

    const byStatus = groupMeasuresByStatus(twin.measures)

    Object.entries(byStatus).forEach(([status, items]) => {
      if (items.length > 0) {
        lines.push(`### ${getStatusEmoji(status as Measure['status'])} ${getStatusLabel(status as Measure['status'])}`)
        lines.push('')
        items.forEach(m => {
          const done = m.status === 'done' ? 'x' : ' '
          const due = m.dueDate ? ` (Fällig: ${formatDate(m.dueDate)})` : ''
          lines.push(`- [${done}] ${m.title}${due}`)
          if (m.description) {
            lines.push(`  > ${m.description.split('\n')[0]}`)
          }
        })
        lines.push('')
      }
    })
  }

  // Risiken als Tabelle
  if (twin.analysis?.risks && twin.analysis.risks.length > 0) {
    lines.push('## ⚠️ Risiken')
    lines.push('')
    lines.push('| Risiko | Schwere |')
    lines.push('|--------|---------|')

    twin.analysis.risks.forEach(r => {
      const severity = r.severity === 'high' ? '🟠 Hoch' :
                       r.severity === 'medium' ? '🟡 Mittel' : '⚪ Niedrig'
      lines.push(`| ${r.title} | ${severity} |`)
    })
    lines.push('')
  }

  // Nächster Schritt
  if (twin.analysis?.nextMove) {
    lines.push('## 🎯 Nächster Schritt')
    lines.push('')
    lines.push(twin.analysis.nextMove.title)
    if (twin.analysis.nextMove.reason) {
      lines.push('')
      lines.push(`*${twin.analysis.nextMove.reason}*`)
    }
    lines.push('')
  }

  // Kontextfragen
  if (twin.contextQuestions && twin.contextQuestions.length > 0) {
    const open = twin.contextQuestions.filter(q => q.status === 'open')
    if (open.length > 0) {
      lines.push('## ❓ Offene Fragen')
      lines.push('')
      open.forEach(q => {
        lines.push(`- [ ] ${q.question}`)
      })
      lines.push('')
    }
  }

  lines.push('---')
  lines.push('*Exportiert aus OSION Load Pilot*')

  return lines.join('\n')
}

/**
 * Erstellt einen Download für Markdown
 */
export function downloadNotionMarkdown(twin: StoredProjectTwinV2): void {
  const content = exportToNotionMarkdown(twin)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${sanitizeFilename(twin.title)}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Erstellt einen Download für CSV
 */
export function downloadMeasuresCSV(measures: Measure[], projectTitle: string): void {
  const content = exportMeasuresToCSV(measures)
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `maßnahmen-${sanitizeFilename(projectTitle)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Private Helper

function createProjectPage(twin: StoredProjectTwinV2): NotionPage {
  return {
    object: 'page',
    parent: {}, // Wird vom User beim Import gesetzt
    properties: {
      title: {
        title: [{ text: { content: twin.title } }],
      },
      Status: {
        select: { name: twin.progress.stage },
      },
      Fortschritt: {
        number: twin.progress.percent,
      },
      'Letztes Update': {
        date: { start: twin.updatedAt.split('T')[0] },
      },
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: twin.description || '' } }],
        },
      },
      {
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: '📋 Maßnahmen' } }],
        },
      },
      // Maßnahmen-Liste als To-Do
      ...(twin.measures?.map(m => ({
        object: 'block' as const,
        type: 'to_do' as const,
        to_do: {
          rich_text: [{ text: { content: m.title } }],
          checked: m.status === 'done',
        },
      })) || []),
    ],
  }
}

function createMeasuresDatabase(projectTitle: string): NotionDatabase {
  return {
    object: 'database',
    title: [{ text: { content: `${projectTitle} - Maßnahmen` } }],
    properties: {
      Name: { title: {} },
      Status: {
        select: {
          options: [
            { name: 'Idee', color: 'yellow' },
            { name: 'Offen', color: 'gray' },
            { name: 'In Bearbeitung', color: 'blue' },
            { name: 'Wartend', color: 'orange' },
            { name: 'Blockiert', color: 'red' },
            { name: 'Erledigt', color: 'green' },
          ],
        },
      },
      Priorität: {
        select: {
          options: [
            { name: 'Kritisch', color: 'red' },
            { name: 'Hoch', color: 'orange' },
            { name: 'Mittel', color: 'yellow' },
            { name: 'Niedrig', color: 'gray' },
          ],
        },
      },
      'Fällig am': { date: {} },
      Verantwortlich: { rich_text: {} },
      Projekt: { rich_text: {} },
      Tags: { multi_select: {} },
    },
  }
}

function createMeasurePage(measure: Measure, _projectId: string): NotionPage {
  return {
    object: 'page',
    parent: { database_id: '' }, // Wird beim Import gesetzt
    properties: {
      Name: {
        title: [{ text: { content: measure.title } }],
      },
      Status: {
        select: { name: getStatusLabel(measure.status) },
      },
      Priorität: {
        select: { name: getPriorityLabel(measure.priority) },
      },
      'Fällig am': measure.dueDate
        ? { date: { start: measure.dueDate } }
        : { date: { start: new Date().toISOString().split('T')[0] } },
      Verantwortlich: {
        rich_text: [{ text: { content: measure.owner || '' } }],
      },
      Projekt: {
        rich_text: [{ text: { content: measure.projectTitle } }],
      },
      Tags: {
        multi_select: (measure.tags || []).map(tag => ({ name: tag })),
      },
    },
    children: measure.description
      ? [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: measure.description } }],
            },
          },
        ]
      : undefined,
  }
}

function createRisksDatabase(projectTitle: string): NotionDatabase {
  return {
    object: 'database',
    title: [{ text: { content: `${projectTitle} - Risiken` } }],
    properties: {
      Name: { title: {} },
      Schwere: {
        select: {
          options: [
            { name: 'Kritisch', color: 'red' },
            { name: 'Hoch', color: 'orange' },
            { name: 'Mittel', color: 'yellow' },
            { name: 'Niedrig', color: 'gray' },
          ],
        },
      },
      Wahrscheinlichkeit: { number: { format: 'percent' } },
      Mitigation: { rich_text: {} },
      Status: {
        select: {
          options: [
            { name: 'Aktiv', color: 'red' },
            { name: 'Gemildert', color: 'yellow' },
            { name: 'Behoben', color: 'green' },
          ],
        },
      },
    },
  }
}

function createRiskPage(
  risk: { title: string; severity: string; probability?: number; mitigation?: string },
  _projectId: string,
  _index: number
): NotionPage {
  return {
    object: 'page',
    parent: { database_id: '' },
    properties: {
      Name: {
        title: [{ text: { content: risk.title } }],
      },
      Schwere: {
        select: { name: capitalize(risk.severity) },
      },
      Wahrscheinlichkeit: risk.probability
        ? { number: risk.probability }
        : { number: 0 },
      Mitigation: {
        rich_text: [{ text: { content: risk.mitigation || '' } }],
      },
      Status: {
        select: { name: 'Aktiv' },
      },
    },
  }
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
    if (!grouped[m.status]) grouped[m.status] = []
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

function getPriorityLabel(priority: Measure['priority']): string {
  const map: Record<Measure['priority'], string> = {
    critical: 'Kritisch',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig',
  }
  return map[priority] || priority
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function escapeCSV(str: string): string {
  if (!str) return ''
  // Wenn Komma, Anführungszeichen oder Zeilenumbruch vorhanden
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}