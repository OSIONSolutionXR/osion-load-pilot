import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, Sparkles, Save, Calendar, User, Flag, 
  Target, FileText, AlertCircle, Loader2, CheckCircle, ArrowRight
} from 'lucide-react'
import type { Measure, MeasureStatus, MeasurePriority } from '../../types/measures'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface AddMeasurePanelProps {
  isOpen: boolean
  onClose: () => void
  projects: StoredProjectTwinV2[]
  defaultProjectId?: string
  onMeasureCreated: (measure: Measure) => void
}

type WizardStep = 'input' | 'review'
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
  notes: ''
}

// KI-Strukturierung durchführen
async function analyzeWithAI(
  input: string,
  projectTitle: string
): Promise<Partial<MeasureFormData>> {
  const lowerInput = input.toLowerCase()
  
  // Priorität ermitteln
  let priority: MeasurePriority = 'medium'
  if (lowerInput.includes('kritisch') || lowerInput.includes('dringend') || lowerInput.includes('sofort')) {
    priority = 'critical'
  } else if (lowerInput.includes('wichtig') || lowerInput.includes('hoch') || lowerInput.includes('schnell')) {
    priority = 'high'
  } else if (lowerInput.includes('optional') || lowerInput.includes('niedrig') || lowerInput.includes('später')) {
    priority = 'low'
  }
  
  // Status ermitteln
  let status: MeasureStatus = 'open'
  if (lowerInput.includes('blockiert') || lowerInput.includes('wartet auf')) {
    status = 'blocked'
  } else if (lowerInput.includes('läuft') || lowerInput.includes('bearbeite')) {
    status = 'in_progress'
  } else if (lowerInput.includes('wartend') || lowerInput.includes('warte auf')) {
    status = 'waiting'
  }
  
  // Nutzwert schätzen
  let valueScore = 5
  if (priority === 'critical') valueScore = 9
  else if (priority === 'high') valueScore = 7
  else if (priority === 'low') valueScore = 3
  
  // Titel extrahieren (erster Satz oder bis zu 60 Zeichen)
  const title = input.split('.')[0].slice(0, 60) || input.slice(0, 60)
  
  // Beschreibung generieren
  const description = input.length > 60 ? input : `Maßnahme im Kontext ${projectTitle}: ${input}`
  
  // Frist extrahieren
  let dueDate = ''
  const today = new Date()
  if (lowerInput.includes('heute')) {
    dueDate = today.toISOString().split('T')[0]
  } else if (lowerInput.includes('morgen')) {
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    dueDate = tomorrow.toISOString().split('T')[0]
  } else if (lowerInput.includes('diese woche')) {
    const endOfWeek = new Date(today)
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()))
    dueDate = endOfWeek.toISOString().split('T')[0]
  } else if (lowerInput.includes('nächste woche')) {
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    dueDate = nextWeek.toISOString().split('T')[0]
  } else if (lowerInput.includes('bis freitag')) {
    const friday = new Date(today)
    const daysUntilFriday = (5 - friday.getDay() + 7) % 7 || 7
    friday.setDate(friday.getDate() + daysUntilFriday)
    dueDate = friday.toISOString().split('T')[0]
  }
  
  // Strategisches Ziel ableiten
  let strategicGoal = ''
  if (lowerInput.includes('finanzierung') || lowerInput.includes('budget') || lowerInput.includes('geld')) {
    strategicGoal = 'Finanzierung absichern'
  } else if (lowerInput.includes('vertrag') || lowerInput.includes('verhandlung')) {
    strategicGoal = 'Vertragslage klären'
  } else if (lowerInput.includes('termin') || lowerInput.includes('terminierung')) {
    strategicGoal = 'Terminierung sicherstellen'
  } else if (lowerInput.includes('entscheidung')) {
    strategicGoal = 'Entscheidungsgrundlage schaffen'
  }
  
  return {
    title,
    description,
    status,
    priority,
    valueScore,
    dueDate,
    strategicGoal
  }
}

export default function AddMeasurePanel({ 
  isOpen, 
  onClose, 
  projects, 
  defaultProjectId,
  onMeasureCreated
}: AddMeasurePanelProps) {
  const [step, setStep] = useState<WizardStep>('input')
  const [mode, setMode] = useState<InputMode>('quick')
  const [quickInput, setQuickInput] = useState('')
  const [formData, setFormData] = useState<MeasureFormData>(INITIAL_FORM_DATA)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [aiSuggestions, setAiSuggestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setStep('input')
      setMode('quick')
      setQuickInput('')
      setFormData({
        ...INITIAL_FORM_DATA,
        projectId: defaultProjectId || (projects[0]?.id ?? '')
      })
      setError(null)
      setValidationErrors([])
      setAiSuggestions(new Set())
    }
  }, [isOpen, defaultProjectId, projects])

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.projectId) errors.push('Projekt ist erforderlich')
    if (!formData.title.trim()) errors.push('Titel ist erforderlich')
    if (!formData.status) errors.push('Status ist erforderlich')
    if (!formData.priority) errors.push('Priorität ist erforderlich')

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleAIAnalyze = async () => {
    if (!quickInput.trim()) {
      setError('Bitte gib eine Beschreibung ein')
      return
    }

    if (!formData.projectId) {
      setError('Bitte wähle zuerst ein Projekt aus')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const project = projects.find(p => p.id === formData.projectId)
      if (!project) throw new Error('Projekt nicht gefunden')

      const aiResult = await analyzeWithAI(quickInput, project.title)
      
      setFormData(prev => ({
        ...prev,
        ...aiResult,
        projectId: prev.projectId,
        owner: prev.owner || '',
        notes: prev.notes || ''
      }))
      
      const suggested = new Set<string>(['title', 'description', 'status', 'priority', 'valueScore'])
      if (aiResult.dueDate) suggested.add('dueDate')
      if (aiResult.strategicGoal) suggested.add('strategicGoal')
      setAiSuggestions(suggested)
      
      setStep('review')
      setMode('structured')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der KI-Analyse')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    if (!validateForm()) return

    const measure: Measure = {
      id: `M-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      projectId: formData.projectId,
      projectTitle: projects.find(p => p.id === formData.projectId)?.title || '',
      title: formData.title,
      description: formData.description || undefined,
      status: formData.status,
      priority: formData.priority,
      dueDate: formData.dueDate || null,
      owner: formData.owner || 'Unassigned',
      valueScore: formData.valueScore,
      strategicGoal: formData.strategicGoal || undefined,
      notes: formData.notes || undefined,
      source: mode === 'quick' && step === 'review' ? 'ai_structured' : 'manual',
      createdAt: new Date().toISOString(),
      parentId: null
    }

    onMeasureCreated(measure)
    onClose()
  }

  const updateFormField = <K extends keyof MeasureFormData>(
    field: K, 
    value: MeasureFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setAiSuggestions(prev => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
    setValidationErrors(prev => prev.filter(e => !e.toLowerCase().includes(field.toLowerCase())))
  }

  const FieldBadge = ({ field }: { field: string }) => {
    if (!aiSuggestions.has(field)) return null
    return (
      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border border-violet-500/30">
        <Sparkles className="w-3 h-3 mr-1" />
        KI
      </span>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 
                       w-full sm:w-[90%] sm:max-w-2xl sm:max-h-[85vh]
                       bg-[var(--lp-surface)] rounded-2xl shadow-2xl z-50 
                       flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-[var(--lp-border)] bg-[var(--lp-surface)] shrink-0">
              <div>
                <h2 className="text-xl font-semibold text-[var(--lp-text)]">
                  {step === 'input' ? 'Neue Maßnahme' : 'Maßnahme überprüfen'}
                </h2>
                <p className="text-sm text-[var(--lp-muted)]">
                  {step === 'input' 
                    ? 'Strukturierte Arbeitsbausteine erstellen' 
                    : 'KI-Vorschläge prüfen und anpassen'}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-[var(--lp-surface-soft)] rounded-xl transition-colors"
                aria-label="Schließen"
              >
                <X className="w-5 h-5 text-[var(--lp-muted)]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                  Projekt <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => updateFormField('projectId', e.target.value)}
                  disabled={step === 'review'}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] focus:ring-1 focus:ring-[var(--lp-cobalt)] outline-none disabled:opacity-50"
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
              </div>

              {step === 'input' && (
                <>
                  <div className="flex p-1 gap-1 bg-[var(--lp-surface-soft)] rounded-xl">
                    <button
                      onClick={() => setMode('quick')}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        mode === 'quick' 
                          ? 'bg-[var(--lp-accent)] text-white shadow-md' 
                          : 'text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      Schnell mit KI
                    </button>
                    <button
                      onClick={() => setMode('structured')}
                      className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                        mode === 'structured' 
                          ? 'bg-[var(--lp-accent)] text-white shadow-md' 
                          : 'text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                      }`}
                    >
                      <FileText className="w-4 h-4 inline mr-2" />
                      Strukturiert
                    </button>
                  </div>

                  {mode === 'quick' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                          Was soll erledigt werden? <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          value={quickInput}
                          onChange={(e) => setQuickInput(e.target.value)}
                          placeholder="z.B. Bank wegen Finanzierungszusage anrufen"
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] focus:ring-1 focus:ring-[var(--lp-cobalt)] outline-none resize-none"
                        />
                        <p className="mt-2 text-xs text-[var(--lp-muted)]">
                          Beispiel: "Bank wegen Finanzierungszusage anrufen" oder "Termin mit Architekt bis Freitag"
                        </p>
                      </div>

                      <button
                        onClick={handleAIAnalyze}
                        disabled={isProcessing || !quickInput.trim() || !formData.projectId}
                        className="w-full py-3.5 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            KI analysiert...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Mit KI strukturieren
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                          Titel <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => updateFormField('title', e.target.value)}
                          placeholder="z.B. Budgetverfügbarkeit prüfen"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none"
                        />
                      </div>

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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                            Frist
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
                            Kümmerer
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
                    </div>
                  )}
                </>
              )}

              {step === 'review' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium text-violet-300">
                        KI hat die Maßnahme strukturiert
                      </span>
                    </div>
                    <p className="text-xs text-violet-400/80">
                      Alle Felder können bearbeitet werden. Änderungen entfernen den KI-Hinweis.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Titel <span className="text-rose-500">*</span>
                      <FieldBadge field="title" />
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => updateFormField('title', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Status <span className="text-rose-500">*</span>
                        <FieldBadge field="status" />
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
                        <FieldBadge field="priority" />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                        Frist
                        <FieldBadge field="dueDate" />
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
                        Kümmerer
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

                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Beschreibung
                      <FieldBadge field="description" />
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormField('description', e.target.value)}
                      rows={3}
                      placeholder="Details zur Maßnahme..."
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      <Target className="w-4 h-4 inline mr-1" />
                      Strategisches Ziel
                      <FieldBadge field="strategicGoal" />
                    </label>
                    <input
                      type="text"
                      value={formData.strategicGoal}
                      onChange={(e) => updateFormField('strategicGoal', e.target.value)}
                      placeholder="z.B. Finanzierung absichern"
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      <Flag className="w-4 h-4 inline mr-1" />
                      Nutzwert (1-10)
                      <FieldBadge field="valueScore" />
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
              )}

              {validationErrors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-medium text-rose-500">Bitte korrigiere:</span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-rose-400 space-y-1">
                    {validationErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </motion.div>
              )}

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

            <div className="p-5 border-t border-[var(--lp-border)] bg-[var(--lp-surface)] shrink-0">
              {step === 'input' && mode === 'structured' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Speichern
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-transparent border border-[var(--lp-border)] text-[var(--lp-muted)] rounded-xl font-medium hover:text-[var(--lp-text)] transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
              )}

              {step === 'review' && (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Speichern
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setStep('input')}
                    disabled={isProcessing}
                    className="flex-1 py-3 px-4 bg-[var(--lp-surface-soft)] border border-[var(--lp-border)] text-[var(--lp-text)] rounded-xl font-medium hover:bg-[var(--lp-surface)] transition-colors"
                  >
                    Zurück
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
