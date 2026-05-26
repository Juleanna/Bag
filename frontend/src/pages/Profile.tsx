/**
 * Сторінка профілю користувача з вкладками:
 *  - Профіль (імʼя/email)
 *  - Безпека (зміна пароля)
 *  - 2FA (TOTP — підключення/відключення)
 *  - API-токени (створення/відкликання)
 *  - Історія входів (останні 50 спроб)
 */
import { useEffect, useState } from 'react'
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

type TabKey = 'account' | 'notif' | 'security' | 'integrations' | 'shortcuts' | 'billing'

interface ProfileStats {
  bugsClosed: number
  bugsCreated: number
  projectsCount: number
  passRate: number | null
}

export function ProfilePage() {
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('account')
  const [stats, setStats] = useState<ProfileStats>({
    bugsClosed: 0,
    bugsCreated: 0,
    projectsCount: 0,
    passRate: null,
  })
  const [myIssues, setMyIssues] = useState<Issue[]>([])

  // Підвантажуємо метрики й активність користувача.
  useEffect(() => {
    if (!user) return
    void (async () => {
      try {
        const [issues, projects] = await Promise.all([
          listAll<Issue>('/issues/?page_size=500').catch(() => [] as Issue[]),
          listAll<Project>('/projects/?page_size=100').catch(() => [] as Project[]),
        ])
        const mine = issues.filter(i => i.reporter?.id === user.id)
        setMyIssues(mine)
        setStats({
          bugsCreated: mine.length,
          bugsClosed: mine.filter(i => i.status_is_done).length,
          projectsCount: projects.length,
          // Pass rate з тест-ранів поки не рахуємо (потребує окремого ендпоінту).
          passRate: null,
        })
      } catch {
        /* мовчки */
      }
    })()
  }, [user])

  if (!user) return null

  const fullName =
    user.first_name || user.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user.username

  return (
    <div className="scroll-inner">
      {/* Banner — аватар, ім'я, теги досягнень, дії */}
      <div className="profile-banner">
        <div className="pb-row">
          <AvatarUploader user={user} onChanged={() => refresh()} />
          <div className="pb-meta">
            <h1>{fullName}</h1>
            <div className="pb-sub">
              <span className="pb-handle">@{user.username}</span>
              {user.email && (
                <>
                  <span style={{ margin: '0 6px', color: 'var(--fg-4)' }}>·</span>
                  <Ic.Inbox sz={11} style={{ marginRight: 4, color: 'var(--fg-3)' }} />
                  <a href={`mailto:${user.email}`} style={{ color: 'var(--fg-2)' }}>
                    {user.email}
                  </a>
                </>
              )}
            </div>
            <div className="pb-tags">
              {user.is_staff && (
                <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', borderColor: 'transparent' }}>
                  <Ic.Shield sz={10} /> Адміністратор
                </span>
              )}
              {stats.bugsClosed >= 10 && (
                <span className="tag">
                  <Ic.Star sz={10} style={{ color: 'var(--pri-high)' }} /> {stats.bugsClosed} закритих багів
                </span>
              )}
              {(user as { totp_enabled?: boolean }).totp_enabled && (
                <span className="tag">
                  <Ic.Shield sz={10} /> 2FA активна
                </span>
              )}
            </div>
          </div>
          <div className="pb-actions">
            <button
              className="btn ghost icon"
              title="Вийти"
              onClick={async () => {
                await logout()
                navigate('/login')
              }}
            >
              <Ic.LogOut sz={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        {/* Метрики (4 картки під banner) */}
        <div className="metrics" style={{ marginBottom: 20 }}>
          <MetricCard label="Створено багів" value={stats.bugsCreated} />
          <MetricCard label="Закрито багів" value={stats.bugsClosed} delta={stats.bugsClosed > 0 ? `${Math.round((stats.bugsClosed / Math.max(stats.bugsCreated, 1)) * 100)}% від створених` : null} tone="down" />
          <MetricCard label="Проєктів" value={stats.projectsCount} />
          <MetricCard label="Pass rate" value={stats.passRate != null ? `${stats.passRate}%` : '—'} />
        </div>

        {/* Сітка: tabs (sticky) + content + side */}
        <div className="profile-grid">
          <aside className="profile-tabs">
            <TabBtn cur={tab} k="account" onClick={setTab} icon={<Ic.User sz={14} />} label="Акаунт" />
            <TabBtn cur={tab} k="notif" onClick={setTab} icon={<Ic.Bell sz={14} />} label="Сповіщення" />
            <TabBtn cur={tab} k="security" onClick={setTab} icon={<Ic.Shield sz={14} />} label="Безпека" />
            <TabBtn cur={tab} k="integrations" onClick={setTab} icon={<Ic.Github sz={14} />} label="Інтеграції" />
            <TabBtn cur={tab} k="shortcuts" onClick={setTab} icon={<Ic.Lightning sz={14} />} label="Шорткати" />
            <TabBtn cur={tab} k="billing" onClick={setTab} icon={<Ic.Tag sz={14} />} label="Білінг" />
          </aside>

          <div className="profile-content">
            {tab === 'account' && <GeneralForm user={user} onSaved={() => refresh()} />}
            {tab === 'notif' && <NotificationsTab />}
            {tab === 'security' && (
              <SecurityTab
                onPasswordChanged={() => toast.show('Пароль змінено', 'success')}
              />
            )}
            {tab === 'integrations' && <IntegrationsTab />}
            {tab === 'shortcuts' && <ShortcutsTab />}
            {tab === 'billing' && <BillingTab />}
          </div>

          <aside className="profile-side">
            <div className="card">
              <div className="card-head"><h3>Остання активність</h3></div>
              <div className="card-body" style={{ paddingTop: 4 }}>
                <RecentActivity issues={myIssues} />
              </div>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-head"><h3>Контрибуції</h3><span className="sub">90 днів</span></div>
              <div className="card-body" style={{ paddingTop: 4 }}>
                <ContributionHeatmap issues={myIssues} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  delta,
  tone,
}: {
  label: string
  value: React.ReactNode
  delta?: string | null
  tone?: 'up' | 'down' | 'flat'
}) {
  return (
    <div className="card metric">
      <div className="metric-lbl">{label}</div>
      <div className="metric-val">{value}</div>
      {delta && <div className={`metric-delta ${tone || 'flat'}`}>{delta}</div>}
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

  // Синхронізуємо локальний стейт після refresh() — інакше після очищення
  // полів і збереження user оновлюється, а форма показує старі значення.
  useEffect(() => {
    setFirst(user.first_name || '')
    setLast(user.last_name || '')
    setEmail(user.email || '')
  }, [user.first_name, user.last_name, user.email])

  const save = async () => {
    // Принаймні одне з імені/прізвища обовʼязкове — щоб у UI завжди було
    // людиночитане displayName замість @machine-нікa.
    if (!first.trim() && !last.trim()) {
      toast.show('Вкажіть імʼя або прізвище', 'error')
      return
    }
    // Email обовʼязковий — інакше не дійдуть нотифікації і неможливо
    // відновити пароль. Бекенд також повертає 400, тут — для миттєвого
    // фідбеку без зайвого round-trip.
    if (!email.trim()) {
      toast.show('Пошта обовʼязкова', 'error')
      return
    }
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
    <div id="profile-account-form" className="card" style={{ padding: 18 }}>
      <h3 style={{ margin: 0, marginBottom: 14 }}>Загальна інформація</h3>
      <div className="form-grid">
        <div className="field">
          <label>Імʼя</label>
          <input
            className="inp"
            value={first}
            onChange={e => setFirst(e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="field">
          <label>Прізвище</label>
          <input
            className="inp"
            value={last}
            onChange={e => setLast(e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Пошта *</label>
          <input
            className="inp"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            maxLength={254}
            required
          />
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

// =============================================================================
// SecurityTab — об'єднує зміну пароля, 2FA і історію входів (як "Активні сесії")
// =============================================================================
function SecurityTab({ onPasswordChanged }: { onPasswordChanged: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <TwoFactorPanel />
      <SecurityForm onChanged={onPasswordChanged} />
      <LoginHistoryPanel />
    </div>
  )
}

// =============================================================================
// IntegrationsTab — список зовнішніх сервісів + API-токени
// =============================================================================
function IntegrationsTab() {
  // Поки що — статичний список з плейсхолдерами. API-токени — реальні.
  const integrations: { Icn: typeof Ic.Github; name: string; info: string; connected: boolean; desc: string }[] = [
    { Icn: Ic.Github, name: 'GitHub', info: 'Не підключено', connected: false, desc: 'Звʼязує PR з багами, авто-закриває по merge' },
    { Icn: Ic.Slack, name: 'Slack', info: 'Не підключено', connected: false, desc: 'Сповіщення про критичні баги та failed runs' },
    { Icn: Ic.AI, name: 'OpenAI', info: 'Не підключено', connected: false, desc: 'AI-підсумки та авто-теги через gpt-4o' },
    { Icn: Ic.Calendar, name: 'Google Calendar', info: 'Не підключено', connected: false, desc: 'Синхронізує дедлайни багів та test runs' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="card-head"><h3>Підключені сервіси</h3></div>
        <div className="card-body" style={{ paddingTop: 8 }}>
          {integrations.map((it, i) => (
            <div
              key={it.name}
              className="int-row"
              style={{ borderTop: i === 0 ? 'none' : '1px solid var(--divider)' }}
            >
              <div className="int-logo"><it.Icn sz={18} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <b>{it.name}</b>
                  {it.connected && (
                    <span className="pill resolved">
                      <span className="dot" style={{ background: 'var(--st-resolved-dot)' }} />
                      Підключено
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>{it.info}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-4)', marginTop: 4 }}>{it.desc}</div>
              </div>
              <button className="btn sm" disabled title="Інтеграцію буде додано згодом">
                Незабаром
              </button>
            </div>
          ))}
        </div>
      </div>
      <ApiTokensPanel />
    </div>
  )
}

// =============================================================================
// NotificationsTab — налаштування каналів сповіщень (стейт у localStorage)
// =============================================================================
const NOTIF_STORAGE_KEY = 'bt:profile:notif:v1'
const NOTIF_DEFAULT: Record<string, [boolean, boolean, boolean, boolean]> = {
  'Призначено баг': [true, true, true, true],
  'Згадка у коментарі': [true, true, true, true],
  'Коментар у моєму бaзі': [false, true, false, true],
  'Зміна статусу мого бага': [false, false, false, true],
  'Failed test у моєму ranі': [true, true, true, true],
  'Запит на ревʼю кейса': [true, false, true, true],
  'Тижневий дайджест': [true, false, false, false],
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<typeof NOTIF_DEFAULT>(() => {
    try {
      const raw = localStorage.getItem(NOTIF_STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch { /* ignore */ }
    return { ...NOTIF_DEFAULT }
  })
  const [quietOn, setQuietOn] = useState(true)
  const [quietFrom, setQuietFrom] = useState('19:00')
  const [quietTo, setQuietTo] = useState('09:00')

  const toggle = (key: string, idx: number) => {
    setPrefs(p => {
      const cur = p[key] || [false, false, false, false]
      const next = [...cur] as typeof cur
      next[idx] = !next[idx]
      const updated = { ...p, [key]: next }
      try {
        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
      return updated
    })
  }

  const channels = ['Email', 'Push', 'Slack', 'Інбокс']

  return (
    <div className="card">
      <div className="card-head"><h3>Налаштування сповіщень</h3></div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        <table className="notif-table">
          <thead>
            <tr>
              <th>Подія</th>
              {channels.map(c => <th key={c}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {Object.entries(prefs).map(([event, vals]) => (
              <tr key={event}>
                <td>{event}</td>
                {vals.map((v, i) => (
                  <td key={i}>
                    <span
                      className={`toggle ${v ? 'on' : ''}`}
                      onClick={() => toggle(event, i)}
                      role="checkbox"
                      aria-checked={v}
                    >
                      <span />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="quiet-hours">
          <div>
            <b>Тихі години</b>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>
              Не надсилати push та Slack після робочого часу
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="inp"
              value={quietFrom}
              onChange={e => setQuietFrom(e.target.value)}
              style={{ width: 80 }}
            />
            <span style={{ color: 'var(--fg-3)' }}>—</span>
            <input
              className="inp"
              value={quietTo}
              onChange={e => setQuietTo(e.target.value)}
              style={{ width: 80 }}
            />
            <span
              className={`toggle ${quietOn ? 'on' : ''}`}
              onClick={() => setQuietOn(q => !q)}
              role="checkbox"
              aria-checked={quietOn}
            >
              <span />
            </span>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11.5, color: 'var(--fg-4)' }}>
          Налаштування зберігаються локально. Інтеграція з email / push / Slack ще не активна.
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ShortcutsTab — статичний довідник клавіатурних скорочень
// =============================================================================
function ShortcutsTab() {
  const sections: [string, [string, string][]][] = [
    ['Навігація', [
      ['Команд палітра', '⌘ K'],
      ['Огляд', '⌘ 1'],
      ['Список багів', '⌘ 2'],
      ['Тест-кейси', '⌘ 3'],
      ['Test Runs', '⌘ 4'],
    ]],
    ['Дії', [
      ['Створити баг', 'C'],
      ['Створити кейс', '⇧ C'],
      ['Призначити мені', 'I'],
      ['Готово', 'E'],
      ['Архівувати', '⌘ ⌫'],
    ]],
    ['Список', [
      ['Вгору / Вниз', 'J / K'],
      ['Відкрити', '↵'],
      ['Фільтри', 'F'],
      ['Пошук', '/'],
    ]],
    ['Форма бага · Кроки відтворення', [
      ['Додати новий крок під поточним', '↵'],
      ['Видалити порожній крок', '⌫'],
    ]],
  ]
  return (
    <div className="card">
      <div className="card-head"><h3>Клавіатурні скорочення</h3></div>
      <div className="card-body" style={{ paddingTop: 4 }}>
        {sections.map(([sec, rows]) => (
          <div key={sec} className="kbd-section">
            <h5>{sec}</h5>
            {rows.map(([name, keys]) => (
              <div key={name} className="kbd-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{name}</span>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  {keys.split(' ').map((part, i) => (
                    <span key={i} className="kbd">{part}</span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// BillingTab — плейсхолдер тарифного плану
// =============================================================================
function BillingTab() {
  return (
    <div className="card">
      <div className="card-head"><h3>Тарифний план</h3></div>
      <div className="card-body" style={{ paddingTop: 8 }}>
        <div className="plan-card">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-soft-fg)' }}>
              Поточний план
            </div>
            <h2 style={{ margin: '6px 0 4px', fontSize: 22, fontWeight: 600 }}>Free</h2>
            <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>До 5 користувачів · усі базові функції</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
              $0<span style={{ fontSize: 14, color: 'var(--fg-3)', fontWeight: 500 }}>/міс</span>
            </div>
            <button className="btn primary sm" style={{ marginTop: 8 }} disabled>
              Покращити план
            </button>
          </div>
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--fg-3)' }}>
          Платні тарифи (Team / Enterprise) будуть доступні згодом.
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// RecentActivity — останні створені баги юзера
// =============================================================================
function RecentActivity({ issues }: { issues: Issue[] }) {
  const navigate = useNavigate()
  // Сортуємо по updated_at desc, беремо топ-7
  const recent = [...issues]
    .sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at))
    .slice(0, 7)

  if (recent.length === 0) {
    return (
      <div style={{ fontSize: 12.5, color: 'var(--fg-3)', padding: '8px 0' }}>
        Ще немає активності
      </div>
    )
  }

  return (
    <>
      {recent.map(it => {
        const kind = it.status_is_done ? 'closed' : 'create'
        return (
          <div
            key={it.id}
            className="pf-act"
            onClick={() => navigate(`/bugs/${it.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <span className={`pf-act-ico ${kind}`}>
              {kind === 'closed' ? <Ic.Check sz={11} /> : <Ic.Plus sz={11} />}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--fg)',
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="id-cell">BUG-{it.id}</span> {it.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                {formatRelative(it.updated_at || it.created_at)}
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}

// =============================================================================
// ContributionHeatmap — heatmap за останні 90 днів за датою створення issue
// =============================================================================
function ContributionHeatmap({ issues }: { issues: Issue[] }) {
  // Рахуємо кількість issue.created_at за день за останні 91 день.
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days: { date: Date; count: number }[] = []
  for (let i = 90; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push({ date: d, count: 0 })
  }
  const dayKey = (d: Date) => d.toISOString().slice(0, 10)
  const map = new Map<string, number>()
  for (const day of days) map.set(dayKey(day.date), 0)
  for (const it of issues) {
    const d = new Date(it.created_at)
    d.setHours(0, 0, 0, 0)
    const k = dayKey(d)
    if (map.has(k)) map.set(k, (map.get(k) || 0) + 1)
  }
  days.forEach(d => { d.count = map.get(dayKey(d.date)) || 0 })

  // Інтенсивність 0-4
  const intensity = (count: number) => {
    if (count === 0) return 0
    if (count === 1) return 1
    if (count <= 3) return 2
    if (count <= 6) return 3
    return 4
  }

  // Лейбли місяців (тільки 3, рівномірно)
  const labels = [days[0]?.date, days[Math.floor(days.length / 2)]?.date, days[days.length - 1]?.date]
    .filter(Boolean)
    .map(d => d!.toLocaleDateString('uk-UA', { month: 'long' }))

  return (
    <>
      <div className="heatmap">
        {days.map((d, i) => (
          <span
            key={i}
            className={`hm hm-${intensity(d.count)}`}
            title={`${d.date.toLocaleDateString('uk-UA')}: ${d.count} ${d.count === 1 ? 'подія' : 'подій'}`}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--fg-3)' }}>
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
        <span>зараз</span>
      </div>
    </>
  )
}
