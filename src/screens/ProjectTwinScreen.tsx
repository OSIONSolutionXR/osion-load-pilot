import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  GitCommit,
  Brain,
  Clock,
  Zap,
  ChevronDown,
  AlertTriangle,
  Users,
  Target,
  Layers,
  AlertCircle,
  Plus,
  Play,
  ListTodo,
  GitBranch,
  Download,
  Share2,
  Shield
} from 'lucide-react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Badge } from '../components/ui/Badge'
import { ProcessPathPanel } from '../components/twin/ProcessPathPanel'
import RefineContextModal from '../components/twin/RefineContextModal'
import ActionDetailView from '../components/twin/ActionDetailView'
import { FadeIn } from '../components/animations/MicroAnimations'
import { generateContextQuestions } from '../lib/contextQuestions'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { ProjectAction, ProjectTwinAnalysis, ProjectActor, ProjectRisk, ProjectScenario } from '../types/projectTwin'
import { updateProjectTwin } from '../services/projectTwinUpdateApi'
import { collectValidContextAnswers, buildAdditionalInputFromValidated } from '../lib/collectValidContextAnswers'
import { normalizeProjectTwinUpdateResponse, buildUpdatedTwinFromResult } from '../services/projectTwinUpdateNormalizer'
import AddMeasurePanel from '../components/twin/AddMeasurePanel'
import MeasureExecutionPanel from '../components/twin/MeasureExecutionPanel'
import SimulationPanel from '../components/twin/SimulationPanel'
import { TwinSectionNav, type TwinModule } from '../components/twin/TwinSectionNav'
import type { Measure } from '../types/measures'
import MeasuresPanel from '../components/twin/MeasuresPanel'
import ExportDialog from '../components/twin/ExportDialog'
import IntegrationsPanel from '../components/twin/IntegrationsPanel'
import ContextQuestionsCard from '../components/twin/ContextQuestionsCard'

// Neue Interface für Twin-Öffnungs-Context
export interface TwinOpenContext {
  focus?: TwinModule
  highlightMeasureId?: string
  highlightActionId?: string
}

interface ProjectTwinScreenProps {
  onBack: () => void
  onNewInput?: () => void
  twin: StoredProjectTwin | null
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
  openContext?: TwinOpenContext  // Neue Prop für Command → Twin Verknüpfung
}

export default function ProjectTwinScreen({ onBack, onNewInput, twin, onTwinUpdate, openContext }: ProjectTwinScreenProps) {
  const [activeModule, setActiveModule] = useState<TwinModule>('process')
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [showAddMeasure, setShowAddMeasure] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showIntegrationsPanel, setShowIntegrationsPanel] = useState(false)
  const [showExecutionPanel, setShowExecutionPanel] = useState(false)
  const [selectedMeasure, setSelectedMeasure] = useState<Measure | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<ProjectAction | null>(null)
  const [showActionDetail, setShowActionDetail] = useState(false)

  const analysis = twin?.analysis ?? null

  // Apply openContext when provided (Command → Twin)
  useEffect(() => {
    if (openContext?.focus) {
      setActiveModule(openContext.focus)
    }
    if (openContext?.highlightMeasureId && twin?.measures) {
      const measure = twin.measures.find(m => m.id === openContext.highlightMeasureId)
      if (measure) {
        setSelectedMeasure(measure)
        setShowExecutionPanel(true)
      }
    }
  }, [openContext, twin])

  // Handler für Kontextfragen
  const handleUpdateWithAnswers = useCallback(async (answers: Record<string, string>) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)

    const questions = generateContextQuestions(
      analysis.quality.missingContext,
      twin.originalInput || '',
      analysis.project.type
    )
    const validatedAnswers = collectValidContextAnswers(answers, questions)

    try {
      const additionalInput = buildAdditionalInputFromValidated(validatedAnswers)
      if (!additionalInput.trim()) throw new Error('Keine gültigen Antworten gefunden.')

      const contextAnswers = validatedAnswers.map(({ questionId, label, answer, sourceMissingContext }) => ({
        questionId, label, answer, sourceMissingContext
      }))

      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers,
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })

      const normalized = normalizeProjectTwinUpdateResponse(response, twin, additionalInput)
      if (!normalized) throw new Error('Update fehlgeschlagen')
      const updatedTwin = buildUpdatedTwinFromResult(normalized, twin, additionalInput)
      if (!updatedTwin) throw new Error('Update fehlgeschlagen')
      onTwinUpdate?.(updatedTwin)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      setUpdateError(errorMsg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, onTwinUpdate, twin])

  // Handler für manuelles Update
  const handleManualUpdate = useCallback(async (additionalInput: string) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })

      const normalized = normalizeProjectTwinUpdateResponse(response, twin, additionalInput)
      if (!normalized) throw new Error('Update fehlgeschlagen')
      const updatedTwin = buildUpdatedTwinFromResult(normalized, twin, additionalInput)
      if (!updatedTwin) throw new Error('Update fehlgeschlagen')
      onTwinUpdate?.(updatedTwin)
      setShowRefineModal(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      setUpdateError(errorMsg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, onTwinUpdate, twin])

  // Handler für Projektfortschritt
  const handleProjectProgressUpdate = useCallback(async (progressInput: string) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput: progressInput.trim(),
        originalInput: twin.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })

      const normalized = normalizeProjectTwinUpdateResponse(response, twin, progressInput.trim())
      if (!normalized) throw new Error('Update fehlgeschlagen')
      const updatedTwin = buildUpdatedTwinFromResult(normalized, twin, progressInput.trim())
      if (!updatedTwin) throw new Error('Update fehlgeschlagen')
      onTwinUpdate?.(updatedTwin)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      setUpdateError(errorMsg)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, onTwinUpdate, twin])

  if (!analysis || !twin) {
    return (
      <div className="twin-page flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20">
            <AlertCircle className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--lp-text)] mb-2">Kein Project Twin geladen</h2>
          <p className="text-[var(--lp-muted)] mb-4">Wähle ein Projekt aus oder erfasse einen neuen Input.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={onBack} className="lp-button-secondary">
              Zurück zu Command
            </button>
            {onNewInput && (
              <button onClick={onNewInput} className="lp-button-primary">
                Neuen Input erfassen
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const { project, nextMove, actors, dependencies, risks, scenarios, actions } = analysis

  // Generate context questions - prefer existing questions from twin, fallback to generating from missingContext
  const contextQuestions = useMemo(() => {
    // First check if twin has existing context questions
    if (twin.contextQuestions && twin.contextQuestions.length > 0) {
      // Filter for open questions only
      const openQuestions = twin.contextQuestions.filter(q => q.status === 'open')
      if (openQuestions.length > 0) {
        return openQuestions
      }
    }
    // Fallback: generate from missingContext
    return generateContextQuestions(
      analysis.quality.missingContext,
      twin.originalInput || '',
      analysis.project.type
    )
  }, [twin.contextQuestions, analysis.quality.missingContext, twin.originalInput, analysis.project.type])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void contextQuestions

  // Next Action
  const nextActionTitle = nextMove?.title || 'Nächsten wirksamsten Schritt ableiten'
  const nextActionDescription = nextMove?.reason || 'Load Pilot priorisiert den nächsten Schritt auf Basis des aktuellen Project Twins.'

  // Handler für Action Click
  const handleActionClick = useCallback((action: ProjectAction) => {
    setSelectedAction(action)
    setShowActionDetail(true)
  }, [])

  return (
    <div className="twin-page">
      {/* Error Banner */}
      <AnimatePresence>
        {updateError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lp-card lp-card--padded border-l-4 border-l-rose-500 bg-rose-500/10 mb-6"
          >
            <p className="text-rose-400 text-sm">{updateError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <FadeIn>
        <div className="space-y-6">
          {/* 1. Project Header */}
          <section className="lp-card lp-card--padded">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg hover:bg-[var(--lp-surface-soft)] transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[var(--lp-muted)]" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-[var(--lp-text)]">{project.title}</h1>
                    <Badge variant={project.status === 'blocked' ? 'rose' : 'blue'}>
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-[var(--lp-muted)]">{project.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-[var(--lp-text)]">{twin.progress?.percent ?? 0}%</div>
                  <div className="text-xs text-[var(--lp-muted)]">Fortschritt</div>
                </div>
                <button onClick={() => setShowRefineModal(true)} className="lp-button-secondary text-sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Schärfen
                </button>
                <button 
                  onClick={() => setShowIntegrationsPanel(true)} 
                  className="lp-button-secondary text-sm"
                  title="Integrationen"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Teilen
                </button>
                <button 
                  onClick={() => setShowExportDialog(true)} 
                  className="lp-button-secondary text-sm"
                  title="Bericht erstellen"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </button>
              </div>
            </div>
          </section>

          {/* 2. Dynamic Process Path */}
          <ProcessPathPanel twin={twin} analysis={analysis} />

          {/* 3. Next Best Action */}
          <section className="lp-card lp-card--hero lp-card--accent">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-violet-400" />
                  <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">Next Best Action</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--lp-text)] mb-2">{nextActionTitle}</h2>
                <p className="text-[var(--lp-muted)] mb-4">{nextActionDescription}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="neutral">Wirkung: {nextMove?.impact || 'medium'}</Badge>
                  <Badge variant="neutral">Aufwand: {nextMove?.effort || 'medium'}</Badge>
                  {nextMove?.deadline && (
                    <Badge variant="amber">Frist: {new Date(nextMove.deadline).toLocaleDateString('de-DE')}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 md:self-center">
                {actions[0] && (
                  <button
                    onClick={() => handleActionClick(actions[0])}
                    className="lp-button-primary"
                  >
                    Aktion öffnen
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 4. Twin Section Navigation - Neue große Bereichsbuttons */}
          <TwinSectionNav
            activeSection={activeModule}
            onSectionChange={setActiveModule}
            analysis={analysis}
            twin={twin}
          />

          {/* 5. Active Module Panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeModule === 'process' && (
                <ProcessModule
                  dependencies={dependencies}
                  actors={actors}
                />
              )}
              {activeModule === 'questions' && (
                <QuestionsModule
                  twin={twin}
                  analysis={analysis}
                  onSubmitAnswers={handleUpdateWithAnswers}
                  isUpdating={isUpdating}
                  updateError={updateError}
                />
              )}
              {activeModule === 'measures' && (
                <MeasuresPanel
                  twin={twin}
                  onMeasureClick={(measure) => {
                    setSelectedMeasure(measure)
                    setShowExecutionPanel(true)
                  }}
                  onAddMeasure={() => setShowAddMeasure(true)}
                  onTwinUpdate={onTwinUpdate}
                />
              )}
              {activeModule === 'risks' && (
                <RisksModule risks={risks} />
              )}
              {activeModule === 'actions' && (
                <ActionsModule
                  actions={actions}
                  onActionClick={handleActionClick}
                  onAddMeasure={() => setShowAddMeasure(true)}
                  onExecuteMeasure={(action) => {
                    // Convert ProjectAction to Measure
                    const measure: Measure = {
                      id: `M-${twin?.id || 'unknown'}-${Date.now()}`,
                      projectId: twin?.id || '',
                      projectTitle: twin?.title || '',
                      title: action.title,
                      description: action.messageDraft || undefined,
                      status: 'open',
                      priority: action.priority === 'high' ? 'high' : action.priority === 'medium' ? 'medium' : 'low',
                      dueDate: null,
                      owner: action.owner || 'Unassigned',
                      valueScore: action.priority === 'high' ? 8 : action.priority === 'medium' ? 5 : 3,
                      source: 'twin_action',
                      createdAt: new Date().toISOString(),
                      parentId: null
                    }
                    setSelectedMeasure(measure)
                    setShowExecutionPanel(true)
                  }}
                />
              )}
              {activeModule === 'decisions' && (
                <DecisionsModule scenarios={scenarios} />
              )}
              {activeModule === 'memory' && (
                <MemoryModule twin={twin} />
              )}
              {activeModule === 'simulation' && (
                <SimulationPanel 
                  twin={twin}
                  onTwinUpdate={onTwinUpdate}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* 6. Project Continuation Box */}
          <section className="lp-card lp-card--padded">
            <div className="flex items-center gap-2 mb-4">
              <GitCommit className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-[var(--lp-text)]">Projektweiterführung</h3>
            </div>
            <p className="text-sm text-[var(--lp-muted)] mb-4">
              Dokumentiere den aktuellen Stand oder lass Load Pilot den nächsten Schritt ableiten.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const input = window.prompt('Was hat sich im Projekt verändert?')
                  if (input) handleProjectProgressUpdate(input)
                }}
                className="lp-button-secondary"
              >
                Fortschritt melden
              </button>
              <button
                onClick={() => {
                  const input = 'Leite auf Basis des aktuellen Project Twins den nächsten sinnvollsten Projektschritt ab.'
                  handleManualUpdate(input)
                }}
                disabled={isUpdating}
                className="lp-button-primary"
              >
                {isUpdating ? 'Analysiere...' : 'Nächsten Schritt ableiten'}
              </button>
            </div>
          </section>
        </div>
      </FadeIn>

      {/* Modals */}
      <RefineContextModal
        isOpen={showRefineModal}
        onClose={() => setShowRefineModal(false)}
        onSubmit={handleManualUpdate}
        projectTitle={project.title}
        isProcessing={isUpdating}
        error={updateError}
      />

      <ActionDetailView
        action={selectedAction}
        isOpen={showActionDetail}
        onClose={() => setShowActionDetail(false)}
        onStart={() => { }}
        onShowAlternatives={() => { }}
      />

      <AddMeasurePanel
        isOpen={showAddMeasure}
        onClose={() => setShowAddMeasure(false)}
        projects={twin ? [twin] : []}
        defaultProjectId={twin?.id}
        onMeasureCreated={(measure) => {
          // Maßnahme wurde erstellt
          console.log('Measure created:', measure)
        }}
      />

      <MeasureExecutionPanel
        isOpen={showExecutionPanel}
        onClose={() => {
          setShowExecutionPanel(false)
          setSelectedMeasure(null)
        }}
        measure={selectedMeasure}
        project={twin}
        onExecutionCreated={(execution) => {
          console.log('Execution created:', execution)
        }}
        onTwinUpdate={onTwinUpdate}
        onOpenIntegrations={() => setShowIntegrationsPanel(true)}
      />

      {/* Integrations Panel */}
      <IntegrationsPanel
        isOpen={showIntegrationsPanel}
        onClose={() => setShowIntegrationsPanel(false)}
        twin={twin}
        selectedMeasure={selectedMeasure}
      />

      {/* Export Dialog */}
      <ExportDialog
        twin={twin}
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  )
}

// Questions Module
function QuestionsModule({ twin, analysis, onSubmitAnswers, isUpdating, updateError }: {
  twin: StoredProjectTwin
  analysis: ProjectTwinAnalysis
  onSubmitAnswers: (answers: Record<string, string>) => Promise<void>
  isUpdating: boolean
  updateError: string | null
}) {
  // Generate context questions
  const contextQuestions = useMemo(() => {
    if (twin.contextQuestions && twin.contextQuestions.length > 0) {
      const openQuestions = twin.contextQuestions.filter(q => q.status === 'open')
      if (openQuestions.length > 0) {
        return openQuestions
      }
    }
    return generateContextQuestions(
      analysis.quality.missingContext,
      twin.originalInput || '',
      analysis.project.type
    )
  }, [twin.contextQuestions, analysis.quality.missingContext, twin.originalInput, analysis.project.type])

  if (contextQuestions.length === 0) {
    return (
      <section className="lp-card lp-card--padded text-center py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <Brain className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-2">Keine offenen Fragen</h3>
        <p className="text-[var(--lp-muted)] max-w-md mx-auto">
          Der Project Twin ist aktuell geschärft. Alle relevanten Kontextfragen wurden beantwortet.
        </p>
      </section>
    )
  }

  return (
    <ContextQuestionsCard
      questions={contextQuestions}
      missingContext={analysis.quality.missingContext}
      confidence={analysis.quality.confidence}
      onSubmitAnswers={onSubmitAnswers}
      isUpdating={isUpdating}
      updateError={updateError}
    />
  )
}

// Process Module
function ProcessModule({ dependencies, actors }: {
  dependencies: ProjectTwinAnalysis['dependencies']
  actors: ProjectActor[]
}) {
  const blockers = dependencies.filter(d => d.isBlocker)
  const required = dependencies.filter(d => d.status === 'required' && !d.isBlocker)
  const done = dependencies.filter(d => d.status === 'done')
  const waiting = dependencies.filter(d => d.status === 'waiting')

  return (
    <section className="lp-card lp-card--padded">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-[var(--lp-text)]">Prozessübersicht</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ProcessStat label="Kritisch / Blockiert" value={blockers.length} color="rose" icon={AlertTriangle} />
        <ProcessStat label="Erforderlich" value={required.length} color="amber" icon={Target} />
        <ProcessStat label="Wartend" value={waiting.length} color="zinc" icon={Clock} />
        <ProcessStat label="Erledigt" value={done.length} color="emerald" icon={GitCommit} />
      </div>

      {blockers.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <h4 className="text-sm font-medium text-rose-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Aktive Blocker
          </h4>
          <div className="space-y-2">
            {blockers.map((dep, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-rose-500/10 last:border-0">
                <div>
                  <div className="font-medium text-[var(--lp-text)]">{dep.from}</div>
                  <div className="text-sm text-[var(--lp-muted)]">{dep.explanation}</div>
                </div>
                <Badge variant="rose">Blockiert</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--lp-muted)] uppercase tracking-wider">Beteiligte Akteure</h4>
        <div className="flex flex-wrap gap-2">
          {actors.map((actor, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--lp-surface-soft)] text-sm">
              <Users className="w-3.5 h-3.5 text-[var(--lp-muted)]" />
              <span className="text-[var(--lp-text)]">{actor.name}</span>
              <span className="text-[var(--lp-muted)]">({actor.role})</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProcessStat({ label, value, color, icon: Icon }: {
  label: string
  value: number
  color: 'rose' | 'amber' | 'zinc' | 'emerald'
  icon: typeof AlertTriangle
}) {
  const colors = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

// Risks Module
function RisksModule({ risks }: { risks: ProjectRisk[] }) {
  const critical = risks.filter(r => r.severity === 'high')
  const relevant = risks.filter(r => r.severity === 'medium')
  const observe = risks.filter(r => r.severity === 'low')

  return (
    <section className="lp-card lp-card--padded">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-[var(--lp-text)]">Risk Radar</h3>
        </div>
        <Badge variant="neutral">{risks.length} Risiken</Badge>
      </div>

      {/* Risk Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <RiskCategory title="Kritisch" count={critical.length} color="rose" risks={critical} />
        <RiskCategory title="Relevant" count={relevant.length} color="amber" risks={relevant} />
        <RiskCategory title="Beobachten" count={observe.length} color="zinc" risks={observe} />
      </div>

      {/* Risk Matrix Placeholder */}
      <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
        <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-4">Risikomatrix (Coming Soon)</h4>
        <div className="aspect-video bg-[var(--lp-surface)] rounded-lg flex items-center justify-center">
          <div className="text-center text-[var(--lp-muted)]">
            <Shield className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <span className="text-sm">Visuelle Risikoanalyse</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function RiskCategory({ title, count, color, risks }: {
  title: string
  count: number
  color: 'rose' | 'amber' | 'zinc'
  risks: ProjectRisk[]
}) {
  const colors = {
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    zinc: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
  }

  return (
    <div className={`p-4 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium">{title}</span>
        <span className="text-lg font-bold">{count}</span>
      </div>
      <div className="space-y-2">
        {risks.slice(0, 3).map((risk, i) => (
          <div key={i} className="text-sm truncate opacity-80">{risk.title}</div>
        ))}
        {risks.length > 3 && (
          <div className="text-xs opacity-60">+{risks.length - 3} weitere</div>
        )}
      </div>
    </div>
  )
}

// Actions Module
function ActionsModule({ actions, onActionClick, onAddMeasure, onExecuteMeasure }: {
  actions: ProjectTwinAnalysis['actions']
  onActionClick: (action: ProjectAction) => void
  onAddMeasure?: () => void
  onExecuteMeasure?: (action: ProjectAction) => void
}) {
  return (
    <section className="lp-card lp-card--padded">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-semibold text-[var(--lp-text)]">Maßnahmen</h3>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="neutral">{actions.length} Maßnahmen</Badge>
          {onAddMeasure && (
            <button
              onClick={onAddMeasure}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Neue Maßnahme
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {actions.map((action, i) => (
          <motion.div
            key={i}
            whileHover={{ x: 4 }}
            className="p-4 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-violet-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => onActionClick(action)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-[var(--lp-text)]">{action.title}</span>
                  <Badge variant={action.priority === 'high' ? 'rose' : action.priority === 'medium' ? 'amber' : 'neutral'}>
                    {action.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--lp-muted)]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {action.owner}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onExecuteMeasure && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onExecuteMeasure(action)
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[var(--lp-cobalt)] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Play className="w-3 h-3" />
                    Ausführen
                  </button>
                )}
                <ChevronDown className="w-4 h-4 text-[var(--lp-muted)] -rotate-90 cursor-pointer" onClick={() => onActionClick(action)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// Decisions Module
function DecisionsModule({ scenarios }: { scenarios: ProjectScenario[] }) {
  return (
    <section className="lp-card lp-card--padded">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-[var(--lp-text)]">Entscheidungsoptionen</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
                {i + 1}
              </div>
              <Badge variant="neutral">{scenario.riskLevel} Risiko</Badge>
            </div>
            <h4 className="font-medium text-[var(--lp-text)] mb-2">{scenario.title}</h4>
            <p className="text-sm text-[var(--lp-muted)] mb-3">{scenario.outcome}</p>
            <div className="text-xs text-[var(--lp-muted)]">
              <span className="text-violet-400">Empfehlung:</span> {scenario.recommendation}
            </div>
          </motion.div>
        ))}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-8 text-[var(--lp-muted)]">
          Noch keine Entscheidungsszenarien erfasst.
        </div>
      )}
    </section>
  )
}

// Memory Module
function MemoryModule({ twin }: { twin: StoredProjectTwin }) {
  return (
    <section className="lp-card lp-card--padded">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-[var(--lp-text)]">Project Twin Memory</h3>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)]">
          <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">Projekttyp</h4>
          <p className="text-[var(--lp-text)]">{twin.analysis?.project?.type || 'Nicht spezifiziert'}</p>
        </div>

        <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)]">
          <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">Qualitätsscore</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${(twin.analysis?.quality?.confidence === 'high' ? 100 : twin.analysis?.quality?.confidence === 'medium' ? 60 : 30)}%` }}
              />
            </div>
            <span className="text-sm text-[var(--lp-text)]">
              {twin.analysis?.quality?.confidence === 'high' ? 'Hoch' : twin.analysis?.quality?.confidence === 'medium' ? 'Mittel' : 'Niedrig'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)]">
          <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">Fehlender Kontext</h4>
          <div className="flex flex-wrap gap-2">
            {twin.analysis?.quality?.missingContext?.map((ctx, i) => (
              <span key={i} className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
                {ctx}
              </span>
            )) || <span className="text-sm text-[var(--lp-muted)]">Keine offenen Fragen</span>}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)]">
          <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">Update-Verlauf</h4>
          <p className="text-sm text-[var(--lp-text)]">{twin.updates?.length || 0} Updates seit Erstellung</p>
        </div>
      </div>
    </section>
  )
}
