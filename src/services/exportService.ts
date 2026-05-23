/**
 * OSION Load Pilot - Export Service
 * PDF, JSON, Markdown Export und Share-Link Generierung
 */

import type { StoredProjectTwinV2 } from '../types/projectTwinV2'
import type { Measure } from '../types/measures'
import type { SimulationRun } from '../types/simulation'
import type { ProjectRisk } from '../types/projectTwin'

// jsPDF wird dynamisch importiert (nur im Browser)
let jsPDFModule: typeof import('jspdf').default | null = null
let autoTableModule: typeof import('jspdf-autotable').default | null = null

async function loadJsPDF() {
  if (!jsPDFModule) {
    const mod = await import('jspdf')
    jsPDFModule = mod.jsPDF || mod.default
  }
  return jsPDFModule
}

async function loadAutoTable() {
  if (!autoTableModule) {
    const mod = await import('jspdf-autotable')
    autoTableModule = mod.default
  }
  return autoTableModule
}

// ============================================================================
// EXPORT OPTIONS & INTERFACE
// ============================================================================

export interface ExportOptions {
  format: 'pdf' | 'json' | 'markdown'
  sections: ('summary' | 'measures' | 'scenarios' | 'risks' | 'activity')[]
  includeAIActions?: boolean
}

export interface ExportResult {
  content: string
  filename: string
  mimeType: string
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generiert einen Projektbericht basierend auf den Optionen
 */
export async function generateProjectReport(
  twin: StoredProjectTwinV2,
  options: ExportOptions
): Promise<ExportResult> {
  switch (options.format) {
    case 'pdf':
      return generatePDF(twin, options)
    case 'json':
      return generateJSON(twin, options)
    case 'markdown':
      return generateMarkdown(twin, options)
    default:
      throw new Error(`Unsupported format: ${options.format}`)
  }
}

/**
 * Generiert einen Share-Link für ein Project Twin
 * Verwendet Base64-kodierte Daten im URL-Hash
 */
export async function generateShareLink(twin: StoredProjectTwinV2): Promise<string> {
  // Minimaler Twin für Sharing
  const shareableTwin = createShareableTwin(twin)
  
  // Base64-kodiert (URL-safe)
  const jsonString = JSON.stringify(shareableTwin)
  const base64 = btoa(jsonString)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  
  // Lokale URL mit Hash
  const baseUrl = window.location.origin + window.location.pathname
  return `${baseUrl}#share=${base64}`
}

/**
 * Parst einen Share-Link und gibt das Project Twin zurück
 */
export function parseShareLink(url: string): Partial<StoredProjectTwinV2> | null {
  try {
    const hash = new URL(url).hash
    if (!hash.startsWith('#share=')) return null
    
    const base64 = hash.slice(7) // Remove '#share='
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed
    const padding = 4 - (base64.length % 4)
    const padded = padding === 4 ? base64 : base64 + '='.repeat(padding)
    
    const jsonString = atob(padded)
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}

// ============================================================================
// PDF GENERATION
// ============================================================================

async function generatePDF(
  twin: StoredProjectTwinV2,
  options: ExportOptions
): Promise<ExportResult> {
  const jsPDFClass = await loadJsPDF()
  if (!jsPDFClass) {
    throw new Error('jsPDF konnte nicht geladen werden')
  }
  const doc = new jsPDFClass()
  
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  
  let y = margin
  
  // DECKBLATT
  doc.setFillColor(15, 23, 42) // slate-900
  doc.rect(0, 0, pageWidth, 60, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('OSION Load Pilot', margin, 30)
  
  doc.setFontSize(16)
  doc.text('Projektbericht', margin, 45)
  
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(22)
  doc.text(twin.title || 'Unbenanntes Projekt', margin, 80)
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Erstellt am: ${formatDate(new Date())}`, margin, 95)
  doc.text(`Schema Version: ${twin.schemaVersion || 2}`, margin, 102)
  
  // BESCHREIBUNG
  if (twin.description && options.sections.includes('summary')) {
    y = 120
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Projektbeschreibung', margin, y)
    y += 10
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const splitDescription = doc.splitTextToSize(twin.description, contentWidth)
    doc.text(splitDescription, margin, y)
    y += splitDescription.length * 5 + 10
  }
  
  // ZUSAMMENFASSUNG
  if (options.sections.includes('summary')) {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Zusammenfassung', margin, y)
    y += 10
    
    const summary = generateSummary(twin)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const splitSummary = doc.splitTextToSize(summary, contentWidth)
    doc.text(splitSummary, margin, y)
    y += splitSummary.length * 5 + 15
  }
  
  // MASSNAHMEN
  if (options.sections.includes('measures') && twin.measures?.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = margin
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Maßnahmen', margin, y)
    y += 10
    
    const autoTableFn = await loadAutoTable()
    
    const measureData = twin.measures.map((m: Measure) => [
      m.title,
      getStatusLabel(m.status),
      getPriorityLabel(m.priority),
      m.dueDate ? formatDate(new Date(m.dueDate)) : '-',
      m.owner || '-'
    ])
    
    if (autoTableFn) {
      autoTableFn(doc, {
        head: [['Titel', 'Status', 'Priorität', 'Fällig', 'Verantwortlich']],
        body: measureData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      })
    }
    
    // @ts-ignore - autoTable fügt lastAutoTable finalY hinzu
    y = (doc as any).lastAutoTable?.finalY || y + 50
    y += 15
  }
  
  // RISIKEN & CHANCEN
  if (options.sections.includes('risks') && twin.analysis?.risks?.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = margin
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Risiken & Chancen', margin, y)
    y += 10
    
    const autoTableFn = await loadAutoTable()
    
    const riskData = twin.analysis.risks.map((r: ProjectRisk) => [
      r.title,
      getSeverityLabel(r.severity),
      '-',
      '-'
    ])
    
    if (autoTableFn) {
      autoTableFn(doc, {
        head: [['Beschreibung', 'Schwere', 'Wahrscheinlichkeit', 'Auswirkung']],
        body: riskData,
        startY: y,
        margin: { left: margin, right: margin },
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [15, 23, 42], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      })
    }
    
    // @ts-ignore
    y = (doc as any).lastAutoTable?.finalY || y + 50
    y += 15
  }
  
  // SIMULATIONEN
  const simRuns = twin.simulationRuns || []
  if (options.sections.includes('scenarios') && simRuns.length > 0) {
    if (y > 200) {
      doc.addPage()
      y = margin
    }
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Simulationen', margin, y)
    y += 10
    
    simRuns.forEach((sim: SimulationRun, index: number) => {
      if (y > 250) {
        doc.addPage()
        y = margin
      }
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`${index + 1}. ${sim.title}`, margin, y)
      y += 7
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`Ziel: ${sim.config?.goal || 'Unbekannt'}`, margin, y)
      y += 5
      doc.text(`Status: ${sim.status || 'Unbekannt'}`, margin, y)
      y += 5
      
      if (sim.result?.successProbability) {
        doc.text(`Erfolgswahrscheinlichkeit: ${sim.result.successProbability}%`, margin, y)
        y += 5
      }
      
      y += 10
    })
  }
  
  // AKTIVITÄT
  if (options.sections.includes('activity')) {
    doc.addPage()
    y = margin
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Projektaktivität', margin, y)
    y += 15
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    
    doc.text(`Erstellt: ${formatDate(new Date(twin.createdAt))}`, margin, y)
    y += 7
    doc.text(`Zuletzt aktualisiert: ${formatDate(new Date(twin.updatedAt))}`, margin, y)
    y += 7
    
    if (twin.progress) {
      doc.text(`Fortschritt: ${twin.progress.percent}%`, margin, y)
      y += 7
      doc.text(`Status: ${twin.progress.stage}`, margin, y)
      y += 15
    }
    
    if (twin.updates?.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Letzte Updates', margin, y)
      y += 10
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      twin.updates.slice(0, 5).forEach(update => {
        if (y > 270) {
          doc.addPage()
          y = margin
        }
        
        doc.text(`${formatDate(new Date(update.createdAt))}: ${update.summary.slice(0, 80)}...`, margin, y)
        y += 6
      })
    }
  }
  
  // FUSSZEILE auf jeder Seite
  const pageCount = (doc as any).internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`OSION Load Pilot - Seite ${i} von ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' })
  }
  
  const pdfOutput = doc.output('datauristring')
  
  return {
    content: pdfOutput,
    filename: `${sanitizeFilename(twin.title || 'Projektbericht')}.pdf`,
    mimeType: 'application/pdf'
  }
}

// ============================================================================
// JSON EXPORT
// ============================================================================

function generateJSON(
  twin: StoredProjectTwinV2,
  options: ExportOptions
): ExportResult {
  const exportData: Record<string, unknown> = {
    title: twin.title,
    description: twin.description,
    createdAt: twin.createdAt,
    updatedAt: twin.updatedAt,
    schemaVersion: twin.schemaVersion
  }
  
  if (options.sections.includes('summary')) {
    exportData.summary = generateSummary(twin)
    exportData.progress = twin.progress
  }
  
  if (options.sections.includes('measures')) {
    exportData.measures = twin.measures
  }
  
  if (options.sections.includes('risks')) {
    exportData.risks = twin.analysis?.risks
  }
  
  if (options.sections.includes('scenarios')) {
    exportData.simulationRuns = twin.simulationRuns
    exportData.simulations = twin.simulations
  }
  
  if (options.sections.includes('activity')) {
    exportData.updates = twin.updates
    exportData.processSteps = twin.processSteps
  }
  
  if (options.includeAIActions) {
    exportData.aiActions = twin.analysis?.actions
    exportData.generatedSolutions = twin.generatedSolutions
  }
  
  return {
    content: JSON.stringify(exportData, null, 2),
    filename: `${sanitizeFilename(twin.title || 'Projektexport')}.json`,
    mimeType: 'application/json'
  }
}

// ============================================================================
// MARKDOWN EXPORT
// ============================================================================

function generateMarkdown(
  twin: StoredProjectTwinV2,
  options: ExportOptions
): ExportResult {
  const lines: string[] = []
  
  // Header
  lines.push(`# ${twin.title || 'Projektbericht'}`)
  lines.push('')
  lines.push(`*Erstellt am ${formatDate(new Date())} mit OSION Load Pilot*`)
  lines.push('')
  
  if (twin.description) {
    lines.push('## Beschreibung')
    lines.push('')
    lines.push(twin.description)
    lines.push('')
  }
  
  // Zusammenfassung
  if (options.sections.includes('summary')) {
    lines.push('## Zusammenfassung')
    lines.push('')
    lines.push(generateSummary(twin))
    lines.push('')
    
    if (twin.progress) {
      lines.push('### Fortschritt')
      lines.push('')
      lines.push(`- **Fortschritt:** ${twin.progress.percent}%`)
      lines.push(`- **Phase:** ${twin.progress.stage}`)
      lines.push(`- **Level:** ${twin.progress.level}`)
      lines.push('')
    }
  }
  
  // Maßnahmen
  if (options.sections.includes('measures') && twin.measures?.length > 0) {
    lines.push('## Maßnahmen')
    lines.push('')
    
    twin.measures.forEach((m: Measure) => {
      const statusEmoji = getStatusEmoji(m.status)
      const priorityEmoji = getPriorityEmoji(m.priority)
      lines.push(`### ${statusEmoji} ${m.title}`)
      lines.push('')
      lines.push(`- **Status:** ${getStatusLabel(m.status)}`)
      lines.push(`- **Priorität:** ${priorityEmoji} ${getPriorityLabel(m.priority)}`)
      if (m.dueDate) lines.push(`- **Fällig:** ${formatDate(new Date(m.dueDate))}`)
      if (m.owner) lines.push(`- **Verantwortlich:** ${m.owner}`)
      if (m.description) lines.push(`- **Beschreibung:** ${m.description}`)
      lines.push('')
    })
  }
  
  // Risiken
  if (options.sections.includes('risks') && twin.analysis?.risks?.length > 0) {
    lines.push('## Risiken & Chancen')
    lines.push('')
    
    twin.analysis.risks.forEach((r: ProjectRisk) => {
      const emoji = '⚠️'
      lines.push(`### ${emoji} ${r.title}`)
      lines.push('')
      lines.push(`- **Schwere:** ${getSeverityLabel(r.severity)}`)
      if (r.explanation) lines.push(`- **Beschreibung:** ${r.explanation}`)
      lines.push('')
    })
  }
  
  // Simulationen
  const simRuns = twin.simulationRuns || []
  if (options.sections.includes('scenarios') && simRuns.length > 0) {
    lines.push('## Simulationen')
    lines.push('')
    
    simRuns.forEach((sim: SimulationRun, index: number) => {
      lines.push(`### ${index + 1}. ${sim.title}`)
      lines.push('')
      lines.push(`- **Ziel:** ${sim.config?.goal || 'Unbekannt'}`)
      lines.push(`- **Status:** ${sim.status || 'Unbekannt'}`)
      
      if (sim.result) {
        lines.push(`- **Resonanz:** ${sim.result.resonanceScore}/100`)
        lines.push(`- **Vertrauen:** ${sim.result.trustScore}/100`)
        lines.push(`- **Erfolgswahrscheinlichkeit:** ${sim.result.successProbability}%`)
      }
      
      lines.push('')
      
      if (sim.result?.summary) {
        lines.push('**Zusammenfassung:**')
        lines.push('')
        lines.push(sim.result.summary)
        lines.push('')
      }
    })
  }
  
  // Aktivität
  if (options.sections.includes('activity')) {
    lines.push('## Projektaktivität')
    lines.push('')
    lines.push(`- **Erstellt:** ${formatDate(new Date(twin.createdAt))}`)
    lines.push(`- **Zuletzt aktualisiert:** ${formatDate(new Date(twin.updatedAt))}`)
    lines.push('')
    
    if (twin.updates?.length > 0) {
      lines.push('### Letzte Updates')
      lines.push('')
      
      twin.updates.slice(0, 10).forEach(update => {
        lines.push(`**${formatDate(new Date(update.createdAt))}**`)
        lines.push('')
        lines.push(update.summary)
        lines.push('')
      })
    }
  }
  
  // Footer
  lines.push('---')
  lines.push('')
  lines.push('*Dieser Bericht wurde mit OSION Load Pilot generiert.*')
  
  return {
    content: lines.join('\n'),
    filename: `${sanitizeFilename(twin.title || 'Projektbericht')}.md`,
    mimeType: 'text/markdown'
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createShareableTwin(twin: StoredProjectTwinV2): Partial<StoredProjectTwinV2> {
  // Minimaler Twin für Sharing
  return {
    id: twin.id,
    title: twin.title,
    description: twin.description,
    createdAt: twin.createdAt,
    updatedAt: twin.updatedAt,
    schemaVersion: twin.schemaVersion,
    analysis: twin.analysis ? {
      ...twin.analysis
    } : undefined,
    measures: twin.measures,
    progress: twin.progress,
    simulationRuns: twin.simulationRuns?.map(sim => ({
      id: sim.id,
      title: sim.title,
      type: sim.type,
      status: sim.status,
      config: sim.config,
      result: sim.result ? {
        summary: sim.result.summary,
        successProbability: sim.result.successProbability,
        resonanceScore: sim.result.resonanceScore,
        trustScore: sim.result.trustScore,
        riskScore: sim.result.riskScore
      } : undefined
    })) as SimulationRun[]
  }
}

function generateSummary(twin: StoredProjectTwinV2): string {
  const parts: string[] = []
  
  if (twin.analysis?.project?.status) {
    parts.push(`Status: ${twin.analysis.project.status}`)
  }
  
  if (twin.progress) {
    parts.push(`Fortschritt: ${twin.progress.percent}%`)
  }
  
  if (twin.measures?.length) {
    parts.push(`${twin.measures.length} Maßnahmen`)
  }
  
  const simCount = twin.simulationRuns?.length || 0
  if (simCount > 0) {
    parts.push(`${simCount} Simulationen`)
  }
  
  return parts.join(' • ') || 'Keine Zusammenfassung verfügbar'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9äöüÄÖÜß\-_ ]/g, '_').slice(0, 50)
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: 'Idee',
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    waiting: 'Wartend',
    blocked: 'Blockiert',
    done: 'Erledigt',
    discarded: 'Verworfen'
  }
  return labels[status] || status
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    critical: 'Kritisch',
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }
  return labels[priority] || priority
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    high: 'Hoch',
    medium: 'Mittel',
    low: 'Niedrig'
  }
  return labels[severity] || severity
}

function getStatusEmoji(status: string): string {
  const emojis: Record<string, string> = {
    idea: '💡',
    open: '📋',
    in_progress: '🔄',
    waiting: '⏳',
    blocked: '🚫',
    done: '✅',
    discarded: '🗑️'
  }
  return emojis[status] || '📋'
}

function getPriorityEmoji(priority: string): string {
  const emojis: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢'
  }
  return emojis[priority] || '⚪'
}

// ============================================================================
// DOWNLOAD HELPER
// ============================================================================

export function downloadFile(result: ExportResult): void {
  const link = document.createElement('a')
  
  if (result.content.startsWith('data:')) {
    // Data URI (z.B. PDF)
    link.href = result.content
  } else {
    // Text content (JSON, Markdown)
    const blob = new Blob([result.content], { type: result.mimeType })
    link.href = URL.createObjectURL(blob)
  }
  
  link.download = result.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Cleanup
  if (!result.content.startsWith('data:')) {
    URL.revokeObjectURL(link.href)
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text)
}

// ============================================================================
// PREVIEW GENERATION
// ============================================================================

export function generatePreview(
  twin: StoredProjectTwinV2,
  options: ExportOptions
): string {
  const lines: string[] = []
  
  lines.push(`# ${twin.title || 'Projektbericht'}`)
  lines.push('')
  
  if (options.sections.includes('summary')) {
    lines.push('## Zusammenfassung')
    lines.push(generateSummary(twin))
    lines.push('')
  }
  
  if (options.sections.includes('measures') && twin.measures?.length > 0) {
    lines.push(`## Maßnahmen (${twin.measures.length})`)
    twin.measures.slice(0, 5).forEach((m: Measure) => {
      lines.push(`- ${m.title} (${getStatusLabel(m.status)})`)
    })
    if (twin.measures.length > 5) {
      lines.push(`- ... und ${twin.measures.length - 5} weitere`)
    }
    lines.push('')
  }
  
  if (options.sections.includes('risks') && twin.analysis?.risks?.length > 0) {
    lines.push(`## Risiken & Chancen (${twin.analysis.risks.length})`)
    lines.push('')
  }
  
  const simCount = twin.simulationRuns?.length || 0
  if (options.sections.includes('scenarios') && simCount > 0) {
    lines.push(`## Simulationen (${simCount})`)
    lines.push('')
  }
  
  return lines.join('\n')
}
