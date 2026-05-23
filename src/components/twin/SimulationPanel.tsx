/**
 * SimulationPanel
 * 
 * Haupt-Komponente für das Simulation-Feature
 * Integriert alle Sub-Komponenten und verwaltet den State
 */

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Plus,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  RotateCcw,
  AlertCircle
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import ScenarioCreator from './ScenarioCreator'
import ScenarioList from './ScenarioList'
import ScenarioRunner from './ScenarioRunner'
import ScenarioResultView from './ScenarioResultView'
import ScenarioCompare from './ScenarioCompare'
import {
  runScenarioSimulation,
} from '../../services/simulationService'
import type {
  Scenario,
  ScenarioResult,
  StoredProjectTwinV2,
  SimulationsContainer
} from '../../types/projectTwinV2'

interface SimulationPanelProps {
  twin: StoredProjectTwinV2
  onTwinUpdate?: (updatedTwin: StoredProjectTwinV2) => void
}

type ViewMode = 'list' | 'create' | 'run' | 'result' | 'compare'

export default function SimulationPanel({ twin, onTwinUpdate }: SimulationPanelProps) {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)
  const [selectedResult, setSelectedResult] = useState<ScenarioResult | null>(null)
  const [compareScenarioIds, setCompareScenarioIds] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [runProgress, setRunProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Get simulations from twin
  const simulations: SimulationsContainer = useMemo(() => {
    return twin.simulations || {
      scenarios: [],
      results: []
    }
  }, [twin.simulations])

  // Update twin with new simulations
  const updateTwinSimulations = useCallback((updates: Partial<SimulationsContainer>) => {
    if (!onTwinUpdate) return

    const newSimulations = {
      ...simulations,
      ...updates
    }

    const updatedTwin: StoredProjectTwinV2 = {
      ...twin,
      simulations: newSimulations,
      updatedAt: new Date().toISOString()
    }

    onTwinUpdate(updatedTwin)
  }, [twin, simulations, onTwinUpdate])

  // Create new scenario
  const handleCreateScenario = useCallback((scenario: Scenario) => {
    updateTwinSimulations({
      scenarios: [...simulations.scenarios, scenario],
      activeScenarioId: scenario.id
    })
    setSelectedScenario(scenario)
    setViewMode('run')
  }, [simulations.scenarios, updateTwinSimulations])

  // Delete scenario
  const handleDeleteScenario = useCallback((scenarioId: string) => {
    updateTwinSimulations({
      scenarios: simulations.scenarios.filter(s => s.id !== scenarioId),
      results: simulations.results.filter(r => r.scenarioId !== scenarioId),
      activeScenarioId: simulations.activeScenarioId === scenarioId 
        ? undefined 
        : simulations.activeScenarioId
    })
  }, [simulations, updateTwinSimulations])

  // Run simulation
  const handleRunScenario = useCallback(async (scenario: Scenario) => {
    setIsRunning(true)
    setRunProgress(0)
    setError(null)

    // Update status to running
    const updatedScenarios = simulations.scenarios.map(s =>
      s.id === scenario.id ? { ...s, status: 'running' as const } : s
    )
    updateTwinSimulations({ scenarios: updatedScenarios, activeScenarioId: scenario.id })

    // Simulate progress
    const progressInterval = setInterval(() => {
      setRunProgress(prev => Math.min(prev + 5 + Math.random() * 10, 95))
    }, 500)

    try {
      // Run actual simulation
      const result = await runScenarioSimulation(scenario, twin)

      clearInterval(progressInterval)
      setRunProgress(100)

      // Update scenario status
      const finalScenarios = updatedScenarios.map(s =>
        s.id === scenario.id ? { ...s, status: 'completed' as const } : s
      )

      updateTwinSimulations({
        scenarios: finalScenarios,
        results: [...simulations.results, result]
      })

      setSelectedResult(result)
      setViewMode('result')
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Simulation fehlgeschlagen')
      
      // Mark as failed
      const failedScenarios = updatedScenarios.map(s =>
        s.id === scenario.id ? { ...s, status: 'failed' as const } : s
      )
      updateTwinSimulations({ scenarios: failedScenarios })
    } finally {
      setIsRunning(false)
    }
  }, [simulations, twin, updateTwinSimulations])

  // Select scenario to view result
  const handleSelectScenario = useCallback((scenario: Scenario) => {
    const result = simulations.results.find(r => r.scenarioId === scenario.id)
    setSelectedScenario(scenario)
    setSelectedResult(result || null)
    
    if (result) {
      setViewMode('result')
    } else if (scenario.status === 'running') {
      setViewMode('run')
    } else {
      setViewMode('run')
    }
  }, [simulations.results])

  // Add to compare
  const handleAddToCompare = useCallback(() => {
    if (selectedScenario && !compareScenarioIds.includes(selectedScenario.id)) {
      setCompareScenarioIds(prev => [...prev, selectedScenario.id])
    }
    setViewMode('compare')
  }, [selectedScenario, compareScenarioIds])

  // Get scenarios for compare
  const compareScenarios = useMemo(() => {
    return simulations.scenarios.filter(s => compareScenarioIds.includes(s.id))
  }, [simulations.scenarios, compareScenarioIds])

  const compareResults = useMemo(() => {
    return simulations.results.filter(r => 
      compareScenarioIds.includes(r.scenarioId)
    )
  }, [simulations.results, compareScenarioIds])

  // Get stats
  const stats = useMemo(() => ({
    total: simulations.scenarios.length,
    running: simulations.scenarios.filter(s => s.status === 'running').length,
    completed: simulations.scenarios.filter(s => s.status === 'completed').length,
    failed: simulations.scenarios.filter(s => s.status === 'failed').length
  }), [simulations.scenarios])

  return (
    <section className="lp-card lp-card--padded">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {viewMode !== 'list' && (
            <button
              onClick={() => setViewMode('list')}
              className="p-2 rounded-lg hover:bg-[var(--lp-surface-soft)] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[var(--lp-muted)]" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--lp-text)]">Szenario-Simulation</h2>
              {stats.total > 0 && (
                <Badge variant="neutral">{stats.total} Szenarien</Badge>
              )}
            </div>
            <p className="text-sm text-[var(--lp-muted)]">
              Simuliere "Was-wäre-wenn"-Szenarien für dein Projekt
            </p>
          </div>
        </div>

        {/* Stats */}
        {stats.total > 0 && viewMode === 'list' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-[var(--lp-muted)]">
              <Clock className="w-4 h-4" />
              <span>{stats.running}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>{stats.completed}</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-1 text-sm text-rose-400">
                <XCircle className="w-4 h-4" />
                <span>{stats.failed}</span>
              </div>
            )}
            <button
              onClick={() => setViewMode('create')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--lp-cobalt)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Neues Szenario
            </button>
          </div>
        )}

        {viewMode !== 'list' && (
          <div className="flex items-center gap-2">
            {compareScenarioIds.length >= 2 && viewMode !== 'compare' && (
              <button
                onClick={() => setViewMode('compare')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--lp-border)] text-sm text-[var(--lp-text)] hover:bg-[var(--lp-surface-soft)]"
              >
                <BarChart3 className="w-4 h-4" />
                Vergleich ({compareScenarioIds.length})
              </button>
            )}
            {viewMode === 'result' && (
              <button
                onClick={() => handleRunScenario(selectedScenario!)}
                disabled={isRunning}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--lp-border)] text-sm text-[var(--lp-text)] hover:bg-[var(--lp-surface-soft)] disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Neu simulieren
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <p className="text-rose-400">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {stats.total === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--lp-surface-soft)] mb-4">
                  <BarChart3 className="w-8 h-8 text-[var(--lp-muted)]" />
                </div>
                <h3 className="text-lg font-medium text-[var(--lp-text)] mb-2">
                  Keine Szenarien vorhanden
                </h3>
                <p className="text-sm text-[var(--lp-muted)] mb-6 max-w-md mx-auto">
                  Erstelle dein erstes Szenario, um mögliche Projektentwicklungen zu simulieren.
                  Z.B.: "Was passiert bei 20% mehr Budget?"
                </p>
                <button
                  onClick={() => setViewMode('create')}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--lp-cobalt)] text-white font-medium mx-auto hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-5 h-5" />
                  Erstes Szenario erstellen
                </button>
              </div>
            ) : (
              <ScenarioList
                scenarios={simulations.scenarios}
                results={simulations.results}
                activeScenarioId={simulations.activeScenarioId}
                onSelectScenario={handleSelectScenario}
                onDeleteScenario={handleDeleteScenario}
                onRunScenario={handleRunScenario}
              />
            )}
          </motion.div>
        )}

        {viewMode === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ScenarioCreator
              onCreateScenario={handleCreateScenario}
              onCancel={() => setViewMode('list')}
            />
          </motion.div>
        )}

        {viewMode === 'run' && selectedScenario && (
          <motion.div
            key="run"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ScenarioRunner
              scenario={selectedScenario}
              progress={runProgress}
            />
          </motion.div>
        )}

        {viewMode === 'result' && selectedScenario && selectedResult && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ScenarioResultView
              scenario={selectedScenario}
              result={selectedResult}
              onCompare={handleAddToCompare}
              onTransferToMeasures={() => {
                // TODO: Transfer to measures
                alert('Transfer to measures: ' + selectedResult.recommendedAction)
              }}
            />
          </motion.div>
        )}

        {viewMode === 'compare' && compareScenarios.length >= 2 && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ScenarioCompare
              scenarios={compareScenarios}
              results={compareResults}
              onClose={() => setViewMode('list')}
              onApplyRecommendation={(action) => {
                alert('Apply recommendation: ' + action)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
