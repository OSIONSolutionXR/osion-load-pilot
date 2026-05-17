import { 
  ArrowLeft, 
  ArrowRight, 
  AlertTriangle, 
  Users, 
  Clock, 
  GitBranch,
  Building2,
  Landmark,
  FileText
} from 'lucide-react'
import { dummyProject, dummyActors, dummyDependencies, dummyRisks } from '../data/dummyData'

interface ProjectTwinScreenProps {
  onBack: () => void
}

export default function ProjectTwinScreen({ onBack }: ProjectTwinScreenProps) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="btn-ghost">
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </button>
          
          <div>
            <span className="label mb-1 inline-block">Project Twin</span>
            <h2 className="text-headline">{dummyProject.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="label label-blocked">Blockiert</span>
          <div className="text-right">
            <div className="text-3xl font-bold">{dummyProject.loadScore.toFixed(1)}</div>
            <div className="text-xs text-zinc-600">Projektlast</div>
          </div>
        </div>
      </header>

      {/* Dependency Map */}
      <section className="card-primary p-8">
        <div className="flex items-center gap-3 mb-8">
          <GitBranch className="w-5 h-5 text-zinc-500" />
          <span className="text-subhead">Abhängigkeits-Karte</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4 max-w-md mx-auto lg:mx-0">
            <ActorNode 
              actor={dummyActors[2]} 
              status="waiting"
            />

            <Connector label="liefert BWA" />

            <div className="flex items-center gap-4">
              <ActorNode 
                actor={dummyActors[0]} 
                status="blocked"
              />
              <BlockerCard />
            </div>

            <Connector label="wartet auf" />

            <ActorNode 
              actor={dummyActors[1]} 
              status="waiting"
            />

            <Connector label="Prüfung (3-5 Tage)" />

            <GoalCard />

            <Connector label="Frist: Freitag" warning />

            <ActorNode 
              actor={dummyActors[3]} 
              status="urgent"
            />
          </div>

          <div className="space-y-4">
            <div className="card-secondary p-6">
              <div className="text-sm font-medium mb-4">Projekt-Übersicht</div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Ziel</span>
                  <span>{dummyProject.goal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Status</span>
                  <span className="text-[#ef4444]">Blockiert</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Actoren</span>
                  <span>{dummyActors.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Risiken</span>
                  <span>{dummyRisks.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column: Actors + Risks */}
      <div className="grid grid-cols-2 gap-6">
        <section className="card-secondary p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-zinc-500" />
            <span className="text-subhead">Actoren</span>
            <span className="text-caption ml-auto">{dummyActors.length}</span>
          </div>

          <div className="space-y-3">
            {dummyActors.map(actor => (
              <div key={actor.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-lg">
                  {actor.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{actor.name}</div>
                  <div className="text-xs text-zinc-500">{actor.role}</div>
                </div>
                <TypeBadge type={actor.type} />
              </div>
            ))}
          </div>
        </section>

        <section className="card-secondary p-6">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
            <span className="text-subhead">Risiken</span>
            <span className="text-caption ml-auto">{dummyRisks.length}</span>
          </div>

          <div className="space-y-3">
            {dummyRisks.map(risk => (
              <div key={risk.id} className="p-4 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">{risk.description}</span>
                  <RiskLevel probability={risk.probability} impact={risk.impact} />
                </div>
                <div className="text-xs text-zinc-500">
                  Wenn: {risk.timeline}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Kritischer Pfad */}
      <section className="card-secondary p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-zinc-500" />
          <span className="text-subhead">Kritischer Pfad</span>
        </div>

        <div className="space-y-3">
          {dummyDependencies.map(dep => (
            <div key={dep.id} className={`flex items-center gap-4 p-4 rounded-xl ${
              dep.blocking ? 'bg-[#ef4444]/5 border border-[#ef4444]/20' : 'bg-white/5'
            }`}>
              <div className="flex-1">
                <div className="text-sm">{dep.description}</div>
                <div className="text-xs text-zinc-500 mt-1">
                  {getActorName(dep.from)} → {getActorName(dep.to)}
                </div>
              </div>
              {dep.deadline && (
                <span className="text-xs text-[#ef4444] font-medium">
                  Frist: {dep.deadline.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ActorNode({ actor, status }: { actor: typeof dummyActors[0]; status: 'waiting' | 'blocked' | 'urgent' }) {
  const statusStyles = {
    waiting: 'border-zinc-700 bg-zinc-900/50',
    blocked: 'border-[#ef4444] bg-[#ef4444]/10',
    urgent: 'border-[#ef4444] bg-black animate-pulse',
  }

  return (
    <div className="flex justify-center">
      <div className={`p-5 rounded-2xl border-2 ${statusStyles[status]} max-w-xs w-full text-center`}>
        <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 flex items-center justify-center text-xl mb-3">
          {actor.avatar}
        </div>
        <div className="font-semibold">{actor.name}</div>
        <div className="text-sm text-zinc-500">{actor.role}</div>
      </div>
    </div>
  )
}

function BlockerCard() {
  return (
    <div className="p-4 rounded-2xl border-2 border-[#ef4444] bg-[#ef4444]/10 max-w-[140px] text-center">
      <FileText className="w-5 h-5 mx-auto text-[#ef4444] mb-2" />
      <div className="font-semibold text-sm">BWA</div>
      <div className="text-xs text-[#ef4444]">Fehlt</div>
    </div>
  )
}

function GoalCard() {
  return (
    <div className="flex justify-center">
      <div className="p-6 rounded-2xl border-l-4 border-l-[#8338ec] bg-black max-w-sm w-full text-center">
        <Landmark className="w-8 h-8 mx-auto text-[#8338ec] mb-2" />
        <div className="font-bold">Zusage Bankfinanzierung</div>
        <div className="text-sm text-zinc-500">KS19 Sanierung</div>
      </div>
    </div>
  )
}

function Connector({ label, warning }: { label: string; warning?: boolean }) {
  return (
    <div className="flex flex-col items-center py-2">
      <span className={`text-xs mb-1 ${warning ? 'text-[#ef4444]' : 'text-zinc-600'}`}>{label}</span>
      <ArrowRight className={`w-4 h-4 rotate-90 ${warning ? 'text-[#ef4444]' : 'text-zinc-700'}`} />
    </div>
  )
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    internal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    external: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    system: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
    ghost: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  }
  const labels: Record<string, string> = {
    internal: 'Intern',
    external: 'Extern',
    system: 'System',
    ghost: 'Ghost',
  }

  return (
    <span className={`px-2 py-1 rounded-lg text-xs border ${styles[type] || styles.ghost}`}>
      {labels[type] || type}
    </span>
  )
}

function RiskLevel({ probability, impact }: { probability: number; impact: number }) {
  const level = probability * impact
  
  if (level > 6) {
    return <span className="px-2 py-1 rounded bg-[#ef4444] text-white text-xs font-medium">Hoch</span>
  } else if (level > 4) {
    return <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">Mittel</span>
  }
  return <span className="px-2 py-1 rounded bg-zinc-500/20 text-zinc-400 text-xs">Niedrig</span>
}

function getActorName(id: string): string {
  const actor = dummyActors.find(a => a.id === id)
  return actor?.name || id
}
