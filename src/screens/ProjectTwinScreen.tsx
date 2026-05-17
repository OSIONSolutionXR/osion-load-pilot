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
  AlertCircle,
  Shield,
  Zap
} from 'lucide-react'
import { dummyProject, dummyActors, dummyRisks } from '../data/dummyData'

interface ProjectTwinScreenProps {
  onBack: () => void
}

export default function ProjectTwinScreen({ onBack }: ProjectTwinScreenProps) {
  return (
    <div className="space-y-6 animate-in">
      
      {/* Premium Header */}
      <header className="card-hero p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="btn-ghost group">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
              Zurück
            </button>
            
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-[#ff006e]" />
                <span className="label label-accent">Project Twin</span>
              </div>
              <h2 className="text-2xl font-bold">{dummyProject.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center border border-[#ef4444]/20">
                <Shield className="w-5 h-5 text-[#ef4444]" />
              </div>
              <span className="label label-blocked">Blockiert</span>
            </div>
            
            <div className="text-right pl-6 border-l border-white/10">
              <div className="text-3xl font-bold gradient-text">{dummyProject.loadScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Projektlast</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Organigram - Full Width Premium */}
      <section className="card-glass p-8 md:p-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff006e]/5 via-transparent to-[#8338ec]/5 pointer-events-none" />
        
        <div className="relative">
          <div className="flex items-center justify-center gap-3 mb-8">
            <GitBranch className="w-5 h-5 text-[#ff006e]" />
            <span className="text-lg font-semibold">Abhängigkeits-Karte</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm text-zinc-500">Simulation</span>
          </div>

          <div className="flex items-center justify-center gap-4 overflow-x-auto pb-4">
            <FlowCard 
              icon={<Building2 className="w-6 h-6" />}
              title="Steuerberater"
              subtitle="liefert BWA"
              status="normal"
              delay="0s"
            />
            
            <ArrowConnector />
            
            <FlowCard 
              icon={<FileText className="w-6 h-6" />}
              title="BWA"
              subtitle="Fehlt"
              status="blocked"
              pulse
              delay="0.15s"
            />
            
            <ArrowConnector />
            
            <FlowCard 
              icon={<Landmark className="w-6 h-6" />}
              title="Bank"
              subtitle="Prüfung"
              status="waiting"
              delay="0.3s"
            />
            
            <ArrowConnector />
            
            <FlowCard 
              icon={<Target className="w-6 h-6" />}
              title="Zusage"
              subtitle="Finanzierung"
              status="goal"
              delay="0.45s"
            />
          </div>

          {/* Blocker Warning */}
          <div className="mt-8 p-5 rounded-2xl bg-[#ef4444]/5 border border-[#ef4444]/20 flex items-center justify-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
            <span className="text-sm"><span className="font-semibold">Blocker erkannt:</span> Ohne BWA kann die Bankprüfung nicht beginnen</span>
          </div>
        </div>
      </section>

      {/* Actoren & Risiken - Premium Cards */}
      <div className="grid-12">
        <div className="col-6">
          <section className="card-focus p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3a86ff]/20 to-[#3a86ff]/5 flex items-center justify-center border border-[#3a86ff]/30">
                <Users className="w-5 h-5 text-[#3a86ff]" />
              </div>
              <div>
                <div className="font-semibold">Actoren</div>
                <div className="text-xs text-zinc-500">Beteiligte im Projekt</div>
              </div>
              <span className="ml-auto text-3xl font-bold text-zinc-700">{dummyActors.length}</span>
            </div>

            <div className="space-y-3">
              {dummyActors.map((actor, idx) => (
                <div 
                  key={actor.id} 
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer group"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-xl shadow-inner">
                    {actor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm group-hover:text-white transition-colors">{actor.name}</div>
                    <div className="text-xs text-zinc-500">{actor.role}</div>
                  </div>
                  <ActorBadge type={actor.type} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-6">
          <section className="card-focus p-6 h-full border-[#ef4444]/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center border border-[#ef4444]/30">
                <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <div className="font-semibold">Risiken</div>
                <div className="text-xs text-zinc-500">Identifizierte Gefahren</div>
              </div>
              <span className="ml-auto text-3xl font-bold text-[#ef4444]/30">{dummyRisks.length}</span>
            </div>

            <div className="space-y-3">
              {dummyRisks.map((risk, idx) => (
                <div 
                  key={risk.id} 
                  className="p-4 rounded-xl bg-gradient-to-br from-[#ef4444]/5 to-transparent border border-[#ef4444]/10 hover:border-[#ef4444]/20 transition-all"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-sm font-medium">{risk.description}</span>
                    <RiskLevel probability={risk.probability} impact={risk.impact} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    Wenn: {risk.timeline}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Premium Stats Bar */}
      <section className="card-glass p-6">
        <div className="grid grid-cols-4 gap-6">
          <PremiumStat 
            icon={<Activity className="w-6 h-6 text-[#ff006e]" />}
            value="8.0"
            label="Projektlast"
            color="magenta"
          />
          
          <PremiumStat 
            icon={<TrendingUp className="w-6 h-6 text-emerald-400" />}
            value="67%"
            label="Fortschritt"
            color="emerald"
          />
          
          <PremiumStat 
            icon={<AlertCircle className="w-6 h-6 text-[#ef4444]" />}
            value="3"
            label="Risiken"
            color="red"
          />
          
          <PremiumStat 
            icon={<Clock className="w-6 h-6 text-amber-400" />}
            value="2 Tage"
            label="bis Blocker"
            color="amber"
          />
        </div>
      </section>
    </div>
  )
}

/* Premium Components */

function FlowCard({ icon, title, subtitle, status, pulse, delay }: { 
  icon: React.ReactNode
  title: string
  subtitle: string
  status: 'normal' | 'blocked' | 'waiting' | 'goal'
  pulse?: boolean
  delay?: string
}) {
  const statusStyles = {
    normal: 'border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
    blocked: 'border-[#ef4444]/40 bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5 shadow-[0_0_40px_rgba(239,68,68,0.15)]',
    waiting: 'border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
    goal: 'border-[#8338ec]/40 bg-gradient-to-br from-[#8338ec]/10 to-[#8338ec]/5'
  }

  const iconStyles = {
    normal: 'bg-white/5 text-zinc-400',
    blocked: 'bg-[#ef4444]/20 text-[#ef4444]',
    waiting: 'bg-white/5 text-zinc-400',
    goal: 'bg-[#8338ec]/20 text-[#8338ec]'
  }

  return (
    <div 
      className={`flex flex-col items-center gap-3 p-5 rounded-2xl border min-w-[150px] flex-shrink-0 animate-in ${statusStyles[status]} ${pulse ? 'animate-pulse' : ''} hover:scale-[1.02] transition-transform`}
      style={{ animationDelay: delay }}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconStyles[status]}`}>
        {icon}
      </div>
      <div className="text-center">
        <div className="font-semibold">{title}</div>
        <div className={`text-sm ${status === 'blocked' ? 'text-[#ef4444] font-medium' : 'text-zinc-500'}`}>{subtitle}</div>
      </div>
    </div>
  )
}

function ArrowConnector() {
  return (
    <div className="flex flex-col items-center px-2">
      <div className="w-12 h-px bg-gradient-to-r from-zinc-700 via-zinc-600 to-zinc-700" />
      <ArrowRight className="w-5 h-5 text-zinc-600 -mt-2.5 bg-[#0a0a0c] px-1" />
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
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function RiskLevel({ probability, impact }: { probability: number; impact: number }) {
  const level = probability * impact
  
  if (level > 6) {
    return <span className="px-3 py-1 rounded-full bg-[#ef4444] text-white text-xs font-bold">Hoch</span>
  } else if (level > 4) {
    return <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium">Mittel</span>
  }
  return <span className="px-3 py-1 rounded-full bg-zinc-500/20 text-zinc-400 text-xs font-medium">Niedrig</span>
}

function PremiumStat({ icon, value, label, color }: { 
  icon: React.ReactNode
  value: string
  label: string
  color: 'magenta' | 'emerald' | 'red' | 'amber'
}) {
  const colorStyles = {
    magenta: 'from-[#ff006e]/20 to-transparent border-[#ff006e]/20',
    emerald: 'from-emerald-500/20 to-transparent border-emerald-500/20',
    red: 'from-[#ef4444]/20 to-transparent border-[#ef4444]/20',
    amber: 'from-amber-500/20 to-transparent border-amber-500/20'
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br ${colorStyles[color]} border`}>
      <div className="w-12 h-12 rounded-xl bg-black/30 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
      </div>
    </div>
  )
}
