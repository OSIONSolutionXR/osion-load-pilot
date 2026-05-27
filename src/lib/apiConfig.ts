/**
 * OSION Load Pilot - API Configuration
 * Phase 5: External Hostinger API
 */

// API Base URL from environment or fallback
export const API_BASE_URL = import.meta.env.VITE_LOADPILOT_API_BASE_URL || 'http://localhost:8789'

// API Endpoints
export const API_ENDPOINTS = {
  health: '/health',
  projects: '/api/projects',
  project: (id: string) => `/api/projects/${id}`,
  contextPack: (id: string) => `/api/projects/${id}/context-pack`,
  analyzeProject: '/api/analyze-project',
  updateProjectTwin: '/api/update-project-twin',
  chat: '/api/osion-chat'
} as const

// Full URL builders
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`
}

export function getHealthUrl(): string {
  return getApiUrl(API_ENDPOINTS.health)
}

export function getProjectsUrl(): string {
  return getApiUrl(API_ENDPOINTS.projects)
}

export function getProjectUrl(id: string): string {
  return getApiUrl(API_ENDPOINTS.project(id))
}

export function getContextPackUrl(id: string): string {
  return getApiUrl(API_ENDPOINTS.contextPack(id))
}

export function getAnalyzeUrl(): string {
  return getApiUrl(API_ENDPOINTS.analyzeProject)
}

export function getUpdateTwinUrl(): string {
  return getApiUrl(API_ENDPOINTS.updateProjectTwin)
}

export function getChatUrl(): string {
  return getApiUrl(API_ENDPOINTS.chat)
}
