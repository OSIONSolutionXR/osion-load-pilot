/**
 * ScenarioRunner
 * 
 * Zeigt den Lade-Status während eine Simulation läuft
 * Mit animierten Visualisierungen
 */

import { motion } from 'motion/react'
import {
  Loader2,
  Brain,
  Target,
  Zap,
  TrendingUp,
  MessageSquare,
  CheckCircle
} from 'lucide-react'
import type { Scenario } from '../../types/projectTwinV2'

interface ScenarioRunnerProps {
  scenario: Scenario
  progress?: number
}

const steps = [
  { icon: Brain, label: 'Kontext wird analysiert...', duration: 2000 },
  { icon: Target, label: 'Annahmen werden verarbeitet...', duration: 2000 },
  { icon: MessageSquare, label: 'Szenarien werden simuliert...', duration: 3000 },
  { icon: TrendingUp, label: 'Ergebnisse werden synthetisiert...', duration: 2000 },
  { icon: Zap, label: 'Empfehlungen werden generiert...', duration: 1500 },
]

export default function ScenarioRunner({ scenario, progress = 0 }: ScenarioRunnerProps) {
  const currentStep = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1)

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Animated Icon */}
      <div className="relative mb-8">
        <motion.div
          className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--lp-cobalt)] to-[var(--lp-teal)] flex items-center justify-center"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </motion.div>

        {/* Orbiting dots */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-[var(--lp-cobalt)]"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5
            }}
            style={{
              top: '50%',
              left: '50%',
              marginTop: '-6px',
              marginLeft: '-6px',
              transformOrigin: `0 -${40 + i * 10}px`
            }}
          />
        ))}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-[var(--lp-text)] mb-2">
        {scenario.name}
      </h3>
      <p className="text-sm text-[var(--lp-muted)] mb-8 text-center max-w-md">
        {scenario.description}
      </p>

      {/* Progress Steps */}
      <div className="w-full max-w-md space-y-3">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isComplete = index < currentStep
          const Icon = step.icon

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: isActive || isComplete ? 1 : 0.4,
                x: 0
              }}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive ? 'bg-[var(--lp-cobalt)]/10 border border-[var(--lp-cobalt)]/30' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${
                isComplete 
                  ? 'bg-emerald-500/20' 
                  : isActive 
                    ? 'bg-[var(--lp-cobalt)]/20' 
                    : 'bg-[var(--lp-surface)]'
              }`}>
                {isComplete ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Icon className={`w-5 h-5 ${
                    isActive ? 'text-[var(--lp-cobalt)]' : 'text-[var(--lp-muted)]'
                  }`} />
                )}
              </div>
              <span className={`text-sm ${
                isActive ? 'font-medium text-[var(--lp-text)]' : 'text-[var(--lp-muted)]'
              }`}>
                {step.label}
              </span>
              {isActive && (
                <motion.span
                  className="ml-auto text-xs text-[var(--lp-cobalt)]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  läuft...
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mt-8">
        <div className="flex items-center justify-between text-xs text-[var(--lp-muted)] mb-2">
          <span>Fortschritt</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-[var(--lp-surface)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[var(--lp-cobalt)] to-[var(--lp-teal)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Assumptions Summary */}
      <div className="mt-8 p-4 rounded-xl bg-[var(--lp-surface-soft)] border border-[var(--lp-border)] max-w-md">
        <h4 className="text-xs font-medium text-[var(--lp-muted)] uppercase mb-2">Annahmen</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(scenario.assumptions).map(([key, value]) => (
            <span
              key={key}
              className="text-xs px-2 py-1 rounded-full bg-[var(--lp-surface)] text-[var(--lp-text)]"
            >
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
