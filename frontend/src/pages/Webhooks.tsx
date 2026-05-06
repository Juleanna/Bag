/**
 * Webhooks — створення/редагування webhook-ендпоінтів,
 * перегляд секрету та статусу останнього виклику.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { api as extras } from '../api/extras'
import type { Webhook } from '../api/extras'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

const ALL_EVENTS = [
  { id: 'issue.created', label: 'Створено баг' },
  { id: 'issue.updated', label: 'Оновлено баг' },
  { id: 'issue.closed', label: 'Закрито баг' },
  { id: 'comment.created', label: 'Новий коментар' },
  { id: 'testrun.completed', label: 'Завершено test run' },
]

const EMPTY_FORM: Partial<Webhook> = {
  name: '',
  url: '',
  events: ['issue.created', 'issue.updated'],
  is_active: true,
  project: null,
}

export function WebhooksPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const [hooks, setHooks] = useState<Webhook[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<Webhook> | null>(null)

  const reload = () => {
    setLoading(true)
    Promise.all([
      extras.listWebhooks().catch(() => [] as Webhook[]),
      listAll<Project>('/projects/?page_size=50').catch(() => [] as Project[]),
    ])
      .then(([hs, ps]) => {
        setHooks(hs)
        setProjects(ps)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      if (editing.id) {
        await extras.updateWebhook(editing.id, editing)
        toast.show('Webhook оновлено', 'success')
      } else {
        await extras.createWebhook(editing)
        toast.show('Webhook створено', 'success')
      }
      setEditing(null)
      reload()
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Помилка', 'error')
    }
  }

  const remove = async (h: Webhook) => {
    const ok = await confirm({
      title: `Видалити webhook «${h.name}»?`,
      message: 'Зовнішній сервіс перестане отримувати події.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.deleteWebhook(h.id)
      reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleEvent = (ev: string) => {
    if (!editing) return
    const cur = editing.events || []
    setEditing({
      ...editing,
      events: cur.includes(ev) ? cur.filter(x => x !== ev) : [...cur, ev],
    })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Webhooks</h1>
          <div className="sub">
            Підписуйте зовнішні сервіси на події (HTTP POST з HMAC-підписом)
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => setEditing({ ...EMPTY_FORM })}>
            <Ic.Plus sz={13} /> Новий webhook
          </button>
        </div>
      </div>

      {editing && (
        <form className="card" style={{ padding: 18, marginBottom: 16 }} onSubmit={save}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>
            {editing.id ? 'Редагування webhook' : 'Новий webhook'}
          </h3>
          <div className="admin-grid-2">
            <div className="field">
              <label>Назва *</label>
              <input
                className="inp"
                value={editing.name || ''}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Проєкт (необовʼязково)</label>
              <select
                className="inp"
                value={editing.project ?? ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    project: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Усі проєкти</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>URL *</label>
              <input
                className="inp"
                type="url"
                value={editing.url || ''}
                onChange={e => setEditing({ ...editing, url: e.target.value })}
                placeholder="https://example.com/webhook"
                required
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Події</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {ALL_EVENTS.map(ev => {
                  const active = (editing.events || []).includes(ev.id)
                  return (
                    <button
                      type="button"
                      key={ev.id}
                      className={`btn sm ${active ? 'primary' : 'ghost'}`}
                      onClick={() => toggleEvent(ev.id)}
                    >
                      {ev.label}
                    </button>
                  )
                })}
              </div>
            </div>
            {editing.id && editing.secret && (
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Secret (для перевірки HMAC підпису)</label>
                <input
                  className="inp"
                  readOnly
                  value={editing.secret}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
              </div>
            )}
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={e => setEditing({ ...editing, is_active: e.target.checked })}
                />{' '}
                Активний
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
              Скасувати
            </button>
            <button type="submit" className="btn primary">
              {editing.id ? 'Оновити' : 'Створити'}
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
      ) : hooks.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Activity sz={36} />
          <h4>Немає webhook-ів</h4>
          <p>Додайте перший, щоб отримувати події у Slack/Discord/Custom URL</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>URL</th>
                <th>Події</th>
                <th>Останній виклик</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hooks.map(h => {
                const failed =
                  h.last_status_code !== null && (h.last_status_code < 200 || h.last_status_code >= 300)
                return (
                  <tr key={h.id} style={{ opacity: h.is_active ? 1 : 0.5 }}>
                    <td>
                      <b>{h.name}</b>
                      {h.project && (
                        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                          проєкт #{h.project}
                        </div>
                      )}
                    </td>
                    <td
                      className="muted"
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11.5,
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h.url}
                    </td>
                    <td className="muted" style={{ fontSize: 11.5 }}>
                      {h.events.length} {h.events.length === 1 ? 'подія' : 'події'}
                    </td>
                    <td className="muted" style={{ fontSize: 11.5 }}>
                      {h.last_called_at
                        ? new Date(h.last_called_at).toLocaleString('uk-UA')
                        : '—'}
                    </td>
                    <td>
                      {h.last_status_code === null ? (
                        <span className="pill closed">не викликано</span>
                      ) : failed ? (
                        <span className="pill open">{h.last_status_code}</span>
                      ) : (
                        <span className="pill resolved">{h.last_status_code}</span>
                      )}
                    </td>
                    <td className="right">
                      <button
                        className="btn ghost icon sm"
                        title="Редагувати"
                        onClick={() => setEditing(h)}
                      >
                        <Ic.Edit sz={11} />
                      </button>
                      <button
                        className="btn ghost icon sm"
                        title="Видалити"
                        onClick={() => remove(h)}
                      >
                        <Ic.Trash sz={11} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
