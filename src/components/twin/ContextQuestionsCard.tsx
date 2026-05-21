import { motion } from 'motion/react'
import { Sparkles, ChevronRight, HelpCircle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import type { ProjectContextQuestion } from '../../types/projectTwinV2'
import { formatMissingContextList } from '../../lib/contextQuestions'

interface ContextQuestionsCardProps {
  questions: ProjectContextQuestion[]
  missingContext: string[]
  confidence: 'low' | 'medium' | 'high'
  onAddContext: () => void
  isPreview?: boolean
}

export default function ContextQuestionsCard({
  questions,
  missingContext,
  confidence,
  onAddContext,
  isPreview = false
}: ContextQuestionsCardProps) {
  const displayQuestions = questions.slice(0, 5)
  const hasMoreQuestions = questions.length > 5
  const missingContextText = formatMissingContextList(missingContext)
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="panel-card overflow-hidden"
    >
      {/* Header mit Gradient-Akzent */}
      <div className="relative p-6 border-b border-white/5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-300" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">
              Diese Angaben würden Deinen Project Twin stärker machen
            </h3>
            
            <p className="text-zinc-400 text-sm leading-relaxed">
              Die Projektlage ist bereits verwertbar. Mit ein paar Ergänzungen kann Load Pilot den nächsten Schritt, Risiken und Abhängigkeiten genauer steuern.
            </p>
            
            {confidence !== 'high' && (
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="neutral" className="text-xs">
                  Vertrauen: {confidence === 'medium' ? 'mittel' : 'niedrig'}
                </Badge>
                <span className="text-xs text-zinc-500">
                  Mehr Kontext = höhere Präzision
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Fragen-Liste */}
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-zinc-300">
            Offene Fragen
          </span>
          <span className="text-xs text-zinc-500">
            {displayQuestions.length}{hasMoreQuestions ? '+' : ''} von {questions.length}
          </span>
        </div>
        
        <div className="space-y-3">
          {displayQuestions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.05 }}
              className="group relative p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-300">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-200 mb-1">
                    {question.label}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {question.reason}
                    </p>
                  </div>
                  
                  {question.options && question.options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {question.options.slice(0, 3).map(option => (
                        <span
                          key={option}
                          className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-zinc-400 border border-white/5"
                        >
                          {option}
                        </span>
                      ))}
                      {question.options.length > 3 && (
                        <span className="text-xs text-zinc-500">
                          +{question.options.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {hasMoreQuestions && (
          <p className="text-xs text-zinc-500 text-center mt-3">
            Weitere {questions.length - 5} Fragen verfügbar
          </p>
        )}
      </div>
      
      {/* CTA Footer */}
      <div className="px-6 pb-6">
        <Button
          variant="primary"
          size="lg"
          className="w-full group bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 border-violet-500/50"
          onClick={onAddContext}
          disabled={isPreview}
        >
          <span>{isPreview ? 'Bald verfügbar' : 'Kontext ergänzen'}</span>
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
        </Button>
        
        {!isPreview && missingContextText && (
          <p className="text-xs text-zinc-500 text-center mt-3">
            Fehlt: {missingContextText}
          </p>
        )}
      </div>
    </motion.section>
  )
}
