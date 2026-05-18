import {
  Building2,
  Clock,
  AlertTriangle,
  Target,
  Zap,
  Activity
} from 'lucide-react'
import DependencySimulationPanel from '../components/DependencySimulationPanel'
import { dummyProject, dummyActors, dummyRisks, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onOpenTwin: () => void
  onNewInput: () => void
}

export default function TodayScreen({ onOpenTwin, onNewInput }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-6 animate-in">
      
      {/* HERO: Next Move - ohne Organigram */}
      <section className="card-hero p-8 md:p-12">
        <div className="grid-12 gap-8">
          
          {/* Links: Next Move */}
          <div className="col-7 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="label label-accent">Heute</span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-sm text-[#ef4444] font-semibold">Blocker erkannt</span>
              </div>
            </div>

            <h1 className="hero-headline mb-6">
              Der nächste{' '}
              <span className="gradient-text">wirksamste Schritt</span>
            </h1>

            <p className="hero-subline text-zinc-300 mb-4">
              {targetActor?.name} anschreiben: BWA bis Mittwoch benötigt
            </p>

            <p className="text-zinc-500 max-w-lg mb-8">
              Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen.
            </p>

            <div className="flex flex-wrap gap-2 mb-10">
              <Pill icon={<Target className="w-3.5 h-3.5" />} label="Wirkung" value="Hoch" type="high" />
              <Pill icon={<Clock className="w-3.5 h-3.5" />} label="Aufwand" value="Niedrig" type="low" />
              <Pill icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Frist" value="Heute" type="urgent" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenTwin} className="btn-primary group">
                <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
                Project Twin öffnen
              </button>
              <button onClick={onNewInput} className="btn-secondary">
                Neuer Input
              </button>
            </div>
          </div>

          {/* Rechts: Context/Preview - ohne Organigram */}
          <div className="col-5">
            <div className="card-glass p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">Systemstatus</span>
                </div>
                <span className="label">Live</span>
              </div>

              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Blockiert durch</div>
                  <div className="font-semibold text-[#ef4444]">BWA fehlt</div>
                </div>
                
                <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Auswirkung</div>
                  <div className="font-semibold text-zinc-300">Bankprüfung verzögert</div>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Nächster Hebel</div>
                  <div className="font-semibold text-emerald-400">Steuerberater Müller</div>
                </div>
              </div>

              <div className="risk-warning p-4 mt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Wenn heute nichts passiert</p>
                    <p className="text-xs text-zinc-400">Risiko steigt, Bankprüfung bleibt blockiert.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dependency Simulation Panel */}
      <DependencySimulationPanel variant="compact" />

      {/* Active Project + Systemstatus */}
      <div className="grid-12 gap-6">
        {/* Active Project */}
        <div className="col-8">
          <section className="card-focus p-6">
            <div className="label mb-4">Aktives Projekt</div>
            
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{dummyProject.name}</h3>
                <p className="text-zinc-500 mb-4">{dummyProject.goal}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="label label-blocked">Blockiert</span>
                  <span className="label">1 offene Aktion</span>
                  <span className="label">{dummyRisks.length} Risiken</span>
                </div>

                <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5">
                  <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Nächster Hebel</div>
                  <div className="font-semibold">Steuerberater Müller anschreiben</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Systemstatus */}
        <div className="col-4">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <Activity className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium">Systemstatus</span>
            </div>

            <div className="space-y-3">
              <StatusRow label="Aktive Projekte" value="1" />
              <StatusRow label="Offene Aktionen" value="1" />
              <StatusRow label="Risiken" value="3" highlight />
              <StatusRow label="Blocker" value="1" danger />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

/* Components */

function Pill({ icon, label, value, type }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  type: 'high' | 'low' | 'urgent' | 'amber'
}) {
  const typeClasses = {
    high: 'pill-high',
    low: 'pill-low',
    urgent: 'pill-urgent',
    amber: 'pill-amber'
  }

  return (
    <div className={`pill ${typeClasses[type]}`}>
      {icon}
      <span>{label}: {value}</span>
    </div>
  )
}

function StatusRow({ label, value, highlight, danger }: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`font-semibold ${danger ? 'text-[#ef4444]' : highlight ? 'text-amber-400' : ''}`}>
        {value}
      </span>
    </div>
  )
}
