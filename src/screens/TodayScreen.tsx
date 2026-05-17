import { Plus, ChevronRight, AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { dummyProject, dummyActors, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onViewProject: () => void
}

export default function TodayScreen({ onNewProject, onViewProject }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>TODAY</span>
            <span className="text-zinc-500 text-sm">Schritt 4/4</span>
          </div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <button onClick={onNewProject} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Neues Projekt
        </button>
      </div>

      {/* Date */}
      <div className="flex justify-center">
        <div className="glass-card py-3 px-6">
          <div className="flex items-center gap-2 font-mono">
            <Calendar className="w-4 h-4 text-zinc-400" />
            <span>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Next Action Card */}
      <div className="glass-card p-6" style={{ borderLeft: '4px solid #ff3366' }}>
        <div className="flex items-center gap-2 mb-4" style={{ color: '#ff3366' }}>
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">ALS NÄCHSTES</span>
        </div>

        <h3 className="text-2xl font-bold mb-3">{nextMove.description}</h3>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{targetActor?.avatar}</span>
          <div>
            <div className="font-semibold">{targetActor?.name}</div>
            <div className="text-xs text-zinc-500">{targetActor?.role}</div>
          </div>
          <span className="tag" style={{ background: 'rgba(255, 51, 102, 0.15)', color: '#ff3366', borderColor: 'rgba(255, 51, 102, 0.3)' }}>P{nextMove.priority}</span>
        </div>

        <button
          onClick={onViewProject}
          className="btn-secondary flex items-center gap-2"
        >
          Zum Project Twin
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Projects */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
          <span className="font-semibold">Aktive Projekte</span>
          <span className="tag">1 OFFEN</span>
        </div>

        <div
          onClick={onViewProject}
          className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-colors hover:bg-white/5"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ff3366)' }}>
            🏦
          </div>
          <div className="flex-1">
            <div className="font-semibold text-lg">{dummyProject.name}</div>
            <div className="text-sm text-zinc-400">{dummyProject.goal}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold" style={{ color: '#ff3366' }}>🔴 Blockiert</div>
            <div className="text-xs text-zinc-500">1 offene Aktion</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          value="1"
          label="OFFEN"
        />
        <StatCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          value="0"
          label="ERLEDIGT"
        />
        <StatCard
          icon={<AlertCircle className="w-6 h-6" />}
          value="3"
          label="RISIKEN"
        />
      </div>

      {/* Info Box */}
      <div className="p-6 text-center rounded-xl border-2 border-dashed" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
        <p className="text-sm text-zinc-500">
          Tip: Füge neue Projekte hinzu, indem du freien Text eingibst.
          <br />
          Load Pilot erkennt automatisch Struktur, Actoren und Abhängigkeiten.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="glass-card text-center py-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-black mb-3">
        {icon}
      </div>
      <div className="font-mono text-4xl font-bold mb-1">{value}</div>
      <div className="font-mono text-xs text-zinc-500">{label}</div>
    </div>
  )
}
