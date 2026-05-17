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
import { dummyProject, dummyActors, dummyRisks, getNextMove } from '../data/dummyData'

interface TodayScreenProps {
  onNewProject: () => void
  onOpenTwin: () => void
}

export default function TodayScreen({ onNewProject, onOpenTwin }: TodayScreenProps) {
  const nextMove = getNextMove()
  const targetActor = dummyActors.find(a => a.id === nextMove.targetActor)

  return (
    <div className="space-y-8 animate-in">
      {/* HERO - Full Width Card, Centered Content */}
      
      <section className="card-premium p-10 md:p-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label Row */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="label-premium label-accent">Heute</span>
            <span className="text-zinc-600">•</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
              <span className="text-base text-[#ef4444] font-semibold">Blocker erkannt</span>
            </div>
          </div>

          {/* MASSIVE Headline */}
          <h1 className="hero-headline mb-6">
            Der nächste{' '}
            <span className="gradient-text">wirksamste Schritt</span>
          </h1>

          {/* Empfehlung als Subline */}
          <p className="hero-subline text-zinc-300 mb-4">
            {targetActor?.name} anschreiben: BWA bis Mittwoch benötigt
          </p>

          <p className="text-lg text-zinc-500 max-w-2xl mx-auto mb-8">
            Die Bank wartet auf die BWA. Ohne diese Unterlage kann die Prüfung nicht beginnen.
          </p>

          {/* Status Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <Pill icon={<Target className="w-4 h-4" />} label="Wirkung" value="Hoch" type="high" />
            <Pill icon={<Clock className="w-4 h-4" />} label="Aufwand" value="Niedrig" type="low" />
            <Pill icon={<AlertTriangle className="w-4 h-4" />} label="Frist" value="Heute" type="urgent" />
            <Pill icon={<FileText className="w-4 h-4" />} label="Blocker" value="BWA fehlt" type="amber" />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={onOpenTwin} className="btn-glow">
              <Zap className="w-5 h-5" />
              Project Twin öffnen
            </button>
            <button onClick={onNewProject} className="btn-outline">
              <Plus className="w-5 h-5" />
              Neues Projekt
            </button>
          </div>
        </div>
      </section>

      {/* DEPENDENCY PANEL - Full Width, Centered Content */}
      
      <section className="card-dark p-8 md:p-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Network className="w-5 h-5 text-zinc-500" />
              <span className="text-lg font-semibold">Erkannte Abhängigkeit</span>
            </div>
            <span className="label-premium">Simulation</span>
          </div>

          {/* Horizontal Flow - Centered */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-8">
            <Node
              icon={<User className="w-5 h-5" />}
              title="Steuerberater"
              subtitle="liefert BWA"
              status="normal"
            />

            <Connector />

            <Node
              icon={<FileText className="w-5 h-5" />}
              title="BWA"
              subtitle="Fehlt"
              status="blocked"
            />

            <Connector />

            <Node
              icon={<Landmark className="w-5 h-5" />}
              title="Bank"
              subtitle="Prüfung"
              status="normal"
            />

            <Connector />

            <Node
              icon={<Building2 className="w-5 h-5" />}
              title="Zusage"
              subtitle="Finanzierung"
              status="goal"
            />
          </div>

          {/* Risk Warning - Centered */}
          <div className="max-w-2xl mx-auto p-5 rounded-2xl bg-[#ef4444]/5 border border-[#ef4444]/20">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-[#ef4444] flex-shrink-0" />
              <div>
                <p className="font-medium text-lg mb-1">Wenn heute nichts passiert</p>
                <p className="text-zinc-400">Risiko steigt, Bankprüfung bleibt blockiert, Verkäufer wird unsicher.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SYSTEM STATUS - Full Width Grid */}
      
      <section>
        <div className="grid grid-cols-4 gap-4">
          <StatCard icon={<Briefcase className="w-5 h-5" />} value="1" label="Projekte" />
          <StatCard icon={<Clock className="w-5 h-5" />} value="1" label="Offen" />
          <StatCard icon={<AlertTriangle className="w-5 h-5" />} value="3" label="Risiken" />
          <StatCard icon={<Target className="w-5 h-5" />} value="1" label="Blocker" />
        </div>
      </section>

      {/* AKTIVES PROJEKT - Full Width Premium Card */}
      
      <section>
        <div className="label-premium mb-4">Aktives Projekt</div>
        
        <div className="card-premium p-8 md:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Links: Projekt */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8338ec] to-[#ff006e] flex items-center justify-center shadow-lg">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{dummyProject.name}</h3>
                    <p className="text-zinc-500">{dummyProject.goal}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="label-premium label-blocked">Blockiert</span>
                  <span className="label-premium">1 offene Aktion</span>
                  <span className="label-premium">{dummyRisks.length} Risiken</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-white/5 mb-5">
                  <div className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Nächster Hebel</div>
                  <div className="text-xl font-semibold">Steuerberater Müller anschreiben</div>
                </div>

                <button onClick={onOpenTwin} className="btn-outline">
                  Projekt öffnen
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Rechts: Stats + Flow */}
              <div className="border-l border-white/10 lg:pl-10">
                <div className="text-xs text-zinc-500 mb-4 uppercase tracking-wider">Kritischer Pfad</div>
                
                <div className="space-y-3 mb-6">
                  <FlowStep icon={<FileText className="w-4 h-4" />} label="BWA" status="blocked" />
                  <div className="pl-6 border-l-2 border-zinc-800">
                    <FlowStep icon={<Landmark className="w-4 h-4" />} label="Bankprüfung" status="waiting" />
                  </div>
                  <div className="pl-6 border-l-2 border-zinc-800">
                    <FlowStep icon={<Building2 className="w-4 h-4" />} label="Zusage" status="waiting" />
                  </div>
                </div>

                <div className="space-y-3 pt-5 border-t border-white/5">
                  <StatRow label="Projektlast" value={dummyProject.loadScore.toFixed(1)} />
                  <StatRow label="Blocker" value="BWA fehlt" highlight />
                  <StatRow label="Status" value="Prüfung blockiert" />
                </div>
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

function Node({ icon, title, subtitle, status }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: 'normal' | 'blocked' | 'goal'
}) {
  const statusClasses = {
    normal: '',
    blocked: 'node-blocked',
    goal: 'node-goal'
  }

  const iconClasses = {
    normal: 'bg-zinc-800 text-zinc-400',
    blocked: 'bg-[#ef4444]/15 text-[#ef4444]',
    goal: 'bg-[#8338ec]/15 text-[#8338ec]'
  }

  return (
    <div className={`node ${statusClasses[status]}`}>
      <div className={`node-icon ${iconClasses[status]}`}>
        {icon}
      </div>
      <div className="font-semibold text-base">{title}</div>
      <div className="text-sm text-zinc-500">{subtitle}</div>
    </div>
  )
}

function Connector() {
  return (
    <div className="connector">
      <div className="connector-line" />
      <ChevronRight className="w-5 h-5" />
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="stat-mini">
      <div className="text-zinc-500">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider">{label}</div>
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
    <div className={`flex items-center gap-2 text-base ${colors[status]}`}>
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
