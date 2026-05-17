import { Plus, ChevronRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { dummyProject, dummyActions, dummyActors, formatPriority } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onViewProject: () => void
}

export default function TodayScreen({ onNewProject, onViewProject }: TodayScreenProps) {
  const nextMove = dummyActions[0] // Highest priority
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Today</h2>
          <p className="text-gray-400 text-sm">
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button onClick={onNewProject} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Neues Projekt
        </button>
      </div>

      {/* Next Action Card */}
      <div className="glass-panel p-6 border-l-4 border-l-osion-rose">
        <div className="flex items-center gap-2 text-osion-rose mb-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Als Nächstes</span>
        </div>
        
        <h3 className="text-xl font-bold mb-2">{nextMove.description}</h3>
        <div className="flex items-center gap-2 text-gray-400 mb-4">
          <span className="text-2xl">{targetActor?.avatar}</span>
          <span>{targetActor?.name}</span>
          <span className="text-osion-surfaceLight">•</span>
          <span>{formatPriority(nextMove.priority)}</span>
        </div>
        
        <button 
          onClick={onViewProject}
          className="flex items-center gap-2 text-osion-violet hover:text-white transition-colors"
        >
          Zum Project Twin
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Projects */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Aktive Projekte</h3>
          <span className="text-sm text-gray-500">1 offen</span>
        </div>

        <div 
          onClick={onViewProject}
          className="flex items-center gap-4 p-4 bg-osion-surface rounded-xl cursor-pointer hover:bg-osion-surfaceLight transition-colors"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-osion-violet to-osion-rose flex items-center justify-center text-2xl">
            🏦
          </div>
          <div className="flex-1">
            <div className="font-medium">{dummyProject.name}</div>
            <div className="text-sm text-gray-400">{dummyProject.goal}</div>
          </div>
          <div className="text-right">
            <div className="text-osion-rose font-medium">🔴 Blockiert</div>
            <div className="text-xs text-gray-500">1 offene Aktion</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Clock className="w-5 h-5" />} value="1" label="Offen" />
        <StatCard icon={<CheckCircle2 className="w-5 h-5" />} value="0" label="Erledigt" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} value="3" label="Risiken" />
      </div>

      {/* Empty State Hint */}
      <div className="text-center p-8 text-gray-500">
        <p className="text-sm">
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
    <div className="glass-panel p-4 text-center">
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
        {icon}
        {label}
      </div>
    </div>
  )
}
