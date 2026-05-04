import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiPost, listAll } from '../api/client'
import type { Notification } from '../api/types'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export function InboxPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [active, setActive] = useState<Notification | null>(null)
  const [tab, setTab] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = await listAll<Notification>('/notifications/?page_size=100')
        setItems(data)
        if (data.length > 0) setActive(data[0])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const markRead = async (n: Notification) => {
    if (n.is_read) return
    try {
      await apiPost(`/notifications/${n.id}/mark_read/`, {})
      setItems(items => items.map(x => (x.id === n.id ? { ...x, is_read: true } : x)))
    } catch {
      /* ignore */
    }
  }

  const markAll = async () => {
    try {
      await apiPost('/notifications/mark_all_read/', {})
      setItems(items => items.map(n => ({ ...n, is_read: true })))
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  const filtered = tab === 'unread' ? items.filter(n => !n.is_read) : items
  const unreadCount = items.filter(n => !n.is_read).length

  return (
    <div className="inbox-wrap">
      <div className="inbox-list">
        <div className="inbox-head">
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Інбокс</h2>
          <button className="btn ghost sm" onClick={markAll}>
            <Ic.Check sz={11} /> Усе прочитано
          </button>
        </div>
        <div className="inbox-tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            Усі <span className="cnt">{items.length}</span>
          </button>
          <button className={tab === 'unread' ? 'active' : ''} onClick={() => setTab('unread')}>
            Непрочитані <span className="cnt">{unreadCount}</span>
          </button>
        </div>
        <div className="inbox-items">
          {filtered.length === 0 && (
            <div className="empty">
              <Ic.Inbox sz={28} />
              <p>Тут поки порожньо</p>
            </div>
          )}
          {filtered.map(n => (
            <div
              key={n.id}
              className={`ib-row ${active?.id === n.id ? 'active' : ''} ${n.is_read ? '' : 'unread'}`}
              onClick={() => {
                setActive(n)
                void markRead(n)
              }}
            >
              <div
                className="ib-ico"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}
              >
                <Ic.Bell sz={13} />
              </div>
              <div className="ib-body">
                <div className="ib-top">
                  <span className="ib-title">{n.message}</span>
                  <span className="ib-when">{formatWhen(n.created_at)}</span>
                </div>
              </div>
              {!n.is_read && <div className="ib-dot" />}
            </div>
          ))}
        </div>
      </div>

      <div className="inbox-detail">
        {active ? (
          <>
            <div className="ibd-head">
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{active.message}</h2>
              </div>
              {active.issue && (
                <button className="btn primary sm" onClick={() => navigate(`/bugs/${active.issue}`)}>
                  Перейти до бага <Ic.Chev sz={11} />
                </button>
              )}
            </div>
            <div className="ibd-body">
              <div style={{ color: 'var(--fg-3)', fontSize: 13 }}>{formatWhen(active.created_at)}</div>
              <div className="quote-card" style={{ marginTop: 16 }}>
                {active.message}
              </div>
            </div>
          </>
        ) : (
          <div className="empty">
            <Ic.Inbox sz={36} />
            <h4>Оберіть сповіщення</h4>
            <p>Вибране сповіщення з'явиться тут</p>
          </div>
        )}
      </div>
    </div>
  )
}
