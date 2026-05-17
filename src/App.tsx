import { useState } from 'react'
import type { ViewState } from './types'

// Screens
import InputScreen from './screens/InputScreen'
import AnalysisScreen from './screens/AnalysisScreen'
import TwinScreen from './screens/TwinScreen'
import NextMoveScreen from './screens/NextMoveScreen'
import TodayScreen from './screens/TodayScreen'

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('input')


  const navigateTo = (view: ViewState) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  const handleInputSubmit = (_text: string) => {
    navigateTo('analysis')
  }

  return (
    <div className="min-h-screen bg-osion-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-osion-surfaceLight">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-osion-violet to-osion-rose flex items-center justify-center font-bold text-lg">
              ⚡
            </div>
            <div>
              <h1 className="font-bold text-lg">OSION Load Pilot</h1>
              <p className="text-xs text-gray-400">Project Twin System</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-2">
            <NavButton 
              active={currentView === 'input'} 
              onClick={() => navigateTo('input')}
              label="Input"
            />
            <NavButton 
              active={currentView === 'today'} 
              onClick={() => navigateTo('today')}
              label="Today"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {currentView === 'input' && (
            <InputScreen onSubmit={handleInputSubmit} />
          )}
          {currentView === 'analysis' && (
            <AnalysisScreen 
              onConfirm={() => navigateTo('twin')}
              onEdit={() => navigateTo('input')}
            />
          )}
          {currentView === 'twin' && (
            <TwinScreen 
              onNextMove={() => navigateTo('nextmove')}
              onBack={() => navigateTo('analysis')}
            />
          )}
          {currentView === 'nextmove' && (
            <NextMoveScreen 
              onDone={() => navigateTo('today')}
              onBack={() => navigateTo('twin')}
            />
          )}
          {currentView === 'today' && (
            <TodayScreen 
              onNewProject={() => navigateTo('input')}
              onViewProject={() => navigateTo('twin')}
            />
          )}
        </div>
      </main>
    </div>
  )
}

// Navigation Button Component
interface NavButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function NavButton({ active, onClick, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-osion-violet/20 text-osion-violet border border-osion-violet/30' 
          : 'text-gray-400 hover:text-white hover:bg-osion-surface'
      }`}
    >
      {label}
    </button>
  )
}

export default App
