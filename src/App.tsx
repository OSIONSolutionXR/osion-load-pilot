import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import SidebarNavigation from './components/layout/SidebarNavigation'
import { FloatingActionButton } from './components/ui/FloatingActionButton'
import type { ViewState } from './types'
import type { TwinOpenContext } from './screens/ProjectTwinScreen'

import CommandScreen from './screens/CommandScreen'
import ProjectTwinScreen from './screens/ProjectTwinScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import InputScreen from './screens/InputScreen'
import AddMeasurePanel from './components/twin/AddMeasurePanel'
import {
  createStoredProjectTwin,
  loadStoredProjectTwins,
  saveStoredProjectTwins,
  saveUpdatedProjectTwin,
  type StoredProjectTwin
} from './lib/projectTwinStore'

// View titles for header
const VIEW_TITLES: Record<ViewState, string> = {
  command: 'Command',
  twin: 'Project Twin',
  projects: 'Projekte',
  input: 'Input',
  measures: 'Maßnahmen',
  deadlines: 'Fristen',
  simulation: 'Simulation',
  agents: 'Agenten',
  memory: 'Memory',
  settings: 'Einstellungen'
}

function App() {
  const [currentView, setCurrentView] = useState<ViewState>('command')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('lp-sidebar-collapsed') === 'true'
  })
  const [twins, setTwins] = useState<StoredProjectTwin[]>([])
  const [activeTwinId, setActiveTwinId] = useState<string | null>(null)
  const [twinOpenContext, setTwinOpenContext] = useState<TwinOpenContext | undefined>(undefined)
  const [hasHydrated, setHasHydrated] = useState(false)
  
  // FAB / Add Measure Panel state
  const [isAddMeasureOpen, setIsAddMeasureOpen] = useState(false)

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

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('lp-sidebar-collapsed', String(sidebarCollapsed))
  }, [sidebarCollapsed])

  const navigateTo = (view: ViewState) => {
    setCurrentView(view)
    window.scrollTo(0, 0)
  }

  const activeTwin = twins.find((twin) => twin.id === activeTwinId) ?? twins[0] ?? null

  const handleCreateTwin = (sourceInput: string, analysis: StoredProjectTwin['analysis']) => {
    if (!analysis.quality.isActionable) {
      navigateTo('input')
      return
    }
    const twin = createStoredProjectTwin(sourceInput, analysis)
    setTwins((current) => [twin, ...current])
    setActiveTwinId(twin.id)
    setTwinOpenContext(undefined)
    navigateTo('twin')
  }

  const handleOpenTwin = (id: string, context?: { focus?: 'actions'; highlightMeasureId?: string }) => {
    setActiveTwinId(id)
    // Setze Context für Twin-Öffnung (Command → Twin)
    setTwinOpenContext(context ? {
      focus: context.focus,
      highlightMeasureId: context.highlightMeasureId
    } : undefined)
    navigateTo('twin')
  }

  const handleUpdateTwin = (updatedTwin: StoredProjectTwin) => {
    setTwins((current) => saveUpdatedProjectTwin(current, updatedTwin))
  }

  // Module placeholder for views not yet implemented
  const ModulePlaceholder = ({ title, description }: { title: string; description: string }) => (
    <div className="lp-card lp-card--padded" style={{ maxWidth: '800px' }}>
      <div className="text-label" style={{ color: 'var(--lp-accent)', marginBottom: '12px' }}>Modul</div>
      <h2 className="text-headline" style={{ marginBottom: '16px' }}>{title}</h2>
      <p className="text-body">{description}</p>
    </div>
  )

  return (
    <MotionConfig reducedMotion="user">
      <div className={`lp-app ${sidebarCollapsed ? 'is-sidebar-collapsed' : ''}`}>
        <SidebarNavigation
          activeView={currentView}
          onNavigate={navigateTo}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="lp-main">
          <header className="lp-main-header">
            <div>
              <div className="lp-main-header__eyebrow">OSION Load Pilot</div>
              <h1 className="lp-main-header__title">{VIEW_TITLES[currentView]}</h1>
            </div>

            <div className="lp-main-header__actions">
              {/* Actions based on current view */}
              {currentView === 'command' && (
                <button
                  className="lp-button-primary"
                  onClick={() => navigateTo('input')}
                >
                  + Neuer Input
                </button>
              )}
              {(currentView === 'twin' || currentView === 'projects') && (
                <button
                  className="lp-button-secondary"
                  onClick={() => navigateTo('command')}
                >
                  ← Zurück zu Command
                </button>
              )}
            </div>
          </header>

          <div className="lp-main-content">
            {currentView === 'command' && (
              <CommandScreen
                twins={twins}
                onOpenTwin={handleOpenTwin}
                onNewInput={() => navigateTo('input')}
              />
            )}

            {currentView === 'twin' && (
              <ProjectTwinScreen
                onBack={() => navigateTo('command')}
                onNewInput={() => navigateTo('input')}
                twin={activeTwin}
                onTwinUpdate={handleUpdateTwin}
                openContext={twinOpenContext}
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
                onCancel={() => navigateTo('command')}
              />
            )}

            {currentView === 'measures' && (
              <ModulePlaceholder
                title="Maßnahmen"
                description="Hier werden alle projektübergreifenden Maßnahmen und ihre Fortschritte angezeigt. Integration mit Command und Project Twin folgt."
              />
            )}

            {currentView === 'deadlines' && (
              <ModulePlaceholder
                title="Fristen"
                description="Übersicht aller anstehenden Fristen und Deadlines aus allen Projekten. Integration mit Maßnahmen-System folgt."
              />
            )}

            {currentView === 'simulation' && (
              <ModulePlaceholder
                title="Project Simulator"
                description="Simuliere Dein Projekt mit 100+ synthetischen Agenten. Teste Marktreaktionen, Zielgruppenfeedback und Erfolgswahrscheinlichkeit vor der Umsetzung."
              />
            )}

            {currentView === 'agents' && (
              <ModulePlaceholder
                title="Agenten"
                description="Übersicht aller verfügbaren Agenten für Ausführungsaufträge. Research Agent, Document Agent, E-Mail Agent und weitere folgen."
              />
            )}

            {currentView === 'memory' && (
              <ModulePlaceholder
                title="Memory"
                description="System-Memory und gelernte Muster. Projektverläufe, Entscheidungen und Erkenntnisse werden hier archiviert."
              />
            )}

            {currentView === 'settings' && (
              <ModulePlaceholder
                title="Einstellungen"
                description="Systemeinstellungen, Benutzerprofil, Integrationen und Export-Optionen."
              />
            )}
          </div>
          
          {/* Floating Action Button for mobile - only show on twin/projects/measure views */}
          {(currentView === 'twin' || currentView === 'projects' || currentView === 'measures') && (
            <FloatingActionButton 
              onClick={() => setIsAddMeasureOpen(true)}
              label="Neue Maßnahme"
            />
          )}
          
          {/* Add Measure Panel */}
          <AddMeasurePanel
            isOpen={isAddMeasureOpen}
            onClose={() => setIsAddMeasureOpen(false)}
            projects={twins}
            defaultProjectId={activeTwin?.id}
            onMeasureCreated={(measure) => {
              // Handle measure creation - could navigate to measures view
              console.log('Measure created:', measure)
            }}
            onTwinUpdate={handleUpdateTwin}
          />
        </main>
      </div>
    </MotionConfig>
  )
}

export default App
