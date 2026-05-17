import { useState } from 'react'
import { Home, Network, Plus, Zap } from 'lucide-react'
import type { ViewState } from './types'

// Screens
import TodayScreen from './screens/TodayScreen'
import ProjectTwinScreen from './screens/ProjectTwinScreen'
import InputScreen from './screens/InputScreen'

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('today')

  const navigateTo = (view: ViewState) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen grid-bg">
      {/* Ambient Background Glows */}
      <div className="ambient-glow top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#ff006e] to-[#8338ec]" />
      <div className="ambient-glow bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#3a86ff] to-[#00f5ff]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e] to-[#8338ec] flex items-center justify-center shadow-lg shadow-[#ff006e]/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-base tracking-tight text-white">Load Pilot</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Project Twin System</p>
            </div>
          </div>

          {/* Pill Navigation */}
          <nav className="pill-nav">
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
              label="Projekte"
            />
            <NavButton 
              active={currentView === 'input'} 
              onClick={() => navigateTo('input')}
              icon={<Plus className="w-4 h-4" />}
              label="Neu"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          {currentView === 'today' && (
            <TodayScreen 
              onNewProject={() => navigateTo('input')}
              onOpenTwin={() => navigateTo('twin')}
            />
          )}
          {currentView === 'twin' && (
            <ProjectTwinScreen 
              onBack={() => navigateTo('today')}
            />
          )}
          {currentView === 'input' && (
            <InputScreen 
              onSubmit={() => navigateTo('twin')}
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
      className={`pill-nav-item ${active ? 'active' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

export default App
