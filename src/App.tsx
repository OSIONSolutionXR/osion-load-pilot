import { useState } from 'react'
import { Home, Network, Layers, Plus, Zap } from 'lucide-react'
import type { ViewState } from './types'

import TodayScreen from './screens/TodayScreen'
import ProjectTwinScreen from './screens/ProjectTwinScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import InputScreen from './screens/InputScreen'

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('today')

  const navigateTo = (view: ViewState) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen grid-bg">
      {/* Ambient Glows */}
      <div className="ambient-glow top-0 left-1/4 w-[600px] h-[500px] rounded-full bg-gradient-to-br from-[#ff006e]/20 to-transparent opacity-30" />
      <div className="ambient-glow bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#8338ec]/20 to-transparent opacity-30" />

      {/* Premium Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-5">
        <div className="container-premium">
          <div className="card-glass p-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => navigateTo('today')}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e] to-[#8338ec] flex items-center justify-center shadow-lg shadow-[#ff006e]/20 transition-all group-hover:shadow-[#ff006e]/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-base tracking-tight">Load Pilot</h1>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Project Twin System</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="nav-premium">
                <NavButton 
                  active={currentView === 'today'} 
                  onClick={() => navigateTo('today')}
                  icon={<Home className="w-4 h-4" />}
                  label="Heute"
                />
                <NavButton 
                  active={currentView === 'twin'} 
                  onClick={() => navigateTo('twin')}
                  icon={<Network className="w-4 h-4" />}
                  label="Twin"
                />
                <NavButton 
                  active={currentView === 'projects'} 
                  onClick={() => navigateTo('projects')}
                  icon={<Layers className="w-4 h-4" />}
                  label="Projekte"
                />
                <NavButton 
                  active={currentView === 'input'} 
                  onClick={() => navigateTo('input')}
                  icon={<Plus className="w-4 h-4" />}
                  label="Input"
                />
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-16 relative z-10">
        <div className="container-premium">
          {currentView === 'today' && (
            <TodayScreen 
              onOpenTwin={() => navigateTo('twin')}
              onNewInput={() => navigateTo('input')}
            />
          )}
          {currentView === 'twin' && (
            <ProjectTwinScreen 
              onBack={() => navigateTo('today')}
            />
          )}
          {currentView === 'projects' && (
            <ProjectsScreen />
          )}
          {currentView === 'input' && (
            <InputScreen 
              onCreateTwin={() => navigateTo('twin')}
              onCancel={() => navigateTo('today')}
            />
          )}
        </div>
      </main>
    </div>
  )
}

interface NavButtonProps {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function NavButton({ active, onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`nav-item ${active ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default App
