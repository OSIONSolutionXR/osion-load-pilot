/**
 * OSION Load Pilot - API Configuration
 * Phase 5: External Hostinger API
 * 
 * WICHTIG: Verwendet immer window.fetch für Browser-Kompatibilität
 */

// API Base URL from environment or fallback
// In Vite müssen ENV-Variablen mit VITE_ beginnen
const RAW_API_URL = import.meta.env.VITE_LOADPILOT_API_BASE_URL || 'https://loadpilot-api.srv1550219.hstgr.cloud'

// Defensive Normalisierung: Korrigiere häufige Protokoll-Tippfehler
function normalizeApiBaseUrl(value: string): string {
  return value
    .trim()
    .replace(/^yhtps:\/\//i, 'https://')
    .replace(/^yhttps:\/\//i, 'https://')
    .replace(/^htps:\/\//i, 'https://')
    .replace(/\/$/, '')
}

// Sicherstellen: keine doppelten Slashes, korrektes Format
export const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL)

// API Endpoints (nur Pfade, keine vollständigen URLs)
const ENDPOINTS = {
  health: '/health',
  analyzeProject: '/api/analyze-project',
  updateProjectTwin: '/api/update-project-twin',
  chat: '/api/ai-chat'
} as const

/**
 * Baue vollständige API-URL
 * @param endpoint API-Endpunkt-Pfad
 * @returns Vollständige HTTPS-URL
 */
export function getApiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${cleanEndpoint}`
}

// Spezifische URL-Builder
export const getHealthUrl = (): string => getApiUrl(ENDPOINTS.health)
export const getAnalyzeUrl = (): string => getApiUrl(ENDPOINTS.analyzeProject)
export const getUpdateTwinUrl = (): string => getApiUrl(ENDPOINTS.updateProjectTwin)
export const getChatUrl = (): string => getApiUrl(ENDPOINTS.chat)

// Für Debugging: URL im Console-Log ausgeben
console.log('[API Config] Base URL:', API_BASE_URL)

