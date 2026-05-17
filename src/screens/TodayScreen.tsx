import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  Target, 
  ArrowRight, 
  Plus,
  User,
  Landmark,
  FileText,
  ChevronRight,
  Network
} from 'lucide-react'
import { dummyProject, dummyActors } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onOpenTwin: () => void
}

export default function TodayScreen({ onNewProject, onOpenTwin }: TodayScreenProps) {
  const targetActor = dummyActors.find(a => a.id === 'steuerberater')

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* HERO: 2-Spalten Layout */}
      <section className="card-primary p-8 md:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Links: Primary Decision Panel */}
          <div className="lg:col-span-7 space-y-6">
            {/* Label */}
            <div className="flex items-center gap-3">
              <span className="label label-accent">Heute</span>
              <span className="text-zinc-500">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-sm text-[#ef4444] font-medium">Blocker erkannt</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-hero">
              Der nächste
              <br />
              <span className="gradient-text-accent">wirksamste Schritt</span>
            </h1>

            {/* Empfehlung */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e]/20 to-[#8338ec]/20 flex items-center justify-center border border-[#ff006e]/30">
                  <User className="w-5 h-5 text-[#ff006e]" />
                </div>
                <span className="text-lg font-semibold">{targetActor?.name} anschreiben</span>
              </div>
              
              <p className="text-body max-w-lg">
                Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen. 
                Der Verkäufer hat eine Deadline gesetzt.
              </p>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap gap-3 pt-2">
              <StatusPill 
                icon={<Target className="w-3.5 h-3.5" />} 
                label="Wirkung" 
                value="Hoch" 
                type="high"
              />
              <StatusPill 
                icon={<Clock className="w-3.5 h-3.5" />} 
                label="Aufwand" 
                value="Niedrig" 
                type="low"
              />
              <StatusPill 
                icon={<AlertTriangle className="w-3.5 h-3.5" />} 
                label="Frist" 
                value="Heute" 
                type="urgent"
              />
              <StatusPill 
                icon={<FileText className="w-3.5 h-3.5" />} 
                label="Blocker" 
                value="BWA fehlt" 
                type="amber"
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 pt-4">
              <button onClick={onOpenTwin} className="btn-primary">
                Project Twin öffnen
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button onClick={onNewProject} className="btn-secondary">
                <Plus className="w-4 h-4" />
                Neues Projekt
              </button>
            </div>
          </div>

          {/* Rechts: Dependency Preview Panel */}
          <div className="lg:col-span-5">
            <div className="card-secondary h-full p-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                <Network className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-400">Erkannte Abhängigkeit</span>
              </div>

              {/* Dependency Flow */}
              <div className="dependency-flow">
                <DependencyNode 
                  icon={<User className="w-4 h-4" />}
                  title="Steuerberater"
                  subtitle="Liefert BWA"
                  status="waiting"
                />
                
                <DependencyConnector />
                
                <DependencyNode 
                  icon={<FileText className="w-4 h-4" />}
                  title="BWA"
                  subtitle="Fehlt"
                  status="blocked"
                />
                
                <DependencyConnector />
                
                <DependencyNode 
                  icon={<Landmark className="w-4 h-4" />}
                  title="Bankprüfung"
                  subtitle="Blockiert"
                  status="waiting"
                />
                
                <DependencyConnector />
                
                <DependencyNode 
                  icon={<Building2 className="w-4 h-4" />}
                  title="Zusage"
                  subtitle="Finanzierung"
                  status="goal"
                />
              </div>

              {/* Risk Warning */}
              <div className="mt-6 p-4 rounded-xl bg-[#ef4444]/5 border border-[#ef4444]/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    <span className="font-medium text-white">Wenn heute nichts passiert:</span>
                    <br />
                    Risiko steigt, Bankprüfung bleibt blockiert, Verkäufer wird unsicher.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM SIGNALS */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="1" label="Aktive Projekte" />
          <StatCard value="1" label="Offene Aktionen" />
          <StatCard value="3" label="Risiken" />
          <StatCard value="1" label="Blocker" />
        </div>
      </section>

      {/* AKTIVE PROJEKTE */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="label">Projekte</span>
            <span className="text-zinc-600">•</span>
            <span className="text-sm text-zinc-500">Aktiv</span>
          </div>
        </div>

        <div className="card-secondary p-6 group cursor-pointer" onClick={onOpenTwin}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg shadow-[#8338ec]/25">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{dummyProject.name}</h3>
                  <p className="text-zinc-500">{dummyProject.goal}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="label label-blocked">Blockiert</span>
                <span className="label">1 offene Aktion</span>
                <span className="label">3 Risiken</span>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-black/30">
                <div className="text-xs text-zinc-500 mb-2">Nächster Hebel</div>
                <div className="text-sm font-medium">Steuerberater Müller anschreiben</div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                <FileText className="w-3.5 h-3.5" />
                <span>BWA</span>
                <ChevronRight className="w-3 h-3" />
                <Landmark className="w-3.5 h-3.5" />
                <span>Bankprüfung</span>
                <ChevronRight className="w-3 h-3" />
                <Building2 className="w-3.5 h-3.5" />
                <span>Zusage</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-zinc-400">{dummyProject.loadScore.toFixed(1)}</div>
              <div className="text-xs text-zinc-600 mt-1">Projektlast</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* Components */

function StatusPill({ icon, label, value, type }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  type: 'high' | 'low' | 'urgent' | 'amber' 
}) {
  const typeClasses = {
    high: 'status-pill-high',
    low: 'status-pill-low',
    urgent: 'status-pill-urgent',
    amber: 'status-pill-amber'
  }

  return (
    <div className={`status-pill ${typeClasses[type]}`}>
      {icon}
      <span>{label}: {value}</span>
    </div>
  )
}

function DependencyNode({ 
  icon, 
  title, 
  subtitle, 
  status 
}: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  status: 'waiting' | 'blocked' | 'goal'
}) {
  const statusStyles = {
    waiting: 'border-zinc-700/50 bg-zinc-900/50',
    blocked: 'border-[#ff006e]/40 bg-[#ff006e]/5',
    goal: 'border-[#8338ec]/40 bg-[#8338ec]/5'
  }

  const iconStyles = {
    waiting: 'bg-zinc-800 text-zinc-400',
    blocked: 'bg-[#ff006e]/10 text-[#ff006e]',
    goal: 'bg-[#8338ec]/10 text-[#8338ec]'
  }

  return (
    <div className={`dependency-node ${statusStyles[status]}`}>
      <div className={`dependency-node-icon ${iconStyles[status]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{title}</div>
        <div className="text-xs text-zinc-500 truncate">{subtitle}</div>
      </div>
    </div>
  )
}

function DependencyConnector() {
  return (
    <div className="dependency-connector">
      <ChevronRight className="dependency-connector-arrow rotate-90" />
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  )
}
