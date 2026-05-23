import { useState, useEffect, useRef } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }
}

export function useDebouncedInput(
  initialValue: string = '',
  delay: number = 300,
  onChange?: (value: string) => void
): {
  value: string
  debouncedValue: string
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setValue: (value: string) => void
} {
  const [value, setValue] = useState(initialValue)
  const debouncedValue = useDebounce(value, delay)

  useEffect(() => {
    onChange?.(debouncedValue)
  }, [debouncedValue, onChange])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return { value, debouncedValue, onInputChange, setValue }
}
