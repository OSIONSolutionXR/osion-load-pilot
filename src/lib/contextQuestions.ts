/**
 * Context Questions Generator
 * 
 * Wandelt quality.missingContext in nutzerfreundliche Fragen um.
 * Domain-spezifische Formulierungen für verschiedene Projekttypen.
 */

import type { ProjectContextQuestion } from '../types/projectTwinV2'

export type QuestionDomain = 
  | 'private_purchase' 
  | 'financing' 
  | 'internal_project'
  | 'general'

interface QuestionTemplate {
  label: string
  reason: string
  inputType: 'text' | 'date' | 'number' | 'choice' | 'yes_no'
  options?: string[]
  priority: 'high' | 'medium' | 'low'
}

// Domain-spezifische Fragen-Mappings
const DOMAIN_QUESTIONS: Record<string, Record<string, QuestionTemplate>> = {
  private_purchase: {
    'Budgetrahmen': {
      label: 'Welcher Budgetrahmen ist für den Kauf geplant?',
      reason: 'Der Budgetrahmen begrenzt die Optionen und bestimmt Verhandlungsspielräume.',
      inputType: 'number',
      priority: 'high'
    },
    'Budget': {
      label: 'Welcher Budgetrahmen ist für den Kauf geplant?',
      reason: 'Der Budgetrahmen begrenzt die Optionen und bestimmt Verhandlungsspielräume.',
      inputType: 'number',
      priority: 'high'
    },
    'Budgetobergrenze': {
      label: 'Welche Budgetobergrenze ist geplant?',
      reason: 'Die Obergrenze begrenzt die Optionen und bestimmt Verhandlungsspielräume.',
      inputType: 'number',
      priority: 'high'
    },
    'Budgetgrenze': {
      label: 'Welche Budgetgrenze soll nicht überschritten werden?',
      reason: 'Die Budgetgrenze begrenzt die Optionen und bestimmt Verhandlungsspielräume.',
      inputType: 'number',
      priority: 'high'
    },
    'Budget inklusive Nebenkosten': {
      label: 'Ist das Budget inklusive oder exklusive Nebenkosten?',
      reason: 'Nebenkosten wie Versicherung, Steuern und Zulassung können den Gesamtpreis erheblich beeinflussen.',
      inputType: 'choice',
      options: ['Inklusive aller Nebenkosten', 'Nur Kaufpreis (Nebenkosten extra)', 'Noch unklar'],
      priority: 'high'
    },
    'Nutzungsprofil': {
      label: 'Wofür wird das Auto hauptsächlich genutzt?',
      reason: 'Das Nutzungsprofil beeinflusst Prioritäten und Anforderungen maßgeblich.',
      inputType: 'choice',
      options: ['Familie', 'Arbeit', 'Langstrecke', 'Stadtverkehr', 'Freizeit', 'Gemischt'],
      priority: 'medium'
    },
    'Fahrzeugtyp': {
      label: 'Welche Fahrzeugart kommt aktuell infrage?',
      reason: 'Die Typ-Entscheidung schränkt die Suche und Optionen ein.',
      inputType: 'choice',
      options: ['Kleinwagen', 'Kombi', 'SUV', 'Van', 'Transporter', 'Noch offen'],
      priority: 'medium'
    },
    'Zahlungsweise': {
      label: 'Soll der Kauf bar, finanziert oder geleast werden?',
      reason: 'Die Zahlungsweise beeinflusst Verhandlungsspielraum und Gesamtkosten.',
      inputType: 'choice',
      options: ['Barzahlung', 'Finanzierung', 'Leasing', 'Noch unklar'],
      priority: 'high'
    },
    'Zeitrahmen': {
      label: 'Bis wann soll die Kaufentscheidung fallen?',
      reason: 'Der Zeitrahmen beeinflusst Dringlichkeit und Verhandlungsdruck.',
      inputType: 'date',
      priority: 'medium'
    },
    'Frist': {
      label: 'Gibt es eine feste Entscheidungsfrist?',
      reason: 'Fristen beeinflussen Dringlichkeit und Entscheidungsqualität.',
      inputType: 'date',
      priority: 'medium'
    }
  },

  financing: {
    'Bank': {
      label: 'Welche Bank wartet auf die Unterlagen?',
      reason: 'Die Bank bestimmt Anforderungen und Verhandlungsoptionen.',
      inputType: 'text',
      priority: 'high'
    },
    'Kreditgeber': {
      label: 'Welche Bank oder welcher Kreditgeber ist involviert?',
      reason: 'Der Kreditgeber bestimmt Anforderungen und Fristen.',
      inputType: 'text',
      priority: 'high'
    },
    'Finanzierungsobjekt': {
      label: 'Um welches Finanzierungsobjekt geht es konkret?',
      reason: 'Das Objekt bestimmt die Art der benötigten Unterlagen.',
      inputType: 'text',
      priority: 'high'
    },
    'Finanzierungsvolumen': {
      label: 'Wie hoch ist das Finanzierungsvolumen?',
      reason: 'Das Volumen beeinflusst Prüfprozesse und Entscheidungswege.',
      inputType: 'number',
      priority: 'high'
    },
    'Verkäuferfrist': {
      label: 'Ist die Verkäuferfrist verhandelbar?',
      reason: 'Verhandelbare Fristen eröffnen Handlungsspielräume.',
      inputType: 'yes_no',
      priority: 'high'
    },
    'Frist': {
      label: 'Wann läuft die aktuelle Frist ab?',
      reason: 'Fristen beeinflussen Dringlichkeit und Handlungsoptionen.',
      inputType: 'date',
      priority: 'high'
    },
    'Kommunikation': {
      label: 'Was wurde dem Verkäufer/Kreditgeber bereits zugesagt?',
      reason: 'Zusagen begrenzen Verhandlungsspielräume und erzeugen Verpflichtungen.',
      inputType: 'text',
      priority: 'medium'
    },
    'Unterlagen': {
      label: 'Welche Unterlagen fehlen noch konkret?',
      reason: 'Die fehlenden Unterlagen bestimmen den nächsten Arbeitsschritt.',
      inputType: 'text',
      priority: 'high'
    }
  },

  internal_project: {
    'Zielgruppe': {
      label: 'Welche Zielgruppe soll zuerst validiert werden?',
      reason: 'Die erste Zielgruppe prägt Produktentwicklung und Go-to-Market-Strategie.',
      inputType: 'choice',
      options: ['Unternehmer', 'Agenturen', 'Berater', 'Interne Nutzung', 'Noch offen'],
      priority: 'high'
    },
    'Erfolgskriterien': {
      label: 'Was bedeutet Erfolg konkret: Nutzerzahl, Umsatz, zahlende Kunden oder Validierung?',
      reason: 'Klare Erfolgskriterien ermöglichen Fokus und Messbarkeit.',
      inputType: 'choice',
      options: ['Nutzerzahl', 'Umsatz', 'Zahlende Kunden', 'Produktvalidierung', 'Noch unklar'],
      priority: 'high'
    },
    'Erfolgskriterium': {
      label: 'Woran erkennst du den Erfolg konkret?',
      reason: 'Klare Erfolgskriterien ermöglichen Fokus und Messbarkeit.',
      inputType: 'text',
      priority: 'high'
    },
    'Zeitraum': {
      label: 'In welchem Zeitraum soll der Erfolg bewertet werden?',
      reason: 'Der Zeitraum beeinflusst Strategie und Ressourcenplanung.',
      inputType: 'choice',
      options: ['1-3 Monate', '3-6 Monate', '6-12 Monate', '1-2 Jahre', 'Langfristig'],
      priority: 'medium'
    },
    'Ressourcen': {
      label: 'Welche Ressourcen stehen für Entwicklung und Vertrieb bereit?',
      reason: 'Verfügbare Ressourcen bestimmen Umsetzungsgeschwindigkeit und -qualität.',
      inputType: 'text',
      priority: 'medium'
    },
    'Feedback': {
      label: 'Gibt es bereits Nutzerfeedback oder Marktvalidierung?',
      reason: 'Vorhandenes Feedback reduziert Unsicherheit und Risiko.',
      inputType: 'yes_no',
      priority: 'medium'
    },
    'Zielmarkt': {
      label: 'Was ist der primäre Zielmarkt?',
      reason: 'Der Zielmarkt bestimmt Strategie und Ressourcenbedarf.',
      inputType: 'text',
      priority: 'medium'
    }
  },

  general: {
    'Budgetrahmen': {
      label: 'Welcher Budgetrahmen ist geplant?',
      reason: 'Der Budgetrahmen beeinflusst alle weiteren Entscheidungen maßgeblich.',
      inputType: 'number',
      priority: 'high'
    },
    'Budget': {
      label: 'Welcher Budgetrahmen steht zur Verfügung?',
      reason: 'Der Budgetrahmen begrenzt Optionen und Möglichkeiten.',
      inputType: 'number',
      priority: 'high'
    },
    'Budgetobergrenze': {
      label: 'Welche Budgetobergrenze ist geplant?',
      reason: 'Die Budgetobergrenze begrenzt die verfügbaren Optionen.',
      inputType: 'number',
      priority: 'high'
    },
    'monatliche Belastungsgrenze': {
      label: 'Wie hoch ist die monatliche Belastungsgrenze?',
      reason: 'Die monatliche Belastung beeinflusst Finanzierungsentscheidungen.',
      inputType: 'number',
      priority: 'high'
    },
    'Entscheidung Neuwagen vs. Gebraucht vs. Jahreswagen': {
      label: 'Soll es ein Neuwagen, Gebrauchtwagen oder Jahreswagen sein?',
      reason: 'Die Fahrzeugart beeinflusst Preis, Garantie und Verfügbarkeit erheblich.',
      inputType: 'choice',
      options: ['Neuwagen', 'Gebrauchtwagen', 'Jahreswagen', 'Noch unentschieden'],
      priority: 'high'
    },
    'Bevorzugte Antriebsart': {
      label: 'Welche Antriebsart bevorzugst du?',
      reason: 'Die Antriebsart beeinflusst Betriebskosten und Fahrverhalten.',
      inputType: 'choice',
      options: ['Benzin', 'Diesel', 'Elektro', 'Hybrid', 'Noch offen'],
      priority: 'medium'
    },
    'Nutzungsprofil': {
      label: 'Wie wird das Fahrzeug hauptsächlich genutzt?',
      reason: 'Das Nutzungsprofil bestimmt die Anforderungen an Größe und Komfort.',
      inputType: 'text',
      priority: 'medium'
    },
    'Zeithorizont für Kaufabschluss': {
      label: 'Bis wann soll der Kauf abgeschlossen sein?',
      reason: 'Der Zeithorizont beeinflusst Verhandlungsspielraum und Dringlichkeit.',
      inputType: 'date',
      priority: 'medium'
    },
    'Finanzierungsart': {
      label: 'Welche Finanzierungsart ist vorgesehen?',
      reason: 'Die Finanzierungsart beeinflusst Verhandlungsspielraum und Gesamtkosten.',
      inputType: 'choice',
      options: ['Barzahlung', 'Kredit/Finanzierung', 'Leasing', 'Noch unklar'],
      priority: 'high'
    },
    'Zeitrahmen': {
      label: 'Bis wann soll das Ziel erreicht werden?',
      reason: 'Der Zeitrahmen beeinflusst Dringlichkeit und Optionen.',
      inputType: 'date',
      priority: 'medium'
    },
    'Frist': {
      label: 'Gibt es einen festen Termin oder eine Frist?',
      reason: 'Fristen beeinflussen Dringlichkeit und Priorisierung.',
      inputType: 'date',
      priority: 'medium'
    },
    'Ziel': {
      label: 'Welches konkrete Ziel soll erreicht werden?',
      reason: 'Ein klares Ziel ermöglicht zielgerichtete Planung.',
      inputType: 'text',
      priority: 'high'
    },
    'Zielgruppe': {
      label: 'Wer ist die relevante Zielgruppe?',
      reason: 'Die Zielgruppe bestimmt Strategie und Vorgehen.',
      inputType: 'text',
      priority: 'medium'
    },
    'Ressourcen': {
      label: 'Welche Ressourcen stehen bereit?',
      reason: 'Verfügbare Ressourcen bestimmen Umsetzungsgeschwindigkeit.',
      inputType: 'text',
      priority: 'medium'
    },
    'Stakeholder': {
      label: 'Wer ist an der Entscheidung beteiligt?',
      reason: 'Stakeholder müssen frühzeitig identifiziert werden.',
      inputType: 'text',
      priority: 'medium'
    },
    'Risiken': {
      label: 'Welche Haupt-Risiken siehst du aktuell?',
      reason: 'Risiken früh identifizieren ermöglicht proaktives Handeln.',
      inputType: 'text',
      priority: 'low'
    },
    'Alternativen': {
      label: 'Welche Alternativen wurden bereits geprüft?',
      reason: 'Alternativen geben Kontext für Entscheidungen.',
      inputType: 'text',
      priority: 'low'
    }
  }
}

// Keywords für automatische Domain-Erkennung
const DOMAIN_KEYWORDS: Record<QuestionDomain, string[]> = {
  private_purchase: ['auto', 'kaufen', 'fahrzeug', 'leasing', 'finanzierung', 'gebraucht', 'neuwagen', 'autokauf'],
  financing: ['bank', 'kredit', 'bwa', 'finanzierung', 'darlehen', 'steuerberater', 'unterlagen', 'verkäufer'],
  internal_project: ['app', 'produkt', 'projekt', 'startup', 'unternehmen', 'team', 'nutzer', 'kunden'],
  general: []
}

/**
 * Erkennt Domain aus Input und Projekttyp
 */
export function detectDomain(
  input: string, 
  projectType: string
): QuestionDomain {
  const normalizedInput = input.toLowerCase()
  const normalizedType = projectType.toLowerCase()
  
  // Prüfe auf Domain-Keywords
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (domain === 'general') continue
    
    for (const keyword of keywords) {
      if (normalizedInput.includes(keyword) || normalizedType.includes(keyword)) {
        return domain as QuestionDomain
      }
    }
  }
  
  return 'general'
}

/**
 * Prüft ob ein Kontext-String ein bestimmtes Keyword enthält (case-insensitive)
 */
function matchesContext(ctx: string, keyword: string): boolean {
  const normalizedCtx = ctx.toLowerCase()
  const normalizedKeyword = keyword.toLowerCase()
  return normalizedCtx.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedCtx)
}

/**
 * Findet das beste Template für einen Kontext-String
 */
function findBestTemplate(
  ctx: string,
  domainTemplates: Record<string, QuestionTemplate>,
  generalTemplates: Record<string, QuestionTemplate>
): QuestionTemplate | null {
  // 1. Exakte Übereinstimmung in Domain-Templates
  if (domainTemplates[ctx]) {
    return domainTemplates[ctx]
  }
  
  // 2. Exakte Übereinstimmung in General-Templates
  if (generalTemplates[ctx]) {
    return generalTemplates[ctx]
  }
  
  // 3. Keyword-Matching in Domain-Templates
  for (const [key, template] of Object.entries(domainTemplates)) {
    if (matchesContext(ctx, key)) {
      return template
    }
  }
  
  // 4. Keyword-Matching in General-Templates
  for (const [key, template] of Object.entries(generalTemplates)) {
    if (matchesContext(ctx, key)) {
      return template
    }
  }
  
  return null
}

/**
 * Generiert Fragen aus missingContext mit Domain-spezifischen Formulierungen
 * Verwendet stabile IDs basierend auf dem Kontext, nicht auf Timestamp
 */
export function generateContextQuestions(
  missingContext: string[],
  input: string,
  projectType: string,
  maxQuestions: number = 5
): ProjectContextQuestion[] {
  const domain = detectDomain(input, projectType)
  const domainTemplates = DOMAIN_QUESTIONS[domain] || DOMAIN_QUESTIONS.general
  const generalTemplates = DOMAIN_QUESTIONS.general
  
  const questions: ProjectContextQuestion[] = []
  const usedContexts = new Set<string>()
  
  // 1. Domain-spezifische Fragen für bekannte Kontexte
  for (const ctx of missingContext) {
    if (usedContexts.size >= maxQuestions) break
    if (usedContexts.has(ctx)) continue
    
    const template = findBestTemplate(ctx, domainTemplates, generalTemplates)
    
    // Stabile ID basierend auf Kontext (nicht Timestamp!)
    const stableId = `ctxq-${ctx.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}`
    
    if (template) {
      questions.push({
        id: stableId,
        label: ctx,  // Themenbereich
        question: template.label,  // ← Der eigentliche Fragetext
        helperText: template.reason,  // ← Warum diese Frage wichtig ist
        reason: template.reason,
        sourceMissingContext: ctx,
        suggestedInputType: template.inputType,
        priority: template.priority,
        options: template.options,
        status: 'open'
      })
      usedContexts.add(ctx)
    }
  }
  
  // 2. Fallback für unbekannte Kontexte - generiere spezifischere Fragen
  for (const ctx of missingContext) {
    if (usedContexts.size >= maxQuestions) break
    if (usedContexts.has(ctx)) continue
    
    // Stabile ID basierend auf Kontext
    const stableId = `ctxq-${ctx.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30)}`
    
    // Intelligente Fallback-Fragen basierend auf Kontext-Inhalt
    let fallbackLabel = `Details zu: ${ctx}`
    let fallbackReason = 'Dieser Kontext fehlt für eine vollständige Analyse.'
    let fallbackInputType: 'text' | 'date' | 'number' | 'choice' | 'yes_no' = 'text'
    let fallbackPriority: 'high' | 'medium' | 'low' = 'low'
    
    const lowerCtx = ctx.toLowerCase()
    if (lowerCtx.includes('budget') || lowerCtx.includes('euro') || lowerCtx.includes('€')) {
      fallbackLabel = `Wie hoch ist der geplante Budgetrahmen?`
      fallbackReason = 'Der Budgetrahmen ist entscheidend für die weitere Planung.'
      fallbackInputType = 'number'
      fallbackPriority = 'high'
    } else if (lowerCtx.includes('datum') || lowerCtx.includes('frist') || lowerCtx.includes('termin') || lowerCtx.includes('zeit')) {
      fallbackLabel = `Bis wann soll dies geklärt sein?`
      fallbackReason = 'Der Zeitrahmen beeinflusst Dringlichkeit und Handlungsoptionen.'
      fallbackInputType = 'date'
      fallbackPriority = 'medium'
    } else if (lowerCtx.includes('neuwagen') || lowerCtx.includes('gebraucht') || lowerCtx.includes('wahl') || lowerCtx.includes('entscheidung')) {
      fallbackLabel = `Was ist hier die bevorzugte Option?`
      fallbackReason = 'Diese Entscheidung beeinflusst alle weiteren Schritte.'
      fallbackInputType = 'choice'
      fallbackPriority = 'high'
    } else if (lowerCtx.includes('finanzierung') || lowerCtx.includes('leasing') || lowerCtx.includes('bar')) {
      fallbackLabel = `Wie soll dies finanziert werden?`
      fallbackReason = 'Die Finanzierungsart beeinflusst Verhandlungsoptionen.'
      fallbackInputType = 'choice'
      fallbackPriority = 'high'
    }
    
    questions.push({
      id: stableId,
      label: ctx,  // Themenbereich
      question: fallbackLabel,  // ← Der eigentliche Fragetext
      helperText: fallbackReason,  // ← Warum diese Frage wichtig ist
      reason: fallbackReason,
      sourceMissingContext: ctx,
      suggestedInputType: fallbackInputType,
      priority: fallbackPriority,
      status: 'open'
    })
    usedContexts.add(ctx)
  }
  
  // 3. Nach Priorität sortieren
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  questions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  
  return questions.slice(0, maxQuestions)
}

/**
 * Prüft, ob die Kontextkarte angezeigt werden soll
 */
export function shouldShowContextCard(analysis: {
  quality: {
    isActionable: boolean
    inputQuality: string
    missingContext: string[]
    confidence: 'low' | 'medium' | 'high'
  }
}): boolean {
  // Nicht anzeigen wenn nicht speicherfähig
  if (!analysis.quality.isActionable) return false
  if (analysis.quality.inputQuality === 'insufficient') return false
  
  // Anzeigen wenn Kontext fehlt ODER confidence nicht high
  const hasMissingContext = analysis.quality.missingContext.length > 0
  const needsMoreConfidence = analysis.quality.confidence !== 'high'
  
  return hasMissingContext || needsMoreConfidence
}

/**
 * Formatiert die Liste der fehlenden Kontexte für die Anzeige
 */
export function formatMissingContextList(contexts: string[]): string {
  if (contexts.length === 0) return ''
  if (contexts.length === 1) return contexts[0]
  if (contexts.length === 2) return `${contexts[0]} und ${contexts[1]}`
  
  return contexts.slice(0, -1).join(', ') + ' und ' + contexts[contexts.length - 1]
}
