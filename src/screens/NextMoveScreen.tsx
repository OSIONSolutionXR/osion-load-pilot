import { Check, ArrowLeft, Mail, Clock, Zap, Target, Calendar, Copy } from 'lucide-react'
import { dummyActions, dummyActors, formatPriority, getNextMove } from '../data/dummyData'
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="tag">SCHRITT 3/4</span>
          </div>
          <h2 className="font-mono font-bold text-3xl">DEIN NÄCHSTER SCHRITT</h2>
        </div>
        <div className="tag-filled bg-osion-red flex items-center gap-2">
          <Zap className="w-4 h-4" />
          EMPFOHLEN
        </div>
      </div>

      {/* Priority */}
      <div className="flex justify-center">
        <div className="text-center">
          <div className="font-mono text-6xl font-bold">{nextMove.priority}</div>
          <div className="font-mono text-sm text-gray-500">PRIORITY SCORE</div>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="card border-2 border-osion-red">
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-black text-white flex items-center justify-center mx-auto mb-4 text-4xl shadow-[8px_8px_0px_0px_#dc2626]">
            ⚡
          </div>
          
          <h3 className="font-mono font-bold text-2xl mb-2">{nextMove.description}</h3>
          <div className="flex items-center justify-center gap-2 font-mono text-gray-600">
            <Target className="w-4 h-4" />
            <span>ZIEL: {targetActor?.name}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <MetricBox
            icon={<Clock className="w-5 h-5" />}
            value={nextMove.effort.toUpperCase()}
            label="AUFWAND"
          />
          <MetricBox
            icon={<Target className="w-5 h-5" />}
            value={nextMove.impact.toUpperCase()}
            label="IMPACT"
          />
          <MetricBox
            icon={<Calendar className="w-5 h-5" />}
            value={nextMove.deadline ? 'HEUTE' : 'FLEXIBEL'}
            label="ZEIT"
          />
        </div>

        {/* Email Template */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-mono text-xs text-gray-500">VORGESCHLAGENE NACHRICHT</span>
            </div>
            <button className="btn-ghost flex items-center gap-1 text-xs">
              <Copy className="w-3 h-3" />
              Kopieren
            </button>
          </div>
          
          <div className="bg-gray-50 border-2 border-black p-4 font-mono text-sm">
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
            <button
              onClick={() => setDone(true)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              ALS ERLEDIGT MARKIEREN
            </button>
            <button
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              ÖFFNEN
            </button>
          </div>
        ) : (
          <div className="text-center p-4 bg-black text-white font-mono">
            ✅ ERLEDIGT! NÄCHSTER SCHRITT WIRD BERECHNET...
          </div>
        )}
      </div>

      {/* Alternative Actions */}
      <div className="card">
        <div className="font-mono font-bold mb-4 border-b-2 border-black pb-2">WEITERE OPTIONEN</div>
        <div className="space-y-3">
          {dummyActions.filter(a => a.id !== nextMove.id).map(action => {
            const actor = dummyActors.find(a => a.id === action.targetActor)
            return (
              <div key={action.id} className="flex items-center gap-4 p-3 border-2 border-gray-200 opacity-60">
                <div className="text-2xl">{actor?.avatar}</div>
                <div className="flex-1">
                  <div className="font-mono font-bold text-sm">{action.description}</div>
                  <div className="font-mono text-xs text-gray-500">
                    {actor?.name} • {action.impact.toUpperCase()}
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-500">P{action.priority}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button onClick={onBack} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          ZURÜCK ZUM GRAPH
        </button>
        <button onClick={onDone} className="btn-primary flex items-center gap-2">
          ZUR TODAY-ANSICHT
          <Check className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function MetricBox({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="text-center p-4 border-2 border-black">
      <div className="flex justify-center text-black mb-2">{icon}</div>
      <div className="font-mono font-bold">{value}</div>
      <div className="font-mono text-xs text-gray-500">{label}</div>
    </div>
  )
}
