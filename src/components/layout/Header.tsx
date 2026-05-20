import { Zap, Home, Network, Layers, Plus } from 'lucide-react'
import type { ViewState } from '../../types'

interface HeaderProps {
  activeTab: ViewState
  onNavigate: (view: ViewState) => void
}

const navItems: { id: ViewState; label: string; icon: typeof Home }[] = [
  { id: 'today', label: 'Heute', icon: Home },
  { id: 'twin', label: 'Twin', icon: Network },
  { id: 'projects', label: 'Projekte', icon: Layers },
  { id: 'input', label: 'Input', icon: Plus }
]

export function Header({ activeTab, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 py-5">
      <div className="container-premium">
        <div className="panel-premium p-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={() => onNavigate('today')}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e] to-[#8b5cf6] flex items-center justify-center shadow-lg shadow-[#ff006e]/20 transition-all group-hover:shadow-[#ff006e]/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight">Load Pilot</h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Project Twin System</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="nav-bar">
              {navItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onNavigate(id)}
                  className={`nav-item ${activeTab === id ? 'nav-item-active' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
