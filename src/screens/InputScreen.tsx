import { motion } from 'motion/react'
import { Sparkles, X, Loader2, AlertTriangle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { analyzeProjectInput, ProjectAnalysisError } from '../services/projectAnalysisApi'
import type { ProjectTwinAnalysis } from '../types/projectTwin'
import { FadeIn } from '../components/animations/MicroAnimations'

interface InputScreenProps {
  onCreateTwin: (sourceInput: string, analysis: ProjectTwinAnalysis, projectId: string) => void
  onCancel: () => void
}

export default function InputScreen({ onCreateTwin, onCancel }: InputScreenProps) {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProjectTwinAnalysis | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isActionable = analysis?.quality.isActionable ?? false

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('Bitte beschreibe zuerst die aktuelle Projektlage.')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setAnalysis(null)
    setProjectId(null)

    try {
      const result = await analyzeProjectInput(text)
      setAnalysis(result.analysis)
      setProjectId(result.projectId)
    } catch (err) {
      const message = err instanceof ProjectAnalysisError ? err.message : 'Die Analyse konnte nicht durchgeführt werden.'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <FadeIn direction="up">
      <div className="input-page">
        <section className="input-card">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={onCancel} className="lp-button-secondary flex items-center gap-2">
              <X className="w-5 h-5" />
            </button>

            <div className="h-8 w-px bg-[var(--lp-border)]" />

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[var(--lp-magenta)]" />
                <Badge variant="violet">Projektlage erfassen</Badge>
              </div>
              <h1 className="project-command-header__title">Was soll Load Pilot analysieren?</h1>
            </div>
          </div>

          <p className="project-command-header__description mb-6">
            Beschreibe Projekt, Ziel, aktuelle Lage, offene Fragen und nächste Entscheidung.
          </p>

          <div className="space-y-6">
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Beschreibe konkret, was du erreichen willst, was offen ist, wer beteiligt ist und welche Frist oder Entscheidung ansteht."
                className="w-full min-h-[220px] p-5 rounded-2xl bg-[rgba(255,255,255,0.045)] border border-[var(--lp-border)] text-[var(--lp-text)] placeholder:text-[var(--lp-faint)] resize-none focus:outline-none focus:border-violet-500/50 transition-colors text-base leading-relaxed"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-rose-400 mb-1">Analysefehler</div>
                  <p className="text-sm text-zinc-300">{error}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-violet-300 mb-1">Analyse läuft</div>
                  <p className="text-sm text-zinc-300">OSION analysiert Projektlage über OpenClaw …</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAnalyze} disabled={!text.trim() || isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Projektlage wird analysiert
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Projektlage analysieren
                  </>
                )}
              </Button>

              <Button variant="secondary" onClick={onCancel}>
                Abbrechen
              </Button>
            </div>
          </div>

          <motion.div
            initial={false}
            animate={{
              height: analysis ? 'auto' : 0,
              opacity: analysis ? 1 : 0
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            {analysis && (
              <div className="mt-8 pt-8 border-t border-[var(--lp-border)] space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-1">Project-Twin Preview</h3>
                    <p className="text-sm text-[var(--lp-muted)]">
                      {isActionable
                        ? 'Die Analyse ist speicherfähig und kann als lokaler Twin übernommen werden.'
                        : 'Die Analyse ist noch nicht speicherfähig. Ergänze den Input, bevor ein Twin angelegt wird.'}
                    </p>
                  </div>
                  <Button disabled={!isActionable} onClick={() => analysis && projectId && onCreateTwin(text, analysis, projectId)}>
                    <ArrowRight className="w-4 h-4" />
                    {isActionable ? 'Project Twin öffnen' : 'Input ergänzen'}
                  </Button>
                </div>

                <div className="lp-card lp-card--padded">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={isActionable ? 'blue' : 'rose'}>Speicherbar: {isActionable ? 'ja' : 'nein'}</Badge>
                    <Badge variant="neutral">Input: {analysis.quality.inputQuality}</Badge>
                    <Badge variant="neutral">Confidence: {analysis.quality.confidence}</Badge>
                    <Badge variant="neutral">Domain: {analysis.meta.domain}</Badge>
                  </div>
                  <p className="text-sm text-[var(--lp-muted)]">{analysis.quality.reason}</p>
                  {!isActionable && analysis.quality.missingContext.length > 0 ? (
                    <div className="text-sm text-[var(--lp-text)] mt-2">
                      Es fehlen noch: {analysis.quality.missingContext.join(', ')}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <PreviewCard title="Erkanntes Projekt" icon={Sparkles}>
                    <div className="space-y-2">
                      <div className="text-xl font-semibold text-[var(--lp-text)]">{analysis.project.title}</div>
                      <p className="text-sm text-[var(--lp-muted)]">{analysis.project.description}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="neutral">Typ: {analysis.project.type}</Badge>
                        <Badge variant={analysis.project.status === 'blocked' ? 'rose' : 'blue'}>
                          Status: {analysis.project.status}
                        </Badge>
                      </div>
                    </div>
                  </PreviewCard>

                  <PreviewCard title="Nächster wirksamster Schritt" icon={ArrowRight}>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-[var(--lp-text)]">{analysis.nextMove.title}</div>
                      <p className="text-sm text-[var(--lp-muted)]">{analysis.nextMove.reason}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="neutral">Aufwand: {analysis.nextMove.effort}</Badge>
                        <Badge variant="neutral">Impact: {analysis.nextMove.impact}</Badge>
                        <Badge variant="neutral">Deadline: {analysis.nextMove.deadline ?? 'offen'}</Badge>
                      </div>
                    </div>
                  </PreviewCard>
                </div>
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </FadeIn>
  )
}

function PreviewCard({
  title,
  icon: Icon,
  children
}: {
  title: string
  icon: typeof Sparkles
  children: React.ReactNode
}) {
  return (
    <div className="lp-card lp-card--padded">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-violet-400" />
        <span className="text-label text-[var(--lp-muted)]">{title}</span>
      </div>
      {children}
    </div>
  )
}
