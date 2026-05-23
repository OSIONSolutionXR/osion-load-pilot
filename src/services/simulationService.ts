/**
 * Simulation Service
 * 
 * Enthält Funktionen zur Ausführung von Szenario-Simulationen
 * mit KI-Unterstützung (Mock-Implementierung bis OpenClaw Bridge ready)
 */

import type { StoredProjectTwinV2, Scenario, ScenarioResult } from '../types/projectTwinV2'

// ============================================================================
// SCENARIO TEMPLATES
// ============================================================================

export interface ScenarioTemplate {
  id: string
  name: string
  description: string
  assumptions: Record<string, string>
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: 'budget_plus',
    name: 'Budget +20%',
    description: 'Was passiert bei 20% mehr Budget?',
    assumptions: { budget_modifier: '+20%' }
  },
  {
    id: 'budget_minus',
    name: 'Budget -20%',
    description: 'Was passiert bei 20% weniger Budget?',
    assumptions: { budget_modifier: '-20%' }
  },
  {
    id: 'timeline_short',
    name: 'Zeitrahmen verkürzt',
    description: 'Was bei halber Zeit?',
    assumptions: { timeline_modifier: '-50%' }
  },
  {
    id: 'timeline_long',
    name: 'Zeitrahmen verlängert',
    description: 'Was bei doppelter Zeit?',
    assumptions: { timeline_modifier: '+100%' }
  },
  {
    id: 'risk_blocker',
    name: 'Kritischer Blocker',
    description: 'Was wenn ein Blocker eintritt?',
    assumptions: { blocker: 'critical_path_blocked' }
  },
  {
    id: 'risk_budget_overrun',
    name: 'Budgetüberschreitung',
    description: 'Was bei 30% Budgetüberschreitung?',
    assumptions: { budget_modifier: '+30%', reason: 'kostensteigerung' }
  },
  {
    id: 'opportunity_team_expansion',
    name: 'Team-Erweiterung',
    description: 'Was bei zusätzlichen Ressourcen?',
    assumptions: { resources_modifier: '+2 Mitarbeiter', timeline_modifier: '-25%' }
  },
  {
    id: 'opportunity_priority_shift',
    name: 'Prioritätswechsel',
    description: 'Was bei höherer Priorisierung?',
    assumptions: { priority_modifier: 'high', support: 'management_backing' }
  },
  {
    id: 'custom',
    name: 'Eigene Annahmen',
    description: 'Definiere selbst was simuliert wird',
    assumptions: {}
  }
]

// ============================================================================
// SCENARIO GENERATION
// ============================================================================

export function createScenarioFromTemplate(
  templateId: string,
  customAssumptions?: Record<string, string>,
  customName?: string
): Scenario {
  const template = SCENARIO_TEMPLATES.find(t => t.id === templateId)
  const timestamp = new Date().toISOString()
  
  if (!template) {
    // Custom scenario
    return {
      id: `scenario-${Date.now()}`,
      name: customName || 'Benutzerdefiniertes Szenario',
      description: 'Manuell erstellte Simulation',
      assumptions: customAssumptions || {},
      createdAt: timestamp,
      status: 'running'
    }
  }
  
  return {
    id: `scenario-${Date.now()}`,
    name: customName || template.name,
    description: template.description,
    assumptions: {
      ...template.assumptions,
      ...customAssumptions
    },
    createdAt: timestamp,
    status: 'running'
  }
}

// ============================================================================
// SIMULATION ENGINE (Mock Implementation)
// ============================================================================

interface SimulationContext {
  projectTitle: string
  projectType?: string
  currentStatus: unknown
  assumptions: Record<string, string>
}

export function buildSimulationContext(
  scenario: Scenario,
  _twin: StoredProjectTwinV2
): SimulationContext {
  return {
    projectTitle: _twin.title,
    projectType: _twin.analysis?.project?.type,
    currentStatus: _twin.measures,
    assumptions: scenario.assumptions
  }
}

function generateMockResult(scenario: Scenario, _twin: StoredProjectTwinV2): ScenarioResult {
  const assumptions = scenario.assumptions
  const timestamp = new Date().toISOString()
  
  // Einfache Logik zur Ergebnisbestimmung basierend auf Annahmen
  let outcome: 'positive' | 'neutral' | 'negative' = 'neutral'
  let confidence = 0.7
  const risks: string[] = []
  const opportunities: string[] = []
  let recommendedAction: string | undefined
  
  // Budget-Modifikatoren
  if (assumptions.budget_modifier) {
    if (assumptions.budget_modifier.includes('+')) {
      outcome = 'positive'
      opportunities.push('Mehr Spielraum für Qualitätssicherung')
      opportunities.push('Möglichkeit zur Beschleunigung durch zusätzliche Ressourcen')
      risks.push('Gefahr der Budgetineffizienz durch zu große Aufstockung')
      recommendedAction = 'Nutze zusätzliches Budget für parallele Arbeitspakete'
    } else if (assumptions.budget_modifier.includes('-')) {
      outcome = 'negative'
      risks.push('Qualitätseinbußen durch reduzierte Testkapazität')
      risks.push('Verzögerungen bei externen Abhängigkeiten')
      risks.push('Team-Überlastung durch zu knappe Ressourcen')
      opportunities.push('Fokussierung auf Kernfeatures (Pareto-Prinzip)')
      recommendedAction = 'Priorisiere strikt nach Value/Impact und reduziere Scope falls nötig'
    }
  }
  
  // Timeline-Modifikatoren
  if (assumptions.timeline_modifier) {
    if (assumptions.timeline_modifier.includes('-')) {
      outcome = outcome === 'positive' ? 'neutral' : 'negative'
      risks.push('Technische Schulden durch überhastete Entwicklung')
      risks.push('Erhöhter Koordinationsaufwand')
      opportunities.push('Schnellere Time-to-Market')
      recommendedAction = 'Identifiziere parallele Arbeitspakete und erhöhe Test-Automatisierung'
    } else if (assumptions.timeline_modifier.includes('+')) {
      outcome = outcome === 'negative' ? 'neutral' : 'positive'
      opportunities.push('Mehr Zeit für gründliche Analyse und Planung')
      opportunities.push('Reduzierte Team-Stresslevel')
      risks.push('Motivationsverlust durch zu langen Zeitrahmen')
      recommendedAction = 'Nutze zusätzliche Zeit für Prototyping und Stakeholder-Alignment'
    }
  }
  
  // Blocker-Szenarien
  if (assumptions.blocker === 'critical_path_blocked') {
    outcome = 'negative'
    confidence = 0.85
    risks.push('Projektstillstand bis Blocker gelöst')
    risks.push('Kaskadeneffekt auf abhängige Arbeitspakete')
    risks.push('Kosten für "Wait-time" des Teams')
    opportunities.push('Nutzung der Zeit für nicht-blockierte Bereiche')
    recommendedAction = 'Aktiviere Eskalations-Prozess und identifiziere Workarounds sofort'
  }
  
  // Team-Erweiterung
  if (assumptions.resources_modifier?.includes('Mitarbeiter')) {
    outcome = 'positive'
    opportunities.push('Beschleunigung durch parallele Arbeit')
    opportunities.push('Frisches Know-how im Team')
    risks.push('Onboarding-Overhead und Know-how-Transfer-Zeit')
    risks.push('Team-Dynamik-Veränderung')
    recommendedAction = 'Plane Onboarding-Phase ein und definiere klare Verantwortlichkeiten'
  }
  
  // Prioritätswechsel
  if (assumptions.priority_modifier === 'high') {
    outcome = 'positive'
    opportunities.push('Schnellere Entscheidungen durch Management-Attention')
    opportunities.push('Priorisierung bei Ressourcen-Konflikten')
    risks.push('Höhere Erwartungshaltung und Druck')
    recommendedAction = 'Nutze erhöhte Aufmerksamkeit für regelmäßige Status-Updates und schnelle Feedback-Loops'
  }
  
  // Default-Fall für custom Szenarien
  if (outcome === 'neutral' && Object.keys(assumptions).length === 0) {
    risks.push('Unbekannte Variablen könnten unvorhergesehene Auswirkungen haben')
    opportunities.push('Flexibilität für unerwartete positive Entwicklungen')
    recommendedAction = 'Definiere klare Metriken zur Überwachung des Szenarios'
  }
  
  // Zusammenfassung generieren
  const summary = generateSummary(scenario, outcome, risks, opportunities)
  
  return {
    scenarioId: scenario.id,
    outcome,
    confidence: Math.min(0.95, Math.max(0.5, confidence + (risks.length + opportunities.length) * 0.05)),
    summary,
    risks,
    opportunities,
    recommendedAction,
    completedAt: timestamp
  }
}

function generateSummary(
  scenario: Scenario,
  outcome: 'positive' | 'neutral' | 'negative',
  risks: string[],
  opportunities: string[]
): string {
  const assumptionTexts = Object.entries(scenario.assumptions)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
  
  const outcomeText = {
    positive: 'positiv',
    neutral: 'neutral bis leicht positiv',
    negative: 'herausfordernd'
  }[outcome]
  
  return `Bei den Annahmen "${assumptionTexts}" zeigt die Simulation ein ${outcomeText}es Ergebnis. ${
    risks.length > 0 ? `${risks.length} Risiken wurden identifiziert` : 'Keine kritischen Risiken'
  } und ${opportunities.length > 0 ? `${opportunities.length} Chancen` : 'wenige zusätzliche Chancen'} erkannt.`
}

// ============================================================================
// MAIN SIMULATION FUNCTION
// ============================================================================

/**
 * Führt eine Szenario-Simulation durch
 * 
 * Hinweis: Dies ist aktuell eine Mock-Implementierung.
 * Später wird dies über die OpenClaw Bridge mit echter KI-Analyse ersetzt.
 */
export async function runScenarioSimulation(
  scenario: Scenario,
  twin: StoredProjectTwinV2
): Promise<ScenarioResult> {
  // Simuliere Verarbeitungszeit für bessere UX
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
  
  // TODO: OpenClaw Bridge Integration
  // const context = buildSimulationContext(scenario, twin)
  // const prompt = buildSimulationPrompt(context)
  // const aiResponse = await openClawBridge.complete(prompt)
  // return parseAiResponse(aiResponse)
  
  // Aktuell: Mock-Ergebnis
  return generateMockResult(scenario, twin)
}

/**
 * Vergleicht mehrere Szenarien und liefert eine Empfehlung
 */
export function compareScenarios(
  scenarios: Scenario[],
  results: ScenarioResult[]
): {
  comparison: Array<{
    scenario: Scenario
    result: ScenarioResult
    score: number
  }>
  recommendation: string
} {
  const scenarioMap = new Map(scenarios.map(s => [s.id, s]))
  
  const comparison = results
    .map(result => {
      const scenario = scenarioMap.get(result.scenarioId)
      if (!scenario) return null
      
      // Score-Berechnung: positive Outcome = höher, negative = niedriger
      const outcomeScore = {
        positive: 100,
        neutral: 50,
        negative: 0
      }[result.outcome]
      
      // Gewichtung: Outcome 60%, Confidence 40%
      const score = outcomeScore * 0.6 + result.confidence * 40
      
      return { scenario, result, score }
    })
    .filter(Boolean) as Array<{
      scenario: Scenario
      result: ScenarioResult
      score: number
    }>
  
  // Sortiere nach Score
  comparison.sort((a, b) => b.score - a.score)
  
  // Generiere Empfehlung
  let recommendation = ''
  if (comparison.length > 0) {
    const best = comparison[0]
    recommendation = `Basierend auf der Simulation wird das Szenario "${best.scenario.name}" empfohlen. ${
      best.result.recommendedAction ? 'Empfohlene Maßnahme: ' + best.result.recommendedAction : ''
    }`
  }
  
  return { comparison, recommendation }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Erstellt einen KI-Prompt für die Simulation
 * (Vorbereitet für spätere OpenClaw Bridge Integration)
 */
export function buildSimulationPrompt(context: {
  projectTitle: string
  projectType?: string
  currentStatus: unknown
  assumptions: Record<string, string>
}): string {
  return `
Simuliere folgendes Szenario für ein Projekt:

Projekt: ${context.projectTitle}
Typ: ${context.projectType || 'Unbekannt'}
Aktueller Stand: ${JSON.stringify(context.currentStatus)}

Annahmen für diese Simulation:
${Object.entries(context.assumptions)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join('\n')}

Analysiere:
1. Wie verändert sich das Projektergebnis?
2. Welche neuen Risiken entstehen?
3. Welche Chancen ergeben sich?
4. Was ist die empfohlene nächste Aktion?

Antworte im JSON-Format:
{
  "outcome": "positive|neutral|negative",
  "confidence": 0.0-1.0,
  "summary": "Kurze Zusammenfassung",
  "risks": ["Risiko 1", "Risiko 2"],
  "opportunities": ["Chance 1", "Chance 2"],
  "recommendedAction": "Konkrete Empfehlung"
}
  `.trim()
}
