import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Sparkles,
  Settings,
  CheckCircle,
  X,
  Bot,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import {
  useMeasuresStoreV2,
  type MeasureV2,
  type AIMode,
  aiModeLabels,
  aiModeDescriptions,
  aiModeColors,
  senderModeLabels,
} from '../../lib/measuresStoreV2'
import { useEmailAccountsStore } from '../../lib/emailAccountsStore'
import type { StoredProjectTwinV2 } from '../../types/projectTwinV2'

interface MeasureAutopilotButtonProps {
  measure: MeasureV2
  twin: StoredProjectTwinV2
  variant?: 'default' | 'compact'
}

const aiModeOptions: AIMode[] = ['manual', 'suggestion_only', 'approval_required', 'autonomous', 'locked']

export default function MeasureAutopilotButton({
  measure,
  twin,
  variant = 'default',
}: MeasureAutopilotButtonProps) {
  const { setAIMode } = useMeasuresStoreV2()
  const { getDefaultForProject } = useEmailAccountsStore()
  const [isOpen, setIsOpen] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const projectDefaultEmail = getDefaultForProject(twin.id)

  const handleModeChange = (mode: AIMode) => {
    setAIMode(measure.id, mode)
  }

  const handleStartAutopilot = async () => {
    if (measure.aiMode === 'autonomous') {
      setShowConfirm(true)
      return
    }

    await runAutopilot()
  }

  const runAutopilot = async () => {
    setIsRunning(true)
    setShowConfirm(false)

    // Simulate autopilot execution
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Add log entry
    const { addExecutionLogEntry } = useMeasuresStoreV2.getState()
    addExecutionLogEntry(measure.id, {
      action: 'autopilot_executed',
      aiMode: measure.aiMode,
      status: 'success',
      userDecision: 'autopilot_triggered',
    })

    setIsRunning(false)
    setIsOpen(false)
  }

  const modeColors = aiModeColors[measure.aiMode]

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${modeColors.bg} ${modeColors.text}`}
          title={aiModeDescriptions[measure.aiMode]}
        >
          <Bot className="w-3.5 h-3.5" />
          {aiModeLabels[measure.aiMode]}
        </button>

        <AutopilotModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          measure={measure}
          modeColors={modeColors}
          onModeChange={handleModeChange}
          onStart={handleStartAutopilot}
          isRunning={isRunning}
          projectDefaultEmail={projectDefaultEmail?.label}
        />

        <ConfirmDialog
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={runAutopilot}
          title="Autonomen Modus starten"
          description="Im autonomen Modus kann die KI Maßnahmen eigenständig durchführen. Möchtest du fortfahren?"
        />
      </>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`${modeColors.bg.replace('/20', '/10')} ${modeColors.text} border ${modeColors.border}`}
      >
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Autopilot
          <Badge
            className={`${modeColors.bg} ${modeColors.text} border-0 text-xs`}
          >
            {aiModeLabels[measure.aiMode]}
          </Badge>
        </span>
      </Button>

      <AutopilotModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        measure={measure}
        modeColors={modeColors}
        onModeChange={handleModeChange}
        onStart={handleStartAutopilot}
        isRunning={isRunning}
        projectDefaultEmail={projectDefaultEmail?.label}
      />

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={runAutopilot}
        title="Autonomen Modus starten"
        description="Im autonomen Modus kann die KI Maßnahmen eigenständig durchführen. Möchtest du fortfahren?"
      />
    </>
  )
}

interface AutopilotModalProps {
  isOpen: boolean
  onClose: () => void
  measure: MeasureV2
  modeColors: { bg: string; text: string; border: string }
  onModeChange: (mode: AIMode) => void
  onStart: () => void
  isRunning: boolean
  projectDefaultEmail?: string
}

function AutopilotModal({
  isOpen,
  onClose,
  measure,
  modeColors,
  onModeChange,
  onStart,
  isRunning,
  projectDefaultEmail,
}: AutopilotModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modeColors.bg}`}>
                    <Bot className={`w-5 h-5 ${modeColors.text}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Maßnahmen-Autopilot
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {measure.title}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* AI Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  KI-Modus
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {aiModeOptions.map((mode) => {
                    const colors = aiModeColors[mode]
                    const isSelected = measure.aiMode === mode
                    return (
                      <button
                        key={mode}
                        onClick={() => onModeChange(mode)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? `${colors.bg} ${colors.border} ring-1 ring-current`
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected
                              ? `border-current ${colors.text}`
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${colors.bg.replace('/20', '').replace('/10', '')}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isSelected ? colors.text : 'text-slate-900 dark:text-slate-100'}`}>
                            {aiModeLabels[mode]}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {aiModeDescriptions[mode]}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aktueller Status
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Verknüpfte Kontakte:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">
                    {measure.linkedContactIds.length}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">Absender:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">
                    {measure.senderMode ? senderModeLabels[measure.senderMode] : 'Nicht konfiguriert'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">E-Mail-Konto:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">
                    {projectDefaultEmail || 'Kein Standard'}
                  </span>
                </div>
              </div>

              {measure.aiMode === 'locked' && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      Maßnahme gesperrt
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                      Diese Maßnahme ist gesperrt und kann nicht automatisch ausgeführt werden.
                    </p>
                  </div>
                </div>
              )}

              {measure.aiMode === 'manual' && (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-3">
                  <Settings className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Manueller Modus
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      Im manuellen Modus werden keine automatischen Aktionen durchgeführt.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Schließen
              </Button>
              {measure.aiMode !== 'manual' && measure.aiMode !== 'locked' && (
                <Button onClick={onStart} disabled={isRunning}>
                  {isRunning ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Wird ausgeführt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Autopilot starten
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, description }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  {description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="ghost" onClick={onClose}>
                Abbrechen
              </Button>
              <Button onClick={onConfirm}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Bestätigen
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
