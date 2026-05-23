/**
 * OSION Load Pilot - Measures System
 * Maßnahmen-Datenmodell für projektübergreifende Aufgabensteuerung
 */

export type MeasureStatus = 'idea' | 'open' | 'in_progress' | 'waiting' | 'blocked' | 'done' | 'discarded'
export type MeasurePriority = 'critical' | 'high' | 'medium' | 'low'
export type DueDateCategory = 'overdue' | 'today' | 'next_7_days' | 'later' | 'no_due_date'

export interface Measure {
  id: string
  projectId: string
  projectTitle: string
  parentId?: string | null
  
  title: string
  description?: string
  
  status: MeasureStatus
  priority: MeasurePriority
  
  dueDate?: string | null
  createdAt: string
  completedAt?: string | null
  
  owner?: string
  valueScore?: number
  
  strategicGoal?: string
  notes?: string
  linkedProcessStepId?: string
  
  tags?: string[]
  source: 'manual' | 'twin_action' | 'twin_recommended' | 'twin_nextStep' | 'generated'
}

export interface MeasureFilter {
  priority?: MeasurePriority[]
  status?: MeasureStatus[]
  dueDateCategory?: DueDateCategory[]
  projectId?: string[]
  owner?: string[]
}

export interface MeasureStats {
  total: number
  critical: number
  high: number
  medium: number
  low: number
  
  open: number
  inProgress: number
  waiting: number
  blocked: number
  done: number
  
  overdue: number
  today: number
  next7Days: number
  later: number
  noDueDate: number
}

export interface CommandDashboardData {
  measures: Measure[]
  stats: MeasureStats
  projectsWithBlockers: string[]
  projectsNeedingUpdate: string[]
}
