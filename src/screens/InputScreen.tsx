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
  
  // NEUE LOGIK: Speicherbar wenn Projektwille erkennbar (Titel vorhanden oder Input > 10 Zeichen)
  const hasProjectIntent = Boolean(analysis?.project?.title && analysis.project.title !== 'Unbenanntes Projekt') || text.trim().length > 10
  const isActionable = hasProjectIntent // Früher: analysis?.quality.isActionable ?? false
  const needsClarification = analysis?.quality.confidence === 'low' || analysis?.quality.inputQuality === 'insufficient'
  const isDiscovery = needsClarification && isActionable

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
      
      // Robust: Prüfe ob result gültig ist
      if (!result) {
        throw new Error('Analyse lieferte kein Ergebnis zurück')
      }
      
      // Robust: Prüfe ob analysis vorhanden ist
      if (!result.analysis) {
        throw new Error('Analyse enthält keine Daten')
      }
      
      // Robust: Prüfe ob projectId vorhanden ist
      if (!result.projectId) {
        console.warn('[InputScreen] Warning: Backend returned no projectId, using fallback')
        // Fallback: Erzeuge eine ID aus dem Titel oder Timestamp
        result.projectId = `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Intelligente Titel-Extraktion aus Input
      const inputText = text.trim()
      const extractedTitle = result.analysis.project?.title && result.analysis.project.title !== 'Unbenanntes Projekt'
        ? result.analysis.project.title
        : (inputText.length > 0 
            ? inputText.replace(/^(Ich möchte|Ich will|Ich muss|Ich plane|Ich mache|Ich erstelle)\s*/i, '').replace(/\.$/, '').trim()
            : 'Neues Projekt')
      
      // Discovery-Status ermitteln
      const discoveryMode = (
        result.analysis.quality?.confidence === 'low' || 
        result.analysis.quality?.inputQuality === 'insufficient'
      ) && inputText.length > 10
      
      // Defensive Normalisierung des Analysis-Objekts
      const normalizedAnalysis: ProjectTwinAnalysis = {
        ...result.analysis,
        // Sichere quality Felder
        quality: {
          inputQuality: result.analysis.quality?.inputQuality || 'insufficient',
          isActionable: Boolean(result.analysis.quality?.isActionable),
          confidence: result.analysis.quality?.confidence || 'low',
          missingContext: Array.isArray(result.analysis.quality?.missingContext) 
            ? result.analysis.quality.missingContext 
            : [],
          reason: result.analysis.quality?.reason || 'Keine Bewertung verfügbar'
        },
        // Sichere meta Felder
        meta: {
          domain: result.analysis.meta?.domain || 'general',
          analysisMode: result.analysis.meta?.analysisMode || 'openclaw-kimi',
          promptVersion: result.analysis.meta?.promptVersion || 'unknown',
          generatedAt: result.analysis.meta?.generatedAt || new Date().toISOString()
        },
        // Sichere project Felder - mit intelligenter Titel-Extraktion aus Input
        project: {
          title: extractedTitle,
          description: result.analysis.project?.description || '',
          type: result.analysis.project?.type || 'general',
          status: discoveryMode ? 'active' : (result.analysis.project?.status || 'active')
        },
        // Sichere nextMove Felder - deadline ist optional (string | null)
        nextMove: {
          title: result.analysis.nextMove?.title || 'Nächster Schritt planen',
          reason: result.analysis.nextMove?.reason || 'Keine nächste Aktion definiert',
          effort: result.analysis.nextMove?.effort || 'medium',
          impact: result.analysis.nextMove?.impact || 'medium',
          deadline: result.analysis.nextMove?.deadline ?? null
        },
        // Sichere Listen
        actors: Array.isArray(result.analysis.actors) ? result.analysis.actors : [],
        dependencies: Array.isArray(result.analysis.dependencies) ? result.analysis.dependencies : [],
        risks: Array.isArray(result.analysis.risks) ? result.analysis.risks : [],
        scenarios: Array.isArray(result.analysis.scenarios) ? result.analysis.scenarios : [],
        actions: Array.isArray(result.analysis.actions) ? result.analysis.actions : []
      }
      
      console.log('[InputScreen] Normalized analysis:', normalizedAnalysis)
      setAnalysis(normalizedAnalysis)
      setProjectId(result.projectId)
    } catch (err) {
      const message = err instanceof ProjectAnalysisError ? err.message : 'Die Analyse konnte nicht durchgeführt werden.'
      console.error('[InputScreen] Analyze error:', err)
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
                      {isDiscovery
                        ? 'Projektidee erkannt. Dieses Projekt kann gespeichert und im nächsten Schritt konkretisiert werden.'
                        : isActionable
                          ? 'Die Analyse ist speicherfähig und kann als lokaler Twin übernommen werden.'
                          : 'Die Analyse ist noch nicht speicherfähig. Ergänze den Input, bevor ein Twin angelegt wird.'}
                    </p>
                  </div>
                  <Button disabled={!isActionable} onClick={() => analysis && projectId && onCreateTwin(text, analysis, projectId)}>
                    <ArrowRight className="w-4 h-4" />
                    {isDiscovery ? 'Projekt anlegen & konkretisieren' : (isActionable ? 'Project Twin öffnen' : 'Input ergänzen')}
                  </Button>
                </div>

                <div className="lp-card lp-card--padded">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={isActionable ? 'success' : 'rose'}>Speicherbar: {isActionable ? 'ja' : 'nein'}</Badge>
                    {isDiscovery && (
                      <Badge variant="amber">Reifegrad: niedrig (Discovery)</Badge>
                    )}
                    <Badge variant="neutral">Input: {analysis.quality.inputQuality}</Badge>
                    <Badge variant="neutral">Confidence: {analysis.quality.confidence}</Badge>
                    <Badge variant="neutral">Domain: {analysis.meta.domain}</Badge>
                  </div>
                  <p className="text-sm text-[var(--lp-muted)]">{analysis.quality.reason}</p>
                  {needsClarification && analysis.quality.missingContext.length > 0 ? (
                    <div className="text-sm text-[var(--lp-text)] mt-2">
                      {isDiscovery 
                        ? `Zur Konkretisierung: ${analysis.quality.missingContext.join(', ')}` 
                        : `Es fehlen noch: ${analysis.quality.missingContext.join(', ')}`}
                    </div>
                  ) : null}
                  {isDiscovery && (
                    <div className="text-xs text-amber-400 mt-2">
                      ℹ️ Dieses Projekt wurde aus einer frühen Projektidee erstellt und kann im nächsten Schritt weiter konkretisiert werden.
                    </div>
                  )}
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
