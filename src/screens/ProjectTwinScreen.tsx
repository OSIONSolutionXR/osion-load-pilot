import { 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  Users, 
  Clock, 
  GitBranch,
  Landmark,
  FileText,
  Building2,
  Target,
  Activity,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { dummyProject, dummyActors, dummyRisks } from '../data/dummyData'

interface ProjectTwinScreenProps {
  onBack: () => void
}

export default function ProjectTwinScreen({ onBack }: ProjectTwinScreenProps) {
  return (
    <div className="space-y-6 animate-in">
      
      {/* Header */}
      <header className="card-glass p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn-ghost">
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </button>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div>
              <span className="label label-accent mb-1 inline-block">Project Twin</span>
              <h2 className="text-xl font-bold">{dummyProject.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="label label-blocked">Blockiert</span>
            <div className="text-right">
              <div className="text-2xl font-bold gradient-text">{dummyProject.loadScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-500">Projektlast</div>
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal Dependency Flow - Main Organigram */}
      <section className="card-hero p-8">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-4 h-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-400">Abhängigkeits-Karte</span>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <FlowCard 
            icon={<Building2 className="w-5 h-5" />}
            title="Steuerberater"
            subtitle="liefert BWA"
            status="normal"
          />
          
          <ArrowConnector />
          
          <FlowCard 
            icon={<FileText className="w-5 h-5" />}
            title="BWA"
            subtitle="Fehlt"
            status="blocked"
          />
          
          <ArrowConnector />
          
          <FlowCard 
            icon={<Landmark className="w-5 h-5" />}
            title="Bank"
            subtitle="Prüfung"
            status="waiting"
          />
          
          <ArrowConnector />
          
          <FlowCard 
            icon={<Target className="w-5 h-5" />}
            title="Zusage"
            subtitle="Finanzierung"
            status="goal"
          />
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid-12">
        {/* Actoren */}
        <div className="col-6">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-zinc-500" />
              <span className="font-semibold">Actoren</span>
              <span className="ml-auto text-lg font-bold text-zinc-600">{dummyActors.length}</span>
            </div>

            <div className="space-y-2">
              {dummyActors.map(actor => (
                <div key={actor.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-lg">
                    {actor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{actor.name}</div>
                    <div className="text-xs text-zinc-500">{actor.role}</div>
                  </div>
                  <ActorBadge type={actor.type} />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Risiken */}
        <div className="col-6">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              <span className="font-semibold">Risiken</span>
              <span className="ml-auto text-lg font-bold text-zinc-600">{dummyRisks.length}</span>
            </div>

            <div className="space-y-2">
              {dummyRisks.map(risk => (
                <div key={risk.id} className="p-4 rounded-xl bg-[#ef4444]/[0.03] border border-[#ef4444]/10">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="text-sm font-medium">{risk.description}</span>
                    <RiskLevel probability={risk.probability} impact={risk.impact} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    Wenn: {risk.timeline}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Stats Row */}
      <section className="grid-12">
        <div className="col-3">
          <StatCard 
            icon={<Activity className="w-5 h-5" />}
            value="8.0"
            label="Projektlast"
          />
        </div>
        <div className="col-3">
          <StatCard 
            icon={<TrendingUp className="w-5 h-5" />}
            value="67%"
            label="Fortschritt"
          />
        </div>
        <div className="col-3">
          <StatCard 
            icon={<AlertCircle className="w-5 h-5 text-[#ef4444]" />}
            value="3"
            label="Risiken"
            danger
          />
        </div>
        <div className="col-3">
          <StatCard 
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            value="2 Tage"
            label="bis Blocker"
            danger
          />
        </div>
      </section>
    </div>
  )
}

/* Components */

function FlowCard({ icon, title, subtitle, status }: { 
  icon: React.ReactNode
  title: string
  subtitle: string
  status: 'normal' | 'blocked' | 'waiting' | 'goal'
}) {
  const statusStyles = {
    normal: 'border-white/10 bg-white/[0.03]',
    blocked: 'border-[#ef4444]/40 bg-[#ef4444]/[0.05] shadow-[0_0_30px_rgba(239,68,68,0.1)]',
    waiting: 'border-white/10 bg-white/[0.03]',
    goal: 'border-[#8338ec]/40 bg-[#8338ec]/[0.05]'
  }

  const iconStyles = {
    normal: 'bg-white/5 text-zinc-400',
    blocked: 'bg-[#ef4444]/10 text-[#ef4444]',
    waiting: 'bg-white/5 text-zinc-400',
    goal: 'bg-[#8338ec]/10 text-[#8338ec]'
  }

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${statusStyles[status]} min-w-[140px] flex-shrink-0`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconStyles[status]}`}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className={`text-xs ${status === 'blocked' ? 'text-[#ef4444]' : 'text-zinc-500'}`}>{subtitle}</div>
      </div>
    </div>
  )
}

function ArrowConnector() {
  return (
    <div className="flex items-center text-zinc-600">
      <div className="w-8 h-px bg-zinc-700" />
      <ArrowRight className="w-4 h-4 -ml-1" />
    </div>
  )
}

function ActorBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    internal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    external: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    system: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    ghost: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  const labels: Record<string, string> = {
    internal: 'Intern',
    external: 'Extern',
    system: 'System',
    ghost: 'Ghost',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function RiskLevel({ probability, impact }: { probability: number; impact: number }) {
  const level = probability * impact
  
  if (level > 6) {
    return <span className="px-2 py-0.5 rounded-full bg-[#ef4444] text-white text-[10px] font-semibold">Hoch</span>
  } else if (level > 4) {
    return <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">Mittel</span>
  }
  return <span className="px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 text-[10px]">Niedrig</span>
}

function StatCard({ icon, value, label, danger }: { 
  icon: React.ReactNode
  value: string
  label: string
  danger?: boolean
}) {
  return (
    <div className="card-glass p-4 text-center">
      <div className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center mb-2 ${danger ? 'bg-[#ef4444]/10' : 'bg-white/5'}`}>
        {icon}
      </div>
      <div className={`text-xl font-bold mb-0.5 ${danger ? 'text-[#ef4444]' : ''}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}
