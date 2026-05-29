/**
 * OSION Load Pilot - API Configuration
 * Phase 5: External Hostinger API
 *
 * WICHTIG: Verwendet immer window.fetch für Browser-Kompatibilität
 */

const DEFAULT_API_BASE_URL = 'https://loadpilot-api.srv1550219.hstgr.cloud'

/**
 * Normalisiert die API-Base-URL mit defensiven Korrekturen
 * für häufige Protokoll-Tippfehler
 * Wird zur Laufzeit aufgerufen, um Build-Zeit ENV-Fehler zu korrigieren
 */
function normalizeApiBaseUrl(value: string | undefined): string {
  // Sicherstellen, dass wir einen String haben
  const raw = String(value || DEFAULT_API_BASE_URL).trim()

  // Defensive Korrektur: Ersetze offensichtliche Tippfehler
  let fixed = raw
    .replace(/^yhttps:\/\//i, 'https://')
    .replace(/^yhtps:\/\//i, 'https://')
    .replace(/^htps:\/\//i, 'https://')
    .replace(/^http:\/\//i, 'https://')

  // Entferne doppelte trailing slashes
  fixed = fixed.replace(/\/+$/, '')

  // Validierung: Muss mit https:// beginnen
  if (!fixed.startsWith('https://')) {
    console.warn('[API Config] Invalid API base URL detected:', raw)
    console.warn('[API Config] Using default URL:', DEFAULT_API_BASE_URL)
    return DEFAULT_API_BASE_URL
  }

  return fixed
}

// Hole die ENV-Variable (kann fehlerhaft sein wenn Vercel falsch konfiguriert)
const RAW_ENV_VALUE: string | undefined = import.meta.env.VITE_LOADPILOT_API_BASE_URL

// Normalisiere zur Laufzeit - korrigiert Build-Zeit-Fehler
export const API_BASE_URL = normalizeApiBaseUrl(RAW_ENV_VALUE)

// Debug: Zeige was passiert ist
console.log('[API Config] Raw ENV:', RAW_ENV_VALUE)
console.log('[API Config] Normalized:', API_BASE_URL)

/**
 * Baut eine vollständige API-URL
 * @param path API-Endpunkt-Pfad
 * @returns Vollständige HTTPS-URL
 */
function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const fullUrl = `${API_BASE_URL}${cleanPath}`

  // Sicherheitsprüfung: URL muss gültig sein
  if (!fullUrl.startsWith('https://')) {
    console.error('[API Config] CRITICAL: Built invalid URL:', fullUrl)
    throw new Error(`Invalid API URL generated: ${fullUrl}`)
  }

  return fullUrl
}

// URL-Builder Funktionen mit Debug-Logging
export function getHealthUrl(): string {
  const url = buildApiUrl('/health')
  console.log('[API Config] getHealthUrl():', url)
  return url
}

export function getChatUrl(): string {
  const url = buildApiUrl('/api/ai-chat')
  console.log('[API Config] getChatUrl():', url)
  return url
}

export function getAnalyzeUrl(): string {
  const url = buildApiUrl('/api/analyze-project')
  console.log('[API Config] getAnalyzeUrl():', url)
  return url
}

export function getUpdateTwinUrl(): string {
  const url = buildApiUrl('/api/update-project-twin')
  console.log('[API Config] getUpdateTwinUrl():', url)
  return url
}
