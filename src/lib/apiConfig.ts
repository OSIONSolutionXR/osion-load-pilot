/**
 * OSION Load Pilot - API Configuration
 * Phase 5: External Hostinger API
 *
 * WICHTIG: Verwendet immer window.fetch für Browser-Kompatibilität
 * WICHTIG: ENV-Zugriff muss dynamisch sein, damit Vite nicht zur Build-Zeit ersetzt
 */

const DEFAULT_API_BASE_URL = 'https://loadpilot-api.srv1550219.hstgr.cloud'

/**
 * Normalisiert die API-Base-URL mit defensiven Korrekturen
 * für häufige Protokoll-Tippfehler
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

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_LOADPILOT_API_BASE_URL
)

// Debug-Ausgabe zur Laufzeit
console.log('[API Config] Normalized API_BASE_URL:', API_BASE_URL)
console.log('[API Config] Health URL:', getHealthUrl())
console.log('[API Config] Chat URL:', getChatUrl())
console.log('[API Config] Analyze URL:', getAnalyzeUrl())

/**
 * Baut eine vollständige API-URL
 * @param path API-Endpunkt-Pfad
 * @returns Vollständige HTTPS-URL
 */
function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${cleanPath}`
}

export function getHealthUrl(): string {
  return buildApiUrl('/health')
}

export function getChatUrl(): string {
  return buildApiUrl('/api/ai-chat')
}

export function getAnalyzeUrl(): string {
  return buildApiUrl('/api/analyze-project')
}

export function getUpdateTwinUrl(): string {
  return buildApiUrl('/api/update-project-twin')
}
