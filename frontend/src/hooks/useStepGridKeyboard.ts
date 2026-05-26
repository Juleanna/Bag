/**
 * Клавіатурна навігація для таблиці кроків тест-кейса (дві колонки:
 * Дія + Очікуваний результат).
 *
 *  - Enter у полі «Дія»             → фокус на «Очікуваний» того ж рядка
 *  - Enter у полі «Очікуваний»      → додати новий крок під поточним і
 *                                     сфокусуватись на «Дія» нового
 *  - Backspace на ПОВНІСТЮ порожньому рядку (action='' і expected='')
 *    та коли є більше одного рядка → видалити рядок і повернутися
 *    до «Очікуваний» попереднього
 *
 * Shift+Enter залишається для нормального вводу всередині поля (хоча
 * input — single-line, такий комбінатор лише не блокує дефолтну поведінку).
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export interface StepRow {
  action: string
  expected: string
}

export type StepCol = 'action' | 'expected'

interface Options {
  steps: StepRow[]
  setSteps: React.Dispatch<React.SetStateAction<StepRow[]>>
}

export function useStepGridKeyboard({ steps, setSteps }: Options) {
  // Refs: один масив [row*2 + col] — щоб не плодити вкладені масиви.
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const refKey = (row: number, col: StepCol) => row * 2 + (col === 'action' ? 0 : 1)

  // Що фокусувати після наступного рендеру.
  const [pending, setPending] = useState<{ row: number; col: StepCol } | null>(
    null,
  )

  useEffect(() => {
    if (!pending) return
    const el = refs.current[refKey(pending.row, pending.col)]
    if (el) el.focus()
    setPending(null)
  }, [pending])

  const setRef =
    (row: number, col: StepCol) => (el: HTMLInputElement | null) => {
      refs.current[refKey(row, col)] = el
    }

  const onKeyDown = useCallback(
    (row: number, col: StepCol, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (col === 'action') {
          // Перейти на «Очікуваний» того ж рядка
          setPending({ row, col: 'expected' })
        } else {
          // Додати новий рядок під поточним і сфокусуватись на «Дія» нового
          setSteps(s => {
            const next = [...s]
            next.splice(row + 1, 0, { action: '', expected: '' })
            return next
          })
          setPending({ row: row + 1, col: 'action' })
        }
      } else if (
        e.key === 'Backspace' &&
        steps[row]?.action === '' &&
        steps[row]?.expected === '' &&
        steps.length > 1
      ) {
        // Порожній рядок — видаляємо й переходимо до «Очікуваний» попереднього.
        e.preventDefault()
        const prev = Math.max(0, row - 1)
        setSteps(s => s.filter((_, idx) => idx !== row))
        setPending({ row: prev, col: 'expected' })
      }
    },
    [steps, setSteps],
  )

  return { setRef, onKeyDown }
}
