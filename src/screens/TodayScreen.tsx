import { ArrowRight, Plus, AlertCircle, Target, Clock } from 'lucide-react'
import { dummyProject, dummyActors, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onOpenTwin: () => void
}

export default function TodayScreen({ onNewProject, onOpenTwin }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HERO SECTION - Primary Focus */}
      <section className="card-primary card-glow p-8 md:p-12 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#ff006e]/20 to-transparent rounded-full blur-3xl" />
        
        <div className="relative">
          {/* Label */}
          <div className="flex items-center gap-3 mb-6">
            <span className="label label-accent">Today</span>
            <div className="status-indicator blocked" />
            <span className="text-caption">Blockierender Faktor identifiziert</span>
          </div>

          {/* Headline */}
          <h2 className="text-hero mb-6 max-w-2xl">
            Der nächste
            <br />
            <span className="gradient-text-accent">wirksamste Schritt</span>
          </h2>

          {/* Primary Action Card */}
          <div className="bg-[#0a0a0c] rounded-2xl p-6 md:p-8 mb-8 border border-[#ff006e]/20">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 border border-[#ff006e]/30 flex items-center justify-center text-3xl">
                  {targetActor?.avatar}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-label text-[#ff006e]">Priorität {nextMove.priority}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-caption">{targetActor?.name}</span>
                </div>

                <h3 className="text-headline mb-3">{nextMove.description}</h3>

                <p className="text-body mb-6">
                  Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen. 
                  Der Verkäufer hat eine Deadline gesetzt.
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">Impact: <span className="text-white font-medium">{nextMove.impact}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    <span className="text-sm text-zinc-400">Aufwand: <span className="text-white font-medium">{nextMove.effort}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-[#ff006e]" />
                    <span className="text-sm text-[#ff006e] font-medium">Deadline: Heute</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={onOpenTwin}
                    className="btn-primary"
                  >
                    Project Twin öffnen
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  
                  <button 
                    onClick={onNewProject}
                    className="btn-secondary"
                  >
                    <Plus className="w-4 h-4" />
                    Neues Projekt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LEVEL B: Active Projects */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="label mb-2 inline-block">Projects</span>
            <h3 className="text-subhead">Aktive Projekte</h3>
          </div>
          <span className="text-caption">1 von 1</span>
        </div>

        <div className="card-secondary p-6 group cursor-pointer" onClick={onOpenTwin}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center text-xl">
                  🏦
                </div>
                <div>
                  <h4 className="text-subhead">{dummyProject.name}</h4>
                  <p className="text-caption">{dummyProject.goal}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <span className="label" style={{ background: 'rgba(255, 0, 110, 0.1)', borderColor: 'rgba(255, 0, 110, 0.3)', color: '#ff006e' }}>
                  🔴 Blockiert
                </span>
                <span className="text-caption">1 offene Aktion</span>
                <span className="text-zinc-600">•</span>
                <span className="text-caption">3 Risiken</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-zinc-500">{dummyProject.loadScore}</div>
              <div className="text-xs text-zinc-600 mt-1">Load Score</div>
            </div>
          </div>
        </div>
      </section>

      {/* LEVEL C: Stats - Minimal */}
      <section className="grid grid-cols-4 gap-4">
        <StatCard value="1" label="Offen" />
        <StatCard value="0" label="Erledigt" />
        <StatCard value="3" label="Risiken" />
        <StatCard value="5" label="Actoren" />
      </section>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-secondary p-4 text-center">
      <div className="text-2xl font-bold text-zinc-400 mb-1">{value}</div>
      <div className="text-xs text-zinc-600">{label}</div>
    </div>
  )
}
