import { Plus, ChevronRight, AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react'
import { dummyProject, dummyActions, dummyActors, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onViewProject: () => void
}

export default function TodayScreen({ onNewProject, onViewProject }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="tag">SCHRITT 4/4</span>
          </div>
          <h2 className="font-mono font-bold text-3xl">TODAY</h2>
        </div>
        <button onClick={onNewProject} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          NEUES PROJEKT
        </button>
      </div>

      {/* Date */}
      <div className="text-center">
        <div className="inline-block card py-3 px-6">
          <div className="flex items-center gap-2 font-mono">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>
              {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Next Action Card */}
      <div className="card border-l-4 border-l-osion-red border-2 border-osion-red">
        <div className="flex items-center gap-2 text-osion-red mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-mono font-bold text-sm">ALS NÄCHSTES</span>
        </div>
        
        <h3 className="font-mono font-bold text-2xl mb-3">{nextMove.description}</h3>
        
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{targetActor?.avatar}</span>
          <div>
            <div className="font-mono font-bold">{targetActor?.name}</div>
            <div className="font-mono text-xs text-gray-500">{targetActor?.role}</div>
          </div>
          <span className="tag-filled bg-osion-red">P{nextMove.priority}</span>
        </div>
        
        <button 
          onClick={onViewProject}
          className="btn-secondary flex items-center gap-2"
        >
          ZUM PROJECT TWIN
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Active Projects */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
          <span className="font-mono font-bold">AKTIVE PROJEKTE</span>
          <span className="tag">1 OFFEN</span>
        </div>

        <div 
          onClick={onViewProject}
          className="flex items-center gap-4 p-4 border-2 border-black cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="w-16 h-16 bg-black text-white flex items-center justify-center text-2xl">
            🏦
          </div>
          <div className="flex-1">
            <div className="font-mono font-bold text-lg">{dummyProject.name}</div>
            <div className="font-mono text-sm text-gray-500">{dummyProject.goal}</div>
          </div>
          <div className="text-right">
            <div className="font-mono font-bold text-osion-red">🔴 BLOCKIERT</div>
            <div className="font-mono text-xs text-gray-500">1 offene Aktion</div>
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
      <div className="p-6 border-2 border-dashed border-gray-300 text-center">
        <p className="font-mono text-sm text-gray-500">
          TIP: Füge neue Projekte hinzu, indem du freien Text eingibst.
          <br />
          Load Pilot erkennt automatisch Struktur, Actoren und Abhängigkeiten.
        </p>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="card text-center py-6">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white mb-3">
        {icon}
      </div>
      <div className="font-mono text-4xl font-bold mb-1">{value}</div>
      <div className="font-mono text-xs text-gray-500">{label}</div>
    </div>
  )
}
