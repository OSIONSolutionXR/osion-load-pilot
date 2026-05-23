import { useState, useCallback, useMemo, useEffect } from 'react'
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

// Beispiel-Antworten für verschiedene Fragetypen
const EXAMPLE_ANSWERS: Record<string, string[]> = {
  'Budget': ['Eigenkapital', 'Gesamtbudget inkl. Darlehen', 'Noch offen'],
  'Frist': ['Diese Woche', 'Nächste Woche', 'In 2 Wochen'],
  'Zielgruppe': ['B2B', 'B2C', 'Beides'],
  'Zahlungsweise': ['Bar', 'Finanzierung', 'Leasing'],
  'Ressourcen': ['Internes Team', 'Externe Agentur', 'Mischung'],
}

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
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set())
  const [showValidationHint, setShowValidationHint] = useState(false)

  // Reset when questions change
  useEffect(() => {
    setCurrentIndex(0)
    setAnswers({})
    setStep('question')
    setDirection(0)
    setSkippedQuestions(new Set())
    setShowValidationHint(false)
  }, [questions.map(q => q.id).join(',')])

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
    setShowValidationHint(false)
  }, [currentQuestion])

  const handleExampleClick = useCallback((example: string) => {
    handleAnswerChange(example)
  }, [handleAnswerChange])

  const handleNext = useCallback(() => {
    // Prüfen ob Antwort vorhanden oder übersprungen
    if (!hasCurrentAnswer && !skippedQuestions.has(currentQuestion?.id || '')) {
      setShowValidationHint(true)
      return
    }
    
    setShowValidationHint(false)
    if (currentIndex < totalQuestions - 1) {
      setDirection(1)
      setCurrentIndex(prev => prev + 1)
    } else {
      setStep('summary')
    }
  }, [currentIndex, totalQuestions, hasCurrentAnswer, currentQuestion, skippedQuestions])

  const handleBack = useCallback(() => {
    setShowValidationHint(false)
    if (step === 'summary') {
      setStep('question')
      setDirection(-1)
    } else if (currentIndex > 0) {
      setDirection(-1)
      setCurrentIndex(prev => prev - 1)
    }
  }, [step, currentIndex])

  const handleSkip = useCallback(() => {
    if (currentQuestion) {
      setSkippedQuestions(prev => new Set([...prev, currentQuestion.id]))
      // Lösche evtl. vorhandene Antwort beim Überspringen
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: '' }))
    }
    setShowValidationHint(false)
    handleNext()
  }, [currentQuestion, handleNext])

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
    setSkippedQuestions(new Set())
    setShowValidationHint(false)
  }, [])

  const handleRetry = useCallback(() => {
    setStep('summary')
    onRetry?.()
  }, [onRetry])

  // Hilfsfunktion für Beispiel-Chips
  const getExampleAnswers = (question: ProjectContextQuestion): string[] => {
    // Suche nach passenden Beispielen basierend auf dem Label/Frage
    for (const [key, examples] of Object.entries(EXAMPLE_ANSWERS)) {
      if (question.label.includes(key) || question.question.includes(key)) {
        return examples
      }
    }
    return []
  }

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

  // Empty State - keine Fragen verfügbar
  if (totalQuestions === 0) {
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
          <h4 className="text-lg font-semibold text-zinc-100 mb-2">Keine offenen Kontextfragen</h4>
          <p className="text-sm text-zinc-400 max-w-md mx-auto mb-6">
            Alle wichtigen Informationen sind vorhanden. Nutze "Fortschritt melden" oder "Nächsten Schritt ableiten", um den Twin zu aktualisieren.
          </p>
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
  const exampleAnswers = currentQuestion ? getExampleAnswers(currentQuestion) : []

  return (
    <div className="p-6 space-y-6">
      {/* Progress Bar - verbessert */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-zinc-400">Frage</span>
            <span className="text-lg font-bold text-white">{currentIndex + 1}</span>
            <span className="text-sm text-zinc-500">von</span>
            <span className="text-lg font-bold text-white">{totalQuestions}</span>
          </div>
          <span className="text-sm font-semibold text-violet-400">{Math.round(progress)}%</span>
        </div>
        
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-violet-500 to-[#ff006e]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card - überarbeitet */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -direction * 50 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Frage-Nummer-Indikator */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
              <span className="text-xl font-bold text-violet-300">{currentIndex + 1}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-violet-400 uppercase tracking-wider">{currentQuestion.label}</p>
            </div>
          </div>

          {/* Hauptfrage - GROSS, FETT, SCHWARZ */}
          <div className="space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
              {currentQuestion.question}
            </h3>
            
            {/* Helper-Text als Erklärungsbox */}
            {currentQuestion.helperText && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <HelpCircle className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                <p className="text-base text-zinc-300 leading-relaxed">
                  {currentQuestion.helperText}
                </p>
              </div>
            )}
          </div>

          {/* Antwortbereich - deutlich sichtbar mit ContextQuestionInput */}
          <div className="space-y-4">
            <ContextQuestionInput 
              question={currentQuestion} 
              value={currentAnswer} 
              onChange={handleAnswerChange}
            />

            {/* Beispiel-Chips - zusätzlich zum Input */}
            {exampleAnswers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500">Schnellantworten:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleAnswers.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleExampleClick(example)}
                      className="px-3 py-1.5 rounded-lg text-sm
                        bg-white/5 hover:bg-violet-500/20
                        border border-white/10 hover:border-violet-500/30
                        text-zinc-400 hover:text-violet-300
                        transition-all duration-200"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Validierungs-Hinweis */}
      <AnimatePresence>
        {showValidationHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
          >
            <p className="text-sm text-amber-400 text-center">
              Bitte beantworte die Frage oder wähle "Ich weiß es noch nicht"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation - verbessert */}
      <div className="flex items-center justify-between pt-6 border-t border-white/5">
        <Button 
          variant="secondary" 
          onClick={handleBack}
          disabled={currentIndex === 0 && step === 'question'}
          className="min-w-[120px]"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        {/* "Ich weiß es noch nicht" - deutlicher */}
        <button 
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium
            text-zinc-500 hover:text-zinc-300
            hover:bg-white/5
            rounded-lg transition-all duration-200"
        >
          Ich weiß es noch nicht
        </button>

        <Button 
          variant="primary" 
          onClick={handleNext}
          disabled={isSubmitting}
          className="min-w-[120px] bg-gradient-to-r from-violet-600 to-violet-700"
        >
          {currentIndex === totalQuestions - 1 ? 'Zur Übersicht' : 'Weiter'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Status-Indikator */}
      {(answeredCount > 0 || skippedQuestions.size > 0) && (
        <div className="flex items-center justify-center gap-6 text-sm">
          {answeredCount > 0 && (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{answeredCount} beantwortet</span>
            </div>
          )}
          {skippedQuestions.size > 0 && (
            <div className="flex items-center gap-2 text-zinc-500">
              <span>•</span>
              <span>{skippedQuestions.size} übersprungen</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
