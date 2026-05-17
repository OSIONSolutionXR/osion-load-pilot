import { useState } from 'react'
import type { ViewState } from './types'
import { Zap, LayoutGrid, Terminal } from 'lucide-react'

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
    <div className="min-h-screen bg-[#0a0a0f] text-white grid-bg">
      {/* Animated Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff3366] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00d4ff] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b-0 rounded-none rounded-b-2xl mx-4 mt-2">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff3366] to-[#ff6b8a] flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Load Pilot</h1>
              <p className="text-xs text-zinc-500 font-mono">PROJECT TWIN SYSTEM</p>
            </div>
          </div>
          
          <nav className="flex items-center gap-1 bg-black/20 rounded-xl p-1">
            <NavButton 
              active={currentView === 'input'} 
              onClick={() => navigateTo('input')}
              icon={<Terminal className="w-4 h-4" />}
              label="Input"
            />
            <NavButton 
              active={currentView === 'today'} 
              onClick={() => navigateTo('today')}
              icon={<LayoutGrid className="w-4 h-4" />}
              label="Today"
            />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-28 pb-12 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
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
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6b8a] text-white shadow-lg' 
          : 'text-zinc-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

export default App
