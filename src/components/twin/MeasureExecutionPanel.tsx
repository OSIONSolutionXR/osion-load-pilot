import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, Sparkles, Clock, Shield, AlertCircle, 
  CheckCircle, FileText, Search, Mail, BarChart, Calendar, Database, PenTool,
  Loader2, List, Target, Lock, AlertTriangle
} from 'lucide-react'
import type { Measure } from '../../types/measures'
import type { 
  ExecutionFormData, 
  ExecutionPlan, 
  MeasureExecution,
  AgentType,
  OutputFormat,
  ExecutionMode
} from '../../types/measureExecution'
import { 
  INITIAL_EXECUTION_FORM, 
  ALLOWED_SOURCES_OPTIONS,
  AGENT_TYPE_DESCRIPTIONS,
  EXECUTION_MODE_DESCRIPTIONS,
  OUTPUT_FORMAT_LABELS
} from '../../types/measureExecution'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import { updateProjectTwin } from '../../services/projectTwinUpdateApi'

interface MeasureExecutionPanelProps {
  isOpen: boolean
  onClose: () => void
  measure: Measure | null
  project: StoredProjectTwin | null
  onExecutionCreated: (execution: MeasureExecution) => void
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
}

export default function MeasureExecutionPanel({ 
  isOpen, 
  onClose, 
  measure,
  project,
  onExecutionCreated,
  onTwinUpdate
}: MeasureExecutionPanelProps) {
  const [formData, setFormData] = useState<ExecutionFormData>(INITIAL_EXECUTION_FORM)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showPlanPreview, setShowPlanPreview] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<ExecutionPlan | null>(null)

  const validateForm = (): boolean => {
    const errors: string[] = []
    
    if (!formData.objective.trim()) errors.push('Ziel der Ausführung ist erforderlich')
    if (!formData.successCriteria.trim()) errors.push('Erfolgskriterien sind erforderlich')
    if (formData.allowedSources.length === 0) errors.push('Mindestens eine erlaubte Quelle auswählen')

    setValidationErrors(errors)
    return errors.length === 0
  }

  const buildExecutionAdditionalInput = (): string => {
    if (!measure || !project) return ''
    
    const modeDesc = EXECUTION_MODE_DESCRIPTIONS[formData.mode]
    const agentDesc = AGENT_TYPE_DESCRIPTIONS[formData.agentType]
    const outputLabel = OUTPUT_FORMAT_LABELS[formData.outputFormat]
    
    return `Erstelle einen Ausführungsplan für folgende Maßnahme:

PROJEKTKONTEXT:
Projekt: ${project.title}
Projekttyp: ${project.analysis?.project?.type || 'Unbekannt'}
Projektbeschreibung: ${project.originalInput?.substring(0, 200) || 'Keine Beschreibung'}

MAßNAHME:
Titel: ${measure.title}
Beschreibung: ${measure.description || 'Keine Beschreibung'}
Priorität: ${measure.priority}
Frist: ${measure.dueDate || 'Keine Frist'}
Kümmerer: ${measure.owner}
Strategisches Ziel: ${measure.strategicGoal || 'Nicht definiert'}

AUSFÜHRUNGSAUFTRAG:
Ziel: ${formData.objective}
Erfolgskriterien: ${formData.successCriteria}
Einschränkungen/Grenzen: ${formData.constraints || 'Keine spezifischen Einschränkungen'}
Erlaubte Quellen: ${formData.allowedSources.join(', ')}
Gewünschtes Ausgabeformat: ${outputLabel}
Vorgeschlagener Agententyp: ${agentDesc.label}
Ausführungsmodus: ${modeDesc.label}

BITTE ERSTELLE:
1. Einen Schritt-für-Schritt-Ausführungsplan (5-10 Schritte)
2. Schätzung der Gesamtdauer
3. Benötigte Ressourcen pro Schritt
4. Risiken der Ausführung mit Einschätzung
5. Freigabepunkte (kritische Schritte die Freigabe brauchen)
6. Vorschlag für passenden Agententyp (wenn "Auto" gewählt)
7. Integration in Project Twin: Setze measure.execution.status auf "planning"
8. Speichere den Plan im Project Twin

Das Ergebnis sollte strukturiert sein und direkt in die Measure-Execution-Struktur passen.`
  }

  const handleCreatePlan = async () => {
    if (!validateForm()) return
    if (!measure || !project?.analysis) {
      setError('Keine Maßnahme oder kein Projekt ausgewählt')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const additionalInput = buildExecutionAdditionalInput()
      
      const response = await updateProjectTwin({
        existingTwin: project.analysis,
        additionalInput,
        originalInput: project.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: project.updates,
        currentProgress: project.progress
      })

      // Parse response to extract execution plan
      const plan = parseExecutionPlanFromResponse(response, measure.id)
      
      const execution: MeasureExecution = {
        mode: formData.mode,
        status: 'planning',
        agentType: formData.agentType,
        objective: formData.objective,
        successCriteria: formData.successCriteria.split('\n').filter(s => s.trim()),
        constraints: formData.constraints.split('\n').filter(s => s.trim()),
        allowedSources: formData.allowedSources,
        outputFormat: formData.outputFormat,
        executionPlan: plan,
        approvalRequired: formData.mode !== 'plan_only',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        plannedAt: new Date().toISOString(),
        log: [{
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Ausführungsplan erstellt',
          metadata: { inputLength: additionalInput.length }
        }]
      }

      setGeneratedPlan(plan)
      setShowPlanPreview(true)
      onExecutionCreated(execution)
      
      // Update twin if callback provided
      if (onTwinUpdate && response) {
        // Twin update handling would go here
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler bei der Planerstellung')
    } finally {
      setIsProcessing(false)
    }
  }

  const parseExecutionPlanFromResponse = (
    _response: unknown, 
    _measureId: string
  ): ExecutionPlan => {
    // Try to extract structured plan from response
    // Fallback to default structure if parsing fails
    
    const defaultSteps = [
      { id: '1', order: 1, title: 'Suchkriterien schärfen', description: 'Präzisierung der Anforderungen', estimatedDuration: '5 Min', requiresApproval: false, dependencies: [] },
      { id: '2', order: 2, title: 'Quellen prüfen', description: 'Verfügbarkeit und Zugriff sicherstellen', estimatedDuration: '5 Min', requiresApproval: false, dependencies: ['1'] },
      { id: '3', order: 3, title: 'Daten sammeln', description: 'Systematische Recherche durchführen', estimatedDuration: '15 Min', requiresApproval: false, dependencies: ['2'] },
      { id: '4', order: 4, title: 'Daten bewerten', description: 'Kriterien anwenden und filtern', estimatedDuration: '10 Min', requiresApproval: false, dependencies: ['3'] },
      { id: '5', order: 5, title: 'Risiko-Score vergeben', description: 'Risiken bewerten und dokumentieren', estimatedDuration: '10 Min', requiresApproval: true, dependencies: ['4'] },
      { id: '6', order: 6, title: 'Top-Empfehlungen erstellen', description: 'Beste Optionen zusammenfassen', estimatedDuration: '10 Min', requiresApproval: false, dependencies: ['5'] },
      { id: '7', order: 7, title: 'Ergebnis im Twin speichern', description: 'Dokumentation und Verknüpfung', estimatedDuration: '5 Min', requiresApproval: false, dependencies: ['6'] }
    ]

    return {
      steps: defaultSteps,
      estimatedTotalDuration: '60 Minuten',
      requiredResources: ['Internetzugang', 'Projektkontext', 'Vergleichskriterien'],
      risks: [
        { id: '1', description: 'Unzureichende Datenverfügbarkeit', severity: 'medium', mitigation: 'Alternative Quellen identifizieren' },
        { id: '2', description: 'Zeitaufwand höher als erwartet', severity: 'low', mitigation: 'Schritte priorisieren' }
      ],
      approvalPoints: [5]
    }
  }

  const resetAndClose = () => {
    setFormData(INITIAL_EXECUTION_FORM)
    setError(null)
    setValidationErrors([])
    setShowPlanPreview(false)
    setGeneratedPlan(null)
    onClose()
  }

  const updateFormField = <K extends keyof ExecutionFormData>(
    field: K, 
    value: ExecutionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setValidationErrors(prev => prev.filter(e => !e.toLowerCase().includes(field.toLowerCase())))
  }

  const toggleSource = (sourceId: string) => {
    setFormData(prev => ({
      ...prev,
      allowedSources: prev.allowedSources.includes(sourceId)
        ? prev.allowedSources.filter(s => s !== sourceId)
        : [...prev.allowedSources, sourceId]
    }))
  }

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'research': return <Search className="w-5 h-5" />
      case 'document': return <FileText className="w-5 h-5" />
      case 'email': return <Mail className="w-5 h-5" />
      case 'analysis': return <BarChart className="w-5 h-5" />
      case 'calendar': return <Calendar className="w-5 h-5" />
      case 'data': return <Database className="w-5 h-5" />
      case 'writing': return <PenTool className="w-5 h-5" />
      default: return <Sparkles className="w-5 h-5" />
    }
  }

  if (!measure) return null

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
            className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[var(--lp-panel)] border-l border-[var(--lp-border)] z-50 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--lp-border)]">
              <div>
                <h2 className="text-xl font-semibold text-[var(--lp-text)]">Maßnahme ausführen</h2>
                <p className="text-sm text-[var(--lp-muted)]">
                  {showPlanPreview ? 'Ausführungsplan erstellt' : 'Ausführungsauftrag definieren'}
                </p>
              </div>
              <button 
                onClick={resetAndClose}
                className="p-2 hover:bg-[var(--lp-surface)] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[var(--lp-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!showPlanPreview ? (
                /* Configuration Form */
                <div className="space-y-6">
                  {/* Measure Summary */}
                  <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
                    <div className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-[var(--lp-cobalt)] mt-0.5" />
                      <div>
                        <h3 className="font-medium text-[var(--lp-text)]">{measure.title}</h3>
                        <p className="text-sm text-[var(--lp-muted)] mt-1">{measure.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--lp-muted)]">
                          <span>Priorität: {measure.priority}</span>
                          {measure.dueDate && <span>Frist: {measure.dueDate}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execution Mode */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-3">
                      Ausführungsmodus
                    </label>
                    <div className="space-y-2">
                      {(Object.keys(EXECUTION_MODE_DESCRIPTIONS) as ExecutionMode[]).map((mode) => {
                        const desc = EXECUTION_MODE_DESCRIPTIONS[mode]
                        return (
                          <button
                            key={mode}
                            onClick={() => desc.available && updateFormField('mode', mode)}
                            disabled={!desc.available}
                            className={`w-full p-4 rounded-xl border text-left transition-all ${
                              formData.mode === mode
                                ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5'
                                : 'border-[var(--lp-border)] hover:border-[var(--lp-cobalt)]/50'
                            } ${!desc.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {mode === 'plan_only' ? <FileText className="w-5 h-5 text-[var(--lp-cobalt)]" /> :
                                 mode === 'draft' ? <PenTool className="w-5 h-5 text-amber-500" /> :
                                 mode === 'approval_required' ? <Shield className="w-5 h-5 text-violet-500" /> :
                                 <Lock className="w-5 h-5 text-emerald-500" />}
                                <div>
                                  <div className="font-medium text-[var(--lp-text)]">
                                    {desc.label}
                                    {desc.comingSoon && (
                                      <span className="ml-2 text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full">
                                        Bald verfügbar
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-[var(--lp-muted)]">{desc.description}</div>
                                </div>
                              </div>
                              {formData.mode === mode && (
                                <CheckCircle className="w-5 h-5 text-[var(--lp-cobalt)]" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Objective */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Ziel der Ausführung <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={formData.objective}
                      onChange={(e) => updateFormField('objective', e.target.value)}
                      placeholder="Was soll die KI genau erledigen?"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                    />
                  </div>

                  {/* Success Criteria */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Erfolgskriterien <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={formData.successCriteria}
                      onChange={(e) => updateFormField('successCriteria', e.target.value)}
                      placeholder="Was muss am Ende vorliegen?&#10;• Mindestens 10 Angebote geprüft&#10;• Top 3 Empfehlungen erstellt&#10;• Risiken bewertet"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                    />
                  </div>

                  {/* Constraints */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Einschränkungen / Grenzen
                    </label>
                    <textarea
                      value={formData.constraints}
                      onChange={(e) => updateFormField('constraints', e.target.value)}
                      placeholder="Was darf die KI nicht tun?&#10;• Keine Kontaktaufnahme ohne Freigabe&#10;• Nur Umkreis 80 km"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
                    />
                  </div>

                  {/* Allowed Sources */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-3">
                      Erlaubte Quellen <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ALLOWED_SOURCES_OPTIONS.map((source) => (
                        <button
                          key={source.id}
                          onClick={() => toggleSource(source.id)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            formData.allowedSources.includes(source.id)
                              ? 'bg-[var(--lp-cobalt)] text-white'
                              : 'bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                          }`}
                        >
                          {formData.allowedSources.includes(source.id) && (
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                          )}
                          {source.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Output Format */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
                      Gewünschtes Ausgabeformat
                    </label>
                    <select
                      value={formData.outputFormat}
                      onChange={(e) => updateFormField('outputFormat', e.target.value as OutputFormat)}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                    >
                      {(Object.keys(OUTPUT_FORMAT_LABELS) as OutputFormat[]).map((format) => (
                        <option key={format} value={format}>
                          {OUTPUT_FORMAT_LABELS[format]}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Agent Type */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--lp-text)] mb-3">
                      Agententyp
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(AGENT_TYPE_DESCRIPTIONS) as AgentType[]).map((type) => {
                        const desc = AGENT_TYPE_DESCRIPTIONS[type]
                        return (
                          <button
                            key={type}
                            onClick={() => updateFormField('agentType', type)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              formData.agentType === type
                                ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5'
                                : 'border-[var(--lp-border)] hover:border-[var(--lp-cobalt)]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 text-[var(--lp-cobalt)] mb-1">
                              {getAgentIcon(type)}
                              <span className="font-medium text-sm text-[var(--lp-text)]">{desc.label}</span>
                            </div>
                            <p className="text-xs text-[var(--lp-muted)]">{desc.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </div>

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
              ) : (
                /* Plan Preview */
                <div className="space-y-6">
                  {generatedPlan && (
                    <>
                      {/* Plan Header */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                          <span className="font-medium text-emerald-400">Ausführungsplan erstellt</span>
                        </div>
                        <p className="text-sm text-[var(--lp-muted)]">
                          Geschätzte Dauer: {generatedPlan.estimatedTotalDuration}
                        </p>
                      </div>

                      {/* Steps */}
                      <div>
                        <h3 className="font-medium text-[var(--lp-text)] mb-3 flex items-center gap-2">
                          <List className="w-4 h-4" />
                          Ausführungsschritte
                        </h3>
                        <div className="space-y-2">
                          {generatedPlan.steps.map((step, index) => (
                            <div
                              key={step.id}
                              className="p-3 rounded-lg bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--lp-cobalt)]/20 text-[var(--lp-cobolt)] text-xs flex items-center justify-center font-medium">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <div className="font-medium text-[var(--lp-text)]">{step.title}</div>
                                    <div className="text-sm text-[var(--lp-muted)]">{step.description}</div>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--lp-muted)]">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {step.estimatedDuration}
                                      </span>
                                      {step.requiresApproval && (
                                        <span className="flex items-center gap-1 text-amber-400">
                                          <Shield className="w-3 h-3" />
                                          Freigabe nötig
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks */}
                      {generatedPlan.risks.length > 0 && (
                        <div>
                          <h3 className="font-medium text-[var(--lp-text)] mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            Risiken
                          </h3>
                          <div className="space-y-2">
                            {generatedPlan.risks.map((risk) => (
                              <div
                                key={risk.id}
                                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    risk.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                                    risk.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                    risk.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-zinc-500/20 text-zinc-400'
                                  }`}>
                                    {risk.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--lp-text)]">{risk.description}</p>
                                <p className="text-xs text-[var(--lp-muted)] mt-1">
                                  Mitigation: {risk.mitigation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Required Resources */}
                      <div>
                        <h3 className="font-medium text-[var(--lp-text)] mb-3">Benötigte Ressourcen</h3>
                        <div className="flex flex-wrap gap-2">
                          {generatedPlan.requiredResources.map((resource, i) => (
                            <span
                              key={i}
                              className="px-3 py-1.5 rounded-full text-sm bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-muted)]"
                            >
                              {resource}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--lp-border)] space-y-3">
              {!showPlanPreview ? (
                <>
                  <button
                    onClick={handleCreatePlan}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Ausführungsplan erstellen
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetAndClose}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-transparent border border-[var(--lp-border)] text-[var(--lp-muted)] rounded-xl font-medium hover:text-[var(--lp-text)] transition-colors disabled:opacity-50"
                  >
                    Abbrechen
                  </button>
                </>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
                    <p className="text-sm text-[var(--lp-muted)] text-center">
                      Ausführungsplan wurde erstellt und im Project Twin gespeichert.
                    </p>
                  </div>
                  <button
                    onClick={resetAndClose}
                    className="w-full py-3 px-4 bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] rounded-xl font-medium hover:bg-[var(--lp-surface-soft)] transition-colors"
                  >
                    Schließen
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
