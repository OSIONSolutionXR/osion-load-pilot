import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import { AppShell } from './components/layout/AppShell'
import { Header } from './components/layout/Header'
import { PageContainer } from './components/layout/PageContainer'
import type { ViewState } from './types'

import TodayScreen from './screens/TodayScreen'
import ProjectTwinScreen from './screens/ProjectTwinScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import InputScreen from './screens/InputScreen'
import {
  createStoredProjectTwin,
  loadStoredProjectTwins,
  saveStoredProjectTwins,
  type StoredProjectTwin
} from './lib/projectTwinStore'

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('today')
  const [twins, setTwins] = useState<StoredProjectTwin[]>([])
  const [activeTwinId, setActiveTwinId] = useState<string | null>(null)
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    const storedTwins = loadStoredProjectTwins()
    setTwins(storedTwins)
    setActiveTwinId(storedTwins[0]?.id ?? null)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    saveStoredProjectTwins(twins)
  }, [hasHydrated, twins])

  const navigateTo = (view: ViewState) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  const activeTwin = twins.find((twin) => twin.id === activeTwinId) ?? twins[0] ?? null

  const handleCreateTwin = (sourceInput: string, analysis: StoredProjectTwin['analysis']) => {
    const twin = createStoredProjectTwin(sourceInput, analysis)
    setTwins((current) => [twin, ...current])
    setActiveTwinId(twin.id)
    navigateTo('twin')
  }

  const handleOpenTwin = (id: string) => {
    setActiveTwinId(id)
    navigateTo('twin')
  }

  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <Header 
          activeTab={currentView} 
          onNavigate={navigateTo} 
        />
        
        <PageContainer>
          {currentView === 'today' && (
            <TodayScreen 
              onOpenTwin={() => navigateTo('twin')}
              onNewInput={() => navigateTo('input')}
              activeTwin={activeTwin}
            />
          )}
          {currentView === 'twin' && (
            <ProjectTwinScreen 
              onBack={() => navigateTo('today')}
              onNewInput={() => navigateTo('input')}
              twin={activeTwin}
            />
          )}
          {currentView === 'projects' && (
            <ProjectsScreen
              twins={twins}
              onOpenTwin={handleOpenTwin}
              onNewProject={() => navigateTo('input')}
            />
          )}
          {currentView === 'input' && (
            <InputScreen 
              onCreateTwin={handleCreateTwin}
              onCancel={() => navigateTo('today')}
            />
          )}
        </PageContainer>
      </AppShell>
    </MotionConfig>
  )
}

export default App
