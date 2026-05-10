/**
 * Хук для завантаження WorkflowStatus за проєктом.
 * Кешує результати між компонентами (модулярний кеш).
 *
 * Якщо у проєкту немає кастомного workflow — повертає дефолтний набір 4 статусів.
 */
import { useEffect, useState } from 'react'
import { listAll } from '../api/client'
import type { WorkflowStatus } from '../api/types'

const cache = new Map<number, WorkflowStatus[]>()
const inflight = new Map<number, Promise<WorkflowStatus[]>>()

const DEFAULT_STATUSES: WorkflowStatus[] = [
  { id: -1, project: 0, key: 'open', label: 'Відкрито', color: 'var(--st-open-dot)', sort_order: 0, is_default: true, is_done: false },
  { id: -2, project: 0, key: 'in_progress', label: 'В процесі', color: 'var(--st-progress-dot)', sort_order: 1, is_default: false, is_done: false },
  { id: -3, project: 0, key: 'done', label: 'Готово', color: 'var(--st-resolved-dot)', sort_order: 2, is_default: false, is_done: true },
  { id: -4, project: 0, key: 'cancelled', label: 'Скасовано', color: 'var(--st-closed-dot)', sort_order: 3, is_default: false, is_done: true },
]

export function getDefaultWorkflow(): WorkflowStatus[] {
  return DEFAULT_STATUSES
}

export function invalidateWorkflowCache(projectId?: number) {
  if (projectId) {
    cache.delete(projectId)
  } else {
    cache.clear()
  }
}

async function fetchWorkflow(projectId: number): Promise<WorkflowStatus[]> {
  const list = await listAll<WorkflowStatus>(
    `/workflow-statuses/?project=${projectId}`
  ).catch(() => [] as WorkflowStatus[])
  return list.length > 0
    ? list.sort((a, b) => a.sort_order - b.sort_order)
    : DEFAULT_STATUSES
}

/** Завантаження статусів для одного проєкту. */
export function useWorkflow(projectId: number | null | undefined) {
  const [statuses, setStatuses] = useState<WorkflowStatus[]>(() =>
    projectId && cache.has(projectId) ? cache.get(projectId)! : DEFAULT_STATUSES
  )
  const [loading, setLoading] = useState(!projectId || !cache.has(projectId))

  useEffect(() => {
    if (!projectId) {
      setStatuses(DEFAULT_STATUSES)
      setLoading(false)
      return
    }
    if (cache.has(projectId)) {
      setStatuses(cache.get(projectId)!)
      setLoading(false)
      return
    }
    setLoading(true)
    let inflightPromise = inflight.get(projectId)
    if (!inflightPromise) {
      inflightPromise = fetchWorkflow(projectId).then(list => {
        cache.set(projectId, list)
        inflight.delete(projectId)
        return list
      })
      inflight.set(projectId, inflightPromise)
    }
    let cancelled = false
    inflightPromise.then(list => {
      if (!cancelled) {
        setStatuses(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [projectId])

  return { statuses, loading }
}

/** Завантаження workflow для багатьох проєктів. */
export function useWorkflowMap(projectIds: number[]) {
  const [map, setMap] = useState<Map<number, WorkflowStatus[]>>(() => {
    const m = new Map<number, WorkflowStatus[]>()
    for (const id of projectIds) {
      if (cache.has(id)) m.set(id, cache.get(id)!)
    }
    return m
  })

  // Перетворюємо масив у стабільний ключ для useEffect
  const key = projectIds.join(',')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const m = new Map<number, WorkflowStatus[]>()
      await Promise.all(
        projectIds.map(async id => {
          if (cache.has(id)) {
            m.set(id, cache.get(id)!)
            return
          }
          const list = await fetchWorkflow(id)
          cache.set(id, list)
          m.set(id, list)
        })
      )
      if (!cancelled) setMap(m)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return map
}
