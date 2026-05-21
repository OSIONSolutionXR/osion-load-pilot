export type ProjectStatus = 'active' | 'blocked' | 'waiting' | 'parked'
export type EffortLevel = 'low' | 'medium' | 'high'
export type ImpactLevel = 'low' | 'medium' | 'high'
export type InfluenceLevel = 'low' | 'medium' | 'high'
export type DependencyStatus = 'required' | 'blocked' | 'waiting' | 'done'
export type RiskSeverity = 'low' | 'medium' | 'high'
export type ActionPriority = 'low' | 'medium' | 'high'
export type InputQuality = 'insufficient' | 'usable' | 'strong'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

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

export interface ProjectAnalysisQuality {
  inputQuality: InputQuality
  isActionable: boolean
  confidence: ConfidenceLevel
  missingContext: string[]
  reason: string
}

export interface ProjectAnalysisMeta {
  domain: string
  analysisMode: 'openclaw-kimi'
  promptVersion: string
  generatedAt: string
}

// Update/Historie für iteratives Twin-Refinement
export interface ChangedField {
  field: string
  oldValue: string
  newValue: string
}

export interface ProjectTwinUpdate {
  timestamp: string
  input: string
  summary: string
  changedFields: ChangedField[]
}

export interface UpdateMeta {
  updateMode: 'refine_existing_twin'
  originalInput: string
  additionalInput: string
  previousVersion: string // timestamp der vorherigen Version
}

export interface ProjectTwinAnalysis {
  project: ProjectInfo
  nextMove: NextMove
  actors: ProjectActor[]
  dependencies: ProjectDependency[]
  risks: ProjectRisk[]
  scenarios: ProjectScenario[]
  actions: ProjectAction[]
  quality: ProjectAnalysisQuality
  meta: ProjectAnalysisMeta
}
