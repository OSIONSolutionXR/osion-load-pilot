/**
 * OSION Load Pilot - Chat System Types
 * Erweitertes Chat-System mit echter Projektsteuerung
 */

import type { MeasurePriority, MeasureStatus } from './measures'

// ============================================================================
// INTENTS
// ============================================================================

export type ChatIntent =
  | 'list_projects'
  | 'open_project'
  | 'summarize_project'
  | 'list_measures'
  | 'list_blocked_measures'
  | 'list_due_measures'
  | 'create_project'
  | 'create_measure'
  | 'update_measure'
  | 'update_project_context'
  | 'add_project_note'
  | 'create_approval_item'
  | 'draft_email'
  | 'run_autopilot'
  | 'list_contacts'
  | 'find_missing_contacts'
  | 'list_risks'
  | 'create_risk_analysis'
  | 'needs_clarification'
  | 'general_chat'

// ============================================================================
// CHAT MESSAGE
// ============================================================================

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  isError?: boolean
  intent?: ChatIntent
  suggestions?: ChatSuggestion[]
}

// ============================================================================
// CHAT SUGGESTION (Vorschlagskarten)
// ============================================================================

export type ChatSuggestionType =
  | 'create_project'
  | 'open_project'
  | 'project_update'
  | 'add_project_note'
  | 'create_measure'
  | 'update_measure'
  | 'list_result'
  | 'draft_email'
  | 'approval_item'
  | 'run_autopilot'
  | 'risk_analysis'
  | 'needs_clarification'
  | 'show_twin'

export interface ChatSuggestion {
  id: string
  source: 'chat' | 'system'
  type: ChatSuggestionType
  title: string
  description: string
  projectId?: string
  twinId?: string
  targetMeasureIds?: string[]
  linkedContactIds?: string[]
  payload?: Record<string, unknown>
  requiresApproval: boolean
  status: 'suggested' | 'accepted' | 'rejected' | 'executed'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// PROJECT CONTEXT FOR AI
// ============================================================================

export interface ChatProjectContext {
  // Basis-Info
  id: string
  title: string
  description?: string
  status?: string
  type?: string
  
  // Progress
  progress?: {
    percent: number
    updatedAt?: string
  }
  
  // Inputs
  originalInput?: string
  latestInput?: string
  
  // Nächste Schritte
  nextMove?: string
  
  // Maßnahmen (gefiltert)
  measures: ChatMeasureContext[]
  blockedMeasures: ChatMeasureContext[]
  openMeasures: ChatMeasureContext[]
  doneMeasures: ChatMeasureContext[]
  dueMeasures: ChatMeasureContext[]
  
  // Risiken & Abhängigkeiten
  risks?: string[]
  dependencies?: string[]
  
  // Szenarien
  scenarios?: { title: string; description: string }[]
  
  // Kontakte & Freigaben
  contacts?: ChatContactContext[]
  approvalItems?: ChatApprovalContext[]
  
  // History & Memory
  projectHistory?: string[]
  memory?: string[]
  openQuestions?: { id: string; label: string; status: 'open' | 'answered' }[]
  
  // Meta
  updatedAt?: string
  createdAt?: string
}

export interface ChatMeasureContext {
  id: string
  title: string
  description?: string
  status: MeasureStatus
  priority: MeasurePriority
  dueDate?: string | null
  owner?: string
  valueScore?: number
  isBlocked?: boolean
  blockerReason?: string
}

export interface ChatContactContext {
  id: string
  name: string
  role?: string
  email?: string
  phone?: string
  company?: string
  isVerified: boolean
}

export interface ChatApprovalContext {
  id: string
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy?: string
  requestedAt?: string
}

// ============================================================================
// GLOBAL CONTEXT (Alle Projekte)
// ============================================================================

export interface ChatGlobalContext {
  projects: {
    id: string
    title: string
    status: string
    openMeasuresCount: number
    blockedMeasuresCount: number
    dueMeasuresCount: number
    progress: number
  }[]
  
  // Aggregierte Stats
  totalOpenMeasures: number
  totalBlockedMeasures: number
  totalDueMeasures: number
  totalOpenApprovals: number
  
  // Highlights
  criticalProjects: string[]  // Projekt-IDs mit kritischen Issues
  projectsNeedingAttention: string[]
}

// ============================================================================
// CHAT SESSION
// ============================================================================

export const CHAT_STORAGE_KEY = 'osion-load-pilot.chat-session.v1'

export interface ChatSession {
  id: string
  messages: ChatMessage[]
  suggestions: ChatSuggestion[]
  selectedProjectId: string | null
  scope: 'all' | 'selected' | 'none'
  createdAt: string
  updatedAt: string
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ChatIntentRecognition {
  intent: ChatIntent
  confidence: number
  entities: {
    projectId?: string
    projectTitle?: string
    measureId?: string
    measureTitle?: string
    contactName?: string
    dueDate?: string
    status?: string
    priority?: MeasurePriority
  }
  missingInfo?: string[]
  clarificationQuestion?: string
}

export interface ChatActionPayload {
  type: ChatSuggestionType
  projectId?: string
  twinId?: string
  payload?: Record<string, unknown>
}

// ============================================================================
// CONTEXT BUILDER RESULT
// ============================================================================

export interface BuildContextResult {
  globalContext: ChatGlobalContext
  selectedContext: ChatProjectContext | null
  scope: 'all' | 'selected' | 'none'
}
