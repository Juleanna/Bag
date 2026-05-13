/**
 * Адмін-сторінка налаштувань сторінки «Звʼязатись з нами».
 *
 * Доступна тільки для staff. Дозволяє редагувати:
 *  - intro / status / категорії звернень
 *  - контактні канали (email, чат, спільнота, github)
 *  - робочий час
 * Також показує список вхідних тікетів.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type {
  SupportCategory,
  SupportSettings,
  SupportStatusKind,
  SupportTicket,
} from '../api/extras'

const STATUS_OPTIONS: { id: SupportStatusKind; label: string }[] = [
  { id: 'operational', label: 'Усі системи працюють' },
  { id: 'degraded', label: 'Часткова деградація' },
  { id: 'down', label: 'Серйозна аварія' },
]

export function SupportSettingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.is_staff) {
      navigate('/support')
      return
    }
    void (async () => {
      try {
        const [s, t] = await Promise.all([
          api.getSupportSettings(),
          api.listSupportTickets().catch(() => [] as SupportTicket[]),
        ])
        setSettings(s)
        setTickets(t)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const update = (patch: Partial<SupportSettings>) =>
    setSettings(s => (s ? { ...s, ...patch } : s))

  const updateCategory = (i: number, patch: Partial<SupportCategory>) =>
    setSettings(s =>
      s
        ? {
            ...s,
            categories: s.categories.map((c, idx) =>
              idx === i ? { ...c, ...patch } : c
            ),
          }
        : s
    )

  const addCategory = () =>
    setSettings(s =>
      s
        ? {
            ...s,
            categories: [
              ...s.categories,
              { key: `custom-${Date.now()}`, label: '', description: '' },
            ],
          }
        : s
    )

  const removeCategory = (i: number) =>
    setSettings(s =>
      s
        ? { ...s, categories: s.categories.filter((_, idx) => idx !== i) }
        : s
    )

  const save = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await api.updateSupportSettings({
        intro_text: settings.intro_text,
        status_kind: settings.status_kind,
        status_text: settings.status_text,
        email: settings.email,
        email_response_time: settings.email_response_time,
        chat_hours: settings.chat_hours,
        community_link: settings.community_link,
        community_label: settings.community_label,
        github_link: settings.github_link,
        github_label: settings.github_label,
        business_hours_weekday: settings.business_hours_weekday,
        business_hours_weekend: settings.business_hours_weekend,
        categories: settings.categories,
      })
      setSettings(updated)
      toast.show('Збережено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
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

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      <div className="page-head">
        <div>
          <h1>Налаштування «Звʼязатись з нами»</h1>
          <div className="sub">
            Категорії, контактні канали і робочий час, що видно користувачам.
          </div>
        </div>
        <div className="right">
          <button className="btn" onClick={() => navigate('/support')}>
            <Ic.Eye sz={12} /> Переглянути сторінку
          </button>
          <button className="btn primary" onClick={save} disabled={saving}>
            <Ic.Check sz={12} /> {saving ? 'Збереження…' : 'Зберегти'}
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 360px',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Заголовок і статус */}
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>
              Заголовок і статус
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-lbl">Підзаголовок</label>
                <input
                  className="inp"
                  value={settings.intro_text}
                  onChange={e => update({ intro_text: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-lbl">Тип статусу</label>
                  <select
                    className="inp"
                    value={settings.status_kind}
                    onChange={e =>
                      update({ status_kind: e.target.value as SupportStatusKind })
                    }
                  >
                    {STATUS_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-lbl">Текст статусу</label>
                  <input
                    className="inp"
                    value={settings.status_text}
                    onChange={e => update({ status_text: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Категорії */}
          <div className="card" style={{ padding: 18 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <h4 style={{ margin: 0, fontSize: 14 }}>Категорії звернень</h4>
              <button className="btn sm" onClick={addCategory}>
                <Ic.Plus sz={11} /> Додати
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {settings.categories.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr 1.5fr 32px',
                    gap: 6,
                    alignItems: 'center',
                  }}
                >
                  <input
                    className="inp"
                    placeholder="key"
                    value={c.key}
                    onChange={e => updateCategory(i, { key: e.target.value })}
                  />
                  <input
                    className="inp"
                    placeholder="Назва"
                    value={c.label}
                    onChange={e => updateCategory(i, { label: e.target.value })}
                  />
                  <input
                    className="inp"
                    placeholder="Опис (видно під назвою)"
                    value={c.description}
                    onChange={e =>
                      updateCategory(i, { description: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="btn icon ghost sm"
                    onClick={() => removeCategory(i)}
                    title="Видалити"
                  >
                    <Ic.X sz={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Канали зв'язку */}
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Канали звʼязку</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-lbl">Email</label>
                  <input
                    className="inp"
                    type="email"
                    value={settings.email}
                    onChange={e => update({ email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-lbl">Час відповіді</label>
                  <input
                    className="inp"
                    value={settings.email_response_time}
                    onChange={e =>
                      update({ email_response_time: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="form-lbl">Час роботи чату</label>
                <input
                  className="inp"
                  value={settings.chat_hours}
                  onChange={e => update({ chat_hours: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-lbl">Спільнота — URL</label>
                  <input
                    className="inp"
                    type="url"
                    value={settings.community_link}
                    onChange={e => update({ community_link: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-lbl">Спільнота — підпис</label>
                  <input
                    className="inp"
                    value={settings.community_label}
                    onChange={e => update({ community_label: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label className="form-lbl">GitHub — URL</label>
                  <input
                    className="inp"
                    type="url"
                    value={settings.github_link}
                    onChange={e => update({ github_link: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-lbl">GitHub — підпис</label>
                  <input
                    className="inp"
                    value={settings.github_label}
                    onChange={e => update({ github_label: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Робочий час */}
          <div className="card" style={{ padding: 18 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Робочий час</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="inp"
                placeholder="Пн–Пт · 9:00–18:00 EET"
                value={settings.business_hours_weekday}
                onChange={e =>
                  update({ business_hours_weekday: e.target.value })
                }
              />
              <input
                className="inp"
                placeholder="Сб–Нд · тільки критичні"
                value={settings.business_hours_weekend}
                onChange={e =>
                  update({ business_hours_weekend: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Sidebar: список тікетів */}
        <aside>
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
              Вхідні звернення · {tickets.length}
            </h4>
            {tickets.length === 0 ? (
              <div
                style={{ fontSize: 12.5, color: 'var(--fg-3)', padding: '8px 0' }}
              >
                Ще немає звернень
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tickets.slice(0, 20).map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: 10,
                      background: 'var(--surface-2)',
                      borderRadius: 8,
                      fontSize: 12.5,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                      }}
                    >
                      <b>{t.subject}</b>
                      <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>
                        {new Date(t.created_at).toLocaleDateString('uk-UA')}
                      </span>
                    </div>
                    <div style={{ color: 'var(--fg-3)', fontSize: 11.5 }}>
                      {t.category} · {t.priority} ·{' '}
                      {t.submitted_by_name || t.submitted_email || '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
