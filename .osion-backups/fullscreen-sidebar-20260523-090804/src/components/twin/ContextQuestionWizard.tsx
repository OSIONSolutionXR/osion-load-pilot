import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, HelpCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'
import ContextQuestionInput from './ContextQuestionInput'
import type { ProjectContextQuestion } from '../../types/projectTwinV2'

interface ContextQuestionWizardProps {
  questions: ProjectContextQuestion[]
  onSubmit: (answers: Record<string, string>) => Promise<void>
  isSubmitting?: boolean
  submitError?: string | null
  onRetry?: () => void
}

type WizardStep = 'question' | 'summary' | 'success' | 'error'

export default function ContextQuestionWizard({
  questions,
  onSubmit,
  isSubmitting = false,
  submitError,
  onRetry
}: ContextQuestionWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState<WizardStep>('question')
  const [direction, setDirection] = useState(0)

  const displayQuestions = useMemo(() => questions.slice(0, 5), [questions])
  const totalQuestions = displayQuestions.length
  const currentQuestion = displayQuestions[currentIndex]
  
  const progress = ((currentIndex + 1) / totalQuestions) * 100
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : ''
  const hasCurrentAnswer = currentAnswer.trim() !== ''
  
  const answeredCount = Object.values(answers).filter(v => v.trim() !== '').length
  const hasAnyAnswer = answeredCount > 0

  const handleAnswerChange = useCallback((value: string) => {
    if (!currentQuestion) return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))
  }, [currentQuestion])

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
    } else {
      setStep('summary')
    }
  }, [currentIndex, totalQuestions])

  const handleBack = useCallback(() => {
    if (step === 'summary') {
      setStep('question')
      setDirection(-1)
    } else if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
    }
  }, [step, currentIndex])

  const handleSubmit = useCallback(async () => {
    if (!hasAnyAnswer) return
    
    try {
      await onSubmit(answers)
      setStep('success')
    } catch {
      setStep('error')
    }
  }, [answers, hasAnyAnswer, onSubmit])

  const handleRestart = useCallback(() => {
    setCurrentIndex(0)
    setAnswers({})
    setStep('question')
    setDirection(0)
  }, [])

  const handleRetry = useCallback(() => {
    setStep('summary')
    onRetry?.()
  }, [onRetry])

  // Success State
  if (step === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-100 mb-2">Project Twin geschärft</h4>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            {answeredCount} von {totalQuestions} Fragen beantwortet. Der Twin wurde aktualisiert.
          </p>
          <Button variant="primary" onClick={handleRestart} className="bg-gradient-to-r from-violet-600 to-violet-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Weitere Angaben hinzufügen
          </Button>
        </div>
      </motion.div>
    )
  }

  // Error State
  if (step === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6"
      >
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/20 border border-rose-500/30 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-rose-400" />
          </div>
          <h4 className="text-lg font-semibold text-zinc-100 mb-2">Aktualisierung fehlgeschlagen</h4>
          <p className="text-sm text-rose-400/80 max-w-md mx-auto mb-6">{submitError || 'Ein Fehler ist aufgetreten.'}</p>
          <p className="text-sm text-zinc-500 max-w-md mx-auto mb-6">Deine Antworten bleiben erhalten.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="primary" onClick={handleRetry} className="bg-gradient-to-r from-violet-600 to-violet-700">
              Erneut versuchen
            </Button>
            <Button variant="secondary" onClick={() => setStep('summary')}>
              Zurück zur Übersicht
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Summary State
  if (step === 'summary') {
    const answeredQuestions = displayQuestions.filter(q => answers[q.id]?.trim())
    
    return (
      <motion.div
        initial={{ opacity: 0, x: direction * 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -direction * 20 }}
        className="p-6 space-y-6"
      >
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-zinc-100 mb-1">Zusammenfassung</h4>
          <p className="text-sm text-zinc-500">{answeredCount} von {totalQuestions} Fragen beantwortet</p>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {answeredQuestions.map((q) => (
            <div key={q.id} className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-300 mb-1">{q.label}</p>
                  <p className="text-sm text-zinc-400">{answers[q.id]}</p>
                </div>
              </div>
            </div>
          ))}
          
          {answeredQuestions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-500">Noch keine Fragen beantwortet</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-white/5">
          <Button variant="secondary" onClick={handleBack} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={!hasAnyAnswer || isSubmitting}
            className="flex-1 bg-gradient-to-r from-violet-600 to-violet-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Wird gesendet...' : 'Project Twin schärfen'}
          </Button>
        </div>
      </motion.div>
    )
  }

  // Question State
  return (
    <div className="p-6 space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Frage {currentIndex + 1} von {totalQuestions}</span>
          <span className="text-zinc-500">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-violet-500 to-[#ff006e]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 50 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
                <span className="text-lg font-semibold text-violet-300">{currentIndex + 1}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              <div>
                <p className="text-base font-medium text-zinc-100 mb-2">{currentQuestion.label}</p>
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-zinc-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-400">{currentQuestion.reason}</p>
                </div>
              </div>
              
              <ContextQuestionInput 
                question={currentQuestion} 
                value={currentAnswer} 
                onChange={handleAnswerChange}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <Button 
          variant="secondary" 
          onClick={handleBack}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        {/* Skip Button (optional) */}
        {!hasCurrentAnswer && (
          <button 
            onClick={handleNext}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Überspringen
          </button>
        )}

        <Button 
          variant="primary" 
          onClick={handleNext}
          className="bg-gradient-to-r from-violet-600 to-violet-700"
        >
          {currentIndex === totalQuestions - 1 ? 'Zur Übersicht' : 'Weiter'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Answered Indicator */}
      {answeredCount > 0 && (
        <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{answeredCount} Frage{answeredCount !== 1 ? 'n' : ''} bereits beantwortet</span>
        </div>
      )}
    </div>
  )
}
