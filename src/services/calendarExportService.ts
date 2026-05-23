/**
 * OSION Load Pilot - Kalender-Export Service
 * Generiert .ics Datei-Inhalt für Maßnahmen-Deadlines
 */

export interface CalendarEvent {
  title: string
  date: string  // ISO 8601 date string
  description?: string
  location?: string
  durationMinutes?: number
}

/**
 * Generiert iCalendar (.ics) Format aus Events
 * RFC 5545 kompatibel
 */
export function exportToICS(events: CalendarEvent[]): string {
  if (events.length === 0) {
    throw new Error('Keine Events zum Exportieren')
  }

  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const uidBase = generateUID()

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OSION Load Pilot//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:OSION Load Pilot',
    'X-WR-TIMEZONE:Europe/Berlin',
  ]

  events.forEach((event, index) => {
    const vevent = generateVEvent(event, `${uidBase}-${index}`, now)
    lines.push(...vevent)
  })

  lines.push('END:VCALENDAR')

  // Zeilen falten (RFC 5545: max 75 Zeichen pro Zeile)
  return foldLines(lines).join('\r\n')
}

/**
 * Generiert ein einzelnes VEVENT
 */
function generateVEvent(event: CalendarEvent, uid: string, dtstamp: string): string[] {
  const lines: string[] = ['BEGIN:VEVENT']

  // UID und Zeitstempel
  lines.push(`UID:${uid}@osion-load-pilot`)
  lines.push(`DTSTAMP:${dtstamp}`)

  // Startzeit (ganztägig oder mit Zeit)
  const startDate = parseDate(event.date)
  const isAllDay = !event.date.includes('T')

  if (isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(startDate)}`)
    // Enddatum ist +1 Tag für ganztägige Events
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)
    lines.push(`DTEND;VALUE=DATE:${formatDateOnly(endDate)}`)
  } else {
    lines.push(`DTSTART:${formatDateTime(startDate)}`)
    const duration = event.durationMinutes || 60
    const endDate = new Date(startDate.getTime() + duration * 60000)
    lines.push(`DTEND:${formatDateTime(endDate)}`)
  }

  // Titel (escaped)
  lines.push(`SUMMARY:${escapeICS(event.title)}`)

  // Beschreibung (optional)
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICS(event.description)}`)
  }

  // Location (optional)
  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`)
  }

  // Alarms (15 Minuten vorher)
  lines.push('BEGIN:VALARM')
  lines.push('ACTION:DISPLAY')
  lines.push('DESCRIPTION:Reminder')
  lines.push('TRIGGER:-PT15M')
  lines.push('END:VALARM')

  lines.push('END:VEVENT')

  return lines
}

/**
 * Parst ein Datum (ISO 8601 oder einfaches Datum)
 */
function parseDate(dateStr: string): Date {
  // Prüfe ob es ein ISO-Datum ist
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return new Date(dateStr)
  }
  // DD.MM.YYYY Format
  const parts = dateStr.split('.')
  if (parts.length === 3) {
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  }
  return new Date(dateStr)
}

/**
 * Formatiert als YYYYMMDD
 */
function formatDateOnly(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '')
}

/**
 * Formatiert als YYYYMMDDTHHmmssZ
 */
function formatDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

/**
 * Escaped Zeichen für iCalendar
 */
function escapeICS(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * Generiert eine eindeutige UID
 */
function generateUID(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Faltet lange Zeilen (RFC 5545)
 */
function foldLines(lines: string[]): string[] {
  const result: string[] = []

  for (const line of lines) {
    if (line.length <= 75) {
      result.push(line)
    } else {
      // Erste Zeile: 75 Zeichen
      result.push(line.substring(0, 75))
      // Rest mit Leerzeichen
      let remaining = line.substring(75)
      while (remaining.length > 0) {
        const chunk = remaining.substring(0, 74)
        result.push(' ' + chunk)
        remaining = remaining.substring(74)
      }
    }
  }

  return result
}

/**
 * Erstellt einen Download-Trigger für die .ics Datei
 */
export function downloadICS(icsContent: string, filename: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Konvertiert Maßnahmen in Kalender-Events
 */
import type { Measure } from '../types/measures'

export function measuresToCalendarEvents(measures: Measure[]): CalendarEvent[] {
  return measures
    .filter(m => m.dueDate && m.status !== 'done' && m.status !== 'discarded')
    .map(measure => ({
      title: `📋 ${measure.title}`,
      date: measure.dueDate!,
      description: [
        `Maßnahme: ${measure.title}`,
        `Projekt: ${measure.projectTitle}`,
        `Priorität: ${measure.priority}`,
        measure.description || '',
        measure.owner ? `Verantwortlich: ${measure.owner}` : '',
      ].filter(Boolean).join('\n'),
      durationMinutes: 60,
    }))
}

/**
 * Generiert einen .ics Export für eine einzelne Maßnahme
 */
export function exportSingleMeasureToICS(measure: Measure): string {
  if (!measure.dueDate) {
    throw new Error('Maßnahme hat kein DueDate')
  }

  const event: CalendarEvent = {
    title: `📋 ${measure.title}`,
    date: measure.dueDate,
    description: [
      `Maßnahme: ${measure.title}`,
      `Projekt: ${measure.projectTitle}`,
      `Priorität: ${measure.priority}`,
      `Status: ${measure.status}`,
      measure.description || '',
      measure.owner ? `Verantwortlich: ${measure.owner}` : '',
      measure.strategicGoal ? `Strategisches Ziel: ${measure.strategicGoal}` : '',
    ].filter(Boolean).join('\n'),
    durationMinutes: 60,
  }

  return exportToICS([event])
}