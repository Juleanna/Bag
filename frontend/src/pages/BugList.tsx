import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '../atoms/Status'
import { listAll } from '../api/client'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'

type ViewMode = 'list' | 'kanban'

interface Filters {
  search: string
  status: IssueStatus | 'all'
  priority: IssuePriority | 'all'
  assignee: 'all' | 'me'
  project: number | 'all'
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год`
  return `${Math.floor(diff / 86400)} дн`
}

export function BugListPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const projectFromUrl = params.get('project')
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    priority: 'all',
    assignee: 'all',
    project: projectFromUrl ? Number(projectFromUrl) : 'all',
  })

  useEffect(() => {
    void (async () => {
      try {
        const [iss, ps] = await Promise.all([
          listAll<Issue>('/issues/?page_size=200'),
          listAll<Project>('/projects/?page_size=50'),
        ])
        setIssues(iss)
        setProjects(ps)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    return issues.filter(i => {
      if (filters.status !== 'all' && i.status !== filters.status) return false
      if (filters.priority !== 'all' && i.priority !== filters.priority) return false
      if (filters.project !== 'all' && i.project !== filters.project) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!i.title.toLowerCase().includes(q) && !i.description.toLowerCase().includes(q))
          return false
      }
      return true
    })
  }, [issues, filters])

  const projectMap = useMemo(() => {
    const m = new Map<number, Project>()
    projects.forEach(p => m.set(p.id, p))
    return m
  }, [projects])

  const memberMap = useMemo(() => {
    const m = new Map<number, UserShort>()
    projects.forEach(p => {
      if (p.owner) m.set(p.owner.id, p.owner)
      p.members?.forEach(u => m.set(u.id, u))
    })
    return m
  }, [projects])

  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 1480 }}>
        <div>
          <h1>Баги</h1>
          <div className="sub">
            {filtered.length} {filtered.length === issues.length ? '' : `з ${issues.length}`}
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => navigate('/bugs/new')}>
            <Ic.Plus sz={14} /> Новий баг
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Пошук багів…"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <Chip label="Статус" active={filters.status !== 'all'}>
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value as IssueStatus | 'all' }))}
          >
            <option value="all">всі</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Chip>
        <Chip label="Пріоритет" active={filters.priority !== 'all'}>
          <select
            value={filters.priority}
            onChange={e =>
              setFilters(f => ({ ...f, priority: e.target.value as IssuePriority | 'all' }))
            }
          >
            <option value="all">всі</option>
            {Object.entries(PRIORITY_MAP).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </Chip>
        <Chip label="Проєкт" active={filters.project !== 'all'}>
          <select
            value={filters.project}
            onChange={e =>
              setFilters(f => ({
                ...f,
                project: e.target.value === 'all' ? 'all' : Number(e.target.value),
              }))
            }
          >
            <option value="all">усі</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Chip>

        <div className="spacer" />

        <div className="seg">
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <Ic.Layout sz={11} /> Список
          </button>
          <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
            <Ic.Branch sz={11} /> Канбан
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <ListView issues={filtered} memberMap={memberMap} projectMap={projectMap} navigate={navigate} />
      ) : (
        <KanbanView issues={filtered} navigate={navigate} />
      )}
    </>
  )
}

function Chip({
  label,
  active,
  children,
}: {
  label: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <label className={`chip ${active ? 'applied' : ''}`}>
      <Ic.Filter sz={11} />
      <span>{label}:</span>
      {children}
    </label>
  )
}

function ListView({
  issues,
  memberMap,
  projectMap,
  navigate,
}: {
  issues: Issue[]
  memberMap: Map<number, UserShort>
  projectMap: Map<number, Project>
  navigate: ReturnType<typeof useNavigate>
}) {
  if (issues.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 60 }}>
        <Ic.Bug sz={36} />
        <h4>Нічого не знайдено</h4>
        <p>Спробуйте змінити фільтри або створіть перший баг</p>
      </div>
    )
  }

  return (
    <div className="tbl-wrap" style={{ padding: '0 0 24px' }}>
      <table className="table">
        <thead>
          <tr>
            <th style={{ paddingLeft: 24 }}>Баг</th>
            <th>Пріоритет</th>
            <th>Статус</th>
            <th>Проєкт</th>
            <th>Виконавець</th>
            <th className="right" style={{ paddingRight: 24 }}>
              Оновлено
            </th>
          </tr>
        </thead>
        <tbody>
          {issues.map(b => {
            const proj = projectMap.get(b.project)
            const assignee = b.assignee ? memberMap.get(b.assignee) : null
            return (
              <tr key={b.id} onClick={() => navigate(`/bugs/${b.id}`)}>
                <td style={{ paddingLeft: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="id-cell">BUG-{b.id}</span>
                    <span className="title-cell">{b.title}</span>
                  </div>
                </td>
                <td>
                  <PriorityBadge value={b.priority} />
                </td>
                <td>
                  <StatusPill value={b.status} />
                </td>
                <td className="muted">{proj?.name || '—'}</td>
                <td>
                  {assignee ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar user={assignee} />
                      <span style={{ fontSize: 12.5 }}>{assignee.username}</span>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td className="right muted" style={{ paddingRight: 24 }}>
                  {formatWhen(b.updated_at)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function KanbanView({
  issues,
  navigate,
}: {
  issues: Issue[]
  navigate: ReturnType<typeof useNavigate>
}) {
  const columns: { id: IssueStatus; label: string }[] = [
    { id: 'open', label: STATUS_MAP.open.label },
    { id: 'in_progress', label: STATUS_MAP.in_progress.label },
    { id: 'done', label: STATUS_MAP.done.label },
    { id: 'cancelled', label: STATUS_MAP.cancelled.label },
  ]

  return (
    <div className="kanban">
      {columns.map(col => {
        const list = issues.filter(i => i.status === col.id)
        return (
          <div key={col.id} className="kcol">
            <div className="kcol-head">
              <StatusPill value={col.id} />
              <span className="count">{list.length}</span>
            </div>
            <div className="kcol-list">
              {list.map(b => (
                <div key={b.id} className="kcard" onClick={() => navigate(`/bugs/${b.id}`)}>
                  <div className="id">BUG-{b.id}</div>
                  <div className="title">{b.title}</div>
                  <div className="meta">
                    <PriorityBadge value={b.priority} />
                    <div className="right">
                      {b.assignee && <Avatar user={{ id: b.assignee, username: '?', first_name: '', last_name: '' } as UserShort} />}
                    </div>
                  </div>
                </div>
              ))}
              {list.length === 0 && (
                <div style={{ padding: 12, textAlign: 'center', color: 'var(--fg-4)', fontSize: 12 }}>
                  порожньо
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
