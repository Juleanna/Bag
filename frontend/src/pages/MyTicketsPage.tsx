/**
 * «Мої звернення» — сторінка для звичайного користувача.
 *
 * Backend get_queryset(SupportTicketViewSet) для не-агента повертає лише
 * власні тікети, тож той самий /api/support/tickets/ підходить.
 * Клік на рядок → /support/tickets/:id (наша версія деталей).
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

const STATUS_LABEL: Record<SupportTicketStatus, { label: string; color: string }> = {
  open: { label: 'Відкрито', color: 'var(--st-open-fg)' },
  in_progress: { label: 'У роботі', color: 'var(--st-progress-fg)' },
  closed: { label: 'Закрито', color: 'var(--st-resolved-fg)' },
}

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Низький',
  normal: 'Звичайний',
  high: 'Високий',
  urgent: 'Терміновий',
}

export function MyTicketsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [loading, setLoading] = useState(true)

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
          onClick={() => navigate('/support')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Звʼязатись
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span style={{ color: 'var(--fg-3)' }}>Мої звернення</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Мої звернення</h1>
          <div className="sub">
            Усі ваші запити та статус їх обробки.{' '}
            {tickets.length > 0 &&
              `Всього ${tickets.length}, відкритих ${
                tickets.filter(t => t.status === 'open').length
              }.`}
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => navigate('/support')}>
            <Ic.Plus sz={12} /> Нове звернення
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={48} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <Ic.Inbox sz={36} />
          <h4>Ще немає звернень</h4>
          <p>Ваші запити в саппорт зʼявляться тут.</p>
          <button
            className="btn primary"
            onClick={() => navigate('/support')}
            style={{ marginTop: 12 }}
          >
            <Ic.Plus sz={12} /> Створити перше
          </button>
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
                <th style={{ width: 140, paddingRight: 18 }}>Створено</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => {
                const st = STATUS_LABEL[t.status]
                return (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`/support/tickets/${t.id}`)}
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
                    <td style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>
                      {PRIORITY_LABEL[t.priority] || t.priority}
                    </td>
                    <td
                      style={{
                        fontSize: 12.5,
                        color: st.color,
                        fontWeight: 500,
                      }}
                    >
                      {st.label}
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
