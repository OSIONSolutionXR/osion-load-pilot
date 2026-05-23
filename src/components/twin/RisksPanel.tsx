/**
 * RisksPanel.tsx
 * Umfassende Risikoanalyse mit Matrix, Karten, Filter und Statistik
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ChevronRight,
  BarChart3,
  LayoutGrid,
  Activity
} from 'lucide-react'
import type { ProjectRisk, RiskSeverity } from '../../types/projectTwin'

// ============================================================================
// TYPES
// ============================================================================

type RiskFilter = 'all' | 'high' | 'medium' | 'low'
type ViewMode = 'matrix' | 'cards' | 'list'

interface RiskWithMeta extends ProjectRisk {
  id: string
  // Simulierte Meta-Daten für die Matrix-Positionierung
  probability: number // 0-100
  impact: number // 0-100
  category: string
}

interface RisksPanelProps {
  risks: ProjectRisk[]
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const severityToColor = (severity: RiskSeverity): {
  bg: string
  border: string
  text: string
  accent: string
  light: string
} => {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        accent: 'bg-rose-500',
        light: 'bg-rose-500/5'
      }
    case 'medium':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        accent: 'bg-amber-500',
        light: 'bg-amber-500/5'
      }
    case 'low':
      return {
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/30',
        text: 'text-zinc-400',
        accent: 'bg-zinc-500',
        light: 'bg-zinc-500/5'
      }
    default:
      return {
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/30',
        text: 'text-zinc-400',
        accent: 'bg-zinc-500',
        light: 'bg-zinc-500/5'
      }
  }
}

const severityToGerman = (severity: RiskSeverity): string => {
  switch (severity) {
    case 'high': return 'Kritisch'
    case 'medium': return 'Relevant'
    case 'low': return 'Beobachten'
    default: return 'Unbekannt'
  }
}

const probabilityToLabel = (value: number): string => {
  if (value >= 75) return 'Sehr wahrscheinlich'
  if (value >= 50) return 'Wahrscheinlich'
  if (value >= 25) return 'Möglich'
  return 'Unwahrscheinlich'
}

const impactToLabel = (value: number): string => {
  if (value >= 75) return 'Kritisch'
  if (value >= 50) return 'Hoch'
  if (value >= 25) return 'Mittel'
  return 'Niedrig'
}

// ============================================================================
// COMPONENT: RisksPanel
// ============================================================================

export default function RisksPanel({ risks }: RisksPanelProps) {
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [selectedRisk, setSelectedRisk] = useState<RiskWithMeta | null>(null)

  // Risiken mit simulierten Meta-Daten erweitern
  // In einer echten Implementierung würden diese Daten aus der Analyse kommen
  const risksWithMeta: RiskWithMeta[] = useMemo(() => {
    return risks.map((risk, index) => {
      // Simuliere Probability/Impact basierend auf Severity und Index
      // In Produktion würden diese Werte aus dem Backend kommen
      let baseProbability: number
      let baseImpact: number

      switch (risk.severity) {
        case 'high':
          baseProbability = 60 + (index % 30) // 60-90%
          baseImpact = 70 + (index % 25) // 70-95%
          break
        case 'medium':
          baseProbability = 35 + (index % 30) // 35-65%
          baseImpact = 40 + (index % 30) // 40-70%
          break
        case 'low':
          baseProbability = 15 + (index % 20) // 15-35%
          baseImpact = 15 + (index % 25) // 15-40%
          break
        default:
          baseProbability = 50
          baseImpact = 50
      }

      // Kategorien simulieren
      const categories = [
        'Finanzen', 'Zeitplan', 'Qualität', 'Ressourcen',
        'Stakeholder', 'Technisch', 'Extern', 'Compliance'
      ]

      return {
        ...risk,
        id: `risk-${index}`,
        probability: baseProbability,
        impact: baseImpact,
        category: categories[index % categories.length]
      }
    })
  }, [risks])

  // Gefilterte Risiken
  const filteredRisks = useMemo(() => {
    if (activeFilter === 'all') return risksWithMeta
    return risksWithMeta.filter(risk => risk.severity === activeFilter)
  }, [risksWithMeta, activeFilter])

  // Statistiken
  const stats = useMemo(() => {
    const critical = risksWithMeta.filter(r => r.severity === 'high').length
    const relevant = risksWithMeta.filter(r => r.severity === 'medium').length
    const observe = risksWithMeta.filter(r => r.severity === 'low').length
    return { critical, relevant, observe, total: risksWithMeta.length }
  }, [risksWithMeta])

  // Empty State
  if (risks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lp-card lp-card--padded"
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--lp-text)] mb-2">
              Keine Risiken identifiziert
            </h3>
            <p className="text-sm text-[var(--lp-muted)] max-w-sm mx-auto">
              Aktuell wurden keine Risiken für dieses Projekt erkannt.
              Die Analyse wird fortlaufend aktualisiert.
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Statistik Header */}
      <section className="lp-card lp-card--padded">
        <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Kritische Risiken"
            value={stats.critical}
            color="rose"
            icon={AlertTriangle}
            trend={stats.critical > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Relevante Risiken"
            value={stats.relevant}
            color="amber"
            icon={AlertCircle}
            trend="neutral"
          />
          <StatCard
            label="Zu beobachten"
            value={stats.observe}
            color="zinc"
            icon={Info}
            trend="neutral"
          />
          <StatCard
            label="Gesamt"
            value={stats.total}
            color="violet"
            icon={BarChart3}
            trend="neutral"
          />
        </div>
      </section>

      {/* Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
          <FilterTab
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            label="Alle"
            count={stats.total}
          />
          <FilterTab
            active={activeFilter === 'high'}
            onClick={() => setActiveFilter('high')}
            label="Kritisch"
            count={stats.critical}
            color="rose"
          />
          <FilterTab
            active={activeFilter === 'medium'}
            onClick={() => setActiveFilter('medium')}
            label="Relevant"
            count={stats.relevant}
            color="amber"
          />
          <FilterTab
            active={activeFilter === 'low'}
            onClick={() => setActiveFilter('low')}
            label="Beobachten"
            count={stats.observe}
            color="zinc"
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
          <ViewToggleButton
            active={viewMode === 'matrix'}
            onClick={() => setViewMode('matrix')}
            icon={Activity}
            label="Matrix"
          />
          <ViewToggleButton
            active={viewMode === 'cards'}
            onClick={() => setViewMode('cards')}
            icon={LayoutGrid}
            label="Karten"
          />
          <ViewToggleButton
            active={viewMode === 'list'}
            onClick={() => setViewMode('list')}
            icon={BarChart3}
            label="Liste"
          />
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'matrix' && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <RiskMatrix
              risks={filteredRisks}
              onRiskClick={setSelectedRisk}
            />
          </motion.div>
        )}

        {viewMode === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <RiskCards
              risks={filteredRisks}
              onRiskClick={setSelectedRisk}
            />
          </motion.div>
        )}

        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <RiskList
              risks={filteredRisks}
              onRiskClick={setSelectedRisk}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Risk Detail Modal */}
      <AnimatePresence>
        {selectedRisk && (
          <RiskDetailModal
            risk={selectedRisk}
            onClose={() => setSelectedRisk(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StatCard({
  label,
  value,
  color,
  icon: Icon,
  trend
}: {
  label: string
  value: number
  color: 'rose' | 'amber' | 'zinc' | 'violet'
  icon: React.ComponentType<{ className?: string }>
  trend: 'up' | 'down' | 'neutral'
}) {
  const colors = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    zinc: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    violet: 'bg-violet-500/10 text-violet-400 border-violet-500/20'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} flex items-center justify-between`}>
      <div>
        <div className="text-xs uppercase tracking-wider opacity-80 mb-1">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 opacity-60" />
        <TrendIcon className="w-4 h-4 opacity-40" />
      </div>
    </div>
  )
}

function FilterTab({
  active,
  onClick,
  label,
  count,
  color
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: 'rose' | 'amber' | 'zinc'
}) {
  const baseClasses = "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
  const activeClasses = active
    ? color === 'rose'
      ? "bg-rose-500 text-white"
      : color === 'amber'
      ? "bg-amber-500 text-white"
      : color === 'zinc'
      ? "bg-zinc-500 text-white"
      : "bg-[var(--lp-cobalt)] text-white"
    : "text-[var(--lp-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface)]"

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      {label}
      <span className={`text-xs ${active ? 'opacity-80' : 'opacity-60'}`}>
        {count}
      </span>
    </button>
  )
}

function ViewToggleButton({
  active,
  onClick,
  icon: Icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-1 ${
        active
          ? "bg-[var(--lp-cobalt)] text-white"
          : "text-[var(--lp-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface)]"
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ============================================================================
// RISK MATRIX
// ============================================================================

function RiskMatrix({
  risks,
  onRiskClick
}: {
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
}) {
  // Matrix-Positionen berechnen (2x2 Matrix)
  const getQuadrant = (probability: number, impact: number): string => {
    if (probability >= 50 && impact >= 50) return 'high-high'
    if (probability >= 50 && impact < 50) return 'high-low'
    if (probability < 50 && impact >= 50) return 'low-high'
    return 'low-low'
  }

  const quadrantRisks = {
    'high-high': risks.filter(r => getQuadrant(r.probability, r.impact) === 'high-high'),
    'high-low': risks.filter(r => getQuadrant(r.probability, r.impact) === 'high-low'),
    'low-high': risks.filter(r => getQuadrant(r.probability, r.impact) === 'low-high'),
    'low-low': risks.filter(r => getQuadrant(r.probability, r.impact) === 'low-low')
  }

  return (
    <div className="lp-card lp-card--padded">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-violet-400" />
        <h3 className="text-lg font-semibold text-[var(--lp-text)]">Risikomatrix</h3>
        <span className="text-sm text-[var(--lp-muted)] ml-2">
          (Wahrscheinlichkeit × Auswirkung)
        </span>
      </div>

      {/* Matrix Grid */}
      <div className="relative">
        {/* Y-Axis Label */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-[var(--lp-muted)] whitespace-nowrap">
          Auswirkung →
        </div>

        {/* Matrix */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Top Row: High Impact */}
          <MatrixQuadrant
            title="Kritisch"
            subtitle="Wahrscheinlich & Hohe Auswirkung"
            color="rose"
            risks={quadrantRisks['high-high']}
            onRiskClick={onRiskClick}
          />
          <MatrixQuadrant
            title="Ernst"
            subtitle="Unwahrscheinlich & Hohe Auswirkung"
            color="amber"
            risks={quadrantRisks['low-high']}
            onRiskClick={onRiskClick}
          />

          {/* Bottom Row: Low Impact */}
          <MatrixQuadrant
            title="Wahrscheinlich"
            subtitle="Wahrscheinlich & Niedrige Auswirkung"
            color="amber"
            risks={quadrantRisks['high-low']}
            onRiskClick={onRiskClick}
          />
          <MatrixQuadrant
            title="Niedrig"
            subtitle="Unwahrscheinlich & Niedrige Auswirkung"
            color="zinc"
            risks={quadrantRisks['low-low']}
            onRiskClick={onRiskClick}
          />
        </div>

        {/* X-Axis Label */}
        <div className="text-center text-xs text-[var(--lp-muted)] mt-2">
          Eintrittswahrscheinlichkeit →
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-[var(--lp-muted)]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-500" />
          <span>Kritisch</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Ernst/Relevant</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-zinc-500" />
          <span>Niedrig</span>
        </div>
      </div>
    </div>
  )
}

function MatrixQuadrant({
  title,
  subtitle,
  color,
  risks,
  onRiskClick
}: {
  title: string
  subtitle: string
  color: 'rose' | 'amber' | 'zinc'
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
}) {
  const colors = {
    rose: {
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      header: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-400'
    },
    amber: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      header: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400'
    },
    zinc: {
      bg: 'bg-zinc-500/5',
      border: 'border-zinc-500/20',
      header: 'text-zinc-400',
      badge: 'bg-zinc-500/20 text-zinc-400'
    }
  }

  const c = colors[color]

  return (
    <div className={`p-4 rounded-xl border ${c.border} ${c.bg} min-h-[200px]`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className={`font-semibold ${c.header}`}>{title}</h4>
          <p className="text-xs text-[var(--lp-muted)]">{subtitle}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.badge}`}>
          {risks.length}
        </span>
      </div>

      <div className="space-y-2">
        {risks.slice(0, 4).map((risk) => (
          <motion.button
            key={risk.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRiskClick(risk)}
            className="w-full text-left p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-violet-500/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--lp-text)] truncate">
                  {risk.title}
                </p>
                <p className="text-xs text-[var(--lp-muted)] truncate">
                  {risk.category}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--lp-muted)] flex-shrink-0" />
            </div>
          </motion.button>
        ))}
        {risks.length > 4 && (
          <p className="text-xs text-center text-[var(--lp-muted)] py-2">
            +{risks.length - 4} weitere
          </p>
        )}
        {risks.length === 0 && (
          <p className="text-xs text-center text-[var(--lp-muted)] py-4">
            Keine Risiken
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// RISK CARDS
// ============================================================================

function RiskCards({
  risks,
  onRiskClick
}: {
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {risks.map((risk) => {
        const colors = severityToColor(risk.severity)

        return (
          <motion.button
            key={risk.id}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRiskClick(risk)}
            className={`text-left p-5 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-200`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                {severityToGerman(risk.severity)}
              </div>
              <span className="text-xs text-[var(--lp-muted)]">
                {risk.category}
              </span>
            </div>

            {/* Content */}
            <h4 className="font-semibold text-[var(--lp-text)] mb-2 line-clamp-2">
              {risk.title}
            </h4>
            <p className="text-sm text-[var(--lp-muted)] line-clamp-2 mb-4">
              {risk.explanation}
            </p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[var(--lp-cobalt)]" />
                <span className="text-[var(--lp-muted)]">
                  P: {probabilityToLabel(risk.probability)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-[var(--lp-muted)]">
                  A: {impactToLabel(risk.impact)}
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-3 space-y-2">
              <div className="h-1.5 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.probability}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`h-full ${colors.accent} rounded-full`}
                />
              </div>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// ============================================================================
// RISK LIST
// ============================================================================

function RiskList({
  risks,
  onRiskClick
}: {
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
}) {
  return (
    <div className="lp-card lp-card--padded overflow-hidden">
      <div className="divide-y divide-[var(--lp-border)]">
        {risks.map((risk) => {
          const colors = severityToColor(risk.severity)

          return (
            <motion.button
              key={risk.id}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              onClick={() => onRiskClick(risk)}
              className="w-full text-left p-4 flex items-center gap-4 transition-colors"
            >
              {/* Severity Indicator */}
              <div className={`w-2 h-12 rounded-full ${colors.accent}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {severityToGerman(risk.severity)}
                  </span>
                  <span className="text-xs text-[var(--lp-muted)]">•</span>
                  <span className="text-xs text-[var(--lp-muted)]">{risk.category}</span>
                </div>
                <h4 className="font-medium text-[var(--lp-text)] truncate">
                  {risk.title}
                </h4>
                <p className="text-sm text-[var(--lp-muted)] truncate">
                  {risk.explanation}
                </p>
              </div>

              {/* Metrics */}
              <div className="hidden sm:flex items-center gap-6 text-xs text-[var(--lp-muted)]">
                <div className="text-right">
                  <div className="text-[var(--lp-text)]">{risk.probability}%</div>
                  <div>Wahrscheinlichkeit</div>
                </div>
                <div className="text-right">
                  <div className="text-[var(--lp-text)]">{risk.impact}%</div>
                  <div>Auswirkung</div>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-[var(--lp-muted)] flex-shrink-0" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// RISK DETAIL MODAL
// ============================================================================

function RiskDetailModal({
  risk,
  onClose
}: {
  risk: RiskWithMeta
  onClose: () => void
}) {
  const colors = severityToColor(risk.severity)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg lp-card lp-card--padded max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                {severityToGerman(risk.severity)}
              </span>
              <span className="text-xs text-[var(--lp-muted)]">{risk.category}</span>
            </div>
            <h3 className="text-xl font-semibold text-[var(--lp-text)]">
              {risk.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--lp-surface-soft)] transition-colors"
          >
            <X className="w-5 h-5 text-[var(--lp-muted)]" />
          </button>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">Beschreibung</h4>
          <p className="text-[var(--lp-text)] leading-relaxed">{risk.explanation}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${colors.light} border ${colors.border}`}>
            <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">
              Eintrittswahrscheinlichkeit
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.probability}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${colors.accent} rounded-full`}
                />
              </div>
              <span className="text-lg font-semibold text-[var(--lp-text)]">
                {risk.probability}%
              </span>
            </div>
            <p className="text-xs text-[var(--lp-muted)] mt-2">
              {probabilityToLabel(risk.probability)}
            </p>
          </div>

          <div className={`p-4 rounded-xl ${colors.light} border ${colors.border}`}>
            <h4 className="text-sm font-medium text-[var(--lp-muted)] mb-2">
              Auswirkung
            </h4>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.impact}%` }}
                  transition={{ duration: 0.5 }}
                  className={`h-full ${colors.accent} rounded-full`}
                />
              </div>
              <span className="text-lg font-semibold text-[var(--lp-text)]">
                {risk.impact}%
              </span>
            </div>
            <p className="text-xs text-[var(--lp-muted)] mt-2">
              {impactToLabel(risk.impact)}
            </p>
          </div>
        </div>

        {/* Risk Level Indicator */}
        <div className={`p-4 rounded-xl ${colors.light} border ${colors.border}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${colors.text}`} />
            <div>
              <h4 className="font-medium text-[var(--lp-text)]">
                Risikobewertung: {severityToGerman(risk.severity)}
              </h4>
              <p className="text-sm text-[var(--lp-muted)]">
                {risk.severity === 'high'
                  ? 'Dieses Risiko erfordert sofortige Aufmerksamkeit und Gegenmaßnahmen.'
                  : risk.severity === 'medium'
                  ? 'Dieses Risiko sollte überwacht und bei Bedarf adressiert werden.'
                  : 'Dieses Risiko ist bekannt, hat aber derzeit keine hohe Priorität.'}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
