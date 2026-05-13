/**
 * Деталі тікета підтримки + тред коментарів.
 *
 * Доступ обмежується на бекенді. Якщо у поточного користувача немає прав
 * на цю категорію — отримає 403 при PATCH. Форма коментаря:
 *  - для агента/адміна — це staff-reply (помічається кольоровою плашкою)
 *  - для автора тікета — звичайне уточнення
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type {
  SupportComment,
  SupportSettings,
  SupportTicket,
  SupportTicketStatus,
} from '../api/extras'

const STATUS_OPTIONS: { id: SupportTicketStatus; label: string }[] = [
  { id: 'open', label: 'Відкрито' },
  { id: 'in_progress', label: 'У роботі' },
  { id: 'closed', label: 'Закрито' },
]

export function SupportTicketDetailPage({
  ownerView = false,
}: {
  /** true — рендер під моїми тікетами /support/tickets/:id, false — адмінська /admin/support/tickets/:id */
  ownerView?: boolean
}) {
  const { id } = useParams<{ id: string }>()
  const ticketId = Number(id)
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [ticket, setTicket] = useState<SupportTicket | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [posting, setPosting] = useState(false)

  const reload = async () => {
    try {
      const [t, c, s] = await Promise.all([
        api.getSupportTicket(ticketId),
        api.listSupportComments(ticketId),
        api.getSupportSettings(),
      ])
      setTicket(t)
      setComments(c)
      setSettings(s)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      navigate('/admin/support/tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ticketId) return
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId])

  const updateStatus = async (next: SupportTicketStatus) => {
    if (!ticket) return
    try {
      const updated = await api.updateSupportTicket(ticket.id, { status: next })
      setTicket(updated)
      window.dispatchEvent(new CustomEvent('support:changed'))
      toast.show('Статус оновлено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const submitReply = async () => {
    if (!reply.trim() || !ticket) return
    setPosting(true)
    try {
      const created = await api.postSupportComment(ticket.id, reply.trim())
      setComments(arr => [...arr, created])
      setReply('')
      toast.show('Надіслано', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setPosting(false)
    }
  }

  if (loading || !ticket) {
    return (
      <div className="page" style={{ maxWidth: 'unset' }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={300} />
        </div>
      </div>
    )
  }

  const categoryLabel =
    settings?.categories.find(c => c.key === ticket.category)?.label ||
    ticket.category
  const isOwner = !!user && user.id === ticket.submitted_by

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      {/* Хлібні крихти */}
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
          onClick={() =>
            navigate(ownerView ? '/support/tickets' : '/admin/support/tickets')
          }
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} />{' '}
          {ownerView ? 'Мої звернення' : 'Звернення'}
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span className="id-cell" style={{ fontSize: 11.5 }}>
          T-{ticket.id}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Основний контент */}
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>
            {ticket.subject}
          </h1>
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--fg-3)',
              marginTop: 6,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span>
              від <b style={{ color: 'var(--fg-2)' }}>{ticket.submitted_by_name || ticket.submitted_email || '—'}</b>
            </span>
            <span>·</span>
            <span>{new Date(ticket.created_at).toLocaleString('uk-UA')}</span>
            <span>·</span>
            <span>{categoryLabel}</span>
          </div>

          <div
            className="card"
            style={{ padding: 18, marginTop: 16, whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.6 }}
          >
            {ticket.description || <i style={{ color: 'var(--fg-3)' }}>Опис не задано</i>}
          </div>

          {/* Тред коментарів */}
          <h3 style={{ margin: '24px 0 12px', fontSize: 14 }}>
            Тред <span style={{ color: 'var(--fg-3)' }}>· {comments.length}</span>
          </h3>
          {comments.length === 0 ? (
            <div
              style={{
                padding: 16,
                color: 'var(--fg-3)',
                fontSize: 13,
                border: '1px dashed var(--border)',
                borderRadius: 10,
                textAlign: 'center',
              }}
            >
              Ще немає відповідей
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map(c => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    padding: 14,
                    borderLeft: c.is_staff_reply
                      ? '3px solid var(--accent)'
                      : '3px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      fontSize: 12.5,
                    }}
                  >
                    <b style={{ color: c.is_staff_reply ? 'var(--accent-soft-fg)' : 'var(--fg-2)' }}>
                      {c.author_name || '—'}
                      {c.is_staff_reply && (
                        <span
                          className="tag"
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            background: 'var(--accent-soft)',
                            color: 'var(--accent-soft-fg)',
                            borderColor: 'transparent',
                          }}
                        >
                          Саппорт
                        </span>
                      )}
                    </b>
                    <span style={{ color: 'var(--fg-3)' }}>
                      {new Date(c.created_at).toLocaleString('uk-UA')}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                    {c.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Форма відповіді */}
          <div className="card" style={{ padding: 16, marginTop: 12 }}>
            <textarea
              className="inp"
              rows={4}
              placeholder={isOwner ? 'Додайте уточнення…' : 'Відповідь користувачу…'}
              value={reply}
              onChange={e => setReply(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 8,
              }}
            >
              <button
                className="btn primary"
                onClick={submitReply}
                disabled={!reply.trim() || posting}
              >
                <Ic.Mail sz={12} /> {posting ? 'Надсилаю…' : 'Надіслати'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar — статус, мета, чейндж */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Властивості
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="form-lbl" style={{ fontSize: 11 }}>
                  Статус
                </label>
                {ownerView ? (
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: 13,
                      borderRadius: 6,
                      background: 'var(--surface-2)',
                    }}
                  >
                    {STATUS_OPTIONS.find(o => o.id === ticket.status)?.label ||
                      ticket.status}
                  </div>
                ) : (
                  <select
                    className="inp"
                    value={ticket.status}
                    onChange={e =>
                      updateStatus(e.target.value as SupportTicketStatus)
                    }
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ fontSize: 12.5 }}>
                <span style={{ color: 'var(--fg-3)' }}>Пріоритет: </span>
                <b>{ticket.priority}</b>
              </div>
              <div style={{ fontSize: 12.5 }}>
                <span style={{ color: 'var(--fg-3)' }}>Email: </span>
                <span>{ticket.submitted_email || '—'}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
