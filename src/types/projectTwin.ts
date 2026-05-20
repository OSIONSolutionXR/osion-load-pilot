export type ProjectStatus = 'active' | 'blocked' | 'waiting' | 'parked'
export type EffortLevel = 'low' | 'medium' | 'high'
export type ImpactLevel = 'low' | 'medium' | 'high'
export type InfluenceLevel = 'low' | 'medium' | 'high'
export type DependencyStatus = 'required' | 'blocked' | 'waiting' | 'done'
export type RiskSeverity = 'low' | 'medium' | 'high'
export type ActionPriority = 'low' | 'medium' | 'high'

export interface ProjectInfo {
  title: string
  description: string
  status: ProjectStatus
  type: string
}

export interface NextMove {
  title: string
  reason: string
  effort: EffortLevel
  impact: ImpactLevel
  deadline: string | null
}

export interface ProjectActor {
  name: string
  role: string
  influence: InfluenceLevel
  waitingFor: string | null
}

export interface ProjectDependency {
  from: string
  to: string
  status: DependencyStatus
  isBlocker: boolean
  explanation: string
}

export interface ProjectRisk {
  title: string
  severity: RiskSeverity
  explanation: string
}

export interface ProjectScenario {
  title: string
  outcome: string
  riskLevel: RiskSeverity
  recommendation: string
}

export interface ProjectAction {
  title: string
  owner: string
  priority: ActionPriority
  messageDraft?: string | null
}

export interface ProjectTwinAnalysis {
  project: ProjectInfo
  nextMove: NextMove
  actors: ProjectActor[]
  dependencies: ProjectDependency[]
  risks: ProjectRisk[]
  scenarios: ProjectScenario[]
  actions: ProjectAction[]
}
