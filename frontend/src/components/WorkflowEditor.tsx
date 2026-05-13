/**
 * Модальний редактор робочого процесу проєкту:
 *  - список статусів з можливістю змінити назву, колір, позначку «завершальний»
 *  - drag-and-drop порядок (HTML5 native)
 *  - додавання нового статусу
 *  - збереження одним батчем (синхронізація diff з сервером)
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { apiDelete, apiPatch, apiPost, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { invalidateWorkflowCache } from '../hooks/useWorkflow'

export interface WorkflowStatus {
  id: number
  project: number
  key: string
  label: string
  color: string
  sort_order: number
  is_default: boolean
  is_done: boolean
}

const PALETTE = [
  { value: 'var(--st-open-dot)', label: 'Червоний' },
  { value: 'var(--st-progress-dot)', label: 'Синій' },
  { value: 'var(--st-blocked-dot)', label: 'Фіолетовий' },
  { value: 'var(--st-resolved-dot)', label: 'Зелений' },
  { value: 'var(--st-closed-dot)', label: 'Сірий' },
  { value: '#D4951F', label: 'Жовтий' },
  { value: '#D97757', label: 'Помаранчевий' },
]

const DEFAULT_STATUSES: Array<Omit<WorkflowStatus, 'id' | 'project'>> = [
  { key: 'open', label: 'Open', color: 'var(--st-open-dot)', sort_order: 0, is_default: true, is_done: false },
  { key: 'in_progress', label: 'In Progress', color: 'var(--st-progress-dot)', sort_order: 1, is_default: false, is_done: false },
  { key: 'blocked', label: 'Blocked', color: 'var(--st-blocked-dot)', sort_order: 2, is_default: false, is_done: false },
  { key: 'resolved', label: 'Resolved', color: 'var(--st-resolved-dot)', sort_order: 3, is_default: false, is_done: true },
  { key: 'closed', label: 'Closed', color: 'var(--st-closed-dot)', sort_order: 4, is_default: false, is_done: true },
]

interface Local extends Omit<WorkflowStatus, 'id'> {
  id: number  // <0 для нових (тимчасові)
}

export function WorkflowEditor({
  projectId,
  onClose,
}: {
  projectId: number
  onClose: () => void
}) {
  const toast = useToast()
  const [items, setItems] = useState<Local[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const list = await listAll<WorkflowStatus>(
          `/workflow-statuses/?project=${projectId}`
        )
        if (list.length > 0) {
          setItems(list)
        } else {
          // Якщо у проєкту ще немає кастомних — стартуємо з дефолтів
          setItems(
            DEFAULT_STATUSES.map((s, i) => ({
              ...s,
              id: -(i + 1),
              project: projectId,
            }))
          )
        }
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId, toast])

  const update = (idx: number, patch: Partial<Local>) => {
    setItems(arr => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  const remove = (idx: number) => {
    if (items.length <= 1) {
      toast.show('Має бути хоча б один статус', 'info')
      return
    }
    setItems(arr => arr.filter((_, i) => i !== idx))
  }

  const addStatus = () => {
    const lastOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) : -1
    setItems(arr => [
      ...arr,
      {
        id: -Date.now(),
        project: projectId,
        key: `status_${arr.length + 1}`,
        label: 'Новий статус',
        color: 'var(--st-open-dot)',
        sort_order: lastOrder + 1,
        is_default: arr.length === 0,
        is_done: false,
      },
    ])
  }

  const onDragStart = (i: number) => setDragIdx(i)
  const onDragOver = (e: React.DragEvent) => e.preventDefault()
  const onDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) return
    setItems(arr => {
      const next = [...arr]
      const [moved] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, moved)
      return next.map((it, i) => ({ ...it, sort_order: i }))
    })
    setDragIdx(null)
  }

  const setDefault = (idx: number) => {
    setItems(arr =>
      arr.map((it, i) => ({ ...it, is_default: i === idx }))
    )
  }

  const save = async () => {
    setSaving(true)
    try {
      // Спочатку отримуємо серверний стан для diff
      const serverList = await listAll<WorkflowStatus>(
        `/workflow-statuses/?project=${projectId}`
      )
      const serverIds = new Set(serverList.map(s => s.id))
      const localIds = new Set(items.filter(i => i.id > 0).map(i => i.id))
      const ops: Promise<unknown>[] = []

      // Видалення тих, що зникли локально
      for (const s of serverList) {
        if (!localIds.has(s.id)) {
          ops.push(apiDelete(`/workflow-statuses/${s.id}/`).catch(() => null))
        }
      }
      // Створення нових + оновлення існуючих
      for (let i = 0; i < items.length; i++) {
        const it = items[i]
        const payload = {
          project: projectId,
          key: it.key,
          label: it.label,
          color: it.color,
          sort_order: i,
          is_default: it.is_default,
          is_done: it.is_done,
        }
        if (it.id < 0 || !serverIds.has(it.id)) {
          ops.push(apiPost('/workflow-statuses/', payload).catch(() => null))
        } else {
          ops.push(
            apiPatch(`/workflow-statuses/${it.id}/`, payload).catch(() => null)
          )
        }
      }
      await Promise.all(ops)
      // Інвалідуємо кеш useWorkflow для цього проєкту, щоб усі підписники
      // (EditProject, BugDetail, Kanban тощо) перечитали свіжі статуси.
      invalidateWorkflowCache(projectId)
      window.dispatchEvent(
        new CustomEvent('workflow:changed', { detail: { projectId } })
      )
      toast.show('Робочий процес збережено', 'success')
      onClose()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div
        className="confirm-dialog"
        style={{ width: 640, maxWidth: '95vw' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: 0, marginBottom: 4 }}>Робочий процес</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--fg-3)' }}>
          Налаштуйте статуси задач для цього проєкту. Перетягуйте, щоб змінити порядок.
        </p>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
            Завантаження…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, idx) => (
              <div
                key={it.id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={onDragOver}
                onDrop={() => onDrop(idx)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 16px 1fr 100px auto auto',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 10px',
                  background: 'var(--bg-2)',
                  borderRadius: 8,
                  cursor: 'grab',
                }}
              >
                <Ic.Sort sz={12} style={{ color: 'var(--fg-4)' }} />
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: it.color,
                    flexShrink: 0,
                  }}
                />
                <input
                  className="inp"
                  value={it.label}
                  onChange={e => update(idx, { label: e.target.value })}
                  style={{ height: 30, fontSize: 13 }}
                />
                <select
                  className="inp"
                  value={it.color}
                  onChange={e => update(idx, { color: e.target.value })}
                  style={{ height: 30, fontSize: 12, padding: '0 6px' }}
                >
                  {PALETTE.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Чи задачі в цьому статусі вважаються завершеними"
                >
                  <input
                    type="checkbox"
                    className="cb"
                    checked={it.is_done}
                    onChange={e => update(idx, { is_done: e.target.checked })}
                  />
                  done
                </label>
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    className="btn ghost icon sm"
                    onClick={() => setDefault(idx)}
                    title={
                      it.is_default
                        ? 'За замовчуванням для нових задач'
                        : 'Зробити дефолтним'
                    }
                    style={{
                      color: it.is_default
                        ? 'var(--accent-soft-fg)'
                        : 'var(--fg-4)',
                    }}
                  >
                    <Ic.Star sz={11} />
                  </button>
                  <button
                    type="button"
                    className="btn ghost icon sm"
                    onClick={() => remove(idx)}
                    title="Видалити"
                  >
                    <Ic.X sz={11} />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn sm ghost"
              onClick={addStatus}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            >
              <Ic.Plus sz={11} /> Додати статус
            </button>
          </div>
        )}

        <div className="confirm-actions">
          <button type="button" className="btn" onClick={onClose}>
            Скасувати
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={save}
            disabled={saving || loading}
          >
            <Ic.Check sz={12} /> {saving ? 'Збереження…' : 'Зберегти'}
          </button>
        </div>
      </div>
    </div>
  )
}
