import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sparkles, ChevronRight, HelpCircle, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import ContextQuestionInput from './ContextQuestionInput'
import type { ProjectContextQuestion } from '../../types/projectTwinV2'
import { formatMissingContextList } from '../../lib/contextQuestions'

interface ContextQuestionsCardProps {
  questions: ProjectContextQuestion[]
  missingContext: string[]
  confidence: 'low' | 'medium' | 'high'
  onSubmitAnswers?: (answers: Record<string, string>) => Promise<void> | void
  isPreview?: boolean
  isUpdating?: boolean
  updateError?: string | null
  onRetry?: () => void
}

export default function ContextQuestionsCard({
  questions,
  missingContext,
  confidence,
  onSubmitAnswers,
  isPreview = false,
  isUpdating = false,
  updateError = null,
  onRetry
}: ContextQuestionsCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  
  const displayQuestions = useMemo(() => questions.slice(0, 5), [questions])
  const hasMoreQuestions = questions.length > 5
  const missingContextText = formatMissingContextList(missingContext)
  
  const answeredCount = Object.values(answers).filter(v => v.trim() !== '').length
  const hasAnyAnswer = answeredCount > 0
  
  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])
  
  const handleSubmit = useCallback(async () => {
    if (!hasAnyAnswer || isUpdating) return
    
    if (showSuccessMessage) {
      setShowSuccessMessage(false)
      setHasSubmitted(false)
      setAnswers({})
      onRetry?.()
      return
    }

    setHasSubmitted(true)
    try {
      await onSubmitAnswers?.(answers)
      setShowSuccessMessage(true)
      setAnswers({})
    } catch {
      setHasSubmitted(false)
    }
  }, [answers, hasAnyAnswer, isUpdating, onRetry, onSubmitAnswers, showSuccessMessage])

  const getQuestionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'
      default: return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
    }
  }
  
  if (isUpdating) {
    return (
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel-card overflow-hidden p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-violet-300 animate-spin" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-100 mb-2">Twin wird aktualisiert…</h4>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">Deine Ergänzungen werden in den bestehenden Project Twin übernommen.</p>
        </div>
      </motion.section>
    )
  }
  
  if (updateError && hasSubmitted) {
    return (
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel-card overflow-hidden p-8">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/20 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-100 mb-2">Aktualisierung fehlgeschlagen</h4>
          <p className="text-sm text-rose-400/80 max-w-md mx-auto mb-6">{updateError}</p>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">Die Antworten bleiben erhalten. Der Project Twin wurde nicht verändert.</p>
          <Button variant="primary" onClick={() => { setHasSubmitted(false); onRetry?.() }} className="bg-gradient-to-r from-violet-600 to-violet-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Erneut versuchen
          </Button>
        </div>
      </motion.section>
    )
  }
  
  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="panel-card overflow-hidden">
      <div className="relative p-6 border-b border-white/5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Diese Angaben würden Deinen Project Twin stärker machen</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">Die Projektlage ist bereits verwertbar. Mit ein paar Ergänzungen kann Load Pilot den nächsten Schritt, Risiken und Abhängigkeiten genauer steuern.</p>
            {confidence !== 'high' && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="neutral" className="text-xs">Vertrauen: {confidence === 'medium' ? 'mittel' : 'niedrig'}</Badge>
                <span className="text-xs text-zinc-500">Mehr Kontext = höhere Präzision</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showSuccessMessage ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-lg font-semibold text-zinc-100 mb-2">Project Twin wurde geschärft</h4>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">Deine Ergänzungen wurden übernommen.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="primary" onClick={handleSubmit} className="bg-gradient-to-r from-violet-600 to-violet-700">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Weitere Angaben hinzufügen
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-300">Offene Fragen</span>
              <div className="flex items-center gap-2">
                {hasAnyAnswer && <span className="text-xs text-emerald-400">{answeredCount} / {displayQuestions.length} beantwortet</span>}
                <span className="text-xs text-zinc-500">{displayQuestions.length}{hasMoreQuestions ? '+' : ''} von {questions.length}</span>
              </div>
            </div>
            <div className="space-y-5">
              {displayQuestions.map((question, index) => (
                <motion.div key={question.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`p-4 rounded-xl border transition-colors ${answers[question.id] ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.03] border-white/5'}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${answers[question.id] ? 'bg-emerald-500/20 text-emerald-300' : 'bg-violet-500/20 text-violet-300'}`}>
                        {answers[question.id] ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm text-zinc-200 mb-1">{question.label}</p>
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                            <p className="text-xs text-zinc-500">{question.reason}</p>
                          </div>
                        </div>
                        {question.priority !== 'low' && (
                          <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider rounded-full border flex-shrink-0 ${getQuestionPriorityColor(question.priority)}`}>{question.priority}</span>
                        )}
                      </div>
                      <ContextQuestionInput question={question} value={answers[question.id] || ''} onChange={(value) => handleAnswerChange(question.id, value)} disabled={isPreview} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {hasMoreQuestions && <p className="text-xs text-zinc-500 text-center">Weitere {questions.length - 5} Fragen verfügbar</p>}
            <div className="pt-4 border-t border-white/5">
              <Button variant="primary" size="lg" className="w-full group" onClick={handleSubmit} disabled={!hasAnyAnswer || isPreview}>
                <span>{isPreview ? 'Bald verfügbar' : 'Project Twin schärfen'}</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              {!hasAnyAnswer && !isPreview && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                  <p className="text-xs text-zinc-500">Beantworte mindestens eine Frage, um fortzufahren</p>
                </div>
              )}
              {missingContextText && <p className="text-xs text-zinc-500 text-center mt-3">Fehlt: {missingContextText}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}
