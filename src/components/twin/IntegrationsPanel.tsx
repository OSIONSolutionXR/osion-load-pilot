/**
 * OSION Load Pilot - Integrations Panel
 * Kalender, E-Mail, Notion, Slack Export
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  X, Calendar, Mail, FileText, MessageSquare,
  Copy, Check, Download, Send,
  ChevronDown, ChevronUp, Sparkles
} from 'lucide-react'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'
import type { Measure } from '../../types/measures'
import {
  exportToICS,
  measuresToCalendarEvents,
  exportSingleMeasureToICS,
  downloadICS,
} from '../../services/calendarExportService'
import {
  generateEmailDraft,
  generateMeasureEmailDraft,
  generateTwinEmailDraft,
} from '../../services/emailIntegrationService'
import {
  exportToNotionMarkdown,
  downloadNotionMarkdown,
  downloadMeasuresCSV,
} from '../../services/notionExportService'
import {
  generateSlackMessage,
  generateSingleMeasureSlackMessage,
  type SlackHighlight,
} from '../../services/slackShareService'

interface IntegrationsPanelProps {
  isOpen: boolean
  onClose: () => void
  twin: StoredProjectTwinV2
  selectedMeasure?: Measure | null
}

export default function IntegrationsPanel({
  isOpen,
  onClose,
  twin,
  selectedMeasure,
}: IntegrationsPanelProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [slackHighlight, setSlackHighlight] = useState<SlackHighlight>('summary')

  // Calendar Functions
  const handleExportCalendar = () => {
    const events = measuresToCalendarEvents(twin.measures || [])
    if (events.length === 0) {
      alert('Keine Maßnahmen mit Fälligkeitsdatum vorhanden.')
      return
    }
    const ics = exportToICS(events)
    downloadICS(ics, `maßnahmen-${sanitizeFilename(twin.title)}`)
  }

  const handleExportSingleMeasureCalendar = () => {
    if (!selectedMeasure?.dueDate) {
      alert('Diese Maßnahme hat kein Fälligkeitsdatum.')
      return
    }
    const ics = exportSingleMeasureToICS(selectedMeasure)
    downloadICS(ics, `maßnahme-${sanitizeFilename(selectedMeasure.title)}`)
  }

  // Email Functions
  const handleEmailTwin = () => {
    const draft = generateTwinEmailDraft(twin)
    const mailto = generateEmailDraft(draft.recipient, draft.subject, draft.body)
    window.location.href = mailto
  }

  const handleEmailMeasure = () => {
    if (!selectedMeasure) {
      alert('Bitte wähle eine Maßnahme aus.')
      return
    }
    const draft = generateMeasureEmailDraft(selectedMeasure)
    const mailto = generateEmailDraft(draft.recipient, draft.subject, draft.body)
    window.location.href = mailto
  }

  // Notion Functions
  const handleExportNotionMarkdown = () => {
    downloadNotionMarkdown(twin)
  }

  const handleExportMeasuresCSV = () => {
    if (!twin.measures || twin.measures.length === 0) {
      alert('Keine Maßnahmen vorhanden.')
      return
    }
    downloadMeasuresCSV(twin.measures, twin.title)
  }

  const handleCopyNotionMarkdown = async () => {
    const md = exportToNotionMarkdown(twin)
    await navigator.clipboard.writeText(md)
    setCopiedSection('notion-md')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  // Slack Functions
  const handleCopySlack = async (highlight: SlackHighlight) => {
    const text = generateSlackMessage(twin, { highlight })
    await navigator.clipboard.writeText(text)
    setCopiedSection(`slack-${highlight}`)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const handleCopySingleMeasureSlack = async () => {
    if (!selectedMeasure) return
    const text = generateSingleMeasureSlackMessage(selectedMeasure)
    await navigator.clipboard.writeText(text)
    setCopiedSection('slack-measure')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const hasMeasuresWithDueDate = (twin.measures || []).some(m => m.dueDate)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--lp-panel)] border-l border-[var(--lp-border)] z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--lp-border)]">
              <div>
                <h2 className="text-xl font-semibold text-[var(--lp-text)]">Integrationen</h2>
                <p className="text-sm text-[var(--lp-muted)]">
                  {selectedMeasure ? `Maßnahme: ${selectedMeasure.title}` : twin.title}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--lp-surface)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--lp-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Calendar Section */}
              <IntegrationSection
                id="calendar"
                icon={Calendar}
                title="Kalender"
                color="text-emerald-400"
                bgColor="bg-emerald-500/10"
                isExpanded={expandedSection === 'calendar'}
                onToggle={() => toggleSection('calendar')}
              >
                <div className="space-y-3">
                  <p className="text-sm text-[var(--lp-muted)]">
                    Exportiere Due Dates als .ics Datei für Google Calendar, Outlook, Apple Calendar.
                  </p>

                  {hasMeasuresWithDueDate ? (
                    <>
                      <button
                        onClick={handleExportCalendar}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-emerald-500/50 transition-colors"
                      >
                        <Download className="w-5 h-5 text-emerald-400" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-[var(--lp-text)]">Alle Due Dates</div>
                          <div className="text-xs text-[var(--lp-muted)]">{twin.measures?.filter(m => m.dueDate).length || 0} Maßnahmen</div>
                        </div>
                      </button>

                      {selectedMeasure?.dueDate && (
                        <button
                          onClick={handleExportSingleMeasureCalendar}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-emerald-500/50 transition-colors"
                        >
                          <Calendar className="w-5 h-5 text-emerald-400" />
                          <div className="text-left">
                            <div className="text-sm font-medium text-[var(--lp-text)]">Nur diese Maßnahme</div>
                            <div className="text-xs text-[var(--lp-muted)]">{formatDate(selectedMeasure.dueDate)}</div>
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-[var(--lp-muted)] italic">
                      Keine Maßnahmen mit Fälligkeitsdatum vorhanden.
                    </p>
                  )}
                </div>
              </IntegrationSection>

              {/* Email Section */}
              <IntegrationSection
                id="email"
                icon={Mail}
                title="E-Mail"
                color="text-blue-400"
                bgColor="bg-blue-500/10"
                isExpanded={expandedSection === 'email'}
                onToggle={() => toggleSection('email')}
              >
                <div className="space-y-3">
                  <p className="text-sm text-[var(--lp-muted)]">
                    Öffnet deinen E-Mail-Client mit vorausgefülltem Text.
                  </p>

                  <button
                    onClick={handleEmailTwin}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-blue-500/50 transition-colors"
                  >
                    <Send className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-[var(--lp-text)]">Ganzen Twin teilen</div>
                      <div className="text-xs text-[var(--lp-muted)]">Zusammenfassung + Maßnahmen</div>
                    </div>
                  </button>

                  <button
                    onClick={handleEmailMeasure}
                    disabled={!selectedMeasure}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-[var(--lp-text)]">Maßnahme teilen</div>
                      <div className="text-xs text-[var(--lp-muted)]">
                        {selectedMeasure ? selectedMeasure.title : 'Keine Maßnahme ausgewählt'}
                      </div>
                    </div>
                  </button>
                </div>
              </IntegrationSection>

              {/* Notion Section */}
              <IntegrationSection
                id="notion"
                icon={FileText}
                title="Notion"
                color="text-amber-400"
                bgColor="bg-amber-500/10"
                isExpanded={expandedSection === 'notion'}
                onToggle={() => toggleSection('notion')}
              >
                <div className="space-y-3">
                  <p className="text-sm text-[var(--lp-muted)]">
                    Exportiere als Markdown oder CSV für Notion-Import.
                  </p>

                  <button
                    onClick={handleExportNotionMarkdown}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-amber-500/50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-[var(--lp-text)]">Markdown-Export</div>
                      <div className="text-xs text-[var(--lp-muted)]">Mit To-Do-Listen und Tabellen</div>
                    </div>
                  </button>

                  <button
                    onClick={handleCopyNotionMarkdown}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-amber-500/50 transition-colors"
                  >
                    {copiedSection === 'notion-md' ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-amber-400" />
                        <span className="text-sm font-medium text-[var(--lp-text)]">Markdown kopieren</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportMeasuresCSV}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-amber-500/50 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-amber-400" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-[var(--lp-text)]">Maßnahmen als CSV</div>
                      <div className="text-xs text-[var(--lp-muted)]">Für Notion-Datenbank-Import</div>
                    </div>
                  </button>
                </div>
              </IntegrationSection>

              {/* Slack Section */}
              <IntegrationSection
                id="slack"
                icon={MessageSquare}
                title="Slack"
                color="text-violet-400"
                bgColor="bg-violet-500/10"
                isExpanded={expandedSection === 'slack'}
                onToggle={() => toggleSection('slack')}
              >
                <div className="space-y-3">
                  <p className="text-sm text-[var(--lp-muted)]">
                    Kopiere formatierten Text für Slack.
                  </p>

                  {/* Highlight Selector */}
                  <div className="flex flex-wrap gap-2">
                    {(['summary', 'measures', 'risks', 'next_step'] as SlackHighlight[]).map(
                      (h) => (
                        <button
                          key={h}
                          onClick={() => setSlackHighlight(h)}
                          className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                            slackHighlight === h
                              ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50'
                              : 'bg-[var(--lp-surface)] text-[var(--lp-muted)] border border-[var(--lp-border)]'
                          }`}
                        >
                          {getSlackHighlightLabel(h)}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => handleCopySlack(slackHighlight)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-violet-500/50 transition-colors"
                  >
                    {copiedSection === `slack-${slackHighlight}` ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">Kopiert! Einfach in Slack einfügen.</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5 text-violet-400" />
                        <span className="text-sm font-medium text-[var(--lp-text)]">
                          {getSlackHighlightLabel(slackHighlight)} kopieren
                        </span>
                      </>
                    )}
                  </button>

                  {selectedMeasure && (
                    <button
                      onClick={handleCopySingleMeasureSlack}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-violet-500/50 transition-colors"
                    >
                      {copiedSection === 'slack-measure' ? (
                        <>
                          <Check className="w-5 h-5 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-400">Kopiert!</span>
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-5 h-5 text-violet-400" />
                          <span className="text-sm font-medium text-[var(--lp-text)]">Diese Maßnahme teilen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </IntegrationSection>

              {/* Info */}
              <div className="mt-6 p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--lp-cobalt)] mt-0.5" />
                  <div className="text-sm text-[var(--lp-muted)]">
                    <p className="mb-2"><strong className="text-[var(--lp-text)]">Datenschutz-Hinweis:</strong></p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Keine API-Keys erforderlich</li>
                      <li>Alle Daten bleiben lokal</li>
                      <li>E-Mail öffnet deinen Standard-Client</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--lp-border)]">
              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] rounded-xl font-medium hover:bg-[var(--lp-surface-soft)] transition-colors"
              >
                Schließen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Sub-Components

interface IntegrationSectionProps {
  id: string
  icon: typeof Calendar
  title: string
  color: string
  bgColor: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function IntegrationSection({
  icon: Icon,
  title,
  color,
  bgColor,
  isExpanded,
  onToggle,
  children,
}: IntegrationSectionProps) {
  return (
    <div className="rounded-xl border border-[var(--lp-border)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-[var(--lp-surface)] hover:bg-[var(--lp-surface-soft)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <span className="font-medium text-[var(--lp-text)]">{title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[var(--lp-muted)]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[var(--lp-muted)]" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-[var(--lp-border)] bg-[var(--lp-panel)]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Helper

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getSlackHighlightLabel(highlight: SlackHighlight): string {
  const labels: Record<SlackHighlight, string> = {
    summary: 'Zusammenfassung',
    measures: 'Maßnahmen',
    risks: 'Risiken',
    next_step: 'Nächster Schritt',
  }
  return labels[highlight]
}