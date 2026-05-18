import {
  Activity,
  AlertCircle,
  AlertTriangle,
  FileText,
  GitBranch,
  Landmark,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type Tone = 'origin' | 'blocked' | 'waiting' | 'target'

type DependencyNodeData = {
  step: string
  title: string
  status: string
  tone: Tone
  icon: LucideIcon
  badge?: 'signal' | 'alert' | 'target'
}

const nodeTypes = {
  dependencyNode: DependencyNodeCard,
}

const edgeTypes = {
  defaultFlow: FlowEdge,
  blockedFlow: BlockedEdge,
}

const toneClasses: Record<Tone, { shell: string; icon: string; step: string; status: string }> = {
  origin: {
    shell:
      'border-violet-400/18 bg-[linear-gradient(180deg,rgba(18,20,31,0.98),rgba(12,13,22,0.96))] shadow-[0_16px_36px_rgba(76,29,149,0.18)]',
    icon:
      'border-violet-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.24),rgba(16,18,29,0.94))] text-violet-100 shadow-[0_0_24px_rgba(99,102,241,0.18)]',
    step: 'border-violet-300/16 bg-violet-400/8 text-violet-200/85',
    status: 'text-violet-200',
  },
  blocked: {
    shell:
      'border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(35,10,22,0.98),rgba(22,8,18,0.96))] shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_0_48px_rgba(244,63,94,0.18)]',
    icon:
      'border-rose-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.24),rgba(33,12,20,0.94))] text-rose-100 shadow-[0_0_28px_rgba(244,63,94,0.22)]',
    step: 'border-rose-300/18 bg-rose-500/10 text-rose-200/90',
    status: 'text-rose-300',
  },
  waiting: {
    shell:
      'border-blue-400/16 bg-[linear-gradient(180deg,rgba(16,19,30,0.98),rgba(11,13,20,0.96))] shadow-[0_16px_36px_rgba(30,64,175,0.12)]',
    icon:
      'border-blue-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.22),rgba(16,20,29,0.94))] text-blue-100 shadow-[0_0_24px_rgba(59,130,246,0.14)]',
    step: 'border-blue-300/16 bg-blue-400/8 text-blue-200/85',
    status: 'text-blue-200',
  },
  target: {
    shell:
      'border-cyan-400/16 bg-[linear-gradient(180deg,rgba(16,20,31,0.98),rgba(10,12,22,0.96))] shadow-[0_16px_36px_rgba(8,145,178,0.12)]',
    icon:
      'border-cyan-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.18),rgba(17,24,39,0.94))] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.14)]',
    step: 'border-cyan-300/16 bg-cyan-400/8 text-cyan-100/85',
    status: 'text-cyan-100',
  },
}

const desktopNodes: Node<DependencyNodeData>[] = [
  {
    id: 'steuerberater',
    type: 'dependencyNode',
    position: { x: 10, y: 70 },
    data: {
      step: 'SCHRITT 1',
      title: 'Steuerberater Müller',
      status: 'Auslöser',
      tone: 'origin',
      icon: UserRound,
      badge: 'signal',
    },
    draggable: false,
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'bwa',
    type: 'dependencyNode',
    position: { x: 340, y: 70 },
    data: {
      step: 'SCHRITT 2',
      title: 'BWA',
      status: 'Fehlt',
      tone: 'blocked',
      icon: FileText,
      badge: 'alert',
    },
    draggable: false,
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'bank',
    type: 'dependencyNode',
    position: { x: 670, y: 70 },
    data: {
      step: 'SCHRITT 3',
      title: 'Bankprüfung',
      status: 'Wartet',
      tone: 'waiting',
      icon: Landmark,
    },
    draggable: false,
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
  {
    id: 'zusage',
    type: 'dependencyNode',
    position: { x: 1000, y: 70 },
    data: {
      step: 'SCHRITT 4',
      title: 'Zusage',
      status: 'Finanzierung',
      tone: 'target',
      icon: ShieldCheck,
      badge: 'target',
    },
    draggable: false,
    selectable: false,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  },
]

const desktopEdges: Edge[] = [
  {
    id: 'steuerberater-bwa',
    source: 'steuerberater',
    target: 'bwa',
    type: 'defaultFlow',
    animated: false,
    selectable: false,
  },
  {
    id: 'bwa-bank',
    source: 'bwa',
    target: 'bank',
    type: 'blockedFlow',
    animated: false,
    selectable: false,
  },
  {
    id: 'bank-zusage',
    source: 'bank',
    target: 'zusage',
    type: 'defaultFlow',
    animated: false,
    selectable: false,
  },
]

const mobileNodes = [
  {
    id: 'steuerberater',
    step: 'SCHRITT 1',
    title: 'Steuerberater Müller',
    status: 'Auslöser',
    tone: 'origin' as Tone,
    icon: UserRound,
    badge: 'signal' as const,
  },
  {
    id: 'bwa',
    step: 'SCHRITT 2',
    title: 'BWA',
    status: 'Fehlt',
    tone: 'blocked' as Tone,
    icon: FileText,
    badge: 'alert' as const,
  },
  {
    id: 'bank',
    step: 'SCHRITT 3',
    title: 'Bankprüfung',
    status: 'Wartet',
    tone: 'waiting' as Tone,
    icon: Landmark,
  },
  {
    id: 'zusage',
    step: 'SCHRITT 4',
    title: 'Zusage',
    status: 'Finanzierung',
    tone: 'target' as Tone,
    icon: ShieldCheck,
    badge: 'target' as const,
  },
]

export default function DependencyGraphPanel({ variant }: { variant?: 'compact' | 'full' } = {}) {
  void variant
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_22%),linear-gradient(135deg,#0b0b12_0%,#090911_48%,#050507_100%)] shadow-[0_0_80px_rgba(168,85,247,0.12)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(192,132,252,0.16),transparent_58%)]" />

      <div className="relative p-5 sm:p-7 lg:p-10">
        <DependencyPanelHeader />

        <div className="hidden lg:block">
          <div className="relative overflow-hidden rounded-[28px] border border-white/6 bg-black/10 px-4 py-6">
            <div className="h-[360px] w-full">
              <ReactFlow
                nodes={desktopNodes}
                edges={desktopEdges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.14, minZoom: 0.9, maxZoom: 1 }}
                panOnScroll={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                nodesFocusable={false}
                edgesFocusable={false}
                proOptions={{ hideAttribution: true }}
                preventScrolling
                className="bg-transparent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:hidden">
          {mobileNodes.map((node, index) => (
            <div key={node.id} className="flex flex-col items-stretch gap-4">
              <MobileDependencyNode node={node} />
              {index < mobileNodes.length - 1 && (
                index === 1 ? <MobileBlockedConnector /> : <MobileFlowConnector />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 lg:mt-10">
          <RiskCallout />
        </div>
      </div>
    </section>
  )
}

export function DependencyPanelHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-[linear-gradient(145deg,rgba(22,22,34,0.96),rgba(12,12,20,0.88))] shadow-[0_0_30px_rgba(99,102,241,0.24)]">
          <GitBranch className="h-7 w-7 text-violet-300" />
        </div>

        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-violet-200 shadow-[0_0_18px_rgba(168,85,247,0.14)]">
            <Sparkles className="h-3.5 w-3.5" />
            Simulation
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Erkannte Abhängigkeit
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
            OSION Load Pilot visualisiert die Prozesskette, markiert den kritischen Blocker und zeigt,
            warum genau jetzt eine Handlung notwendig ist.
          </p>
        </div>
      </div>

      <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-zinc-300 backdrop-blur">
        <Activity className="h-4 w-4 text-violet-300" />
        Dependency Signal aktiv
      </div>
    </div>
  )
}

function DependencyNodeCard({ data }: NodeProps<Node<DependencyNodeData>>) {
  const tone = toneClasses[data.tone]
  const Icon = data.icon

  return (
    <article className={[
      'group relative flex h-[182px] w-[252px] flex-col overflow-hidden rounded-[26px] border p-6 transition-all duration-300',
      'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)] before:opacity-70',
      'hover:-translate-y-1 hover:border-white/14',
      tone.shell,
    ].join(' ')}>
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className={[
            'inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
            tone.step,
          ].join(' ')}>
            {data.step}
          </span>
          <NodeBadge badge={data.badge} tone={data.tone} />
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className={[
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border',
            tone.icon,
            data.tone === 'blocked' ? 'animate-pulse' : '',
          ].join(' ')}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
              {data.title}
            </h3>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Status
            </div>
            <p className={['text-sm font-medium sm:text-base', tone.status].join(' ')}>{data.status}</p>
          </div>
          {data.tone === 'blocked' && (
            <div className="rounded-full border border-rose-300/16 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.16)]">
              Kritisch
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function MobileDependencyNode({ node }: { node: DependencyNodeData }) {
  const tone = toneClasses[node.tone]
  const Icon = node.icon

  return (
    <article className={[
      'mx-auto w-full max-w-xl relative flex min-h-[182px] flex-col overflow-hidden rounded-[26px] border p-6 transition-all duration-300',
      'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)] before:opacity-70',
      tone.shell,
    ].join(' ')}>
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span className={[
            'inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
            tone.step,
          ].join(' ')}>
            {node.step}
          </span>
          <NodeBadge badge={node.badge} tone={node.tone} />
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className={[
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border',
            tone.icon,
            node.tone === 'blocked' ? 'animate-pulse' : '',
          ].join(' ')}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">{node.title}</h3>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Status</div>
            <p className={['text-sm font-medium sm:text-base', tone.status].join(' ')}>{node.status}</p>
          </div>
          {node.tone === 'blocked' && (
            <div className="rounded-full border border-rose-300/16 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.16)]">
              Kritisch
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function FlowEdge(props: EdgeProps) {
  const [path] = getBezierPath({ ...props, curvature: 0.22 })
  return (
    <>
      <BaseEdge path={path} style={{ stroke: 'url(#flowGradient)', strokeWidth: 2.5, filter: 'drop-shadow(0 0 8px rgba(139,92,246,0.18))' }} />
      <svg width="0" height="0">
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.85)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.58)" />
          </linearGradient>
        </defs>
      </svg>
    </>
  )
}

function BlockedEdge(props: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({ ...props, curvature: 0.16 })
  return (
    <>
      <BaseEdge
        path={path}
        style={{
          stroke: 'url(#blockedGradient)',
          strokeWidth: 2.8,
          strokeDasharray: '8 8',
          filter: 'drop-shadow(0 0 10px rgba(244,63,94,0.18))',
        }}
      />
      <svg width="0" height="0">
        <defs>
          <linearGradient id="blockedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(232,121,249,0.88)" />
            <stop offset="100%" stopColor="rgba(251,113,133,0.5)" />
          </linearGradient>
        </defs>
      </svg>
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="absolute rounded-full border border-rose-300/24 bg-[#120b15] p-1.5 shadow-[0_0_18px_rgba(244,63,94,0.18)]"
        >
          <XCircle className="h-4 w-4 text-rose-300" />
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

function NodeBadge({ badge, tone }: { badge?: DependencyNodeData['badge']; tone: Tone }) {
  void tone
  if (!badge) return <div className="h-8 w-8" />

  const shared = 'flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur'

  if (badge === 'signal') {
    return (
      <div className={`${shared} border-violet-300/16 bg-violet-400/8 text-violet-200`}>
        <Activity className="h-4 w-4" />
      </div>
    )
  }

  if (badge === 'alert') {
    return (
      <div className={`${shared} border-rose-300/22 bg-rose-500/12 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.14)]`}>
        <AlertCircle className="h-4 w-4" />
      </div>
    )
  }

  return (
    <div className={`${shared} border-cyan-300/16 bg-cyan-400/8 text-cyan-100`}>
      <ShieldCheck className="h-4 w-4" />
    </div>
  )
}

function MobileFlowConnector() {
  return (
    <div className="flex justify-center py-1">
      <svg width="40" height="56" viewBox="0 0 40 56" fill="none" className="overflow-visible">
        <path d="M20 4 L20 42" stroke="url(#flowVertical)" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 36 L20 44 L26 36" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="flowVertical" x1="20" y1="4" x2="20" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(59,130,246,0.95)" />
            <stop offset="1" stopColor="rgba(168,85,247,0.5)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function MobileBlockedConnector() {
  return (
    <div className="flex justify-center py-1">
      <svg width="44" height="64" viewBox="0 0 44 64" fill="none" className="overflow-visible">
        <path d="M22 4 L22 50" stroke="url(#blockedVertical)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="6 7" />
        <circle cx="22" cy="30" r="11" fill="rgba(15,15,22,0.96)" stroke="rgba(244,63,94,0.5)" />
        <XCircle className="text-rose-300" x="14" y="22" width="16" height="16" />
        <path d="M16 44 L22 52 L28 44" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="blockedVertical" x1="22" y1="4" x2="22" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(236,72,153,0.95)" />
            <stop offset="1" stopColor="rgba(251,113,133,0.42)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

function RiskCallout() {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-rose-400/18 bg-[linear-gradient(135deg,rgba(42,12,24,0.96),rgba(22,8,18,0.92))] p-5 shadow-[0_0_42px_rgba(244,63,94,0.10)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_right,rgba(244,63,94,0.16),transparent_32%)]" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-300/18 bg-rose-500/12 shadow-[0_0_26px_rgba(244,63,94,0.18)]">
            <AlertTriangle className="h-6 w-6 text-rose-200" />
          </div>

          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-50 sm:text-xl">
              Wenn heute nichts passiert:
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
              <span className="font-semibold text-rose-300">Risiko steigt</span>, Bankprüfung bleibt{' '}
              <span className="font-semibold text-rose-200">blockiert</span>.
            </p>
          </div>
        </div>

        <div className="lg:min-w-[220px] lg:pl-6">
          <MiniRiskCurve />
        </div>
      </div>
    </div>
  )
}

function MiniRiskCurve() {
  return (
    <div className="rounded-2xl border border-white/6 bg-black/20 p-3 backdrop-blur-sm">
      <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        Risk Momentum
      </div>
      <svg viewBox="0 0 220 80" className="h-20 w-full">
        <defs>
          <linearGradient id="riskLine" x1="18" y1="58" x2="188" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(244,63,94,0.32)" />
            <stop offset="1" stopColor="rgba(232,121,249,0.95)" />
          </linearGradient>
          <radialGradient id="riskGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(188 18) rotate(90) scale(18)">
            <stop stopColor="rgba(232,121,249,0.75)" />
            <stop offset="1" stopColor="rgba(232,121,249,0)" />
          </radialGradient>
        </defs>

        <g opacity="0.25">
          {[24, 56, 88, 120, 152, 184].map((x) => (
            <circle key={x} cx={x} cy={58} r="1.2" fill="rgba(255,255,255,0.35)" />
          ))}
        </g>

        <path d="M16 58 C52 58, 80 56, 110 48 S156 30, 188 18" stroke="url(#riskLine)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="188" cy="18" r="15" fill="url(#riskGlow)" />
        <circle cx="188" cy="18" r="4.5" fill="#F9A8D4" />
      </svg>
    </div>
  )
}
