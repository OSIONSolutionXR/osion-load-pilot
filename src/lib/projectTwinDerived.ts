import type { DependencyStatus, ProjectTwinAnalysis, ProjectStatus, RiskSeverity } from '../types/projectTwin'

export interface DerivedDependencyNode {
  id: string
  step: number
  title: string
  subtitle: string
  status: 'complete' | 'active' | 'blocked' | 'pending'
  state?: 'critical'
  icon: 'user' | 'file-text' | 'building' | 'check-circle'
}

function statusSubtitle(status: ProjectStatus) {
  if (status === 'blocked') return 'Blockiert'
  if (status === 'waiting') return 'Wartet'
  if (status === 'active') return 'Aktiv'
  return 'Geparkt'
}

function dependencySubtitle(status: DependencyStatus) {
  if (status === 'blocked') return 'Blockiert'
  if (status === 'waiting') return 'Wartet'
  if (status === 'required') return 'Erforderlich'
  return 'Erledigt'
}

function severityText(severity: RiskSeverity) {
  if (severity === 'high') return 'Kritisch'
  if (severity === 'medium') return 'Beobachten'
  return 'Niedrig'
}

export function deriveDependencyNodes(analysis: ProjectTwinAnalysis): DerivedDependencyNode[] {
  const actor = analysis.actors[0]
  const blocker = analysis.dependencies.find((dependency) => dependency.isBlocker)
  const blockerTarget = blocker?.to ?? analysis.project.title

  return [
    {
      id: 'actor',
      step: 1,
      title: actor?.name ?? 'Akteur',
      subtitle: actor?.role ?? 'Auslöser',
      status: actor ? 'complete' : 'pending',
      icon: 'user'
    },
    {
      id: 'blocker',
      step: 2,
      title: blocker?.from ?? blockerTarget,
      subtitle: blocker ? dependencySubtitle(blocker.status) : 'Kein Blocker erkannt',
      status: blocker ? 'blocked' : 'active',
      state: blocker ? 'critical' : undefined,
      icon: 'file-text'
    },
    {
      id: 'project',
      step: 3,
      title: analysis.project.title,
      subtitle: statusSubtitle(analysis.project.status),
      status: analysis.project.status === 'blocked' ? 'pending' : 'active',
      icon: 'building'
    },
    {
      id: 'next-move',
      step: 4,
      title: analysis.nextMove.title,
      subtitle: analysis.nextMove.deadline ?? 'Nächster Schritt',
      status: 'pending',
      icon: 'check-circle'
    }
  ]
}

export function deriveRiskText(analysis: ProjectTwinAnalysis) {
  const topRisk = analysis.risks[0]
  if (!topRisk) {
    return 'Aktuell wurde kein kritisches Risiko erkannt.'
  }

  return `${severityText(topRisk.severity)}: ${topRisk.explanation}`
}
