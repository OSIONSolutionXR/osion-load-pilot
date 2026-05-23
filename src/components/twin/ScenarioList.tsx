/**
 * ScenarioList
 * 
 * Zeigt alle Szenarien eines Twins an
 * Gruppiert nach Status (laufend / abgeschlossen)
 */

import { motion } from 'motion/react'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Trash2,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Scenario, ScenarioResult } from '../../types/projectTwinV2'

interface ScenarioListProps {
  scenarios: Scenario[]
  results: ScenarioResult[]
  activeScenarioId?: string
  onSelectScenario: (scenario: Scenario) => void
  onDeleteScenario: (scenarioId: string) => void
  onRunScenario: (scenario: Scenario) => void
}

export default function ScenarioList({
  scenarios,
  results,
  activeScenarioId,
  onSelectScenario,
  onDeleteScenario,
  onRunScenario
}: ScenarioListProps) {
  const resultsMap = new Map(results.map(r => [r.scenarioId, r]))

  const runningScenarios = scenarios.filter(s => s.status === 'running')
  const completedScenarios = scenarios.filter(s => s.status === 'completed')
  const failedScenarios = scenarios.filter(s => s.status === 'failed')

  const getResultForScenario = (scenario: Scenario) => resultsMap.get(scenario.id)

  const getOutcomeColor = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'neutral': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'negative': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      default: return 'text-[var(--lp-muted)] bg-[var(--lp-surface)] border-[var(--lp-border)]'
    }
  }

  const getOutcomeIcon = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return CheckCircle
      case 'neutral': return MoreHorizontal
      case 'negative': return XCircle
      default: return Clock
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderScenarioCard = (scenario: Scenario) => {
    const result = getResultForScenario(scenario)
    const isActive = activeScenarioId === scenario.id
    const OutcomeIcon = getOutcomeIcon(result?.outcome)

    return (
      <motion.div
        key={scenario.id}
        layoutId={scenario.id}
        onClick={() => onSelectScenario(scenario)}
        className={`p-4 rounded-xl border cursor-pointer transition-all ${
          isActive
            ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5'
            : 'border-[var(--lp-border)] bg-[var(--lp-surface-soft)] hover:border-[var(--lp-cobalt)]/50'
        }`}
      >
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className={`p-2 rounded-lg ${getOutcomeColor(result?.outcome)}`}>
            {scenario.status === 'running' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <OutcomeIcon className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-medium text-[var(--lp-text)] truncate">
                {scenario.name}
              </h4>
              <div className="flex items-center gap-1">
                {result && (
                  <Badge variant={result.outcome === 'positive' ? 'success' : result.outcome === 'negative' ? 'rose' : 'amber'}>
                    {result.confidence > 0.8 ? 'Hoch' : result.confidence > 0.5 ? 'Mittel' : 'Niedrig'} Vertrauen
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-sm text-[var(--lp-muted)] mt-1 truncate">
              {scenario.description}
            </p>

            {/* Assumptions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(scenario.assumptions).slice(0, 3).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--lp-surface)] text-[var(--lp-muted)]"
                >
                  {key}: {value}
                </span>
              ))}
              {Object.keys(scenario.assumptions).length > 3 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--lp-surface)] text-[var(--lp-muted)]">
                  +{Object.keys(scenario.assumptions).length - 3}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-[var(--lp-muted)]">
                {formatDate(scenario.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                {scenario.status === 'running' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRunScenario(scenario)
                    }}
                    className="flex items-center gap-1 text-xs text-[var(--lp-cobalt)] hover:opacity-80"
                  >
                    <Play className="w-3 h-3" />
                    Starten
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteScenario(scenario.id)
                  }}
                  className="p-1.5 rounded-lg text-[var(--lp-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <ArrowRight className={`w-5 h-5 text-[var(--lp-muted)] transition-transform ${
            isActive ? 'translate-x-1 text-[var(--lp-cobalt)]' : ''
          }`} />
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Running Scenarios */}
      {runningScenarios.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--lp-text)] mb-3 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--lp-cobalt)] animate-spin" />
            Laufend ({runningScenarios.length})
          </h4>
          <div className="space-y-3">
            {runningScenarios.map(renderScenarioCard)}
          </div>
        </div>
      )}

      {/* Completed Scenarios */}
      {completedScenarios.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--lp-text)] mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Abgeschlossen ({completedScenarios.length})
          </h4>
          <div className="space-y-3">
            {completedScenarios.map(renderScenarioCard)}
          </div>
        </div>
      )}

      {/* Failed Scenarios */}
      {failedScenarios.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--lp-text)] mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            Fehlgeschlagen ({failedScenarios.length})
          </h4>
          <div className="space-y-3">
            {failedScenarios.map(renderScenarioCard)}
          </div>
        </div>
      )}

      {scenarios.length === 0 && (
        <div className="text-center py-8 text-[var(--lp-muted)]">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Noch keine Szenarien erstellt</p>
          <p className="text-xs mt-1">Erstelle ein Szenario um mit der Simulation zu beginnen</p>
        </div>
      )}
    </div>
  )
}
