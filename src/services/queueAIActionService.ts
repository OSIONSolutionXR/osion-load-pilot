/**
 * Queue AI Action Service
 * Generiert KI-basierte Arbeitshilfen für Attention Queue Einträge
 */

import type { AIActionType } from '../types/projectTwinV2'

export interface QueueAIActionRequest {
  queueItemTitle: string
  queueItemDescription?: string
  projectContext: string
  actionType: AIActionType
}

export interface QueueAIActionResponse {
  generatedContent: string
  title: string
  type: AIActionType
}

// Prompt-Templates für Queue-Aktionen (für spätere KI-Integration)
// TODO: Bei Integration der OpenClaw Bridge aktivieren
/*
const QUEUE_ACTION_PROMPTS: Record<AIActionType, (context: QueueAIActionRequest) => string> = {
  email: (context) => `
Erstelle eine professionelle E-Mail für folgende Situation:

Projekt: ${context.projectContext}
Thema: ${context.queueItemTitle}
${context.queueItemDescription ? `Kontext: ${context.queueItemDescription}` : ''}

Die E-Mail sollte:
- Höflich und professionell sein
- Den konkreten Anlass nennen
- Eine klare Bitte/Aufforderung enthalten
- Kontaktdaten für Rückfragen anbieten

Antworte NUR mit dem E-Mail-Text (Betreff und Body), ohne zusätzliche Erklärungen.`,

  checklist: (context) => `
Erstelle eine strukturierte Checkliste für:
"${context.queueItemTitle}"

${context.queueItemDescription ? `Beschreibung: ${context.queueItemDescription}` : ''}

Die Checkliste sollte enthalten:
- Benötigte Unterlagen/Dokumente
- Wichtige Schritte in logischer Reihenfolge
- Zu kontaktierende Personen/Stellen
- Fristen und Termine (falls relevant)

Formatiere als klare Liste mit Checkboxen (verwende [ ] für jede Checkbox).`,

  script: (context) => `
Erstelle einen Telefonleitfaden/Gesprächsleitfaden für:
"${context.queueItemTitle}"

${context.queueItemDescription ? `Beschreibung: ${context.queueItemDescription}` : ''}

Der Leitfaden sollte enthalten:
1. Gesprächseröffnung
2. Wichtige Punkte die angesprochen werden müssen
3. Mögliche Einwände und Antworten
4. Nächste Schritte/Abschluss

Formatiere als übersichtlichen Gesprächsleitfaden.`,

  risk_assessment: (context) => `
Erstelle eine Risiko-Bewertung für:
"${context.queueItemTitle}"

${context.queueItemDescription ? `Beschreibung: ${context.queueItemDescription}` : ''}
Projekt-Kontext: ${context.projectContext}

Bewerte:
- Potenzielle Risiken
- Eintrittswahrscheinlichkeit (niedrig/mittel/hoch)
- Auswirkung (niedrig/mittel/hoch)
- Empfohlene Gegenmaßnahmen

Formatiere als strukturierte Risikoanalyse.`,

  next_steps: (context) => `
Leite konkrete nächste Schritte ab für:
"${context.queueItemTitle}"

${context.queueItemDescription ? `Beschreibung: ${context.queueItemDescription}` : ''}
Projekt-Kontext: ${context.projectContext}

Erstelle:
1. Sofortmaßnahmen (heute)
2. Kurzfristige Schritte (diese Woche)
3. Mittelfristige Aufgaben (nächste 2-4 Wochen)
4. Wer ist verantwortlich für jeden Schritt

Formatiere als klaren Aktionsplan mit Verantwortlichkeiten.`,
}
*/

// TODO: Hier könnte später eine echte KI-Integration über OpenClaw Bridge erfolgen
// Für jetzt verwenden wir Template-basierte Antworten mit einem Mock-Service
function generateMockResponse(request: QueueAIActionRequest): QueueAIActionResponse {
  const templates: Record<AIActionType, () => QueueAIActionResponse> = {
    email: () => ({
      type: 'email',
      title: `E-Mail: ${request.queueItemTitle}`,
      generatedContent: `Betreff: ${request.queueItemTitle} - ${request.projectContext}

Sehr geehrte Damen und Herren,

bezüglich meines Projekts "${request.projectContext}" möchte ich Sie kontaktieren, um folgendes Anliegen zu besprechen:

${request.queueItemTitle}

${request.queueItemDescription || 'Ich freue mich auf ein persönliches Gespräch und stehe für Rückfragen zur Verfügung.'}

Bitte lassen Sie mich wissen, wie wir hier am besten vorgehen.

Mit freundlichen Grüßen
[Name]
[E-Mail]
[Telefon]`,
    }),

    checklist: () => ({
      type: 'checklist',
      title: `Checkliste: ${request.queueItemTitle}`,
      generatedContent: `## Checkliste: ${request.queueItemTitle}

### Vorbereitung
[ ] Relevante Unterlagen zusammensuchen
[ ] Termin bei beteiligten Stellen vereinbaren
[ ] Dokumentation bereithalten

### Durchführung
[ ] Hauptaufgabe: ${request.queueItemTitle}
[ ] ${request.queueItemDescription ? `Beachten: ${request.queueItemDescription}` : 'Alle relevanten Punkte abarbeiten'}
[ ] Zwischenstände dokumentieren

### Abschluss
[ ] Ergebnisse überprüfen
[ ] Beteiligte informieren
[ ] Nächste Schritte planen`,
    }),

    script: () => ({
      type: 'script',
      title: `Leitfaden: ${request.queueItemTitle}`,
      generatedContent: `## Telefonleitfaden: ${request.queueItemTitle}

### Gesprächseröffnung
"Guten Tag, mein Name ist [Name]. Ich rufe an bezüglich ${request.queueItemTitle} im Projekt ${request.projectContext}."

### Kernpunkte
- ${request.queueItemDescription || 'Ziel des Gesprächs erklären'}
- Konkrete nächste Schritte besprechen
- Zeitplan abstimmen

### Mögliche Einwände & Antworten
**E: "Ich habe gerade keine Zeit"**
A: "Kein Problem, wann wäre Ihnen ein besserer Zeitpunkt?"

**E: "Das müssen Sie mit jemand anderem klären"**
A: "Verstanden, an wen soll ich mich wenden?"

### Abschluss
- Zusammenfassung der besprochenen Punkte
- Termine für nächste Schritte festlegen
- Dank für das Gespräch`,
    }),

    risk_assessment: () => ({
      type: 'risk_assessment',
      title: `Risikoanalyse: ${request.queueItemTitle}`,
      generatedContent: `## Risikoanalyse: ${request.queueItemTitle}

### Bewertungsskala
- **Wahrscheinlichkeit:** Niedrig | Mittel | Hoch
- **Auswirkung:** Niedrig | Mittel | Hoch

### Identifizierte Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Gesamtrisiko |
|--------|-------------------|------------|--------------|
| Zeitverzug | Mittel | Hoch | **Kritisch** |
| Budgetüberschreitung | Niedrig | Mittel | Moderat |
| Qualitätsmängel | Mittel | Mittel | Moderat |

### Empfohlene Maßnahmen
1. **Proaktive Planung:** Frühzeitig Ressourcen sichern
2. **Regelmäßige Reviews:** Kontrollpunkte einbauen
3. **Fallback-Optionen:** Alternativen vorbereiten

### Fazit
Das Gesamtrisiko für "${request.queueItemTitle}" ist beherrschbar, erfordert aber regelmäßige Überwachung.`,
    }),

    next_steps: () => ({
      type: 'next_steps',
      title: `Nächste Schritte: ${request.queueItemTitle}`,
      generatedContent: `## Aktionsplan: ${request.queueItemTitle}

### Sofort (Heute)
- [ ] Erste Recherche durchführen
- [ ] Kontaktdaten der relevanten Stellen ermitteln
- [ ] Unterlagen zusammenstellen

### Kurzfristig (Diese Woche)
- [ ] ${request.queueItemTitle} - erste Schritte initiieren
- [ ] Beteiligte informieren
- [ ] Erste Termine vereinbaren

### Mittelfristig (2-4 Wochen)
- [ ] Hauptaufgaben abschließen
- [ ] Zwischenergebnisse prüfen
- [ ] Nächste Phase planen

### Verantwortlichkeiten
- **Projekt:** [Projektleiter]
- **${request.queueItemTitle}:** [Verantwortlicher]
- **Unterstützung:** [Team/externe Partner]

### Erfolgskriterien
- ${request.queueItemDescription ? `Ziel: ${request.queueItemDescription}` : 'Ziel klar definiert und kommuniziert'}
- Meilensteine erreicht
- Qualitätssicherung durchgeführt`,
    }),
  }

  const generator = templates[request.actionType]
  if (!generator) {
    return {
      type: request.actionType,
      title: `Arbeitshilfe: ${request.queueItemTitle}`,
      generatedContent: `Arbeitshilfe für: ${request.queueItemTitle}\n\n${request.queueItemDescription || ''}\n\n(Bitte manuell ausfüllen)`,
    }
  }

  return generator()
}

/**
 * Generiert eine KI-basierte Arbeitshilfe für einen Queue-Eintrag
 * 
 * TODO: Bei Verfügbarkeit der OpenClaw Bridge:
 * - Entferne Mock-Implementierung
 * - Aktiviere fetch() zum Backend
 * - Nutze QUEUE_ACTION_PROMPTS für das Prompt-Template
 */
export async function generateQueueAIAction(
  request: QueueAIActionRequest
): Promise<QueueAIActionResponse> {
  // TODO: Erstelle das Prompt-Template (für spätere KI-Nutzung)
  // const prompt = QUEUE_ACTION_PROMPTS[request.actionType]?.(request) || ''

  // Für jetzt: Mock-Implementierung mit Templates
  // TODO: Hier später echte KI-Anbindung über:
  // const response = await fetch('/api/openclaw/queue-action', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ ...request, prompt })
  // })
  
  // Simuliere API-Latenz
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return generateMockResponse(request)
}

/**
 * Generiert eine eindeutige ID für AI Actions
 */
export function generateAIActionId(): string {
  return `aiaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Hilfsfunktion: Liest AI Actions aus dem Queue-Item
 */
export function getAIActionsFromQueueItem(itemId: string, twinId: string): unknown[] {
  try {
    const key = `attentionQueue_${twinId}`
    const stored = localStorage.getItem(key)
    if (!stored) return []
    
    const items = JSON.parse(stored)
    const item = items.find((i: { id: string }) => i.id === itemId)
    return item?.aiActions || []
  } catch {
    return []
  }
}
