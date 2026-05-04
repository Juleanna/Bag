import { useRef, useState } from 'react'

/**
 * Хук для drag-and-drop сортування списку items.
 * Повертає handlers для onDragStart/onDragOver/onDrop/onDragEnd
 * і колбек onReorder, який викликається з новим порядком pk[].
 */
export function useDragReorder<T extends { id: number }>(
  items: T[],
  onReorder: (newOrder: T[]) => void
) {
  const dragId = useRef<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)

  const onDragStart = (id: number) => () => {
    dragId.current = id
  }

  const onDragOver = (id: number) => (e: React.DragEvent) => {
    e.preventDefault()
    if (dragId.current !== null && dragId.current !== id) {
      setOverId(id)
    }
  }

  const onDrop = (id: number) => (e: React.DragEvent) => {
    e.preventDefault()
    setOverId(null)
    const from = dragId.current
    dragId.current = null
    if (from === null || from === id) return
    const fromIdx = items.findIndex(i => i.id === from)
    const toIdx = items.findIndex(i => i.id === id)
    if (fromIdx < 0 || toIdx < 0) return
    const next = [...items]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onReorder(next)
  }

  const onDragEnd = () => {
    dragId.current = null
    setOverId(null)
  }

  return {
    handlers: (id: number) => ({
      draggable: true,
      onDragStart: onDragStart(id),
      onDragOver: onDragOver(id),
      onDrop: onDrop(id),
      onDragEnd,
    }),
    overId,
    isDragging: (id: number) => dragId.current === id,
  }
}
