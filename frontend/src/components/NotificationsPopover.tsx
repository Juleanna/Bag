import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiPost, listAll } from '../api/client'
import type { Notification, NotificationKind } from '../api/types'
import { displayName } from '../utils/user'

interface Props {
  open: boolean
  onClose: () => void
}

type TabKey = 'all' | 'mention' | 'assigned' | 'fail'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

// Кольори і іконки для кожного типу — за прототипом.
const kindStyles: Record<NotificationKind, { icon: React.ReactNode; bg: string; fg: string }> = {
  mention:  { icon: <Ic.Comment sz={12} />, bg: 'var(--accent-soft)',     fg: 'var(--accent-soft-fg)' },
  assigned: { icon: <Ic.User sz={12} />,    bg: 'var(--st-progress-bg)',  fg: 'var(--st-progress-fg)' },
  fail:     { icon: <Ic.X sz={12} />,       bg: 'var(--st-open-bg)',      fg: 'var(--st-open-fg)' },
  review:   { icon: <Ic.Eye sz={12} />,     bg: 'var(--accent-soft)',     fg: 'var(--accent-soft-fg)' },
  comment:  { icon: <Ic.Comment sz={12} />, bg: 'var(--bg-2)',            fg: 'var(--fg-3)' },
  closed:   { icon: <Ic.Check sz={12} />,   bg: 'var(--st-resolved-bg)',  fg: 'var(--st-resolved-fg)' },
  other:    { icon: <Ic.Bell sz={12} />,    bg: 'var(--bg-2)',            fg: 'var(--fg-3)' },
}

export function NotificationsPopover({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<TabKey>('all')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    listAll<Notification>('/notifications/?page_size=20')
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [open])

  const counts = useMemo(() => ({
    all: items.length,
    mention: items.filter(i => i.kind === 'mention').length,
    assigned: items.filter(i => i.kind === 'assigned').length,
    fail: items.filter(i => i.kind === 'fail').length,
  }), [items])

  const unread = useMemo(() => items.filter(i => !i.is_read).length, [items])

  const filtered = useMemo(() => {
    if (tab === 'all') return items
    return items.filter(i => i.kind === tab)
  }, [items, tab])

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
        setItems(items => items.map(it => (it.id === n.id ? { ...it, is_read: true } : it)))
      } catch {
        /* ignore */
      }
    }
    if (n.issue) navigate(`/bugs/${n.issue}`)
    onClose()
  }

  const openInbox = () => {
    onClose()
    navigate('/inbox')
  }

  if (!open) return null

  return (
    <div className="popover-overlay" onClick={onClose}>
      <div className="popover notif-pop" onClick={e => e.stopPropagation()}>
        {/* Заголовок із бейджем "X нові" і кнопками */}
        <div className="pop-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b style={{ fontSize: 14 }}>Сповіщення</b>
            {unread > 0 && (
              <span
                className="tag"
                style={{
                  background: 'var(--accent-soft)',
                  color: 'var(--accent-soft-fg)',
                  borderColor: 'transparent',
                }}
              >
                {unread} нові
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn ghost icon sm"
              title="Позначити всі як прочитано"
              onClick={markAllRead}
              disabled={unread === 0}
            >
              <Ic.Check sz={12} />
            </button>
            <button
              className="btn ghost icon sm"
              title="Налаштування"
              onClick={() => {
                onClose()
                navigate('/profile')
              }}
            >
              <Ic.Settings sz={12} />
            </button>
          </div>
        </div>

        {/* Вкладки */}
        <div className="pop-tabs">
          <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
            Усі <span className="cnt">{counts.all}</span>
          </button>
          <button
            className={tab === 'mention' ? 'active' : ''}
            onClick={() => setTab('mention')}
          >
            Згадки <span className="cnt">{counts.mention}</span>
          </button>
          <button
            className={tab === 'assigned' ? 'active' : ''}
            onClick={() => setTab('assigned')}
          >
            Призначено <span className="cnt">{counts.assigned}</span>
          </button>
          <button className={tab === 'fail' ? 'active' : ''} onClick={() => setTab('fail')}>
            Невдалі тести <span className="cnt">{counts.fail}</span>
          </button>
        </div>

        {/* Список */}
        <div className="pop-list">
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--fg-3)', fontSize: 12 }}>
              Завантаження…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--fg-3)', fontSize: 12.5 }}>
              {tab === 'all' ? 'Немає сповіщень' : 'У цій категорії порожньо'}
            </div>
          )}
          {filtered.map(n => {
            const k: NotificationKind = (n.kind || 'other') as NotificationKind
            const style = kindStyles[k] || kindStyles.other
            return (
              <div
                key={n.id}
                className={`pop-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => onClickItem(n)}
              >
                <span className="ib-ico" style={{ background: style.bg, color: style.fg }}>
                  {style.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: n.is_read ? 450 : 600,
                      color: n.is_read ? 'var(--fg-2)' : 'var(--fg)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                    {formatWhen(n.created_at)}
                    {n.actor && ` · ${displayName(n.actor)}`}
                  </div>
                </div>
                {!n.is_read && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Футер */}
        <button className="pop-foot" onClick={openInbox}>
          Відкрити інбокс <Ic.Chev sz={11} />
        </button>
      </div>
    </div>
  )
}
