/**
 * Сторінка профілю користувача з вкладками:
 *  - Профіль (імʼя/email)
 *  - Безпека (зміна пароля)
 *  - 2FA (TOTP — підключення/відключення)
 *  - API-токени (створення/відкликання)
 *  - Історія входів (останні 50 спроб)
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { gradientFor, initialsFor } from '../atoms/Avatar'
import { apiDelete, apiPatch, apiPost, apiUpload, listAll } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm, usePrompt } from '../context/ConfirmContext'
import { api as extras } from '../api/extras'
import type { ApiToken, LoginEvent } from '../api/extras'
import type { Issue, Project } from '../api/types'

type TabKey = 'general' | 'security' | 'tfa' | 'tokens' | 'logins'

export function ProfilePage() {
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('general')
  const [stats, setStats] = useState<{
    bugs: number
    closed: number
    projects: number
    lastLogin: string | null
  }>({ bugs: 0, closed: 0, projects: 0, lastLogin: null })

  // Підвантажуємо легку статистику для hero-блоку
  useEffect(() => {
    if (!user) return
    void (async () => {
      try {
        const [issues, projects, logins] = await Promise.all([
          listAll<Issue>('/issues/?page_size=200').catch(() => [] as Issue[]),
          listAll<Project>('/projects/?page_size=50').catch(() => [] as Project[]),
          extras.listLoginEvents().catch(() => [] as LoginEvent[]),
        ])
        const mine = issues.filter(i => i.reporter?.id === user.id)
        setStats({
          bugs: mine.length,
          closed: mine.filter(i => i.status_is_done).length,
          projects: projects.length,
          lastLogin:
            logins.find(l => l.success && l.user === user.id)?.created_at || null,
        })
      } catch {
        /* мовчки */
      }
    })()
  }, [user])

  const memberSince = useMemo(() => {
    // У UserShort немає date_joined — показуємо null, fallback на «—»
    return null
  }, [])

  if (!user) return null

  const fullName =
    user.first_name || user.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.username

  return (
    <div>
      <div className="profile-banner">
        <div className="pb-bg">
          <div className="pb-blob pb-blob-1" />
          <div className="pb-blob pb-blob-2" />
        </div>
        <div className="pb-row">
          <AvatarUploader
            user={user}
            onChanged={() => refresh()}
          />
          <div className="pb-meta">
            <h1>{fullName}</h1>
            <div className="pb-sub">
              <span className="pb-handle">@{user.username}</span>
              <span style={{ margin: '0 6px', color: 'var(--fg-4)' }}>·</span>
              <Ic.Inbox sz={11} style={{ marginRight: 4, color: 'var(--fg-3)' }} />
              <a href={`mailto:${user.email}`} style={{ color: 'var(--fg-2)' }}>
                {user.email}
              </a>
            </div>
            {user.is_staff && (
              <span
                className="tag"
                style={{
                  marginTop: 8,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent-soft-fg)',
                  borderColor: 'transparent',
                  fontWeight: 500,
                }}
              >
                <Ic.Shield sz={10} style={{ marginRight: 3 }} /> Адміністратор
              </span>
            )}
          </div>
          <div className="pb-actions">
            <button
              className="btn"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <Ic.LogOut sz={13} /> Вийти
            </button>
          </div>
        </div>

        <div className="pb-stats">
          <ProfileStat
            icon={<Ic.Bug sz={14} />}
            label="Створено багів"
            value={stats.bugs}
          />
          <ProfileStat
            icon={<Ic.Check2 sz={14} />}
            label="Закрито"
            value={stats.closed}
            tone="resolved"
          />
          <ProfileStat
            icon={<Ic.Layout sz={14} />}
            label="Проєктів"
            value={stats.projects}
          />
          <ProfileStat
            icon={<Ic.Clock sz={14} />}
            label="Останній вхід"
            value={stats.lastLogin ? formatRelative(stats.lastLogin) : '—'}
            small
          />
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div className="profile-grid">
          <div className="profile-tabs">
            <TabBtn cur={tab} k="general" onClick={setTab} icon={<Ic.User sz={13} />} label="Профіль" />
            <TabBtn cur={tab} k="security" onClick={setTab} icon={<Ic.Lock sz={13} />} label="Пароль" />
            <TabBtn cur={tab} k="tfa" onClick={setTab} icon={<Ic.Shield sz={13} />} label="2FA" />
            <TabBtn cur={tab} k="tokens" onClick={setTab} icon={<Ic.Key sz={13} />} label="API-токени" />
            <TabBtn cur={tab} k="logins" onClick={setTab} icon={<Ic.Activity sz={13} />} label="Історія входів" />
          </div>

          <div>
            {tab === 'general' && <GeneralForm user={user} onSaved={() => refresh()} />}
            {tab === 'security' && (
              <SecurityForm onChanged={() => toast.show('Пароль змінено', 'success')} />
            )}
            {tab === 'tfa' && <TwoFactorPanel />}
            {tab === 'tokens' && <ApiTokensPanel />}
            {tab === 'logins' && <LoginHistoryPanel />}
          </div>

          <div className="profile-side">
            <div className="card profile-info-card">
              <h4>
                <Ic.Layout sz={11} /> Інформація
              </h4>
              <InfoRow icon={<Ic.User sz={11} />} label="ID">
                <span style={{ fontFamily: 'var(--font-mono)' }}>#{user.id}</span>
              </InfoRow>
              <InfoRow icon={<Ic.User sz={11} />} label="Логін">
                {user.username}
              </InfoRow>
              <InfoRow icon={<Ic.Inbox sz={11} />} label="Пошта">
                {user.email || '—'}
              </InfoRow>
              <InfoRow icon={<Ic.Shield sz={11} />} label="Роль">
                {user.is_staff ? 'Адміністратор' : 'Користувач'}
              </InfoRow>
              {memberSince && (
                <InfoRow icon={<Ic.Calendar sz={11} />} label="З нами з">
                  {memberSince}
                </InfoRow>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AvatarUploader({
  user,
  onChanged,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  onChanged: () => void
}) {
  const toast = useToast()
  const confirm = useConfirm()
  const [busy, setBusy] = useState(false)

  const upload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.show('Максимальний розмір — 5 MB', 'error')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.show('Очікується зображення', 'error')
      return
    }
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      await apiUpload('/auth/avatar/', fd)
      toast.show('Аватар оновлено', 'success')
      onChanged()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Видалити аватар?',
      message: 'Повернетесь до автоматичних ініціалів.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await apiDelete('/auth/avatar/')
      toast.show('Аватар видалено', 'success')
      onChanged()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setBusy(false)
    }
  }

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void upload(file)
    e.target.value = '' // дозволяємо обрати той самий файл повторно
  }

  return (
    <div className="pb-avatar-wrap">
      <label
        className="pb-avatar"
        style={
          user.avatar_url
            ? {
                // Розділяємо backgroundColor + backgroundImage, бо shorthand
                // 'background' скидає інші background-* властивості
                backgroundColor: 'var(--bg-2)',
                backgroundImage: `url(${user.avatar_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                boxShadow: 'var(--shadow-md)',
                cursor: busy ? 'wait' : 'pointer',
                color: 'transparent',
              }
            : {
                background: gradientFor(user.id),
                boxShadow: 'var(--shadow-md)',
                cursor: busy ? 'wait' : 'pointer',
                color: 'white',
              }
        }
        title="Натисніть, щоб змінити"
      >
        {!user.avatar_url && initialsFor(user)}
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={onPick}
          disabled={busy}
        />
        <span className="pb-avatar-status" title="Онлайн" />
        <span className="pb-avatar-edit">
          <Ic.Edit sz={12} />
        </span>
      </label>
      {user.avatar_url && (
        <button
          type="button"
          className="btn ghost sm pb-avatar-remove"
          onClick={remove}
          disabled={busy}
          title="Видалити аватар"
        >
          <Ic.X sz={11} />
        </button>
      )}
    </div>
  )
}

function ProfileStat({
  icon,
  label,
  value,
  small,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  small?: boolean
  tone?: 'resolved'
}) {
  return (
    <div className={`pb-stat ${tone || ''}`}>
      <div className="pb-stat-ico">{icon}</div>
      <div className="pb-stat-meta">
        <div className="pb-stat-value" style={small ? { fontSize: 14 } : undefined}>
          {value}
        </div>
        <div className="pb-stat-label">{label}</div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="pf-info-row">
      <span className="pf-info-ico">{icon}</span>
      <span className="pf-info-label">{label}</span>
      <span className="pf-info-value">{children}</span>
    </div>
  )
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)} дн тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TabBtn({
  cur, k, onClick, icon, label,
}: {
  cur: TabKey
  k: TabKey
  onClick: (k: TabKey) => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button className={`pf-tab ${cur === k ? 'active' : ''}`} onClick={() => onClick(k)}>
      {icon} {label}
    </button>
  )
}

function GeneralForm({
  user,
  onSaved,
}: {
  user: NonNullable<ReturnType<typeof useAuth>['user']>
  onSaved: () => void
}) {
  const [first, setFirst] = useState(user.first_name || '')
  const [last, setLast] = useState(user.last_name || '')
  const [email, setEmail] = useState(user.email || '')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const save = async () => {
    setSaving(true)
    try {
      await apiPatch('/auth/profile/', { first_name: first, last_name: last, email })
      toast.show('Профіль оновлено', 'success')
      onSaved()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 14 }}>Загальна інформація</h3>
      <div className="form-grid">
        <div className="field">
          <label>Імʼя</label>
          <input className="inp" value={first} onChange={e => setFirst(e.target.value)} />
        </div>
        <div className="field">
          <label>Прізвище</label>
          <input className="inp" value={last} onChange={e => setLast(e.target.value)} />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Пошта</label>
          <input className="inp" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={save} disabled={saving}>
          {saving ? 'Збереження…' : 'Зберегти'}
        </button>
      </div>
    </div>
  )
}

function SecurityForm({ onChanged }: { onChanged: () => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [next2, setNext2] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  const change = async () => {
    setError(null)
    if (next !== next2) {
      setError('Паролі не збігаються')
      return
    }
    setSaving(true)
    try {
      await apiPost('/auth/password/', { current_password: current, new_password: next })
      setCurrent('')
      setNext('')
      setNext2('')
      onChanged()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Помилка'
      setError(msg)
      toast.show(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 14 }}>Зміна пароля</h3>
      {error && <div className="bt-error-banner">{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <div className="field">
          <label>Поточний пароль</label>
          <input
            className="inp"
            type="password"
            value={current}
            onChange={e => setCurrent(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Новий пароль</label>
          <input
            className="inp"
            type="password"
            value={next}
            onChange={e => setNext(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Повторіть новий пароль</label>
          <input
            className="inp"
            type="password"
            value={next2}
            onChange={e => setNext2(e.target.value)}
          />
        </div>
        <div>
          <button className="btn primary" onClick={change} disabled={saving || !current || !next}>
            {saving ? 'Зміна…' : 'Змінити пароль'}
          </button>
        </div>
      </div>
    </div>
  )
}

/** 2FA TOTP підключення з QR-код плейсхолдером (otpauth:// показуємо як рядок). */
function TwoFactorPanel() {
  const { user, refresh } = useAuth()
  const toast = useToast()
  const prompt = usePrompt()
  const [enrollment, setEnrollment] = useState<{ secret: string; otpauth_uri: string } | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  // Передбачається, що бекенд повертає user.totp_enabled у whoami; якщо ні — fallback на false.
  const enabled = (user as unknown as { totp_enabled?: boolean })?.totp_enabled ?? false

  const enroll = async () => {
    setBusy(true)
    try {
      const r = await extras.totpEnroll()
      setEnrollment({ secret: r.secret, otpauth_uri: r.otpauth_uri })
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setBusy(false)
    }
  }

  const verify = async () => {
    if (!code) return
    setBusy(true)
    try {
      await extras.totpVerify(code)
      toast.show('2FA активовано', 'success')
      setEnrollment(null)
      setCode('')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Невірний код', 'error')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    const c = await prompt({
      title: 'Вимкнути 2FA?',
      message: 'Введіть поточний 6-значний код з TOTP-додатка, щоб підтвердити.',
      placeholder: '000000',
      confirmText: 'Вимкнути',
      required: true,
    })
    if (!c) return
    setBusy(true)
    try {
      await extras.totpDisable(c)
      toast.show('2FA вимкнено', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 14 }}>
        <Ic.Shield sz={14} /> Двофакторна автентифікація (TOTP)
      </h3>
      <p style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 0 }}>
        Використовуйте Google Authenticator, 1Password, Authy або інший TOTP-додаток.
      </p>

      {enabled && !enrollment && (
        <div>
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--st-resolved-bg)',
              color: 'var(--st-resolved-fg)',
              borderRadius: 8,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
            }}
          >
            <Ic.Check2 sz={13} /> 2FA увімкнена
          </div>
          <button className="btn" onClick={disable} disabled={busy}>
            <Ic.X sz={11} /> Вимкнути 2FA
          </button>
        </div>
      )}

      {!enabled && !enrollment && (
        <button className="btn primary" onClick={enroll} disabled={busy}>
          <Ic.Plus sz={11} /> Підключити 2FA
        </button>
      )}

      {enrollment && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              padding: 14,
              border: '1px solid var(--border)',
              borderRadius: 8,
              background: 'var(--surface-2)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--fg-3)', marginBottom: 6 }}>
              1. Додайте секрет у TOTP-додаток (вручну або скануйте URI):
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 14,
                fontWeight: 600,
                userSelect: 'all',
                wordBreak: 'break-all',
              }}
            >
              {enrollment.secret}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--fg-3)' }}>
              URI:{' '}
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  userSelect: 'all',
                  wordBreak: 'break-all',
                }}
              >
                {enrollment.otpauth_uri}
              </span>
            </div>
          </div>
          <div className="field">
            <label>2. Введіть 6-значний код із додатка</label>
            <input
              className="inp"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              style={{ maxWidth: 160, fontFamily: 'var(--font-mono)', letterSpacing: '0.2em' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn primary" onClick={verify} disabled={busy || code.length !== 6}>
              Підтвердити та активувати
            </button>
            <button className="btn ghost" onClick={() => setEnrollment(null)}>
              Скасувати
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Список API-токенів з функцією створення / відкликання. */
function ApiTokensPanel() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [name, setName] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const confirm = useConfirm()

  const reload = () => {
    setLoading(true)
    extras
      .listApiTokens()
      .then(setTokens)
      .catch(() => setTokens([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const create = async () => {
    if (!name.trim()) return
    try {
      const t = await extras.createApiToken(name.trim())
      setNewKey(t.key || null)
      setName('')
      reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const revoke = async (t: ApiToken) => {
    const ok = await confirm({
      title: `Відкликати токен «${t.name}»?`,
      message: 'Запити, що використовують цей токен, перестануть авторизуватись.',
      confirmText: 'Відкликати',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.revokeApiToken(t.id)
      reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 6 }}>
        <Ic.Key sz={14} /> API-токени
      </h3>
      <p style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 4 }}>
        Використовуйте для автентифікації CLI / CI / інтеграцій. Передавайте у заголовку{' '}
        <code>Authorization: Token &lt;ключ&gt;</code>.
      </p>

      {newKey && (
        <div
          style={{
            padding: 12,
            background: 'var(--accent-soft)',
            color: 'var(--accent-soft-fg)',
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <b>Збережіть ключ — він показується лише один раз:</b>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              marginTop: 6,
              userSelect: 'all',
              wordBreak: 'break-all',
              fontSize: 12,
            }}
          >
            {newKey}
          </div>
          <button className="btn sm" style={{ marginTop: 8 }} onClick={() => setNewKey(null)}>
            Зрозуміло
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          className="inp"
          placeholder="Назва токена (e.g. ci-deploy)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn primary" onClick={create} disabled={!name.trim()}>
          <Ic.Plus sz={11} /> Створити
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>Завантаження…</div>
      ) : tokens.length === 0 ? (
        <div className="empty">
          <Ic.Key sz={28} />
          <p>Немає токенів</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Назва</th>
              <th>Створено</th>
              <th>Останнє використання</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tokens.map(t => {
              const revoked = !!t.revoked_at
              return (
                <tr key={t.id} style={{ opacity: revoked ? 0.6 : 1 }}>
                  <td>{t.name}</td>
                  <td className="muted">{formatDate(t.created_at)}</td>
                  <td className="muted">{t.last_used_at ? formatDate(t.last_used_at) : '—'}</td>
                  <td>
                    {revoked ? (
                      <span className="pill closed">Відкликано</span>
                    ) : (
                      <span className="pill resolved">Активний</span>
                    )}
                  </td>
                  <td className="right">
                    {!revoked && (
                      <button className="btn ghost icon sm" onClick={() => revoke(t)} title="Відкликати">
                        <Ic.X sz={11} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

/** Історія входів користувача — останні 50 спроб. */
function LoginHistoryPanel() {
  const [events, setEvents] = useState<LoginEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    extras
      .listLoginEvents()
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 6 }}>
        <Ic.Activity sz={14} /> Історія входів
      </h3>
      <p style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 4 }}>
        Якщо помітите підозрілий вхід — негайно змініть пароль.
      </p>

      {loading ? (
        <div style={{ color: 'var(--fg-3)', fontSize: 12 }}>Завантаження…</div>
      ) : events.length === 0 ? (
        <div className="empty">
          <Ic.Activity sz={28} />
          <p>Немає записів</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', minWidth: 0 }}>
          <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <colgroup>
              <col style={{ width: 160 }} />
              <col style={{ width: 100 }} />
              <col style={{ width: 110 }} />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Коли</th>
                <th>Результат</th>
                <th>IP</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>
                    {formatDate(e.created_at)}
                  </td>
                  <td>
                    {e.success ? (
                      <span className="pill resolved">
                        <Ic.Check2 sz={10} /> Успіх
                      </span>
                    ) : (
                      <span className="pill open">
                        <Ic.X sz={10} /> Невдача
                      </span>
                    )}
                  </td>
                  <td
                    className="muted"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    {e.ip_address || '—'}
                  </td>
                  <td
                    className="muted"
                    style={{
                      fontSize: 11,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={e.user_agent}
                  >
                    {e.user_agent}
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
