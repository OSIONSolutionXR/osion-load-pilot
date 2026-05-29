import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FolderKanban,
  BrainCircuit,
  ArrowRight,
  Search,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ArrowLeft
} from 'lucide-react'
import type { StoredProjectTwin } from '../lib/projectTwinStore'

interface ChatSelectScreenProps {
  twins: StoredProjectTwin[]
  onSelectGeneral: () => void
  onSelectProject: (projectId: string) => void
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
        className="min-h-[calc(100vh-72px)] py-10 px-8"
        style={{ background: '#050914' }}
      >
        {/* Main Stage */}
        <div
          className="mx-auto rounded-3xl"
          style={{
            width: 'min(calc(100% - 32px), 1560px)',
            background: 'linear-gradient(135deg, #07101f 0%, #0b1020 52%, #120b24 100%)',
            border: '1px solid rgba(148, 163, 184, 0.12)',
            padding: '42px 32px 56px'
          }}
        >
          <div style={{ width: 'min(100%, 1180px)', margin: '0 auto' }}>
            {/* Back Button */}
            <button
              onClick={() => setShowProjectPicker(false)}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors mb-8"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Zurück zur Auswahl</span>
            </button>

            {/* Header - Centered */}
            <motion.header
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h1 className="text-4xl font-bold text-slate-50 mb-3">
                Projekt-Chat starten
              </h1>
              <p className="text-lg text-slate-400">
                Wähle den Project Twin, mit dem OSION arbeiten soll.
              </p>
            </motion.header>

            {/* Search */}
            {twins.length > 4 && (
              <div className="mb-8">
                <div className="relative max-w-2xl mx-auto">
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

            {/* Project Grid - 3 Columns */}
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-5">
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
                        className="group relative rounded-[22px] border border-violet-500/20 bg-slate-900/80 p-6 cursor-pointer transition-all hover:border-violet-500/40 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-violet-500/10 flex flex-col justify-between min-h-[190px]"
                        onClick={() => onSelectProject(twin.id)}
                      >
                        {/* Top section */}
                        <div>
                          {/* Icon */}
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-4">
                            <FolderKanban className="w-6 h-6 text-violet-300" />
                          </div>

                          {/* Content */}
                          <h3 className="font-bold text-slate-100 text-lg mb-2">{twin.title}</h3>
                          {twin.description && (
                            <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">{twin.description}</p>
                          )}
                        </div>

                        {/* Bottom section */}
                        <div>
                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {stats.openMeasures}/{stats.measures}
                            </span>
                            
                            {stats.risks > 0 && (
                              <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                                <AlertCircle className="w-3 h-3" />
                                {stats.risks} Risiken
                              </span>
                            )}
                            
                            {stats.openPoints > 0 && (
                              <span className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                                <MessageCircle className="w-3 h-3" />
                                {stats.openPoints} offen
                              </span>
                            )}
                          </div>

                          {/* CTA Button */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {(twin.progress?.stage as string) === 'active' ? 'Aktiv' : (twin.progress?.stage as string) === 'blocked' ? 'Blockiert' : 'In Planung'}
                            </span>
                            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/30 font-medium text-xs group-hover:bg-violet-500/20 group-hover:border-violet-500/50 transition-all">
                              Chat öffnen
                              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full text-center py-16 rounded-3xl border border-dashed border-slate-700 bg-slate-900/40"
                  >
                    <FolderKanban className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 mb-2 text-lg">Keine Projekte gefunden</p>
                    <p className="text-sm text-slate-500">Erstelle zuerst ein Projekt über "Neuer Input"</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Selection Screen
  return (
    <div 
      className="min-h-[calc(100vh-72px)] py-12 px-8 flex items-center justify-center"
      style={{ background: '#050914' }}
    >
      {/* Centered Container */}
      <div style={{ width: 'min(100%, 920px)', margin: '0 auto' }}>
        {/* Header - Centered */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <h1 className="text-5xl sm:text-6xl font-bold text-slate-50 mb-5 tracking-tight">
            Womit möchtest Du arbeiten?
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Wähle, ob Du mit einem konkreten Projekt arbeitest oder OSION projektübergreifend steuerst.
          </p>
        </motion.header>

        {/* Selection Cards - 2 Columns, Centered */}
        <div className="grid md:grid-cols-2 gap-7 w-full">
          {/* Project Chat Card */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowProjectPicker(true)}
            className="relative group text-left rounded-[26px] border border-slate-700/50 bg-slate-900/80 p-8 transition-all hover:border-violet-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-violet-500/10 min-h-[230px] flex flex-col"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-violet-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col h-full">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center mb-5">
                <FolderKanban className="w-8 h-8 text-violet-300" />
              </div>

              <h2 className="text-2xl font-bold text-slate-50 mb-3">
                Projekt-Chat
              </h2>
              
              <p className="text-slate-400 mb-6 leading-relaxed flex-grow">
                Arbeite mit einem konkreten Project Twin. OSION nutzt den aktuellen Projektstand für kontextsensitive Antworten.
              </p>

              {/* CTA Button */}
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-500 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all group-hover:bg-violet-400 group-hover:shadow-violet-400/30 self-start">
                <span>Projekt auswählen</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </motion.button>

          {/* General Chat Card */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            onClick={onSelectGeneral}
            className="relative group text-left rounded-[26px] border border-slate-700/50 bg-slate-900/80 p-8 transition-all hover:border-cyan-500/50 hover:bg-slate-800/90 hover:shadow-2xl hover:shadow-cyan-500/10 min-h-[230px] flex flex-col"
          >
            {/* Glow Effect */}
            <div className="absolute inset-0 rounded-[26px] bg-gradient-to-br from-cyan-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative flex flex-col h-full">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center mb-5">
                <BrainCircuit className="w-8 h-8 text-cyan-300" />
              </div>

              <h2 className="text-2xl font-bold text-slate-50 mb-3">
                Allgemeiner Chat
              </h2>
              
              <p className="text-slate-400 mb-6 leading-relaxed flex-grow">
                Stelle projektübergreifende Fragen, prüfe Prioritäten und steuere OSION auf Systemebene.
              </p>

              {/* CTA Button */}
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all group-hover:bg-cyan-400 group-hover:shadow-cyan-400/30 self-start">
                <span>Allgemeinen Chat öffnen</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
