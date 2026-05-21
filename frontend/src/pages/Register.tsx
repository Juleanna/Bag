import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { apiPost } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useSaasMode } from '../hooks/useSaasMode'
import { AuthAside } from './auth/AuthAside'
import { AuthBrand } from './auth/AuthBrand'

type TeamSize = 'solo' | 'small' | 'team' | 'big'
type Role = 'qa-lead' | 'qa' | 'dev' | 'pm' | 'founder' | 'other'

export function RegisterPage() {
  useSaasMode()
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<1 | 2>(1)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Крок 1 — акаунт
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Крок 2 — команда
  const [workspace, setWorkspace] = useState('')
  const [size, setSize] = useState<TeamSize>('team')
  const [role, setRole] = useState<Role>('qa-lead')

  const goNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !password) {
      setError('Заповніть усі поля')
      return
    }
    if (password.length < 8) {
      setError('Пароль має містити щонайменше 8 символів')
      return
    }
    setStep(2)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Розбиваємо ім'я на first/last name
      const parts = name.trim().split(/\s+/)
      const first_name = parts[0] || ''
      const last_name = parts.slice(1).join(' ')
      // Username — слаг з email до @, або з name
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() ||
        name.toLowerCase().replace(/\s+/g, '_')

      await register({ username, email, password, first_name, last_name })

      // Створюємо проєкт-простір з назвою workspace (якщо вказано)
      if (workspace.trim()) {
        try {
          await apiPost('/projects/', {
            name: workspace,
            description: `Робочий простір. Розмір команди: ${SIZE_LABELS[size]}. Роль: ${ROLE_LABELS[role]}.`,
          })
        } catch {
          // якщо не вдалось — нічого, користувач створить вручну
        }
      }

      toast.show('Акаунт створено!', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалось зареєструватись')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <div className="auth-form-top">
          <AuthBrand />
          <div className="alt">
            Вже є акаунт? <Link to="/login">Увійти</Link>
          </div>
        </div>

        <div className="auth-form-body">
          {step === 1 ? (
            <form onSubmit={goNext}>
              <div className="steps-meta">Крок 1 з 2 · Акаунт</div>
              <div className="steps-bar">
                <div className="step-pip active" />
                <div className="step-pip" />
              </div>
              <h1>Створіть акаунт</h1>
              <p className="sub">Безкоштовно. Без картки.</p>

              {error && (
                <div className="bt-error-banner" style={{ marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div className="auth-field">
                <label>Ім&apos;я</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Олена Петренко"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                  maxLength={100}
                />
              </div>
              <div className="auth-field">
                <label>Робочий email</label>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="you@team.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="auth-field">
                <label>Пароль</label>
                <input
                  className="auth-input"
                  type="password"
                  placeholder="Мінімум 8 символів"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <span className="hint">Літери, цифри і хоча б один спецсимвол.</span>
              </div>

              <button className="auth-submit" type="submit">
                Далі →
              </button>

              <div className="auth-foot" style={{ marginTop: 14 }}>
                Натискаючи &quot;Далі&quot;, ви погоджуєтесь з <a>Умовами</a> та{' '}
                <a>Політикою конфіденційності</a>.
              </div>
            </form>
          ) : (
            <form onSubmit={submit}>
              <button type="button" className="back-link" onClick={() => setStep(1)}>
                <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Назад
              </button>
              <div className="steps-meta">Крок 2 з 2 · Команда</div>
              <div className="steps-bar">
                <div className="step-pip done" />
                <div className="step-pip active" />
              </div>
              <h1>Налаштуйте простір</h1>
              <p className="sub">
                Як називати ваш робочий простір? Цю інформацію можна змінити пізніше.
              </p>

              {error && (
                <div className="bt-error-banner" style={{ marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <div className="auth-field">
                <label>Назва команди / компанії</label>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Voltway QA"
                  value={workspace}
                  onChange={e => setWorkspace(e.target.value)}
                />
                <span className="hint">
                  Створимо проєкт із цією назвою — ви зможете перейменувати його будь-коли.
                </span>
              </div>

              <div className="auth-field">
                <label>Розмір команди</label>
                <div className="workspace-grid">
                  {SIZE_OPTIONS.map(o => (
                    <button
                      type="button"
                      key={o.id}
                      className={size === o.id ? 'workspace-pick selected' : 'workspace-pick'}
                      onClick={() => setSize(o.id)}
                    >
                      <div
                        className="ico"
                        style={{ background: o.color, color: o.fg }}
                      >
                        <o.icon sz={14} />
                      </div>
                      <b>{o.t}</b>
                      <span>{o.s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label>Ваша роль</label>
                <select
                  className="auth-input"
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                  style={{ cursor: 'pointer' }}
                >
                  <option value="qa-lead">QA Lead / Head of QA</option>
                  <option value="qa">QA Engineer</option>
                  <option value="dev">Розробник</option>
                  <option value="pm">Product / Project Manager</option>
                  <option value="founder">Засновник / CTO</option>
                  <option value="other">Інше</option>
                </select>
              </div>

              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? 'Створення…' : 'Створити простір →'}
              </button>
            </form>
          )}
        </div>

        <div className="auth-form-footer">
          <span>© {new Date().getFullYear()} BugTracker</span>
          <span>
            <a>Допомога</a>
          </span>
        </div>
      </div>
      <AuthAside />
    </div>
  )
}

interface SizeOption {
  id: TeamSize
  icon: typeof Ic.User
  color: string
  fg: string
  t: string
  s: string
}

const SIZE_OPTIONS: SizeOption[] = [
  {
    id: 'solo',
    icon: Ic.User,
    color: 'var(--accent-soft)',
    fg: 'var(--accent-soft-fg)',
    t: 'Я один',
    s: '1 людина',
  },
  {
    id: 'small',
    icon: Ic.Users,
    color: 'var(--st-resolved-bg)',
    fg: 'var(--st-resolved-fg)',
    t: 'Невелика',
    s: '2–10 людей',
  },
  {
    id: 'team',
    icon: Ic.Layout,
    color: 'var(--st-progress-bg)',
    fg: 'var(--st-progress-fg)',
    t: 'Команда',
    s: '11–50 людей',
  },
  {
    id: 'big',
    icon: Ic.Spark,
    color: 'var(--st-blocked-bg)',
    fg: 'var(--st-blocked-fg)',
    t: 'Велика',
    s: '50+ людей',
  },
]

const SIZE_LABELS: Record<TeamSize, string> = {
  solo: '1 людина',
  small: '2–10 людей',
  team: '11–50 людей',
  big: '50+ людей',
}

const ROLE_LABELS: Record<Role, string> = {
  'qa-lead': 'QA Lead',
  qa: 'QA Engineer',
  dev: 'Розробник',
  pm: 'PM',
  founder: 'Засновник / CTO',
  other: 'Інше',
}
