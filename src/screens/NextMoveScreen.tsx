import { Check, ArrowLeft, Mail, Clock, Zap, Target, Calendar, Copy } from 'lucide-react'
import { dummyActions, dummyActors, getNextMove } from '../data/dummyData'
import { useState } from 'react'

interface NextMoveScreenProps {
  onDone: () => void
  onBack: () => void
}

export default function NextMoveScreen({ onDone, onBack }: NextMoveScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)
  const [done, setDone] = useState(false)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="tag" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', borderColor: 'rgba(139, 92, 246, 0.3)' }}>NEXT MOVE</span>
            <span className="text-zinc-500 text-sm">Schritt 3/4</span>
          </div>
          <h1 className="text-3xl font-bold">Dein nächster Schritt</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1px solid rgba(255, 51, 102, 0.3)' }}>
          <Zap className="w-5 h-5" style={{ color: '#ff3366' }} />
          <span className="font-mono font-semibold" style={{ color: '#ff3366' }}>EMPFOHLEN</span>
        </div>
      </div>

      {/* Priority Score */}
      <div className="flex justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold" style={{ color: '#ff3366' }}>{nextMove.priority}</div>
          <div className="text-sm text-zinc-500 font-mono">PRIORITY SCORE</div>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="glass-card p-8" style={{ border: '2px solid rgba(255, 51, 102, 0.3)' }}>
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl" style={{ background: 'linear-gradient(135deg, #ff3366, #ff6b8a)', boxShadow: '0 8px 32px rgba(255, 51, 102, 0.4)' }}>
            ⚡
          </div>
          
          <h3 className="text-2xl font-bold mb-2">{nextMove.description}</h3>
          <div className="flex items-center justify-center gap-2 text-zinc-400">
            <Target className="w-4 h-4" />
            <span>Ziel: {targetActor?.name}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <MetricBox icon={<Clock className="w-5 h-5" />} value={nextMove.effort.toUpperCase()} label="AUFWAND" />
          <MetricBox icon={<Target className="w-5 h-5" />} value={nextMove.impact.toUpperCase()} label="IMPACT" />
          <MetricBox icon={<Calendar className="w-5 h-5" />} value={nextMove.deadline ? 'HEUTE' : 'FLEXIBEL'} label="ZEIT" />
        </div>

        {/* Email Template */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-zinc-500" />
              <span className="text-sm text-zinc-500 font-mono">VORGESCHLAGENE NACHRICHT</span>
            </div>
            <button className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors">
              <Copy className="w-3 h-3" />
              Kopieren
            </button>
          </div>
          
          <div className="p-4 rounded-xl font-mono text-sm leading-relaxed" style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <p className="font-bold mb-2">Betreff: BWA für Bankfinanzierung – dringend benötigt</p>
            <p className="mb-2">Sehr geehrter Herr Müller,</p>
            <p className="mb-2">
              für die Bankfinanzierung des Objekts Kirchstraße 19 benötige ich die aktuelle BWA
              bis spätestens Mittwoch.
            </p>
            <p className="mb-2">Könnten Sie mir die BWA bis Dienstagabend zukommen lassen?</p>
            <p>mit freundlichen Grüßen<br />Martin</p>
          </div>
        </div>

        {/* Action Buttons */}
        {!done ? (
          <div className="flex gap-3">
            <button onClick={() => setDone(true)} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check className="w-5 h-5" />
              Als erledigt markieren
            </button>
            <button className="btn-secondary flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Öffnen
            </button>
          </div>
        ) : (
          <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
            ✅ Erledigt! Nächster Schritt wird berechnet...
          </div>
        )}
      </div>

      {/* Alternative Actions */}
      <div className="glass-card p-6">
        <div className="font-semibold mb-4 pb-4 border-b border-white/10">Weitere Optionen</div>
        <div className="space-y-3">
          {dummyActions.filter(a => a.id !== nextMove.id).map(action => {
            const actor = dummyActors.find(a => a.id === action.targetActor)
            return (
              <div key={action.id} className="flex items-center gap-4 p-3 rounded-xl opacity-60" style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
                <div className="text-2xl">{actor?.avatar}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{action.description}</div>
                  <div className="text-xs text-zinc-500">
                    {actor?.name} • {action.impact.toUpperCase()}
                  </div>
                </div>
                <div className="text-xs text-zinc-500">P{action.priority}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Graph
        </button>
        <button onClick={onDone} className="btn-primary flex items-center gap-2">
          Zur Today-Ansicht
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function MetricBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <div className="flex justify-center text-zinc-400 mb-2">{icon}</div>
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  )
}
