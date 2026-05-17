import {
  Building2,
  Clock,
  AlertTriangle,
  Target,
  ArrowRight,
  Plus,
  User,
  Landmark,
  FileText,
  ChevronRight,
  Zap,
  ArrowUpRight
} from 'lucide-react'
import { dummyProject, dummyActors, dummyRisks, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onOpenTwin: () => void
}

export default function TodayScreen({ onNewProject, onOpenTwin }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HERO: 2-Spalten Layout */}
      <section className="card-primary p-8 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Links: Next Move */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Label */}
            <div className="flex items-center gap-3 mb-4">
              <span className="label label-accent">Heute</span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-sm text-[#ef4444] font-medium">Blocker erkannt</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Der nächste{' '}
              <span className="gradient-text-accent">wirksamste Schritt</span>
            </h1>

            {/* Empfehlung */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30">
                <User className="w-5 h-5 text-[#ff006e]" />
              </div>
              <span className="text-xl font-semibold">{targetActor?.name} anschreiben: BWA bis Mittwoch benötigt</span>
            </div>

            <p className="text-body max-w-xl mb-5">
              Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen. Der Verkäufer hat eine Deadline gesetzt.
            </p>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              <StatusPill icon={<Target className="w-3.5 h-3.5" />} label="Wirkung" value="Hoch" type="high" />
              <StatusPill icon={<Clock className="w-3.5 h-3.5" />} label="Aufwand" value="Niedrig" type="low" />
              <StatusPill icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Frist" value="Heute" type="urgent" />
              <StatusPill icon={<FileText className="w-3.5 h-3.5" />} label="Blocker" value="BWA fehlt" type="amber" />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenTwin} className="btn-primary">
                <Zap className="w-4 h-4" />
                Project Twin öffnen
              </button>
              <button onClick={onNewProject} className="btn-secondary">
                <Plus className="w-4 h-4" />
                Neues Projekt
              </button>
            </div>
          </div>

          {/* Rechts: Dependency Panel */}
          <div className="lg:col-span-5">
            <div className="bg-[#0a0a0c]/80 border border-white/10 rounded-2xl p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-zinc-400">Erkannte Abhängigkeit</span>
                <span className="label">Simulation</span>
              </div>

              {/* Horizontal Diagram */}
              <div className="diagram-container mb-6">
                <DiagramNode
                  icon={<User className="w-4 h-4" />}
                  title="Steuerberater"
                  subtitle="liefert BWA"
                  status="normal"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<FileText className="w-4 h-4" />}
                  title="BWA"
                  subtitle="Fehlt"
                  status="blocked"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<Landmark className="w-4 h-4" />}
                  title="Bank"
                  subtitle="Prüfung"
                  status="normal"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<Building2 className="w-4 h-4" />}
                  title="Zusage"
                  subtitle="Finanzierung"
                  status="goal"
                />
              </div>

              {/* Risk Warning */}
              <div className="p-4 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    <span className="font-medium text-white">Wenn heute nichts passiert:</span>{' '}
                    Risiko steigt, Bankprüfung bleibt blockiert, Verkäufer wird unsicher.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM STATUS: Kompakt */}
      <section>
        <div className="grid grid-cols-4 gap-4">
          <MiniStat icon={<Building2 className="w-4 h-4" />} value="1" label="Projekte" />
          <MiniStat icon={<Clock className="w-4 h-4" />} value="1" label="Offen" />
          <MiniStat icon={<AlertTriangle className="w-4 h-4" />} value="3" label="Risiken" />
          <MiniStat icon={<Target className="w-4 h-4" />} value="1" label="Blocker" />
        </div>
      </section>

      {/* AKTIVES PROJEKT: Große Card */}
      <section>
        <div className="label mb-4">Aktives Projekt</div>
        
        <div className="card-primary p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Links: Projekt-Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{dummyProject.name}</h3>
                  <p className="text-zinc-400">{dummyProject.goal}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className="label label-blocked">Blockiert</span>
                <span className="label">1 offene Aktion</span>
                <span className="label">{dummyRisks.length} Risiken</span>
              </div>

              <div className="p-4 rounded-xl bg-[#0a0a0c] border border-white/5 mb-4">
                <div className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">Nächster Hebel</div>
                <div className="text-lg font-medium">Steuerberater Müller anschreiben</div>
              </div>

              <button onClick={onOpenTwin} className="btn-ghost">
                Öffnen
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Rechts: Mini-Flow + Stats */}
            <div className="border-l border-white/10 lg:pl-8">
              <div className="text-xs text-zinc-500 mb-3 uppercase tracking-wider">Kritischer Pfad</div>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-[#ef4444]" />
                  <span className="text-[#ef4444]">BWA</span>
                </div>
                <div className="pl-2 border-l-2 border-zinc-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Landmark className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">Bankprüfung</span>
                  </div>
                </div>
                <div className="pl-2 border-l-2 border-zinc-800">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-zinc-500" />
                    <span className="text-zinc-400">Zusage</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Projektlast</span>
                  <span className="font-semibold">{dummyProject.loadScore.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Blocker</span>
                  <span className="text-[#ef4444]">BWA fehlt</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-[#ef4444]">Prüfung blockiert</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* Components */

function StatusPill({ icon, label, value, type }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  type: 'high' | 'low' | 'urgent' | 'amber'
}) {
  const typeClasses = {
    high: 'status-pill-high',
    low: 'status-pill-low',
    urgent: 'status-pill-urgent',
    amber: 'status-pill-amber'
  }

  return (
    <div className={`status-pill ${typeClasses[type]}`}>
      {icon}
      <span>{label}: {value}</span>
    </div>
  )
}

function DiagramNode({
  icon,
  title,
  subtitle,
  status
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: 'normal' | 'blocked' | 'goal'
}) {
  const statusStyles = {
    normal: '',
    blocked: 'diagram-node-blocked',
    goal: 'border-[#8338ec]/50 bg-[#8338ec]/5'
  }

  const iconStyles = {
    normal: 'bg-zinc-800 text-zinc-400',
    blocked: 'bg-[#ef4444]/10 text-[#ef4444]',
    goal: 'bg-[#8338ec]/10 text-[#8338ec]'
  }

  return (
    <div className={`diagram-node ${statusStyles[status]}`}>
      <div className={`diagram-node-icon ${iconStyles[status]}`}>
        {icon}
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </div>
  )
}

function DiagramConnector() {
  return (
    <div className="diagram-connector">
      <div className="diagram-connector-line" />
      <ChevronRight className="w-4 h-4" />
    </div>
  )
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
        <span className="stat-card-value">{value}</span>
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
