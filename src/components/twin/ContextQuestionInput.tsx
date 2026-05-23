import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { Calendar, Check, X, HelpCircle } from 'lucide-react'
import type { ProjectContextQuestion } from '../../types/projectTwinV2'

interface ContextQuestionInputProps {
  question: ProjectContextQuestion
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ContextQuestionInput({
  question,
  value,
  onChange,
  disabled = false
}: ContextQuestionInputProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      onChange(val)
    }
  }, [onChange])

  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleQuickDate = useCallback((type: 'today' | 'week' | 'month') => {
    const today = new Date()
    let targetDate: Date

    switch (type) {
      case 'today':
        targetDate = today
        break
      case 'week':
        targetDate = new Date(today.setDate(today.getDate() + 7))
        break
      case 'month':
        targetDate = new Date(today.setMonth(today.getMonth() + 1))
        break
      default:
        targetDate = today
    }

    onChange(targetDate.toISOString().split('T')[0])
  }, [onChange])

  const renderTextInput = () => (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={handleTextChange}
        disabled={disabled}
        placeholder="Gib hier Deine Antwort ein..."
        rows={4}
        className="w-full px-4 py-4 
          bg-[var(--lp-surface)] 
          border-2 border-[var(--lp-border)]
          rounded-xl 
          text-lg text-[var(--lp-text)]
          placeholder:text-zinc-500
          resize-none 
          focus:outline-none 
          focus:border-violet-500 
          focus:ring-2 focus:ring-violet-500/20
          transition-all duration-200"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </div>
  )

  const renderNumberInput = () => (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleNumberChange}
        disabled={disabled}
        placeholder="0"
        className="w-full px-4 py-4 pl-4 pr-12 
          bg-[var(--lp-surface)]
          border-2 border-[var(--lp-border)]
          rounded-xl 
          text-lg text-[var(--lp-text)]
          placeholder-zinc-500
          focus:outline-none 
          focus:border-violet-500
          focus:ring-2 focus:ring-violet-500/20
          transition-all duration-200"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">
        €
      </span>
    </div>
  )

  const renderDateInput = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Heute', type: 'today' as const },
          { label: 'Diese Woche', type: 'week' as const },
          { label: 'Diesen Monat', type: 'month' as const }
        ].map(({ label, type }) => (
          <button
            key={type}
            type="button"
            onClick={() => handleQuickDate(type)}
            disabled={disabled}
            className="px-3 py-1.5 text-sm rounded-lg 
              bg-white/5 border border-white/10 
              text-zinc-400 hover:border-violet-500/30 hover:text-violet-300 
              transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={handleDateChange}
          disabled={disabled}
          className="w-full px-4 py-4 pr-12 
            bg-[var(--lp-surface)]
            border-2 border-[var(--lp-border)]
            rounded-xl 
            text-lg text-[var(--lp-text)]
            focus:outline-none 
            focus:border-violet-500
            focus:ring-2 focus:ring-violet-500/20
            transition-all duration-200"
        />
        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
      </div>
    </div>
  )

  const renderChoiceInput = () => {
    const options = question.options?.length && question.options.length > 0
      ? question.options
      : ['Noch offen', 'Eigene Angabe']

    return (
      <div className="flex flex-wrap gap-2">
        {options?.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            disabled={disabled}
            className={`px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 ${
              value === option
                ? 'bg-violet-500/20 border-violet-500 text-violet-200'
                : 'bg-[var(--lp-surface)] border-[var(--lp-border)] text-zinc-400 hover:border-violet-500/50 hover:text-zinc-300'
            }`}
          >
            {value === option && (
              <Check className="inline w-4 h-4 mr-1.5" />
            )}
            {option}
          </button>
        ))}
      </div>
    )
  }

  const renderYesNoInput = () => {
    const options = [
      { value: 'ja', label: 'Ja', icon: Check },
      { value: 'nein', label: 'Nein', icon: X },
      { value: 'offen', label: 'Noch offen', icon: HelpCircle }
    ]

    return (
      <div className="flex flex-wrap gap-2">
        {options.map(({ value: optValue, label, icon: Icon }) => (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(label)}
            disabled={disabled}
            className={`flex items-center gap-2 px-4 py-3 text-sm rounded-xl border-2 transition-all duration-200 ${
              value === label
                ? optValue === 'ja'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                  : optValue === 'nein'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                  : 'bg-zinc-500/20 border-zinc-500 text-zinc-300'
                : 'bg-[var(--lp-surface)] border-[var(--lp-border)] text-zinc-400 hover:border-white/30 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    )
  }

  const renderInputByType = () => {
    switch (question.suggestedInputType) {
      case 'number':
        return renderNumberInput()
      case 'date':
        return renderDateInput()
      case 'choice':
        return renderChoiceInput()
      case 'yes_no':
        return renderYesNoInput()
      case 'text':
      default:
        return renderTextInput()
    }
  }

  return (
    <motion.div
      layout
      className={`space-y-3 ${isFocused ? 'opacity-100' : 'opacity-95'}`}
    >
      {renderInputByType()}
    </motion.div>
  )
}
