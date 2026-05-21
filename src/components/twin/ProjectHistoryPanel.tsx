import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { History, Clock, ChevronDown, ChevronUp, PlusCircle, Zap, ArrowRight, FileText, TrendingUp } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import {
  buildTwinHistory,
  formatHistoryDate,
  type HistoryEntry
} from '../../lib/projectTwinHistory'

interface ProjectHistoryPanelProps {
  twin: StoredProjectTwin
}

export default function ProjectHistoryPanel({ twin }: ProjectHistoryPanelProps) {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)
  
  const history = useMemo(() => buildTwinHistory(twin), [twin])
  const hasRealUpdates = (twin.updates?.length || 0) > 0
  
  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id)
  }

  const getEntryIcon = (entry: HistoryEntry) => {
    if (entry.type === 'creation') {
      return <Zap className="w-4 h-4" />
    }
    switch (entry.source) {
      case 'context_form':
        return <PlusCircle className="w-4 h-4" />
      case 'manual_update':
        return <FileText className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'creation':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      case 'context_form':
        return 'bg-violet-500/10 text-violet-400 border-violet-500/30'
      case 'manual_update':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="panel-card overflow-hidden"
    >
      {/* Header */}
      <div className="relative p-6 border-b border-white/5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
            <History className="w-5 h-5 text-violet-300" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-100">
              Projektverlauf
            </h3>
            <p className="text-sm text-zinc-500">
              {history.length} {history.length === 1 ? 'Eintrag' : 'Einträge'} · {twin.updates?.length || 0} Updates
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="space-y-4">
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              {/* Timeline connector line */}
              {index < history.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-px bg-white/10" />
              )}
              
              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  {getEntryIcon(entry)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div 
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors cursor-pointer"
                    onClick={() => entry.type !== 'creation' && toggleExpand(entry.id)}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${getSourceColor(entry.source)}`}>
                            {entry.sourceLabel}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatHistoryDate(entry.timestamp)}
                          </span>
                        </div>
                        
                        <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
                          {entry.summary}
                        </p>
                      </div>
                      
                      {entry.type !== 'creation' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 p-1"
                          onClick={() => toggleExpand(entry.id)}
                        >
                          {expandedEntryId === entry.id ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Quick stats row */}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {/* Progress change */}
                      {entry.progressAfter !== undefined && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-400">
                            {entry.progressBefore !== undefined 
                              ? `${entry.progressBefore}% → ${entry.progressAfter}%`
                              : `${entry.progressAfter}%`
                            }
                          </span>
                          {entry.progressBefore !== undefined && entry.progressAfter > entry.progressBefore && (
                            <span className="text-emerald-400">
                              (+{entry.progressAfter - entry.progressBefore}%)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Next Move change indicator */}
                      {entry.nextMoveBefore && entry.nextMoveAfter && entry.nextMoveBefore !== entry.nextMoveAfter && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <Zap className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-400">Nächster Schritt geändert</span>
                        </div>
                      )}

                      {/* Changed fields count */}
                      {entry.changedFields.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <FileText className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-zinc-400">
                            {entry.changedFields.length} {entry.changedFields.length === 1 ? 'Feld' : 'Felder'} geändert
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expanded details */}
                    <AnimatePresence>
                      {expandedEntryId === entry.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white/5 space-y-4"
                        >
                          {/* Input text */}
                          {entry.input && (
                            <div>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Ergänzung</span>
                              <p className="mt-1 text-sm text-zinc-400 italic">
                                „{entry.input}"
                              </p>
                            </div>
                          )}

                          {/* Progress detail */}
                          {entry.progressBefore !== undefined && entry.progressAfter !== undefined && (
                            <div>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Fortschritt</span>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm text-zinc-400">{entry.progressBefore}%</span>
                                <ArrowRight className="w-4 h-4 text-zinc-600" />
                                <span className="text-sm text-zinc-200 font-medium">{entry.progressAfter}%</span>
                                {entry.progressAfter > entry.progressBefore && (
                                  <Badge variant="success" className="text-xs">
                                    +{entry.progressAfter - entry.progressBefore}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Next Move detail */}
                          {entry.nextMoveBefore && entry.nextMoveAfter && (
                            <div>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Nächster Schritt</span>
                              <div className="mt-1 space-y-2">
                                <div className="text-sm">
                                  <span className="text-zinc-500">Vorher:</span>{' '}
                                  <span className="text-zinc-400 line-through">{entry.nextMoveBefore}</span>
                                </div>
                                <div className="text-sm">
                                  <span className="text-zinc-500">Nachher:</span>{' '}
                                  <span className="text-zinc-200">{entry.nextMoveAfter}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Changed fields */}
                          {entry.changedFields.length > 0 && (
                            <div>
                              <span className="text-xs text-zinc-500 uppercase tracking-wider">Geänderte Felder</span>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {entry.changedFields.map((field, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-1 rounded bg-white/5 text-zinc-400 border border-white/5"
                                    title={field.field}
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
            </motion.div>
          ))}
        </div>

        {/* Empty State / Hint */}
        {!hasRealUpdates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center"
          >
            <p className="text-sm text-zinc-500">
              Sobald Du Kontext ergänzt oder Fortschritte einträgst, wächst hier Dein Projektverlauf.
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  )
}
