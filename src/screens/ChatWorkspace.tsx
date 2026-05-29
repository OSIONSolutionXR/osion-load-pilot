import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  FolderKanban,
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

  // Handle suggestion click
  const handleSuggestionClick = useCallback((text: string) => {
    console.log('Suggestion clicked:', text)
  }, [])

  return (
    <div 
      className="h-[calc(100vh-72px)] overflow-hidden"
      style={{ background: '#050914' }}
    >
      {/* Main Chat Stage - Fixed height, no scroll */}
      <div 
        className="h-full mx-auto flex flex-col"
        style={{
          width: 'min(calc(100% - 32px), 1560px)',
          background: 'linear-gradient(135deg, #07101f 0%, #0b1020 52%, #120b24 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: '0 0 24px 24px',
          overflow: 'hidden'
        }}
      >
        {/* Inner Workspace - Centered with max-width */}
        <div 
          className="flex-1 flex flex-col h-full"
          style={{ 
            width: 'min(100%, 1400px)', 
            margin: '0 auto',
            padding: '24px 28px'
          }}
        >
          
          {/* Header - Compact, OPAQUE */}
          {mode === 'general' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-shrink-0"
              style={{
                background: '#111827',
                borderRadius: '16px',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                padding: '16px 20px',
                marginBottom: '16px'
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-slate-50">OSION Allgemeiner Chat</h1>
                    <p className="text-sm text-slate-400">Projektübergreifende Steuerung</p>
                  </div>
                </div>
                <button
                  onClick={onBackToSelection}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:border-slate-500 text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Zurück
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'project' && activeProject && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex-shrink-0"
              style={{
                background: '#111827',
                borderRadius: '16px',
                border: '1px solid rgba(124, 58, 237, 0.45)',
                padding: '16px 20px',
                marginBottom: '16px'
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-5 h-5 text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-violet-300 mb-0.5">Du arbeitest im Projekt</p>
                    <h2 className="text-lg font-bold text-slate-50 truncate">{activeProject.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={onBackToSelection}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200 text-sm transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Zurück</span>
                  </button>
                  <button
                    onClick={() => onOpenTwin(activeProject.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-600 hover:border-slate-500 text-sm font-medium transition-colors"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Twin</span>
                  </button>
                  <button
                    onClick={onSwitchProject}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 text-sm font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="hidden sm:inline">Wechseln</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat Workspace Grid - Flexible height, fills remaining space */}
          <div 
            className="flex-1 flex gap-5 min-h-0"
          >
            {/* Chat Panel - Internal scrolling for messages only */}
            <div 
              className="flex-1 flex flex-col min-h-0"
              style={{
                borderRadius: '16px',
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

            {/* Suggestions Panel - Fixed, no scroll */}
            <aside
              className="hidden lg:flex flex-col flex-shrink-0"
              style={{
                width: '320px',
                borderRadius: '16px',
                padding: '20px',
                background: '#111827',
                border: '1px solid rgba(148, 163, 184, 0.22)'
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-5 flex-shrink-0">
                <div 
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    mode === 'general' ? 'bg-cyan-500/20 border border-cyan-500/40' : 'bg-violet-500/20 border border-violet-500/40'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${mode === 'general' ? 'text-cyan-400' : 'text-violet-400'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-100 text-sm">KI-Vorschläge</h3>
                  <p className="text-xs text-slate-500">
                    {mode === 'general' ? 'Projektübergreifend' : 'Für dieses Projekt'}
                  </p>
                </div>
              </div>

              {/* Suggestions List */}
              <div className="flex flex-col gap-2 overflow-y-auto">
                {(mode === 'general' ? generalSuggestions : projectSuggestions).map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={`w-full text-left p-3 rounded-lg border transition-all group text-sm ${
                      mode === 'general'
                        ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-slate-100'
                        : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-violet-500/40 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    {suggestion.text}
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
