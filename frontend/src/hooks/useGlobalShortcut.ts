/**
 * Хук для реєстрації глобального single-key shortcut на сторінці.
 * Використовується у BugDetail для I (assign me), E (mark done),
 * Cmd+Backspace (archive).
 */
import { useEffect } from 'react'

interface Options {
  /** Ключ (одна літера або combo як 'meta+Backspace'). */
  key: string
  handler: () => void
  enabled?: boolean
}

export function useGlobalShortcut({ key, handler, enabled = true }: Options) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      // Підтримка комбінацій 'meta+x', 'ctrl+x', 'shift+x'
      const parts = key.toLowerCase().split('+')
      const wantMeta = parts.includes('meta') || parts.includes('mod')
      const wantShift = parts.includes('shift')
      const wantedKey = parts[parts.length - 1]

      const meta = e.metaKey || e.ctrlKey
      if (wantMeta && !meta) return
      if (!wantMeta && meta) return
      if (wantShift && !e.shiftKey) return
      if (!wantShift && e.shiftKey) return

      // Backspace перевіряємо як 'backspace', 'delete'
      const got = e.key.toLowerCase()
      const matchesBackspace = wantedKey === 'backspace' && (got === 'backspace' || got === 'delete')
      const matchesKey = got === wantedKey

      if (matchesKey || matchesBackspace) {
        e.preventDefault()
        handler()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [key, handler, enabled])
}
