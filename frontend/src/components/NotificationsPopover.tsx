import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiPost, listAll } from '../api/client'
import type { Notification } from '../api/types'

interface Props {
  open: boolean
  onClose: () => void
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

export function NotificationsPopover({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listAll<Notification>('/notifications/?page_size=20')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open])

  const markAllRead = async () => {
    try {
      await apiPost('/notifications/mark_all_read/', {})
      setItems(items => items.map(n => ({ ...n, is_read: true })))
    } catch {
      /* ignore */
    }
  }

  const onClickItem = async (n: Notification) => {
    if (!n.is_read) {
      try {
        await apiPost(`/notifications/${n.id}/mark_read/`, {})
      } catch {
        /* ignore */
      }
    }
    if (n.issue) navigate(`/bugs/${n.issue}`)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 100 }} onClick={onClose} />
      <div
        style={{
          position: 'fixed',
          top: 56,
          right: 80,
          width: 380,
          maxHeight: '70vh',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          boxShadow: 'var(--shadow-lg)',
          zIndex: 101,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--divider)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ic.Bell sz={14} />
          <b style={{ fontSize: 13 }}>Сповіщення</b>
          <button
            className="btn ghost sm"
            style={{ marginLeft: 'auto' }}
            onClick={markAllRead}
          >
            Позначити все прочитаним
          </button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--fg-3)' }}>
              Завантаження…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
              Немає сповіщень
            </div>
          )}
          {items.map(n => (
            <div
              key={n.id}
              className={`ib-row ${n.is_read ? '' : 'unread'}`}
              onClick={() => onClickItem(n)}
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
    </>
  )
}
