import { useState } from 'react'
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
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-6 mt-6">
          <div className="max-w-6xl mx-auto card-primary px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff006e] to-[#8338ec] flex items-center justify-center">
                <span className="text-white font-bold text-lg">LP</span>
              </div>
              <div>
                <h1 className="font-semibold text-lg tracking-tight">Load Pilot</h1>
                <p className="text-xs text-zinc-500">Project Twin System</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <NavButton 
                active={currentView === 'today'} 
                onClick={() => navigateTo('today')}
                label="Today"
              />
              <NavButton 
                active={currentView === 'twin'} 
                onClick={() => navigateTo('twin')}
                label="Projects"
              />
              <NavButton 
                active={currentView === 'input'} 
                onClick={() => navigateTo('input')}
                label="New"
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-12 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
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
  label: string
}

function NavButton({ active, onClick, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-white/10 text-white' 
          : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {label}
    </button>
  )
}

export default App
