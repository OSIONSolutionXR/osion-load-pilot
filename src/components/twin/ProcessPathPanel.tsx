import { motion } from 'motion/react'
import { GitBranch, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Badge } from '../ui/Badge'
import type { StoredProjectTwin } from '../../lib/projectTwinStore'
import type { ProjectTwinAnalysis } from '../../types/projectTwin'
import type { ProcessStep } from '../../types/projectTwinV2'

export type ProcessStepStatus = 'done' | 'active' | 'blocked' | 'next' | 'pending' | 'skipped'

interface ProcessPathPanelProps {
  variant?: 'full' | 'compact'
  twin?: StoredProjectTwin | null
  analysis?: ProjectTwinAnalysis | null
}

function getProcessStatusLabel(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'Erledigt'
    case 'active':
      return 'Aktiv'
    case 'blocked':
      return 'Blockiert'
    case 'next':
      return 'Nächster Schritt'
    case 'skipped':
      return 'Übersprungen'
    default:
      return 'Ausstehend'
  }
}

function getStatusColorClasses(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'border-emerald-500/30 bg-emerald-500/8'
    case 'active':
      return 'border-violet-500/40 bg-violet-500/10'
    case 'blocked':
      return 'border-rose-500/40 bg-rose-500/10'
    case 'next':
      return 'border-amber-500/40 bg-amber-500/10'
    case 'skipped':
      return 'border-zinc-500/20 bg-zinc-500/5 opacity-60'
    default:
      return 'border-[var(--lp-border)] bg-[var(--lp-surface-soft)]'
  }
}

function getStatusBadgeClasses(status: ProcessStepStatus): string {
  switch (status) {
    case 'done':
      return 'bg-emerald-500/20 text-emerald-400'
    case 'active':
      return 'bg-violet-500/20 text-violet-400'
    case 'blocked':
      return 'bg-rose-500/20 text-rose-400'
    case 'next':
      return 'bg-amber-500/20 text-amber-400'
    case 'skipped':
      return 'bg-zinc-500/20 text-zinc-500'
    default:
      return 'bg-zinc-500/20 text-zinc-400'
  }
}

/**
 * Prüft ob ein Schritt-Titel generisch ist (z.B. "Schritt 1", "Schritt 2")
 */
function isGenericStepTitle(title: string): boolean {
  return /^schritt\s*\d+$/i.test(String(title || "").trim())
}

/**
 * Prüft ob ein Input wirklich Fahrzeug-bezogen ist (nicht nur "kaufen" enthält)
 * Phase 1 Fix: Verhindert falsche Fahrzeug-Schritte bei Projekten wie "NOVA SHELTER GRID"
 */
function isVehicleRelatedInput(title: string, description: string): boolean {
  const normalized = `${title} ${description}`.toLowerCase()
  
  // Starke Fahrzeug-Keywords (mindestens eines muss vorhanden sein)
  const strongVehicleKeywords = [
    'auto', 'pkw', 'fahrzeug', 'wagen', 'kraftwagen', 'kfz',
    'wohnwagen', 'wohnmobil', 'caravan', 'camper',
    'motorrad', 'roller', 'moped', 'bike',
    'lastwagen', 'lkw', 'transporter', 'van',
    'oldtimer', 'youngtimer', 'gebrauchtwagen', 'neuwagen',
    'leasing', 'finanzierung auto', 'autokauf'
  ]
  
  // Schwache Keywords (für zukünftige Erweiterung, aktuell nicht verwendet)
  // const weakKeywords = ['kaufen', 'mieten', 'leasing', 'finanzierung']
  
  const hasStrongKeyword = strongVehicleKeywords.some(k => normalized.includes(k))
  
  // Ausschluss-Kriterien (verhindern Fahrzeug-Erkennung)
  const exclusionKeywords = [
    'katastrophe', 'krise', 'notfall', 'überschwemmung', 'hochwasser',
    'infrastruktur', 'versorgung', 'shelter', 'grid', 'system',
    'netzwerk', 'kommunen', 'hilfsorganisation', 'einsatz',
    'resilienz', 'stromausfall', 'trinkwasser', 'sanitär'
  ]
  
  const hasExclusion = exclusionKeywords.some(k => normalized.includes(k))
  
  // Logik: Starkes Keyword nötig, Ausschluss verhindert Fahrzeug-Erkennung
  return hasStrongKeyword && !hasExclusion
}

/**
 * Ableitet Prozessschritte aus dem Twin-Projektdaten als Fallback
 * Phase 1 Fix: Robuste Domain-Erkennung mit Ausschlusskriterien
 */
function deriveProcessStepsFromTwin(twin: StoredProjectTwin | null): ProcessStep[] {
  if (!twin) return []
  
  const title = String(twin?.analysis?.project?.title || twin?.title || "").toLowerCase()
  const desc = String(twin?.analysis?.project?.description || twin?.description || "").toLowerCase()
  const combined = `${title} ${desc}`
  const timestamp = new Date().toISOString()
  
  // Hauskauf / Immobilien - spezifische Keywords
  if (combined.includes("haus") || combined.includes("wohnung") || combined.includes("immobilie") || 
      /\b(kauf|kaufen)\b/.test(combined) && (combined.includes("eigen") || combined.includes("wohn"))) {
    return [
      { id: "bedarf-zielbild", title: "Bedarf und Zielbild definieren", description: "Projektziel, Anforderungen, Einschränkungen und Entscheidungskriterien erfassen.", status: "pending", order: 1, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "budget-pruefen", title: "Budget und Finanzierungsrahmen prüfen", description: "Finanzielle Möglichkeiten und Kreditrahmen klären.", status: "pending", order: 2, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "anforderungen", title: "Objektanforderungen festlegen", description: "Must-haves und Nice-to-haves für die Immobilie definieren.", status: "pending", order: 3, dependsOn: ["bedarf-zielbild"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "markt-sondieren", title: "Markt und passende Immobilien sondieren", description: "Markt recherchieren und passende Objekte identifizieren.", status: "pending", order: 4, dependsOn: ["anforderungen", "budget-pruefen"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "finanzierung", title: "Finanzierung vorbereiten", description: "Kreditangebote einholen und Finanzierung absichern.", status: "pending", order: 5, dependsOn: ["budget-pruefen"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "besichtigung", title: "Besichtigung und Prüfung durchführen", description: "Objekte besichtigen und technisch/juristisch prüfen.", status: "pending", order: 6, dependsOn: ["markt-sondieren"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "kaufentscheidung", title: "Kaufentscheidung vorbereiten", description: "Vergleich und Entscheidungsgrundlage erstellen.", status: "pending", order: 7, dependsOn: ["besichtigung", "finanzierung"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "notar", title: "Notarielle Abwicklung vorbereiten", description: "Kaufvertrag vorbereiten und notarielle Schritte einleiten.", status: "pending", order: 8, dependsOn: ["kaufentscheidung"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    ]
  }
  
  // Auto / Fahrzeug - Phase 1 Fix: Nur bei echten Fahrzeug-Keywords
  if (isVehicleRelatedInput(title, desc)) {
    return [
      { id: "bedarf-pkw", title: "Bedarf und Nutzungsprofil definieren", description: "Verwendungszweck, Kilometerleistung, Passagiere definieren.", status: "pending", order: 1, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "budget-pkw", title: "Budgetverfügbarkeit prüfen", description: "Finanzierung oder Barkauf klären.", status: "pending", order: 2, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "kriterien-pkw", title: "Fahrzeugkriterien festlegen", description: "Marke, Modell, Ausstattung, Alter definieren.", status: "pending", order: 3, dependsOn: ["bedarf-pkw"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "markt-pkw", title: "Markt screenen", description: "Angebote recherchieren und vergleichen.", status: "pending", order: 4, dependsOn: ["kriterien-pkw", "budget-pkw"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "vergleich-pkw", title: "Fahrzeuge vergleichen", description: "Kandidaten gegenüberstellen und bewerten.", status: "pending", order: 5, dependsOn: ["markt-pkw"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "probefahrt", title: "Besichtigung und Probefahrt durchführen", description: "Fahrzeug prüfen und Testfahrt machen.", status: "pending", order: 6, dependsOn: ["vergleich-pkw"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "entscheidung-pkw", title: "Kaufentscheidung treffen", description: "Finalen Kandidaten auswählen.", status: "pending", order: 7, dependsOn: ["probefahrt"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
      { id: "abwicklung-pkw", title: "Kaufabwicklung durchführen", description: "Vertrag, Zahlung, Übergabe organisieren.", status: "pending", order: 8, dependsOn: ["entscheidung-pkw"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    ]
  }
  
  // Default Fallback
  return [
    { id: "projektziel", title: "Projektziel definieren", description: "Klares Ziel und Erfolgskriterien festlegen.", status: "pending", order: 1, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    { id: "anforderungen-allg", title: "Anforderungen und Einschränkungen sammeln", description: "Rahmenbedingungen und Anforderungen erfassen.", status: "pending", order: 2, dependsOn: [], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    { id: "loesungsweg", title: "Lösungsweg festlegen", description: "Vorgehen und Methode definieren.", status: "pending", order: 3, dependsOn: ["anforderungen-allg"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    { id: "umsetzung", title: "Umsetzung starten", description: "Projekt aktiv bearbeiten.", status: "pending", order: 4, dependsOn: ["loesungsweg"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    { id: "ergebnis", title: "Ergebnis prüfen", description: "Qualität und Zielerreichung verifizieren.", status: "pending", order: 5, dependsOn: ["umsetzung"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
    { id: "abschluss", title: "Abschluss oder nächste Iteration planen", description: "Projekt finalisieren oder nächste Phase planen.", status: "pending", order: 6, dependsOn: ["ergebnis"], blockerReason: "", linkedMeasureIds: [], updatedAt: timestamp },
  ]
}

/**
 * Normalisiert Prozessschritte aus verschiedenen Quellen im Twin
 */
function normalizeProcessSteps(twin: StoredProjectTwin | null): ProcessStep[] {
  if (!twin) return []

  // Mögliche Quellen für Prozessschritte
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const twinAny = twin as any
  const raw =
    twinAny?.processSteps ||
    twinAny?.processPath ||
    twinAny?.workflow ||
    twinAny?.criticalPath ||
    []

  const list = Array.isArray(raw) ? raw : []

  // Map zu validen ProcessStep-Objekten
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapped = (list as any[])
    .map((step: Record<string, unknown>, index: number) => {
      const rawTitle =
        step.title ||
        step.name ||
        step.label ||
        step.step ||
        step.phase ||
        ""

      const title = String(rawTitle).trim()

      // Filtere generische Schritte raus
      if (!title || isGenericStepTitle(title)) {
        return null
      }

      const statusRaw = String(
        step.status ||
        step.state ||
        step.phaseStatus ||
        step.progress ||
        ""
      ).toLowerCase()

      let status: ProcessStepStatus = "pending"

      if (["done", "completed", "complete", "erledigt", "abgeschlossen"].includes(statusRaw)) {
        status = "done"
      } else if (["active", "current", "aktuell", "in_progress", "running"].includes(statusRaw)) {
        status = "active"
      } else if (["blocked", "blocker", "kritisch", "critical", "gesperrt"].includes(statusRaw)) {
        status = "blocked"
      } else if (["next", "next_step", "nächster schritt", "naechster schritt"].includes(statusRaw)) {
        status = "next"
      } else if (["skipped", "irrelevant", "übersprungen", "uebersprungen"].includes(statusRaw)) {
        status = "skipped"
      }

      return {
        id: String(step.id || step.key || `process-step-${index + 1}`),
        title,
        description: String(step.description || step.reason || step.details || step.summary || ""),
        status,
        order: Number.isFinite(Number(step.order)) ? Number(step.order) : index + 1,
        blockerReason: String(step.blockerReason || step.blocker || ""),
        dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn.map(String) : [],
        linkedMeasureIds: Array.isArray(step.linkedMeasureIds) ? step.linkedMeasureIds.map(String) : [],
        updatedAt: String(step.updatedAt || twin?.updatedAt || "")
      }
    })
    .filter((s): s is ProcessStep => s !== null)
    .sort((a, b) => a.order - b.order)

  // Debug-Log
  console.log("[ProcessPath] normalized", {
    source: "twin.processSteps/processPath",
    stepCount: mapped.length,
    statuses: mapped.map((s) => s.status),
    titles: mapped.map((s) => s.title).slice(0, 10)
  })

  return mapped
}

export function ProcessPathPanel({ variant = 'full', twin, analysis }: ProcessPathPanelProps) {
  const processSteps = useMemo(() => {
    const normalized = normalizeProcessSteps(twin ?? null)
    if (normalized.length > 0) return normalized
    return deriveProcessStepsFromTwin(twin ?? null)
  }, [twin])
  
  const isCompact = variant === 'compact'
  const hasAnalysis = Boolean(analysis)
  const projectTitle = twin?.analysis?.project.title ?? analysis?.project.title

  if (!hasAnalysis && !twin) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="lp-card lp-card--padded"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[var(--lp-text)]">Prozesspfad</h2>
            <p className="text-sm text-[var(--lp-muted)]">Dynamischer Ablauf des Project Twins</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--lp-border)] bg-gradient-to-br from-violet-500/20 to-rose-500/20">
            <Sparkles className="w-7 h-7 text-violet-300" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--lp-text)] mb-3">Noch keine Projektlage analysiert</h3>
          <p className="text-sm text-[var(--lp-muted)] max-w-2xl mx-auto">
            Erfasse einen Input, damit Load Pilot den Prozesspfad ableiten kann.
          </p>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={isCompact ? '' : 'lp-card lp-card--padded'}
    >
      {/* Header */}
      <div className={`flex items-center justify-between ${isCompact ? 'mb-6' : 'mb-8'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className={`font-semibold text-[var(--lp-text)] ${isCompact ? 'text-lg' : 'text-xl'}`}>Prozesspfad</h2>
            <p className="text-sm text-[var(--lp-muted)]">{projectTitle ?? 'Aktueller Ablauf des Project Twins'}</p>
          </div>
        </div>
        <Badge variant="neutral">{processSteps.length} Schritte</Badge>
      </div>

      {/* Desktop: Horizontal Scroll */}
      <div className="hidden lg:block">
        <div className="process-path">
          {processSteps.map((step, index) => (
            <div
              key={step.id}
              className={`process-step ${getStatusColorClasses(step.status)}`}
            >
              <div className="process-step__number">
                Schritt {step.order}
              </div>
              <h3 className="process-step__title">{step.title}</h3>
              {step.description && (
                <p className="process-step__description">{step.description}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                <span className={`process-step__status ${getStatusBadgeClasses(step.status)}`}>
                  {getProcessStatusLabel(step.status)}
                </span>
                {step.blockerReason && (
                  <span className="text-xs text-rose-400">⚠ Blockiert</span>
                )}
              </div>

              {/* Connector to next step */}
              {index < processSteps.length - 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-violet-500/50 to-blue-500/50 z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="lg:hidden space-y-4">
        {processSteps.map((step, index) => (
          <div key={step.id} className="relative">
            <div className={`lp-card lp-card--padded ${getStatusColorClasses(step.status)}`}>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                    step.status === 'active' ? 'bg-violet-500/20 text-violet-400' :
                    step.status === 'blocked' ? 'bg-rose-500/20 text-rose-400' :
                    step.status === 'next' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-zinc-700 text-zinc-400'
                  }`}>
                    {step.order}
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gradient-to-b from-violet-500/50 to-blue-500/50 mt-2"></div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--lp-text)]">{step.title}</h3>
                  {step.description && (
                    <p className="text-sm text-[var(--lp-muted)] mt-1">{step.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClasses(step.status)}`}>
                      {getProcessStatusLabel(step.status)}
                    </span>
                    {step.blockerReason && (
                      <span className="text-xs text-rose-400">⚠ Blockiert</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
