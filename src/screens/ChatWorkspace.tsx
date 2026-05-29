import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Zap,
  RefreshCw,
  LayoutGrid,
  Globe,
  Sparkles,
  ArrowLeft
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

  return (
    <div 
      className="min-h-[calc(100vh-72px)] py-10 px-8"
      style={{ background: '#050914' }}
    >
      {/* Main Chat Stage - Centered */}
      <div 
        className="mx-auto rounded-3xl"
        style={{
          width: 'min(calc(100% - 32px), 1560px)',
          background: 'linear-gradient(135deg, #07101f 0%, #0b1020 52%, #120b24 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          padding: '42px 32px 56px'
        }}
      >
        {/* Inner Workspace - Centered with max-width */}
        <div style={{ width: 'min(100%, 1380px)', margin: '0 auto' }}>
          
          {/* Back Button */}
          <button
            onClick={onBackToSelection}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Zurück zur Auswahl</span>
          </button>

          {/* General Chat Header - OPAQUE, STICKY */}
          {mode === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-6"
              style={{
                position: 'sticky',
                top: '24px',
                zIndex: 10,
                background: '#111827',
                borderRadius: '22px',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                padding: '24px 28px'
              }}
            >
              <div className="flex items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-7 h-7 text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-50 mb-1">OSION Allgemeiner Chat</h1>
                  <p className="text-slate-400 text-lg">Projektübergreifende Steuerung, Übersicht und OSION-Systemfragen</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Project Chat Header - OPAQUE, STICKY */}
          {mode === 'project' && activeProject && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-6"
              style={{
                position: 'sticky',
                top: '24px',
                zIndex: 10,
                background: '#111827',
                borderRadius: '22px',
                border: '1px solid rgba(124, 58, 237, 0.45)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)',
                padding: '24px 28px'
              }}
            >
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
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 border border-slate-600 hover:border-slate-500 text-sm font-medium transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Twin öffnen
                  </button>
                  <button
                    onClick={onSwitchProject}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/40 text-sm font-medium hover:bg-violet-500/30 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Projekt wechseln
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              {projectStats && (
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-slate-100">{projectStats.measures}</span>
                      <span className="text-sm text-slate-400 ml-2">Maßnahmen</span>
                    </div>
                  </div>

                  {projectStats.risks > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
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
                      <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
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
            </motion.div>
          )}

          {/* Chat Workspace Grid - Starts below header */}
          <div 
            className="grid"
            style={{
              gridTemplateColumns: 'minmax(760px, 1fr) 360px',
              gap: '28px',
              alignItems: 'start'
            }}
          >
            {/* Chat Panel */}
            <div 
              className="flex flex-col"
              style={{
                minHeight: '720px',
                borderRadius: '24px',
                background: '#0d1320',
                border: '1px solid rgba(148, 163, 184, 0.20)',
                overflow: 'hidden'
              }}
            >
              <ChatScreen
                twins={twins}
                activeTwinId={mode === 'project' ? selectedProjectId : null}
                onOpenTwin={onOpenTwin}
                mode={mode}
              />
            </div>

            {/* Suggestions Panel - OPAQUE, STICKY */}
            <aside
              className="hidden lg:block"
              style={{
                minHeight: '420px',
                borderRadius: '22px',
                padding: '22px',
                background: '#111827',
                border: '1px solid rgba(148, 163, 184, 0.22)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.30)',
                position: 'sticky',
                top: '24px',
                alignSelf: 'start'
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    mode === 'general' ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-violet-500/20 border border-violet-500/40'
                  }`}
                >
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
              <div className="flex flex-col gap-2.5">
                {(mode === 'general' ? generalSuggestions : projectSuggestions).map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all group ${
                      mode === 'general'
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-cyan-500/40'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-violet-500/40'
                    }`}
                  >
                    <span className="text-sm text-slate-300 group-hover:text-slate-100">
                      {suggestion.text}
                    </span>
                  </motion.button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
