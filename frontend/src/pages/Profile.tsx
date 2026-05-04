import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { gradientFor, initialsFor } from '../atoms/Avatar'
import { apiPatch, apiPost } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export function ProfilePage() {
  const { user, logout, refresh } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [tab, setTab] = useState<'general' | 'security'>('general')

  if (!user) return null

  return (
    <div>
      <div className="profile-banner">
        <div className="pb-bg" />
        <div className="pb-row">
          <div
            className="pb-avatar"
            style={{ background: gradientFor(user.id) }}
          >
            {initialsFor(user)}
          </div>
          <div className="pb-meta">
            <h1>
              {user.first_name || user.last_name
                ? `${user.first_name} ${user.last_name}`.trim()
                : user.username}
            </h1>
            <div className="pb-sub">@{user.username} · {user.email}</div>
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
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div className="profile-grid">
          <div className="profile-tabs">
            <button
              className={`pf-tab ${tab === 'general' ? 'active' : ''}`}
              onClick={() => setTab('general')}
            >
              <Ic.User sz={13} /> Профіль
            </button>
            <button
              className={`pf-tab ${tab === 'security' ? 'active' : ''}`}
              onClick={() => setTab('security')}
            >
              <Ic.Lock sz={13} /> Безпека
            </button>
          </div>

          <div>
            {tab === 'general' && <GeneralForm user={user} onSaved={() => refresh()} />}
            {tab === 'security' && <SecurityForm onChanged={() => toast.show('Пароль змінено', 'success')} />}
          </div>

          <div className="profile-side">
            <div className="card" style={{ padding: 16 }}>
              <h4 style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Інформація
              </h4>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fg-3)' }}>ID</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{user.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fg-3)' }}>Логін</span>
                  <span>{user.username}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fg-3)' }}>Пошта</span>
                  <span style={{ fontSize: 12 }}>{user.email || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function GeneralForm({ user, onSaved }: { user: NonNullable<ReturnType<typeof useAuth>['user']>; onSaved: () => void }) {
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
          <button
            className="btn primary"
            onClick={change}
            disabled={saving || !current || !next}
          >
            {saving ? 'Зміна…' : 'Змінити пароль'}
          </button>
        </div>
      </div>
    </div>
  )
}
