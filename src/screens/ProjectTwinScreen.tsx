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
import { dummyProject, dummyActors, dummyDependencies, dummyRisks } from '../data/dummyData'

interface ProjectTwinScreenProps {
  onBack: () => void
}

export default function ProjectTwinScreen({ onBack }: ProjectTwinScreenProps) {
  return (
    <div className="space-y-6 animate-in">
      
      {/* Header */}
      <header className="card-glass p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn-ghost group">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
              Zurück
            </button>
            
            <div className="h-8 w-px bg-white/10" />
            
            <div>
              <span className="label label-accent mb-1 inline-block">Project Twin</span>
              <h2 className="text-2xl font-bold">{dummyProject.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="label label-blocked">Blockiert</span>
            <div className="text-right">
              <div className="text-3xl font-bold gradient-text">{dummyProject.loadScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-500">Projektlast</div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero: Full Dependency Flow */}
      <section className="card-hero p-8 md:p-12">
        <div className="flex items-center gap-3 mb-8">
          <GitBranch className="w-5 h-5 text-zinc-500" />
          <span className="text-lg font-semibold">Abhängigkeits-Karte</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <FlowNode 
            icon={<Building2 className="w-6 h-6" />}
            title="Steuerberater Müller"
            subtitle="liefert BWA"
            status="normal"
          />
          
          <FlowConnector />
          
          <FlowNode 
            icon={<FileText className="w-6 h-6" />}
            title="BWA"
            subtitle="Fehlt"
            status="blocked"
            pulse
          />
          
          <FlowConnector />
          
          <FlowNode 
            icon={<Landmark className="w-6 h-6" />}
            title="Bank"
            subtitle="Prüfung"
            status="waiting"
          />
          
          <FlowConnector />
          
          <FlowNode 
            icon={<Target className="w-6 h-6" />}
            title="Zusage"
            subtitle="Finanzierung"
            status="goal"
          />
        </div>

        {/* Kritischer Pfad */}
        <div className="p-6 rounded-2xl bg-[#0a0a0c] border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-400">Kritischer Pfad</span>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            {dummyDependencies.map((dep, idx) => (
              <div key={dep.id} className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  dep.blocking 
                    ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20' 
                    : 'bg-white/5 text-zinc-300'
                }`}>
                  {getActorName(dep.from)}
                </div>
                {idx < dummyDependencies.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-zinc-600" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Two Column: Actoren + Risiken */}
      <div className="grid-12">
        {/* Actoren */}
        <div className="col-6">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-zinc-500" />
              <span className="text-lg font-semibold">Actoren</span>
              <span className="ml-auto text-2xl font-bold text-zinc-600">{dummyActors.length}</span>
            </div>

            <div className="space-y-3">
              {dummyActors.map(actor => (
                <div key={actor.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xl shadow-inner">
                    {actor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{actor.name}</div>
                    <div className="text-sm text-zinc-500">{actor.role}</div>
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
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              <span className="text-lg font-semibold">Risiken</span>
              <span className="ml-auto text-2xl font-bold text-zinc-600">{dummyRisks.length}</span>
            </div>

            <div className="space-y-3">
              {dummyRisks.map(risk => (
                <div key={risk.id} className="p-5 rounded-2xl bg-[#ef4444]/[0.03] border border-[#ef4444]/10 hover:border-[#ef4444]/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-medium">{risk.description}</span>
                    <RiskLevel probability={risk.probability} impact={risk.impact} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock className="w-4 h-4" />
                    Wenn: {risk.timeline}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Simulation Stats */}
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

function FlowNode({ icon, title, subtitle, status, pulse }: { 
  icon: React.ReactNode
  title: string
  subtitle: string
  status: 'normal' | 'blocked' | 'waiting' | 'goal'
  pulse?: boolean
}) {
  const statusClasses = {
    normal: 'border-white/10 bg-white/[0.03]',
    blocked: 'border-[#ef4444]/40 bg-[#ef4444]/[0.05]',
    waiting: 'border-white/10 bg-white/[0.03]',
    goal: 'border-[#8338ec]/40 bg-[#8338ec]/[0.05]'
  }

  return (
    <div className={`flex flex-col items-center gap-3 p-5 rounded-2xl border ${statusClasses[status]} ${pulse ? 'animate-pulse' : ''} min-w-[140px] transition-all hover:border-white/20`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
        status === 'blocked' ? 'bg-[#ef4444]/10 text-[#ef4444]' : 
        status === 'goal' ? 'bg-[#8338ec]/10 text-[#8338ec]' : 
        'bg-white/5 text-zinc-400'
      }`}>
        {icon}
      </div>
      <div className="text-center">
        <div className="font-semibold">{title}</div>
        <div className={`text-sm ${
          status === 'blocked' ? 'text-[#ef4444]' : 'text-zinc-500'
        }`}>{subtitle}</div>
      </div>
    </div>
  )
}

function FlowConnector() {
  return (
    <div className="flex items-center px-2">
      <div className="w-12 h-px bg-gradient-to-r from-zinc-700 to-zinc-600" />
      <ArrowRight className="w-4 h-4 text-zinc-600 -ml-1" />
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
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function RiskLevel({ probability, impact }: { probability: number; impact: number }) {
  const level = probability * impact
  
  if (level > 6) {
    return <span className="px-3 py-1 rounded-full bg-[#ef4444] text-white text-xs font-semibold">Hoch</span>
  } else if (level > 4) {
    return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">Mittel</span>
  }
  return <span className="px-3 py-1 rounded-full bg-zinc-500/20 text-zinc-400 text-xs">Niedrig</span>
}

function StatCard({ icon, value, label, danger }: { 
  icon: React.ReactNode
  value: string
  label: string
  danger?: boolean
}) {
  return (
    <div className="card-glass p-5 text-center">
      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3 ${
        danger ? 'bg-[#ef4444]/10' : 'bg-white/5'
      }`}>
        {icon}
      </div>
      <div className={`text-2xl font-bold mb-1 ${danger ? 'text-[#ef4444]' : ''}`}>{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}

function getActorName(id: string): string {
  const actor = dummyActors.find(a => a.id === id)
  return actor?.name || id
}
