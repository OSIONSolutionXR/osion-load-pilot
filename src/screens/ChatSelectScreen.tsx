import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FolderKanban,
  BrainCircuit,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

interface ChatSelectScreenProps {
  twins: StoredProjectTwin[]
  onSelectGeneral: () => void
  onSelectProject: (projectId: string) => void
}

// Premium Dark Theme for Chat Area
const chatTheme = {
  pageBg: "#070A12",
  panelBg: "#0B1020",
  cardBg: "#121826",
  cardBgHover: "#172033",
  border: "rgba(148, 163, 184, 0.18)",
  borderStrong: "rgba(148, 163, 184, 0.32)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  accent: "#8B5CF6",
  accent2: "#EC4899",
  accentBlue: "#3B82F6",
  accentGreen: "#10B981",
  accentAmber: "#F59E0B"
}

export default function ChatSelectScreen({ 
  twins, 
  onSelectGeneral, 
  onSelectProject
}: ChatSelectScreenProps) {
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter projects based on search
  const filteredProjects = twins.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate project stats
  const getProjectStats = (twin: StoredProjectTwin) => {
    const measures = twin.measures?.length || 0
    const openMeasures = twin.measures?.filter(m => m.status === 'open').length || 0
    const risks = twin.analysis?.risks?.filter(r => r.severity === 'high').length || 0
    const blockers = twin.progress?.stage === 'blocked' ? 1 : 0
    return { measures, openMeasures, risks, blockers }
  }

  if (showProjectPicker) {
    return (
      <div 
        className="min-h-full p-6 sm:p-8"
        style={{
          background: `radial-gradient(circle at top right, rgba(139, 92, 246, 0.12), transparent 40%),
                      radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.08), transparent 35%),
                      ${chatTheme.pageBg}`,
          color: chatTheme.textPrimary
        }}
      >
        {/* Header */}
        <header className="mb-8">
          <button 
            onClick={() => setShowProjectPicker(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Zurück zur Auswahl</span>
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-slate-50 mb-2">
              Projekt-Chat starten
            </h1>
            <p className="text-slate-400">
              Wähle ein Projekt aus, mit dem OSION arbeiten soll.
            </p>
          </motion.div>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Projekt suchen..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Project List */}
        <div className="grid gap-4 max-w-3xl">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((twin, index) => {
                const stats = getProjectStats(twin)
                const hasIssues = stats.risks > 0 || stats.blockers > 0

                return (
                  <motion.div
                    key={twin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/60 p-5 cursor-pointer transition-all hover:border-violet-500/40 hover:bg-slate-800/80"
                    onClick={() => onSelectProject(twin.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center">
                            <FolderKanban className="w-5 h-5 text-violet-300" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-100 text-lg">{twin.title}</h3>
                            {twin.description && (
                              <p className="text-sm text-slate-400 truncate max-w-md">{twin.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mt-4 ml-13">
                          <div className="flex items-center gap-1.5 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-slate-500" />
                            <span className="text-slate-400">{stats.openMeasures} offen</span>
                            <span className="text-slate-600">/</span>
                            <span className="text-slate-500">{stats.measures} Maßnahmen</span>
                          </div>
                          
                          {hasIssues && (
                            <div className="flex items-center gap-2">
                              {stats.risks > 0 && (
                                <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  {stats.risks} Risiken
                                </span>
                              )}
                              {stats.blockers > 0 && (
                                <span className="flex items-center gap-1 text-xs font-medium text-rose-400 bg-rose-500/10 px-2 py-1 rounded-full">
                                  <AlertCircle className="w-3 h-3" />
                                  Blockiert
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 font-medium text-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-violet-500/20">
                        Chat öffnen
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40"
              >
                <FolderKanban className="w-12 h-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-2">Keine Projekte gefunden</p>
                <p className="text-sm text-slate-500">Erstelle zuerst ein Projekt über "Neuer Input"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Main Selection Screen
  return (
    <div 
      className="min-h-full flex flex-col items-center justify-center p-6 sm:p-8"
      style={{
        background: `radial-gradient(circle at top center, rgba(139, 92, 246, 0.1), transparent 50%),
                    radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.06), transparent 40%),
                    radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.05), transparent 35%),
                    ${chatTheme.pageBg}`,
        color: chatTheme.textPrimary
      }}
    >
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 mb-4 tracking-tight">
          Womit möchtest Du arbeiten?
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Wähle, ob Du mit einem konkreten Projekt arbeitest oder OSION projektübergreifend steuerst.
        </p>
      </motion.header>

      {/* Selection Cards */}
      <div className="grid sm:grid-cols-2 gap-6 w-full max-w-4xl">
        {/* Project Chat Card */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowProjectPicker(true)}
          className="relative group text-left rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 transition-all hover:border-violet-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-violet-500/10"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-6">
              <FolderKanban className="w-8 h-8 text-violet-300" />
            </div>

            <h2 className="text-2xl font-bold text-slate-50 mb-3">
              Projekt-Chat
            </h2>
            
            <p className="text-slate-400 mb-8 leading-relaxed">
              Arbeite mit einem konkreten Project Twin. OSION nutzt den Projektstand, 
              Maßnahmen, Blocker und offene Punkte dieses Projekts.
            </p>

            <div className="flex items-center gap-2 text-violet-300 font-semibold">
              <span>Projekt auswählen</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>

        {/* General Chat Card */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSelectGeneral}
          className="relative group text-left rounded-3xl border border-slate-700/50 bg-slate-900/80 p-8 transition-all hover:border-cyan-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-cyan-500/10"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mb-6">
              <BrainCircuit className="w-8 h-8 text-cyan-300" />
            </div>

            <h2 className="text-2xl font-bold text-slate-50 mb-3">
              Allgemeiner Chat
            </h2>
            
            <p className="text-slate-400 mb-8 leading-relaxed">
              Stelle projektübergreifende Fragen, prüfe Prioritäten und steuere 
              OSION über alle Projekte hinweg.
            </p>

            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <span>Allgemeinen Chat öffnen</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer hint */}
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-sm text-slate-500"
      >
        Beide Modi nutzen die gleiche KI, unterscheiden sich im Projektbezug und Kontext.
      </motion.p>
    </div>
  )
}
