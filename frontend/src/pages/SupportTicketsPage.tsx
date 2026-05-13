/**
 * Список вхідних звернень — для адмінів і агентів підтримки.
 *
 * Бекенд сам фільтрує queryset по правах поточного користувача:
 * адмін бачить усі, агент — лише ті, на категорії яких має доступ
 * (плюс свої власні).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useToast } from '../context/ToastContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type {
  SupportSettings,
  SupportTicket,
  SupportTicketStatus,
} from '../api/extras'

const STATUS_TABS: { id: SupportTicketStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'open', label: 'Відкриті' },
  { id: 'in_progress', label: 'У роботі' },
  { id: 'closed', label: 'Закриті' },
]

const STATUS_COLOR: Record<SupportTicketStatus, string> = {
  open: 'var(--st-open-fg)',
  in_progress: 'var(--st-progress-fg)',
  closed: 'var(--st-resolved-fg)',
}

const PRIORITY_LABEL: Record<string, { label: string; color: string }> = {
  low: { label: 'Низький', color: 'var(--fg-3)' },
  normal: { label: 'Звичайний', color: 'var(--accent-soft-fg)' },
  high: { label: 'Високий', color: 'var(--st-progress-fg)' },
  urgent: { label: 'Терміновий', color: 'var(--st-open-fg)' },
}

export function SupportTicketsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<SupportTicketStatus | 'all'>('open')

  useEffect(() => {
    void (async () => {
      try {
        const [t, s] = await Promise.all([
          api.listSupportTickets(),
          api.getSupportSettings(),
        ])
        setTickets(t)
        setSettings(s)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const categoryLabel = (key: string) =>
    settings?.categories.find(c => c.key === key)?.label || key

  const filtered =
    filter === 'all' ? tickets : tickets.filter(t => t.status === filter)

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        <button
          className="btn ghost sm"
          onClick={() => navigate('/admin/support')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Підтримка
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span style={{ color: 'var(--fg-3)' }}>Звернення</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Вхідні звернення</h1>
          <div className="sub">
            Усього {tickets.length} · Відкритих{' '}
            {tickets.filter(t => t.status === 'open').length}
          </div>
        </div>
      </div>

      <div className="filters" style={{ marginBottom: 16 }}>
        <div className="seg">
          {STATUS_TABS.map(t => {
            const count =
              t.id === 'all'
                ? tickets.length
                : tickets.filter(x => x.status === t.id).length
            return (
              <button
                key={t.id}
                type="button"
                className={filter === t.id ? 'active' : ''}
                onClick={() => setFilter(t.id)}
              >
                {t.label}
                <span style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={48} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <Ic.Inbox sz={36} />
          <h4>Немає звернень</h4>
          <p>
            {filter === 'all'
              ? 'Звернень з вашими правами доступу немає.'
              : 'У цьому статусі немає звернень.'}
          </p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 18, width: 60 }}>#</th>
                <th>Тема</th>
                <th style={{ width: 160 }}>Категорія</th>
                <th style={{ width: 120 }}>Пріоритет</th>
                <th style={{ width: 110 }}>Статус</th>
                <th style={{ width: 180 }}>Від</th>
                <th style={{ width: 140, paddingRight: 18 }}>Створено</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const pri = PRIORITY_LABEL[t.priority] || PRIORITY_LABEL.normal
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/admin/support/tickets/${t.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ paddingLeft: 18 }}>
                      <span className="id-cell" style={{ fontSize: 11.5 }}>
                        T-{t.id}
                      </span>
                    </td>
                    <td>
                      <b style={{ fontSize: 13 }}>{t.subject}</b>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
                      {categoryLabel(t.category)}
                    </td>
                    <td style={{ fontSize: 12.5, color: pri.color, fontWeight: 500 }}>
                      {pri.label}
                    </td>
                    <td
                      style={{
                        fontSize: 12.5,
                        color: STATUS_COLOR[t.status],
                        fontWeight: 500,
                      }}
                    >
                      {STATUS_TABS.find(x => x.id === t.status)?.label || t.status}
                    </td>
                    <td className="muted" style={{ fontSize: 12.5 }}>
                      {t.submitted_by_name || t.submitted_email || '—'}
                    </td>
                    <td
                      className="muted"
                      style={{ fontSize: 12.5, paddingRight: 18 }}
                    >
                      {new Date(t.created_at).toLocaleString('uk-UA', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
