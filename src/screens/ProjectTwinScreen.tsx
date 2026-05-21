import { motion, AnimatePresence } from 'motion/react'
import { 
  ArrowLeft, Zap, Users, ChevronDown, Target, Route,
  ListTodo, CheckCircle2, Clock, RefreshCw, AlertTriangle, 
  TrendingUp, ArrowRight
} from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import ContextQuestionsCard from '../components/twin/ContextQuestionsCard'
import RefineContextModal from '../components/twin/RefineContextModal'
import ProjectHistoryPanel from '../components/twin/ProjectHistoryPanel'
import { generateContextQuestions } from '../lib/contextQuestions'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { updateProjectTwin, buildAdditionalInputFromAnswers, buildContextAnswers, type TwinUpdateResponse } from '../services/projectTwinUpdateApi'
import { normalizeProjectTwinUpdateResponse, buildUpdatedTwinFromResult } from '../services/projectTwinUpdateNormalizer'

interface ProjectTwinScreenProps {
  onBack: () => void
  onNewInput?: () => void
  twin: StoredProjectTwin | null
  onTwinUpdate?: (updatedTwin: StoredProjectTwin) => void
}

export default function ProjectTwinScreen({ onBack, onNewInput, twin, onTwinUpdate }: ProjectTwinScreenProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [showRefineModal, setShowRefineModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  
  const analysis = twin?.analysis ?? null

  // Memoisiere Kontextfragen - verhindert Neugenerierung bei jedem Render
  const contextQuestions = useMemo(() => {
    if (!analysis || !twin) return []
    return generateContextQuestions(
      analysis.quality.missingContext,
      twin.originalInput || '',
      analysis.project.type
    )
  }, [analysis?.quality.missingContext, twin?.originalInput, analysis?.project.type])

  const buildUpdatedTwin = useCallback((response: TwinUpdateResponse, additionalInput: string) => {
    if (!twin || !analysis) return null
    
    console.log('[buildUpdatedTwin] Response keys:', Object.keys(response))
    
    // Verwende den neuen Normalizer für robustes Response-Handling
    const normalized = normalizeProjectTwinUpdateResponse(response, twin, additionalInput)
    
    if (!normalized) {
      console.error('[buildUpdatedTwin] Normalizer returned null - invalid response format')
      return null
    }
    
    console.log('[buildUpdatedTwin] Normalized result:', {
      projectTitle: normalized.analysis.project.title,
      confidence: normalized.analysis.quality.confidence,
      newProgress: normalized.newProgress.percent
    })
    
    // Baue den aktualisierten Twin
    const updatedTwin = buildUpdatedTwinFromResult(normalized, twin, additionalInput)
    
    console.log('[buildUpdatedTwin] Success:', {
      newProgress: updatedTwin.progress.percent,
      updatesCount: updatedTwin.updates.length,
      newNextMove: updatedTwin.analysis.nextMove.title
    })
    
    return updatedTwin
  }, [analysis, twin])

  const handleUpdateWithAnswers = useCallback(async (answers: Record<string, string>) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)
    
    // Verwende die memoisierten Fragen statt neu generieren
    const questions = contextQuestions
    
    // Debug-Logging
    console.log('[ContextQuestions] submit', {
      questionCount: questions.length,
      answeredCount: Object.keys(answers).length,
      validAnswerCount: Object.values(answers).filter(v => v.trim() !== '').length,
      answersPreview: Object.entries(answers).slice(0, 4).map(([k, v]) => ({ 
        key: k, 
        val: v.substring(0, 50) 
      })),
      hasActiveTwin: Boolean(analysis),
      activeTwinId: twin.id
    })
    
    try {
      const additionalInput = buildAdditionalInputFromAnswers(answers, questions)
      
      console.log('[TwinScreen] Built additionalInput', {
        length: additionalInput.length,
        preview: additionalInput.substring(0, 100),
        isEmpty: !additionalInput.trim()
      })
      
      if (!additionalInput.trim()) {
        throw new Error('Keine gültigen Antworten gefunden. Bitte fülle mindestens ein Feld aus.')
      }
      
      const contextAnswers = buildContextAnswers(answers, questions)
      
      console.log('[TwinScreen] Calling updateProjectTwin', {
        source: 'context_form',
        hasExistingTwin: !!analysis,
        existingTwinTitle: analysis.project.title,
        hasOriginalInput: !!(twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput),
        additionalInputLength: additionalInput.length,
        contextAnswersCount: contextAnswers.length,
        updateMode: 'refine_existing_twin'
      })
      
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers,
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })
      
      console.log('[TwinScreen] Response received', {
        hasAnalysis: !!response.analysis,
        hasUpdatedTwin: !!response.updatedTwin,
        updateSummary: response.updateSummary
      })
      
      const updatedTwin = buildUpdatedTwin(response, additionalInput)
      
      if (!updatedTwin) {
        console.error('[TwinScreen] buildUpdatedTwin returned null')
        throw new Error('Ungültiges Update-Ergebnis: Konnte Twin nicht aufbauen')
      }
      
      console.log('[TwinScreen] Built updatedTwin', {
        newProgress: updatedTwin.progress.percent,
        updatesCount: updatedTwin.updates.length,
        newNextMove: updatedTwin.analysis.nextMove.title
      })
      
      onTwinUpdate?.(updatedTwin)
      console.log('[TwinScreen] onTwinUpdate called successfully')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      console.error('[TwinScreen] Update failed:', errorMsg)
      setUpdateError(errorMsg)
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, buildUpdatedTwin, onTwinUpdate, twin, contextQuestions])

  const handleManualUpdate = useCallback(async (additionalInput: string) => {
    if (!twin || !analysis) return
    setIsUpdating(true)
    setUpdateError(null)
    
    console.log('[TwinScreen] Manual update start', {
      twinId: twin.id,
      inputLength: additionalInput.length,
      inputPreview: additionalInput.substring(0, 100)
    })
    
    try {
      console.log('[TwinScreen] Manual update calling updateProjectTwin', {
        source: 'modal',
        hasExistingTwin: !!analysis,
        existingTwinTitle: analysis.project.title,
        hasOriginalInput: !!(twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput),
        additionalInputLength: additionalInput.length,
        updateMode: 'refine_existing_twin'
      })
      
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
        updateMode: 'refine_existing_twin',
        contextAnswers: [],
        previousUpdates: twin.updates,
        currentProgress: twin.progress
      })
      
      console.log('[TwinScreen] Manual update response', {
        hasAnalysis: !!response.analysis,
        hasUpdatedTwin: !!response.updatedTwin,
        updateSummary: response.updateSummary
      })
      
      const updatedTwin = buildUpdatedTwin(response, additionalInput)
      
      if (!updatedTwin) {
        console.error('[TwinScreen] buildUpdatedTwin returned null for manual update')
        throw new Error('Ungültiges Update-Ergebnis')
      }
      
      console.log('[TwinScreen] Manual update successful, closing modal')
      onTwinUpdate?.(updatedTwin)
      setShowRefineModal(false)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Update fehlgeschlagen'
      console.error('[TwinScreen] Manual update failed:', errorMsg)
      setUpdateError(errorMsg)
      // Fehler an Modal weitergeben - Eingabe bleibt erhalten
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [analysis, buildUpdatedTwin, onTwinUpdate, twin])

  if (!analysis || !twin) return null

  const { project, nextMove, actors, dependencies, risks, scenarios, actions, quality } = analysis
  // Reference for API compatibility - used by parent component
  void onNewInput

  // Nur Top 3 Risiken
  const topRisks = risks.slice(0, 3)

  // Nur Abhängigkeiten mit Blockern oder required Status
  const criticalDeps = dependencies.filter(d => d.isBlocker || d.status === 'required').slice(0, 5)

  // Szenarien als Entscheidungsoptionen (max 3)
  const decisionOptions = scenarios.slice(0, 3).map(s => ({
    title: s.title,
    outcome: s.outcome,
    riskLevel: s.riskLevel,
    recommendation: s.recommendation
  }))

  return (
    <div className="space-y-8">
      {/* Update Error Banner */}
      <AnimatePresence>
        {updateError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="panel-card border-l-4 border-l-rose-500 p-4 bg-rose-500/10"
          >
            <p className="text-rose-400 text-sm">{updateError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO BEREICH */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="panel-premium p-8 md:p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Button>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#ff006e]" />
            <Badge variant="violet">Project Twin</Badge>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <Button variant="ghost" onClick={() => setShowRefineModal(true)} disabled={isUpdating}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Aktualisieren
          </Button>
        </div>

        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{project.title}</h1>
          <p className="text-lg text-zinc-400 mb-6 leading-relaxed">{project.description}</p>

          {/* Status Chips */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">{project.status}</Badge>
            <Badge variant="neutral">{project.type}</Badge>
            {quality.isActionable && <Badge variant="violet">speicherbar</Badge>}
            <Badge variant={quality.confidence === 'high' ? 'blue' : quality.confidence === 'medium' ? 'neutral' : 'rose'}>
              confidence: {quality.confidence}
            </Badge>
            {twin.progress && (
              <Badge variant="success">{twin.progress.percent}% complete</Badge>
            )}
          </div>
        </div>
      </motion.header>

      {/* 2. HAUPTKARTE: Nächster wirksamster Schritt */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="panel-premium p-8 md:p-10 border-l-4 border-l-[#ff006e]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff006e]/20 to-violet-500/20 flex items-center justify-center border border-[#ff006e]/30">
            <Target className="w-6 h-6 text-[#ff006e]" />
          </div>
          <div>
            <div className="text-sm text-zinc-500 uppercase tracking-wider">Nächster wirksamster Schritt</div>
            <h2 className="text-2xl font-bold text-white mt-1">{nextMove.title}</h2>
          </div>
        </div>

        <p className="text-zinc-300 text-lg leading-relaxed mb-8 max-w-3xl">
          {nextMove.reason}
        </p>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase">Aufwand</div>
              <div className="font-semibold text-emerald-400 capitalize">{nextMove.effort}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/30">
              <Zap className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase">Impact</div>
              <div className="font-semibold text-violet-400 capitalize">{nextMove.impact}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 uppercase">Deadline</div>
              <div className="font-semibold text-amber-400">{nextMove.deadline ?? 'Offen'}</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. ABHÄNGIGKEITSGRAFIK / PROZESSKETTE */}
      {criticalDeps.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="panel-card overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <Route className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Kritische Abfolge</h3>
          </div>
          <div className="p-6 space-y-4">
            {criticalDeps.map((dep, index) => (
              <div key={index} className={`flex items-start gap-4 ${dep.isBlocker ? 'border-l-4 border-l-rose-500 pl-4' : ''}`}>
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-zinc-500">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-zinc-200">{dep.from}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-600" />
                    <span className="font-medium text-zinc-200">{dep.to}</span>
                    {dep.isBlocker && (
                      <Badge variant="rose" className="text-xs">Blocker</Badge>
                    )}
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">{dep.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 4. HAUPTANALYSE-BEREICHE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AKTEURE */}
        {actors.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="panel-card overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Users className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-semibold">Akteure</h3>
              <Badge variant="neutral" className="ml-auto">{actors.length}</Badge>
            </div>
            <div className="p-6 space-y-4">
              {actors.slice(0, 5).map((actor, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
                    <span className="text-sm font-medium text-violet-400">{actor.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-200">{actor.name}</div>
                    <div className="text-sm text-zinc-500">{actor.role}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={actor.influence === 'high' ? 'blue' : actor.influence === 'medium' ? 'neutral' : 'rose'} className="text-xs">
                        Einfluss: {actor.influence}
                      </Badge>
                      {actor.waitingFor && (
                        <span className="text-xs text-amber-400">Wartet auf: {actor.waitingFor}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* RISIKEN */}
        {topRisks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="panel-card overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-zinc-400" />
              <h3 className="text-lg font-semibold">Risiken</h3>
              <Badge variant="neutral" className="ml-auto">{risks.length}</Badge>
            </div>
            <div className="p-6 space-y-4">
              {topRisks.map((risk, index) => (
                <div key={index} className="border-l-4 border-l-rose-500 pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-zinc-200">{risk.title}</span>
                    <Badge variant={risk.severity === 'high' ? 'rose' : risk.severity === 'medium' ? 'amber' : 'neutral'} className="text-xs">
                      {risk.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-500">{risk.explanation}</p>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </div>

      {/* SZENARIEN */}
      {decisionOptions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="panel-card overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Szenarien & Entscheidungsoptionen</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {decisionOptions.map((option, index) => (
              <div key={index} className="panel-card bg-white/[0.02] p-4">
                <h4 className="font-medium text-zinc-200 mb-2">{option.title}</h4>
                <p className="text-sm text-zinc-400 mb-3">{option.outcome}</p>
                <div className="flex items-center gap-2">
                  <Badge variant={option.riskLevel === 'high' ? 'rose' : option.riskLevel === 'medium' ? 'amber' : 'success'} className="text-xs">
                    Risiko: {option.riskLevel}
                  </Badge>
                </div>
                <p className="text-xs text-zinc-500 mt-2 italic">{option.recommendation}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* EMPFOHLENE AKTIONEN */}
      {actions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="panel-card overflow-hidden"
        >
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <ListTodo className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Empfohlene Aktionen</h3>
            <Badge variant="neutral" className="ml-auto">{actions.length}</Badge>
          </div>
          <div className="p-6 space-y-3">
            {actions.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-200">{action.title}</div>
                  <div className="text-sm text-zinc-500">Verantwortlich: {action.owner}</div>
                </div>
                <Badge variant={action.priority === 'high' ? 'rose' : action.priority === 'medium' ? 'amber' : 'neutral'} className="text-xs">
                  {action.priority}
                </Badge>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 5. KONTEXTKARTE */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <ContextQuestionsCard
          questions={contextQuestions}
          missingContext={quality.missingContext}
          confidence={quality.confidence}
          onSubmitAnswers={handleUpdateWithAnswers}
          isUpdating={isUpdating}
          updateError={updateError}
          onRetry={() => setUpdateError(null)}
        />
      </motion.section>

      {/* 6. PROJEKTVERLAUF */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
      >
        <ProjectHistoryPanel twin={twin} />
      </motion.section>

      {/* 7. TECHNISCHE ANALYSE (eingeklappt) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="panel-card opacity-60 hover:opacity-100 transition-opacity"
      >
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-3">
            <Badge variant="neutral">Debug</Badge>
            <span className="text-zinc-500 text-sm">Technische Analyse anzeigen</span>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-zinc-500 transition-transform ${
              showTechnicalDetails ? 'rotate-180' : ''
            }`}
          />
        </button>
        <AnimatePresence>
          {showTechnicalDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 pt-0 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <TechnicalSection
                    title="Qualität"
                    items={[
                      ['Input Quality', quality.inputQuality],
                      ['Actionable', quality.isActionable ? 'Ja' : 'Nein'],
                      ['Confidence', quality.confidence],
                      ['Missing Context', quality.missingContext.join(', ') || 'Keiner']
                    ]}
                  />
                  <TechnicalSection
                    title="Projekt"
                    items={[
                      ['Status', project.status],
                      ['Typ', project.type],
                      ['Aktualisiert', new Date(twin.updatedAt).toLocaleString('de-DE')]
                    ]}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <RefineContextModal
        isOpen={showRefineModal}
        onClose={() => setShowRefineModal(false)}
        onSubmit={handleManualUpdate}
        projectTitle={project.title}
        isProcessing={isUpdating}
        error={updateError}
      />
    </div>
  )
}

function TechnicalSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-zinc-300">{title}</h4>
      {items.map(([label, value]) => (
        <div key={label} className="flex justify-between text-sm">
          <span className="text-zinc-500">{label}</span>
          <span className="text-zinc-200">{value}</span>
        </div>
      ))}
    </div>
  )
}
