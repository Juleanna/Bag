import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSaasMode } from '../hooks/useSaasMode'
import { AuthAside } from './auth/AuthAside'
import { AuthBrand } from './auth/AuthBrand'

export function LoginPage() {
  useSaasMode()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(identifier, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не вдалось увійти')
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
            Немає акаунту? <Link to="/register">Зареєструватися</Link>
          </div>
        </div>

        <form className="auth-form-body" onSubmit={onSubmit}>
          <h1>З поверненням</h1>
          <p className="sub">Увійдіть до вашого робочого простору.</p>

          {error && (
            <div className="bt-error-banner" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="auth-field">
            <label>Email або логін</label>
            <input
              className="auth-input"
              type="text"
              placeholder="you@team.com"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div className="auth-field">
            <label>
              Пароль{' '}
              <a onClick={() => alert('Скидання пароля — TODO. Скористайтесь /api/auth/password/forgot/')}>
                Забули?
              </a>
            </label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <label className="auth-checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Запам&apos;ятати мене на цьому пристрої
          </label>

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Вхід…' : 'Увійти →'}
          </button>

          <div className="auth-foot" style={{ marginTop: 16 }}>
            Захищено сесійною автентифікацією + CSRF.
          </div>
        </form>

        <div className="auth-form-footer">
          <span>© {new Date().getFullYear()} BugTracker</span>
          <span>
            <a>Конфіденційність</a> · <a>Умови</a>
          </span>
        </div>
      </div>
      <AuthAside />
    </div>
  )
}
