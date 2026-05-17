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

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Header - MiroFish Style */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-black">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <span className="text-white font-mono font-bold text-lg">⚡</span>
            </div>
            <div>
              <h1 className="font-mono font-bold text-lg tracking-tight">OSION LOAD PILOT</h1>
              <p className="font-mono text-xs text-gray-500">PROJECT TWIN SYSTEM</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1">
            <NavButton 
              active={currentView === 'input'} 
              onClick={() => navigateTo('input')}
              label="INPUT"
            />
            <NavButton 
              active={currentView === 'today'} 
              onClick={() => navigateTo('today')}
              label="TODAY"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8 px-6">
        <div className="max-w-4xl mx-auto">
          {currentView === 'input' && (
            <InputScreen onSubmit={() => navigateTo('analysis')} />
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

// Navigation Button Component - MiroFish Style
interface NavButtonProps {
  active: boolean
  onClick: () => void
  label: string
}

function NavButton({ active, onClick, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-mono text-sm transition-all ${
        active 
          ? 'bg-black text-white border-2 border-black' 
          : 'bg-white text-black border-2 border-transparent hover:border-black'
      }`}
    >
      {label}
    </button>
  )
}

export default App
