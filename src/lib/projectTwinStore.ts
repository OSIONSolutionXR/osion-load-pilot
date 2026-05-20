import type { ProjectTwinAnalysis } from '../types/projectTwin'

export interface StoredProjectTwin {
  id: string
  createdAt: string
  updatedAt: string
  sourceInput: string
  analysis: ProjectTwinAnalysis
}

const STORAGE_KEY = 'osion-load-pilot.project-twins.v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function loadStoredProjectTwins(): StoredProjectTwin[] {
  if (!canUseStorage()) {
    return []
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is StoredProjectTwin =>
        item &&
        typeof item.id === 'string' &&
        typeof item.createdAt === 'string' &&
        typeof item.updatedAt === 'string' &&
        typeof item.sourceInput === 'string' &&
        item.analysis &&
        typeof item.analysis === 'object'
    )
  } catch {
    return []
  }
}

export function saveStoredProjectTwins(twins: StoredProjectTwin[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(twins))
}

export function createStoredProjectTwin(sourceInput: string, analysis: ProjectTwinAnalysis): StoredProjectTwin {
  const timestamp = new Date().toISOString()

  return {
    id: `twin-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: timestamp,
    updatedAt: timestamp,
    sourceInput: sourceInput.trim(),
    analysis
  }
}
