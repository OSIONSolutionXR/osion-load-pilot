/**
 * ScenarioCreator
 * 
 * Komponente zum Erstellen neuer Szenarien
 * Zeigt Templates an und erlaubt Custom-Erstellung
 */

import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Plus,
  ChevronRight,
  Wallet,
  Clock,
  AlertTriangle,
  Users,
  Target,
  Edit3,
  ArrowRight,
  Check
} from 'lucide-react'
import {
  SCENARIO_TEMPLATES,
  createScenarioFromTemplate
} from '../../services/simulationService'
import type { Scenario } from '../../types/projectTwinV2'

interface ScenarioCreatorProps {
  onCreateScenario: (scenario: Scenario) => void
  onCancel: () => void
}

export default function ScenarioCreator({ onCreateScenario, onCancel }: ScenarioCreatorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [customAssumptions, setCustomAssumptions] = useState<Record<string, string>>({})
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === 'custom') {
      setShowCustomForm(true)
      setSelectedTemplateId('custom')
    } else {
      const template = SCENARIO_TEMPLATES.find(t => t.id === templateId)
      if (template) {
        setCustomAssumptions(template.assumptions)
        setCustomName(template.name)
        setCustomDescription(template.description)
        setSelectedTemplateId(templateId)
        setShowCustomForm(false)
      }
    }
  }

  const handleCreate = () => {
    if (!selectedTemplateId) return
    
    const scenario = createScenarioFromTemplate(
      selectedTemplateId,
      showCustomForm ? customAssumptions : undefined,
      showCustomForm ? customName || undefined : undefined
    )
    
    if (showCustomForm) {
      scenario.description = customDescription || scenario.description
      scenario.assumptions = customAssumptions
    }
    
    onCreateScenario(scenario)
  }

  const handleAddAssumption = () => {
    setCustomAssumptions(prev => ({
      ...prev,
      [`parameter_${Object.keys(prev).length + 1}`]: ''
    }))
  }

  const handleUpdateAssumptionKey = (oldKey: string, newKey: string) => {
    const value = customAssumptions[oldKey]
    const { [oldKey]: _, ...rest } = customAssumptions
    setCustomAssumptions({ ...rest, [newKey]: value })
  }

  const handleUpdateAssumptionValue = (key: string, value: string) => {
    setCustomAssumptions(prev => ({ ...prev, [key]: value }))
  }

  const handleRemoveAssumption = (key: string) => {
    const { [key]: _, ...rest } = customAssumptions
    setCustomAssumptions(rest)
  }

  const getTemplateIcon = (templateId: string) => {
    if (templateId.includes('budget')) return Wallet
    if (templateId.includes('timeline')) return Clock
    if (templateId.includes('blocker') || templateId.includes('risk')) return AlertTriangle
    if (templateId.includes('team')) return Users
    if (templateId.includes('priority')) return Target
    if (templateId === 'custom') return Edit3
    return ChevronRight
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--lp-text)]">
          Neues Szenario erstellen
        </h3>
        <button
          onClick={onCancel}
          className="text-sm text-[var(--lp-muted)] hover:text-[var(--lp-text)]"
        >
          Abbrechen
        </button>
      </div>

      {/* Template Grid */}
      {!showCustomForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SCENARIO_TEMPLATES.map(template => {
            const Icon = getTemplateIcon(template.id)
            const isSelected = selectedTemplateId === template.id
            
            return (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[var(--lp-cobalt)] bg-[var(--lp-cobalt)]/5'
                    : 'border-[var(--lp-border)] hover:border-[var(--lp-cobalt)]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-[var(--lp-cobalt)]/20' : 'bg-[var(--lp-surface-soft)]'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isSelected ? 'text-[var(--lp-cobalt)]' : 'text-[var(--lp-muted)]'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--lp-text)]">
                        {template.name}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[var(--lp-cobalt)]" />
                      )}
                    </div>
                    <p className="text-sm text-[var(--lp-muted)] mt-1">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.keys(template.assumptions).map(key => (
                        <span
                          key={key}
                          className="text-xs px-2 py-0.5 rounded-full bg-[var(--lp-surface)] text-[var(--lp-muted)]"
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Custom Form */}
      {showCustomForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4 p-4 rounded-xl border border-[var(--lp-border)] bg-[var(--lp-surface-soft)]"
        >
          <div>
            <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
              Szenario-Name
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="z.B. 'Q4 Budget-Optimierung'"
              className="w-full px-4 py-2 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--lp-text)] mb-2">
              Beschreibung
            </label>
            <textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Was soll simuliert werden?"
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[var(--lp-text)]">
                Annahmen
              </label>
              <button
                onClick={handleAddAssumption}
                className="text-xs flex items-center gap-1 text-[var(--lp-cobalt)] hover:opacity-80"
              >
                <Plus className="w-3 h-3" />
                Hinzufügen
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(customAssumptions).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleUpdateAssumptionKey(key, e.target.value)}
                    placeholder="Parameter"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleUpdateAssumptionValue(key, e.target.value)}
                    placeholder="Wert"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--lp-surface)] border border-[var(--lp-border)] text-[var(--lp-text)] focus:border-[var(--lp-cobalt)] outline-none"
                  />
                  <button
                    onClick={() => handleRemoveAssumption(key)}
                    className="px-2 text-rose-400 hover:text-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              {Object.keys(customAssumptions).length === 0 && (
                <p className="text-sm text-[var(--lp-muted)] italic">
                  Keine Annahmen definiert. Klicke "Hinzufügen" um Parameter anzulegen.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end">
        {showCustomForm && (
          <button
            onClick={() => {
              setShowCustomForm(false)
              setSelectedTemplateId(null)
            }}
            className="px-4 py-2 rounded-lg text-sm text-[var(--lp-muted)] hover:text-[var(--lp-text)]"
          >
            Zurück zu Templates
          </button>
        )}
        <button
          onClick={handleCreate}
          disabled={!selectedTemplateId || (showCustomForm && !customName)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-[var(--lp-cobalt)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Szenario erstellen
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  )
}
