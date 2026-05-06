/**
 * Хук list-навігації клавіатурою: J / ↓ — вниз, K / ↑ — вгору, Enter — відкрити.
 * Використовується у BugList для гортання задач без миші.
 */
import { useEffect, useState } from 'react'

interface Options<T> {
  items: T[]
  onOpen?: (item: T) => void
  /** Чи активна навігація (наприклад вимкнути коли модалка відкрита) */
  enabled?: boolean
}

export function useListKeyboardNav<T>({ items, onOpen, enabled = true }: Options<T>) {
  const [activeIndex, setActiveIndex] = useState(-1)

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => Math.min(items.length - 1, i + 1))
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => Math.max(0, i - 1))
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && activeIndex < items.length && onOpen) {
          e.preventDefault()
          onOpen(items[activeIndex])
        }
      } else if (e.key === 'Escape') {
        setActiveIndex(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, items, activeIndex, onOpen])

  return { activeIndex, setActiveIndex }
}
