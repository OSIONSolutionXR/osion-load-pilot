import { 
  ArrowLeft,
  Users, 
  Activity,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react'
import DependencySimulationPanel from '../components/DependencySimulationPanel'

import { dummyProject, dummyActors, dummyRisks } from '../data/dummyData'

interface ProjectTwinScreenProps {
  onBack: () => void
}

export default function ProjectTwinScreen({ onBack }: ProjectTwinScreenProps) {
  return (
    <div className="space-y-6 animate-in">
      
      {/* Premium Page Header */}
      <header className="card-hero p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button onClick={onBack} className="btn-ghost group mt-1">
              <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            </button>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#ff006e]" />
                <span className="label label-accent">Project Twin</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{dummyProject.name}</h2>
              <p className="text-zinc-400">{dummyProject.goal}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center border border-[#ef4444]/20">
                <Shield className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 uppercase tracking-wider">Status</div>
                <div className="text-sm font-semibold text-[#ef4444]">Blockiert</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="grid grid-cols-5 gap-4">
            <StatusItem label="Hauptblocker" value="BWA fehlt" danger />
            <StatusItem label="Nächster Hebel" value="Steuerberater Müller" />
            <StatusItem label="Frist" value="Heute" urgent />
            <StatusItem label="Projektlast" value="8.0" />
            <StatusItem label="Risiken" value="3" warning />
          </div>
        </div>
      </header>

      {/* Main Dependency Graph */}
      <DependencySimulationPanel variant="full" />

      {/* Scenario Comparison */}
      <section className="grid-12 gap-6">
        <div className="col-4">
          <ScenarioCard
            title="Szenario A: Heute nichts tun"
            icon={<XCircle className="w-5 h-5 text-[#ef4444]" />}
            points={[
              'Bankprüfung bleibt blockiert',
              'Verkäufer wird unsicher',
              'Risiko steigt',
              'Mentale Last bleibt offen'
            ]}
            type="negative"
          />
        </div>
        
        <div className="col-4">
          <ScenarioCard
            title="Szenario B: Steuerberater anschreiben"
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            points={[
              'BWA kann beschleunigt werden',
              'Bankakte bleibt aktiv',
              'Verkäufer kann beruhigt werden',
              'Risiko sinkt'
            ]}
            type="positive"
            recommended
          />
        </div>
        
        <div className="col-4">
          <ScenarioCard
            title="Szenario C: Nachverfolgung delegieren"
            icon={<Activity className="w-5 h-5 text-amber-400" />}
            points={[
              'Operative Last sinkt',
              'Martin behält Entscheidungshoheit',
              'Prozess läuft weiter',
              'Kontrolle bleibt erhalten'
            ]}
            type="neutral"
          />
        </div>
      </section>

      {/* Actoren & Risiken */}
      <div className="grid-12 gap-6">
        <div className="col-6">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#3a86ff]/10 flex items-center justify-center border border-[#3a86ff]/30">
                <Users className="w-5 h-5 text-[#3a86ff]" />
              </div>
              <div>
                <div className="font-semibold">Akteure</div>
                <div className="text-xs text-zinc-500">Beteiligte im Projekt</div>
              </div>
              <span className="ml-auto text-2xl font-bold text-zinc-700">{dummyActors.length}</span>
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

        <div className="col-6">
          <section className="card-glass p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#ef4444]/10 flex items-center justify-center border border-[#ef4444]/30">
                <AlertCircle className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <div className="font-semibold">Risiken</div>
                <div className="text-xs text-zinc-500">Identifizierte Gefahren</div>
              </div>
              <span className="ml-auto text-2xl font-bold text-[#ef4444]/30">{dummyRisks.length}</span>
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
    </div>
  )
}

/* Components */

function StatusItem({ label, value, danger, urgent, warning }: { 
  label: string
  value: string
  danger?: boolean
  urgent?: boolean
  warning?: boolean
}) {
  const colorClass = danger ? 'text-[#ef4444]' : urgent ? 'text-amber-400' : warning ? 'text-amber-400' : 'text-white'
  
  return (
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  )
}

function ScenarioCard({ title, icon, points, type, recommended }: { 
  title: string
  icon: React.ReactNode
  points: string[]
  type: 'negative' | 'positive' | 'neutral'
  recommended?: boolean
}) {
  const borderColors = {
    negative: 'border-[#ef4444]/20',
    positive: 'border-emerald-500/20',
    neutral: 'border-amber-500/20'
  }

  const bgColors = {
    negative: 'bg-[#ef4444]/[0.02]',
    positive: 'bg-emerald-500/[0.02]',
    neutral: 'bg-amber-500/[0.02]'
  }

  return (
    <div className={`card-glass p-5 ${borderColors[type]} ${bgColors[type]} border relative`}>
      {recommended && (
        <div className="absolute -top-3 left-4">
          <span className="label label-accent">Empfohlen</span>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-4 mt-2">
        {icon}
        <span className="font-semibold text-sm">{title}</span>
      </div>
      
      <ul className="space-y-2">
        {points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2 flex-shrink-0" />
            {point}
          </li>
        ))}
      </ul>
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
