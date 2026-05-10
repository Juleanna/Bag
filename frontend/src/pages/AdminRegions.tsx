/**
 * Адмін-сторінка для управління регіонами зберігання даних.
 * Доступна тільки для is_staff. CRUD-операції через /api/regions/.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

interface Region {
  id: number
  code: string
  label: string
  icon: string
  sort_order: number
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

const EMPTY: Partial<Region> = {
  code: '',
  label: '',
  icon: '',
  sort_order: 0,
  is_active: true,
  is_default: false,
}

export function AdminRegionsPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Region> | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await apiGet<Region[] | { results: Region[] }>('/regions/')
      const items = Array.isArray(list) ? list : list.results || []
      setRegions(items)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не вдалося завантажити', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (!editing.code?.trim() || !editing.label?.trim()) {
      toast.show('Заповніть код та назву', 'error')
      return
    }
    try {
      if (editing.id) {
        await apiPatch(`/regions/${editing.id}/`, editing)
        toast.show('Регіон оновлено', 'success')
      } else {
        await apiPost('/regions/', editing)
        toast.show('Регіон створено', 'success')
      }
      setEditing(null)
      void reload()
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Помилка', 'error')
    }
  }

  const remove = async (r: Region) => {
    const ok = await confirm({
      title: `Видалити регіон «${r.label}»?`,
      message:
        'Існуючі простори, прив\'язані до цього регіону, не будуть видалені — лише втратять зв\'язок.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await apiDelete(`/regions/${r.id}/`)
      toast.show('Регіон видалено', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleActive = async (r: Region) => {
    try {
      await apiPatch(`/regions/${r.id}/`, { is_active: !r.is_active })
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const setDefault = async (r: Region) => {
    try {
      await apiPatch(`/regions/${r.id}/`, { is_default: true })
      toast.show('Регіон за замовчуванням оновлено', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Регіони даних</h1>
          <div className="sub">
            Локації зберігання даних для нових просторів. Користувачі вибирають один із
            активних під час створення.
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => setEditing({ ...EMPTY })}>
            <Ic.Plus sz={13} /> Новий регіон
          </button>
        </div>
      </div>

      {editing && (
        <form className="card" style={{ padding: 18, marginBottom: 16 }} onSubmit={save}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>
            {editing.id ? 'Редагування регіону' : 'Новий регіон'}
          </h3>
          <div className="admin-grid-2">
            <div className="field">
              <label>Код *</label>
              <input
                className="inp"
                value={editing.code || ''}
                onChange={e =>
                  setEditing({ ...editing, code: e.target.value.toLowerCase().slice(0, 16) })
                }
                placeholder="ua / eu / us-east"
                style={{ fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>
            <div className="field">
              <label>Назва *</label>
              <input
                className="inp"
                value={editing.label || ''}
                onChange={e => setEditing({ ...editing, label: e.target.value })}
                placeholder="UA · Київ"
                required
              />
            </div>
            <div className="field">
              <label>Іконка (emoji)</label>
              <input
                className="inp"
                value={editing.icon || ''}
                onChange={e => setEditing({ ...editing, icon: e.target.value })}
                placeholder="🇺🇦"
                maxLength={4}
              />
            </div>
            <div className="field">
              <label>Порядок (менше — раніше)</label>
              <input
                className="inp"
                type="number"
                value={editing.sort_order ?? 0}
                onChange={e =>
                  setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="cb"
                  checked={editing.is_active ?? true}
                  onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                />
                Активний (доступний для вибору)
              </label>
            </div>
            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="cb"
                  checked={editing.is_default ?? false}
                  onChange={e => setEditing({ ...editing, is_default: e.target.checked })}
                />
                За замовчуванням
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
              Скасувати
            </button>
            <button type="submit" className="btn primary">
              Зберегти
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : regions.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Globe sz={36} />
          <h4>Немає регіонів</h4>
          <p>Додайте перший регіон, щоб користувачі могли створювати простори.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Код</th>
                <th>Назва</th>
                <th>Порядок</th>
                <th>Активний</th>
                <th>За замовч.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {regions.map(r => (
                <tr key={r.id} style={{ opacity: r.is_active ? 1 : 0.5 }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.code}</td>
                  <td>
                    {r.icon && <span style={{ marginRight: 6 }}>{r.icon}</span>}
                    <b>{r.label}</b>
                  </td>
                  <td className="muted">{r.sort_order}</td>
                  <td>
                    <span
                      className={r.is_active ? 'toggle on' : 'toggle'}
                      onClick={() => toggleActive(r)}
                      style={{ cursor: 'pointer' }}
                      title={r.is_active ? 'Вимкнути' : 'Увімкнути'}
                    >
                      <span />
                    </span>
                  </td>
                  <td>
                    {r.is_default ? (
                      <span className="pill resolved">
                        <Ic.Check sz={10} /> Так
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn ghost sm"
                        onClick={() => setDefault(r)}
                        title="Зробити за замовчуванням"
                      >
                        Зробити default
                      </button>
                    )}
                  </td>
                  <td className="right">
                    <button
                      className="btn ghost icon sm"
                      title="Редагувати"
                      onClick={() => setEditing(r)}
                    >
                      <Ic.Edit sz={11} />
                    </button>
                    <button
                      className="btn ghost icon sm"
                      title="Видалити"
                      onClick={() => remove(r)}
                    >
                      <Ic.Trash sz={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
