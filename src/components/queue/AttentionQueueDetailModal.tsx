import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, CheckCircle2, Target, AlertCircle, Flag, FileText } from 'lucide-react'
import type { AttentionQueueItem } from '../../types/projectTwinV2'

interface AttentionQueueDetailModalProps {
  item: AttentionQueueItem | null
  onClose: () => void
  onOpenTwin: () => void
  onStatusChange: (itemId: string, newStatus: 'open' | 'blocked' | 'done') => void
  onNotesChange: (itemId: string, notes: string) => void
}

export default function AttentionQueueDetailModal({
  item,
  onClose,
  onOpenTwin,
  onStatusChange,
  onNotesChange,
}: AttentionQueueDetailModalProps) {
  if (!item) return null

  const getSeverityBadge = (severity: AttentionQueueItem['severity']) => {
    const styles = {
      critical: 'bg-rose-500/15 text-rose-600 border-rose-500/30',
      high: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
      medium: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
      low: 'bg-slate-500/15 text-slate-600 border-slate-500/30',
    }
    return styles[severity] || styles.medium
  }

  const getStatusBadge = (status: AttentionQueueItem['status']) => {
    const styles = {
      open: 'bg-emerald-500/15 text-emerald-600',
      blocked: 'bg-rose-500/15 text-rose-600',
      done: 'bg-emerald-500/15 text-emerald-600',
    }
    return styles[status] || styles.open
  }

  const getCategoryLabel = (category: AttentionQueueItem['category']) => {
    const labels = {
      blocker: 'Blocker',
      risk: 'Risiko',
      action: 'Aktion',
      dependency: 'Abhängigkeit',
    }
    return labels[category] || category
  }

  const handleMarkAsDone = () => {
    onStatusChange(item.id, 'done')
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(item.id, e.target.value)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--lp-panel)] border border-[var(--lp-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header mit Status-Zeile */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {/* Status-Zeile: Severity + Status + Category */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSeverityBadge(item.severity)}`}>
                  {item.severity === 'critical' ? 'Kritisch' :
                   item.severity === 'high' ? 'Hoch' :
                   item.severity === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(item.status)}`}>
                  {item.status === 'open' ? 'Offen' :
                   item.status === 'blocked' ? 'Blockiert' : 'Erledigt'}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-500/10 text-slate-500">
                  {getCategoryLabel(item.category)}
                </span>
              </div>
              
              {/* Titel */}
              <h2 className="text-xl font-semibold text-[var(--lp-text)]">{item.title}</h2>
            </div>
            
            <button onClick={onClose} className="p-2 hover:bg-[var(--lp-surface)] rounded-lg">
              <X className="w-5 h-5 text-[var(--lp-muted)]" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 mb-6">
            {/* Projekt */}
            <div className="flex items-center gap-3 p-3 bg-[var(--lp-surface-soft)] rounded-lg">
              <Target className="w-4 h-4 text-[var(--lp-cobalt)]" />
              <span className="text-sm text-[var(--lp-muted)]">Projekt:</span>
              <span className="text-sm font-medium text-[var(--lp-text)]">{item.projectTitle}</span>
            </div>

            {/* Beschreibung */}
            {item.description && (
              <div className="p-3 bg-[var(--lp-surface-soft)] rounded-lg">
                <p className="text-sm text-[var(--lp-muted)] mb-1">Beschreibung:</p>
                <p className="text-sm text-[var(--lp-text)]">{item.description}</p>
              </div>
            )}

            {/* Warum wichtig */}
            {item.reason && (
              <div className="p-3 bg-[var(--lp-surface-soft)] rounded-lg border-l-2 border-[var(--lp-amber)]">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-[var(--lp-amber)]" />
                  <span className="text-sm font-medium text-[var(--lp-text)]">Warum wichtig:</span>
                </div>
                <p className="text-sm text-[var(--lp-text)]">{item.reason}</p>
              </div>
            )}

            {/* Was blockiert (nur bei blocked) */}
            {item.status === 'blocked' && (
              <div className="p-3 bg-rose-500/10 rounded-lg border-l-2 border-rose-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-medium text-rose-600">Status: Blockiert</span>
                </div>
                <p className="text-sm text-rose-700">
                  Diese Aktion ist aktuell blockiert. Prüfe das Twin für Details.
                </p>
              </div>
            )}

            {/* Nächster Schritt */}
            {item.nextStep && (
              <div className="p-3 bg-[var(--lp-surface-soft)] rounded-lg border-l-2 border-[var(--lp-teal)]">
                <div className="flex items-center gap-2 mb-2">
                  <Flag className="w-4 h-4 text-[var(--lp-teal)]" />
                  <span className="text-sm font-medium text-[var(--lp-text)]">Nächster Schritt:</span>
                </div>
                <p className="text-sm text-[var(--lp-text)]">{item.nextStep}</p>
              </div>
            )}

            {/* Notizen (editierbar) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--lp-muted)]" />
                <span className="text-sm font-medium text-[var(--lp-text)]">Notizen:</span>
              </div>
              <textarea
                value={item.notes || ''}
                onChange={handleNotesChange}
                placeholder="Eigene Notizen zu diesem Item..."
                className="w-full p-3 bg-[var(--lp-surface-soft)] border border-[var(--lp-border)] rounded-lg text-sm text-[var(--lp-text)] placeholder:text-[var(--lp-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--lp-cobalt)] resize-none"
                rows={3}
              />
            </div>

            {/* Metadaten */}
            <div className="flex items-center gap-4 text-xs text-[var(--lp-muted)] pt-2 border-t border-[var(--lp-border)]">
              <span>Erstellt: {new Date(item.createdAt).toLocaleDateString('de-DE')}</span>
              <span>Aktualisiert: {new Date(item.updatedAt).toLocaleDateString('de-DE')}</span>
              {item.completedAt && (
                <span>Erledigt: {new Date(item.completedAt).toLocaleDateString('de-DE')}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {item.status !== 'done' && (
              <button
                onClick={handleMarkAsDone}
                className="lp-button-primary flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Als erledigt markieren
              </button>
            )}
            {item.status === 'done' && (
              <button
                onClick={() => onStatusChange(item.id, 'open')}
                className="lp-button-secondary flex-1"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Wieder öffnen
              </button>
            )}
            <button
              className="lp-button-secondary"
              onClick={onOpenTwin}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Im Twin öffnen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
