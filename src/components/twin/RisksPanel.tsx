/**
 * RisksPanel.tsx
 * Risk Radar Cockpit - Interaktive Risikoanalyse mit Matrix, KI-Analyse und Maßnahmen-Flow
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Shield,
  AlertTriangle,
  X,
  ChevronRight,
  LayoutGrid,
  Activity,
  Sparkles,
  Brain,
  Target,
  Zap,
  Plus,
  Bot,
  Eye,
  Tag,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  AlertOctagon,
  Loader2,
  Crosshair,
  FileText,
  Layers,
  Gauge,
  RotateCcw,
  List
} from 'lucide-react'
import type { ProjectRisk, RiskSeverity } from '../../types/projectTwin'
import type { Measure } from '../../types/measures'
import { addOrUpdateAttentionQueueItem } from '../../lib/attentionQueueStore'
import type { AttentionQueueItem } from '../../types/projectTwinV2'

// ============================================================================
// TYPES
// ============================================================================

type RiskFilter = 'all' | 'high' | 'medium' | 'low'
type ViewMode = 'matrix' | 'cards' | 'list'
type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'outdated'

interface RiskWithMeta extends ProjectRisk {
  id: string
  probability: number // 0-100
  impact: number // 0-100
  category: string
  whyCritical?: string
  mitigation?: string
  affectedAreas?: string[]
  suggestedAction?: string
  lastAnalyzed?: string
}

interface RisksPanelProps {
  risks: ProjectRisk[]
  projectId?: string
  projectTitle?: string
  onAddMeasure?: (measure: Measure) => void
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
  gradient: string
} => {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        accent: 'bg-rose-500',
        light: 'bg-rose-500/5',
        gradient: 'from-rose-500/20 to-rose-500/5'
      }
    case 'medium':
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        accent: 'bg-amber-500',
        light: 'bg-amber-500/5',
        gradient: 'from-amber-500/20 to-amber-500/5'
      }
    case 'low':
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        accent: 'bg-emerald-500',
        light: 'bg-emerald-500/5',
        gradient: 'from-emerald-500/20 to-emerald-500/5'
      }
    default:
      return {
        bg: 'bg-zinc-500/10',
        border: 'border-zinc-500/30',
        text: 'text-zinc-400',
        accent: 'bg-zinc-500',
        light: 'bg-zinc-500/5',
        gradient: 'from-zinc-500/20 to-zinc-500/5'
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

// KI-Analyse Simulation
const simulateRiskAnalysis = (risk: ProjectRisk, index: number): Partial<RiskWithMeta> => {
  const whyCriticalTemplates = {
    high: [
      'Kann Projektverzögerung um Wochen verursachen',
      'Hohe finanzielle Auswirkungen drohen',
      'Kritische Abhängigkeit blockiert weitere Schritte',
      'Rechtliche Konsequenzen möglich',
      'Langfristiger Imageschaden zu erwarten'
    ],
    medium: [
      'Moderate Verzögerung wahrscheinlich',
      'Zusätzliche Ressourcen erforderlich',
      'Stakeholder-Vertrauen beeinträchtigt',
      'Alternative Lösung nötig',
      'Überwachung empfohlen'
    ],
    low: [
      'Geringe Auswirkung bei Eintritt',
      'Kann ohne große Anstrengung abgefedert werden',
      'Standard-Prozess ausreichend',
      'Seltenes Ereignis',
      'Kontrollierbar bei Monitoring'
    ]
  }
  
  const mitigationTemplates = {
    high: [
      'Sofortige Eskalation zum Projektleiter',
      'Notfallplan aktivieren',
      'Alternativplan entwickeln',
      'Ressourcen umverteilen',
      'Stakeholder frühzeitig informieren'
    ],
    medium: [
      'Wöchentliches Monitoring einrichten',
      'Pufferzeit in Planung einbauen',
      'Backup-Lösung vorbereiten',
      'Verantwortlichen benennen',
      'Regelmäßige Status-Updates'
    ],
    low: [
      'Beobachtung im wöchentlichen Meeting',
      'Dokumentation aktualisieren',
      'Team sensibilisieren',
      'Frühindikator definieren',
      'Bei Bedarf eskalieren'
    ]
  }
  
  const areaTemplates = ['Budget', 'Zeitplan', 'Ressourcen', 'Stakeholder', 'Compliance', 'Qualität', 'Technisch']
  
  const severityTemplates = whyCriticalTemplates[risk.severity]
  const mitigationSeverityTemplates = mitigationTemplates[risk.severity]
  
  return {
    whyCritical: severityTemplates[index % severityTemplates.length],
    mitigation: mitigationSeverityTemplates[index % mitigationSeverityTemplates.length],
    affectedAreas: [
      areaTemplates[index % areaTemplates.length],
      areaTemplates[(index + 2) % areaTemplates.length]
    ],
    suggestedAction: `Prüfen: ${risk.title.substring(0, 40)}...`,
    lastAnalyzed: new Date().toISOString()
  }
}

// Berechne Gesamtrisiko-Score
const calculateRiskScore = (risks: RiskWithMeta[]): { score: number; level: 'low' | 'medium' | 'high' } => {
  if (risks.length === 0) return { score: 0, level: 'low' }
  
  const totalWeight = risks.reduce((acc, risk) => {
    const severityWeight = risk.severity === 'high' ? 3 : risk.severity === 'medium' ? 2 : 1
    return acc + (risk.probability * risk.impact * severityWeight) / 100
  }, 0)
  
  const maxPossible = risks.length * 300
  const score = Math.round((totalWeight / maxPossible) * 100)
  
  return {
    score: Math.min(score, 100),
    level: score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low'
  }
}

// ============================================================================
// COMPONENT: RisksPanel - Risk Radar Cockpit
// ============================================================================

export default function RisksPanel({ risks, projectId, projectTitle, onAddMeasure }: RisksPanelProps) {
  const [activeFilter, setActiveFilter] = useState<RiskFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('matrix')
  const [selectedRisk, setSelectedRisk] = useState<RiskWithMeta | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('pending')
  const [analyzedRisks, setAnalyzedRisks] = useState<Set<string>>(new Set())
  const [showMeasureModal, setShowMeasureModal] = useState(false)
  const [creatingMeasureFor, setCreatingMeasureFor] = useState<RiskWithMeta | null>(null)

  // Risiken mit Meta-Daten erweitern
  const risksWithMeta: RiskWithMeta[] = useMemo(() => {
    return risks.map((risk, index) => {
      let baseProbability: number
      let baseImpact: number

      switch (risk.severity) {
        case 'high':
          baseProbability = 60 + (index % 30)
          baseImpact = 70 + (index % 25)
          break
        case 'medium':
          baseProbability = 35 + (index % 30)
          baseImpact = 40 + (index % 30)
          break
        case 'low':
          baseProbability = 15 + (index % 20)
          baseImpact = 15 + (index % 25)
          break
        default:
          baseProbability = 50
          baseImpact = 50
      }

      const categories = ['Finanzen', 'Zeitplan', 'Qualität', 'Ressourcen', 'Stakeholder', 'Technisch', 'Extern', 'Compliance']
      const isAnalyzed = analyzedRisks.has(`risk-${index}`)
      
      const analysis = isAnalyzed ? simulateRiskAnalysis(risk, index) : {}

      return {
        ...risk,
        id: `risk-${index}`,
        probability: baseProbability,
        impact: baseImpact,
        category: categories[index % categories.length],
        ...analysis
      }
    })
  }, [risks, analyzedRisks])

  // Gefilterte Risiken
  const filteredRisks = useMemo(() => {
    if (activeFilter === 'all') return risksWithMeta
    return risksWithMeta.filter(risk => risk.severity === activeFilter)
  }, [risksWithMeta, activeFilter])

  // Statistiken
  const stats = useMemo(() => {
    const critical = risksWithMeta.filter(r => r.severity === 'high')
    const relevant = risksWithMeta.filter(r => r.severity === 'medium')
    const observe = risksWithMeta.filter(r => r.severity === 'low')
    return { 
      critical: critical.length, 
      relevant: relevant.length, 
      observe: observe.length, 
      total: risksWithMeta.length,
      criticalFirst: critical[0],
      relevantFirst: relevant[0],
      observeFirst: observe[0]
    }
  }, [risksWithMeta])

  // Risk Score
  const riskScore = useMemo(() => calculateRiskScore(risksWithMeta), [risksWithMeta])

  // KI-Analyse starten
  const startAnalysis = useCallback(() => {
    setAnalysisStatus('analyzing')
    
    // Simuliere Analyse-Dauer
    setTimeout(() => {
      setAnalyzedRisks(new Set(risksWithMeta.map(r => r.id)))
      setAnalysisStatus('completed')
    }, 2000)
  }, [risksWithMeta])

  // Maßnahme aus Risiko erstellen
  const createMeasureFromRisk = useCallback((risk: RiskWithMeta) => {
    const newMeasure: Measure = {
      id: `measure-risk-${Date.now()}`,
      projectId: projectId || 'unknown',
      projectTitle: projectTitle || 'Unbekanntes Projekt',
      title: `Gegenmaßnahme: ${risk.title.substring(0, 50)}`,
      description: risk.mitigation || `Gegenmaßnahme für: ${risk.title}\n\nBegründung: ${risk.whyCritical || risk.explanation}`,
      status: 'open',
      priority: risk.severity === 'high' ? 'critical' : risk.severity === 'medium' ? 'high' : 'medium',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      owner: 'Unassigned',
      tags: ['Risk-Mitigation', ...(risk.affectedAreas || []), risk.category].filter(Boolean),
      createdAt: new Date().toISOString(),
      source: 'twin_action',
      strategicGoal: `Risikominderung: ${severityToGerman(risk.severity)}`,
      notes: `Automatisch aus Risiko erstellt:\n- Risiko: ${risk.title}\n- Schwere: ${severityToGerman(risk.severity)}\n- Wahrscheinlichkeit: ${risk.probability}%\n- Auswirkung: ${risk.impact}%`
    }

    // Zu Attention Queue hinzufügen
    if (projectId) {
      const queueItem: AttentionQueueItem = {
        id: `measure-${newMeasure.id}`,
        twinId: projectId,
        title: newMeasure.title,
        description: newMeasure.description,
        projectTitle: projectTitle || 'Projekt',
        severity: newMeasure.priority === 'critical' ? 'critical' : newMeasure.priority === 'high' ? 'high' : 'medium',
        status: 'open',
        category: 'risk',
        reason: `Abgeleitet von Risiko: ${risk.title}`,
        nextStep: `Fällig: ${new Date(newMeasure.dueDate!).toLocaleDateString('de-DE')}`,
        createdAt: newMeasure.createdAt,
        updatedAt: newMeasure.createdAt
      }
      addOrUpdateAttentionQueueItem(projectId, queueItem)
    }

    // Callback für Parent
    onAddMeasure?.(newMeasure)
    
    // Modals schließen
    setShowMeasureModal(false)
    setCreatingMeasureFor(null)
    setSelectedRisk(null)
  }, [projectId, projectTitle, onAddMeasure])

  // Empty State
  if (risks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lp-card lp-card--padded"
      >
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </motion.div>
            <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-2">
              Keine Risiken identifiziert
            </h3>
            <p className="text-sm text-[var(--lp-muted)] max-w-sm mx-auto">
              Ausgezeichnet! Aktuell wurden keine Risiken für dieses Projekt erkannt.
              OSION überwacht fortlaufend neue Entwicklungen.
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
      {/* 1. RISIKO-ZUSAMMENFASSUNG - Drei klickbare Boxen */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Kritisch */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveFilter(activeFilter === 'high' ? 'all' : 'high')}
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
            activeFilter === 'high' 
              ? 'bg-rose-500/15 border-rose-500/40 shadow-lg shadow-rose-500/10' 
              : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20">
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-rose-400/80 font-medium uppercase tracking-wider">Kritisch</p>
                  <p className="text-2xl font-bold text-rose-400">{stats.critical}</p>
                </div>
              </div>
              {activeFilter === 'high' && (
                <div className="p-1 rounded-full bg-rose-500/30">
                  <CheckCircle2 className="w-4 h-4 text-rose-400" />
                </div>
              )}
            </div>
            {stats.criticalFirst ? (
              <div className="mt-3 pt-3 border-t border-rose-500/20">
                <p className="text-xs text-rose-400/60 mb-1">Höchste Priorität</p>
                <p className="text-sm text-rose-300 font-medium line-clamp-2">{stats.criticalFirst.title}</p>
              </div>
            ) : (
              <p className="text-sm text-rose-400/60 mt-3">Keine kritischen Risiken</p>
            )}
          </div>
        </motion.button>

        {/* Relevant */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveFilter(activeFilter === 'medium' ? 'all' : 'medium')}
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
            activeFilter === 'medium' 
              ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10' 
              : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-400/80 font-medium uppercase tracking-wider">Relevant</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.relevant}</p>
                </div>
              </div>
              {activeFilter === 'medium' && (
                <div className="p-1 rounded-full bg-amber-500/30">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </div>
              )}
            </div>
            {stats.relevantFirst ? (
              <div className="mt-3 pt-3 border-t border-amber-500/20">
                <p className="text-xs text-amber-400/60 mb-1">Zu beachten</p>
                <p className="text-sm text-amber-300 font-medium line-clamp-2">{stats.relevantFirst.title}</p>
              </div>
            ) : (
              <p className="text-sm text-amber-400/60 mt-3">Keine relevanten Risiken</p>
            )}
          </div>
        </motion.button>

        {/* Beobachten */}
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveFilter(activeFilter === 'low' ? 'all' : 'low')}
          className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${
            activeFilter === 'low' 
              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10' 
              : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <div className="relative p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-emerald-400/80 font-medium uppercase tracking-wider">Beobachten</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.observe}</p>
                </div>
              </div>
              {activeFilter === 'low' && (
                <div className="p-1 rounded-full bg-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              )}
            </div>
            {stats.observeFirst ? (
              <div className="mt-3 pt-3 border-t border-emerald-500/20">
                <p className="text-xs text-emerald-400/60 mb-1">Im Blick behalten</p>
                <p className="text-sm text-emerald-300 font-medium line-clamp-2">{stats.observeFirst.title}</p>
              </div>
            ) : (
              <p className="text-sm text-emerald-400/60 mt-3">Keine Beobachtungen</p>
            )}
          </div>
        </motion.button>
      </section>

      {/* 2. ANALYSE-BUTTON - Oder Risk Score wenn analysiert */}
      {analysisStatus === 'completed' ? (
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lp-card lp-card--padded overflow-hidden"
        >
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Risk Score Gauge */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-[var(--lp-surface)]"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${riskScore.score * 2.51} 251`}
                      className={riskScore.level === 'high' ? 'text-rose-500' : riskScore.level === 'medium' ? 'text-amber-500' : 'text-emerald-500'}
                      initial={{ strokeDasharray: '0 251' }}
                      animate={{ strokeDasharray: `${riskScore.score * 2.51} 251` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--lp-text)]">{riskScore.score}</span>
                    <span className="text-xs text-[var(--lp-muted)]">/100</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-[var(--lp-text)] flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-violet-400" />
                    Risiko-Score
                  </h3>
                  <p className="text-sm text-[var(--lp-muted)] mt-1">
                    {riskScore.level === 'high' 
                      ? 'Hohes Gesamtrisiko - Sofortmaßnahmen empfohlen'
                      : riskScore.level === 'medium'
                      ? 'Mittleres Risiko - Aktive Überwachung nötig'
                      : 'Niedriges Risiko - Regelmäßiges Monitoring ausreichend'}
                  </p>
                </div>
              </div>

              <div className="flex-1" />

              {/* Neue Analyse starten */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startAnalysis}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] border border-[var(--lp-border)] text-sm text-[var(--lp-muted)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Analyse wiederholen
              </motion.button>
            </div>
          </div>
        </motion.section>
      ) : analysisStatus === 'analyzing' ? (
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lp-card lp-card--padded"
        >
          <div className="p-8 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-flex mb-4"
            >
              <Loader2 className="w-8 h-8 text-violet-400" />
            </motion.div>
            <h3 className="text-lg font-semibold text-[var(--lp-text)] mb-2">
              OSION analysiert Risiken...
            </h3>
            <p className="text-sm text-[var(--lp-muted)]">
              Abhängigkeiten, Fristen, Gegenmaßnahmen und Betroffene Bereiche werden ermittelt
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-violet-400"
                />
              ))}
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lp-card lp-card--padded overflow-hidden"
        >
          <div className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500/20 to-cobalt-500/20 border border-violet-500/30">
                <Brain className="w-8 h-8 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--lp-text)] mb-1">
                  Risikoanalyse starten
                </h3>
                <p className="text-sm text-[var(--lp-muted)] max-w-lg">
                  OSION analysiert alle identifizierten Risiken, berechnet Wahrscheinlichkeiten,
                  bewertet Auswirkungen und schlägt Gegenmaßnahmen vor.
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startAnalysis}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cobalt-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5" />
              Jetzt analysieren
            </motion.button>
          </div>
        </motion.section>
      )}

      {/* Filter & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
          <FilterTab
            active={activeFilter === 'all'}
            onClick={() => setActiveFilter('all')}
            label="Alle"
            count={stats.total}
            icon={Layers}
          />
          <FilterTab
            active={activeFilter === 'high'}
            onClick={() => setActiveFilter('high')}
            label="Kritisch"
            count={stats.critical}
            color="rose"
            icon={AlertOctagon}
          />
          <FilterTab
            active={activeFilter === 'medium'}
            onClick={() => setActiveFilter('medium')}
            label="Relevant"
            count={stats.relevant}
            color="amber"
            icon={AlertTriangle}
          />
          <FilterTab
            active={activeFilter === 'low'}
            onClick={() => setActiveFilter('low')}
            label="Beobachten"
            count={stats.observe}
            color="emerald"
            icon={Eye}
          />
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)]">
          <ViewToggleButton
            active={viewMode === 'matrix'}
            onClick={() => setViewMode('matrix')}
            icon={Crosshair}
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
            icon={List}
            label="Liste"
          />
        </div>
      </div>

      {/* Content Views */}
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
              onCreateMeasure={(risk) => {
                setCreatingMeasureFor(risk)
                setShowMeasureModal(true)
              }}
              isAnalyzed={analysisStatus === 'completed'}
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
            onCreateMeasure={(risk) => {
              setCreatingMeasureFor(risk)
              setShowMeasureModal(true)
            }}
            isAnalyzed={analysisStatus === 'completed' && analyzedRisks.has(selectedRisk.id)}
          />
        )}
      </AnimatePresence>

      {/* Create Measure Modal */}
      <AnimatePresence>
        {showMeasureModal && creatingMeasureFor && (
          <CreateMeasureModal
            risk={creatingMeasureFor}
            onClose={() => {
              setShowMeasureModal(false)
              setCreatingMeasureFor(null)
            }}
            onConfirm={() => createMeasureFromRisk(creatingMeasureFor)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FilterTab({
  active,
  onClick,
  label,
  count,
  color,
  icon: Icon
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: 'rose' | 'amber' | 'emerald'
  icon: React.ComponentType<{ className?: string }>
}) {
  const baseClasses = "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
  const activeClasses = active
    ? color === 'rose'
      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/25"
      : color === 'amber'
      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
      : color === 'emerald'
      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
      : "bg-[var(--lp-cobalt)] text-white shadow-lg shadow-cobalt-500/25"
    : "text-[var(--lp-muted)] hover:text-[var(--lp-text)] hover:bg-[var(--lp-surface)]"

  return (
    <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      <Icon className="w-4 h-4" />
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
      className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
        active
          ? "bg-[var(--lp-cobalt)] text-white shadow-lg shadow-cobalt-500/25"
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
    <div className="lp-card lp-card--padded overflow-hidden">
      <div className="p-6 border-b border-[var(--lp-border)]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10">
            <Crosshair className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--lp-text)]">Risikomatrix</h3>
            <p className="text-sm text-[var(--lp-muted)]">
              Eintrittswahrscheinlichkeit × Auswirkung
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="relative">
          {/* Y-Axis Label */}
          <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-[var(--lp-muted)] font-medium whitespace-nowrap">
            Auswirkung →
          </div>

          {/* Matrix Grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <MatrixQuadrant
              title="Kritisch"
              subtitle="Wahrscheinlich & Hohe Auswirkung"
              color="rose"
              risks={quadrantRisks['high-high']}
              onRiskClick={onRiskClick}
              position="top-left"
            />
            <MatrixQuadrant
              title="Ernst"
              subtitle="Unwahrscheinlich & Hohe Auswirkung"
              color="amber"
              risks={quadrantRisks['low-high']}
              onRiskClick={onRiskClick}
              position="top-right"
            />
            <MatrixQuadrant
              title="Wahrscheinlich"
              subtitle="Wahrscheinlich & Niedrige Auswirkung"
              color="amber"
              risks={quadrantRisks['high-low']}
              onRiskClick={onRiskClick}
              position="bottom-left"
            />
            <MatrixQuadrant
              title="Niedrig"
              subtitle="Unwahrscheinlich & Niedrige Auswirkung"
              color="emerald"
              risks={quadrantRisks['low-low']}
              onRiskClick={onRiskClick}
              position="bottom-right"
            />
          </div>

          {/* X-Axis Label */}
          <div className="text-center text-xs text-[var(--lp-muted)] font-medium">
            Eintrittswahrscheinlichkeit →
          </div>
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
  color: 'rose' | 'amber' | 'emerald'
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
  position: string
}) {
  const colors = {
    rose: {
      bg: 'bg-rose-500/5',
      border: 'border-rose-500/20',
      header: 'text-rose-400',
      badge: 'bg-rose-500/20 text-rose-400',
      dot: 'bg-rose-500'
    },
    amber: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20',
      header: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-400',
      dot: 'bg-amber-500'
    },
    emerald: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20',
      header: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-400',
      dot: 'bg-emerald-500'
    }
  }

  const c = colors[color]

  return (
    <div className={`relative p-4 rounded-xl border ${c.border} ${c.bg} min-h-[220px] overflow-hidden`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className={`font-semibold ${c.header}`}>{title}</h4>
          <p className="text-xs text-[var(--lp-muted)]">{subtitle}</p>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.badge}`}>
          {risks.length}
        </span>
      </div>

      <div className="space-y-2">
        {risks.slice(0, 5).map((risk) => (
          <motion.button
            key={risk.id}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onRiskClick(risk)}
            className="w-full text-left p-3 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] hover:border-violet-500/50 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${c.dot} flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--lp-text)] truncate group-hover:text-violet-400 transition-colors">
                  {risk.title}
                </p>
              </div>
            </div>
          </motion.button>
        ))}
        {risks.length > 5 && (
          <p className="text-xs text-center text-[var(--lp-muted)] py-2">
            +{risks.length - 5} weitere
          </p>
        )}
        {risks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--lp-muted)]">
            <Shield className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">Keine Risiken</p>
          </div>
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
  onRiskClick,
  onCreateMeasure,
  isAnalyzed
}: {
  risks: RiskWithMeta[]
  onRiskClick: (risk: RiskWithMeta) => void
  onCreateMeasure: (risk: RiskWithMeta) => void
  isAnalyzed: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {risks.map((risk, index) => {
        const colors = severityToColor(risk.severity)

        return (
          <motion.div
            key={risk.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className={`group relative rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.gradient} p-5 transition-all duration-300 hover:shadow-xl`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                {severityToGerman(risk.severity)}
              </div>
              <span className="text-xs text-[var(--lp-muted)] flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {risk.category}
              </span>
            </div>

            {/* Content */}
            <h4 className="font-semibold text-[var(--lp-text)] mb-2 line-clamp-2 group-hover:text-violet-400 transition-colors">
              {risk.title}
            </h4>
            <p className="text-sm text-[var(--lp-muted)] line-clamp-2 mb-4">
              {risk.explanation}
            </p>

            {/* Metrics */}
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--lp-muted)]">Wahrscheinlichkeit</span>
                  <span className="text-[var(--lp-text)] font-medium">{risk.probability}%</span>
                </div>
                <div className="h-1.5 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.probability}%` }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                    className={`h-full ${colors.accent} rounded-full`}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[var(--lp-muted)]">Auswirkung</span>
                  <span className="text-[var(--lp-text)] font-medium">{risk.impact}%</span>
                </div>
                <div className="h-1.5 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.impact}%` }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
                    className={`h-full ${colors.accent} rounded-full opacity-70`}
                  />
                </div>
              </div>
            </div>

            {/* Affected Areas (nur wenn analysiert) */}
            {isAnalyzed && risk.affectedAreas && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {risk.affectedAreas.map((area) => (
                  <span 
                    key={area}
                    className="px-2 py-0.5 rounded text-[10px] bg-[var(--lp-surface)] text-[var(--lp-muted)] border border-[var(--lp-border)]"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-[var(--lp-border)]/50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onRiskClick(risk)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--lp-surface)] hover:bg-[var(--lp-surface-soft)] text-sm text-[var(--lp-text)] transition-colors"
              >
                <Eye className="w-4 h-4" />
                Details
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onCreateMeasure(risk)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Maßnahme
              </motion.button>
            </div>
          </motion.div>
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
        {risks.map((risk, index) => {
          const colors = severityToColor(risk.severity)

          return (
            <motion.button
              key={risk.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
              onClick={() => onRiskClick(risk)}
              className="w-full text-left p-4 flex items-center gap-4 transition-colors"
            >
              {/* Severity Indicator */}
              <div className={`w-1 h-14 rounded-full ${colors.accent}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold ${colors.text}`}>
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
              <div className="hidden md:flex items-center gap-8 text-xs">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--lp-text)] font-semibold">{risk.probability}%</span>
                    <span className="text-[var(--lp-muted)]">Wahrscheinlichkeit</span>
                  </div>
                  <div className="h-1 w-24 bg-[var(--lp-surface)] rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${colors.accent} rounded-full`} style={{ width: `${risk.probability}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--lp-text)] font-semibold">{risk.impact}%</span>
                    <span className="text-[var(--lp-muted)]">Auswirkung</span>
                  </div>
                  <div className="h-1 w-24 bg-[var(--lp-surface)] rounded-full mt-1 overflow-hidden">
                    <div className={`h-full ${colors.accent} rounded-full opacity-70`} style={{ width: `${risk.impact}%` }} />
                  </div>
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
  onClose,
  onCreateMeasure,
  isAnalyzed
}: {
  risk: RiskWithMeta
  onClose: () => void
  onCreateMeasure: (risk: RiskWithMeta) => void
  isAnalyzed: boolean
}) {
  const colors = severityToColor(risk.severity)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[var(--lp-card)] border border-[var(--lp-border)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-[var(--lp-border)] bg-[var(--lp-card)]/95 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${colors.bg} border ${colors.border}`}>
                <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {severityToGerman(risk.severity)}
                  </span>
                  <span className="text-xs text-[var(--lp-muted)] flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {risk.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[var(--lp-text)]">
                  {risk.title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--lp-surface-soft)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--lp-muted)]" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--lp-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Beschreibung
            </h4>
            <p className="text-[var(--lp-text)] leading-relaxed bg-[var(--lp-surface)] p-4 rounded-xl">
              {risk.explanation}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl ${colors.light} border ${colors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Activity className={`w-4 h-4 ${colors.text}`} />
                <h4 className="text-sm font-medium text-[var(--lp-muted)]">
                  Eintrittswahrscheinlichkeit
                </h4>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.probability}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${colors.accent} rounded-full`}
                  />
                </div>
                <span className="text-lg font-bold text-[var(--lp-text)]">
                  {risk.probability}%
                </span>
              </div>
              <p className="text-xs text-[var(--lp-muted)]">
                {probabilityToLabel(risk.probability)}
              </p>
            </div>

            <div className={`p-4 rounded-xl ${colors.light} border ${colors.border}`}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className={`w-4 h-4 ${colors.text}`} />
                <h4 className="text-sm font-medium text-[var(--lp-muted)]">
                  Auswirkung
                </h4>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${risk.impact}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${colors.accent} rounded-full`}
                  />
                </div>
                <span className="text-lg font-bold text-[var(--lp-text)]">
                  {risk.impact}%
                </span>
              </div>
              <p className="text-xs text-[var(--lp-muted)]">
                {impactToLabel(risk.impact)}
              </p>
            </div>
          </div>

          {/* AI Analysis Results (nur wenn analysiert) */}
          {isAnalyzed && (
            <>
              {/* Why Critical */}
              {risk.whyCritical && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--lp-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4" />
                    Warum kritisch
                  </h4>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                    <Lightbulb className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--lp-text)]">{risk.whyCritical}</p>
                  </div>
                </div>
              )}

              {/* Affected Areas */}
              {risk.affectedAreas && risk.affectedAreas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--lp-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Betroffene Bereiche
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {risk.affectedAreas.map((area) => (
                      <span 
                        key={area}
                        className="px-3 py-1.5 rounded-lg bg-[var(--lp-surface)] text-[var(--lp-text)] text-sm border border-[var(--lp-border)]"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mitigation */}
              {risk.mitigation && (
                <div>
                  <h4 className="text-sm font-semibold text-[var(--lp-muted)] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Empfohlene Gegenmaßnahme
                  </h4>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[var(--lp-text)]">{risk.mitigation}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[var(--lp-border)]">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCreateMeasure(risk)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cobalt-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
            >
              <Plus className="w-5 h-5" />
              Gegenmaßnahme erstellen
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {/* Mit KI bearbeiten */}}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] font-medium transition-colors"
            >
              <Bot className="w-5 h-5" />
              Mit KI bearbeiten
            </motion.button>
            {risk.severity !== 'low' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {/* Als beobachtet markieren */}}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] font-medium transition-colors"
              >
                <Eye className="w-5 h-5" />
                Als beobachtet markieren
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ============================================================================
// CREATE MEASURE MODAL
// ============================================================================

function CreateMeasureModal({
  risk,
  onClose,
  onConfirm
}: {
  risk: RiskWithMeta
  onClose: () => void
  onConfirm: () => void
}) {
  const colors = severityToColor(risk.severity)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-2xl bg-[var(--lp-card)] border border-[var(--lp-border)] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-violet-500/10">
              <Plus className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--lp-text)]">
                Gegenmaßnahme erstellen
              </h3>
              <p className="text-sm text-[var(--lp-muted)]">
                Aus Risiko: {severityToGerman(risk.severity)}
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
              <p className="text-xs text-[var(--lp-muted)] mb-1">Titel</p>
              <p className="text-sm font-medium text-[var(--lp-text)]">
                Gegenmaßnahme: {risk.title.substring(0, 50)}{risk.title.length > 50 ? '...' : ''}
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
              <p className="text-xs text-[var(--lp-muted)] mb-1">Priorität</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${colors.accent}`} />
                <span className={`text-sm font-medium ${colors.text}`}>
                  {risk.severity === 'high' ? 'Kritisch' : risk.severity === 'medium' ? 'Hoch' : 'Mittel'}
                </span>
              </div>
            </div>
            
            {risk.mitigation && (
              <div className="p-4 rounded-xl bg-[var(--lp-surface)] border border-[var(--lp-border)]">
                <p className="text-xs text-[var(--lp-muted)] mb-1">Beschreibung</p>
                <p className="text-sm text-[var(--lp-text)]">{risk.mitigation}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--lp-surface-soft)] hover:bg-[var(--lp-surface)] text-[var(--lp-text)] font-medium transition-colors"
            >
              Abbrechen
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-cobalt-500 text-white font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
            >
              Erstellen
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
