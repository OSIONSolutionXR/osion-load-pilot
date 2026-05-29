import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Zap,
  BrainCircuit,
  RefreshCw,
  LayoutGrid
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
  
  // Get project info
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

  // Header Component
  const renderHeader = () => {
    if (mode === 'general') {
      return (
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-50">OSION Allgemeiner Chat</h1>
                <p className="text-sm text-slate-400">Projektübergreifende Steuerung, Übersicht und OSION-Systemfragen</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={onBackToSelection}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Zurück</span>
          </button>
        </div>
      )
    }

    // Project Chat Header
    if (!activeProject) return null

    return (
      <div className="mb-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToSelection}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Zurück</span>
          </button>
          
          <button
            onClick={handleSwitchProject}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-300 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Projekt wechseln
          </button>
        </div>

        {/* Project Context Card */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-blue-500/10 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-violet-300" />
              </div>
              <div>
                <p className="text-xs font-medium text-violet-300 uppercase tracking-wider mb-1">
                  Du arbeitest gerade im Projekt
                </p>
                <h2 className="text-xl font-bold text-slate-50">{activeProject.title}</h2>
                {activeProject.description && (
                  <p className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-1">
                    {activeProject.description}
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onOpenTwin(activeProject.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-600 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <LayoutGrid className="w-4 h-4" />
              Twin öffnen
            </button>
          </div>

          {/* Stats Row */}
          {projectStats && (
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-violet-500/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">{projectStats.openMeasures}</span>
                  <span className="text-slate-500">/</span>
                  <span>{projectStats.measures}</span>
                  <span className="ml-1 text-slate-400">Maßnahmen</span>
                </span>
              </div>
              
              {projectStats.risks > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-300">
                    <span className="font-semibold">{projectStats.risks}</span>
                    <span className="ml-1">Risiken</span>
                  </span>
                </div>
              )}
              
              {projectStats.openPoints > 0 && (
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-400" />
                  <span className="text-sm text-violet-300">
                    <span className="font-semibold">{projectStats.openPoints}</span>
                    <span className="ml-1">offene Punkte</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-full p-4 sm:p-6"
      style={{
        background: `radial-gradient(circle at top left, rgba(139, 92, 246, 0.08), transparent 40%),
                    radial-gradient(circle at top right, rgba(59, 130, 246, 0.06), transparent 35%),
                    ${chatTheme.pageBg}`,
        color: chatTheme.textPrimary
      }}
    >
      {renderHeader()}

      {/* Pass through to original ChatScreen with modified suggestions based on mode */}
      <div className="h-[calc(100%-120px)]">
        <ChatScreen
          twins={twins}
          activeTwinId={mode === 'project' ? selectedProjectId : null}
          onOpenTwin={onOpenTwin}
          onCreateTwin={onCreateTwin}
          onAddMeasure={onAddMeasure}
          onUpdateMeasure={onUpdateMeasure}
          onUpdateTwin={onUpdateTwin}
        />
      </div>
    </div>
  )
}
