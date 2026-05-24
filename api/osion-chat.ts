import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const MAX_INPUT_LENGTH = 4000
const REQUEST_TIMEOUT_MS = 120000

interface ChatProjectContext {
  id: string
  title: string
  description?: string
  status?: string
  progress?: { percent: number }
  measures?: { id: string; title: string; status: string; priority?: string; dueDate?: string | null }[]
}

interface ChatIntentRecognition {
  intent: string
  confidence: number
  entities: {
    projectId?: string
    projectTitle?: string
    measureId?: string
    measureTitle?: string
    dueDate?: string
    priority?: string
    status?: string
    budget?: string
  }
  suggestedActions?: {
    type: string
    title: string
    description: string
    payload?: Record<string, unknown>
  }[]
}

interface ChatResponse {
  answer: string
  intent?: string
  suggestions?: {
    id: string
    type: string
    title: string
    description: string
    projectId?: string
    twinId?: string
    targetMeasureIds?: string[]
    payload?: Record<string, unknown>
    requiresApproval: boolean
  }[]
}

const SYSTEM_PROMPT = `Du bist OSION X ONE, die interne KI des OSION Load Pilot Systems.

Deine Aufgabe: Projektsteuerung, nicht nur Konversation.

WICHTIG - INTENT ERKENNUNG:
Analysiere jede Nutzeranfrage und erkenne die Intention. Antworte IMMER im JSON-Format.

VERFÜGBARE INTENTS:
- list_projects: "Zeig mir alle Projekte", "Liste Projekte", "Welche Projekte habe ich"
- open_project: "Öffne Projekt X", "Zeig Projekt X", "Zu Projekt X"
- summarize_project: "Zusammenfassung Projekt X", "Was ist der Stand bei X"
- list_measures: "Liste Maßnahmen", "Zeig Maßnahmen", "Was muss getan werden"
- list_blocked_measures: "Was ist blockiert", "Blockierte Maßnahmen", "Hindernisse"
- list_due_measures: "Was ist fällig", "Fällige Maßnahmen", "Diese Woche"
- create_project: "Lege Projekt an", "Neues Projekt", "Erstelle Projekt"
- create_measure: "Erstelle Maßnahme", "Neue Maßnahme", "Aufgabe hinzufügen"
- update_measure: "Markiere als erledigt", "Status ändern", "Abschließen"
- update_project_context: Kontext-Updates wie Budget, Termine, neue Informationen
- add_project_note: "Notiz speichern", "Hinweis im Projekt"
- general_chat: Normale Fragen, Hilfe, Erklärungen

ACTION-SUGGESTIONS:
Wenn der User etwas tun möchte, generiere passende Vorschläge:

Beispiel "Budget 150.000 Euro":
→ Intent: update_project_context
→ Suggestions:
   1. "Projektkontext speichern" (type: project_update)
   2. "Maßnahme erstellen: Budgetplanung" (type: create_measure)

Beispiel "Erstelle Maßnahme Bank anrufen":
→ Intent: create_measure
→ Suggestions:
   1. "Maßnahme erstellen: Bank anrufen" (type: create_measure)

Beispiel "Zeig mir alle Projekte":
→ Intent: list_projects
→ Antwort: Liste der Projekte
→ Suggestions: "Projekt öffnen" Karten für jedes Projekt

ANTWORTFORMAT (JSON):
{
  "answer": "Deine natürliche Antwort an den User",
  "intent": "erkannte_intention",
  "suggestions": [
    {
      "id": "sugg-{timestamp}",
      "type": "create_measure|project_update|open_project|...",
      "title": "Titel für die Karte",
      "description": "Beschreibung",
      "projectId": "optional",
      "twinId": "optional",
      "targetMeasureIds": ["optional"],
      "payload": { "title": "...", "description": "...", "priority": "..." },
      "requiresApproval": true|false
    }
  ]
}

REGELN:
1. Wenn Budget/Termin/Kontext genannt wird → update_project_context + optional create_measure
2. Wenn "Maßnahme" oder "Aufgabe" genannt → create_measure
3. Wenn "Projekt" + "anlegen/erstellen/neu" → create_project
4. Bei "Zeig/Löste/Öffne" + Projektname → open_project
5. Bei Blockern → list_blocked_measures
6. Bei Fristen → list_due_measures
7. Bei Unsicherheit → Nachfrage mit clarification_needed

KONTEXTNUTZUNG:
Nutze den übergebenen Projektkontext für konkrete Antworten:
- Nenne echte Projekttitel
- Liste echte Maßnahmen
- Zeige echte Blocker
- Nenne echte Fristen`

function extractJsonFromResponse(content: string): ChatResponse {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || 
                      content.match(/```\s*([\s\S]*?)```/)
    
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()
    const parsed = JSON.parse(jsonStr)
    
    return {
      answer: parsed.answer || content,
      intent: parsed.intent,
      suggestions: parsed.suggestions || []
    }
  } catch {
    // Fallback: plain text response
    return { 
      answer: content,
      suggestions: []
    }
  }
}

function buildContextPrompt(projects: ChatProjectContext[], activeProjectId?: string): string {
  if (!projects || projects.length === 0) {
    return '\n\nAKTUELLER KONTEXT: Keine Projekte vorhanden.'
  }

  const activeProject = activeProjectId 
    ? projects.find(p => p.id === activeProjectId)
    : null

  let context = '\n\nAKTUELLER KONTEXT:\n'
  context += `Verfügbare Projekte: ${projects.length}\n`
  
  if (activeProject) {
    context += `\nAKTIVES PROJEKT: "${activeProject.title}" (ID: ${activeProject.id})\n`
    context += `Fortschritt: ${activeProject.progress?.percent || 0}%\n`
    context += `Status: ${activeProject.status || 'active'}\n`
    
    if (activeProject.description) {
      context += `Beschreibung: ${activeProject.description.slice(0, 200)}\n`
    }
    
    if (activeProject.measures?.length) {
      context += `\nMASSNAHMEN (${activeProject.measures.length}):\n`
      
      // Blockierte Maßnahmen
      const blocked = activeProject.measures.filter(m => m.status === 'blocked')
      if (blocked.length) {
        context += `  BLOCKIERT (${blocked.length}):\n`
        blocked.forEach(m => context += `    - ${m.title}\n`)
      }
      
      // Offene Maßnahmen
      const open = activeProject.measures.filter(m => 
        ['idea', 'open', 'in_progress', 'waiting'].includes(m.status)
      )
      if (open.length) {
        context += `  OFFEN (${open.length}):\n`
        open.slice(0, 10).forEach(m => {
          const due = m.dueDate ? ` (fällig: ${m.dueDate})` : ''
          context += `    - ${m.title} [${m.status}, ${m.priority || 'medium'}]${due}\n`
        })
      }
    }
  } else {
    context += '\nProjektliste:\n'
    projects.forEach(p => {
      context += `  - "${p.title}" (${p.measures?.length || 0} Maßnahmen, ${p.progress?.percent || 0}% Fortschritt)\n`
    })
  }

  return context
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Nur POST ist erlaubt.' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY nicht konfiguriert' })
  }

  const { message, history, projects, activeProjectId } = req.body || {}

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Nachricht fehlt.' })
  }

  if (message.length > MAX_INPUT_LENGTH) {
    return res.status(400).json({ 
      error: `Nachricht ist zu lang. Maximal ${MAX_INPUT_LENGTH} Zeichen erlaubt.` 
    })
  }

  const openai = new OpenAI({ apiKey })
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  // Build context from projects
  const contextPrompt = buildContextPrompt(projects || [], activeProjectId)

  // Build messages array
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT + contextPrompt }
  ]

  // Add history if provided
  if (Array.isArray(history)) {
    for (const m of history) {
      if (typeof m.role === 'string' && typeof m.content === 'string') {
        if (['user', 'assistant'].includes(m.role)) {
          messages.push({ role: m.role as 'user' | 'assistant', content: m.content })
        }
      }
    }
  }

  // Add current message
  messages.push({ role: 'user', content: message.trim() })

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const completion = await openai.chat.completions.create(
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        signal: controller.signal as AbortSignal
      }
    )

    clearTimeout(timeout)

    const rawAnswer = completion.choices[0]?.message?.content?.trim()
    
    if (!rawAnswer) {
      throw new Error('Keine Antwort von OpenAI erhalten')
    }

    const parsed = extractJsonFromResponse(rawAnswer)

    return res.status(200).json(parsed)
  } catch (error) {
    console.error('OpenAI error:', error)
    
    if (error instanceof OpenAI.APIError) {
      return res.status(error.status || 502).json({ 
        error: `OpenAI Fehler: ${error.message}`,
        code: error.code
      })
    }

    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return res.status(502).json({ 
      error: 'KI-Verbindung nicht erreichbar',
      details: errorMessage
    })
  }
}
