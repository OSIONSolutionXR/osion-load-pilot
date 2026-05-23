/**
 * OSION Project Simulator - Input Builder
 * Erzeugt KI-Prompts für dynamische Agenten-Simulation
 */

import type { StoredProjectTwin } from './projectTwinStore'
import type { SimulationConfig, SimulationRun } from '../types/simulation'

export interface BuildSimulationInputParams {
  activeTwin: StoredProjectTwin
  simulationConfig: SimulationConfig
}

/**
 * Baut den KI-Input für eine Simulation
 * Enthält Project Twin + Simulationskonfiguration
 */
export function buildSimulationInput(
  params: BuildSimulationInputParams
): string {
  const { activeTwin, simulationConfig } = params

  const activeTwinJson = JSON.stringify({
    id: activeTwin.id,
    title: activeTwin.title,
    description: activeTwin.originalInput,
    analysis: activeTwin.analysis,
    progress: activeTwin.progress,
    updates: activeTwin.updates?.length || 0
  }, null, 2)

  const simulationConfigJson = JSON.stringify(simulationConfig, null, 2)

  return `Du bist der OSION Project Simulator.

Du erhältst einen Project Twin und eine Simulationskonfiguration.

Deine Aufgabe:
Erzeuge eine dynamische, projektspezifische Simulation mit mindestens ${simulationConfig.agentCount} synthetischen Agenten.

Wichtige Regeln:
- Keine echten privaten Personen simulieren.
- Keine statischen Agenten verwenden.
- Keine festen Demo-Agenten.
- Jeder Agent muss aus dem aktuellen Projektkontext abgeleitet werden.
- Agenten dürfen ähnliche Grundtypen haben, müssen aber individuelle Kontexte, Motive, Ängste, Bias und Kommunikationsstile besitzen.
- Agenten müssen miteinander in ${simulationConfig.roundCount} Runden interagieren.
- Die Simulation soll Einwände, Chancen, Risiken, Missverständnisse, Zielgruppenmuster, Maßnahmen, Projektperformance, Erfolgswahrscheinlichkeit und Prozessauswirkungen sichtbar machen.
- Das Ergebnis darf den Project Twin nicht automatisch überschreiben.
- Änderungen sollen als Vorschläge gespeichert werden.

Project Twin:
${activeTwinJson}

Simulationskonfiguration:
${simulationConfigJson}

Erzeuge strukturierte Daten im folgenden Format (JSON):

{
  "simulationRun": {
    "id": "sim_${Date.now()}",
    "title": "Simulation: ${simulationConfig.question.substring(0, 50)}...",
    "type": "${simulationConfig.goal}",
    "status": "completed",
    "agentCount": ${simulationConfig.agentCount},
    "roundCount": ${simulationConfig.roundCount},
    "config": { /* die übergebene Config */ },
    
    "agents": [
      {
        "id": "agent_001",
        "displayName": "Name des Agenten",
        "archetype": "entrepreneur|customer|skeptic|expert|...",
        "role": "Konkrete Rolle im Projekt",
        "context": "Persönlicher Kontext",
        "worldview": "Weltanschauung/Überzeugungen",
        "motivation": "Was treibt den Agenten an?",
        "fear": "Was fürchtet der Agent?",
        "bias": "Welche Voreingenommenheit hat der Agent?",
        "communicationStyle": "analytical|emotional|direct|...",
        "knowledgeLevel": "novice|basic|intermediate|expert|authority",
        "projectRelevance": "none|low|medium|high|critical",
        "influenceWeight": 0.5,
        "networkGroup": "Gruppen-ID",
        "initialPosition": "strongly_opposed|opposed|skeptical|neutral|interested|supportive|strongly_supportive",
        "likelyObjection": "Wahrscheinlicher Einwand",
        "likelySupport": "Wahrscheinliche Unterstützung",
        "statements": [
          {
            "round": 1,
            "statement": "Was sagt der Agent in Runde 1?",
            "context": "Kontext der Aussage",
            "sentiment": "very_negative|negative|slightly_negative|neutral|slightly_positive|positive|very_positive",
            "detectedObjection": "Erkannter Einwand",
            "detectedOpportunity": "Erkannte Chance",
            "detectedRisk": "Erkanntes Risiko",
            "changedPosition": false,
            "previousPosition": null,
            "newPosition": null
          }
        ],
        "finalEvaluation": {
          "trustScore": 65,
          "usefulnessScore": 70,
          "riskScore": 45,
          "implementationReadiness": 60,
          "successProbabilityEstimate": 55,
          "nextMeasureRecommendation": "Empfohlene nächste Maßnahme",
          "dealbreakers": ["Dealbreaker 1", "Dealbreaker 2"],
          "conditions": ["Bedingung 1", "Bedingung 2"]
        }
      }
    ],
    
    "groups": [
      {
        "id": "group_001",
        "name": "Name der Gruppe",
        "description": "Beschreibung der Gruppe",
        "agentIds": ["agent_001", "agent_002"],
        "dominantPerspective": "Dominante Perspektive",
        "mainConcern": "Hauptbedenken",
        "mainOpportunity": "Hauptchance",
        "averageSentiment": "neutral"
      }
    ],
    
    "rounds": [
      {
        "round": 1,
        "title": "Individuelle Erstreaktion",
        "description": "Jeder Agent reagiert individuell auf das Projekt",
        "summary": "Zusammenfassung der Runde",
        "patterns": ["Wiederkehrendes Muster 1", "Muster 2"],
        "conflicts": [
          {
            "between": ["agent_001", "agent_002"],
            "topic": "Konfliktthema",
            "intensity": "low|medium|high"
          }
        ],
        "representativeStatements": [
          {
            "agentId": "agent_001",
            "statement": "Repräsentative Aussage",
            "significance": "Warum ist diese Aussage wichtig?"
          }
        ],
        "groupInteractions": [
          {
            "groupId": "group_001",
            "round": 2,
            "messages": [
              {
                "agentId": "agent_001",
                "message": "Nachricht",
                "replyToAgentId": null,
                "timestamp": "2026-05-22T20:00:00Z"
              }
            ]
          }
        ]
      },
      {
        "round": 2,
        "title": "Gruppendiskussion",
        "description": "Agenten diskutieren in Gruppen",
        "summary": "...",
        "patterns": [],
        "conflicts": [],
        "representativeStatements": [],
        "groupInteractions": []
      },
      {
        "round": 3,
        "title": "Konfliktphase",
        "description": "Befürworter treffen auf Skeptiker",
        "summary": "...",
        "patterns": [],
        "conflicts": [],
        "representativeStatements": [],
        "groupInteractions": []
      },
      {
        "round": 4,
        "title": "Meinungsänderung / Bedingungen",
        "description": "Agenten ändern ihre Meinung oder nennen Bedingungen",
        "summary": "...",
        "patterns": [],
        "conflicts": [],
        "representativeStatements": [],
        "groupInteractions": []
      },
      {
        "round": 5,
        "title": "Entscheidung / Bewertung",
        "description": "Finale Bewertung und Entscheidung",
        "summary": "...",
        "patterns": [],
        "conflicts": [],
        "representativeStatements": [],
        "groupInteractions": []
      }
    ],
    
    "rawAgentStatements": [
      {
        "agentId": "agent_001",
        "agentName": "Name",
        "agentArchetype": "entrepreneur",
        "round": 1,
        "groupId": "group_001",
        "statement": "Unverdichtete Aussage",
        "context": "Kontext",
        "sentiment": "positive",
        "detectedObjection": "...",
        "detectedOpportunity": "...",
        "detectedRisk": "..."
      }
    ],
    
    "conversations": [
      {
        "groupId": "group_001",
        "round": 2,
        "messages": [
          {
            "agentId": "agent_001",
            "message": "Nachricht",
            "replyToAgentId": null,
            "timestamp": "2026-05-22T20:00:00Z"
          }
        ]
      }
    ],
    
    "result": {
      "resonanceScore": 65,
      "trustScore": 70,
      "usefulnessScore": 75,
      "riskScore": 45,
      "adoptionScore": 60,
      "successProbability": 55,
      "projectPerformanceScore": 62,
      
      "summary": "Gesamtzusammenfassung",
      "performanceForecast": "Projektprognose",
      "successForecast": "Erfolgsprognose",
      "difficultyMap": ["Schwierigkeit 1", "Schwierigkeit 2"],
      
      "topObjections": [
        {
          "objection": "Einwand",
          "frequency": 25,
          "severity": "high",
          "affectedAgentGroups": ["group_001"],
          "suggestedResponse": "Vorgeschlagene Antwort"
        }
      ],
      "topOpportunities": [
        {
          "opportunity": "Chance",
          "potential": "high",
          "supportingAgents": ["agent_001"],
          "actionRequired": "Erforderliche Aktion"
        }
      ],
      "topMisunderstandings": [
        {
          "misunderstanding": "Missverständnis",
          "clarification": "Aufklärung",
          "affectedAgents": ["agent_001"]
        }
      ],
      "targetGroupInsights": [
        {
          "group": "Zielgruppe",
          "reaction": "positive",
          "keyConcerns": ["Bedenken 1"],
          "keyOpportunities": ["Chance 1"],
          "trustLevel": 70,
          "recommendation": "Empfehlung"
        }
      ],
      "stakeholderPatterns": [
        {
          "pattern": "Muster",
          "description": "Beschreibung",
          "affectedGroups": ["group_001"],
          "strategicImplication": "Strategische Implikation"
        }
      ],
      "decisionSignals": [
        {
          "signal": "Signal",
          "strength": "strong",
          "timing": "Sofort",
          "recommendation": "Empfehlung"
        }
      ],
      "influentialAgents": ["agent_001", "agent_002"],
      "opinionShifts": [
        {
          "agentId": "agent_001",
          "fromPosition": "skeptical",
          "toPosition": "interested",
          "reason": "Grund für Meinungsänderung",
          "round": 4
        }
      ]
    },
    
    "recommendedMeasures": [
      {
        "title": "Maßnahme",
        "description": "Beschreibung",
        "priority": "high",
        "reason": "Begründung",
        "expectedEffect": "Erwarteter Effekt",
        "linkedProcessStepId": "step_001",
        "supportingAgents": ["agent_001"],
        "opposingAgents": ["agent_002"]
      }
    ],
    
    "riskUpdates": [
      {
        "title": "Risiko",
        "description": "Beschreibung",
        "severity": "high",
        "probability": "likely",
        "reason": "Begründung",
        "linkedProcessStepId": "step_001",
        "mitigatingAgents": ["agent_001"],
        "amplifyingAgents": ["agent_002"]
      }
    ],
    
    "processImpact": [
      {
        "processStepId": "step_001",
        "stepTitle": "Schritttitel",
        "impact": "accelerate|delay|block|modify|remove|add",
        "recommendation": "Empfehlung",
        "reason": "Begründung"
      }
    ],
    
    "createdAt": "2026-05-22T20:00:00Z",
    "updatedAt": "2026-05-22T20:30:00Z",
    "completedAt": "2026-05-22T20:30:00Z",
    "duration": 1800
  }
}

WICHTIG:
- Erzeuge mindestens ${simulationConfig.agentCount} Agenten.
- Erzeuge für jeden Agenten mindestens eine unverdichtete Aussage pro Runde.
- Die Agenten müssen unterscheidbar sein.
- Die Agenten sollen projektbezogen argumentieren.
- Das Ergebnis muss konkrete nächste Maßnahmen und Risiken liefern.
- Zusätzlich muss das Ergebnis Projektperformance, Erfolgswahrscheinlichkeit und erwartete Schwierigkeiten bewerten.`
}

/**
 * Baut den KI-Input für Übernahme von Simulationsergebnissen
 */
export function buildSimulationAdoptionInput(
  simulationRun: SimulationRun,
  adoptionType: 'measures' | 'risks' | 'process_impact' | 'full'
): string {
  const measuresJson = JSON.stringify(simulationRun.recommendedMeasures, null, 2)
  const risksJson = JSON.stringify(simulationRun.riskUpdates, null, 2)
  const processImpactJson = JSON.stringify(simulationRun.processImpact, null, 2)

  let adoptionContext = ''
  
  switch (adoptionType) {
    case 'measures':
      adoptionContext = `Übernehme folgende Maßnahmen aus der Simulation "${simulationRun.title}" in den Project Twin:

${measuresJson}

Integriere diese Maßnahmen in die bestehende Maßnahmenliste.
Ordne sie dem passenden Prozessschritt zu.
Bewerte Priorität und Risikoauswirkung.`
      break
      
    case 'risks':
      adoptionContext = `Übernehme folgende Risiken aus der Simulation "${simulationRun.title}" in den Project Twin:

${risksJson}

Integriere diese Risiken in die bestehende Risikoliste.
Verknüpfe sie mit betroffenen Prozessschritten.
Bewerte Schwere und Wahrscheinlichkeit.`
      break
      
    case 'process_impact':
      adoptionContext = `Wende folgende Prozessauswirkungen aus der Simulation "${simulationRun.title}" auf den Project Twin an:

${processImpactJson}

Passe den Prozesspfad entsprechend an.
Markiere betroffene Schritte.`
      break
      
    case 'full':
      adoptionContext = `Übernehme die vollständigen Simulationsergebnisse von "${simulationRun.title}" in den Project Twin:

Maßnahmen:
${measuresJson}

Risiken:
${risksJson}

Prozessauswirkungen:
${processImpactJson}

Integriere alle Ergebnisse in den Twin.
Aktualisiere Maßnahmen, Risiken und Prozesspfad entsprechend.`
      break
  }

  return adoptionContext
}

/**
 * Validiert die Simulationskonfiguration
 */
export function validateSimulationConfig(
  config: SimulationConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.question?.trim()) {
    errors.push('Simulationsfrage ist erforderlich')
  }

  if (!config.goal) {
    errors.push('Simulationsziel ist erforderlich')
  }

  if (config.agentCount < 100) {
    errors.push('Agentenanzahl muss mindestens 100 sein')
  }

  if (config.roundCount < 1) {
    errors.push('Rundenanzahl muss mindestens 1 sein')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Erzeugt einen Fallback-SimulationRun wenn die KI keine saubere Antwort liefert
 */
export function createFallbackSimulationRun(
  config: SimulationConfig
): SimulationRun {
  const now = new Date().toISOString()
  
  return {
    id: `sim_fallback_${Date.now()}`,
    title: `Simulation: ${config.question.substring(0, 50)}...`,
    type: config.goal,
    status: 'failed',
    config,
    agentCount: 0,
    roundCount: config.roundCount,
    agents: [],
    groups: [],
    rounds: [],
    rawAgentStatements: [],
    conversations: [],
    result: {
      resonanceScore: 0,
      trustScore: 0,
      usefulnessScore: 0,
      riskScore: 0,
      adoptionScore: 0,
      successProbability: 0,
      projectPerformanceScore: 0,
      summary: 'Simulation konnte nicht vollständig erstellt werden. Bitte versuche es erneut.',
      performanceForecast: 'Nicht verfügbar',
      successForecast: 'Nicht verfügbar',
      difficultyMap: [],
      topObjections: [],
      topOpportunities: [],
      topMisunderstandings: [],
      targetGroupInsights: [],
      stakeholderPatterns: [],
      decisionSignals: [],
      influentialAgents: [],
      opinionShifts: []
    },
    recommendedMeasures: [],
    riskUpdates: [],
    processImpact: [],
    createdAt: now,
    updatedAt: now
  }
}
