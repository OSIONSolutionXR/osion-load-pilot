import { ArrowRight, ArrowLeft, AlertTriangle, Users, Clock, GitGraph } from 'lucide-react'
import { dummyActors, dummyRisks } from '../data/dummyData'

interface TwinScreenProps {
  onNextMove: () => void
  onBack: () => void
}

export default function TwinScreen({ onNextMove, onBack }: TwinScreenProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="tag">SCHRITT 2/4</span>
          </div>
          <h2 className="font-mono font-bold text-3xl">PROJECT TWIN</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            ZURÜCK
          </button>
          <button onClick={onNextMove} className="btn-primary flex items-center gap-2">
            NÄCHSTER SCHRITT
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dependency Graph */}
      <div className="card">
        <div className="flex items-center gap-2 mb-6 border-b-2 border-black pb-2">
          <GitGraph className="w-5 h-5" />
          <span className="font-mono font-bold">DEPENDENCY GRAPH</span>
        </div>

        {/* Vertical Graph Layout */}
        <div className="space-y-6">
          {/* Steuerberater */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[2]} status="waiting" />
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowDown label="liefert BWA" />
          </div>

          {/* Martin & BWA Block */}
          <div className="flex justify-center gap-8">
            <ActorNode actor={dummyActors[0]} status="blocked" />
            <BlockerNode 
              icon="📄" 
              title="BWA" 
              subtitle="Fehlt" 
            />
          </div>

          {/* Arrow to Bank */}
          <div className="flex justify-center">
            <ArrowDown label="wartet auf" />
          </div>

          {/* Bank */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[1]} status="waiting" />
          </div>

          {/* Arrow to Goal */}
          <div className="flex justify-center">
            <ArrowDown label="3-5 Tage Prüfung" />
          </div>

          {/* Project Goal */}
          <div className="flex justify-center">
            <GoalNode 
              icon="🏦" 
              title="Zusage Bankfinanzierung" 
              subtitle="KS19 Sanierung" 
            />
          </div>

          {/* Arrow to Deadline */}
          <div className="flex justify-center">
            <ArrowDown label="⚠️ Deadline: Freitag" />
          </div>

          {/* Verkäufer */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[3]} status="urgent" />
          </div>
        </div>
      </div>

      {/* Risks */}
      <div className="card border-l-4 border-l-osion-red">
        <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
          <AlertTriangle className="w-5 h-5 text-osion-red" />
          <span className="font-mono font-bold">SIMULIERTE RISIKEN</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {dummyRisks.map((risk) => (
            <div key={risk.id} className="p-4 border-2 border-black">
              <div className="font-mono text-xs text-gray-400 mb-2">RISIKO #{risk.id.split('-')[1]}</div>
              <div className="font-mono font-bold text-sm mb-3">{risk.description}</div>
              <div className="font-mono text-xs text-gray-500 mb-2">WENN: {risk.timeline}</div>
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
    waiting: 'border-2 border-black bg-white',
    blocked: 'border-2 border-osion-red bg-osion-red/5',
    urgent: 'border-2 border-osion-red bg-black text-white',
  }

  return (
    <div className={`p-4 text-center min-w-[160px] ${styles[status]}`}>
      <div className="text-3xl mb-2">{actor.avatar}</div>
      <div className="font-mono font-bold text-sm">{actor.name}</div>
      <div className="font-mono text-xs opacity-60">{actor.role}</div>
    </div>
  )
}

function BlockerNode({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="p-4 text-center min-w-[120px] border-2 border-osion-red bg-osion-red/5">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-mono font-bold text-sm">{title}</div>
      <div className="font-mono text-xs text-osion-red">{subtitle}</div>
    </div>
  )
}

function GoalNode({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="p-6 text-center border-l-4 border-l-osion-red bg-black text-white min-w-[240px]">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="font-mono font-bold mb-1">{title}</div>
      <div className="font-mono text-sm opacity-60">{subtitle}</div>
    </div>
  )
}

function ArrowDown({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-xs text-gray-400 mb-1">{label}</span>
      <ArrowRight className="w-5 h-5 rotate-90 text-gray-400" />
    </div>
  )
}

function RiskBadge({ probability, impact }: { probability: number; impact: number }) {
  const combined = probability * impact
  let style = 'bg-gray-100 text-gray-600'
  let label = 'NIEDRIG'

  if (combined > 4) {
    style = 'border-2 border-black'
    label = 'MITTEL'
  }
  if (combined > 6) {
    style = 'bg-osion-red text-white'
    label = 'HOCH'
  }

  return (
    <span className={`inline-block px-2 py-1 font-mono text-xs ${style}`}>
      {label} ({Math.round(probability * 100)}% × {impact})
    </span>
  )
}

function MetricCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card text-center py-6">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white mb-3">
        {icon}
      </div>
      <div className="font-mono text-3xl font-bold mb-1">{value}</div>
      <div className="font-mono text-xs text-gray-500">{label}</div>
    </div>
  )
}
