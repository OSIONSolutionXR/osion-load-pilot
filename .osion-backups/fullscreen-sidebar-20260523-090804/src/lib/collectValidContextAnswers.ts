/**
 * Zentrale Sammelfunktion für gültige Kontextantworten
 * Tolerant gegenüber verschiedenen Datenstrukturen und Feldnamen
 */

import type { ProjectContextQuestion } from '../types/projectTwinV2'

export interface ValidatedContextAnswer {
  questionId: string
  label: string
  answer: string
  sourceMissingContext: string
}

/**
 * Prüft, ob ein Wert als gültige Antwort zählt
 */
function isValidAnswerValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim() !== ''
  if (typeof value === 'number') return !isNaN(value)
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    // Prüfe auf leeres Objekt oder Objekt mit sinnvollem Wert
    const keys = Object.keys(value as object)
    if (keys.length === 0) return false
    // Prüfe auf typische Antwort-Felder
    const obj = value as Record<string, unknown>
    const answerFields = ['answer', 'value', 'selectedValue', 'inputValue', 'response', 'text', 'details']
    for (const field of answerFields) {
      if (field in obj && isValidAnswerValue(obj[field])) return true
    }
    return false
  }
  return false
}

/**
 * Extrahiert den String-Wert aus verschiedenen Antwort-Strukturen
 */
function extractAnswerString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
  
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    
    // Prüfe typische Feldnamen in Prioritätsreihenfolge
    const fields = ['answer', 'value', 'selectedValue', 'inputValue', 'response', 'text', 'details', 'label']
    for (const field of fields) {
      if (field in obj) {
        const extracted = extractAnswerString(obj[field])
        if (extracted) return extracted
      }
    }
  }
  
  return null
}

/**
 * Bereinigt Labels für die Anzeige (entfernt technische Prefixe)
 */
function sanitizeLabel(label: string): string {
  if (!label) return 'Information'
  
  // Entferne "Details zu:" oder ähnliche technische Prefixe
  const prefixes = ['Details zu:', 'Details zu', 'Details:', 'Info zu:', 'Information zu:']
  let cleaned = label.trim()
  
  for (const prefix of prefixes) {
    if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
      cleaned = cleaned.slice(prefix.length).trim()
      break
    }
  }
  
  // Entferne Fragezeichen am Ende für bessere Lesbarkeit
  cleaned = cleaned.replace(/\?$/, '').trim()
  
  return cleaned || 'Information'
}

/**
 * Sammelt alle gültigen Kontextantworten aus verschiedenen Quellen
 */
export function collectValidContextAnswers(
  answers: Record<string, unknown>,
  questions?: ProjectContextQuestion[]
): ValidatedContextAnswer[] {
  const validated: ValidatedContextAnswer[] = []
  
  for (const [questionId, rawValue] of Object.entries(answers)) {
    // Prüfe auf gültigen Wert
    if (!isValidAnswerValue(rawValue)) continue
    
    // Extrahiere den String-Wert
    const answerString = extractAnswerString(rawValue)
    if (!answerString) continue
    
    // Finde passende Frage für Metadaten
    const question = questions?.find(q => q.id === questionId)
    
    validated.push({
      questionId,
      label: sanitizeLabel(question?.label || questionId),
      answer: answerString,
      sourceMissingContext: question?.sourceMissingContext || ''
    })
  }
  
  return validated
}

/**
 * Baut zusätzlichen Input-Text aus validierten Antworten
 */
export function buildAdditionalInputFromValidated(
  validatedAnswers: ValidatedContextAnswer[]
): string {
  if (validatedAnswers.length === 0) return ''
  
  const parts = validatedAnswers.map(({ label, answer }) => {
    return `${label}: ${answer}`
  })
  
  return parts.join('. ')
}

/**
 * Zählt gültige Antworten in einem Record
 */
export function countValidAnswers(answers: Record<string, unknown>): number {
  return Object.values(answers).filter(isValidAnswerValue).length
}

/**
 * Prüft, ob mindestens eine gültige Antwort vorhanden ist
 */
export function hasAnyValidAnswer(answers: Record<string, unknown>): boolean {
  return Object.values(answers).some(isValidAnswerValue)
}
