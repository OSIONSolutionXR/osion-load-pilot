import {
  Building2,
  Clock,
  AlertTriangle,
  Target,
  Plus,
  User,
  Landmark,
  FileText,
  ChevronRight,
  Zap,
  ArrowUpRight,
  Network,
  Briefcase
} from 'lucide-react'
import { dummyProject, dummyActors, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onOpenTwin: () => void
}

export default function TodayScreen({ onNewProject, onOpenTwin }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-6 animate-in">
      
      {/* HERO: Next Move + Proof */}
      
      <section className="card-hero p-10 md:p-14">
        <div className="grid-12">
          
          {/* Links: Next Move */}
          <div className="col-7 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-6">
              <span className="label label-accent">Heute</span>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                <span className="text-sm text-[#ef4444] font-semibold">Blocker erkannt</span>
              </div>
            </div>

            <h1 className="hero-headline mb-6">
              Der nächste{' '}
              <span className="gradient-text">wirksamste Schritt</span>
            </h1>

            <p className="hero-subline text-zinc-300 mb-4">
              {targetActor?.name} anschreiben: BWA bis Mittwoch benötigt
            </p>

            <p className="text-zinc-500 max-w-lg mb-8">
              Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen.
            </p>

            <div className="flex flex-wrap gap-2 mb-10">
              <Pill icon={<Target className="w-3.5 h-3.5" />} label="Wirkung" value="Hoch" type="high" />
              <Pill icon={<Clock className="w-3.5 h-3.5" />} label="Aufwand" value="Niedrig" type="low" />
              <Pill icon={<AlertTriangle className="w-3.5 h-3.5" />} label="Frist" value="Heute" type="urgent" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenTwin} className="btn-primary group">
                <Zap className="w-5 h-5 transition-transform group-hover:scale-110" />
                Project Twin öffnen
              </button>
              <button onClick={onNewProject} className="btn-secondary">
                <Plus className="w-5 h-5" />
                Neues Projekt
              </button>
            </div>
          </div>

          {/* Rechts: Dependency Proof */}
          
          <div className="col-5">
            <div className="card-glass p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Network className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-400">Erkannte Abhängigkeit</span>
                </div>
                <span className="label">Simulation</span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                <DiagramNode
                  icon={<User className="w-5 h-5" />}
                  title="Steuerberater"
                  subtitle="liefert BWA"
                  status="normal"
                  delay="0s"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<FileText className="w-5 h-5" />}
                  title="BWA"
                  subtitle="Fehlt"
                  status="blocked"
                  delay="0.1s"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<Landmark className="w-5 h-5" />}
                  title="Bank"
                  subtitle="Prüfung"
                  status="normal"
                  delay="0.2s"
                />

                <DiagramConnector />

                <DiagramNode
                  icon={<Building2 className="w-5 h-5" />}
                  title="Zusage"
                  subtitle="Finanzierung"
                  status="goal"
                  delay="0.3s"
                />
              </div>

              <div className="risk-warning p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#ef4444] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">Wenn heute nichts passiert</p>
                    <p className="text-xs text-zinc-400">Risiko steigt, Bankprüfung bleibt blockiert.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM STATUS: Kompakt */}
      
      <section>
        <div className="grid-12">
          <div className="col-3">
            <StatusMicro icon={<Briefcase className="w-4 h-4" />} value="1" label="Projekte" />
          </div>
          <div className="col-3">
            <StatusMicro icon={<Clock className="w-4 h-4" />} value="1" label="Offen" />
          </div>
          <div className="col-3">
            <StatusMicro icon={<AlertTriangle className="w-4 h-4 text-[#ef4444]" />} value="3" label="Risiken" />
          </div>
          <div className="col-3">
            <StatusMicro icon={<Target className="w-4 h-4 text-[#ef4444]" />} value="1" label="Blocker" />
          </div>
        </div>
      </section>

      {/* FOCUS PROJECT */}
      
      <section>
        <div className="label mb-4">Aktives Projekt</div>
        
        <div className="card-focus p-8 md:p-10">
          <div className="grid-12 gap-8">
            
            <div className="col-7">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg group cursor-pointer transition-transform hover:scale-105">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{dummyProject.name}</h3>
                  <p className="text-zinc-500">{dummyProject.goal}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="label label-blocked">Blockiert</span>
                <span className="label">1 offene Aktion</span>
                <span className="label">3 Risiken</span>
              </div>

              <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/5 mb-5">
                <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Nächster Hebel</div>
                <div className="text-lg font-semibold">Steuerberater Müller anschreiben</div>
              </div>

              <button onClick={onOpenTwin} className="btn-ghost group">
                Öffnen
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>

            
            <div className="col-5 border-l border-white/10 pl-8">
              <div className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">Kritischer Pfad</div>
              
              <div className="space-y-3 mb-6">
                <FlowStep icon={<FileText className="w-4 h-4" />} label="BWA" status="blocked" />
                <div className="pl-5 border-l-2 border-zinc-800">
                  <FlowStep icon={<Landmark className="w-4 h-4" />} label="Bankprüfung" status="waiting" />
                </div>
                <div className="pl-5 border-l-2 border-zinc-800">
                  <FlowStep icon={<Building2 className="w-4 h-4" />} label="Zusage" status="waiting" />
                </div>
              </div>

              <div className="space-y-3 pt-5 border-t border-white/5">
                <StatRow label="Projektlast" value="8.0" />
                <StatRow label="Blocker" value="BWA fehlt" highlight />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* Components */

function Pill({ icon, label, value, type }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  type: 'high' | 'low' | 'urgent' | 'amber'
}) {
  const typeClasses = {
    high: 'pill-high',
    low: 'pill-low',
    urgent: 'pill-urgent',
    amber: 'pill-amber'
  }

  return (
    <div className={`pill ${typeClasses[type]}`}>
      {icon}
      <span>{label}: {value}</span>
    </div>
  )
}

function DiagramNode({ icon, title, subtitle, status, delay }: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  status: 'normal' | 'blocked' | 'goal';
  delay?: string;
}) {
  const statusClasses = {
    normal: '',
    blocked: 'diagram-node-blocked',
    goal: 'diagram-node-goal'
  }

  return (
    <div className={`diagram-node ${statusClasses[status]}`} style={{ animationDelay: delay }}>
      <div className="diagram-icon">
        {icon}
      </div>
      <div className="font-semibold text-sm">{title}</div>
      <div className="text-xs text-zinc-500">{subtitle}</div>
    </div>
  )
}

function DiagramConnector() {
  return (
    <div className="diagram-connector">
      <div className="diagram-connector-line" />
      <ChevronRight className="w-4 h-4" />
    </div>
  )
}

function StatusMicro({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="status-micro">
      <div className="text-zinc-500">{icon}</div>
      <div>
        <div className="status-micro-value">{value}</div>
        <div className="status-micro-label">{label}</div>
      </div>
    </div>
  )
}

function FlowStep({ icon, label, status }: { icon: React.ReactNode; label: string; status: 'blocked' | 'waiting' }) {
  const colors = {
    blocked: 'text-[#ef4444]',
    waiting: 'text-zinc-500'
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${colors[status]}`}>
      {icon}
      <span className={status === 'blocked' ? 'font-semibold' : ''}>{label}</span>
    </div>
  )
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-zinc-500">{label}</span>
      <span className={highlight ? 'text-[#ef4444] font-semibold' : 'font-medium'}>{value}</span>
    </div>
  )
}
