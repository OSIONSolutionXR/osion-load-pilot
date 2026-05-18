import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  GitBranch,
  Landmark,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NodeTone = 'origin' | 'blocked' | 'waiting' | 'target'

type FlowNode = {
  id: string
  step: string
  title: string
  status: string
  tone: NodeTone
  icon: LucideIcon
  badge?: 'check' | 'alert' | 'target'
}

const flowNodes: FlowNode[] = [
  {
    id: 'steuerberater',
    step: 'SCHRITT 1',
    title: 'Steuerberater Müller',
    status: 'Auslöser',
    tone: 'origin',
    icon: UserRound,
    badge: 'check',
  },
  {
    id: 'bwa',
    step: 'SCHRITT 2',
    title: 'BWA',
    status: 'Fehlt',
    tone: 'blocked',
    icon: FileText,
    badge: 'alert',
  },
  {
    id: 'bank',
    step: 'SCHRITT 3',
    title: 'Bank',
    status: 'Prüfung wartet',
    tone: 'waiting',
    icon: Landmark,
  },
  {
    id: 'zusage',
    step: 'SCHRITT 4',
    title: 'Zusage',
    status: 'Finanzierung',
    tone: 'target',
    icon: ShieldCheck,
    badge: 'target',
  },
]

interface OrganigramProps {
  variant?: 'compact' | 'full'
}

export default function Organigram({ variant = 'compact' }: OrganigramProps) {
  void variant
  return <DependencySimulationPanel />
}

export function DependencySimulationPanel() {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_22%),linear-gradient(135deg,#0b0b12_0%,#090911_48%,#050507_100%)] shadow-[0_0_80px_rgba(168,85,247,0.12)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(192,132,252,0.18),transparent_58%)]" />

      <div className="relative p-5 sm:p-7 lg:p-10">
        <DependencyPanelHeader />
        <DependencyFlow nodes={flowNodes} />
        <RiskCallout />
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
            OSION Load Pilot erkennt die kritische Prozesskette, markiert den Blocker und zeigt,
            warum heute genau eine Handlung Priorität hat.
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

export function DependencyFlow({ nodes }: { nodes: FlowNode[] }) {
  return (
    <div className="mb-8 lg:mb-10">
      <div className="hidden lg:flex lg:items-stretch lg:justify-center lg:gap-0">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex items-center">
            <DependencyNode node={node} />
            {index < nodes.length - 1 && (
              index === 1 ? <BlockedConnector /> : <FlowConnector />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:hidden">
        {nodes.map((node, index) => (
          <div key={node.id} className="flex flex-col gap-4">
            <DependencyNode node={node} mobile />
            {index < nodes.length - 1 && (
              index === 1 ? <BlockedConnector vertical /> : <FlowConnector vertical />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DependencyNode({ node, mobile = false }: { node: FlowNode; mobile?: boolean }) {
  const Icon = node.icon

  const toneStyles: Record<NodeTone, { shell: string; icon: string; status: string; step: string }> = {
    origin: {
      shell:
        'border-violet-400/16 bg-[linear-gradient(180deg,rgba(18,20,31,0.96),rgba(12,13,22,0.94))] shadow-[0_12px_32px_rgba(37,99,235,0.10)]',
      icon:
        'border-violet-300/20 bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.24),rgba(17,24,39,0.92))] text-violet-200 shadow-[0_0_22px_rgba(99,102,241,0.18)]',
      status: 'text-violet-200',
      step: 'border-violet-300/16 bg-violet-400/8 text-violet-200/80',
    },
    blocked: {
      shell:
        'border-fuchsia-400/30 bg-[linear-gradient(180deg,rgba(32,12,24,0.96),rgba(22,10,18,0.94))] shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_0_46px_rgba(244,63,94,0.18)]',
      icon:
        'border-rose-300/20 bg-[radial-gradient(circle_at_30%_30%,rgba(244,63,94,0.24),rgba(35,12,22,0.92))] text-rose-200 shadow-[0_0_26px_rgba(244,63,94,0.22)]',
      status: 'text-rose-300',
      step: 'border-rose-300/18 bg-rose-500/10 text-rose-200/90',
    },
    waiting: {
      shell:
        'border-blue-400/14 bg-[linear-gradient(180deg,rgba(16,19,30,0.96),rgba(11,13,20,0.94))] shadow-[0_12px_32px_rgba(59,130,246,0.08)]',
      icon:
        'border-blue-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.22),rgba(17,24,39,0.92))] text-blue-200 shadow-[0_0_22px_rgba(59,130,246,0.16)]',
      status: 'text-blue-200',
      step: 'border-blue-300/14 bg-blue-400/8 text-blue-200/80',
    },
    target: {
      shell:
        'border-cyan-400/16 bg-[linear-gradient(180deg,rgba(17,20,32,0.96),rgba(11,12,22,0.94))] shadow-[0_12px_32px_rgba(34,211,238,0.09)]',
      icon:
        'border-cyan-300/18 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.18),rgba(17,24,39,0.92))] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.16)]',
      status: 'text-cyan-100',
      step: 'border-cyan-300/14 bg-cyan-400/8 text-cyan-100/80',
    },
  }

  const tone = toneStyles[node.tone]

  return (
    <article
      className={[
        'group relative overflow-hidden rounded-[26px] border p-6 transition-all duration-300',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_35%)] before:opacity-70',
        'hover:-translate-y-1 hover:border-white/14',
        mobile ? 'w-full min-h-[168px]' : 'h-[176px] w-[248px] shrink-0',
        tone.shell,
      ].join(' ')}
    >
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-5 flex items-start justify-between gap-4">
          <span
            className={[
              'inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]',
              tone.step,
            ].join(' ')}
          >
            {node.step}
          </span>
          <NodeBadge badge={node.badge} tone={node.tone} />
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div
            className={[
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border',
              tone.icon,
              node.tone === 'blocked' ? 'animate-pulse' : '',
            ].join(' ')}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
              {node.title}
            </h3>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
              Status
            </div>
            <p className={[ 'text-sm font-medium sm:text-base', tone.status ].join(' ')}>{node.status}</p>
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

function NodeBadge({ badge, tone: _tone }: { badge?: FlowNode['badge']; tone: NodeTone }) {
  void _tone
  if (!badge) return <div className="h-8 w-8" />

  const shared = 'flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur'

  if (badge === 'check') {
    return (
      <div className={`${shared} border-violet-300/16 bg-violet-400/8 text-violet-200`}>
        <ShieldCheck className="h-4 w-4" />
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
      <ArrowRight className="h-4 w-4" />
    </div>
  )
}

export function FlowConnector({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex justify-center py-1">
        <svg width="40" height="56" viewBox="0 0 40 56" fill="none" className="overflow-visible">
          <path
            d="M20 4 L20 42"
            stroke="url(#flowVertical)"
            strokeWidth="2"
            strokeLinecap="round"
          />
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

  return (
    <div className="mx-3 flex h-[176px] items-center">
      <svg width="88" height="56" viewBox="0 0 88 56" fill="none" className="overflow-visible">
        <path
          d="M4 28 C22 28, 26 12, 44 12 S66 28, 84 28"
          stroke="url(#flowHorizontal)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M74 22 L84 28 L74 34" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="flowHorizontal" x1="4" y1="28" x2="84" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(59,130,246,0.85)" />
            <stop offset="1" stopColor="rgba(168,85,247,0.56)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function BlockedConnector({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div className="flex justify-center py-1">
        <svg width="44" height="64" viewBox="0 0 44 64" fill="none" className="overflow-visible">
          <path
            d="M22 4 L22 50"
            stroke="url(#blockedVertical)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 7"
          />
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

  return (
    <div className="mx-3 flex h-[176px] items-center">
      <svg width="96" height="64" viewBox="0 0 96 64" fill="none" className="overflow-visible">
        <path
          d="M4 32 C22 32, 28 18, 48 18 S72 32, 92 32"
          stroke="url(#blockedHorizontal)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="7 8"
        />
        <circle cx="49" cy="32" r="13" fill="rgba(15,15,22,0.98)" stroke="rgba(244,63,94,0.5)" />
        <XCircle x="41" y="24" width="16" height="16" className="text-rose-300" />
        <path d="M82 26 L92 32 L82 38" stroke="#FB7185" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="blockedHorizontal" x1="4" y1="32" x2="92" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(232,121,249,0.86)" />
            <stop offset="1" stopColor="rgba(251,113,133,0.42)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function RiskCallout() {
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

export function MiniRiskCurve() {
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
        <path d="M16 58 C52 58, 80 56, 110 48 S156 30, 188 18 L188 66 L16 66 Z" fill="url(#riskArea)" opacity="0.0" />
        <circle cx="188" cy="18" r="15" fill="url(#riskGlow)" />
        <circle cx="188" cy="18" r="4.5" fill="#F9A8D4" />
      </svg>
    </div>
  )
}
