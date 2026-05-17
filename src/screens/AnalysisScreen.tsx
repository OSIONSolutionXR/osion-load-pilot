import { Check, Edit3, ArrowRight, Users, Link2, AlertTriangle } from 'lucide-react'
import { dummyProject, dummyActors, dummyDependencies } from '../data/dummyData'

interface AnalysisScreenProps {
  onConfirm: () => void
  onEdit: () => void
}

export default function AnalysisScreen({ onConfirm, onEdit }: AnalysisScreenProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analyse-Ergebnis</h2>
          <p className="text-gray-400 text-sm">Geprüft und erkannt</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-osion-green/20 text-osion-green rounded-full text-sm font-medium">
          <Check className="w-4 h-4" />
          {Math.round(dummyProject.confidence * 100)}% Confidence
        </div>
      </div>

      {/* Project Card */}
      <div className="glass-panel p-6 border-l-4 border-l-osion-violet">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">{dummyProject.name}</h3>
            <p className="text-gray-400">{dummyProject.goal}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-osion-rose">{dummyProject.loadScore}/10</div>
            <div className="text-xs text-gray-500">Belastungsscore</div>
          </div>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{dummyProject.description}</p>
      </div>

      {/* Actors */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-osion-violet" />
          <h3 className="font-semibold">Erkannte Actoren ({dummyActors.length})</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {dummyActors.map((actor) => (
            <div key={actor.id} className="flex items-center gap-3 p-3 bg-osion-surface rounded-lg">
              <span className="text-2xl">{actor.avatar}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{actor.name}</div>
                <div className="text-xs text-gray-500">{actor.role}</div>
              </div>
              <ActorBadge type={actor.type} />
            </div>
          ))}
        </div>
      </div>

      {/* Dependencies */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link2 className="w-5 h-5 text-osion-rose" />
          <h3 className="font-semibold">Abhängigkeiten ({dummyDependencies.length})</h3>
        </div>
        <div className="space-y-3">
          {dummyDependencies.map((dep) => (
            <div key={dep.id} className={`flex items-center gap-3 p-3 rounded-lg ${dep.blocking ? 'bg-osion-rose/10 border border-osion-rose/30' : 'bg-osion-surface'}`}>
              <div className="flex-shrink-0">
                {dep.blocking ? (
                  <AlertTriangle className="w-5 h-5 text-osion-rose" />
                ) : (
                  <Link2 className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm">{dep.description}</div>
                {dep.deadline && (
                  <div className="text-xs text-osion-rose mt-1">
                    Frist: {dep.deadline.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">{getActorName(dep.from)} → {getActorName(dep.to)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button onClick={onEdit} className="btn-secondary flex-1 flex items-center justify-center gap-2">
          <Edit3 className="w-4 h-4" />
          Bearbeiten
        </button>
        <button onClick={onConfirm} className="btn-primary flex-[2] flex items-center justify-center gap-2">
          Graph anzeigen
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ActorBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    internal: 'bg-osion-green/20 text-osion-green',
    external: 'bg-osion-violet/20 text-osion-violet',
    system: 'bg-gray-700/50 text-gray-400',
    ghost: 'bg-osion-amber/20 text-osion-amber',
  }
  const labels: Record<string, string> = {
    internal: 'Intern',
    external: 'Extern',
    system: 'System',
    ghost: 'Ghost',
  }
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function getActorName(id: string): string {
  const actor = dummyActors.find(a => a.id === id)
  return actor?.name || id
}
