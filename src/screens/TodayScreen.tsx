import { motion } from 'motion/react'
import { Target, Clock, AlertTriangle, Zap, Activity, Building2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import { DependencySimulationPanel } from '../components/dependency/DependencySimulationPanel'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

interface TodayScreenProps {
  onOpenTwin: () => void
  onNewInput: () => void
  activeTwin: StoredProjectTwin | null
}

export default function TodayScreen({ onOpenTwin, onNewInput, activeTwin }: TodayScreenProps) {
  const analysis = activeTwin?.analysis ?? null
  const hasTwin = Boolean(activeTwin)

  return (
    <div className="space-y-10">
      
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="panel-premium p-8 md:p-12"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:items-start">
          
          {/* Left: Hero Content */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="violet" icon={Zap}>Heute</Badge>
              <div className="flex items-center gap-2">
                <span className="status-dot status-dot-critical"></span>
                <span className="text-sm text-[#fb7185] font-medium">Blocker erkannt</span>
              </div>
            </div>

            <h1 className="text-display text-balance mb-6">
              Der nächste{' '}
              <span className="gradient-text">wirksamste Schritt</span>
            </h1>

            <p className="text-subhead text-zinc-300 mb-4">
              {analysis ? analysis.nextMove.title : 'Steuerberater Müller anschreiben: BWA bis Mittwoch benötigt'}
            </p>

            <p className="text-body max-w-xl mb-8">
              {analysis ? analysis.nextMove.reason : 'Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen.'}
            </p>

            {/* Pills */}
            <div className="flex flex-wrap gap-3 mb-10">
              <Pill icon={Target} label="Wirkung" value={analysis ? analysis.nextMove.impact : 'Hoch'} variant="high" />
              <Pill icon={Clock} label="Aufwand" value={analysis ? analysis.nextMove.effort : 'Niedrig'} variant="low" />
              <Pill icon={AlertTriangle} label="Frist" value={analysis?.nextMove.deadline ?? 'Heute'} variant="urgent" />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              {hasTwin ? (
                <Button onClick={onOpenTwin} icon={Zap}>
                  Project Twin öffnen
                </Button>
              ) : (
                <Button onClick={onNewInput} icon={Zap}>
                  Neuen Input erfassen
                </Button>
              )}
              <Button variant="secondary" onClick={onNewInput}>
                Neuer Input
              </Button>
            </div>
          </div>

          {/* Right: Context Panel */}
          <div className="lg:col-span-5">
            <div className="panel-card p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">Systemstatus</span>
                </div>
                <Badge variant="neutral">Live</Badge>
              </div>

              <div className="space-y-4">
                <StatusCard 
                  label="Blockiert durch" 
                  value={analysis?.dependencies.find((dependency) => dependency.isBlocker)?.from ?? 'Noch keine Analyse'} 
                  variant="danger" 
                />
                <StatusCard 
                  label="Auswirkung" 
                  value={analysis?.risks[0]?.title ?? 'Bitte zuerst Projektlage erfassen'} 
                />
                <StatusCard 
                  label="Nächster Hebel" 
                  value={analysis?.nextMove.title ?? 'Neuen Input erfassen'} 
                  variant="success" 
                />
              </div>

              {/* Risk Warning */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-6 p-4 rounded-2xl bg-[#fb7185]/5 border border-[#fb7185]/20"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#fb7185] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-zinc-200 mb-1">
                      Wenn heute nichts passiert
                    </p>
                    <p className="text-xs text-zinc-400">
                      {analysis?.risks[0]?.explanation ?? 'Sobald eine Projektlage erfasst ist, zeigt Load Pilot hier den wichtigsten Risikokontext.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Dependency Simulation Panel */}
      <DependencySimulationPanel variant="compact" analysis={analysis} />

      {/* Bottom Section: Active Project + System Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Project */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-8"
        >
          <Panel variant="compact">
            {/* Header mit Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="text-label text-zinc-500">AKTIVES PROJEKT</div>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Project Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-[#ff006e] flex items-center justify-center shadow-lg flex-shrink-0">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-headline mb-2">{analysis?.project.title ?? 'Noch kein Project Twin aktiv'}</h3>
                <p className="text-body mb-5">
                  {analysis?.project.description ?? 'Erfasse zuerst eine Projektlage, damit Load Pilot einen echten Project Twin erzeugen und hier anzeigen kann.'}
                </p>

                {/* Badges Row */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <Badge variant={analysis?.project.status === 'blocked' ? 'rose' : 'blue'}>
                    {analysis?.project.status ?? 'Kein Twin'}
                  </Badge>
                  <Badge variant="neutral">{analysis?.actions.length ?? 0} offene Aktionen</Badge>
                  <Badge variant="neutral">{analysis?.risks.length ?? 0} Risiken</Badge>
                </div>

                {/* Next Lever Section */}
                <div className="panel-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <span className="text-label text-violet-400">NÄCHSTER HEBEL</span>
                  </div>
                  <div className="text-lg font-semibold text-zinc-200">{analysis?.nextMove.title ?? 'Neuen Input erfassen'}</div>
                  <p className="text-sm text-zinc-500 mt-1">{analysis?.nextMove.deadline ?? 'Noch keine Analyse vorhanden'}</p>
                </div>
              </div>
            </div>
          </Panel>
        </motion.div>

        {/* System Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-4"
        >
          <Panel variant="compact">
            {/* Header mit Icon und Titel */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Activity className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-base font-semibold">Systemstatus</span>
            </div>

            {/* Stats Grid mit konsistenter Spacing */}
            <div className="space-y-3">
              <StatRow label="Aktive Projekte" value={hasTwin ? '1' : '0'} />
              <StatRow label="Offene Aktionen" value={String(analysis?.actions.length ?? 0)} />
              <StatRow label="Risiken" value={String(analysis?.risks.length ?? 0)} warning />
              <StatRow label="Blocker" value={String(analysis?.dependencies.filter((dependency) => dependency.isBlocker).length ?? 0)} danger />
            </div>
          </Panel>
        </motion.div>
      </div>
    </div>
  )
}

// Components

function Pill({ 
  icon: Icon, 
  label, 
  value, 
  variant 
}: { 
  icon: typeof Target
  label: string
  value: string
  variant: 'high' | 'low' | 'urgent'
}) {
  const colors = {
    high: 'border-rose-500/30 text-rose-400',
    low: 'border-emerald-500/30 text-emerald-400',
    urgent: 'border-[#fb7185]/30 text-[#fb7185]'
  }

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${colors[variant]} bg-white/5`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}: {value}</span>
    </div>
  )
}

function StatusCard({ 
  label, 
  value, 
  variant = 'default' 
}: { 
  label: string
  value: string
  variant?: 'default' | 'danger' | 'success'
}) {
  const colors = {
    default: 'text-zinc-300',
    danger: 'text-[#fb7185]',
    success: 'text-emerald-400'
  }

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <div className="text-label text-zinc-500 mb-1">{label}</div>
      <div className={`font-semibold ${colors[variant]}`}>{value}</div>
    </div>
  )
}

function StatRow({ 
  label, 
  value, 
  warning, 
  danger 
}: { 
  label: string
  value: string
  warning?: boolean
  danger?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className={`font-semibold ${danger ? 'text-[#fb7185]' : warning ? 'text-amber-400' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  )
}
