import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Play, Users, Target, MessageSquare, AlertTriangle,
  CheckCircle, ChevronDown, ChevronRight, Loader2, Search,
  TrendingUp, Brain, FileText, Lightbulb, AlertOctagon, PieChart, UserCircle, MessageCircle
} from 'lucide-react'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import type {
  SimulationConfig,
  SimulationRun,
  SimulationGoal,
  SimulationAgent,
  SimulationResultTab
} from '../../types/simulation'
import {
  SIMULATION_GOAL_LABELS,
  INITIAL_POSITION_LABELS,
  COMMUNICATION_STYLE_LABELS,
  KNOWLEDGE_LEVEL_LABELS,
  AGENT_ARCHETYPE_LABELS
} from '../../types/simulation'
import { Badge } from '../ui/Badge'
import { buildSimulationInput, validateSimulationConfig, createFallbackSimulationRun } from '../../lib/simulationBuilder'
import { updateProjectTwin } from '../../services/projectTwinUpdateApi'
import {
  normalizeProjectTwinUpdateResponse,
  buildUpdatedTwinFromResult
} from '../../services/projectTwinUpdateNormalizer'

interface SimulatorModuleProps {
  twin: StoredProjectTwin | null
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
}

const SIMULATION_GOALS: SimulationGoal[] = [
  'market_reaction',
  'target_group_reaction',
  'risk_development',
  'measure_effectiveness',
  'decision_consequences',
  'price_acceptance',
  'media_reaction',
  'project_performance',
  'success_probability',
  'difficulty_simulation',
  'custom_scenario'
]

const FOCUS_AREAS_OPTIONS = [
  'Marktpositionierung',
  'Kundenakzeptanz',
  'Wettbewerbsreaktion',
  'Kosten-Nutzen',
  'Zeitplan',
  'Ressourcen',
  'Risiken',
  'Chancen',
  'Stakeholder',
  'Regulatorik'
]

export default function SimulatorModule({ twin, onTwinUpdate }: SimulatorModuleProps) {
  // Configuration state
  const [config, setConfig] = useState<SimulationConfig>({
    goal: 'success_probability',
    question: '',
    agentCount: 100,
    roundCount: 5,
    focusAreas: []
  })

  // Simulation state
  const [currentRun, setCurrentRun] = useState<SimulationRun | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // UI state
  const [activeTab, setActiveTab] = useState<SimulationResultTab>('overview')
  const [selectedAgent, setSelectedAgent] = useState<SimulationAgent | null>(null)
  const [expandedRounds, setExpandedRounds] = useState<number[]>([1])
  const [agentFilter, setAgentFilter] = useState('')

  const validateAndStart = async () => {
    const validation = validateSimulationConfig(config)
    if (!validation.valid) {
      setValidationErrors(validation.errors)
      return
    }

    if (!twin?.analysis) {
      setError('Kein Project Twin verfügbar')
      return
    }

    setIsRunning(true)
    setError(null)
    setValidationErrors([])

    try {
      const additionalInput = buildSimulationInput({
        activeTwin: twin,
        simulationConfig: config
      })

      const response = await updateProjectTwin({
        existingTwin: twin.analysis,
        additionalInput,
        originalInput: twin.originalInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })

      // Parse response
      let simulationRun: SimulationRun | null = null

      if (response && typeof response === 'object') {
        // Try to extract simulationRun from response
        const anyResponse = response as Record<string, unknown>
        const simRun = anyResponse.simulationRun || (anyResponse.analysis as Record<string, unknown>)?.simulationRun
        if (simRun) {
          simulationRun = simRun as SimulationRun
        }
      }

      if (!simulationRun) {
        // Fallback: Create a basic simulation run
        simulationRun = createFallbackSimulationRun(config)
        simulationRun.status = 'completed'
        // Try to parse from text response if needed
        if (typeof response === 'string') {
          try {
            const parsed = JSON.parse(response)
            if (parsed.simulationRun) {
              simulationRun = parsed.simulationRun
            }
          } catch {
            // Keep fallback
          }
        }
      }

      setCurrentRun(simulationRun)

      // Update twin if callback provided
      if (onTwinUpdate && twin) {
        const normalized = normalizeProjectTwinUpdateResponse(response, twin, additionalInput)
        if (normalized) {
          const updatedTwin = buildUpdatedTwinFromResult(normalized, twin, additionalInput)
          if (updatedTwin) {
            // Add simulation run to twin
            if (!updatedTwin.simulationRuns) {
              updatedTwin.simulationRuns = []
            }
            if (simulationRun) {
              updatedTwin.simulationRuns.push(simulationRun)
              onTwinUpdate(updatedTwin)
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simulation fehlgeschlagen')
      // Create fallback run on error
      const fallbackRun = createFallbackSimulationRun(config)
      setCurrentRun(fallbackRun)
    } finally {
      setIsRunning(false)
    }
  }

  const toggleFocusArea = (area: string) => {
    setConfig(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }))
  }

  const toggleRound = (round: number) => {
    setExpandedRounds(prev =>
      prev.includes(round)
        ? prev.filter(r => r !== round)
        : [...prev, round]
    )
  }

  const filteredAgents = currentRun?.agents.filter(agent =>
    agent.displayName.toLowerCase().includes(agentFilter.toLowerCase()) ||
    agent.archetype.toLowerCase().includes(agentFilter.toLowerCase()) ||
    agent.role.toLowerCase().includes(agentFilter.toLowerCase())
  ) || []

  const renderStartScreen = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--lp-cobalt)] to-[var(--lp-teal)] mb-4">
          <Brain className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--lp-text)] mb-2">Project Simulator</h2>
        <p className="text-[var(--lp-muted)] max-w-xl mx-auto">
          Simuliere Dein Projekt mit mindestens 100 synthetischen Agenten.
          Die Agenten werden aus dem aktuellen Project Twin erzeugt und diskutieren
          projektbezogen über Chancen, Risiken, Einwände und mögliche Entwicklungen.
        </p>
      </div>

      {/* Configuration Form */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Simulation Goal */}
        <div>
          <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
            Simulationsziel <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {SIMULATION_GOALS.map(goal => (
              <button
                key={goal}
                onClick={() => setConfig(prev => ({ ...prev, goal }))}
                className={`p-3 rounded-lg border text-left text-sm transition-all ${
                  config.goal === goal
                    ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5 text-[var(--lp-text)]'
                    : 'border-[var(--lp-border)] text-[var(--lp-muted)] hover:border-[var(--lp-cobalt)]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {config.goal === goal && <CheckCircle className="w-4 h-4 text-[var(--lp-cobalt)]" />}
                  <span>{SIMULATION_GOAL_LABELS[goal]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Question */}
        <div>
          <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
            Simulationsfrage <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={config.question}
            onChange={(e) => setConfig(prev => ({ ...prev, question: e.target.value }))}
            placeholder="z.B. Wie wird die Zielgruppe auf unser neues Angebot reagieren?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
          />
        </div>

        {/* Agent Count & Rounds */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
              Agentenanzahl <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={config.agentCount}
                onChange={(e) => setConfig(prev => ({ ...prev, agentCount: parseInt(e.target.value) || 100 }))}
                min={100}
                max={500}
                className="w-24 px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] text-center focus:border-[var(--lp-cobalt)] outline-none"
              />
              <span className="text-sm text-[var(--lp-muted)]">Agenten</span>
            </div>
            {config.agentCount < 100 && (
              <p className="text-xs text-rose-500 mt-1">Mindestens 100 Agenten</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
              Runden
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={config.roundCount}
                onChange={(e) => setConfig(prev => ({ ...prev, roundCount: parseInt(e.target.value) || 5 }))}
                min={1}
                max={10}
                className="w-24 px-4 py-3 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] text-center focus:border-[var(--lp-cobalt)] outline-none"
              />
              <span className="text-sm text-[var(--lp-muted)]">Runden</span>
            </div>
          </div>
        </div>

        {/* Focus Areas */}
        <div>
          <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
            Fokusbereiche (optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_AREAS_OPTIONS.map(area => (
              <button
                key={area}
                onClick={() => toggleFocusArea(area)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  config.focusAreas.includes(area)
                    ? 'bg-[var(--lp-cobalt)] text-white'
                    : 'bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-muted)] hover:text-[var(--lp-text)]'
                }`}
              >
                {config.focusAreas.includes(area) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                {area}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-medium text-rose-500">Bitte korrigiere:</span>
            </div>
            <ul className="list-disc list-inside text-sm text-rose-400 space-y-1">
              {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-sm text-rose-500">
            {error}
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={validateAndStart}
          disabled={isRunning}
          className="w-full py-4 px-6 bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] text-white rounded-xl font-semibold flex items-center justify-center gap-3 disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Simulation läuft...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Simulation starten
            </>
          )}
        </button>
      </div>
    </div>
  )

  const renderResults = () => {
    if (!currentRun) return null

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[var(--lp-text)]">{currentRun.title}</h2>
            <p className="text-sm text-[var(--lp-muted)]">
              {currentRun.agentCount} Agenten · {currentRun.roundCount} Runden · {SIMULATION_GOAL_LABELS[currentRun.type]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentRun(null)}
              className="px-4 py-2 text-sm font-medium text-[var(--lp-muted)] hover:text-[var(--lp-text)] transition-colors"
            >
              Neue Simulation
            </button>
          </div>
        </div>

        {/* Result Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[var(--lp-border)] pb-4">
          {[
            { id: 'overview' as const, label: 'Übersicht', icon: PieChart },
            { id: 'measures' as const, label: 'Maßnahmen', icon: CheckCircle },
            { id: 'risks' as const, label: 'Risiken', icon: AlertOctagon },
            { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
            { id: 'success' as const, label: 'Erfolg', icon: Target },
            { id: 'difficulties' as const, label: 'Schwierigkeiten', icon: AlertTriangle },
            { id: 'opportunities' as const, label: 'Chancen', icon: Lightbulb },
            { id: 'objections' as const, label: 'Einwände', icon: MessageSquare },
            { id: 'targetGroups' as const, label: 'Zielgruppen', icon: Users },
            { id: 'process' as const, label: 'Prozess', icon: FileText },
            { id: 'agents' as const, label: 'Agenten', icon: UserCircle },
            { id: 'rawDialog' as const, label: 'Rohdialog', icon: MessageCircle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--lp-cobalt)] text-white'
                  : 'text-[var(--lp-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'agents' && renderAgentsTab()}
          {activeTab === 'rawDialog' && renderRawDialogTab()}
          {/* Other tabs would be implemented similarly */}
          {activeTab !== 'overview' && activeTab !== 'agents' && activeTab !== 'rawDialog' && (
            <div className="text-center py-12 text-[var(--lp-muted)]">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Bereich wird implementiert...</p>
              <p className="text-sm mt-2">Aktiv: {activeTab}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderOverviewTab = () => {
    if (!currentRun) return null
    const { result } = currentRun

    return (
      <div className="space-y-6">
        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Vertrauen', value: result.trustScore, color: 'text-emerald-400' },
            { label: 'Nutzen', value: result.usefulnessScore, color: 'text-blue-400' },
            { label: 'Risiko', value: result.riskScore, color: 'text-rose-400' },
            { label: 'Erfolgswahrscheinlichkeit', value: result.successProbability, color: 'text-violet-400' }
          ].map(score => (
            <div key={score.label} className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
              <div className="text-sm text-[var(--lp-muted)] mb-1">{score.label}</div>
              <div className={`text-2xl font-bold ${score.color}`}>{score.value}%</div>
              <div className="w-full h-2 bg-[var(--lp-surface)] rounded-full mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${score.color.replace('text-', 'bg-')}`}
                  style={{ width: `${score.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-6 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
          <h3 className="font-semibold text-[var(--lp-text)] mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--lp-cobalt)]" />
            Zusammenfassung
          </h3>
          <p className="text-[var(--lp-text)] leading-relaxed">{result.summary}</p>
        </div>

        {/* Forecasts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
            <h4 className="font-medium text-[var(--lp-text)] mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Performance-Prognose
            </h4>
            <p className="text-sm text-[var(--lp-muted)]">{result.performanceForecast}</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
            <h4 className="font-medium text-[var(--lp-text)] mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-400" />
              Erfolgsprognose
            </h4>
            <p className="text-sm text-[var(--lp-muted)]">{result.successForecast}</p>
          </div>
        </div>
      </div>
    )
  }

  const renderAgentsTab = () => {
    if (!currentRun) return null

    return (
      <div className="space-y-4">
        {/* Filter & Search */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--lp-muted)]" />
            <input
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Agenten suchen..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] text-sm focus:border-[var(--lp-cobalt)] outline-none"
            />
          </div>
          <div className="text-sm text-[var(--lp-muted)]">
            {filteredAgents.length} / {currentRun.agents.length} Agenten
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
          {filteredAgents.map(agent => (
            <motion.div
              key={agent.id}
              layoutId={agent.id}
              onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedAgent?.id === agent.id
                  ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5'
                  : 'border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-[var(--lp-cobalt)]/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-[var(--lp-text)]">{agent.displayName}</div>
                  <div className="text-xs text-[var(--lp-muted)]">
                    {AGENT_ARCHETYPE_LABELS[agent.archetype]} · {agent.role}
                  </div>
                </div>
                <Badge
                  variant={
                    agent.initialPosition.includes('supportive') ? 'success' :
                    agent.initialPosition.includes('opposed') ? 'rose' :
                    agent.initialPosition === 'neutral' ? 'neutral' : 'amber'
                  }
                >
                  {INITIAL_POSITION_LABELS[agent.initialPosition]}
                </Badge>
              </div>
              {selectedAgent?.id === agent.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-[var(--lp-border)] space-y-3"
                >
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Kontext:</span>{' '}
                    <span className="text-[var(--lp-text)]">{agent.context}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Motivation:</span>{' '}
                    <span className="text-[var(--lp-text)]">{agent.motivation}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Angst:</span>{' '}
                    <span className="text-[var(--lp-text)]">{agent.fear}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Bias:</span>{' '}
                    <span className="text-[var(--lp-text)]">{agent.bias}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Kommunikationsstil:</span>{' '}
                    <span className="text-[var(--lp-text)]">{COMMUNICATION_STYLE_LABELS[agent.communicationStyle]}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-[var(--lp-muted)]">Wissensniveau:</span>{' '}
                    <span className="text-[var(--lp-text)]">{KNOWLEDGE_LEVEL_LABELS[agent.knowledgeLevel]}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  const renderRawDialogTab = () => {
    if (!currentRun) return null

    return (
      <div className="space-y-4">
        {/* Round Accordion */}
        {[1, 2, 3, 4, 5].map(roundNum => {
          const round = currentRun.rounds.find(r => r.round === roundNum)
          const isExpanded = expandedRounds.includes(roundNum)

          return (
            <div
              key={roundNum}
              className="border border-[var(--lp-border)] rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleRound(roundNum)}
                className="w-full px-4 py-3 flex items-center justify-between bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-[var(--lp-cobalt)]/20 text-[var(--lp-cobalt)] text-sm font-medium flex items-center justify-center">
                    {roundNum}
                  </span>
                  <div className="text-left">
                    <div className="font-medium text-[var(--lp-text)]">
                      {round?.title || `Runde ${roundNum}`}
                    </div>
                    <div className="text-xs text-[var(--lp-muted)]">
                      {round?.description || 'Beschreibung lädt...'}
                    </div>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-[var(--lp-muted)]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-[var(--lp-muted)]" />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && round && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-4">
                      {/* Summary */}
                      <div className="text-sm text-[var(--lp-text)]">{round.summary}</div>

                      {/* Patterns */}
                      {round.patterns.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--lp-muted)] uppercase mb-2">Muster</h4>
                          <div className="flex flex-wrap gap-2">
                            {round.patterns.map((pattern, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-full text-xs bg-[var(--lp-surface)] text-[var(--lp-muted)]"
                              >
                                {pattern}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Representative Statements */}
                      {round.representativeStatements.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--lp-muted)] uppercase mb-2">Repräsentative Aussagen</h4>
                          <div className="space-y-2">
                            {round.representativeStatements.slice(0, 3).map((stmt, i) => {
                              const agent = currentRun.agents.find(a => a.id === stmt.agentId)
                              return (
                                <div key={i} className="p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-medium text-[var(--lp-cobalt)]">{agent?.displayName || 'Agent'}</span>
                                    <span className="text-xs text-[var(--lp-muted)]">· {stmt.significance}</span>
                                  </div>
                                  <p className="text-sm text-[var(--lp-text)] italic">"{stmt.statement}"</p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Conflicts */}
                      {round.conflicts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-[var(--lp-muted)] uppercase mb-2">Konflikte</h4>
                          <div className="space-y-2">
                            {round.conflicts.map((conflict, i) => (
                              <div
                                key={i}
                                className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                                  <span className="text-sm text-[var(--lp-text)]">{conflict.topic}</span>
                                  <Badge variant={conflict.intensity === 'high' ? 'rose' : 'amber'}>
                                    {conflict.intensity}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <section className="lp-card lp-card--padded">
      {!currentRun ? renderStartScreen() : renderResults()}
    </section>
  )
}
