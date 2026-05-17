import { ArrowRight, ArrowLeft, AlertTriangle, Users, Clock, GitGraph } from 'lucide-react'
import { dummyActors, dummyRisks } from '../data/dummyData'

interface TwinScreenProps {
  onNextMove: () => void
  onBack: () => void
}

export default function TwinScreen({ onNextMove, onBack }: TwinScreenProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag tag-accent">TWIN</span>
            <span className="text-zinc-500 text-sm">Schritt 2/4</span>
          </div>
          <h1 className="text-3xl font-bold">Project Twin</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </button>
          <button onClick={onNextMove} className="btn-primary flex items-center gap-2">
            Nächster Schritt
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dependency Graph */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#8b5cf6]/5 flex items-center justify-center">
            <GitGraph className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Dependency Graph</h3>
            <p className="text-sm text-zinc-500">Visuelle Darstellung der Abhängigkeiten</p>
          </div>
        </div>

        {/* Vertical Graph */}
        <div className="space-y-4">
          {/* Steuerberater */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[2]} status="waiting" />
          </div>

          <ArrowDown label="liefert BWA" />

          {/* Martin & BWA */}
          <div className="flex justify-center gap-6">
            <ActorNode actor={dummyActors[0]} status="blocked" />
            <BlockerNode icon="📄" title="BWA" subtitle="Fehlt" />
          </div>

          <ArrowDown label="wartet auf" />

          {/* Bank */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[1]} status="waiting" />
          </div>

          <ArrowDown label="3-5 Tage Prüfung" />

          {/* Goal */}
          <div className="flex justify-center">
            <GoalNode icon="🏦" title="Zusage Bankfinanzierung" subtitle="KS19 Sanierung" />
          </div>

          <ArrowDown label="⚠️ Deadline: Freitag" />

          {/* Verkäufer */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[3]} status="urgent" />
          </div>
        </div>
      </div>

      {/* Risks */}
      <div className="glass-card p-6 border-l-4 border-l-[#ff3366]">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366]/20 to-[#ff3366]/5 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#ff3366]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Simulierte Risiken</h3>
            <p className="text-sm text-zinc-500">{dummyRisks.length} identifiziert</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {dummyRisks.map((risk) => (
            <div key={risk.id} className="p-4 bg-[#ff3366]/5 border border-[#ff3366]/20 rounded-xl">
              <div className="text-xs text-zinc-500 mb-2">RISIKO #{risk.id.split('-')[1]}</div>
              <div className="font-semibold text-sm mb-3">{risk.description}</div>
              <div className="text-xs text-zinc-500 mb-2">WENN: {risk.timeline}</div>
              <RiskBadge probability={risk.probability} impact={risk.impact} />
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={<Users className="w-5 h-5" />} value="5" label="ACTOREN" />
        <MetricCard icon={<GitGraph className="w-5 h-5" />} value="4" label="DEPS" />
        <MetricCard icon={<Clock className="w-5 h-5" />} value="5T" label="KRIT. PFAD" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} value="3" label="RISIKEN" />
      </div>
    </div>
  )
}

function ActorNode({ actor, status }: { actor: typeof dummyActors[0]; status: 'waiting' | 'blocked' | 'urgent' }) {
  const styles = {
    waiting: 'border-2 border-zinc-600 bg-zinc-900/50',
    blocked: 'border-2 border-[#ff3366] bg-[#ff3366]/10',
    urgent: 'border-2 border-[#ff3366] bg-black text-white',
  }

  return (
    <div className={`p-4 text-center min-w-[160px] rounded-xl ${styles[status]}`}>
      <div className="text-3xl mb-2">{actor.avatar}</div>
      <div className="font-semibold text-sm">{actor.name}</div>
      <div className="text-xs text-zinc-500">{actor.role}</div>
    </div>
  )
}

function BlockerNode({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="p-4 text-center min-w-[120px] border-2 border-[#ff3366] bg-[#ff3366]/5 rounded-xl">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-[#ff3366]">{subtitle}</div>
    </div>
  )
}

function GoalNode({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="p-6 text-center border-l-4 border-l-[#ff3366] bg-black text-white min-w-[240px] rounded-xl">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-bold mb-1">{title}</div>
      <div className="text-sm text-zinc-400">{subtitle}</div>
    </div>
  )
}

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs text-zinc-500 mb-1 font-mono">{label}</span>
      <ArrowRight className="w-5 h-5 rotate-90 text-zinc-600" />
    </div>
  )
}

function RiskBadge({ probability, impact }: { probability: number; impact: number }) {
  const combined = probability * impact
  let style = 'bg-zinc-800 text-zinc-400'
  let label = 'NIEDRIG'

  if (combined > 4) {
    style = 'bg-[#f59e0b]/20 text-[#f59e0b]'
    label = 'MITTEL'
  }
  if (combined > 6) {
    style = 'bg-[#ff3366] text-white'
    label = 'HOCH'
  }

  return (
    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-semibold ${style}`}>
      {label} ({Math.round(probability * 100)}% × {impact})
    </span>
  )
}

function MetricCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="glass-card text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black mb-3">
        {icon}
      </div>
      <div className="font-mono text-3xl font-bold mb-1">{value}</div>
      <div className="text-xs text-zinc-500 font-mono">{label}</div>
    </div>
  )
}
