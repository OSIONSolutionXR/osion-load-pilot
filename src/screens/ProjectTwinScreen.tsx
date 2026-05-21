import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ChevronDown, RefreshCw } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import ContextQuestionsCard from '../components/twin/ContextQuestionsCard'
import RefineContextModal from '../components/twin/RefineContextModal'
import ProjectHistoryPanel from '../components/twin/ProjectHistoryPanel'
import { generateContextQuestions } from '../lib/contextQuestions'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { updateProjectTwin, buildAdditionalInputFromAnswers, buildContextAnswers, type TwinUpdateResponse } from '../services/projectTwinUpdateApi'

interface ProjectTwinScreenProps {
  onBack: () => void
  onNewInput?: () => void
  twin: StoredProjectTwin | null
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
}

export default function ProjectTwinScreen({ onBack, twin, onTwinUpdate }: ProjectTwinScreenProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const analysis = twin?.analysis ?? null

  const buildUpdatedTwin = useCallback((response: TwinUpdateResponse, additionalInput: string) => {
    if (!twin || !analysis) return null
    const returnedAnalysis = response.analysis ?? (response.updatedTwin && typeof response.updatedTwin === 'object' ? (response.updatedTwin as { analysis?: StoredProjectTwin['analysis'] }).analysis : undefined)
    if (!returnedAnalysis) return null

    const now = new Date().toISOString()
    const progress = response.newProgress ?? response.progress ?? twin.progress
    const updateEntry = {
      id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      input: additionalInput,
      summary: response.updateSummary || 'Project Twin geschärft.',
      source: 'context_form' as const,
      changedFields: response.changedFields || (response.meta?.fieldsModified || []).map((field) => ({ field, before: 'vorher', after: 'nachher' })),
      previousProgressPercent: twin.progress.percent,
      newProgressPercent: progress.percent,
      previousNextMoveTitle: analysis.nextMove.title,
      newNextMoveTitle: returnedAnalysis.nextMove.title
    }

    return {
      ...twin,
      updatedAt: now,
      latestInput: additionalInput.trim(),
      analysis: returnedAnalysis,
      progress: {
        ...twin.progress,
        percent: progress.percent,
        stage: progress.stage as typeof twin.progress.stage,
        updatedAt: now
      },
      updates: [...(twin.updates || []), updateEntry],
      contextQuestions: []
    }
  }, [analysis, twin])

  const handleUpdateWithAnswers = useCallback(async (answers: Record<string, string>) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const questions = generateContextQuestions(analysis.quality.missingContext, twin.originalInput || '', analysis.project.type)
      const additionalInput = buildAdditionalInputFromAnswers(answers, questions)
      const contextAnswers = buildContextAnswers(answers, questions)
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers,
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })
      const updatedTwin = buildUpdatedTwin(response, additionalInput)
      if (!updatedTwin) throw new Error('Ungültiges Update-Ergebnis')
      onTwinUpdate?.(updatedTwin)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, buildUpdatedTwin, onTwinUpdate, twin])

  const handleManualUpdate = useCallback(async (additionalInput: string) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)
    try {
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
        updateMode: 'refine_existing_twin',
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })
      const updatedTwin = buildUpdatedTwin(response, additionalInput)
      if (!updatedTwin) throw new Error('Ungültiges Update-Ergebnis')
      onTwinUpdate?.(updatedTwin)
      setShowRefineModal(false)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, buildUpdatedTwin, onTwinUpdate, twin])

  if (!analysis || !twin) return null

  const { project, quality } = analysis

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="space-y-6">
      <Panel className="panel-premium p-8 md:p-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onBack}><ArrowLeft className="w-5 h-5" />Zurück</Button>
            <Button variant="ghost" onClick={() => setShowRefineModal(true)} disabled={isUpdating}><RefreshCw className="w-4 h-4" />Aktualisieren</Button>
          </div>
          <Badge variant={quality.confidence === 'high' ? 'blue' : quality.confidence === 'medium' ? 'neutral' : 'rose'}>confidence: {quality.confidence}</Badge>
        </div>

        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{project.title}</h1>
          <p className="text-lg text-zinc-400 mb-6 leading-relaxed">{project.description}</p>
        </div>
      </Panel>

      <ContextQuestionsCard
        questions={generateContextQuestions(quality.missingContext, twin.originalInput || '', project.type)}
        missingContext={quality.missingContext}
        confidence={quality.confidence}
        onSubmitAnswers={handleUpdateWithAnswers}
        isUpdating={isUpdating}
        updateError={updateError}
        onRetry={() => setUpdateError(null)}
      />

      <ProjectHistoryPanel twin={twin} />

      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="panel-card opacity-60 hover:opacity-100 transition-opacity">
        <button onClick={() => setShowTechnicalDetails(!showTechnicalDetails)} className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3"><Badge variant="neutral">Debug</Badge><span className="text-zinc-500 text-sm">Technische Analyse anzeigen</span></div>
          <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showTechnicalDetails && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
              <div className="p-6 pt-0 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <TechnicalSection title="Qualität" items={[[ 'Input Quality', quality.inputQuality ], [ 'Actionable', quality.isActionable ? 'Ja' : 'Nein' ], [ 'Confidence', quality.confidence ], [ 'Missing Context', quality.missingContext.join(', ') || 'Keiner' ]]} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <RefineContextModal isOpen={showRefineModal} onClose={() => setShowRefineModal(false)} onSubmit={handleManualUpdate} projectTitle={project.title} isProcessing={isUpdating} />
    </motion.div>
  )
}

function TechnicalSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  return <div className="space-y-2"><h4 className="text-sm font-semibold text-zinc-300">{title}</h4>{items.map(([label, value]) => <div key={label} className="flex justify-between text-sm"><span className="text-zinc-500">{label}</span><span className="text-zinc-200">{value}</span></div>)}</div>
}
