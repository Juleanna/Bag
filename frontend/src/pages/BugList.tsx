/**
 * BugList — список задач за макетом прототипу:
 *  - заголовок з лічильником, експортом CSV та "Новий баг" (kbd: C)
 *  - filter bar: search, applied-filter chips, "+ Фільтр" dropdown,
 *    перемикач Таблиця/Канбан, Сорт, Колонки
 *  - bulk-actions, saved-filters, keyboard navigation (J/K/Enter),
 *    режим перегляду кошика (?archived=true)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '../atoms/Status'
import { listAll, apiPost, apiPatch } from '../api/client'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'
import { api as extras } from '../api/extras'
import type { SavedFilter } from '../api/extras'
import { useToast } from '../context/ToastContext'
import { useConfirm, usePrompt } from '../context/ConfirmContext'
import { useListKeyboardNav } from '../hooks/useListKeyboardNav'
import { Skeleton } from '../components/Skeleton'
import { displayName } from '../utils/user'

type ViewMode = 'list' | 'kanban'
type SortKey = 'updated' | 'created' | 'priority' | 'status' | 'id'

const SORT_LABELS: Record<SortKey, string> = {
  updated: 'оновленням',
  created: 'створенням',
  priority: 'пріоритетом',
  status: 'статусом',
  id: 'ID',
}

const ALL_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Тайтл' },
  { key: 'priority', label: 'Пріоритет' },
  { key: 'status', label: 'Статус' },
  { key: 'project', label: 'Проєкт' },
  { key: 'assignee', label: 'Виконавець' },
  { key: 'updated', label: 'Оновлено' },
] as const
type ColumnKey = (typeof ALL_COLUMNS)[number]['key']
const DEFAULT_COLUMNS: ColumnKey[] = ['id', 'title', 'priority', 'status', 'project', 'assignee', 'updated']

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
  const prompt = usePrompt()
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
  const [sortKey, setSortKey] = useState<SortKey>('updated')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [columns, setColumns] = useState<ColumnKey[]>(() => {
    try {
      const raw = localStorage.getItem('bt:bugs:columns')
      if (raw) {
        const parsed = JSON.parse(raw) as ColumnKey[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_COLUMNS
  })
  const [openMenu, setOpenMenu] = useState<'filter' | 'sort' | 'columns' | null>(null)
  const menuRootRef = useRef<HTMLDivElement>(null)

  // Закриваємо dropdown при кліку поза його межами
  useEffect(() => {
    if (!openMenu) return
    const onDoc = (e: MouseEvent) => {
      if (!menuRootRef.current) return
      if (!menuRootRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openMenu])

  // Зберігаємо вибрані колонки
  useEffect(() => {
    localStorage.setItem('bt:bugs:columns', JSON.stringify(columns))
  }, [columns])

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
    const filteredArr = issues.filter(i => {
      if (filters.status !== 'all' && i.status !== filters.status) return false
      if (filters.priority !== 'all' && i.priority !== filters.priority) return false
      if (filters.project !== 'all' && i.project !== filters.project) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !i.title.toLowerCase().includes(q) &&
          !i.description.toLowerCase().includes(q) &&
          !String(i.id).includes(q)
        )
          return false
      }
      return true
    })
    // Сортування
    const priOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    const statusOrder: Record<string, number> = { open: 0, in_progress: 1, done: 2, cancelled: 3 }
    const dir = sortDir === 'desc' ? -1 : 1
    filteredArr.sort((a, b) => {
      let r = 0
      switch (sortKey) {
        case 'updated':
          r = a.updated_at.localeCompare(b.updated_at)
          break
        case 'created':
          r = a.created_at.localeCompare(b.created_at)
          break
        case 'priority':
          r = (priOrder[a.priority] ?? 99) - (priOrder[b.priority] ?? 99)
          break
        case 'status':
          r = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)
          break
        case 'id':
          r = a.id - b.id
          break
      }
      return r * dir
    })
    return filteredArr
  }, [issues, filters, sortKey, sortDir])

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

  // Експорт відфільтрованого списку у CSV
  const exportCSV = () => {
    const headers = ['ID', 'Тайтл', 'Статус', 'Пріоритет', 'Проєкт', 'Виконавець', 'Створено', 'Оновлено']
    const rows = filtered.map(i => [
      `BUG-${i.id}`,
      i.title,
      STATUS_MAP[i.status]?.label || i.status,
      PRIORITY_MAP[i.priority]?.label || i.priority,
      projectMap.get(i.project)?.name || '',
      i.assignee ? (() => { const m = memberMap.get(i.assignee!); return m ? displayName(m) : '' })() : '',
      i.created_at,
      i.updated_at,
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bugs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Кількість відкритих (для підзаголовка)
  const openCount = useMemo(
    () => filtered.filter(i => i.status === 'open' || i.status === 'in_progress').length,
    [filtered]
  )

  const toggleColumn = (k: ColumnKey) => {
    setColumns(cs => (cs.includes(k) ? cs.filter(x => x !== k) : [...cs, k]))
  }

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
    const name = await prompt({
      title: 'Зберегти smart view',
      message: 'Назва збереженого фільтра:',
      placeholder: 'Наприклад: «Мої критичні»',
      confirmText: 'Зберегти',
      required: true,
    })
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

  const renameSavedFilter = async (f: SavedFilter) => {
    const name = await prompt({
      title: 'Перейменувати smart view',
      message: 'Нова назва:',
      defaultValue: f.name,
      confirmText: 'Зберегти',
      required: true,
    })
    if (!name || name === f.name) return
    try {
      const updated = await extras.updateSavedFilter(f.id, { name })
      setSavedFilters(s => s.map(x => (x.id === f.id ? updated : x)))
      toast.show('Перейменовано', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const deleteSavedFilter = async (f: SavedFilter) => {
    const ok = await confirm({
      title: `Видалити smart view «${f.name}»?`,
      message: 'Збережений фільтр буде видалено. Це не вплине на самі задачі.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.deleteSavedFilter(f.id)
      setSavedFilters(s => s.filter(x => x.id !== f.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
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
  const projectName =
    filters.project !== 'all' ? projectMap.get(filters.project as number)?.name : null
  const appliedChips: { key: keyof Filters; label: string; value: string }[] = []
  if (filters.status !== 'all') {
    appliedChips.push({
      key: 'status',
      label: 'Статус',
      value: STATUS_MAP[filters.status]?.label || filters.status,
    })
  }
  if (filters.priority !== 'all') {
    appliedChips.push({
      key: 'priority',
      label: 'Пріоритет',
      value: PRIORITY_MAP[filters.priority]?.label || filters.priority,
    })
  }
  if (filters.project !== 'all') {
    appliedChips.push({
      key: 'project',
      label: 'Проєкт',
      value: projectName || `#${filters.project}`,
    })
  }
  const removeFilter = (key: keyof Filters) => {
    setFilters(f => ({ ...f, [key]: 'all' }))
  }

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 'unset' }}>
        <div>
          <h1>{isTrashMode ? '🗑 Кошик' : 'Баги'}</h1>
          <div className="sub">
            {isTrashMode
              ? `${filtered.length} в кошику`
              : `${openCount} відкритих · сортовано за ${SORT_LABELS[sortKey]}`}
          </div>
        </div>
        <div className="right">
          <button
            className={`btn ${isTrashMode ? 'primary' : ''}`}
            onClick={() =>
              setFilters(f => ({ ...f, archived: f.archived === 'true' ? 'false' : 'true' }))
            }
            title={isTrashMode ? 'Повернутись до активних' : 'Перейти в кошик'}
          >
            {isTrashMode ? (
              <>
                <Ic.Bug sz={13} /> Активні
              </>
            ) : (
              <>
                <Ic.Trash sz={13} /> Кошик
              </>
            )}
          </button>
          <button className="btn" onClick={exportCSV} disabled={filtered.length === 0}>
            <Ic.Download sz={13} /> Експорт CSV
          </button>
          {!isTrashMode && (
            <button className="btn primary" onClick={() => navigate('/bugs/new')}>
              <Ic.Plus sz={14} /> Новий баг{' '}
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
          )}
        </div>
      </div>

      {/* Saved filters як чіпи з hover-actions для редагування/видалення */}
      {savedFilters.length > 0 && !isTrashMode && (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 24px 0',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase' }}>
            Smart views:
          </span>
          {savedFilters.map(sf => (
            <div key={sf.id} className="smart-view-chip">
              <button
                type="button"
                className="smart-view-apply"
                onClick={() => applySavedFilter(sf)}
                title="Застосувати фільтр"
              >
                <Ic.Filter sz={11} />
                <span>{sf.name}</span>
              </button>
              <button
                type="button"
                className="smart-view-action"
                onClick={() => renameSavedFilter(sf)}
                title="Перейменувати"
              >
                <Ic.Edit sz={10} />
              </button>
              <button
                type="button"
                className="smart-view-action"
                onClick={() => deleteSavedFilter(sf)}
                title="Видалити"
              >
                <Ic.X sz={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="filters" ref={menuRootRef}>
        <input
          className="search-input"
          placeholder="Пошук за ID, тайтлом, тегами…"
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />

        {appliedChips.map(c => (
          <button
            key={c.key}
            type="button"
            className="chip applied"
            onClick={() => removeFilter(c.key)}
            title="Натисніть, щоб скинути"
          >
            <span style={{ color: 'var(--fg-3)' }}>{c.label}:</span>
            <span className="v" style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>
              {c.value}
            </span>
            <Ic.X sz={11} />
          </button>
        ))}

        {/* Dropdown «+ Фільтр» */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="chip"
            onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')}
          >
            <Ic.Plus sz={11} /> Фільтр
          </button>
          {openMenu === 'filter' && (
            <DropdownMenu>
              <DropdownLabel>Статус</DropdownLabel>
              <select
                className="inp"
                value={filters.status}
                onChange={e => {
                  setFilters(f => ({ ...f, status: e.target.value as IssueStatus | 'all' }))
                  setOpenMenu(null)
                }}
              >
                <option value="all">— всі —</option>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <DropdownLabel>Пріоритет</DropdownLabel>
              <select
                className="inp"
                value={filters.priority}
                onChange={e => {
                  setFilters(f => ({
                    ...f,
                    priority: e.target.value as IssuePriority | 'all',
                  }))
                  setOpenMenu(null)
                }}
              >
                <option value="all">— всі —</option>
                {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <DropdownLabel>Проєкт</DropdownLabel>
              <select
                className="inp"
                value={filters.project}
                onChange={e => {
                  setFilters(f => ({
                    ...f,
                    project: e.target.value === 'all' ? 'all' : Number(e.target.value),
                  }))
                  setOpenMenu(null)
                }}
              >
                <option value="all">— усі —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div style={{ borderTop: '1px solid var(--divider)', marginTop: 8, paddingTop: 8 }}>
                <button
                  type="button"
                  className="btn sm ghost"
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                  onClick={() => {
                    saveCurrentFilter()
                    setOpenMenu(null)
                  }}
                >
                  <Ic.Star sz={11} /> Зберегти як smart view
                </button>
              </div>
            </DropdownMenu>
          )}
        </div>

        <div className="spacer" />

        <div className="seg">
          <button
            type="button"
            className={view === 'list' ? 'active' : ''}
            onClick={() => setView('list')}
          >
            <Ic.Sort sz={12} /> Таблиця
          </button>
          <button
            type="button"
            className={view === 'kanban' ? 'active' : ''}
            onClick={() => setView('kanban')}
          >
            <Ic.Layout sz={12} /> Канбан
          </button>
        </div>

        {/* Сорт */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
          >
            <Ic.Sort sz={12} /> Сорт <Ic.ChevDown sz={11} />
          </button>
          {openMenu === 'sort' && (
            <DropdownMenu>
              <DropdownLabel>Сортувати за</DropdownLabel>
              {(Object.keys(SORT_LABELS) as SortKey[]).map(k => (
                <button
                  type="button"
                  key={k}
                  className={`drop-item ${sortKey === k ? 'active' : ''}`}
                  onClick={() => {
                    setSortKey(k)
                    setOpenMenu(null)
                  }}
                >
                  {SORT_LABELS[k]}
                  {sortKey === k && <Ic.Check sz={11} style={{ marginLeft: 'auto' }} />}
                </button>
              ))}
              <div style={{ borderTop: '1px solid var(--divider)', marginTop: 6, paddingTop: 6 }}>
                <button
                  type="button"
                  className="drop-item"
                  onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
                >
                  Напрямок: {sortDir === 'desc' ? '↓ спадання' : '↑ зростання'}
                </button>
              </div>
            </DropdownMenu>
          )}
        </div>

        {/* Колонки */}
        {view === 'list' && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn sm"
              onClick={() => setOpenMenu(openMenu === 'columns' ? null : 'columns')}
            >
              <Ic.Eye sz={12} /> Колонки
            </button>
            {openMenu === 'columns' && (
              <DropdownMenu>
                <DropdownLabel>Видимі колонки</DropdownLabel>
                {ALL_COLUMNS.map(c => (
                  <label key={c.key} className="drop-item" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="cb"
                      checked={columns.includes(c.key)}
                      onChange={() => toggleColumn(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
                <div style={{ borderTop: '1px solid var(--divider)', marginTop: 6, paddingTop: 6 }}>
                  <button
                    type="button"
                    className="btn sm ghost"
                    style={{ width: '100%' }}
                    onClick={() => setColumns([...DEFAULT_COLUMNS])}
                  >
                    Скинути
                  </button>
                </div>
              </DropdownMenu>
            )}
          </div>
        )}
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
          columns={columns}
        />
      ) : (
        <KanbanView issues={filtered} navigate={navigate} onReload={reload} />
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

function DropdownMenu({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        minWidth: 220,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-lg)',
        padding: 8,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {children}
    </div>
  )
}

function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 600,
        color: 'var(--fg-3)',
        padding: '4px 6px 2px',
      }}
    >
      {children}
    </div>
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
  columns: ColumnKey[]
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
  columns,
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
  const headerLabel: Record<ColumnKey, string> = {
    id: 'ID',
    title: 'Тайтл',
    priority: 'Пріоритет',
    status: 'Статус',
    project: 'Проєкт',
    assignee: 'Виконавець',
    updated: 'Оновлено',
  }

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
            {ALL_COLUMNS.filter(c => columns.includes(c.key)).map(c => (
              <th
                key={c.key}
                className={c.key === 'updated' ? 'right' : ''}
                style={c.key === 'updated' ? { paddingRight: 24 } : undefined}
              >
                {headerLabel[c.key]}
              </th>
            ))}
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
                {columns.includes('id') && <td className="id-cell">BUG-{b.id}</td>}
                {columns.includes('title') && (
                  <td>
                    <span className="title-cell">{b.title}</span>
                  </td>
                )}
                {columns.includes('priority') && (
                  <td>
                    <PriorityBadge value={b.priority} />
                  </td>
                )}
                {columns.includes('status') && (
                  <td>
                    <StatusPill
                      value={b.status}
                      label={b.status_display}
                      color={b.status_color}
                    />
                  </td>
                )}
                {columns.includes('project') && <td className="muted">{proj?.name || '—'}</td>}
                {columns.includes('assignee') && (
                  <td>
                    {assignee ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Avatar user={assignee} />
                        <span style={{ fontSize: 12.5 }}>{displayName(assignee)}</span>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
                {columns.includes('updated') && (
                  <td className="right muted" style={{ paddingRight: 24 }}>
                    {formatWhen(b.updated_at)}
                  </td>
                )}
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
  onReload,
}: {
  issues: Issue[]
  navigate: ReturnType<typeof useNavigate>
  onReload: () => Promise<void> | void
}) {
  const toast = useToast()
  const [dragId, setDragId] = useState<number | null>(null)
  const [hoverCol, setHoverCol] = useState<string | null>(null)

  // Канбан-колонки: групуємо по status (legacy key), але запам'ятовуємо
  // workflow_status id для PATCH — щоб працювало і для кастомних статусів,
  // ключі яких відсутні у Issue.Status.choices (інакше PATCH видасть 400).
  const columnsMap = new Map<
    string,
    { label: string; color: string; wsId: number | null }
  >()
  for (const i of issues) {
    const existing = columnsMap.get(i.status)
    if (!existing) {
      columnsMap.set(i.status, {
        label: i.status_display || (STATUS_MAP[i.status]?.label ?? i.status),
        color: i.status_color || STATUS_MAP[i.status]?.dot || 'var(--st-open-dot)',
        wsId: i.workflow_status ?? null,
      })
    } else if (existing.wsId === null && i.workflow_status) {
      existing.wsId = i.workflow_status
    }
  }
  if (columnsMap.size === 0) {
    for (const k of ['open', 'in_progress', 'done', 'cancelled']) {
      columnsMap.set(k, {
        label: STATUS_MAP[k].label,
        color: STATUS_MAP[k].dot,
        wsId: null,
      })
    }
  }
  const columns = Array.from(columnsMap.entries()).map(([id, meta]) => ({
    id,
    label: meta.label,
    color: meta.color,
    wsId: meta.wsId,
  }))

  const handleDrop = async (
    col: { id: string; wsId: number | null }
  ) => {
    const issueId = dragId
    setDragId(null)
    setHoverCol(null)
    if (!issueId) return
    const issue = issues.find(i => i.id === issueId)
    if (!issue) return
    // Якщо вже у цій колонці — нічого не робимо
    if (issue.status === col.id) return
    // Для кастомних статусів (key не з default choices) шлемо workflow_status id;
    // для дефолтних — старий status key (бекенд сам резолвить).
    const DEFAULT_KEYS = new Set(['open', 'in_progress', 'done', 'cancelled'])
    const payload: Partial<Issue> = DEFAULT_KEYS.has(col.id)
      ? ({ status: col.id } as Partial<Issue>)
      : col.wsId
        ? ({ workflow_status: col.wsId } as Partial<Issue>)
        : ({ status: col.id } as Partial<Issue>)
    try {
      await apiPatch<Issue>(`/issues/${issueId}/`, payload)
      toast.show(`BUG-${issueId} → ${col.id}`, 'success')
      void onReload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не вдалося перенести', 'error')
    }
  }

  return (
    <div className="kanban">
      {columns.map(col => {
        const list = issues.filter(i => i.status === col.id)
        const isHover = hoverCol === col.id && dragId !== null
        return (
          <div key={col.id} className="kcol">
            <div className="kcol-head">
              <StatusPill value={col.id} label={col.label} color={col.color} />
              <span className="count">{list.length}</span>
            </div>
            <div
              className="kcol-list"
              onDragOver={e => {
                if (dragId === null) return
                e.preventDefault()
                if (hoverCol !== col.id) setHoverCol(col.id)
              }}
              onDragLeave={() => {
                if (hoverCol === col.id) setHoverCol(null)
              }}
              onDrop={() => handleDrop(col)}
              style={
                isHover
                  ? {
                      background: 'var(--accent-soft)',
                      outline: '2px dashed var(--accent)',
                      outlineOffset: -2,
                      borderRadius: 8,
                    }
                  : undefined
              }
            >
              {list.map(b => (
                <div
                  key={b.id}
                  className="kcard"
                  draggable
                  onDragStart={() => setDragId(b.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setHoverCol(null)
                  }}
                  onClick={() => navigate(`/bugs/${b.id}`)}
                  style={{
                    cursor: 'grab',
                    opacity: dragId === b.id ? 0.4 : 1,
                  }}
                >
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
