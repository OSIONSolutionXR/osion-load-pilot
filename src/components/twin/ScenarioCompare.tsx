/**
 * ScenarioCompare
 * 
 * Vergleicht mehrere Szenarien und ihre Ergebnisse
 * Side-by-side Ansicht
 */

import { motion } from 'motion/react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  X,
  ArrowRight
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Scenario, ScenarioResult } from '../../types/projectTwinV2'
import { compareScenarios } from '../../services/simulationService'

interface ScenarioCompareProps {
  scenarios: Scenario[]
  results: ScenarioResult[]
  onClose: () => void
  onApplyRecommendation?: (action: string) => void
}

export default function ScenarioCompare({
  scenarios,
  results,
  onClose,
  onApplyRecommendation
}: ScenarioCompareProps) {
  const { comparison, recommendation } = compareScenarios(scenarios, results)

  const getOutcomeColor = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return 'bg-emerald-500'
      case 'neutral': return 'bg-amber-500'
      case 'negative': return 'bg-rose-500'
      default: return 'bg-[var(--lp-muted)]'
    }
  }

  const getOutcomeBgColor = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return 'bg-emerald-500/10 border-emerald-500/30'
      case 'neutral': return 'bg-amber-500/10 border-amber-500/30'
      case 'negative': return 'bg-rose-500/10 border-rose-500/30'
      default: return 'bg-[var(--lp-surface)] border-[var(--lp-border)]'
    }
  }

  const getOutcomeTextColor = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return 'text-emerald-400'
      case 'neutral': return 'text-amber-400'
      case 'negative': return 'text-rose-400'
      default: return 'text-[var(--lp-muted)]'
    }
  }

  const getOutcomeIcon = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return TrendingUp
      case 'neutral': return Minus
      case 'negative': return TrendingDown
      default: return Minus
    }
  }

  const getOutcomeLabel = (outcome?: 'positive' | 'neutral' | 'negative') => {
    switch (outcome) {
      case 'positive': return 'Positiv'
      case 'neutral': return 'Neutral'
      case 'negative': return 'Herausfordernd'
      default: return 'Unbekannt'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--lp-text)]">
            Szenario-Vergleich
          </h3>
          <p className="text-sm text-[var(--lp-muted)]">
            {scenarios.length} Szenarien verglichen
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-[var(--lp-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface-soft)]"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Recommendation Banner */}
      <div className="p-4 rounded-xl bg-[var(--lp-cobalt)]/10 border border-[var(--lp-cobalt)]/30">
        <div className="flex items-start gap-3">
          <Target className="w-6 h-6 text-[var(--lp-cobalt)] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-medium text-[var(--lp-text)] mb-1">Empfehlung</h4>
            <p className="text-[var(--lp-text)]">{recommendation}</p>
            
            {comparison.length > 0 && comparison[0].result.recommendedAction && (
              <button
                onClick={() => onApplyRecommendation?.(comparison[0].result.recommendedAction!)}
                className="mt-3 flex items-center gap-2 text-sm text-[var(--lp-cobalt)] hover:opacity-80"
              >
                Empfohlene Maßnahme anwenden
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--lp-border)]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[var(--lp-muted)]">Kriterium</th>
              {comparison.map(({ scenario, result }) => {
                const isWinner = comparison[0].scenario.id === scenario.id
                const OutcomeIcon = getOutcomeIcon(result.outcome)
                return (
                  <th
                    key={scenario.id}
                    className={`text-left py-3 px-4 min-w-[200px] ${
                      isWinner ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--lp-text)]">{scenario.name}</span>
                      {isWinner && (
                        <Badge variant="success">Empfohlen</Badge>
                      )}
                    </div>
                    <div className={`flex items-center gap-1 mt-1 text-sm ${getOutcomeTextColor(result.outcome)}`}>
                      <OutcomeIcon className="w-4 h-4" />
                      <span>{getOutcomeLabel(result.outcome)}</span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--lp-border)]">
            {/* Confidence Row */}
            <tr>
              <td className="py-3 px-4 text-sm text-[var(--lp-muted)]">Konfidenz</td>
              {comparison.map(({ result }) => (
                <td key={result.scenarioId} className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getOutcomeColor(result.outcome)}`}
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-[var(--lp-text)] w-10">
                      {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Risks Count */}
            <tr>
              <td className="py-3 px-4 text-sm text-[var(--lp-muted)]">Risiken</td>
              {comparison.map(({ result }) => (
                <td key={result.scenarioId} className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      result.risks.length > 3 ? 'text-rose-400' : 'text-amber-400'
                    }`} />
                    <span className="text-sm text-[var(--lp-text)]">
                      {result.risks.length}
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Opportunities Count */}
            <tr>
              <td className="py-3 px-4 text-sm text-[var(--lp-muted)]">Chancen</td>
              {comparison.map(({ result }) => (
                <td key={result.scenarioId} className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`w-4 h-4 ${
                      result.opportunities.length > 2 ? 'text-emerald-400' : 'text-[var(--lp-muted)]'
                    }`} />
                    <span className="text-sm text-[var(--lp-text)]">
                      {result.opportunities.length}
                    </span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Has Recommendation */}
            <tr>
              <td className="py-3 px-4 text-sm text-[var(--lp-muted)]">Empfehlung</td>
              {comparison.map(({ result }) => (
                <td key={result.scenarioId} className="py-3 px-4">
                  {result.recommendedAction ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-[var(--lp-text)]">Verfügbar</span>
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--lp-muted)]">—</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Completion Date */}
            <tr>
              <td className="py-3 px-4 text-sm text-[var(--lp-muted)]">Abgeschlossen</td>
              {comparison.map(({ result }) => (
                <td key={result.scenarioId} className="py-3 px-4">
                  <span className="text-sm text-[var(--lp-muted)]">
                    {formatDate(result.completedAt)}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparison.map(({ scenario, result, score }, index) => {
          const OutcomeIcon = getOutcomeIcon(result.outcome)
          return (
            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${getOutcomeBgColor(result.outcome)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <OutcomeIcon className={`w-5 h-5 ${getOutcomeTextColor(result.outcome)}`} />
                  <span className="font-medium text-[var(--lp-text)]">{scenario.name}</span>
                </div>
                <Badge variant={
                  score > 70 ? 'success' : score > 40 ? 'amber' : 'neutral'
                }>
                  Score: {Math.round(score)}
                </Badge>
              </div>

              <p className="text-sm text-[var(--lp-muted)] mb-3 line-clamp-2">
                {result.summary}
              </p>

              {result.recommendedAction && (
                <div className="p-2 rounded-lg bg-[var(--lp-surface)]/50 text-sm">
                  <span className="text-[var(--lp-muted)]">Empfohlen: </span>
                  <span className="text-[var(--lp-text)]">{result.recommendedAction}</span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">
            {comparison.filter(c => c.result.outcome === 'positive').length}
          </div>
          <div className="text-xs text-[var(--lp-muted)]">Positive</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">
            {comparison.filter(c => c.result.outcome === 'neutral').length}
          </div>
          <div className="text-xs text-[var(--lp-muted)]">Neutral</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-rose-400">
            {comparison.filter(c => c.result.outcome === 'negative').length}
          </div>
          <div className="text-xs text-[var(--lp-muted)]">Herausfordernd</div>
        </div>
      </div>
    </motion.div>
  )
}
