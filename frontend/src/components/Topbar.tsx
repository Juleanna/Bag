import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { MOD_KEY } from '../utils/shortcuts'

interface Crumb {
  icon?: typeof Ic.Bug
  label: string
  to?: string
  mono?: boolean
}

const ROUTE_CRUMBS: Record<string, Crumb[]> = {
  '/dashboard': [{ icon: Ic.Layout, label: 'Огляд' }],
  '/bugs': [{ icon: Ic.Bug, label: 'Баги' }],
  '/tests': [{ icon: Ic.Beaker, label: 'Тест-кейси' }],
  '/runs': [{ icon: Ic.Play, label: 'Test Runs' }],
  '/reports': [{ icon: Ic.Chart, label: 'Звіти' }],
  '/inbox': [{ icon: Ic.Inbox, label: 'Інбокс' }],
  '/profile': [{ icon: Ic.User, label: 'Особистий кабінет' }],
  '/bugs/new': [
    { icon: Ic.Bug, label: 'Баги', to: '/bugs' },
    { label: 'Новий' },
  ],
  '/projects/new': [
    { icon: Ic.Layout, label: 'Проєкти', to: '/dashboard' },
    { label: 'Новий' },
  ],
}

function buildCrumbs(pathname: string): Crumb[] {
  if (ROUTE_CRUMBS[pathname]) return ROUTE_CRUMBS[pathname]
  // /bugs/123 → деталь
  const bugDetail = pathname.match(/^\/bugs\/(\d+)$/)
  if (bugDetail) {
    return [
      { icon: Ic.Bug, label: 'Баги', to: '/bugs' },
      { label: `BUG-${bugDetail[1]}`, mono: true },
    ]
  }
  return []
}

interface TopbarProps {
  onOpenNotif: () => void
  onOpenHelp: () => void
  onOpenPalette: () => void
}

export function Topbar({ onOpenNotif, onOpenHelp, onOpenPalette }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const confirm = useConfirm()
  const crumbs = buildCrumbs(location.pathname)
  const [createOpen, setCreateOpen] = useState(false)

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Вийти з акаунту?',
      message: 'Будь-який незбережений ввід може бути втрачений.',
      confirmText: 'Вийти',
    })
    if (!ok) return
    await logout()
    navigate('/login')
  }

  return (
    <div className="topbar">
      <div className="tb-crumbs">
        <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />
          BugTracker
        </span>
        <span className="sep">/</span>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {i > 0 && <span className="sep">/</span>}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                cursor: c.to ? 'pointer' : 'default',
                fontFamily: c.mono ? 'var(--font-mono)' : 'inherit',
                fontSize: c.mono ? 12.5 : 13,
              }}
              onClick={() => c.to && navigate(c.to)}
            >
              {c.icon && <c.icon sz={13} />}
              {i === crumbs.length - 1 ? <b>{c.label}</b> : <span>{c.label}</span>}
            </span>
          </span>
        ))}
      </div>

      <div className="tb-actions">
        <button
          className="btn ghost icon"
          title="Сповіщення"
          onClick={onOpenNotif}
          style={{ position: 'relative' }}
        >
          <Ic.Bell sz={14} />
        </button>
        <button
          className="btn ghost icon"
          title={MOD_KEY === '⌘' ? 'Пошук (⌘K)' : 'Пошук (Ctrl+K)'}
          onClick={onOpenPalette}
        >
          <Ic.Search sz={14} />
        </button>
        <button className="btn ghost icon" title="Допомога (?)" onClick={onOpenHelp}>
          <Ic.Help sz={14} />
        </button>
        <button className="btn ghost icon" title="Вийти" onClick={handleLogout}>
          <Ic.LogOut sz={14} />
        </button>

        <div style={{ position: 'relative' }}>
          <button className="btn primary" onClick={() => setCreateOpen(o => !o)}>
            <Ic.Plus sz={13} /> Створити
            <span
              className="kbd"
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderColor: 'transparent',
                color: 'rgba(255,255,255,0.85)',
              }}
            >
              C
            </span>
          </button>
          {createOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                onClick={() => setCreateOpen(false)}
              />
              <div className="create-menu">
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/bugs/new')
                  }}
                >
                  <span
                    className="cm-ico"
                    style={{ background: 'var(--st-open-bg)', color: 'var(--st-open-fg)' }}
                  >
                    <Ic.Bug sz={13} />
                  </span>
                  <div>
                    <b>Новий баг</b>
                    <span>Зафіксувати дефект</span>
                  </div>
                  <span className="kbd">C</span>
                </button>
                <div className="cm-sep" />
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/projects/new')
                  }}
                >
                  <span
                    className="cm-ico"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}
                  >
                    <Ic.Layout sz={13} />
                  </span>
                  <div>
                    <b>Проєкт</b>
                    <span>QA-простір з багами і тестами</span>
                  </div>
                </button>
                <div className="cm-sep" />
                <button
                  onClick={() => {
                    setCreateOpen(false)
                    navigate('/workspaces/new')
                  }}
                >
                  <span
                    className="cm-ico"
                    style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}
                  >
                    <Ic.Plus sz={13} />
                  </span>
                  <div>
                    <b>Простір</b>
                    <span>Окрема організація</span>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
