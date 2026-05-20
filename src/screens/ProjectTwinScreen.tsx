import { motion } from 'motion/react'
import { ArrowLeft, Shield, Zap, Users, AlertCircle, Clock, XCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import { DependencySimulationPanel } from '../components/dependency/DependencySimulationPanel'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

interface ProjectTwinScreenProps {
  onBack: () => void
  onNewInput?: () => void
  twin: StoredProjectTwin | null
}

export default function ProjectTwinScreen({ onBack, onNewInput, twin }: ProjectTwinScreenProps) {
  const analysis = twin?.analysis ?? null
  const scenarios = analysis?.scenarios.map((scenario) => ({
    title: scenario.title,
    points: [scenario.outcome, scenario.recommendation],
    type: (
      scenario.riskLevel === 'high'
        ? 'negative'
        : scenario.riskLevel === 'low'
          ? 'positive'
          : 'neutral'
    ) as 'negative' | 'positive' | 'neutral'
  })) ?? []

  const blocker = analysis?.dependencies.find((dependency) => dependency.isBlocker)
  const topRisk = analysis?.risks[0]

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <Panel className="panel-premium p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </Button>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#ff006e]" />
              <Badge variant="violet">Project Twin</Badge>
            </div>
          </div>

          <div className="panel-card p-8 md:p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-white/10">
              <Zap className="w-7 h-7 text-violet-300" />
            </div>
            <h1 className="text-headline mb-3">Noch kein Project Twin erstellt</h1>
            <p className="text-body max-w-2xl mx-auto mb-8">
              Erfasse zuerst eine Projektlage, damit Load Pilot einen Project Twin erzeugen kann.
            </p>
            <Button onClick={onNewInput ?? onBack}>
              Neuen Input erfassen
            </Button>
          </div>
        </Panel>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="panel-premium p-6 md:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
              Zurück
            </Button>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#ff006e]" />
                <Badge variant="violet">Project Twin</Badge>
              </div>
              <h1 className="text-headline mb-2">{analysis.project.title}</h1>
              <p className="text-body">{analysis.project.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#fb7185]/10 flex items-center justify-center border border-[#fb7185]/20">
              <Shield className="w-6 h-6 text-[#fb7185]" />
            </div>
            <div>
              <div className="text-label text-zinc-500">Status</div>
              <div className="font-semibold text-[#fb7185]">{analysis.project.status}</div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatusItem label="Hauptblocker" value={blocker?.from ?? 'Keiner'} danger={Boolean(blocker)} />
          <StatusItem label="Nächster Hebel" value={analysis.nextMove.title} />
          <StatusItem label="Frist" value={analysis.nextMove.deadline ?? 'Offen'} urgent={Boolean(analysis.nextMove.deadline)} />
          <StatusItem label="Projekt-Typ" value={analysis.project.type} />
          <StatusItem label="Risiken" value={String(analysis.risks.length)} warning />
        </div>
      </motion.header>

      {/* Main Dependency Panel */}
      <DependencySimulationPanel variant="full" analysis={analysis} />

      {/* Scenario Comparison */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {scenarios.map((scenario, index) => (
          <ScenarioCard key={`${scenario.title}-${index}`} {...scenario} recommended={index === 0 && scenario.type !== 'negative'} />
        ))}
      </motion.section>

      {/* Actors & Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel variant="compact">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="font-semibold">Akteure</div>
              <div className="text-xs text-zinc-500">Beteiligte im Projekt</div>
            </div>
            <span className="ml-auto text-2xl font-bold text-zinc-600">{analysis.actors.length}</span>
          </div>

          <div className="space-y-2">
            {analysis.actors.map((actor) => (
              <ActorRow
                key={`${actor.name}-${actor.role}`}
                name={actor.name}
                role={`${actor.role}${actor.waitingFor ? ` · wartet auf ${actor.waitingFor}` : ''}`}
                type={actor.role.toLowerCase().includes('intern') ? 'internal' : 'external'}
              />
            ))}
          </div>
        </Panel>

        <Panel variant="compact">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#fb7185]/10 flex items-center justify-center border border-[#fb7185]/30">
              <AlertCircle className="w-5 h-5 text-[#fb7185]" />
            </div>
            <div>
              <div className="font-semibold">Risiken</div>
              <div className="text-xs text-zinc-500">Identifizierte Gefahren</div>
            </div>
            <span className="ml-auto text-2xl font-bold text-[#fb7185]/30">{analysis.risks.length}</span>
          </div>

          <div className="space-y-3">
            {analysis.risks.map((risk) => (
              <RiskItem
                key={risk.title}
                description={risk.title}
                timeline={risk.explanation}
                level={risk.severity}
              />
            ))}
          </div>
        </Panel>
      </div>

      <Panel variant="compact">
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="violet">Analysefelder</Badge>
          <div className="text-sm text-zinc-500">Vollständige ProjectTwinAnalysis</div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <StructuredList
            title="Projekt"
            items={[
              ['Titel', analysis.project.title],
              ['Beschreibung', analysis.project.description],
              ['Status', analysis.project.status],
              ['Typ', analysis.project.type]
            ]}
          />
          <StructuredList
            title="Next Move"
            items={[
              ['Titel', analysis.nextMove.title],
              ['Reason', analysis.nextMove.reason],
              ['Effort', analysis.nextMove.effort],
              ['Impact', analysis.nextMove.impact],
              ['Deadline', analysis.nextMove.deadline ?? 'Offen']
            ]}
          />
        </div>

        <TwinSection
          title="Abhängigkeiten"
          entries={analysis.dependencies.map((dependency) => ({
            title: `${dependency.from} → ${dependency.to}`,
            body: dependency.explanation,
            meta: `${dependency.status}${dependency.isBlocker ? ' · Blocker' : ''}`
          }))}
        />
        <TwinSection
          title="Akteure"
          entries={analysis.actors.map((actor) => ({
            title: `${actor.name} · ${actor.role}`,
            body: actor.waitingFor ?? 'Keine offene Warteinformation',
            meta: `Einfluss: ${actor.influence}`
          }))}
        />
        <TwinSection
          title="Risiken"
          entries={analysis.risks.map((risk) => ({
            title: risk.title,
            body: risk.explanation,
            meta: `Severity: ${risk.severity}`
          }))}
        />
        <TwinSection
          title="Szenarien"
          entries={analysis.scenarios.map((scenario) => ({
            title: scenario.title,
            body: `${scenario.outcome} Empfehlung: ${scenario.recommendation}`,
            meta: `Risiko: ${scenario.riskLevel}`
          }))}
        />
        <TwinSection
          title="Aktionen"
          entries={analysis.actions.map((action) => ({
            title: action.title,
            body: action.messageDraft ?? 'Direkt umsetzbare Aktion ohne Textvorlage.',
            meta: `${action.owner} · Priorität: ${action.priority}`
          }))}
        />
        <StructuredList
          title="Qualität"
          items={[
            ['Input Quality', analysis.quality.inputQuality],
            ['Actionable', analysis.quality.isActionable ? 'Ja' : 'Nein'],
            ['Confidence', analysis.quality.confidence],
            ['Reason', analysis.quality.reason],
            ['Missing Context', analysis.quality.missingContext.join(', ') || 'Keiner']
          ]}
        />
        <StructuredList
          title="Meta"
          items={[
            ['Gespeichert am', twin?.createdAt ?? 'Unbekannt'],
            ['Top Risk', topRisk?.title ?? 'Keine'],
            ['Quelle', twin?.sourceInput ?? 'Unbekannt'],
            ['Domain', analysis.meta.domain],
            ['Prompt Version', analysis.meta.promptVersion]
          ]}
        />
      </Panel>
    </div>
  )
}

function StructuredList({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div className="panel-card p-5">
      <div className="text-sm font-semibold text-zinc-100 mb-4">{title}</div>
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</div>
            <div className="text-sm text-zinc-300">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TwinSection({
  title,
  entries
}: {
  title: string
  entries: Array<{ title: string; body: string; meta: string }>
}) {
  return (
    <div className="mt-6">
      <div className="text-sm font-semibold text-zinc-100 mb-3">{title}</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {entries.map((entry, index) => (
          <div key={`${entry.title}-${index}`} className="panel-card p-4">
            <div className="text-sm font-medium text-zinc-200">{entry.title}</div>
            <div className="text-xs text-zinc-500 mt-1">{entry.meta}</div>
            <div className="text-sm text-zinc-400 mt-3">{entry.body}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Components

function StatusItem({ 
  label, 
  value, 
  danger, 
  urgent, 
  warning 
}: { 
  label: string
  value: string
  danger?: boolean
  urgent?: boolean
  warning?: boolean
}) {
  const colorClass = danger ? 'text-[#fb7185]' : urgent ? 'text-amber-400' : warning ? 'text-amber-400' : 'text-zinc-200'
  
  return (
    <div>
      <div className="text-label text-zinc-500 mb-1">{label}</div>
      <div className={`font-semibold ${colorClass}`}>{value}</div>
    </div>
  )
}

function ScenarioCard({ 
  title, 
  points, 
  type, 
  recommended 
}: { 
  title: string
  points: string[]
  type: 'negative' | 'positive' | 'neutral'
  recommended?: boolean
}) {
  const Icon = type === 'negative' ? XCircle : type === 'positive' ? CheckCircle2 : Clock
  const borderColors = {
    negative: 'border-[#fb7185]/20',
    positive: 'border-emerald-500/20',
    neutral: 'border-amber-500/20'
  }
  const iconColors = {
    negative: 'text-[#fb7185]',
    positive: 'text-emerald-400',
    neutral: 'text-amber-400'
  }

  return (
    <div className={`panel-card p-6 border ${borderColors[type]} relative`}>
      {recommended && (
        <div className="absolute -top-3 left-4">
          <Badge variant="violet">Empfohlen</Badge>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-4 mt-2">
        <Icon className={`w-5 h-5 ${iconColors[type]}`} />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      
      <ul className="space-y-2">
        {points.map((point, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-zinc-400">
            <span className="w-1 h-1 rounded-full bg-zinc-600 mt-2 flex-shrink-0" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActorRow({ 
  name, 
  role, 
  type 
}: { 
  name: string
  role: string
  type: 'internal' | 'external' | 'system' | 'ghost'
}) {
  const styles = {
    internal: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    external: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    system: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    ghost: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  }
  const labels = {
    internal: 'Intern',
    external: 'Extern',
    system: 'System',
    ghost: 'Ghost',
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-sm font-medium">
        {name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs text-zinc-500">{role}</div>
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${styles[type]}`}>
        {labels[type]}
      </span>
    </div>
  )
}

function RiskItem({ 
  description, 
  timeline, 
  level 
}: { 
  description: string
  timeline: string
  level: 'high' | 'medium' | 'low'
}) {
  const levelBadge = {
    high: <span className="px-2 py-0.5 rounded-full bg-[#fb7185] text-white text-[10px] font-semibold">Hoch</span>,
    medium: <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">Mittel</span>,
    low: <span className="px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 text-[10px]">Niedrig</span>
  }

  return (
    <div className="p-4 rounded-xl bg-[#fb7185]/[0.03] border border-[#fb7185]/10">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-sm font-medium">{description}</span>
        {levelBadge[level]}
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="w-3 h-3" />
        Wenn: {timeline}
      </div>
    </div>
  )
}
