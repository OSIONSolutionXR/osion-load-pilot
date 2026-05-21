import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Zap, Users, ChevronDown, Target, Route, ShieldAlert, ListTodo, CheckCircle2, Clock, RefreshCw } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import ContextQuestionsCard from '../components/twin/ContextQuestionsCard'
import RefineContextModal from '../components/twin/RefineContextModal'
import ProjectHistoryTimeline from '../components/twin/ProjectHistoryTimeline'
import { generateContextQuestions } from '../lib/contextQuestions'
import type { StoredProjectTwin } from '../lib/projectTwinStore'
import { updateProjectTwin, buildAdditionalInputFromAnswers, buildContextAnswers } from '../services/projectTwinUpdateApi'

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

  // Schritt 4: Handler für Context-Update mit Antworten
  const handleUpdateWithAnswers = useCallback(async (answers: Record<string, string>) => {
    if (!twin || !analysis) return
    
    setIsUpdating(true)
    setUpdateError(null)

    try {
      // Generiere Fragen für den Build
      const questions = generateContextQuestions(
        analysis.quality.missingContext,
        twin.originalInput || '',
        analysis.project.type
      )
      
      // Baue additionalInput aus Antworten
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

      // Berechne neuen Progress
      const progressIncrease = calculateProgressIncrease(
        analysis!.quality,
        response.analysis.quality
      )
      const newProgress = {
        ...twin.progress,
        percent: Math.min(100, twin.progress.percent + progressIncrease),
        stage: determineProgressStage(response.analysis.quality) as import('../types/projectTwinV2').ProgressStage,
        updatedAt: new Date().toISOString()
      }

      // Erstelle Update-Eintrag
      const updateEntry = {
        id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        input: additionalInput,
        summary: response.updateSummary || `Project Twin geschärft: ${response.meta.fieldsModified.join(', ')}`,
        source: 'context_form' as const,
        changedFields: response.changedFields || response.meta.fieldsModified.map(field => ({
          field,
          before: 'vorher',
          after: 'nachher'
        })),
        previousProgressPercent: twin.progress.percent,
        newProgressPercent: newProgress.percent,
        previousNextMoveTitle: analysis!.nextMove.title,
        newNextMoveTitle: response.analysis.nextMove.title
      }

      // Erstelle aktualisierten Twin
      const updatedTwin: StoredProjectTwin = {
        ...twin,
        updatedAt: new Date().toISOString(),
        latestInput: additionalInput.trim(),
        analysis: response.analysis,
        progress: newProgress,
        updates: [...twin.updates, updateEntry],
        // Aktualisiere Kontextfragen - entferne beantwortete
        contextQuestions: questions.map(q => ({
          ...q,
          answer: answers[q.id] || q.answer,
          status: answers[q.id] ? 'answered' as const : q.status,
          answeredAt: answers[q.id] ? new Date().toISOString() : q.answeredAt
        }))
      }

      onTwinUpdate?.(updatedTwin)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
      throw err // Re-throw für ContextQuestionsCard
    } finally {
      setIsUpdating(false)
    }
  }, [twin, analysis, onTwinUpdate])

  // Hilfsfunktion: Progress-Zuwachs berechnen
  function calculateProgressIncrease(
    oldQuality: NonNullable<typeof analysis>['quality'],
    newQuality: NonNullable<typeof analysis>['quality']
  ): number {
    let increase = 0
    
    // Confidence-Steigerung
    const confidenceMap = { low: 0, medium: 1, high: 2 }
    const oldConf = confidenceMap[oldQuality.confidence]
    const newConf = confidenceMap[newQuality.confidence]
    if (newConf > oldConf) {
      increase += 10 * (newConf - oldConf)
    }
    
    // Missing Context reduziert
    const contextReduction = oldQuality.missingContext.length - newQuality.missingContext.length
    if (contextReduction > 0) {
      increase += 10 * contextReduction
    }
    
    // Cap auf maximal 25 pro Update
    return Math.min(25, increase)
  }

  // Hilfsfunktion: Progress-Stage bestimmen
  function determineProgressStage(
    quality: NonNullable<typeof analysis>['quality']
  ): string {
    if (quality.confidence === 'high' && quality.missingContext.length === 0) {
      return 'clarified'
    }
    if (quality.confidence !== 'low' && quality.missingContext.length < 3) {
      return 'needs_context'
    }
    return 'created'
  }

  const handleRefineSubmit = useCallback(async (additionalInput: string) => {
    if (!twin || !analysis) return
    
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const response = await updateProjectTwin({
        existingTwin: analysis,
        additionalInput,
        originalInput: twin.originalInput || (twin as unknown as { sourceInput?: string }).sourceInput || '',
        updateMode: 'refine_existing_twin'
      })

      // Create updated twin with history
      const updatedTwin: StoredProjectTwin = {
        ...twin,
        updatedAt: new Date().toISOString(),
        latestInput: additionalInput.trim(),
        analysis: response.analysis,
        progress: {
          ...twin.progress,
          percent: twin.progress.percent + 5,
          updatedAt: new Date().toISOString()
        },
        updates: [
          ...(twin.updates || []),
          {
            id: `upd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            input: additionalInput,
            summary: `Project Twin aktualisiert: ${response.meta.fieldsModified.join(', ')}`,
            source: 'manual_update',
            changedFields: response.meta.fieldsModified.map(field => ({
              field,
              before: 'vorher',
              after: 'nachher'
            })),
            previousProgressPercent: twin.progress.percent,
            newProgressPercent: twin.progress.percent + 5
          }
        ]
      }

      onTwinUpdate?.(updatedTwin)
      setShowRefineModal(false)
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Update fehlgeschlagen')
    } finally {
      setIsUpdating(false)
    }
  }, [twin, analysis, onTwinUpdate])

  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <Panel className="panel-premium p-8 md:p-10">
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
          </div>

          <div className="panel-card p-8 md:p-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-[#ff006e]/20 border border-white/10">
              <Zap className="w-7 h-7 text-violet-300" />
            </div>
            <h1 className="text-headline mb-3">Noch kein Project Twin erstellt</h1>
            <p className="text-body max-w-2xl mx-auto mb-8">
              Erfasse zuerst eine Projektlage, damit Load Pilot einen Project Twin erzeugen kann.
            </p>
            <Button onClick={onNewInput ?? onBack}>
              Neuen Input erfassen
            </Button>
          </div>
        </Panel>
      </motion.div>
    )
  }

  const { project, nextMove, actors, dependencies, risks, scenarios, actions, quality } = analysis

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
          {twin && (
            <>
              <div className="h-8 w-px bg-white/10" />
              <Button variant="ghost" onClick={() => setShowRefineModal(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Aktualisieren
              </Button>
            </>
          )}
        </div>

        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{project.title}</h1>
          <p className="text-lg text-zinc-400 mb-6 leading-relaxed">{project.description}</p>

          {/* Status Chips - reduziert */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="blue">{project.status}</Badge>
            <Badge variant="neutral">{project.type}</Badge>
            {quality.isActionable && <Badge variant="violet">speicherbar</Badge>}
            <Badge variant={quality.confidence === 'high' ? 'blue' : quality.confidence === 'medium' ? 'neutral' : 'rose'}>
              confidence: {quality.confidence}
            </Badge>
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

      {/* 3. KONTEXT-KARTE (wenn confidence nicht high oder missingContext vorhanden) */}
      {analysis && (quality.missingContext.length > 0 || quality.confidence !== 'high') && quality.isActionable && twin && (
        <ContextQuestionsCard
          questions={generateContextQuestions(
            quality.missingContext,
            twin.originalInput || '',
            project.type
          )}
          missingContext={quality.missingContext}
          confidence={quality.confidence}
          onSubmitAnswers={handleUpdateWithAnswers}
          isUpdating={isUpdating}
          updateError={updateError}
          onRetry={() => setUpdateError(null)}
        />
      )}

      {/* 4. KRITISCHE ABHÄNGIGKEITEN ALS PROZESSKETTE */}
      {criticalDeps.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Route className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Kritische Abfolge</h3>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {criticalDeps.map((dep, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className={`flex-1 panel-card p-5 ${dep.isBlocker ? 'border-l-4 border-l-[#fb7185]' : ''}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-zinc-200">{dep.from}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-sm font-medium text-zinc-200">{dep.to}</span>
                  </div>
                  <p className="text-sm text-zinc-500">{dep.explanation}</p>
                  {dep.isBlocker && (
                    <Badge variant="rose" className="mt-3">Blocker</Badge>
                  )}
                </div>
                {index < criticalDeps.length - 1 && (
                  <div className="hidden md:flex items-center text-zinc-600">
                    <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* ZWEISPALTIG: AKTEURE & RISIKEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 5. AKTEURE KOMPAKT */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-zinc-400" />
            <h3 className="text-lg font-semibold">Beteiligte</h3>
          </div>

          <div className="space-y-3">
            {actors.map((actor, index) => (
              <div key={index} className="flex items-center justify-between panel-card p-4">
                <div>
                  <div className="font-medium text-zinc-200">{actor.name}</div>
                  <div className="text-sm text-zinc-500">{actor.role}</div>
                </div>
                {actor.waitingFor && (
                  <Badge variant="amber" className="text-xs">Wartet auf {actor.waitingFor}</Badge>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* 6. RISIKEN FOKUSSIERT */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="w-5 h-5 text-[#fb7185]" />
            <h3 className="text-lg font-semibold">Kritische Risiken</h3>
          </div>

          <div className="space-y-4">
            {topRisks.map((risk, index) => (
              <div key={index} className="panel-card p-5 border-l-4 border-l-[#fb7185]/50">
                <div className="flex items-center justify-between mb-2">
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
      </div>

      {/* 7. EMPFOHLENE AKTIONEN ALS TODO-LISTE */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <ListTodo className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-semibold">Empfohlene Aktionen</h3>
        </div>

        <div className="space-y-2">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-4 panel-card p-4 hover:bg-white/[0.04] transition-colors">
              <div className="flex-shrink-0">
                {action.priority === 'high' ? (
                  <div className="w-6 h-6 rounded-full bg-[#fb7185]/20 flex items-center justify-center border border-[#fb7185]/30">
                    <span className="text-xs font-bold text-[#fb7185]">H</span>
                  </div>
                ) : action.priority === 'medium' ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                    <span className="text-xs font-bold text-amber-400">M</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-500/20 flex items-center justify-center border border-zinc-500/30">
                    <span className="text-xs font-bold text-zinc-400">L</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-zinc-200">{action.title}</div>
                <div className="text-sm text-zinc-500">{action.owner}</div>
              </div>
              {action.messageDraft && (
                <Badge variant="violet" className="text-xs">Entwurf</Badge>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      {/* 8. ENTSCHEIDUNGSOPTIONEN */}
      {decisionOptions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-semibold">Entscheidungsoptionen</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decisionOptions.map((option, index) => (
              <div key={index} className={`panel-card p-6 ${index === 0 ? 'border-2 border-violet-500/30 bg-violet-500/5' : ''}`}>
                {index === 0 && (
                  <Badge variant="violet" className="mb-3">Empfohlen</Badge>
                )}
                <h4 className="font-semibold text-zinc-200 mb-3">{option.title}</h4>
                <p className="text-sm text-zinc-400 mb-4">{option.outcome}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${option.riskLevel === 'high' ? 'text-[#fb7185]' : option.riskLevel === 'low' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    Risiko: {option.riskLevel}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-3 pt-3 border-t border-white/5">{option.recommendation}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 9. PROJEKTVERLAUF (HISTORY) */}
      {twin && (
        <ProjectHistoryTimeline 
          updates={(twin.updates || []) as unknown as import('../types/projectTwin').ProjectTwinUpdate[]} 
          createdAt={twin.createdAt} 
        />
      )}

      {/* 10. TECHNISCHE ANALYSE (STANDARDMÄSSIG GESCHLOSSEN) */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
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
          <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
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
                  <TechnicalSection title="Qualität" items={[
                    ['Input Quality', quality.inputQuality],
                    ['Actionable', quality.isActionable ? 'Ja' : 'Nein'],
                    ['Confidence', quality.confidence],
                    ['Missing Context', quality.missingContext.join(', ') || 'Keiner']
                  ]} />
                  <TechnicalSection title="Meta" items={[
                    ['Domain', analysis.meta?.domain || 'N/A'],
                    ['Prompt Version', analysis.meta?.promptVersion || 'N/A'],
                    ['Gespeichert', twin?.createdAt ? new Date(twin.createdAt).toLocaleString() : 'N/A'],
                    ['Aktualisiert', twin?.updatedAt ? new Date(twin.updatedAt).toLocaleString() : 'N/A'],
                    ['Versionen', String((twin?.updates?.length || 0) + 1)],
                    ['Quelle', twin?.originalInput ? `"${twin.originalInput.substring(0, 50)}..."` : 'N/A']
                  ]} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* REFINE CONTEXT MODAL */}
      <RefineContextModal
        isOpen={showRefineModal}
        onClose={() => setShowRefineModal(false)}
        onSubmit={handleRefineSubmit}
        projectTitle={project.title}
        isProcessing={isUpdating}
      />
    </div>
  )
}

// Helper Components

function TechnicalSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <div>
      <div className="text-sm font-medium text-zinc-300 mb-3">{title}</div>
      <div className="space-y-2">
        {items.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1">
            <div className="text-xs text-zinc-500 uppercase">{label}</div>
            <div className="text-sm text-zinc-400 font-mono">{value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
