import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, Sparkles, Save, Calendar, User, Flag, 
  Target, FileText, AlertCircle, Loader2
} from 'lucide-react'
import type { Measure, MeasureStatus, MeasurePriority } from '../../types/measures'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import { updateProjectTwin } from '../../services/projectTwinUpdateApi'
import { normalizeProjectTwinUpdateResponse, buildUpdatedTwinFromResult } from '../../services/projectTwinUpdateNormalizer'

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
          
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--lp-panel)] border-l border-[var(--lp-border)] z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--lp-border)]">
              <div>
                <h2 className="text-xl font-semibold text-[var(--lp-text)]">Neue Maßnahme</h2>
                <p className="text-sm text-[var(--lp-muted)]">Strukturierte Arbeitsbausteine erstellen</p>
              </div>
              <button 
                onClick={resetAndClose}
                className="p-2 hover:bg-[var(--lp-surface)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--lp-muted)]" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex p-2 gap-2 border-b border-[var(--lp-border)]">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'quick' 
                    ? 'bg-[var(--lp-cobalt)] text-white' 
                    : 'bg-[var(--lp-surface)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-2" />
                Schnell mit KI
              </button>
              <button
                onClick={() => setMode('structured')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'structured' 
                    ? 'bg-[var(--lp-cobalt)] text-white' 
                    : 'bg-[var(--lp-surface)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Strukturiert
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
