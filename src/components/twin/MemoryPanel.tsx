/**
 * MemoryPanel Component
 * 
 * Zeigt den vollständigen Activity-Log eines Project Twins als Timeline an.
 * - Filter nach Typ
 * - Gruppierung nach Zeitperioden
 * - Expandable Details
 */

import { useState, useMemo } from 'react'
import type { 
  StoredProjectTwinV2, 
  ActivityLogEntry, 
  ActivityLogType 
} from '../../types/projectTwinV2'
import {
  getActivityLog,
  groupActivityLogByPeriod,
  formatRelativeTime,
  getActivityIcon,
  getActorColor,
  getActivityTypeLabel
} from '../../services/activityLogService'
import { Panel } from '../ui/Panel'
import { Badge } from '../ui/Badge'

// ============================================================================
// TYPES
// ============================================================================

type FilterType = 'all' | 'measures' | 'simulations' | 'context' | 'system' | 'ai'

interface MemoryPanelProps {
  twin: StoredProjectTwinV2
  maxHeight?: string
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

const FILTER_CONFIG: Record<FilterType, { label: string; types: ActivityLogType[] }> = {
  'all': { 
    label: 'Alles', 
    types: [] 
  },
  'measures': { 
    label: 'Maßnahmen', 
    types: ['measure_added', 'measure_updated', 'measure_completed', 'measure_deleted'] 
  },
  'simulations': { 
    label: 'Simulationen', 
    types: ['scenario_run', 'scenario_completed', 'simulation_completed'] 
  },
  'context': { 
    label: 'Kontext', 
    types: ['context_answered', 'question_skipped'] 
  },
  'system': { 
    label: 'System', 
    types: ['project_created', 'twin_updated', 'progress_updated'] 
  },
  'ai': { 
    label: 'KI-Aktionen', 
    types: ['queue_action_generated', 'solution_generated', 'chat_message'] 
  }
}

// ============================================================================
// COMPONENTS
// ============================================================================

export function MemoryPanel({ twin, maxHeight = '600px' }: MemoryPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  // Gefilterte und gruppierte Einträge
  const groupedEntries = useMemo(() => {
    const filterConfig = FILTER_CONFIG[activeFilter]
    const filteredLogs = getActivityLog(
      twin, 
      filterConfig.types.length > 0 ? { type: filterConfig.types } : undefined
    )
    return groupActivityLogByPeriod(filteredLogs)
  }, [twin, activeFilter])

  // Gesamtzahl der Einträge
  const totalEntries = twin.activityLog?.length || 0

  // Eintrag ein-/ausklappen
  const toggleExpand = (entryId: string) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId)
  }

  return (
    <Panel className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <h2 className="text-lg font-semibold text-gray-900">Projektverlauf</h2>
          <Badge variant="neutral" className="ml-2">
            {totalEntries} Einträge
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(FILTER_CONFIG) as FilterType[]).map((filterKey) => (
          <button
            key={filterKey}
            onClick={() => setActiveFilter(filterKey)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              activeFilter === filterKey
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {FILTER_CONFIG[filterKey].label}
          </button>
        ))}
      </div>

      {/* Timeline Content */}
      <div 
        className="overflow-y-auto pr-2 space-y-6"
        style={{ maxHeight }}
      >
        {groupedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl block mb-2">📝</span>
            <p>Noch keine Aktivitäten vorhanden</p>
            <p className="text-sm text-gray-400 mt-1">
              Sobald Aktionen ausgeführt werden, erscheinen sie hier
            </p>
          </div>
        ) : (
          groupedEntries.map(({ period, entries }) => (
            <div key={period}>
              {/* Period Header */}
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 sticky top-0 bg-white py-1">
                {period}
              </h3>

              {/* Entries */}
              <div className="space-y-3">
                {entries.map((entry) => (
                  <ActivityLogItem
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedEntryId === entry.id}
                    onToggle={() => toggleExpand(entry.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}

// ============================================================================
// ACTIVITY LOG ITEM COMPONENT
// ============================================================================

interface ActivityLogItemProps {
  entry: ActivityLogEntry
  isExpanded: boolean
  onToggle: () => void
}

function ActivityLogItem({ entry, isExpanded, onToggle }: ActivityLogItemProps) {
  const hasDetails = entry.details && Object.keys(entry.details).length > 0

  return (
    <div 
      className={`group relative pl-8 border-l-2 transition-all ${
        isExpanded ? 'border-blue-500' : 'border-gray-200 group-hover:border-gray-300'
      }`}
    >
      {/* Timeline Dot */}
      <div 
        className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 flex items-center justify-center text-xs ${
          isExpanded ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white'
        }`}
      >
        {getActivityIcon(entry.type)}
      </div>

      {/* Content Card */}
      <div 
        onClick={onToggle}
        className={`bg-white rounded-lg border transition-all cursor-pointer ${
          isExpanded 
            ? 'border-blue-200 shadow-sm' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        {/* Header */}
        <div className="p-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {entry.description}
              </span>
              <Badge 
                variant="neutral" 
                className={`text-xs ${getActorColor(entry.actor)}`}
              >
                {entry.actor === 'user' ? 'Du' : entry.actor === 'ai' ? 'KI' : 'System'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <span>{formatRelativeTime(entry.timestamp)}</span>
              <span>•</span>
              <span className="text-gray-400">{getActivityTypeLabel(entry.type)}</span>
            </div>
          </div>

          {/* Expand Icon */}
          {hasDetails && (
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg 
                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && hasDetails && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3">
            <div className="bg-gray-50 rounded-md p-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Details
              </h4>
              <div className="space-y-2">
                {Object.entries(entry.details!).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-sm">
                    <span className="font-medium text-gray-700 min-w-[120px]">
                      {formatDetailKey(key)}:
                    </span>
                    <span className="text-gray-600 font-mono text-xs break-all">
                      {formatDetailValue(value)}
                    </span>
                  </div>
                ))}
              </div>
              {entry.relatedEntityId && (
                <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-400">
                  ID: {entry.relatedEntityId}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatDetailKey(key: string): string {
  const keyMap: Record<string, string> = {
    'questionLabel': 'Frage',
    'answerPreview': 'Antwort',
    'changes': 'Änderungen',
    'source': 'Quelle',
    'inputLength': 'Eingabelänge',
    'outcome': 'Ergebnis',
    'oldPercent': 'Alter Fortschritt',
    'newPercent': 'Neuer Fortschritt',
    'reason': 'Grund',
    'actionType': 'Aktionstyp',
    'solutionType': 'Lösungstyp',
    'preview': 'Vorschau',
    'mode': 'Modus',
    'simulationId': 'Simulations-ID',
    'completedAt': 'Abgeschlossen am'
  }
  return keyMap[key] || key
}

function formatDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'boolean') return value ? 'Ja' : 'Nein'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

// ============================================================================
// COMPACT VERSION (für Sidebars/ kleine Bereiche)
// ============================================================================

interface MemoryPanelCompactProps {
  twin: StoredProjectTwinV2
  limit?: number
  onViewAll?: () => void
}

export function MemoryPanelCompact({ twin, limit = 5, onViewAll }: MemoryPanelCompactProps) {
  const recentEntries = useMemo(() => {
    return getActivityLog(twin, { limit })
  }, [twin, limit])

  return (
    <Panel className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="font-semibold text-gray-900">Letzte Aktivitäten</h3>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Alle anzeigen
          </button>
        )}
      </div>

      <div className="space-y-2">
        {recentEntries.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            Noch keine Aktivitäten
          </p>
        ) : (
          recentEntries.map((entry) => (
            <div 
              key={entry.id}
              className="flex items-start gap-2 p-2 rounded-md hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm">{getActivityIcon(entry.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">
                  {entry.description}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(entry.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Panel>
  )
}

export default MemoryPanel
