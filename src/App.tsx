import { useEffect, useState } from 'react'
import { MotionConfig } from 'motion/react'
import SidebarNavigation from './components/layout/SidebarNavigation'
import { FloatingActionButton } from './components/ui/FloatingActionButton'
import type { Measure } from './types/measures'
import type { ViewState } from './types'
import type { TwinOpenContext } from './screens/ProjectTwinScreen'

import CommandScreen from './screens/CommandScreen'
import ProjectTwinScreen from './screens/ProjectTwinScreen'
import ProjectsScreen from './screens/ProjectsScreen'
import InputScreen from './screens/InputScreen'
import ChatScreen from './screens/ChatScreen'
import AddMeasurePanel from './components/twin/AddMeasurePanel'
import {
  createStoredProjectTwin,
  loadStoredProjectTwins,
  saveStoredProjectTwins,
  saveUpdatedProjectTwin,
  addMeasureToTwin,
  updateTwinMeasure,
  type StoredProjectTwin
} from './lib/projectTwinStore'

// View titles for header
const VIEW_TITLES: Record<ViewState, string> = {
  command: 'Command',
  chat: 'OSION KI-Chat',
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

  const handleCreateTwinFromChat = async (input: string, title?: string): Promise<StoredProjectTwin | null> => {
    // Create minimal project directly from chat, without full analysis
    const timestamp = new Date().toISOString()
    const projectTitle = title || input.slice(0, 50)
    
    const newTwin: StoredProjectTwin = {
      id: `twin-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: 2,
      title: projectTitle,
      description: input,
      createdAt: timestamp,
      updatedAt: timestamp,
      originalInput: input,
      latestInput: input,
      analysis: {
        project: {
          title: projectTitle,
          description: input,
          type: 'project',
          status: 'active'
        },
        nextMove: {
          title: 'Erste Details erfassen',
          reason: 'Projekt aus Chat erstellt – nächste Schritte definieren',
          effort: 'low',
          impact: 'high',
          deadline: null
        },
        actors: [],
        dependencies: [],
        risks: [],
        scenarios: [],
        actions: [],
        quality: {
          inputQuality: 'usable',
          confidence: 'medium',
          isActionable: true,
          missingContext: [],
          reason: 'Aus Chat-Analyse übernommen'
        },
        meta: {
          domain: 'general',
          analysisMode: 'openclaw-kimi',
          promptVersion: 'loadpilot_v2',
          generatedAt: timestamp
        }
      },
      processSteps: [],
      contextQuestions: [],
      updates: [],
      progress: {
        percent: 10,
        level: 1,
        stage: 'created',
        completedActions: [],
        openActions: [],
        lastProgressReason: 'Aus Chat erstellt',
        updatedAt: timestamp
      },
      generatedSolutions: [],
      chatHistory: [],
      attentionQueue: [],
      measures: [],
      activityLog: [{
        id: `log-${timestamp}`,
        timestamp,
        type: 'project_created',
        actor: 'user',
        description: `Projekt "${projectTitle}" aus Chat erstellt`
      }],
      meta: {
        source: 'manual',
        localOnly: true
      }
    }
    
    setTwins((current) => [newTwin, ...current])
    setActiveTwinId(newTwin.id)
    navigateTo('twin')
    return newTwin
  }

  const handleAddMeasureFromChat = async (twinId: string, measure: { title: string; description?: string; dueDate?: string }): Promise<boolean> => {
    const twin = twins.find(t => t.id === twinId)
    if (!twin) return false

    const newMeasure = {
      id: `measure-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      projectId: twinId,
      projectTitle: twin.title,
      parentId: null,
      title: measure.title,
      description: measure.description || '',
      status: 'open' as const,
      priority: 'medium' as const,
      dueDate: measure.dueDate || null,
      createdAt: new Date().toISOString(),
      source: 'manual' as const
    }

    const updatedTwin = addMeasureToTwin(twin, newMeasure)
    setTwins(current => saveUpdatedProjectTwin(current, updatedTwin))
    return true
  }

  const handleUpdateMeasureFromChat = async (twinId: string, measureId: string, updates: { status?: string }): Promise<boolean> => {
    const twin = twins.find(t => t.id === twinId)
    if (!twin) return false

    const updatedTwin = updateTwinMeasure(twin, measureId, updates as Partial<Measure>)
    setTwins(current => saveUpdatedProjectTwin(current, updatedTwin))
    return true
  }

  const handleUpdateTwinFromChat = async (twinId: string, updates: { latestInput?: string; memory?: string[] }): Promise<boolean> => {
    const twin = twins.find(t => t.id === twinId)
    if (!twin) return false

    const updatedTwin = {
      ...twin,
      latestInput: updates.latestInput || twin.latestInput,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      memory: [...((twin as any).memory || []), ...(updates.memory || [])],
      updatedAt: new Date().toISOString()
    }

    handleUpdateTwin(updatedTwin)
    return true
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

            {currentView === 'chat' && (
              <ChatScreen
                twins={twins}
                activeTwinId={activeTwinId}
                onOpenTwin={handleOpenTwin}
                onCreateTwin={handleCreateTwinFromChat}
                onAddMeasure={handleAddMeasureFromChat}
                onUpdateMeasure={handleUpdateMeasureFromChat}
                onUpdateTwin={handleUpdateTwinFromChat}
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
          />
        </main>
      </div>
    </MotionConfig>
  )
}

export default App
