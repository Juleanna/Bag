/**
 * Сторінка «Звʼязатись з нами» — форма звернення до підтримки.
 *
 * Вигляд за прототипом (proto/screens-help.jsx):
 *  - заголовок з підзаголовком і status-чіпом
 *  - 6 категорій-карток (вибір однієї)
 *  - тема (input), пріоритет (4 чіпа), опис (textarea)
 *  - sidebar справа: інші канали, робочий час
 *  - кнопки Скасувати / Надіслати
 *
 * Налаштування (категорії, контакти, робочий час, статус) — у адміна
 * через окрему сторінку `/admin/support`.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useToast } from '../context/ToastContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type {
  SupportPriority,
  SupportSettings,
  SupportStatusKind,
} from '../api/extras'

const PRIORITY_OPTIONS: { id: SupportPriority; label: string }[] = [
  { id: 'low', label: 'Низький' },
  { id: 'normal', label: 'Звичайний' },
  { id: 'high', label: 'Високий' },
  { id: 'urgent', label: 'Терміновий' },
]

const STATUS_STYLE: Record<
  SupportStatusKind,
  { color: string; dot: string }
> = {
  operational: { color: 'var(--st-resolved-fg)', dot: 'var(--st-resolved-dot)' },
  degraded: { color: 'var(--st-progress-fg)', dot: 'var(--st-progress-dot)' },
  down: { color: 'var(--st-open-fg)', dot: 'var(--st-open-dot)' },
}

export function SupportPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState<string>('')
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<SupportPriority>('normal')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const s = await api.getSupportSettings()
        setSettings(s)
        if (s.categories.length > 0) setCategory(s.categories[0].key)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = async () => {
    if (!category) {
      toast.show('Оберіть категорію', 'error')
      return
    }
    if (!subject.trim()) {
      toast.show('Заповніть тему', 'error')
      return
    }
    setSubmitting(true)
    try {
      await api.createSupportTicket({
        category,
        subject: subject.trim(),
        priority,
        description: description.trim(),
      })
      toast.show('Звернення надіслано — відповідь надійде на ваш email', 'success')
      setSubject('')
      setDescription('')
      setPriority('normal')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="page" style={{ maxWidth: 'unset' }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={400} />
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_STYLE[settings.status_kind]

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      <div className="page-head">
        <div>
          <h1>Звʼязатися з нами</h1>
          <div className="sub">{settings.intro_text}</div>
        </div>
        <div className="right">
          <div
            className="tag"
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--fg-2)',
              fontSize: 12,
            }}
          >
            <Ic.Globe sz={11} style={{ marginRight: 6 }} />
            Статус:{' '}
            <span
              style={{
                color: statusStyle.color,
                marginLeft: 4,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: statusStyle.dot,
                }}
              />
              {settings.status_text}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        {/* Основна форма */}
        <div className="card" style={{ padding: 24 }}>
          {/* Категорії */}
          <div className="form-section">
            <label className="form-lbl" style={{ fontSize: 14 }}>
              Чим можемо допомогти?
            </label>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--fg-3)',
                marginBottom: 12,
              }}
            >
              Виберіть категорію — це допоможе спрямувати тікет до правильної
              команди.
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 8,
              }}
            >
              {settings.categories.map(c => {
                const active = category === c.key
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    style={{
                      textAlign: 'left',
                      padding: 14,
                      borderRadius: 10,
                      border: active
                        ? '2px solid var(--accent)'
                        : '1px solid var(--border)',
                      background: active ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: active ? 'var(--accent-soft-fg)' : 'var(--fg)',
                        marginBottom: 4,
                      }}
                    >
                      {c.label}
                    </div>
                    <div
                      style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.4 }}
                    >
                      {c.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Тема */}
          <div className="form-section" style={{ marginTop: 20 }}>
            <label className="form-lbl">Тема</label>
            <input
              className="inp"
              placeholder="Коротко опишіть суть запиту"
              value={subject}
              onChange={e => setSubject(e.target.value)}
            />
          </div>

          {/* Пріоритет */}
          <div className="form-section" style={{ marginTop: 16 }}>
            <label className="form-lbl">Пріоритет</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn sm ${priority === p.id ? 'primary' : ''}`}
                  onClick={() => setPriority(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Опис */}
          <div className="form-section" style={{ marginTop: 16 }}>
            <label className="form-lbl">Опис</label>
            <textarea
              className="inp"
              rows={6}
              placeholder="Опишіть проблему чи питання детально. Чим більше контексту — тим швидше допоможемо. Можна вставляти URL, скріншоти, логи."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
              {description.length} символів
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--divider)',
            }}
          >
            <button className="btn" onClick={() => navigate(-1)}>
              Скасувати
            </button>
            <button
              className="btn primary"
              onClick={submit}
              disabled={submitting}
            >
              <Ic.Mail sz={12} />{' '}
              {submitting ? 'Надсилаю…' : 'Надіслати'}
            </button>
          </div>
        </div>

        {/* Sidebar справа */}
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
              Інші канали
            </h4>
            {settings.email && (
              <ChannelRow
                icon={<Ic.Mail sz={13} />}
                title="Email"
                value={settings.email}
                meta={settings.email_response_time}
                href={`mailto:${settings.email}`}
              />
            )}
            {settings.chat_hours && (
              <ChannelRow
                icon={<Ic.Comment sz={13} />}
                title="Чат"
                value="у застосунку, праворуч…"
                meta={settings.chat_hours}
              />
            )}
            {settings.community_link && (
              <ChannelRow
                icon={<Ic.Users sz={13} />}
                title="Спільнота"
                value={settings.community_label}
                href={settings.community_link}
              />
            )}
            {settings.github_link && (
              <ChannelRow
                icon={<Ic.Github sz={13} />}
                title="GitHub"
                value={settings.github_label}
                href={settings.github_link}
              />
            )}
          </div>

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
              Робочий час
            </h4>
            <div style={{ fontSize: 13, lineHeight: 1.7 }}>
              <div>{settings.business_hours_weekday}</div>
              <div style={{ color: 'var(--fg-3)' }}>
                {settings.business_hours_weekend}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ChannelRow({
  icon,
  title,
  value,
  meta,
  href,
}: {
  icon: React.ReactNode
  title: string
  value: string
  meta?: string
  href?: string
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px solid var(--divider)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          background: 'var(--bg-2)',
          color: 'var(--fg-2)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>{title}</div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--fg-3)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
      </div>
      {meta && (
        <div
          style={{
            fontSize: 11,
            color: 'var(--fg-3)',
            whiteSpace: 'nowrap',
            paddingTop: 2,
          }}
        >
          {meta}
        </div>
      )}
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
      {content}
    </a>
  ) : (
    content
  )
}
