import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FolderKanban,
  BrainCircuit,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  MessageCircle
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
    const openPoints = twin.contextQuestions?.length || 0
    return { measures, openMeasures, risks, openPoints }
  }

  if (showProjectPicker) {
    return (
      <div 
        className="min-h-full p-8 sm:p-12"
        style={{
          background: `radial-gradient(circle at top right, rgba(139, 92, 246, 0.12), transparent 40%),
                      radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.08), transparent 35%),
                      ${chatTheme.pageBg}`,
          color: chatTheme.textPrimary
        }}
      >
        {/* Header */}
        <header className="mb-10 max-w-6xl mx-auto">
          <button 
            onClick={() => setShowProjectPicker(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Zurück zur Auswahl</span>
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-slate-50 mb-3">
              Projekt-Chat starten
            </h1>
            <p className="text-lg text-slate-400">
              Wähle den Project Twin, mit dem OSION arbeiten soll.
            </p>
          </motion.div>
        </header>

        {/* Search - only if many projects */}
        {twins.length > 4 && (
          <div className="mb-8 max-w-6xl mx-auto">
            <div className="relative max-w-2xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Projekt suchen..."
                className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none transition-colors text-base"
              />
            </div>
          </div>
        )}

        {/* Project Grid - 2 Columns */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((twin, index) => {
                const stats = getProjectStats(twin)

                return (
                  <motion.div
                    key={twin.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative rounded-3xl border border-slate-700/50 bg-slate-900/60 p-8 cursor-pointer transition-all hover:border-violet-500/40 hover:bg-slate-800/80 hover:shadow-2xl hover:shadow-violet-500/10"
                    onClick={() => onSelectProject(twin.id)}
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-5">
                      <FolderKanban className="w-7 h-7 text-violet-300" />
                    </div>

                    {/* Content */}
                    <h3 className="font-bold text-slate-100 text-xl mb-2">{twin.title}</h3>
                    {twin.description && (
                      <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">{twin.description}</p>
                    )}

                    {/* Stats Row */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                      <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {stats.openMeasures}/{stats.measures} Maßnahmen
                      </span>
                      
                      {stats.risks > 0 && (
                        <span className="flex items-center gap-1.5 text-sm text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {stats.risks} Risiken
                        </span>
                      )}
                      
                      {stats.openPoints > 0 && (
                        <span className="flex items-center gap-1.5 text-sm text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-full border border-violet-500/20">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {stats.openPoints} offen
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {(twin.progress?.stage as string) === 'active' ? 'Aktiv' : (twin.progress?.stage as string) === 'blocked' ? 'Blockiert' : 'In Planung'}
                      </span>
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 font-medium text-sm group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-all">
                        Chat öffnen
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-2 text-center py-16 rounded-3xl border border-dashed border-slate-700 bg-slate-900/40"
              >
                <FolderKanban className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400 mb-2 text-lg">Keine Projekte gefunden</p>
                <p className="text-sm text-slate-500">Erstelle zuerst ein Projekt über "Neuer Input"</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Main Selection Screen - PREMIUM VERSION
  return (
    <div 
      className="min-h-full flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16"
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
        className="text-center mb-16"
      >
        <h1 className="text-5xl sm:text-6xl font-bold text-slate-50 mb-5 tracking-tight">
          Womit möchtest Du arbeiten?
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Wähle, ob Du mit einem konkreten Projekt arbeitest oder OSION projektübergreifend steuerst.
        </p>
      </motion.header>

      {/* Selection Cards - PREMIUM LARGER CARDS */}
      <div className="grid lg:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Project Chat Card */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01, y: -6 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowProjectPicker(true)}
          className="relative group text-left rounded-[2rem] border border-slate-700/50 bg-slate-900/80 p-10 transition-all hover:border-violet-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-violet-500/10"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative">
            {/* Icon - Top Left with spacing */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-8">
              <FolderKanban className="w-10 h-10 text-violet-300" />
            </div>

            <h2 className="text-3xl font-bold text-slate-50 mb-4">
              Projekt-Chat
            </h2>
            
            <p className="text-slate-400 mb-10 leading-relaxed text-lg">
              Arbeite mit einem konkreten Project Twin. OSION nutzt den aktuellen Projektstand, 
              Maßnahmen, Blocker und offene Punkte für kontextsensitive Antworten.
            </p>

            {/* CTA Button - Premium styled */}
            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all group-hover:bg-violet-400 group-hover:shadow-violet-400/30">
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
          whileHover={{ scale: 1.01, y: -6 }}
          whileTap={{ scale: 0.99 }}
          onClick={onSelectGeneral}
          className="relative group text-left rounded-[2rem] border border-slate-700/50 bg-slate-900/80 p-10 transition-all hover:border-cyan-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-cyan-500/10"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative">
            {/* Icon - Top Left with spacing */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mb-8">
              <BrainCircuit className="w-10 h-10 text-cyan-300" />
            </div>

            <h2 className="text-3xl font-bold text-slate-50 mb-4">
              Allgemeiner Chat
            </h2>
            
            <p className="text-slate-400 mb-10 leading-relaxed text-lg">
              Stelle projektübergreifende Fragen, prüfe Prioritäten über alle Projekte hinweg 
              und steuere OSION auf Systemebene.
            </p>

            {/* CTA Button - Premium styled */}
            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-xl bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all group-hover:bg-cyan-400 group-hover:shadow-cyan-400/30">
              <span>Allgemeinen Chat öffnen</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer - Removed explanatory text as requested */}
    </div>
  )
}
