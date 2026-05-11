import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { Ic } from '../icons/Ic'
import { Avatar, gradientFor } from '../atoms/Avatar'
import { useAuth } from '../context/AuthContext'
import { MOD_KEY } from '../utils/shortcuts'
import { listAll } from '../api/client'
import type { Project, Notification } from '../api/types'

interface SidebarProps {
  onOpenPalette: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

interface CountState {
  bugs: number
  inbox: number
}

interface WorkspaceShort {
  id: number
  name: string
  color: string
  team_size?: string
}

const ACTIVE_WS_KEY = 'bt:activeWorkspace'
const COLLAPSED_SECTIONS_KEY = 'bt:sidebarSections'

type SectionKey = 'workspace' | 'admin' | 'projects'

function loadCollapsedSections(): Record<SectionKey, boolean> {
  try {
    const raw = localStorage.getItem(COLLAPSED_SECTIONS_KEY)
    if (raw) return JSON.parse(raw) as Record<SectionKey, boolean>
  } catch {
    /* ignore */
  }
  return { workspace: false, admin: false, projects: false }
}

export function Sidebar({ onOpenPalette, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceShort[]>([])
  const [activeWs, setActiveWs] = useState<number | null>(() => {
    const raw = localStorage.getItem(ACTIVE_WS_KEY)
    return raw ? Number(raw) : null
  })
  const [counts, setCounts] = useState<CountState>({ bugs: 0, inbox: 0 })
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [sectionsCollapsed, setSectionsCollapsed] = useState<Record<SectionKey, boolean>>(
    () => loadCollapsedSections()
  )

  const toggleSection = (key: SectionKey) => {
    setSectionsCollapsed(s => {
      const next = { ...s, [key]: !s[key] }
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(next))
      return next
    })
  }
  const switcherRef = useRef<HTMLDivElement>(null)

  // Закриваємо switcher при кліку поза ним
  useEffect(() => {
    if (!switcherOpen) return
    const onDoc = (e: MouseEvent) => {
      if (!switcherRef.current) return
      if (!switcherRef.current.contains(e.target as Node)) setSwitcherOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [switcherOpen])

  // Завантажуємо простори + сповіщення (одноразово при монтажі та на події змін).
  const reloadWorkspacesAndNotifs = async () => {
    try {
      const [ns, ws] = await Promise.all([
        listAll<Notification>('/notifications/?page_size=50'),
        listAll<WorkspaceShort>('/workspaces/?page_size=20').catch(
          () => [] as WorkspaceShort[]
        ),
      ])
      setWorkspaces(ws)
      const stored = localStorage.getItem(ACTIVE_WS_KEY)
      const storedId = stored ? Number(stored) : null
      if (storedId && ws.find(w => w.id === storedId)) {
        setActiveWs(storedId)
      } else if (ws[0]) {
        setActiveWs(ws[0].id)
      } else {
        setActiveWs(null)
      }
      setCounts(c => ({ ...c, inbox: ns.filter(n => !n.is_read).length }))
    } catch {
      /* мовчки */
    }
  }

  // Завантажуємо проєкти лише для активного простору.
  const reloadProjects = async (wsId: number | null) => {
    try {
      const url = wsId
        ? `/projects/?workspace=${wsId}&page_size=50`
        : '/projects/?page_size=50'
      const ps = await listAll<Project>(url)
      setProjects(ps)
      setCounts(c => ({
        ...c,
        bugs: ps.reduce((s, p) => s + (p.issues_count || 0), 0),
      }))
    } catch {
      /* мовчки */
    }
  }

  // Ref на activeWs, щоб слухачі подій бачили актуальне значення
  // (звичайне замикання у addEventListener фіксує копію з моменту useEffect).
  const activeWsRef = useRef(activeWs)
  useEffect(() => {
    activeWsRef.current = activeWs
  }, [activeWs])

  // Перший рендер + слухачі подій
  useEffect(() => {
    void reloadWorkspacesAndNotifs()
    const onWsChange = () => void reloadWorkspacesAndNotifs()
    const onProjectChange = () => void reloadProjects(activeWsRef.current)
    window.addEventListener('workspace:created', onWsChange)
    window.addEventListener('workspace:deleted', onWsChange)
    window.addEventListener('project:created', onProjectChange)
    window.addEventListener('project:deleted', onProjectChange)
    return () => {
      window.removeEventListener('workspace:created', onWsChange)
      window.removeEventListener('workspace:deleted', onWsChange)
      window.removeEventListener('project:created', onProjectChange)
      window.removeEventListener('project:deleted', onProjectChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Перезавантажуємо проєкти, коли активний простір змінюється
  useEffect(() => {
    void reloadProjects(activeWs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWs])

  // Зберігаємо активний простір
  useEffect(() => {
    if (activeWs) localStorage.setItem(ACTIVE_WS_KEY, String(activeWs))
  }, [activeWs])

  const currentWs = workspaces.find(w => w.id === activeWs) || workspaces[0]
  const teamLabel = (() => {
    if (!user) return 'Гість'
    const name =
      [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    return name
  })()

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
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sb-head" ref={switcherRef} style={{ position: 'relative' }}>
        <button
          type="button"
          className="sb-logo"
          onClick={() => setSwitcherOpen(o => !o)}
          title="Перемкнути простір"
          style={{
            border: 'none',
            cursor: 'pointer',
            background: currentWs?.color || 'var(--accent)',
          }}
        >
          {(currentWs?.name || 'B')[0].toUpperCase()}
        </button>
        <button
          type="button"
          className="sb-brand"
          onClick={() => setSwitcherOpen(o => !o)}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            textAlign: 'left',
            padding: 0,
            flex: 1,
            minWidth: 0,
          }}
        >
          <b>{currentWs?.name || 'BugTracker'}</b>
          <span>{teamLabel}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/workspaces/new')}
          title="Створити простір"
          className="sb-head-btn"
        >
          <Ic.Plus sz={14} />
        </button>

        {switcherOpen && (
          <div
            style={{
              position: 'absolute',
              // У згорнутому стані виїздимо вбік (flyout); у розгорнутому —
              // розкривається під логотипом і займає всю ширину сайдбара.
              ...(collapsed
                ? { top: 0, left: 'calc(100% + 6px)', width: 260 }
                : { top: 'calc(100% + 4px)', left: 8, right: 8 }),
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-lg)',
              padding: 6,
              zIndex: 200,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 600,
                color: 'var(--fg-3)',
                padding: '6px 8px 4px',
              }}
            >
              Простори
            </div>
            {workspaces.length === 0 ? (
              <div
                style={{
                  padding: '10px 8px',
                  fontSize: 12,
                  color: 'var(--fg-3)',
                }}
              >
                Ще немає просторів
              </div>
            ) : (
              workspaces.map(w => {
                const isActive = w.id === activeWs
                return (
                  <div
                    key={w.id}
                    className="sb-ws-row"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 6,
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveWs(w.id)
                        setSwitcherOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 8px',
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 13,
                        color: 'var(--fg)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: w.color || 'var(--accent)',
                          color: 'white',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {w.name[0].toUpperCase()}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {w.name}
                      </span>
                      {isActive && <Ic.Check sz={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSwitcherOpen(false)
                        navigate(`/workspaces/${w.id}/edit`)
                      }}
                      title="Редагувати простір"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        padding: '6px 8px',
                        color: 'var(--fg-3)',
                        borderRadius: 6,
                      }}
                    >
                      <Ic.Edit sz={11} />
                    </button>
                  </div>
                )
              })
            )}
            <div
              style={{
                borderTop: '1px solid var(--divider)',
                marginTop: 4,
                paddingTop: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setSwitcherOpen(false)
                  navigate('/workspaces/new')
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 8px',
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: 'var(--fg-2)',
                }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.background = 'var(--bg-2)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.background = 'transparent')
                }
              >
                <Ic.Plus sz={12} /> Новий простір
              </button>
            </div>
          </div>
        )}
      </div>

      <button className="sb-search" onClick={onOpenPalette}>
        <Ic.Search sz={13} />
        <span className="grow">Швидкий пошук…</span>
        <span className="kbd">{MOD_KEY === '⌘' ? '⌘K' : 'Ctrl+K'}</span>
      </button>

      <button
        type="button"
        className="sb-section sb-section-toggle"
        onClick={() => toggleSection('workspace')}
      >
        <Ic.Chev
          sz={10}
          className={`sb-section-chev ${sectionsCollapsed.workspace ? '' : 'open'}`}
        />
        <span className="sb-section-label">Робочий простір</span>
      </button>
      {!sectionsCollapsed.workspace && (
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
      )}

      {user?.is_staff && (
        <>
          <button
            type="button"
            className="sb-section sb-section-toggle"
            onClick={() => toggleSection('admin')}
          >
            <Ic.Chev
              sz={10}
              className={`sb-section-chev ${sectionsCollapsed.admin ? '' : 'open'}`}
            />
            <span className="sb-section-label">Адміністрування</span>
          </button>
          {!sectionsCollapsed.admin && (
            <div className="sb-nav">
              <Item to="/admin/landing" icon={Ic.Settings} label="Лендінг" />
              <Item to="/admin/regions" icon={Ic.Globe} label="Регіони даних" />
            </div>
          )}
        </>
      )}

      <div className="sb-section sb-section-toggle">
        <button
          type="button"
          className="sb-section-btn"
          onClick={() => toggleSection('projects')}
        >
          <Ic.Chev
            sz={10}
            className={`sb-section-chev ${sectionsCollapsed.projects ? '' : 'open'}`}
          />
          <span className="sb-section-label">Проєкти</span>
        </button>
        <button
          className="add"
          onClick={() => navigate('/projects/archive')}
          title="Архів проєктів"
        >
          <Ic.Trash sz={12} />
        </button>
        <button
          className="add"
          onClick={() => navigate('/projects/new')}
          title={
            workspaces.length === 0
              ? 'Спершу створіть простір'
              : 'Новий проєкт'
          }
          disabled={workspaces.length === 0}
          style={
            workspaces.length === 0
              ? { opacity: 0.4, cursor: 'not-allowed' }
              : undefined
          }
        >
          <Ic.Plus sz={12} />
        </button>
      </div>
      {!sectionsCollapsed.projects && (
      <div className="sb-nav">
        {projects.length === 0 && (
          <div style={{ padding: '6px 8px', fontSize: 11.5, color: 'var(--fg-4)' }}>
            Ще немає проєктів
          </div>
        )}
        {projects.map(p => (
          <div key={p.id} className="sb-project-row">
            <button
              className="sb-project"
              onClick={() => navigate(`/bugs?project=${p.id}`)}
              style={{ flex: 1 }}
            >
              <span className="pdot" style={{ background: p.color || gradientFor(p.id) }} />
              <span>{p.name}</span>
            </button>
            <button
              type="button"
              className="sb-project-edit"
              onClick={e => {
                e.stopPropagation()
                navigate(`/projects/${p.id}/edit`)
              }}
              title="Редагувати проєкт"
            >
              <Ic.Edit sz={11} />
            </button>
          </div>
        ))}
      </div>
      )}

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

      {onToggleCollapsed && (
        <button
          className="sb-collapse-bar"
          type="button"
          onClick={onToggleCollapsed}
          title={collapsed ? 'Розгорнути сайдбар ([)' : 'Згорнути сайдбар ([)'}
        >
          <Ic.Chev
            sz={12}
            style={{
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.15s',
            }}
          />
          {!collapsed && <span>Згорнути</span>}
        </button>
      )}
    </aside>
  )
}
