import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, Sparkles, Save, Calendar, User, Flag, 
  Target, FileText, AlertCircle, Loader2, CheckCircle, Mail, MessageSquare, Share2
} from 'lucide-react'
import type { Measure, MeasureStatus, MeasurePriority } from '../../types/measures'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import { updateProjectTwin } from '../../services/projectTwinUpdateApi'
import { normalizeProjectTwinUpdateResponse, buildUpdatedTwinFromResult } from '../../services/projectTwinUpdateNormalizer'
import { exportSingleMeasureToICS, downloadICS } from '../../services/calendarExportService'
import { generateMeasureEmailDraft, generateEmailDraft } from '../../services/emailIntegrationService'
import { generateSingleMeasureSlackMessage } from '../../services/slackShareService'

interface AddMeasurePanelProps {
  isOpen: boolean
  onClose: () => void
  projects: StoredProjectTwin[]
  defaultProjectId?: string
  onMeasureCreated: (measure: Measure) => void
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
}

type InputMode = 'quick' | 'structured'

interface MeasureFormData {
  title: string
  projectId: string
  status: MeasureStatus
  priority: MeasurePriority
  dueDate: string
  owner: string
  description: string
  strategicGoal: string
  valueScore: number
  linkedProcessStepId: string
  notes: string
}

const INITIAL_FORM_DATA: MeasureFormData = {
  title: '',
  projectId: '',
  status: 'open',
  priority: 'medium',
  dueDate: '',
  owner: '',
  description: '',
  strategicGoal: '',
  valueScore: 5,
  linkedProcessStepId: '',
  notes: ''
}

export default function AddMeasurePanel({ 
  isOpen, 
  onClose, 
  projects, 
  defaultProjectId,
  onMeasureCreated,
  onTwinUpdate
}: AddMeasurePanelProps) {
  const [mode, setMode] = useState<InputMode>('structured')
  const [quickInput, setQuickInput] = useState('')
  const [formData, setFormData] = useState<MeasureFormData>({
    ...INITIAL_FORM_DATA,
    projectId: defaultProjectId || (projects[0]?.id ?? '')
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.title.trim()) errors.push('Titel ist erforderlich')
    if (!formData.projectId) errors.push('Projekt ist erforderlich')
    if (!formData.status) errors.push('Status ist erforderlich')
    if (!formData.priority) errors.push('Priorität ist erforderlich')
    if (!formData.dueDate) errors.push('Frist ist erforderlich')
    if (!formData.owner.trim()) errors.push('Kümmerer ist erforderlich')

    setValidationErrors(errors)
    return errors.length === 0
  }

  // Integrations-Handler
  const handleAddToCalendar = () => {
    if (!formData.dueDate) {
      setError('Bitte wähle zuerst ein Fälligkeitsdatum aus.')
      return
    }
    
    const measurePreview: Measure = {
      id: 'temp',
      projectId: formData.projectId,
      projectTitle: projects.find(p => p.id === formData.projectId)?.title || '',
      title: formData.title || 'Neue Maßnahme',
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate,
      owner: formData.owner,
      valueScore: formData.valueScore,
      source: 'manual',
      createdAt: new Date().toISOString(),
      parentId: null
    }
    
    try {
      const ics = exportSingleMeasureToICS(measurePreview)
      downloadICS(ics, `massnahme-${(formData.title || 'neu').toLowerCase().replace(/[^a-z0-9]/g, '-')}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Export')
    }
  }

  const handleShareViaEmail = () => {
    const measurePreview: Measure = {
      id: 'temp',
      projectId: formData.projectId,
      projectTitle: projects.find(p => p.id === formData.projectId)?.title || '',
      title: formData.title || 'Neue Maßnahme',
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || null,
      owner: formData.owner || 'Unassigned',
      valueScore: formData.valueScore,
      source: 'manual',
      createdAt: new Date().toISOString(),
      parentId: null
    }
    
    const draft = generateMeasureEmailDraft(measurePreview)
    const mailto = generateEmailDraft(draft.recipient, draft.subject, draft.body)
    window.location.href = mailto
  }

  const handleShareViaSlack = async () => {
    const measurePreview: Measure = {
      id: 'temp',
      projectId: formData.projectId,
      projectTitle: projects.find(p => p.id === formData.projectId)?.title || '',
      title: formData.title || 'Neue Maßnahme',
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || null,
      owner: formData.owner || 'Unassigned',
      valueScore: formData.valueScore,
      source: 'manual',
      createdAt: new Date().toISOString(),
      parentId: null
    }
    
    const text = generateSingleMeasureSlackMessage(measurePreview)
    await navigator.clipboard.writeText(text)
    setCopiedSection('slack')
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const buildMeasureAdditionalInput = (data: MeasureFormData): string => {
    const project = projects.find(p => p.id === data.projectId)
    
    return `Neue Maßnahme für Project Twin:

Titel: ${data.title}
Projekt: ${project?.title || 'Unbekannt'}
Status: ${data.status}
Priorität: ${data.priority}
Frist: ${data.dueDate}
Kümmerer: ${data.owner}
${data.description ? `Beschreibung: ${data.description}` : ''}
${data.strategicGoal ? `Strategisches Ziel: ${data.strategicGoal}` : ''}
${data.valueScore ? `Nutzwert: ${data.valueScore}/10` : ''}
${data.linkedProcessStepId ? `Verknüpfter Prozessschritt: ${data.linkedProcessStepId}` : ''}
${data.notes ? `Bemerkung: ${data.notes}` : ''}

Bitte integriere diese Maßnahme in den Project Twin.
Ordne sie dem passenden Prozessschritt zu.
Bewerte Priorität, Risikoauswirkung und Folgeaufgaben.
Aktualisiere Maßnahmenliste, Command-Relevanz und Projektverlauf.`
  }

  const buildQuickInputAdditionalInput = (input: string): string => {
    const project = projects.find(p => p.id === formData.projectId)
    
    return `Erstelle aus dieser Eingabe eine strukturierte Maßnahme und ordne sie dem passenden Prozessschritt, Status, Risiko und Projektziel zu:

Eingabe: "${input}"

Projekt: ${project?.title || 'Unbekannt'}

Bitte analysiere:
1. Was ist die konkrete Maßnahme?
2. Zu welchem Prozessschritt gehört sie?
3. Wie hoch ist die Priorität (kritisch, hoch, mittel, niedrig)?
4. Gibt es eine Frist?
5. Wer sollte der Kümmerer sein?
6. Was ist das strategische Ziel?
7. Gibt es Risiken bei Nicht-Erledigung?
8. Erzeugt sie Folgeaufgaben?

Erstelle eine vollständige Maßnahme mit allen relevanten Feldern.`
  }

  const handleAIStructure = async () => {
    if (!quickInput.trim()) {
      setError('Bitte gib eine Beschreibung ein')
      return
    }

    if (!formData.projectId) {
      setError('Bitte wähle ein Projekt aus')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const activeProject = projects.find(p => p.id === formData.projectId)
      if (!activeProject?.analysis) {
        throw new Error('Kein aktives Projekt gefunden')
      }

      const additionalInput = buildQuickInputAdditionalInput(quickInput)

      const response = await updateProjectTwin({
        existingTwin: activeProject.analysis,
        additionalInput,
        originalInput: activeProject.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: activeProject.updates,
        currentProgress: activeProject.progress
      })

      const normalized = normalizeProjectTwinUpdateResponse(response, activeProject, additionalInput)
      if (!normalized) throw new Error('KI-Strukturierung fehlgeschlagen')
      
      const updatedTwin = buildUpdatedTwinFromResult(normalized, activeProject, additionalInput)
      if (!updatedTwin) throw new Error('Update fehlgeschlagen')

      // Extrahiere die neue Maßnahme aus dem aktualisierten Twin
      const newMeasures = extractMeasuresFromTwinUpdate(updatedTwin, activeProject.id)
      
      if (newMeasures.length > 0) {
        onMeasureCreated(newMeasures[0])
        onTwinUpdate?.(updatedTwin)
        resetAndClose()
      } else {
        throw new Error('Keine Maßnahme konnte extrahiert werden')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der KI-Strukturierung')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = async (updateTwin: boolean = false) => {
    if (!validateForm()) return

    setIsProcessing(true)
    setError(null)

    try {
      const activeProject = projects.find(p => p.id === formData.projectId)
      if (!activeProject) {
        throw new Error('Projekt nicht gefunden')
      }

      const measure: Measure = {
        id: `M-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        projectId: formData.projectId,
        projectTitle: activeProject.title,
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        dueDate: formData.dueDate || null,
        owner: formData.owner,
        valueScore: formData.valueScore,
        strategicGoal: formData.strategicGoal || undefined,
        notes: formData.notes || undefined,
        linkedProcessStepId: formData.linkedProcessStepId || undefined,
        source: 'manual',
        createdAt: new Date().toISOString(),
        parentId: null
      }

      if (updateTwin && activeProject.analysis) {
        // Twin aktualisieren
        const additionalInput = buildMeasureAdditionalInput(formData)
        
        const response = await updateProjectTwin({
          existingTwin: activeProject.analysis,
          additionalInput,
          originalInput: activeProject.originalInput || '',
          updateMode: 'refine_existing_twin',
          contextAnswers: [],
          previousUpdates: activeProject.updates,
          currentProgress: activeProject.progress
        })

        const normalized = normalizeProjectTwinUpdateResponse(response, activeProject, additionalInput)
        if (normalized) {
          const updatedTwin = buildUpdatedTwinFromResult(normalized, activeProject, additionalInput)
          if (updatedTwin) {
            onTwinUpdate?.(updatedTwin)
          }
        }
      }

      onMeasureCreated(measure)
      resetAndClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setIsProcessing(false)
    }
  }

  const extractMeasuresFromTwinUpdate = (twin: StoredProjectTwin, projectId: string): Measure[] => {
    // Extrahiere Maßnahmen aus dem aktualisierten Twin
    const measures: Measure[] = []
    
    if (twin.analysis?.actions) {
      twin.analysis.actions.forEach((action, index) => {
        measures.push({
          id: `M-${projectId}-${Date.now()}-${index}`,
          projectId: projectId,
          projectTitle: twin.title,
          title: action.title,
          description: action.messageDraft || undefined,
          status: action.priority === 'high' ? 'open' : 'idea',
          priority: action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low',
          dueDate: null,
          owner: action.owner || 'Unassigned',
          valueScore: action.priority === 'high' ? 8 : action.priority === 'medium' ? 5 : 3,
          source: 'manual' as const,
          createdAt: new Date().toISOString(),
          parentId: null
        })
      })
    }

    return measures
  }

  const resetAndClose = () => {
    setFormData({ ...INITIAL_FORM_DATA, projectId: defaultProjectId || (projects[0]?.id ?? '') })
    setQuickInput('')
    setError(null)
    setValidationErrors([])
    setCopiedSection(null)
    onClose()
  }

  const updateFormField = <K extends keyof MeasureFormData>(
    field: K, 
    value: MeasureFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => prev.filter(e => !e.toLowerCase().includes(field.toLowerCase())))
  }

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
            onClick={resetAndClose}
          />
          
          {/* Panel - Mobile fullscreen with bottom sheet feel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg bg-[var(--lp-surface)] border-l border-[var(--lp-border)] z-50 shadow-2xl flex flex-col sm:rounded-l-2xl overflow-hidden"
          >
            {/* Header - Sticky on mobile */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--lp-border)] bg-[var(--lp-surface)] sticky top-0 z-10">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-[var(--lp-text)]">Neue Maßnahme</h2>
                <p className="text-xs sm:text-sm text-[var(--lp-muted)]">Strukturierte Arbeitsbausteine erstellen</p>
              </div>
              <button 
                onClick={resetAndClose}
                className="p-3 -mr-2 hover:bg-[var(--lp-surface-soft)] rounded-xl transition-colors touch-manipulation"
                aria-label="Schließen"
              >
                <X className="w-6 h-6 text-[var(--lp-muted)]" />
              </button>
            </div>

            {/* Mode Toggle - Touch friendly */}
            <div className="flex p-2 gap-2 border-b border-[var(--lp-border)]">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  mode === 'quick' 
                    ? 'bg-[var(--lp-accent)] text-white shadow-lg shadow-[var(--lp-accent)]/25' 
                    : 'bg-[var(--lp-surface-soft)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Schnell mit KI
              </button>
              <button
                onClick={() => setMode('structured')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  mode === 'structured' 
                    ? 'bg-[var(--lp-accent)] text-white shadow-lg shadow-[var(--lp-accent)]/25' 
                    : 'bg-[var(--lp-surface-soft)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Strukturiert
              </button>
            </div>

            {/* Content - Scrollable with safe area padding */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-safe">
              {/* Project Selection - Always visible */}
              <div>
                <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                  Projekt <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => updateFormField('projectId', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] focus:ring-1 focus:ring-[var(--lp-cobalt)] outline-none"
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              {mode === 'quick' ? (
                /* Quick Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Was soll erledigt werden? <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      placeholder="z.B. Budget prüfen bis Freitag"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] focus:ring-1 focus:ring-[var(--lp-cobalt)] outline-none resize-none"
                    />
                    <p className="mt-2 text-xs text-[var(--lp-muted)]">
                      Die KI analysiert deine Eingabe und erstellt eine strukturierte Maßnahme.
                    </p>
                  </div>

                  <button
                    onClick={handleAIStructure}
                    disabled={isProcessing || !quickInput.trim()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    Mit KI strukturieren
                  </button>
                </div>
              ) : (
                /* Structured Mode */
                <div className="space-y-4">
                  {/* Quick Share Toolbar */}
                  {formData.title && (
                    <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)] mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Share2 className="w-4 h-4 text-[var(--lp-cobalt)]" />
                        <span className="text-sm font-medium text-[var(--lp-text)]">Schnell teilen</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleAddToCalendar}
                          disabled={!formData.dueDate}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-sm disabled:opacity-50"
                        >
                          <Calendar className="w-4 h-4" />
                          In Kalender
                        </button>
                        <button
                          onClick={handleShareViaEmail}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
                        >
                          <Mail className="w-4 h-4" />
                          Per E-Mail
                        </button>
                        <button
                          onClick={handleShareViaSlack}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm"
                        >
                          {copiedSection === 'slack' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Kopiert!
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-4 h-4" />
                              Für Slack
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Titel <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormField('title', e.target.value)}
                      placeholder="z.B. Budgetverfügbarkeit prüfen"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] focus:ring-1 focus:ring-[var(--lp-cobalt)] outline-none"
                    />
                  </div>

                  {/* Status & Priority Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Status <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => updateFormField('status', e.target.value as MeasureStatus)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                      >
                        <option value="idea">Idee</option>
                        <option value="open">Offen</option>
                        <option value="in_progress">In Bearbeitung</option>
                        <option value="waiting">Wartend</option>
                        <option value="blocked">Blockiert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Priorität <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => updateFormField('priority', e.target.value as MeasurePriority)}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                      >
                        <option value="critical">Kritisch</option>
                        <option value="high">Hoch</option>
                        <option value="medium">Mittel</option>
                        <option value="low">Niedrig</option>
                      </select>
                    </div>
                  </div>

                  {/* Due Date & Owner Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Frist <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lp-muted)]" />
                        <input
                          type="date"
                          value={formData.dueDate}
                          onChange={(e) => updateFormField('dueDate', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Kümmerer <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lp-muted)]" />
                        <input
                          type="text"
                          value={formData.owner}
                          onChange={(e) => updateFormField('owner', e.target.value)}
                          placeholder="Name"
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="pt-4 border-t border-[var(--lp-border)]">
                    <p className="text-sm font-medium text-[var(--lp-muted)] mb-4">Optionale Felder</p>
                    
                    {/* Description */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Beschreibung
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => updateFormField('description', e.target.value)}
                        rows={3}
                        placeholder="Details zur Maßnahme..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                      />
                    </div>

                    {/* Strategic Goal */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        <Target className="w-4 h-4 inline mr-1" />
                        Strategisches Ziel
                      </label>
                      <input
                        type="text"
                        value={formData.strategicGoal}
                        onChange={(e) => updateFormField('strategicGoal', e.target.value)}
                        placeholder="z.B. Finanzielle Kaufentscheidung absichern"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none"
                      />
                    </div>

                    {/* Value Score */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        <Flag className="w-4 h-4 inline mr-1" />
                        Nutzwert (1-10)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.valueScore}
                        onChange={(e) => updateFormField('valueScore', parseInt(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-[var(--lp-muted)] mt-1">
                        <span>Niedrig</span>
                        <span className="font-medium text-[var(--lp-text)]">{formData.valueScore}</span>
                        <span>Hoch</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Bemerkung
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => updateFormField('notes', e.target.value)}
                        rows={2}
                        placeholder="Interne Notizen..."
                        className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-medium text-rose-500">Bitte korrigiere die Eingabe:</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-rose-400 space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500"
                >
                  {error}
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--lp-border)] space-y-3">
              {mode === 'structured' && (
                <>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Speichern & Twin aktualisieren
                      </>
                    )}
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSave(false)}
                      disabled={isProcessing}
                      className="flex-1 py-3 px-4 bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] rounded-xl font-medium hover:bg-[var(--lp-surface-soft)] transition-colors disabled:opacity-50"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={resetAndClose}
                      disabled={isProcessing}
                      className="flex-1 py-3 px-4 bg-transparent border border-[var(--lp-border)] text-[var(--lp-muted)] rounded-xl font-medium hover:text-[var(--lp-text)] transition-colors disabled:opacity-50"
                    >
                      Abbrechen
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
