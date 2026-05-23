/**
 * ScenarioResultView
 * 
 * Zeigt die Ergebnisse einer abgeschlossenen Simulation
 * Mit Risiken, Chancen, Empfehlungen und Konfidenz-Score
 */

import { motion } from 'motion/react'
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  Sparkles,
  Check,
  Plus
} from 'lucide-react'
import { Badge } from '../ui/Badge'
import type { Scenario, ScenarioResult } from '../../types/projectTwinV2'

interface ScenarioResultViewProps {
  scenario: Scenario
  result: ScenarioResult
  onTransferToMeasures?: () => void
  onCompare?: () => void
}

export default function ScenarioResultView({
  scenario,
  result,
  onTransferToMeasures,
  onCompare
}: ScenarioResultViewProps) {
  const getOutcomeColor = () => {
    switch (result.outcome) {
      case 'positive': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      case 'neutral': return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      case 'negative': return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
    }
  }

  const getOutcomeIcon = () => {
    switch (result.outcome) {
      case 'positive': return TrendingUp
      case 'neutral': return Minus
      case 'negative': return TrendingDown
    }
  }

  const getOutcomeLabel = () => {
    switch (result.outcome) {
      case 'positive': return 'Positiv'
      case 'neutral': return 'Neutral'
      case 'negative': return 'Herausfordernd'
    }
  }

  const OutcomeIcon = getOutcomeIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--lp-text)]">
            {scenario.name}
          </h3>
          <p className="text-sm text-[var(--lp-muted)] mt-1">
            {scenario.description}
          </p>
        </div>
        <div className={`p-3 rounded-xl border ${getOutcomeColor()}`}>
          <div className="flex items-center gap-2">
            <OutcomeIcon className="w-5 h-5" />
            <span className="font-medium">{getOutcomeLabel()}</span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-6 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[var(--lp-cobalt)]" />
          <h4 className="font-medium text-[var(--lp-text)]">Zusammenfassung</h4>
        </div>
        <p className="text-[var(--lp-text)] leading-relaxed">{result.summary}</p>
      </div>

      {/* Confidence Score */}
      <div className="p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--lp-cobalt)]" />
            <span className="font-medium text-[var(--lp-text)]">Vertrauensniveau</span>
          </div>
          <Badge variant={result.confidence > 0.8 ? 'success' : result.confidence > 0.5 ? 'amber' : 'neutral'}>
            {Math.round(result.confidence * 100)}%
          </Badge>
        </div>
        <div className="h-3 bg-[var(--lp-surface)] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              result.confidence > 0.8 
                ? 'bg-emerald-500' 
                : result.confidence > 0.5 
                  ? 'bg-amber-500' 
                  : 'bg-[var(--lp-muted)]'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence * 100}%` }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>
        <p className="text-xs text-[var(--lp-muted)] mt-2">
          {result.confidence > 0.8 
            ? 'Hohe Konfidenz – Ergebnis ist zuverlässig' 
            : result.confidence > 0.5 
              ? 'Mittlere Konfidenz – Ergebnis mit Vorsicht betrachten'
              : 'Niedrige Konfidenz – Unsicherheit in der Vorhersage'}
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risks */}
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-rose-400" />
            <h4 className="font-medium text-rose-400">Risiken ({result.risks.length})</h4>
          </div>
          <div className="space-y-2">
            {result.risks.length > 0 ? (
              result.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--lp-text)]">{risk}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--lp-muted)] italic">Keine kritischen Risiken identifiziert</p>
            )}
          </div>
        </div>

        {/* Opportunities */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
            <h4 className="font-medium text-emerald-400">Chancen ({result.opportunities.length})</h4>
          </div>
          <div className="space-y-2">
            {result.opportunities.length > 0 ? (
              result.opportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-[var(--lp-text)]">{opp}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--lp-muted)] italic">Keine zusätzlichen Chancen identifiziert</p>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Action */}
      {result.recommendedAction && (
        <div className="p-4 rounded-xl bg-[var(--lp-cobalt)]/10 border border-[var(--lp-cobalt)]/30">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-5 h-5 text-[var(--lp-cobalt)]" />
            <h4 className="font-medium text-[var(--lp-text)]">Empfohlene Maßnahme</h4>
          </div>
          <p className="text-[var(--lp-text)]">{result.recommendedAction}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-[var(--lp-border)]">
        {onTransferToMeasures && (
          <button
            onClick={onTransferToMeasures}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--lp-cobalt)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            In Maßnahmen überführen
          </button>
        )}
        
        {onCompare && (
          <button
            onClick={onCompare}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--lp-border)] text-[var(--lp-text)] text-sm font-medium hover:bg-[var(--lp-surface-soft)] transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            Zum Vergleich hinzufügen
          </button>
        )}
      </div>
    </motion.div>
  )
}
