/**
 * OSION Load Pilot - API Configuration
 * Phase 5: External Hostinger API
 *
 * WICHTIG: ENV-Zugriff erfolgt erst bei erster Nutzung (Lazy Initialization)
 * um Vite's Build-Time Substitution zu umgehen.
 */

const DEFAULT_API_BASE_URL = 'https://loadpilot-api.srv1550219.hstgr.cloud'

/**
 * Liest ENV dynamisch bei erstem Zugriff.
 * Vite kann diesen Wert nicht zur Build-Zeit statisch ersetzen,
 * weil der Zugriff in einer Funktion erfolgt.
 */
function getEnvValue(): string | undefined {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.VITE_LOADPILOT_API_BASE_URL
  }
  return undefined
}

/**
 * Normalisiert die API-Base-URL mit defensiven Korrekturen
 */
function normalizeApiBaseUrl(value: string | undefined): string {
  const raw = String(value || DEFAULT_API_BASE_URL).trim()

  const fixed = raw
    .replace(/^yhttps:\/\//i, 'https://')
    .replace(/^yhtps:\/\//i, 'https://')
    .replace(/^htps:\/\//i, 'https://')
    .replace(/^http:\/\//i, 'https://')
    .replace(/\/+$/, '')

  if (!fixed.startsWith('https://')) {
    console.warn('[API Config] Invalid API base URL, using default:', raw)
    return DEFAULT_API_BASE_URL
  }

  return fixed
}

// Lazy-initialized API_BASE_URL (wird erst bei erstem Zugriff berechnet)
let _cachedApiBaseUrl: string | null = null

function getApiBaseUrl(): string {
  if (_cachedApiBaseUrl === null) {
    const envValue = getEnvValue()
    _cachedApiBaseUrl = normalizeApiBaseUrl(envValue)
    console.log('[API Config] Initialized API_BASE_URL:', _cachedApiBaseUrl)
  }
  return _cachedApiBaseUrl
}

/**
 * Baut eine vollständige API-URL
 */
function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const fullUrl = `${baseUrl}${cleanPath}`

  if (!fullUrl.startsWith('https://')) {
    console.error('[API Config] CRITICAL: Built invalid URL:', fullUrl)
    throw new Error(`Invalid API URL generated: ${fullUrl}`)
  }

  return fullUrl
}

// URL-Builder Funktionen
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

// Export für direkten Zugriff (wird erst bei Verwendung initialisiert)
export const API_BASE_URL = getApiBaseUrl()
