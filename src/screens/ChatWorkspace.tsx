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
  { id: 'gen-1', text: 'Zeig mir alle aktiven Projekte' },
  { id: 'gen-2', text: 'Welche Projekte brauchen Aufmerksamkeit?' },
  { id: 'gen-3', text: 'Welche Maßnahmen sind heute wichtig?' },
  { id: 'gen-4', text: 'Welche Projekte haben Risiken?' },
  { id: 'gen-5', text: 'Welche offenen Punkte gibt es?' },
  { id: 'gen-6', text: 'Erstelle eine Wochenübersicht' },
]

// Project Chat Suggestions
const projectSuggestions = [
  { id: 'proj-1', text: 'Was ist der nächste sinnvolle Schritt?' },
  { id: 'proj-2', text: 'Welche Maßnahme sollte zuerst erledigt werden?' },
  { id: 'proj-3', text: 'Welche Risiken brauchen Aufmerksamkeit?' },
  { id: 'proj-4', text: 'Welche Blocker verhindern Fortschritt?' },
  { id: 'proj-5', text: 'Projektstatus zusammenfassen' },
  { id: 'proj-6', text: 'Neue Maßnahme vorbereiten' },
]

export default function ChatWorkspace({
  mode,
  projectId,
  twins,
  onBackToSelection,
  onSwitchProject,
  onOpenTwin,
}: ChatWorkspaceProps) {
  const [selectedProjectId] = useState<string | null>(projectId || null)
  
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

  // Handle suggestion click
  const handleSuggestionClick = useCallback((text: string) => {
    console.log('Suggestion clicked:', text)
  }, [])

  // General Chat Header
  const renderGeneralHeader = () => (
    <div className="max-w-[1480px] mx-auto mb-6">
      <div className="flex items-center justify-between">
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
        className="flex items-start gap-5 mt-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <Globe className="w-7 h-7 text-cyan-300" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-50 mb-1">OSION Allgemeiner Chat</h1>
          <p className="text-slate-400 text-lg">Projektübergreifende Steuerung, Übersicht und OSION-Systemfragen</p>
        </div>
      </motion.div>
    </div>
  )

  // Project Chat Header
  const renderProjectHeader = () => {
    if (!activeProject) return null

    return (
      <div className="max-w-[1480px] mx-auto mb-6">
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
        >
          {/* Project Context Card */}
          <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-violet-500/5 to-blue-500/10 p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-7 h-7 text-violet-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-violet-300 mb-1">Du arbeitest im Projekt</p>
                  <h2 className="text-2xl font-bold text-slate-50">{activeProject.title}</h2>
                  {activeProject.description && (
                    <p className="text-sm text-slate-400 mt-1 max-w-xl line-clamp-1">{activeProject.description}</p>
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
                  onClick={onSwitchProject}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 text-sm font-medium hover:bg-violet-500/20 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Projekt wechseln
                </button>
              </div>
            </div>

            {/* Stats Row */}
            {projectStats && (
              <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-violet-500/20">
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

  return (
    <div 
      className="min-h-full py-8 px-6"
      style={{
        background: mode === 'general' 
          ? `radial-gradient(circle at top left, rgba(6, 182, 212, 0.08), transparent 40%),
             radial-gradient(circle at top right, rgba(16, 185, 129, 0.06), transparent 35%),
             #070A12`
          : `radial-gradient(circle at top left, rgba(139, 92, 246, 0.12), transparent 40%),
             radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 35%),
             #070A12`,
        color: '#F8FAFC'
      }}
    >
      {/* Header */}
      {mode === 'general' ? renderGeneralHeader() : renderProjectHeader()}

      {/* Main Content - Centered Workspace Layout */}
      <div className="max-w-[1480px] mx-auto">
        <div className="grid lg:grid-cols-[1fr_380px] gap-7">
          {/* Chat Panel */}
          <div className="min-h-[660px] rounded-3xl border border-slate-700/30 bg-slate-900/60 overflow-hidden flex flex-col">
            <ChatScreen
              twins={twins}
              activeTwinId={mode === 'project' ? selectedProjectId : null}
              onOpenTwin={onOpenTwin}
              mode={mode}
            />
          </div>

          {/* Suggestions Panel */}
          <aside className="hidden lg:block">
            <div className="sticky top-6 rounded-3xl border border-slate-700/30 bg-slate-900/60 p-6 min-h-[420px]">
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  mode === 'general' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-violet-500/10 border border-violet-500/30'
                }`}>
                  <Sparkles className={`w-5 h-5 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100">KI-Vorschläge</h3>
                  <p className="text-xs text-slate-500">
                    {mode === 'general' ? 'Projektübergreifend' : 'Für dieses Projekt'}
                  </p>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="space-y-3">
                {(mode === 'general' ? generalSuggestions : projectSuggestions).map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`w-full text-left p-4 rounded-xl border transition-all group ${
                      mode === 'general'
                        ? 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-cyan-500/30'
                        : 'border-slate-700/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-violet-500/30'
                    }`}
                  >
                    <span className={`text-sm ${
                      mode === 'general' 
                        ? 'text-slate-300 group-hover:text-slate-100' 
                        : 'text-slate-300 group-hover:text-slate-100'
                    }`}>
                      {suggestion.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
