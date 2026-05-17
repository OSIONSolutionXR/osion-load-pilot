import { Check, ArrowLeft, Mail, Clock, Zap, Target, Calendar } from 'lucide-react'
import { dummyActions, dummyActors, formatPriority, formatEffort, formatImpact, getNextMove } from '../data/dummyData'
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Dein nächster Schritt</h2>
        <p className="text-gray-400">Optimale Aktion basierend auf Simulation</p>
      </div>

      {/* Priority Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-osion-rose/20 text-osion-rose rounded-full font-medium">
          <Zap className="w-5 h-5" />
          {formatPriority(nextMove.priority)}
        </div>
      </div>

      {/* Main Action Card */}
      <div className="glass-panel p-8 border-2 border-osion-violet/50">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚡</div>
          <h3 className="text-xl font-bold mb-2">{nextMove.description}</h3>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span>Ziel: {targetActor?.name}</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <MetricBox
            icon={<Clock className="w-5 h-5" />}
            value={formatEffort(nextMove.effort)}
            label="Aufwand"
          />
          <MetricBox
            icon={<Target className="w-5 h-5" />}
            value={formatImpact(nextMove.impact)}
            label="Impact"
          />
          <MetricBox
            icon={<Calendar className="w-5 h-5" />}
            value={nextMove.deadline ? 'Heute' : 'Flexibel'}
            label="Zeit"
          />
        </div>

        {/* Template Preview */}
        {nextMove.template && (
          <div className="bg-osion-black/50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <Mail className="w-4 h-4" />
              <span>Vorgeschlagene Nachricht</span>
            </div>
            <div className="text-sm leading-relaxed text-gray-300">
              <p className="mb-2">Betreff: BWA für Bankfinanzierung – dringend benötigt</p>
              <p className="mb-2">Sehr geehrter Herr Müller,</p>
              <p className="mb-2">
                für die Bankfinanzierung des Objekts Kirchstraße 19 benötige ich die aktuelle BWA
                bis spätestens Mittwoch. Die Bank hat die Prüfung bereits begonnen und wartet
                auf die Unterlagen.
              </p>
              <p>Könnten Sie mir die BWA bis Dienstagabend zukommen lassen?</p>
              <p className="mt-2">Mit freundlichen Grüßen<br />Martin</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!done ? (
          <div className="flex gap-3">
            <button
              onClick={() => setDone(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Als erledigt markieren
            </button>
            <button
              onClick={() => window.open(`mailto:${targetActor?.contact}`)}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Öffnen
            </button>
          </div>
        ) : (
          <div className="text-center p-4 bg-osion-green/20 text-osion-green rounded-xl">
            ✅ Erledigt! Nächster Schritt wird berechnet...
          </div>
        )}
      </div>

      {/* Alternative Actions */}
      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4">Weitere Optionen</h3>
        <div className="space-y-3">
          {dummyActions.filter(a => a.id !== nextMove.id).map(action => {
            const actor = dummyActors.find(a => a.id === action.targetActor)
            return (
              <div key={action.id} className="flex items-center gap-4 p-3 bg-osion-surface rounded-lg opacity-60">
                <div className="text-2xl">{actor?.avatar}</div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{action.description}</div>
                  <div className="text-xs text-gray-500">
                    {actor?.name} • {formatImpact(action.impact)}
                  </div>
                </div>
                <div className="text-xs text-gray-500">Prio: {action.priority}</div>
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
    <div className="text-center p-3 bg-osion-surface rounded-lg">
      <div className="flex justify-center text-gray-400 mb-1">{icon}</div>
      <div className="font-semibold text-sm">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  )
}
