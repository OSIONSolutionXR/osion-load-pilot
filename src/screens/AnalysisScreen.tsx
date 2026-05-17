import { Check, Edit3, ArrowRight, Users, Link2, AlertTriangle } from 'lucide-react'
import { dummyProject, dummyActors, dummyDependencies } from '../data/dummyData'

interface AnalysisScreenProps {
  onConfirm: () => void
  onEdit: () => void
}

export default function AnalysisScreen({ onConfirm, onEdit }: AnalysisScreenProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="tag">SCHRITT 1/4</span>
          </div>
          <h2 className="font-mono font-bold text-3xl">ANALYSE-ERGEBNIS</h2>
        </div>
        <div className="flex items-center gap-2 tag-filled bg-osion-green">
          <Check className="w-4 h-4" />
          {Math.round(dummyProject.confidence * 100)}% CONFIDENCE
        </div>
      </div>

      {/* Project Card */}
      <div className="card border-l-4 border-l-osion-red">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="tag">PROJEKT</span>
              <span className="font-mono text-xs text-gray-400">ID: {dummyProject.id}</span>
            </div>
            <h3 className="font-mono font-bold text-2xl mb-2">{dummyProject.name}</h3>            
            <p className="font-mono text-gray-600">{dummyProject.goal}</p>
          </div>
          
          <div className="text-right">
            <div className="font-mono text-5xl font-bold">{dummyProject.loadScore}</div>
            <div className="font-mono text-xs text-gray-400">/10 LOAD SCORE</div>
          </div>
        </div>
        
        <p className="font-mono text-sm text-gray-600 leading-relaxed">{dummyProject.description}</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Actors */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
            <Users className="w-5 h-5" />
            <span className="font-mono font-bold">ACTOREN ({dummyActors.length})</span>
          </div>
          
          <div className="space-y-3">
            {dummyActors.map((actor) => (
              <div key={actor.id} className="flex items-center gap-3 p-3 border-2 border-black">
                <span className="text-2xl">{actor.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-sm truncate">{actor.name}</div>
                  <div className="font-mono text-xs text-gray-500">{actor.role}</div>
                </div>
                <ActorBadge type={actor.type} />
              </div>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
            <Link2 className="w-5 h-5" />
            <span className="font-mono font-bold">ABHÄNGIGKEITEN ({dummyDependencies.length})</span>
          </div>
          
          <div className="space-y-3">
            {dummyDependencies.map((dep) => (
              <div 
                key={dep.id} 
                className={`p-3 border-2 ${dep.blocking ? 'border-osion-red bg-osion-red/5' : 'border-black'}`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {dep.blocking ? (
                    <AlertTriangle className="w-5 h-5 text-osion-red flex-shrink-0" />
                  ) : (
                    <Link2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-mono text-sm">{dep.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="text-gray-500">{getActorName(dep.from)} → {getActorName(dep.to)}</span>
                  {dep.deadline && (
                    <span className="text-osion-red">
                      FRIST: {dep.deadline.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onEdit} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <Edit3 className="w-4 h-4" />
          BEARBEITEN
        </button>
        
        <button onClick={onConfirm} className="btn-primary flex-[2] flex items-center justify-center gap-2">
          GRAPH ANZEIGEN
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ActorBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    internal: 'bg-black text-white',
    external: 'border-2 border-black',
    system: 'bg-gray-200 text-gray-600',
    ghost: 'border-2 border-dashed border-black',
  }
  const labels: Record<string, string> = {
    internal: 'INTERN',
    external: 'EXTERN',
    system: 'SYSTEM',
    ghost: 'GHOST',
  }
  return (
    <span className={`px-2 py-1 font-mono text-xs ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function getActorName(id: string): string {
  const actor = dummyActors.find(a => a.id === id)
  return actor?.name || id
}
