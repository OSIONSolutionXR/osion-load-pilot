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
  Network,
  Zap
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
    <div className="space-y-6 animate-fade-in-up max-w-4xl mx-auto">
      {/* HERO - Kompakt, mittig, eine Zeile */}
      <section className="card-primary p-6 md:p-8">
        <div className="text-center">
          {/* Label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="label label-accent">Heute</span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
              <span className="text-sm text-[#ef4444] font-medium">Blocker erkannt</span>
            </div>
          </div>

          {/* Headline in einer Zeile */}
          <h1 className="text-hero mb-4">
            Der nächste <span className="gradient-text-accent">wirksamste Schritt</span>
          </h1>

          {/* Empfehlung */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30">
              <User className="w-5 h-5 text-[#ff006e]" />
            </div>
            <span className="text-lg font-semibold">{targetActor?.name} anschreiben: BWA bis Mittwoch benötigt</span>
          </div>
          
          <p className="text-body max-w-2xl mx-auto mb-5">
            Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen.
          </p>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
            <StatusPill icon={<Target className="w-3 h-3" />} label="Wirkung" value="Hoch" type="high" />
            <StatusPill icon={<Clock className="w-3 h-3" />} label="Aufwand" value="Niedrig" type="low" />
            <StatusPill icon={<AlertTriangle className="w-3 h-3" />} label="Frist" value="Heute" type="urgent" />
            <StatusPill icon={<FileText className="w-3 h-3" />} label="Blocker" value="BWA fehlt" type="amber" />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
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
      </section>

      {/* DEPENDENCY DIAGRAM */}
      <section className="card-secondary p-5">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Network className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400">Erkannte Abhängigkeit</span>
        </div>

        {/* Horizontal Diagram */}
        <div className="diagram-container">
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
        <div className="mt-4 p-4 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20 max-w-xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 leading-relaxed">
              <span className="font-medium text-white">Wenn heute nichts passiert:</span>{' '}
              Risiko steigt, Bankprüfung bleibt blockiert, Verkäufer wird unsicher.
            </p>
          </div>
        </div>
      </section>

      {/* SYSTEM SIGNALS */}
      <section>
        <div className="grid grid-cols-4 gap-3">
          <StatCard value="1" label="Projekte" />
          <StatCard value="1" label="Offen" />
          <StatCard value="3" label="Risiken" />
          <StatCard value="1" label="Blocker" />
        </div>
      </section>

      {/* AKTIVES PROJEKT */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <span className="label">Aktives Projekt</span>
        </div>

        <div className="card-secondary p-5" onClick={onOpenTwin}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{dummyProject.name}</h3>
                  <p className="text-sm text-zinc-500">{dummyProject.goal}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="label label-blocked">Blockiert</span>
                <span className="label">1 offene Aktion</span>
                <span className="label">{dummyRisks.length} Risiken</span>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm text-zinc-400">
                <div className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>BWA</span>
                </div>
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Bankprüfung</span>
                </div>
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Zusage</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold text-zinc-400">{dummyProject.loadScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-600">Last</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-zinc-500">Nächster Hebel: </span>
              <span className="font-medium">Steuerberater Müller anschreiben</span>
            </div>
            <button className="btn-ghost">
              Öffnen
              <ArrowRight className="w-3 h-3" />
            </button>
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card text-center">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
