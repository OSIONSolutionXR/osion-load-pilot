import { motion } from 'motion/react'
import { Sparkles, X, Loader2, AlertTriangle, ArrowRight, Users, GitBranch, ShieldAlert, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Panel } from '../components/ui/Panel'
import { analyzeProjectInput, ProjectAnalysisError } from '../services/projectAnalysisApi'
import type { ProjectTwinAnalysis } from '../types/projectTwin'

interface InputScreenProps {
  onCreateTwin: (sourceInput: string, analysis: ProjectTwinAnalysis) => void
  onCancel: () => void
}

export default function InputScreen({ onCreateTwin, onCancel }: InputScreenProps) {
  const [text, setText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ProjectTwinAnalysis | null>(null)
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

    try {
      const result = await analyzeProjectInput(text)
      setAnalysis(result)
    } catch (err) {
      const message = err instanceof ProjectAnalysisError ? err.message : 'Die Analyse konnte nicht durchgeführt werden.'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <Panel>
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onCancel}>
            <X className="w-5 h-5" />
          </Button>

          <div className="h-8 w-px bg-white/10" />

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#ff006e]" />
              <Badge variant="violet">Neuer Input</Badge>
            </div>
            <h1 className="text-headline">Projektlage erfassen</h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-label text-zinc-500">Was passiert gerade?</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Beschreibe konkret, was du erreichen willst, was offen ist, wer beteiligt ist und welche Frist oder Entscheidung ansteht."
              className="w-full h-44 p-5 rounded-2xl bg-white/[0.03] border border-white/10 text-zinc-200 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors text-base leading-relaxed"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-[#fb7185]/30 bg-[#fb7185]/8 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#fb7185] mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-[#fb7185] mb-1">Analysefehler</div>
                <p className="text-sm text-zinc-300">{error}</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/8 p-4 flex items-start gap-3">
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
            <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="text-title mb-1">Project-Twin Preview</h3>
                  <p className="text-sm text-zinc-500">
                    {isActionable
                      ? 'Die Analyse ist speicherfähig und kann als lokaler Twin übernommen werden.'
                      : 'Die Analyse ist noch nicht speicherfähig. Ergänze den Input, bevor ein Twin angelegt wird.'}
                  </p>
                </div>
                <Button disabled={!isActionable} onClick={() => onCreateTwin(text, analysis)}>
                  <ArrowRight className="w-4 h-4" />
                  {isActionable ? 'Project Twin öffnen' : 'Input ergänzen'}
                </Button>
              </div>

              <PreviewCard title="Qualität & Speicherbarkeit" icon={AlertTriangle}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isActionable ? 'blue' : 'rose'}>Speicherbar: {isActionable ? 'ja' : 'nein'}</Badge>
                    <Badge variant="neutral">Input: {analysis.quality.inputQuality}</Badge>
                    <Badge variant="neutral">Confidence: {analysis.quality.confidence}</Badge>
                    <Badge variant="neutral">Domain: {analysis.meta.domain}</Badge>
                  </div>
                  <p className="text-sm text-zinc-400">{analysis.quality.reason}</p>
                  {!isActionable && analysis.quality.missingContext.length > 0 ? (
                    <div className="text-sm text-zinc-300">
                      Es fehlen noch: {analysis.quality.missingContext.join(', ')}
                    </div>
                  ) : null}
                </div>
              </PreviewCard>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PreviewCard title="Erkanntes Projekt" icon={Sparkles}>
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-zinc-100">{analysis.project.title}</div>
                    <p className="text-sm text-zinc-400">{analysis.project.description}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="neutral">Typ: {analysis.project.type}</Badge>
                      <Badge variant={analysis.project.status === 'blocked' ? 'rose' : 'blue'}>
                        Status: {analysis.project.status}
                      </Badge>
                    </div>
                  </div>
                </PreviewCard>

                <PreviewCard title="Nächster wirksamster Schritt" icon={Waypoints}>
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-zinc-100">{analysis.nextMove.title}</div>
                    <p className="text-sm text-zinc-400">{analysis.nextMove.reason}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="neutral">Aufwand: {analysis.nextMove.effort}</Badge>
                      <Badge variant="neutral">Impact: {analysis.nextMove.impact}</Badge>
                      <Badge variant="neutral">Deadline: {analysis.nextMove.deadline ?? 'offen'}</Badge>
                    </div>
                  </div>
                </PreviewCard>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <PreviewListCard
                  title="Erkannte Akteure"
                  icon={Users}
                  items={analysis.actors.map((actor, index) => ({
                    key: `${actor.name}-${index}`,
                    title: `${actor.name} · ${actor.role}`,
                    meta: `Einfluss: ${actor.influence}`,
                    body: actor.waitingFor ? `Wartet auf: ${actor.waitingFor}` : 'Keine direkte Warteinformation erkannt.'
                  }))}
                />

                <PreviewListCard
                  title="Erkannte Abhängigkeiten"
                  icon={GitBranch}
                  items={analysis.dependencies.map((dependency, index) => ({
                    key: `${dependency.from}-${dependency.to}-${index}`,
                    title: `${dependency.from} → ${dependency.to}`,
                    meta: `${dependency.status}${dependency.isBlocker ? ' · Blocker' : ''}`,
                    body: dependency.explanation
                  }))}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <PreviewListCard
                  title="Risiken"
                  icon={ShieldAlert}
                  items={analysis.risks.map((risk, index) => ({
                    key: `${risk.title}-${index}`,
                    title: risk.title,
                    meta: `Severity: ${risk.severity}`,
                    body: risk.explanation
                  }))}
                />

                <PreviewListCard
                  title="Szenarien"
                  icon={Sparkles}
                  items={analysis.scenarios.map((scenario, index) => ({
                    key: `${scenario.title}-${index}`,
                    title: scenario.title,
                    meta: `Risiko: ${scenario.riskLevel}`,
                    body: `${scenario.outcome} · Empfehlung: ${scenario.recommendation}`
                  }))}
                />

                <PreviewListCard
                  title="Empfohlene Aktionen"
                  icon={ArrowRight}
                  items={analysis.actions.map((action, index) => ({
                    key: `${action.title}-${index}`,
                    title: action.title,
                    meta: `Owner: ${action.owner} · Priorität: ${action.priority}`,
                    body: action.messageDraft ?? 'Direkt umsetzbare Aktion ohne Textvorlage.'
                  }))}
                />
              </div>
            </div>
          )}
        </motion.div>
      </Panel>
    </motion.div>
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
    <div className="panel-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-violet-400" />
        <span className="text-label text-zinc-500">{title}</span>
      </div>
      {children}
    </div>
  )
}

function PreviewListCard({
  title,
  icon: Icon,
  items
}: {
  title: string
  icon: typeof Sparkles
  items: Array<{ key: string; title: string; meta: string; body: string }>
}) {
  return (
    <div className="panel-card p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-violet-400" />
        <span className="text-label text-zinc-500">{title}</span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm text-zinc-500">Keine Daten erkannt.</div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <div className="font-medium text-zinc-200 mb-1">{item.title}</div>
              <div className="text-xs uppercase tracking-[0.16em] text-zinc-500 mb-2">{item.meta}</div>
              <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
