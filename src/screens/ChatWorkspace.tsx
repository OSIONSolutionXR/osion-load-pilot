import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  LayoutGrid,
  ChevronLeft,
  Globe,
  Sparkles
} from 'lucide-react'
import ChatScreen from './ChatScreen'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

export type ChatMode = 'general' | 'project'

interface ChatWorkspaceProps {
  mode: ChatMode
  projectId?: string | null
  twins: StoredProjectTwin[]
  onBackToSelection: () => void
  onSwitchProject: () => void
  onOpenTwin: (id: string) => void
  onCreateTwin?: (input: string, title?: string) => Promise<StoredProjectTwin | null>
  onAddMeasure?: (twinId: string, measure: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low'
  }) => Promise<boolean>
  onUpdateMeasure?: (twinId: string, measureId: string, updates: { status?: string }) => Promise<boolean>
  onUpdateTwin?: (twinId: string, updates: { latestInput?: string; memory?: string[] }) => Promise<boolean>
}

// General Chat Suggestions
const generalSuggestions = [
  { id: 'gen-1', text: 'Zeig mir alle aktiven Projekte', icon: 'list' },
  { id: 'gen-2', text: 'Welche Projekte brauchen Aufmerksamkeit?', icon: 'alert' },
  { id: 'gen-3', text: 'Welche Maßnahmen sind heute wichtig?', icon: 'check' },
  { id: 'gen-4', text: 'Welche Projekte haben Risiken?', icon: 'warning' },
  { id: 'gen-5', text: 'Welche offenen Punkte gibt es?', icon: 'message' },
  { id: 'gen-6', text: 'Erstelle eine Wochenübersicht', icon: 'calendar' },
]

// Project Chat Suggestions
const projectSuggestions = [
  { id: 'proj-1', text: 'Was ist der nächste sinnvolle Schritt?', icon: 'arrow' },
  { id: 'proj-2', text: 'Welche Maßnahme sollte zuerst erledigt werden?', icon: 'check' },
  { id: 'proj-3', text: 'Welche Risiken brauchen Aufmerksamkeit?', icon: 'warning' },
  { id: 'proj-4', text: 'Welche Blocker verhindern Fortschritt?', icon: 'block' },
  { id: 'proj-5', text: 'Projektstatus zusammenfassen', icon: 'summary' },
  { id: 'proj-6', text: 'Neue Maßnahme vorbereiten', icon: 'plus' },
]

// Premium Dark Theme
const chatTheme = {
  pageBg: "#070A12",
  panelBg: "#0B1020",
  border: "rgba(148, 163, 184, 0.18)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#8B5CF6",
  accentCyan: "#06B6D4",
  accentAmber: "#F59E0B"
}

export default function ChatWorkspace({
  mode,
  projectId,
  twins,
  onBackToSelection,
  onSwitchProject,
  onOpenTwin,
  onCreateTwin,
  onAddMeasure,
  onUpdateMeasure,
  onUpdateTwin
}: ChatWorkspaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId || null)
  
  // Get project info for project mode
  const activeProject = mode === 'project' && selectedProjectId
    ? twins.find(t => t.id === selectedProjectId)
    : null
  
  const projectStats = activeProject ? {
    measures: activeProject.measures?.length || 0,
    openMeasures: activeProject.measures?.filter(m => m.status === 'open').length || 0,
    risks: activeProject.analysis?.risks?.filter(r => r.severity === 'high').length || 0,
    openPoints: activeProject.contextQuestions?.length || 0
  } : null

  // Handle project switch
  const handleSwitchProject = useCallback(() => {
    setSelectedProjectId(null)
    onSwitchProject()
  }, [onSwitchProject])

  // Handle suggestion click - would set input text in real implementation
  const handleSuggestionClick = useCallback((text: string) => {
    // This would set the input text in ChatScreen
    // For now, we'll pass this through context or prop drilling if needed
    console.log('Suggestion clicked:', text)
  }, [])

  // General Chat Header
  const renderGeneralHeader = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToSelection}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Zurück zur Auswahl</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <Globe className="w-8 h-8 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-2">OSION Allgemeiner Chat</h1>
          <p className="text-slate-400 text-lg">Projektübergreifende Steuerung, Übersicht und OSION-Systemfragen</p>
        </div>
      </motion.div>
    </div>
  )

  // Project Chat Header with fixed context card
  const renderProjectHeader = () => {
    if (!activeProject) return null

    return (
      <div className="mb-8">
        {/* Top bar with back button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToSelection}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Zurück zur Auswahl</span>
          </button>
        </div>

        {/* Project Context Card - FIXED and VISIBLE */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Mode Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-medium border border-violet-500/30">
              OSION Projekt-Chat
            </span>
          </div>

          {/* Main Project Card */}
          <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-blue-500/10 p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                  <FolderKanban className="w-8 h-8 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-300 mb-1">
                    Du arbeitest im Projekt
                  </p>
                  <h2 className="text-2xl font-bold text-slate-50">{activeProject.title}</h2>
                  {activeProject.description && (
                    <p className="text-sm text-slate-400 mt-1 max-w-xl">
                      {activeProject.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenTwin(activeProject.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-600 text-sm font-medium transition-colors"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Twin öffnen
                </button>
                <button
                  onClick={handleSwitchProject}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/20 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Projekt wechseln
                </button>
              </div>
            </div>

            {/* Stats Row */}
            {projectStats && (
              <div className="flex items-center gap-8 mt-6 pt-6 border-t border-violet-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/60 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-slate-100">{projectStats.measures}</span>
                    <span className="text-sm text-slate-400 ml-2">Maßnahmen</span>
                  </div>
                </div>

                {projectStats.risks > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-amber-400">{projectStats.risks}</span>
                      <span className="text-sm text-slate-400 ml-2">Risiken</span>
                    </div>
                  </div>
                )}

                {projectStats.openPoints > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-violet-400">{projectStats.openPoints}</span>
                      <span className="text-sm text-slate-400 ml-2">offene Punkte</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // Suggestions Sidebar for General Chat
  const renderGeneralSidebar = () => (
    <div className="space-y-3">
      {generalSuggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleSuggestionClick(suggestion.text)}
          className="w-full text-left p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50 hover:border-cyan-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-slate-100">
              {suggestion.text}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  )

  // Suggestions Sidebar for Project Chat
  const renderProjectSidebar = () => (
    <div className="space-y-3">
      {projectSuggestions.map((suggestion, index) => (
        <motion.button
          key={suggestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleSuggestionClick(suggestion.text)}
          className="w-full text-left p-4 rounded-xl border border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50 hover:border-violet-500/30 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm text-slate-300 group-hover:text-slate-100">
              {suggestion.text}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  )

  return (
    <div 
      className="min-h-full p-6 sm:p-8 lg:p-10"
      style={{
        background: mode === 'general' 
          ? `radial-gradient(circle at top left, rgba(6, 182, 212, 0.08), transparent 40%),
             radial-gradient(circle at top right, rgba(16, 185, 129, 0.06), transparent 35%),
             ${chatTheme.pageBg}`
          : `radial-gradient(circle at top left, rgba(139, 92, 246, 0.12), transparent 40%),
             radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 35%),
             ${chatTheme.pageBg}`,
        color: chatTheme.textPrimary
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header based on mode */}
        {mode === 'general' ? renderGeneralHeader() : renderProjectHeader()}

        {/* Main Content Grid */}
        <div className="grid xl:grid-cols-[1fr_380px] gap-6">
          {/* Chat Area - Takes full width in general mode, or shares with sidebar */}
          <div className="h-[calc(100vh-280px)] min-h-[500px]">
            <ChatScreen
              twins={twins}
              activeTwinId={mode === 'project' ? selectedProjectId : null}
              onOpenTwin={onOpenTwin}
              onCreateTwin={onCreateTwin}
              onAddMeasure={onAddMeasure}
              onUpdateMeasure={onUpdateMeasure}
              onUpdateTwin={onUpdateTwin}
              mode={mode}
            />
          </div>

          {/* Suggestions Sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-6">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mode === 'general' ? 'bg-cyan-500/10' : 'bg-violet-500/10'
                }`}>
                  <Sparkles className={`w-5 h-5 ${
                    mode === 'general' ? 'text-cyan-400' : 'text-violet-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">KI-Vorschläge</h3>
                  <p className="text-xs text-slate-500">
                    {mode === 'general' ? 'Projektübergreifend' : 'Für dieses Projekt'}
                  </p>
                </div>
              </div>

              {mode === 'general' ? renderGeneralSidebar() : renderProjectSidebar()}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
