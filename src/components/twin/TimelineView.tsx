import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { History, ChevronRight, ChevronLeft, GitCommit, GitBranch, PlusCircle, FileText, Zap } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import {
  buildTwinHistory,
  formatHistoryDate,
  type HistoryEntry
} from '../../lib/projectTwinHistory'
import { FadeIn, StaggerContainer, StaggerItem } from '../animations/MicroAnimations'

interface TimelineViewProps {
  twin: StoredProjectTwin
}

export default function TimelineView({ twin }: TimelineViewProps) {
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null)
  const history = buildTwinHistory(twin)
  
  const getEntryIcon = (entry: HistoryEntry) => {
    switch (entry.source) {
      case 'creation': return Zap
      case 'context_form': return PlusCircle
      case 'manual_update': return FileText
      default: return GitCommit
    }
  }
  
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'creation': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'context_form': return 'bg-violet-500/20 text-violet-400 border-violet-500/30'
      case 'manual_update': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }
  
  return (
    <div className="relative">
      {/* Timeline Header */}
      <FadeIn>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-zinc-100">Projektverlauf</h3>
              <p className="text-sm text-zinc-500">{history.length} Einträge</p>
            </div>
          </div>
          
          {history.length > 5 && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-zinc-500">1 / {Math.ceil(history.length / 5)}</span>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </FadeIn>
      
      {/* Timeline Content */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-violet-500/30 via-violet-500/20 to-transparent" />
        
        <StaggerContainer className="space-y-6" staggerDelay={0.1}>
          {history.slice(0, 5).map((entry, index) => {
            const Icon = getEntryIcon(entry)
            return (
              <StaggerItem key={entry.id}>
                <motion.button
                  onClick={() => setSelectedEntry(entry.id === selectedEntry?.id ? null : entry)}
                  className="w-full text-left group"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex gap-4">
                    {/* Timeline Node */}
                    <div className="relative flex-shrink-0">
                      <motion.div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${getSourceColor(entry.source)}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="w-4 h-4" />
                      </motion.div>
                      
                      {/* Connection to next */}
                      {index < Math.min(history.length, 5) - 1 && (
                        <motion.div
                          className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-violet-500/30 to-transparent"
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                        />
                      )}
                    </div>
                    
                    {/* Content Card */}
                    <div className="flex-1 pb-6">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 group-hover:bg-white/[0.04] transition-all">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getSourceColor(entry.source)}`}>
                              {entry.sourceLabel}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {formatHistoryDate(entry.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Summary */}
                        <p className="text-sm text-zinc-300 leading-relaxed">
                          {entry.summary}
                        </p>
                        
                        {/* Quick Stats */}
                        <div className="mt-3 flex flex-wrap gap-3">
                          {entry.progressAfter !== undefined && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-emerald-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${entry.progressAfter}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 }}
                                />
                              </div>
                              <span className="text-xs text-emerald-400">{entry.progressAfter}%</span>
                            </div>
                          )}
                          
                          {entry.changedFields.length > 0 && (
                            <Badge variant="neutral" className="text-xs">
                              {entry.changedFields.length} Felder geändert
                            </Badge>
                          )}
                        </div>
                        
                        {/* Expanded Details */}
                        <AnimatePresence>
                          {selectedEntry?.id === entry.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4 pt-4 border-t border-white/5"
                            >
                              {entry.input && (
                                <div className="mb-3">
                                  <span className="text-xs text-zinc-500 uppercase">Ergänzung</span>
                                  <p className="mt-1 text-sm text-zinc-400 italic">„{entry.input}"</p>
                                </div>
                              )}
                              
                              {entry.changedFields.length > 0 && (
                                <div>
                                  <span className="text-xs text-zinc-500 uppercase">Geändert</span>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {entry.changedFields.map((field, i) => (
                                      <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/5"
                                      >
                                        {field.label}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.button>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
        
        {/* Empty State */}
        {history.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <GitBranch className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-500">
              Noch keine Einträge. Der Verlauf beginnt mit Deinem ersten Update.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
