/**
 * BugList — список задач з фільтрами, bulk-actions, saved-filters,
 * keyboard navigation (J/K/Enter), та режимом перегляду кошика (?archived=true).
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '../atoms/Status'
import { listAll, apiPost } from '../api/client'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'
import { api as extras } from '../api/extras'
import type { SavedFilter } from '../api/extras'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { useListKeyboardNav } from '../hooks/useListKeyboardNav'
import { Skeleton } from '../components/Skeleton'

type ViewMode = 'list' | 'kanban'

interface Filters {
  search: string
  status: IssueStatus | 'all'
  priority: IssuePriority | 'all'
  assignee: 'all' | 'me'
  project: number | 'all'
  archived: 'false' | 'true' | 'all'
}

const DEFAULT_FILTERS: Filters = {
  search: '',
  status: 'all',
  priority: 'all',
  assignee: 'all',
  project: 'all',
  archived: 'false',
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год`
  return `${Math.floor(diff / 86400)} дн`
}

export function BugListPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [params] = useSearchParams()
  const projectFromUrl = params.get('project')
  const archivedFromUrl = params.get('archived') === 'true' ? 'true' : 'false'
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [filters, setFilters] = useState<Filters>({
    ...DEFAULT_FILTERS,
    project: projectFromUrl ? Number(projectFromUrl) : 'all',
    archived: archivedFromUrl as 'true' | 'false',
  })

  const reload = async () => {
    setLoading(true)
    try {
      const archivedParam = filters.archived === 'true' ? '&archived=true' : ''
      const [iss, ps, sf] = await Promise.all([
        listAll<Issue>(`/issues/?page_size=200${archivedParam}`),
        listAll<Project>('/projects/?page_size=50'),
        extras.listSavedFilters().catch(() => []),
      ])
      setIssues(iss)
      setProjects(ps)
      setSavedFilters(sf)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.archived])

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

  // J/K/Enter навігація — лише якщо нічого не вибрано (інакше Enter = bulk)
  const { activeIndex, setActiveIndex } = useListKeyboardNav<Issue>({
    items: filtered,
    onOpen: it => navigate(`/bugs/${it.id}`),
    enabled: selected.size === 0,
  })

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

  const toggleSelect = (id: number) => {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(filtered.map(i => i.id)))
  }

  const clearSelection = () => setSelected(new Set())

  const bulkArchive = async () => {
    const ok = await confirm({
      title: `Архівувати ${selected.size} задач?`,
      message: 'Можна відновити з кошика.',
      confirmText: 'Архівувати',
    })
    if (!ok) return
    try {
      await extras.bulkArchive(Array.from(selected))
      toast.show(`Архівовано ${selected.size}`, 'success')
      clearSelection()
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const bulkRestore = async () => {
    try {
      await extras.bulkRestore(Array.from(selected))
      toast.show(`Відновлено ${selected.size}`, 'success')
      clearSelection()
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const bulkSetStatus = async (status: IssueStatus) => {
    try {
      await apiPost('/issues/bulk_update/', { ids: Array.from(selected), status })
      toast.show(`Оновлено ${selected.size}`, 'success')
      clearSelection()
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const saveCurrentFilter = async () => {
    const name = prompt('Назва збереженого фільтра:')
    if (!name) return
    try {
      const sf = await extras.createSavedFilter({
        name,
        params: filters as unknown as Record<string, string>,
      })
      setSavedFilters(s => [...s, sf])
      toast.show('Фільтр збережено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const applySavedFilter = (f: SavedFilter) => {
    setFilters({ ...DEFAULT_FILTERS, ...(f.params as Partial<Filters>) })
  }

  if (loading) {
    return (
      <div style={{ padding: '20px 24px', maxWidth: 1480 }}>
        <Skeleton width="200px" height="28px" />
        <div style={{ marginTop: 8 }}>
          <Skeleton width="120px" height="14px" />
        </div>
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height="40px" />
          ))}
        </div>
      </div>
    )
  }

  const isTrashMode = filters.archived === 'true'

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 1480 }}>
        <div>
          <h1>{isTrashMode ? '🗑 Кошик' : 'Баги'}</h1>
          <div className="sub">
            {filtered.length} {filtered.length === issues.length ? '' : `з ${issues.length}`}
          </div>
        </div>
        <div className="right">
          <button
            className={`btn ${isTrashMode ? 'primary' : ''}`}
            onClick={() =>
              setFilters(f => ({ ...f, archived: f.archived === 'true' ? 'false' : 'true' }))
            }
          >
            <Ic.Trash sz={13} /> {isTrashMode ? 'Активні' : 'Кошик'}
          </button>
          {!isTrashMode && (
            <button className="btn primary" onClick={() => navigate('/bugs/new')}>
              <Ic.Plus sz={14} /> Новий баг
            </button>
          )}
        </div>
      </div>

      {/* Saved filters як чіпи */}
      {savedFilters.length > 0 && !isTrashMode && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 24px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase' }}>
            Smart views:
          </span>
          {savedFilters.map(sf => (
            <button key={sf.id} className="btn sm" onClick={() => applySavedFilter(sf)}>
              <Ic.Filter sz={11} /> {sf.name}
            </button>
          ))}
        </div>
      )}

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
              <option key={k} value={k}>{v.label}</option>
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
              <option key={k} value={k}>{v.label}</option>
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
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Chip>

        <button className="btn ghost sm" onClick={saveCurrentFilter} title="Зберегти поточний фільтр">
          <Ic.Star sz={11} /> Зберегти
        </button>

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
        <ListView
          issues={filtered}
          memberMap={memberMap}
          projectMap={projectMap}
          navigate={navigate}
          selected={selected}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          activeIndex={activeIndex}
          onHover={setActiveIndex}
        />
      ) : (
        <KanbanView issues={filtered} navigate={navigate} />
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 100,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>
            Обрано: {selected.size}
          </span>
          {!isTrashMode && (
            <>
              <select
                className="btn sm"
                onChange={e => e.target.value && bulkSetStatus(e.target.value as IssueStatus)}
                value=""
              >
                <option value="">Статус…</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <button className="btn sm" onClick={bulkArchive}>
                <Ic.Trash sz={11} /> До кошика
              </button>
            </>
          )}
          {isTrashMode && (
            <button className="btn sm primary" onClick={bulkRestore}>
              <Ic.Refresh sz={11} /> Відновити
            </button>
          )}
          <button className="btn ghost sm" onClick={clearSelection}>
            <Ic.X sz={11} />
          </button>
        </div>
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

interface ListViewProps {
  issues: Issue[]
  memberMap: Map<number, UserShort>
  projectMap: Map<number, Project>
  navigate: ReturnType<typeof useNavigate>
  selected: Set<number>
  onToggleSelect: (id: number) => void
  onSelectAll: () => void
  activeIndex: number
  onHover: (i: number) => void
}

function ListView({
  issues,
  memberMap,
  projectMap,
  navigate,
  selected,
  onToggleSelect,
  onSelectAll,
  activeIndex,
  onHover,
}: ListViewProps) {
  if (issues.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 60 }}>
        <Ic.Bug sz={36} />
        <h4>Нічого не знайдено</h4>
        <p>Спробуйте змінити фільтри або створіть перший баг</p>
      </div>
    )
  }

  const allSelected = issues.length > 0 && issues.every(i => selected.has(i.id))

  return (
    <div className="tbl-wrap" style={{ padding: '0 0 24px' }}>
      <table className="table">
        <thead>
          <tr>
            <th className="checkbox-col">
              <input
                type="checkbox"
                className="cb"
                checked={allSelected}
                onChange={onSelectAll}
              />
            </th>
            <th>Баг</th>
            <th>Пріоритет</th>
            <th>Статус</th>
            <th>Проєкт</th>
            <th>Виконавець</th>
            <th className="right" style={{ paddingRight: 24 }}>Оновлено</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((b, idx) => {
            const proj = projectMap.get(b.project)
            const assignee = b.assignee ? memberMap.get(b.assignee) : null
            const isActive = activeIndex === idx
            const isSelected = selected.has(b.id)
            return (
              <tr
                key={b.id}
                onClick={() => navigate(`/bugs/${b.id}`)}
                onMouseEnter={() => onHover(idx)}
                className={`${isSelected ? 'selected' : ''} ${isActive ? 'kbd-active' : ''}`}
                style={isActive ? { boxShadow: 'inset 2px 0 0 var(--accent)' } : undefined}
              >
                <td
                  className="checkbox-col"
                  onClick={e => {
                    e.stopPropagation()
                    onToggleSelect(b.id)
                  }}
                >
                  <input
                    type="checkbox"
                    className="cb"
                    checked={isSelected}
                    onChange={() => onToggleSelect(b.id)}
                  />
                </td>
                <td>
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
