/**
 * OSION Project Simulator Types
 * Dynamische Simulation mit 100+ synthetischen Agenten
 */

export type SimulationStatus = 
  | 'idle'
  | 'generating_agents'
  | 'running_rounds'
  | 'synthesizing'
  | 'completed'
  | 'failed'

export type SimulationGoal =
  | 'market_reaction'
  | 'target_group_reaction'
  | 'risk_development'
  | 'measure_effectiveness'
  | 'decision_consequences'
  | 'price_acceptance'
  | 'media_reaction'
  | 'project_performance'
  | 'success_probability'
  | 'difficulty_simulation'
  | 'custom_scenario'

export type AgentArchetype =
  | 'entrepreneur'
  | 'customer'
  | 'skeptic'
  | 'expert'
  | 'media_voice'
  | 'social_media_voice'
  | 'reddit_voice'
  | 'youtube_voice'
  | 'practitioner'
  | 'competitor'
  | 'regulatory'
  | 'financial'
  | 'extreme_case'
  | 'early_adopter'
  | 'late_majority'
  | 'decision_maker'
  | 'influencer'
  | 'analyst'
  | 'developer'
  | 'end_user'

export type CommunicationStyle =
  | 'analytical'
  | 'emotional'
  | 'direct'
  | 'diplomatic'
  | 'skeptical'
  | 'enthusiastic'
  | 'cautious'
  | 'aggressive'
  | 'collaborative'

export type KnowledgeLevel = 'novice' | 'basic' | 'intermediate' | 'expert' | 'authority'
export type ProjectRelevance = 'none' | 'low' | 'medium' | 'high' | 'critical'
export type InitialPosition = 'strongly_opposed' | 'opposed' | 'skeptical' | 'neutral' | 'interested' | 'supportive' | 'strongly_supportive'
export type Sentiment = 'very_negative' | 'negative' | 'slightly_negative' | 'neutral' | 'slightly_positive' | 'positive' | 'very_positive'

export interface SimulationAgent {
  id: string
  displayName: string
  archetype: AgentArchetype
  role: string
  context: string
  worldview: string
  motivation: string
  fear: string
  bias: string
  communicationStyle: CommunicationStyle
  knowledgeLevel: KnowledgeLevel
  projectRelevance: ProjectRelevance
  influenceWeight: number // 0.0 - 1.0
  networkGroup: string
  initialPosition: InitialPosition
  likelyObjection: string
  likelySupport: string
  // Round statements
  statements: AgentStatement[]
  // Final evaluation
  finalEvaluation?: AgentFinalEvaluation
}

export interface AgentStatement {
  round: number
  statement: string
  context: string
  sentiment: Sentiment
  detectedObjection?: string
  detectedOpportunity?: string
  detectedRisk?: string
  changedPosition?: boolean
  previousPosition?: InitialPosition
  newPosition?: InitialPosition
}

export interface AgentFinalEvaluation {
  trustScore: number // 0-100
  usefulnessScore: number // 0-100
  riskScore: number // 0-100
  implementationReadiness: number // 0-100
  successProbabilityEstimate: number // 0-100
  nextMeasureRecommendation: string
  dealbreakers: string[]
  conditions: string[]
}

export interface AgentGroup {
  id: string
  name: string
  description: string
  agentIds: string[]
  dominantPerspective: string
  mainConcern: string
  mainOpportunity: string
  averageSentiment: Sentiment
}

export interface SimulationRound {
  round: number
  title: string
  description: string
  summary: string
  patterns: string[]
  conflicts: RoundConflict[]
  representativeStatements: RepresentativeStatement[]
  groupInteractions: GroupInteraction[]
}

export interface RoundConflict {
  between: string[] // agent or group IDs
  topic: string
  intensity: 'low' | 'medium' | 'high'
  resolution?: string
}

export interface RepresentativeStatement {
  agentId: string
  statement: string
  significance: string
}

export interface GroupInteraction {
  groupId: string
  round: number
  messages: GroupMessage[]
}

export interface GroupMessage {
  agentId: string
  message: string
  replyToAgentId?: string
  timestamp: string
}

export interface RawAgentStatement {
  agentId: string
  agentName: string
  agentArchetype: AgentArchetype
  round: number
  groupId?: string
  statement: string
  context: string
  sentiment: Sentiment
  detectedObjection?: string
  detectedOpportunity?: string
  detectedRisk?: string
}

export interface SimulationResult {
  // Scores
  resonanceScore: number // 0-100
  trustScore: number
  usefulnessScore: number
  riskScore: number
  adoptionScore: number
  successProbability: number
  projectPerformanceScore: number
  
  // Summaries
  summary: string
  performanceForecast: string
  successForecast: string
  difficultyMap: string[]
  
  // Insights
  topObjections: ObjectionItem[]
  topOpportunities: OpportunityItem[]
  topMisunderstandings: MisunderstandingItem[]
  targetGroupInsights: TargetGroupInsight[]
  stakeholderPatterns: StakeholderPattern[]
  decisionSignals: DecisionSignal[]
  influentialAgents: string[] // agent IDs
  opinionShifts: OpinionShift[]
}

export interface ObjectionItem {
  objection: string
  frequency: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedAgentGroups: string[]
  suggestedResponse: string
}

export interface OpportunityItem {
  opportunity: string
  potential: 'low' | 'medium' | 'high' | 'massive'
  supportingAgents: string[]
  actionRequired: string
}

export interface MisunderstandingItem {
  misunderstanding: string
  clarification: string
  affectedAgents: string[]
}

export interface TargetGroupInsight {
  group: string
  reaction: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  keyConcerns: string[]
  keyOpportunities: string[]
  trustLevel: number
  recommendation: string
}

export interface StakeholderPattern {
  pattern: string
  description: string
  affectedGroups: string[]
  strategicImplication: string
}

export interface DecisionSignal {
  signal: string
  strength: 'weak' | 'moderate' | 'strong'
  timing: string
  recommendation: string
}

export interface OpinionShift {
  agentId: string
  fromPosition: InitialPosition
  toPosition: InitialPosition
  reason: string
  round: number
}

export interface RecommendedMeasure {
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  reason: string
  expectedEffect: string
  linkedProcessStepId?: string
  supportingAgents: string[]
  opposingAgents: string[]
}

export interface RiskUpdate {
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  probability: 'unlikely' | 'possible' | 'likely' | 'very_likely'
  reason: string
  linkedProcessStepId?: string
  mitigatingAgents: string[]
  amplifyingAgents: string[]
}

export interface ProcessImpact {
  processStepId: string
  stepTitle: string
  impact: 'accelerate' | 'delay' | 'block' | 'modify' | 'remove' | 'add'
  recommendation: string
  reason: string
}

export interface SimulationConfig {
  goal: SimulationGoal
  customGoalDescription?: string
  question: string
  agentCount: number
  roundCount: number
  focusAreas: string[]
  projectContext?: string
}

export interface SimulationRun {
  id: string
  title: string
  type: SimulationGoal
  status: SimulationStatus
  
  config: SimulationConfig
  
  agentCount: number
  roundCount: number
  
  // Data
  agents: SimulationAgent[]
  groups: AgentGroup[]
  rounds: SimulationRound[]
  rawAgentStatements: RawAgentStatement[]
  conversations: GroupInteraction[]
  
  // Results
  result: SimulationResult
  recommendedMeasures: RecommendedMeasure[]
  riskUpdates: RiskUpdate[]
  processImpact: ProcessImpact[]
  
  // Metadata
  createdAt: string
  updatedAt: string
  completedAt?: string
  duration?: number // seconds
}

// UI Types
export interface SimulationFilter {
  archetype?: AgentArchetype[]
  networkGroup?: string[]
  initialPosition?: InitialPosition[]
  sentiment?: Sentiment[]
  searchQuery?: string
}

export type SimulationResultTab = 
  | 'overview'
  | 'measures'
  | 'risks'
  | 'performance'
  | 'success'
  | 'difficulties'
  | 'opportunities'
  | 'objections'
  | 'targetGroups'
  | 'process'
  | 'agents'
  | 'rawDialog'

export const SIMULATION_GOAL_LABELS: Record<SimulationGoal, string> = {
  market_reaction: 'Marktreaktion',
  target_group_reaction: 'Zielgruppenreaktion',
  risk_development: 'Risikoentwicklung',
  measure_effectiveness: 'Maßnahmenwirkung',
  decision_consequences: 'Entscheidungsfolgen',
  price_acceptance: 'Preisakzeptanz',
  media_reaction: 'Medienreaktion',
  project_performance: 'Projektperformance',
  success_probability: 'Erfolgswahrscheinlichkeit',
  difficulty_simulation: 'Schwierigkeitssimulation',
  custom_scenario: 'Individuelles Szenario'
}

export const AGENT_ARCHETYPE_LABELS: Record<AgentArchetype, string> = {
  entrepreneur: 'Unternehmer',
  customer: 'Kunde',
  skeptic: 'Skeptiker',
  expert: 'Experte',
  media_voice: 'Medienstimme',
  social_media_voice: 'Social-Media-Stimme',
  reddit_voice: 'Reddit-Stimme',
  youtube_voice: 'YouTube-Stimme',
  practitioner: 'Praktiker',
  competitor: 'Wettbewerber',
  regulatory: 'Regulatorik',
  financial: 'Finanzperspektive',
  extreme_case: 'Extremfall',
  early_adopter: 'Early Adopter',
  late_majority: 'Late Majority',
  decision_maker: 'Entscheider',
  influencer: 'Influencer',
  analyst: 'Analyst',
  developer: 'Entwickler',
  end_user: 'Endnutzer'
}

export const INITIAL_POSITION_LABELS: Record<InitialPosition, string> = {
  strongly_opposed: 'Stark ablehnend',
  opposed: 'Ablehnend',
  skeptical: 'Skeptisch',
  neutral: 'Neutral',
  interested: 'Interessiert',
  supportive: 'Unterstützend',
  strongly_supportive: 'Stark unterstützend'
}

export const SENTIMENT_LABELS: Record<Sentiment, string> = {
  very_negative: 'Sehr negativ',
  negative: 'Negativ',
  slightly_negative: 'Leicht negativ',
  neutral: 'Neutral',
  slightly_positive: 'Leicht positiv',
  positive: 'Positiv',
  very_positive: 'Sehr positiv'
}

export const COMMUNICATION_STYLE_LABELS: Record<CommunicationStyle, string> = {
  analytical: 'Analytisch',
  emotional: 'Emotional',
  direct: 'Direkt',
  diplomatic: 'Diplomatisch',
  skeptical: 'Skeptisch',
  enthusiastic: 'Enthusiastisch',
  cautious: 'Vorsichtig',
  aggressive: 'Aggressiv',
  collaborative: 'Kollaborativ'
}

export const KNOWLEDGE_LEVEL_LABELS: Record<KnowledgeLevel, string> = {
  novice: 'Anfänger',
  basic: 'Grundkenntnisse',
  intermediate: 'Mittelstufe',
  expert: 'Experte',
  authority: 'Autorität'
}

export const PROJECT_RELEVANCE_LABELS: Record<ProjectRelevance, string> = {
  none: 'Keine',
  low: 'Gering',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch'
}
