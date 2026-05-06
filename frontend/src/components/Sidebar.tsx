import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { Avatar, gradientFor } from '../atoms/Avatar'
import { useAuth } from '../context/AuthContext'
import { MOD_KEY } from '../utils/shortcuts'
import { listAll } from '../api/client'
import type { Project, Notification } from '../api/types'

interface SidebarProps {
  onOpenPalette: () => void
}

interface CountState {
  bugs: number
  inbox: number
}

export function Sidebar({ onOpenPalette }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [counts, setCounts] = useState<CountState>({ bugs: 0, inbox: 0 })

  useEffect(() => {
    void (async () => {
      try {
        const [ps, ns] = await Promise.all([
          listAll<Project>('/projects/?page_size=20'),
          listAll<Notification>('/notifications/?page_size=50'),
        ])
        setProjects(ps)
        setCounts({
          bugs: ps.reduce((s, p) => s + (p.issues_count || 0), 0),
          inbox: ns.filter(n => !n.is_read).length,
        })
      } catch {
        /* мовчки — sidebar не критичний */
      }
    })()
  }, [])

  const Item = ({
    to,
    icon: Icon,
    label,
    count,
    hot,
  }: {
    to: string
    icon: typeof Ic.Bug
    label: string
    count?: number | null
    hot?: boolean
  }) => (
    <NavLink to={to} className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
      <Icon sz={15} />
      <span>{label}</span>
      {count != null && count > 0 && (
        <span
          className="sb-count"
          style={hot ? { color: 'var(--st-open-fg)', fontWeight: 500 } : undefined}
        >
          {count}
        </span>
      )}
    </NavLink>
  )

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <div className="sb-logo">B</div>
        <div className="sb-brand">
          <b>BugTracker</b>
          <span>{user ? user.username : 'Гість'}</span>
        </div>
        <Ic.ChevDown sz={14} className="sb-chev" />
      </div>

      <button className="sb-search" onClick={onOpenPalette}>
        <Ic.Search sz={13} />
        <span className="grow">Швидкий пошук…</span>
        <span className="kbd">{MOD_KEY === '⌘' ? '⌘K' : 'Ctrl+K'}</span>
      </button>

      <div className="sb-section">Робочий простір</div>
      <div className="sb-nav">
        <Item to="/dashboard" icon={Ic.Layout} label="Огляд" />
        <Item to="/bugs" icon={Ic.Bug} label="Баги" count={counts.bugs} hot={counts.bugs > 0} />
        <Item to="/tests" icon={Ic.Beaker} label="Тест-кейси" />
        <Item to="/runs" icon={Ic.Play} label="Test Runs" />
        <Item to="/sprints" icon={Ic.Calendar} label="Спринти" />
        <Item to="/reports" icon={Ic.Chart} label="Звіти" />
        <Item to="/templates" icon={Ic.Edit} label="Шаблони" />
        <Item to="/webhooks" icon={Ic.Activity} label="Webhooks" />
        <Item to="/inbox" icon={Ic.Inbox} label="Інбокс" count={counts.inbox} hot={counts.inbox > 0} />
      </div>

      {user?.is_staff && (
        <>
          <div className="sb-section">Адміністрування</div>
          <div className="sb-nav">
            <Item to="/admin/landing" icon={Ic.Settings} label="Лендінг" />
          </div>
        </>
      )}

      <div className="sb-section">
        Проєкти
        <button className="add" onClick={() => navigate('/projects/new')} title="Новий проєкт">
          <Ic.Plus sz={12} />
        </button>
      </div>
      <div className="sb-nav">
        {projects.length === 0 && (
          <div style={{ padding: '6px 8px', fontSize: 11.5, color: 'var(--fg-4)' }}>
            Ще немає проєктів
          </div>
        )}
        {projects.map(p => (
          <button
            key={p.id}
            className="sb-project"
            onClick={() => navigate(`/bugs?project=${p.id}`)}
          >
            <span className="pdot" style={{ background: gradientFor(p.id) }} />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="sb-foot">
        {user && <Avatar user={user} />}
        <div className="sb-foot-meta">
          <b>{user?.username || 'Гість'}</b>
          <span>{user?.email || '—'}</span>
        </div>
        <button
          className="btn icon ghost"
          title="Особистий кабінет"
          onClick={() => navigate('/profile')}
        >
          <Ic.Settings sz={14} />
        </button>
      </div>
    </aside>
  )
}
