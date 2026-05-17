import { ArrowRight, ArrowLeft, AlertTriangle, Users, Clock, GitGraph } from 'lucide-react'
import { dummyActors, dummyRisks } from '../data/dummyData'

interface TwinScreenProps {
  onNextMove: () => void
  onBack: () => void
}

export default function TwinScreen({ onNextMove, onBack }: TwinScreenProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Twin</h2>
          <p className="text-gray-400 text-sm">Abhängigkeiten & Simulation</p>
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

      {/* Dependency Graph Visualization */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-6">
          <GitGraph className="w-5 h-5 text-osion-violet" />
          <h3 className="font-semibold">Dependency Graph</h3>
        </div>

        {/* Visual Graph */}
        <div className="relative">
          {/* Steuerberater */}
          <div className="flex justify-center mb-8">
            <ActorNode actor={dummyActors[2]} status="waiting" />
          </div>

          {/* Arrow down */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center text-osion-rose">
              <span className="text-xs mb-1">liefert BWA</span>
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
          </div>

          {/* Martin & BWA */}
          <div className="flex justify-center gap-16 mb-8">
            <ActorNode actor={dummyActors[0]} status="blocked" />
            <div className="glass-panel p-4 border border-osion-rose/50 bg-osion-rose/5">
              <div className="text-center">
                <div className="text-2xl mb-2">📄</div>
                <div className="font-medium text-sm">BWA</div>
                <div className="text-xs text-osion-rose">Fehlt</div>
              </div>
            </div>
          </div>

          {/* Arrow to Bank */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 text-osion-rose">
              <span className="text-xs">wartet auf</span>
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
          </div>

          {/* Bank */}
          <div className="flex justify-center mb-8">
            <ActorNode actor={dummyActors[1]} status="waiting" />
          </div>

          {/* Arrow to Zusage */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 text-osion-amber">
              <span className="text-xs">Prüfung</span>
              <ArrowRight className="w-5 h-5 rotate-90" />
              <span className="text-xs">3-5 Tage</span>
            </div>
          </div>

          {/* Project Goal */}
          <div className="flex justify-center mb-8">
            <div className="glass-panel p-6 border-l-4 border-l-osion-violet text-center max-w-sm">
              <div className="text-2xl mb-2">🏦</div>
              <div className="font-bold mb-1">Zusage Bankfinanzierung</div>
              <div className="text-sm text-gray-400">KS19 Sanierung</div>
            </div>
          </div>

          {/* Arrow to Verkäufer */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-4 text-osion-rose">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs">Deadline: Freitag</span>
              <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
          </div>

          {/* Verkäufer */}
          <div className="flex justify-center">
            <ActorNode actor={dummyActors[3]} status="urgent" />
          </div>
        </div>
      </div>

      {/* Risk Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-osion-rose" />
          <h3 className="font-semibold">Simulierte Risiken</h3>
        </div>

        <div className="space-y-3">
          {dummyRisks.map((risk) => (
            <div key={risk.id} className="p-4 bg-osion-rose/5 border border-osion-rose/20 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium">{risk.description}</div>
                <RiskBadge probability={risk.probability} impact={risk.impact} />
              </div>
              <div className="text-sm text-gray-400 mb-2">Wenn: {risk.timeline}</div>
              <div className="text-xs">
                <span className="text-osion-green">Lösung:</span> {risk.mitigation[0]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard icon={<Users className="w-5 h-5" />} value="5" label="Actoren" color="violet" />
        <MetricCard icon={<GitGraph className="w-5 h-5" />} value="4" label="Dependencies" color="rose" />
        <MetricCard icon={<Clock className="w-5 h-5" />} value="5 Tg" label="Krit. Pfad" color="amber" />
        <MetricCard icon={<AlertTriangle className="w-5 h-5" />} value="3" label="Risiken" color="rose" />
      </div>
    </div>
  )
}

function ActorNode({ actor, status }: { actor: typeof dummyActors[0]; status: 'waiting' | 'blocked' | 'urgent' }) {
  const statusColors = {
    waiting: 'border-osion-amber/50',
    blocked: 'border-osion-rose/50 bg-osion-rose/5',
    urgent: 'border-osion-rose animate-pulse',
  }

  return (
    <div className={`glass-panel p-4 text-center min-w-[140px] ${statusColors[status]}`}>
      <div className="text-3xl mb-2">{actor.avatar}</div>
      <div className="font-medium text-sm truncate">{actor.name}</div>
      <div className="text-xs text-gray-500">{actor.role}</div>
    </div>
  )
}

function RiskBadge({ probability, impact }: { probability: number; impact: number }) {
  const combined = probability * impact
  let color = 'bg-osion-green/20 text-osion-green'
  let label = 'Niedrig'

  if (combined > 4) {
    color = 'bg-osion-amber/20 text-osion-amber'
    label = 'Mittel'
  }
  if (combined > 6) {
    color = 'bg-osion-rose/20 text-osion-rose'
    label = 'Hoch'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
      {label} ({Math.round(probability * 100)}% × {impact})
    </span>
  )
}

function MetricCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    violet: 'text-osion-violet bg-osion-violet/10',
    rose: 'text-osion-rose bg-osion-rose/10',
    amber: 'text-osion-amber bg-osion-amber/10',
    green: 'text-osion-green bg-osion-green/10',
  }

  return (
    <div className="glass-panel p-4 text-center">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
