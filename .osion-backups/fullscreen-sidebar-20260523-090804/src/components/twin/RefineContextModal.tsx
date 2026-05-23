import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button'

interface RefineContextModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (additionalInput: string) => Promise<void>
  projectTitle: string
  isProcessing: boolean
  error?: string | null
}

export default function RefineContextModal({
  isOpen,
  onClose,
  onSubmit,
  projectTitle,
  isProcessing,
  error
}: RefineContextModalProps) {
  const [additionalInput, setAdditionalInput] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!additionalInput.trim() || isProcessing) return
    
    setSubmitError(null)
    console.log('[RefineModal] Submit start', {
      inputLength: additionalInput.length,
      inputPreview: additionalInput.substring(0, 50)
    })
    
    try {
      await onSubmit(additionalInput.trim())
      // Nur bei Erfolg: Eingabe löschen
      console.log('[RefineModal] Submit success - clearing input')
      setAdditionalInput('')
    } catch (err) {
      // Bei Fehler: Eingabe behalten, Fehler anzeigen
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      console.error('[RefineModal] Submit error:', errorMsg)
      setSubmitError(errorMsg)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit()
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="panel-premium p-6 md:p-8 mx-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 flex items-center justify-center border border-violet-500/30">
                    <Sparkles className="w-5 h-5 text-violet-300" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Projektlage schärfen</h2>
                    <p className="text-sm text-zinc-500">{projectTitle}</p>
                  </div>
                </div>
                <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Instructions */}
              <p className="text-zinc-300 mb-6 leading-relaxed">
                Ergänze weitere Informationen zu deinem Projekt. Load Pilot aktualisiert deinen Project Twin, 
                ohne das Projekt neu zu starten. Alle bisherigen Analysen bleiben erhalten.
              </p>

              {/* Error Display */}
              {(submitError || error) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 mb-4"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-rose-400">{submitError || error}</p>
                    <p className="text-xs text-rose-400/70 mt-1">
                      Deine Eingabe bleibt erhalten. Bitte überprüfe und versuche es erneut.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Input Area */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={additionalInput}
                    onChange={(e) => setAdditionalInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Zum Beispiel: Budget liegt bei 20.000 Euro, ich brauche das Auto für Familie und Arbeit, Kauf innerhalb von 3 Monaten..."
                    disabled={isProcessing}
                    className="w-full h-32 p-4 bg-white/[0.05] border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 resize-none transition-all disabled:opacity-50"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-zinc-600">
                    {additionalInput.length} / 4000
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
                    {submitError ? 'Schließen' : 'Abbrechen'}
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={!additionalInput.trim() || isProcessing}
                    variant="primary"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Twin wird aktualisiert...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Twin aktualisieren
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-xs text-zinc-600 mt-4">
                Tipp: Strg+Enter zum Absenden
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
