import type { ReactNode } from 'react'

interface OrganigramNode {
  id: string
  icon: ReactNode
  title: string
  subtitle: string
  status: 'normal' | 'blocked' | 'waiting' | 'warning'
}

interface OrganigramProps {
  nodes: OrganigramNode[]
  showConnector?: boolean
}

export default function Organigram({ nodes, showConnector = true }: OrganigramProps) {
  return (
    <div className="w-full max-w-[280px] mx-auto">
      {nodes.map((node, index) => (
        <OrganigramItem
          key={node.id}
          node={node}
          isLast={index === nodes.length - 1}
          showConnector={showConnector && index < nodes.length - 1}
        />
      ))}
    </div>
  )
}

interface OrganigramItemProps {
  node: OrganigramNode
  isLast: boolean
  showConnector: boolean
}

function OrganigramItem({ node, showConnector }: OrganigramItemProps) {
  const statusStyles = {
    normal: 'border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
    blocked: 'border-[#ef4444]/40 bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5',
    waiting: 'border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02]',
    warning: 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-amber-500/5'
  }

  const iconStyles = {
    normal: 'bg-white/5 text-zinc-400',
    blocked: 'bg-[#ef4444]/20 text-[#ef4444]',
    waiting: 'bg-white/5 text-zinc-400',
    warning: 'bg-amber-500/20 text-amber-400'
  }

  const textColors = {
    normal: 'text-zinc-500',
    blocked: 'text-[#ef4444]',
    waiting: 'text-zinc-500',
    warning: 'text-amber-400'
  }

  return (
    <div className="relative">
      {/* Node Card */}
      <div 
        className={`relative z-10 p-4 rounded-xl border ${statusStyles[node.status]} ${
          node.status === 'blocked' ? 'animate-pulse shadow-lg shadow-[#ef4444]/10' : ''
        } transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-white/5`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyles[node.status]}`}>
            {node.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm truncate">{node.title}</div>
            <div className={`text-xs ${textColors[node.status]}`}>{node.subtitle}</div>
          </div>
        </div>
      </div>

      {/* Connector Line - CSS based, not SVG */}
      {showConnector && (
        <div className="flex flex-col items-center py-2">
          <div 
            className={`w-0.5 h-6 ${
              node.status === 'blocked' ? 'bg-gradient-to-b from-[#ef4444]/60 to-[#ef4444]/20' : 'bg-gradient-to-b from-white/20 to-white/5'
            }`} 
          />
          <div 
            className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent ${
              node.status === 'blocked' ? 'border-t-[#ef4444]/60' : 'border-t-white/20'
            } -mt-0.5`}
          />
        </div>
      )}
    </div>
  )
}
