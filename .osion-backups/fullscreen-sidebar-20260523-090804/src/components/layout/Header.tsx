import { Zap, Home, Network, Layers, Plus } from 'lucide-react'
import type { ViewState } from '../../types'

interface HeaderProps {
  activeTab: ViewState
  onNavigate: (view: ViewState) => void
}

const navItems: { id: ViewState; label: string; icon: typeof Home }[] = [
  { id: 'command', label: 'Command', icon: Home },
  { id: 'twin', label: 'Twin', icon: Network },
  { id: 'projects', label: 'Projekte', icon: Layers },
  { id: 'input', label: 'Input', icon: Plus }
]

export function Header({ activeTab, onNavigate }: HeaderProps) {
  return (
    <nav className="top-nav">
      <div className="top-nav__brand">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => onNavigate('command')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#0891b2] flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all group-hover:shadow-blue-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-[var(--lp-text)]">Load Pilot</h1>
            <p className="text-[10px] text-[var(--lp-muted)] uppercase tracking-wider">Project Twin System</p>
          </div>
        </div>
      </div>

      <div className="top-nav__links">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`top-nav__link ${activeTab === id ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
