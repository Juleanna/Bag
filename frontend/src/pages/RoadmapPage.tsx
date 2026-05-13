/**
 * Дорожня карта продукту — 3 колонки (Заплановано / У роботі / Готово).
 *
 * Адмін (is_staff) може додавати, редагувати і видаляти пункти.
 * Звичайні користувачі бачать лише читалку.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type { RoadmapItem, RoadmapStatus } from '../api/extras'

interface Column {
  status: RoadmapStatus
  label: string
  color: string
  bg: string
}

const COLUMNS: Column[] = [
  {
    status: 'planned',
    label: 'Заплановано',
    color: 'var(--fg-3)',
    bg: 'var(--bg-2)',
  },
  {
    status: 'in_progress',
    label: 'У роботі',
    color: 'var(--accent-soft-fg)',
    bg: 'var(--accent-soft)',
  },
  {
    status: 'done',
    label: 'Готово',
    color: 'var(--st-resolved-fg)',
    bg: 'var(--st-resolved-bg)',
  },
]

export function RoadmapPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const isAdmin = !!user?.is_staff

  const [items, setItems] = useState<RoadmapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<RoadmapItem | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.listRoadmap()
      setItems(list)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const removeItem = async (item: RoadmapItem) => {
    const ok = await confirm({
      title: `Видалити «${item.title}»?`,
      message: 'Запис буде видалено з дорожньої карти.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteRoadmapItem(item.id)
      setItems(arr => arr.filter(i => i.id !== item.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Дорожня карта</h1>
          <div className="sub">Що зараз у плануванні, у роботі і вже релізнуто</div>
        </div>
        {isAdmin && (
          <div className="right">
            <button className="btn primary" onClick={() => setCreating(true)}>
              <Ic.Plus sz={12} /> Новий пункт
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={300} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            alignItems: 'flex-start',
          }}
        >
          {COLUMNS.map(col => {
            const colItems = items.filter(i => i.status === col.status)
            return (
              <div
                key={col.status}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 4px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: col.color,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: col.color,
                    }}
                  />
                  {col.label}
                  <span style={{ color: 'var(--fg-4)', fontWeight: 500 }}>
                    {colItems.length}
                  </span>
                </div>
                {colItems.length === 0 ? (
                  <div
                    style={{
                      padding: 16,
                      textAlign: 'center',
                      color: 'var(--fg-4)',
                      fontSize: 12,
                      border: '1px dashed var(--border)',
                      borderRadius: 10,
                    }}
                  >
                    порожньо
                  </div>
                ) : (
                  colItems.map(item => (
                    <div
                      key={item.id}
                      className="card"
                      style={{ padding: 14 }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.title}
                        </h4>
                        {isAdmin && (
                          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                            <button
                              className="btn ghost icon sm"
                              onClick={() => setEditing(item)}
                              title="Редагувати"
                            >
                              <Ic.Edit sz={10} />
                            </button>
                            <button
                              className="btn ghost icon sm"
                              onClick={() => removeItem(item)}
                              title="Видалити"
                              style={{ color: 'var(--st-open-fg)' }}
                            >
                              <Ic.Trash sz={10} />
                            </button>
                          </div>
                        )}
                      </div>
                      {item.description && (
                        <p
                          style={{
                            margin: '0 0 8px',
                            fontSize: 12.5,
                            color: 'var(--fg-2)',
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                      {item.quarter && (
                        <span
                          className="tag"
                          style={{
                            fontSize: 10.5,
                            background: col.bg,
                            color: col.color,
                            borderColor: 'transparent',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            fontWeight: 600,
                          }}
                        >
                          {item.quarter}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )
          })}
        </div>
      )}

      {(editing || creating) && (
        <RoadmapEditor
          item={editing}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSaved={() => {
            setEditing(null)
            setCreating(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// Editor (модал)
// ============================================================================

function RoadmapEditor({
  item,
  onClose,
  onSaved,
}: {
  item: RoadmapItem | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const isNew = !item
  const [title, setTitle] = useState(item?.title ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [status, setStatus] = useState<RoadmapStatus>(item?.status ?? 'planned')
  const [quarter, setQuarter] = useState(item?.quarter ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!title.trim()) {
      toast.show('Заповніть назву', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        quarter: quarter.trim(),
      }
      if (isNew) {
        await api.createRoadmapItem(payload)
        toast.show('Створено', 'success')
      } else {
        await api.updateRoadmapItem(item!.id, payload)
        toast.show('Збережено', 'success')
      }
      onSaved()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(540px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {isNew ? 'Новий пункт' : 'Редагування'}
          </h2>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-lbl">Назва</label>
            <input
              className="inp"
              autoFocus
              placeholder="Що плануємо…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="form-lbl">Опис</label>
            <textarea
              className="inp"
              rows={3}
              placeholder="Деталі (опц.)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label className="form-lbl">Статус</label>
              <select
                className="inp"
                value={status}
                onChange={e => setStatus(e.target.value as RoadmapStatus)}
              >
                <option value="planned">Заплановано</option>
                <option value="in_progress">У роботі</option>
                <option value="done">Готово</option>
                <option value="cancelled">Скасовано</option>
              </select>
            </div>
            <div>
              <label className="form-lbl">Квартал</label>
              <input
                className="inp"
                placeholder="Q3 2026 (опц.)"
                value={quarter}
                onChange={e => setQuarter(e.target.value)}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 8,
              paddingTop: 16,
              borderTop: '1px solid var(--divider)',
            }}
          >
            <button className="btn" onClick={onClose}>
              Скасувати
            </button>
            <button className="btn primary" onClick={submit} disabled={saving}>
              {saving ? 'Зберігаю…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
