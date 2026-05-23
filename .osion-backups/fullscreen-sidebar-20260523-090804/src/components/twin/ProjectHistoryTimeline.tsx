import { motion } from 'motion/react'
import { History, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../ui/Badge'
import type { ProjectTwinUpdate, ChangedField } from '../../types/projectTwin'

interface ProjectHistoryTimelineProps {
  updates: ProjectTwinUpdate[]
  createdAt: string
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Gerade eben'
  if (diffHours < 24) return `vor ${diffHours} Std.`
  if (diffDays === 1) return 'Gestern'
  return `vor ${diffDays} Tagen`
}

function ChangedFieldsList({ fields }: { fields: ChangedField[] }) {
  const [showDetails, setShowDetails] = useState(false)

  if (fields.length === 0) return null

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
      >
        {showDetails ? (
          <><ChevronUp className="w-3 h-3" /> Details ausblenden</>
        ) : (
          <><ChevronDown className="w-3 h-3" /> {fields.length} Änderung{fields.length > 1 && 'en'} anzeigen</>
        )}
      </button>

      {showDetails && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="mt-2 space-y-2 pl-2 border-l-2 border-white/10">
            {fields.map((field, idx) => (
              <div key={idx} className="text-xs">
                <span className="text-zinc-500">{field.field}:</span>{' '}
                <span className="text-rose-400 line-through">{field.oldValue}</span>{' '}
                <ArrowRight className="w-3 h-3 inline mx-1 text-zinc-600" />{' '}
                <span className="text-emerald-400">{field.newValue}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function ProjectHistoryTimeline({ updates, createdAt }: ProjectHistoryTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (updates.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="panel-card p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-zinc-400" />
          <h3 className="text-lg font-semibold text-white">Projektverlauf</h3>
        </div>
        <div className="text-zinc-500 text-sm italic">
          Noch keine Aktualisierungen. Der Project Twin wurde bei Erstellung abgespeichert.
        </div>

        {/* Erstellungszeitpunkt */}
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
          <Clock className="w-4 h-4" />
          <span>Erstellt am {formatTimestamp(createdAt)}</span>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="panel-card"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <History className="w-5 h-5 text-violet-400" />
          <div>
            <h3 className="text-lg font-semibold text-white">Projektverlauf</h3>
            <p className="text-sm text-zinc-500">{updates.length} Aktualisierung{updates.length > 1 && 'en'}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-zinc-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-zinc-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-white/5">
          <div className="pt-6 space-y-6">
            {/* Zeitleiste */}
            <div className="relative">
              {/* Vertikale Linie */}
              <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-violet-500/50 via-[#ff006e]/30 to-white/10" />

              {/* Einträge in umgekehrter Reihenfolge (neueste zuerst) */}
              {[...updates].reverse().map((update, index) => (
                <motion.div
                  key={update.timestamp}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative pl-12"
                >
                  {/* Punkt auf der Linie */}
                  <div className={`absolute left-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    index === 0 
                      ? 'bg-violet-500/20 border-violet-500' 
                      : 'bg-white/5 border-white/20'
                  }`}>
                    <span className="text-xs font-bold text-zinc-300">
                      {updates.length - index}
                    </span>
                  </div>

                  {/* Inhalt */}
                  <div className="bg-white/[0.03] rounded-xl p-4 border border-white/5">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-violet-400 font-medium">
                          {formatRelativeTime(update.timestamp)}
                        </span>
                        <span className="text-xs text-zinc-600 mx-2">•</span>
                        <span className="text-xs text-zinc-500">
                          {formatTimestamp(update.timestamp)}
                        </span>
                      </div>
                      {index === 0 && (
                        <Badge variant="violet" className="text-xs">Neueste</Badge>
                      )}
                    </div>

                    <p className="text-sm text-zinc-300 leading-relaxed mb-3">
                      {update.summary}
                    </p>

                    {/* Zusätzliche Eingabe (einklappbar) */}
                    <div className="text-xs text-zinc-500 bg-white/[0.02] rounded-lg p-3">
                      <span className="text-zinc-600 uppercase tracking-wider text-[10px]">Ergänzter Kontext:</span>
                      <p className="mt-1 italic">"{update.input}"</p>
                    </div>

                    <ChangedFieldsList fields={update.changedFields} />
                  </div>
                </motion.div>
              ))}

              {/* Erster Eintrag (Erstellung) */}
              <div className="relative pl-12 mt-6">
                <div className="absolute left-0 w-10 h-10 rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-sm text-zinc-500">
                  <span className="text-zinc-400">Project Twin erstellt</span>
                  <span className="mx-2">•</span>
                  {formatTimestamp(createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  )
}
