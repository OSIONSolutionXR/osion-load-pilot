import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, User, AlertTriangle, ArrowRight, CheckCircle2, Play, MessageSquare } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ProjectAction } from '../../types/projectTwin'

interface ActionDetailViewProps {
  action: ProjectAction | null
  isOpen: boolean
  onClose: () => void
  onStart?: () => void
  onShowAlternatives?: () => void
}

export default function ActionDetailView({
  action,
  isOpen,
  onClose,
  onStart,
  onShowAlternatives
}: ActionDetailViewProps) {
  const [showMessage, setShowMessage] = useState(false)

  if (!isOpen || !action) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/20 text-rose-400 border-rose-500/30'
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hoch'
      case 'medium': return 'Mittel'
      default: return 'Niedrig'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg md:max-h-[85vh] panel-card overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getPriorityColor(action.priority)}`}>
                  {getPriorityLabel(action.priority)}
                </span>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-zinc-100 mb-4">{action.title}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div>
                      <p className="text-zinc-500 text-xs">Verantwortlich</p>
                      <p className="text-zinc-300">{action.owner}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {action.messageDraft && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowMessage(!showMessage)}
                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{showMessage ? 'Entwurf ausblenden' : 'Nachrichtenentwurf anzeigen'}</span>
                  </button>
                  
                  <AnimatePresence>
                    {showMessage && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">{action.messageDraft}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Context Info */}
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300 mb-1">Warum diese Priorität?</p>
                    <p className="text-sm text-zinc-400">
                      Diese Aktion hat {action.priority === 'high' ? 'hohe' : action.priority === 'medium' ? 'mittlere' : 'niedrige'} Priorität 
                      basierend auf dem aktuellen Projektstatus und den identifizierten Abhängigkeiten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="p-5 border-t border-white/5 space-y-3">
              <Button 
                variant="primary" 
                size="lg"
                className="w-full bg-gradient-to-r from-violet-600 to-violet-700"
                onClick={() => { onStart?.(); onClose(); }}
              >
                <Play className="w-4 h-4 mr-2" />
                Jetzt starten
              </Button>
              
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  className="flex-1"
                  onClick={() => { onShowAlternatives?.(); onClose(); }}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Alternativen
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="flex-1"
                  onClick={onClose}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Erledigt
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
