/**
 * OSION Load Pilot - Chat Context Builder
 * Baut kompakten, verwendbaren Projekt-Kontext für die KI
 */

import type { StoredProjectTwin } from '../lib/projectTwinStore'
import type { Measure } from '../types/measures'
import type {
  ChatProjectContext,
  ChatGlobalContext,
  ChatMeasureContext,
  BuildContextResult
} from '../types/chat'

// ============================================================================
// MAIN CONTEXT BUILDER
// ============================================================================

export function buildChatProjectContext(
  twins: StoredProjectTwin[],
  selectedProjectId: string | null
): BuildContextResult {
  const globalContext = buildGlobalContext(twins)
  const selectedContext = selectedProjectId
    ? buildSingleProjectContext(twins, selectedProjectId)
    : null

  const scope: 'all' | 'selected' | 'none' = selectedProjectId
    ? 'selected'
    : twins.length > 0
      ? 'all'
      : 'none'

  return {
    globalContext,
    selectedContext,
    scope
  }
}

// ============================================================================
// GLOBAL CONTEXT (Alle Projekte)
// ============================================================================

function buildGlobalContext(twins: StoredProjectTwin[]): ChatGlobalContext {
  const projects = twins.map(t => {
    const measures = t.measures || []
    const openMeasures = measures.filter(m =>
      ['idea', 'open', 'in_progress', 'waiting'].includes(m.status)
    )
    const blockedMeasures = measures.filter(m => m.status === 'blocked')
    const dueMeasures = measures.filter(m => isDueSoon(m.dueDate))

    return {
      id: t.id,
      title: t.title,
      status: 'active',
      openMeasuresCount: openMeasures.length,
      blockedMeasuresCount: blockedMeasures.length,
      dueMeasuresCount: dueMeasures.length,
      progress: t.progress?.percent || 0
    }
  })

  return {
    projects,
    totalOpenMeasures: projects.reduce((sum, p) => sum + p.openMeasuresCount, 0),
    totalBlockedMeasures: projects.reduce((sum, p) => sum + p.blockedMeasuresCount, 0),
    totalDueMeasures: projects.reduce((sum, p) => sum + p.dueMeasuresCount, 0),
    totalOpenApprovals: 0,
    criticalProjects: projects
      .filter(p => p.blockedMeasuresCount > 0 || p.progress < 20)
      .map(p => p.id),
    projectsNeedingAttention: projects
      .filter(p => p.dueMeasuresCount > 0 || p.openMeasuresCount > 5)
      .map(p => p.id)
  }
}

// ============================================================================
// SINGLE PROJECT CONTEXT
// ============================================================================

function buildSingleProjectContext(
  twins: StoredProjectTwin[],
  projectId: string
): ChatProjectContext | null {
  const twin = twins.find(t => t.id === projectId)
  if (!twin) return null

  const measures = twin.measures || []
  const allMeasures = measures.map(m => convertToChatMeasure(m, twin.title))

  // Attention Queue als Risiko-Quelle nutzen
  const risksFromQueue = twin.attentionQueue
    ?.filter(item => item.category === 'risk' || item.status === 'blocked')
    .map(item => item.title) || []

  // Chat History für Kontext
  const recentChat = twin.chatHistory
    ?.slice(-10)
    .map(c => `${c.role}: ${c.content.slice(0, 100)}`) || []

  // Context Questions
  const openQuestions = twin.contextQuestions
    ?.filter(q => q.status === 'open')
    .map(q => ({
      id: q.id,
      label: q.label,
      status: 'open' as const
    })) || []

  return {
    id: twin.id,
    title: twin.title,
    description: twin.description,
    status: 'active',

    progress: twin.progress ? {
      percent: twin.progress.percent,
      updatedAt: twin.progress.updatedAt
    } : { percent: 0 },

    originalInput: twin.originalInput,
    latestInput: twin.latestInput,

    // Nächster Schritt aus dem Attention Queue oder Process Steps
    nextMove: twin.attentionQueue?.[0]?.title ||
              twin.processSteps?.find(s => s.status === 'active')?.title,

    // Maßnahmen nach Status gruppiert
    measures: allMeasures,
    blockedMeasures: allMeasures.filter(m => m.status === 'blocked'),
    openMeasures: allMeasures.filter(m =>
      ['idea', 'open', 'in_progress', 'waiting'].includes(m.status)
    ),
    doneMeasures: allMeasures.filter(m => m.status === 'done'),
    dueMeasures: allMeasures.filter(m => isDueSoon(m.dueDate)),

    // Risiken aus Attention Queue
    risks: risksFromQueue,

    // Abhängigkeiten aus Process Steps
    dependencies: twin.processSteps
      ?.filter(s => s.status === 'blocked' && s.blockerReason)
      .map(s => s.blockerReason) || [],

    // Aktive Szenarien
    scenarios: twin.simulations?.scenarios?.map(s => ({
      title: s.name,
      description: s.description
    })) || [],

    // Aktivitäts-Log als History
    projectHistory: twin.activityLog?.slice(-20).map(h =>
      `${h.timestamp}: ${h.description}`) || [],

    // Chat History als Memory
    memory: recentChat,

    // Offene Fragen
    openQuestions,

    updatedAt: twin.updatedAt,
    createdAt: twin.createdAt
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function convertToChatMeasure(measure: Measure, _projectTitle: string): ChatMeasureContext {
  return {
    id: measure.id,
    title: measure.title,
    description: measure.description,
    status: measure.status,
    priority: measure.priority || 'medium',
    dueDate: measure.dueDate,
    owner: measure.owner,
    valueScore: measure.valueScore,
    isBlocked: measure.status === 'blocked',
    blockerReason: measure.notes
  }
}

function isDueSoon(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const today = new Date()
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 7 && diffDays >= -1
}

// ============================================================================
// CONTEXT FORMATTER FOR AI PROMPT
// ============================================================================

export function formatContextForAI(result: BuildContextResult): string {
  const { globalContext, selectedContext } = result

  let prompt = '\n\n=== OSION LOAD PILOT KONTEXT ===\n'

  // Global Context
  prompt += `\nVERFÜGBARE PROJEKTE: ${globalContext.projects.length}\n`
  prompt += `Gesamt Offene Maßnahmen: ${globalContext.totalOpenMeasures}\n`
  prompt += `Gesamt Blockierte Maßnahmen: ${globalContext.totalBlockedMeasures}\n`
  prompt += `Gesamt Fällige Maßnahmen: ${globalContext.totalDueMeasures}\n`

  if (globalContext.projects.length > 0) {
    prompt += '\nPROJEKTÜBERSICHT:\n'
    globalContext.projects.forEach(p => {
      prompt += `  • "${p.title}" (${p.openMeasuresCount} offen, ${p.blockedMeasuresCount} blockiert, ${p.progress}% Fortschritt)\n`
    })
  }

  // Selected Project Context
  if (selectedContext) {
    prompt += `\n=== AKTIVES PROJEKT: "${selectedContext.title}" ===\n`
    prompt += `ID: ${selectedContext.id}\n`
    if (selectedContext.description) {
      prompt += `Beschreibung: ${selectedContext.description.slice(0, 200)}\n`
    }
    prompt += `Fortschritt: ${selectedContext.progress?.percent || 0}%\n`

    if (selectedContext.nextMove) {
      prompt += `Nächster Schritt: ${selectedContext.nextMove}\n`
    }

    // Maßnahmen
    if (selectedContext.measures.length > 0) {
      prompt += `\nMASSNAHMEN (${selectedContext.measures.length}):\n`

      if (selectedContext.blockedMeasures.length > 0) {
        prompt += `  BLOCKIERT (${selectedContext.blockedMeasures.length}):\n`
        selectedContext.blockedMeasures.forEach(m => {
          prompt += `    - ${m.title} (Priorität: ${m.priority})\n`
        })
      }

      if (selectedContext.openMeasures.length > 0) {
        const limited = selectedContext.openMeasures.slice(0, 10)
        prompt += `  OFFEN (${selectedContext.openMeasures.length}, Top 10):\n`
        limited.forEach(m => {
          const due = m.dueDate ? ` (fällig: ${m.dueDate})` : ''
          prompt += `    - ${m.title} [${m.status}, ${m.priority}]${due}\n`
        })
      }

      if (selectedContext.dueMeasures.length > 0) {
        prompt += `  FÄLLIG (${selectedContext.dueMeasures.length}):\n`
        selectedContext.dueMeasures.forEach(m => {
          prompt += `    - ${m.title} (bis: ${m.dueDate})\n`
        })
      }
    }

    // Risiken
    if (selectedContext.risks && selectedContext.risks.length > 0) {
      prompt += `\nRISIKEN:\n`
      selectedContext.risks.forEach(r => prompt += `  • ${r}\n`)
    }

    // Abhängigkeiten
    if (selectedContext.dependencies && selectedContext.dependencies.length > 0) {
      prompt += `\nABHÄNGIGKEITEN:\n`
      selectedContext.dependencies.forEach(d => prompt += `  • ${d}\n`)
    }

    // Szenarien
    if (selectedContext.scenarios && selectedContext.scenarios.length > 0) {
      prompt += `\nOPTIONEN/SZENARIEN:\n`
      selectedContext.scenarios.forEach(s => {
        prompt += `  • ${s.title}: ${s.description}\n`
      })
    }

    // Offene Fragen
    if (selectedContext.openQuestions && selectedContext.openQuestions.length > 0) {
      const open = selectedContext.openQuestions.filter(q => q.status === 'open')
      if (open.length > 0) {
        prompt += `\nOFFENE FRAGEN (${open.length}):\n`
        open.forEach(q => prompt += `  • ${q.label}\n`)
      }
    }
  }

  prompt += '\n=== ENDE KONTEXT ===\n'

  return prompt
}

// ============================================================================
// INTENT DETECTION HELPER
// ============================================================================

export function detectProjectReference(
  message: string,
  twins: StoredProjectTwin[]
): { projectId: string | null; confidence: number; matchedTitle?: string } {
  const lowerMsg = message.toLowerCase()

  // Direkte ID-Erkennung
  const idMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  if (idMatch) {
    const id = idMatch[0]
    const twin = twins.find(t => t.id === id)
    if (twin) {
      return { projectId: id, confidence: 1.0, matchedTitle: twin.title }
    }
  }

  // Titel-basierte Erkennung
  for (const twin of twins) {
    const title = twin.title.toLowerCase()
    // Exakte Übereinstimmung
    if (lowerMsg.includes(title)) {
      return { projectId: twin.id, confidence: 0.95, matchedTitle: twin.title }
    }

    // Teilweise Übereinstimmung (erstes Wort muss enthalten sein)
    const titleWords = title.split(' ')
    if (titleWords.length > 1) {
      const firstWord = titleWords[0]
      if (lowerMsg.includes(firstWord) && titleWords.some(w => lowerMsg.includes(w))) {
        return { projectId: twin.id, confidence: 0.8, matchedTitle: twin.title }
      }
    }
  }

  return { projectId: null, confidence: 0 }
}
