import { Check, Edit3, ArrowRight, Users, Link2, AlertTriangle } from 'lucide-react'
import { dummyProject, dummyActors, dummyDependencies } from '../data/dummyData'

interface AnalysisScreenProps {
  onConfirm: () => void
  onEdit: () => void
}

export default function AnalysisScreen({ onConfirm, onEdit }: AnalysisScreenProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag tag-cyan">ANALYSE</span>
            <span className="text-zinc-500 text-sm">Schritt 1/4</span>
          </div>
          <h1 className="text-3xl font-bold">Ergebnis</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#10b981]/20 text-[#10b981] rounded-xl border border-[#10b981]/30">
          <Check className="w-5 h-5" />
          <span className="font-mono font-semibold">{Math.round(dummyProject.confidence * 100)}% Confidence</span>
        </div>
      </div>

      {/* Project Card */}
      <div className="glass-card p-6 border-l-4 border-l-[#ff3366] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#ff3366]/10 to-transparent rounded-bl-full" />
        
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <span className="tag mb-2 inline-block">PROJEKT</span>
              <h2 className="text-2xl font-bold mb-1">{dummyProject.name}</h2>
              <p className="text-zinc-400">{dummyProject.goal}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-[#ff3366] text-glow-red">{dummyProject.loadScore}</div>
              <div className="text-xs text-zinc-500 font-mono">/10 LOAD SCORE</div>
            </div>
          </div>
          <p className="text-zinc-300 leading-relaxed">{dummyProject.description}</p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Actors */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00d4ff]/20 to-[#00d4ff]/5 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Actoren</h3>
              <p className="text-sm text-zinc-500">{dummyActors.length} erkannt</p>
            </div>
          </div>

          <div className="space-y-3">
            {dummyActors.map((actor) => (
              <div key={actor.id} className="flex items-center gap-3 p-3 bg-black/20 rounded-xl hover:bg-black/30 transition-colors">
                <span className="text-2xl">{actor.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{actor.name}</div>
                  <div className="text-xs text-zinc-500">{actor.role}</div>
                </div>
                <ActorBadge type={actor.type} />
              </div>
            ))}
          </div>
        </div>

        {/* Dependencies */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366]/20 to-[#ff3366]/5 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#ff3366]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Abhängigkeiten</h3>
              <p className="text-sm text-zinc-500">{dummyDependencies.length} erkannt</p>
            </div>
          </div>

          <div className="space-y-3">
            {dummyDependencies.map((dep) => (
              <div
                key={dep.id}
                className={`p-4 rounded-xl ${
                  dep.blocking
                    ? 'bg-[#ff3366]/10 border border-[#ff3366]/30'
                    : 'bg-black/20'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {dep.blocking ? (
                    <AlertTriangle className="w-5 h-5 text-[#ff3366] flex-shrink-0" />
                  ) : (
                    <Link2 className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">{dep.description}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500">
                    {getActorName(dep.from)} → {getActorName(dep.to)}
                  </span>
                  {dep.deadline && (
                    <span className="text-[#ff3366] font-mono">
                      Frist: {dep.deadline.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
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
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    internal: { bg: 'bg-[#10b981]/20', text: 'text-[#10b981]', label: 'INTERN' },
    external: { bg: 'bg-[#8b5cf6]/20', text: 'text-[#8b5cf6]', label: 'EXTERN' },
    system: { bg: 'bg-zinc-700/50', text: 'text-zinc-400', label: 'SYSTEM' },
    ghost: { bg: 'bg-[#f59e0b]/20', text: 'text-[#f59e0b]', label: 'GHOST' },
  }
  const style = styles[type] || styles.ghost

  return (
    <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

function getActorName(id: string): string {
  const actor = dummyActors.find(a => a.id === id)
  return actor?.name || id
}
