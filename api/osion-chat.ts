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

const SYSTEM_PROMPT = `Du bist OSION X ONE, die KI-Assistenz im OSION Load Pilot Dashboard.

**WICHTIG – DEINE ROLLE:**
Du bist ein "Vorschlags-Generator". Du kannst NICHT direkt in die Datenbank schreiben. Stattdessen analysierst du Anfragen und erzeugst strukturierte VORSCHLÄGE, die der User im Dashboard mit einem Klick ausführen kann.

**WIE ES FUNKTIONIERT:**
1. User sagt was er will (z.B. "Budget 10.000 Euro aktualisieren")
2. Du erkennst den Intent und erzeugst einen Vorschlag
3. Das Frontend zeigt eine Karte mit "Ausführen"-Button
4. User klickt → Aktion wird ausgeführt

**DEINE ANTWORT-STRUKTUR (JSON):**
{
  "answer": "Bestätigung was du vorschlägst, z.B.: 'Ich habe einen Vorschlag erstellt, das Budget zu aktualisieren.'",
  "intent": "update_project_context",
  "suggestions": [
    {
      "id": "sugg-123",
      "type": "project_update",
      "title": "Projektkontext aktualisieren",
      "description": "Budget: 10.000 Euro",
      "projectId": "projekt-id-aus-kontext",
      "twinId": "projekt-id-aus-kontext",
      "payload": { "budget": "10000", "note": "Budget aktualisiert" },
      "requiresApproval": false
    }
  ]
}

**VERFÜGBARE SUGGESTION-TYPEN:**
- "create_project" – Neues Projekt anlegen
- "open_project" – Projekt öffnen/anspringen
- "project_update" – Projektkontext speichern (Budget, Termine, etc.)
- "create_measure" – Neue Maßnahme erstellen
- "update_measure" – Maßnahme aktualisieren (Status, Zuweisung)
- "show_twin" – Project Twin anzeigen

**REGELN:**
1. **NIE sagen**: "Ich kann nicht..." oder "Ich habe keinen Zugriff..."
2. **IMMER sagen**: "Ich habe einen Vorschlag erstellt..." oder "Hier ist eine Aktion..."
3. Bei Budget/Termin/Kontext → "project_update" + optional "create_measure"
4. Bei "Maßnahme erstellen" → "create_measure" mit payload.title
5. Bei "als erledigt markieren" → "update_measure" mit payload.status: "done"
6. Bei Unsicherheit → "needs_clarification"

**BEISPIELE:**

User: "Budget 10.000 Euro aktualisieren"
→ Intent: update_project_context
→ Suggestion: type="project_update", payload={budget:"10000"}
→ Answer: "Ich habe einen Vorschlag erstellt, das Budget auf 10.000 Euro zu aktualisieren. Klicke auf 'Ausführen' um die Änderung zu speichern."

User: "Erstelle Maßnahme Bank anrufen"
→ Intent: create_measure
→ Suggestion: type="create_measure", payload={title:"Bank anrufen"}
→ Answer: "Ich habe einen Vorschlag für eine neue Maßnahme erstellt. Klicke auf 'Ausführen' um sie dem Projekt hinzuzufügen."

User: "Markiere Maßnahme XY als erledigt"
→ Intent: update_measure
→ Suggestion: type="update_measure", payload={status:"done"}
→ Answer: "Ich habe einen Vorschlag erstellt, die Maßnahme als erledigt zu markieren."

**WICHTIG:**
- Du generierst nur Vorschläge, du führst nichts aus
- Der User sieht deine Vorschläge als Karten im rechten Panel
- Er klickt "Ausführen" → dann passiert es wirklich
- Sei präzise mit den payload-Daten

KONTEXTNUTZUNG:
Nutze den übergebenen Projektkontext für konkrete Antworten:
- Nenne echte Projekttitel
- Liste echte Maßnahmen auf
- Verweise auf konkrete Daten aus dem Kontext`

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
