/**
 * Sprints — сторінка спринтів за прототипом.
 *
 * Структура:
 *  - Таби: Активний / Планування / Завершені
 *  - Фільтри: проєкт + (плейсхолдер) «Уся команда»
 *  - Дії: «Календар» (плейсхолдер) + «+ Новий спринт» → /sprints/new
 *  - Великий блок поточного активного спринту: метрики, burndown,
 *    розподіл за пріоритетом, дошка спринту (4 колонки за legacy status).
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { api as extras } from '../api/extras'
import type { Sprint } from '../api/extras'
import type { Issue, Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { PriorityBadge, StatusPill } from '../atoms/Status'

type TabKey = 'active' | 'planning' | 'completed'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysLeft(endIso: string): number {
  const end = new Date(endIso)
  const diff = (end.getTime() - Date.now()) / 86400000
  return Math.max(0, Math.ceil(diff))
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function categorize(s: Sprint): TabKey {
  const today = todayISO()
  if (s.is_active && s.starts_at <= today && s.ends_at >= today) return 'active'
  if (s.starts_at > today) return 'planning'
  return 'completed'
}

export function SprintsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabKey>('active')

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps[0]) setProjectId(ps[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      extras.listSprints(projectId).catch(() => [] as Sprint[]),
      listAll<Issue>(`/issues/?project=${projectId}&page_size=200`).catch(() => [] as Issue[]),
    ])
      .then(([sl, il]) => {
        setSprints(sl)
        setIssues(il)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const filteredSprints = sprints.filter(s => categorize(s) === tab)
  const activeSprint = sprints.find(s => categorize(s) === 'active') || null
  const focusedSprint = tab === 'active' ? activeSprint : filteredSprints[0] || null

  const sprintIssues = useMemo(
    () => (focusedSprint ? issues.filter(i => i.sprint === focusedSprint.id) : []),
    [issues, focusedSprint],
  )
  const sprintDone = sprintIssues.filter(
    i => i.status === 'done' || i.status === 'cancelled',
  ).length
  const sprintProgress = sprintIssues.length === 0
    ? 0
    : Math.round((sprintDone / sprintIssues.length) * 100)

  const removeSprint = async (s: Sprint) => {
    const ok = await confirm({
      title: `Видалити спринт «${s.name}»?`,
      message: 'Задачі спринта не видалятимуться, лише відвʼязуються.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.deleteSprint(s.id)
      setSprints(sl => sl.filter(x => x.id !== s.id))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const completeSprint = async (s: Sprint) => {
    const ok = await confirm({
      title: `Завершити спринт «${s.name}»?`,
      message: 'Спринт буде позначено неактивним. Незакриті задачі лишаться відвʼязаними.',
      confirmText: 'Завершити',
    })
    if (!ok) return
    try {
      const updated = await extras.updateSprint(s.id, { is_active: false })
      setSprints(sl => sl.map(x => (x.id === s.id ? updated : x)))
      toast.show('Спринт завершено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="sprint-tabs">
          {(
            [
              { k: 'active', label: 'Активний' },
              { k: 'planning', label: 'Планування' },
              { k: 'completed', label: 'Завершені' },
            ] as { k: TabKey; label: string }[]
          ).map(o => (
            <button
              key={o.k}
              className={`sprint-tab ${tab === o.k ? 'active' : ''}`}
              onClick={() => setTab(o.k)}
            >
              {o.label}
            </button>
          ))}
          <select
            className="inp sprint-proj"
            value={projectId ?? ''}
            onChange={e => setProjectId(Number(e.target.value))}
            title="Проєкт"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="right" style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn primary"
            onClick={() => navigate('/sprints/new')}
          >
            <Ic.Plus sz={13} /> Новий спринт
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={200} />
          <Skeleton height={300} />
        </div>
      ) : !focusedSprint ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Calendar sz={36} />
          <h4>
            {tab === 'active'
              ? 'Немає активного спринту'
              : tab === 'planning'
                ? 'Немає запланованих'
                : 'Немає завершених'}
          </h4>
          <p>
            {tab === 'active'
              ? 'Створіть новий спринт або запустіть запланований'
              : tab === 'planning'
                ? 'Запланувати майбутню ітерацію'
                : 'Завершені спринти зʼявляться тут після завершення'}
          </p>
          <button
            className="btn primary"
            style={{ marginTop: 12 }}
            onClick={() => navigate('/sprints/new')}
          >
            <Ic.Plus sz={13} /> Новий спринт
          </button>
        </div>
      ) : (
        <SprintDetail
          sprint={focusedSprint}
          issues={sprintIssues}
          progress={sprintProgress}
          done={sprintDone}
          onEdit={() => toast.show('Редагування у плані', 'info')}
          onComplete={() => completeSprint(focusedSprint)}
          onDelete={() => removeSprint(focusedSprint)}
          onOpenBugs={() => navigate(`/bugs?sprint=${focusedSprint.id}`)}
        />
      )}
    </div>
  )
}

function SprintDetail({
  sprint,
  issues,
  progress,
  done,
  onEdit,
  onComplete,
  onDelete,
  onOpenBugs,
}: {
  sprint: Sprint
  issues: Issue[]
  progress: number
  done: number
  onEdit: () => void
  onComplete: () => void
  onDelete: () => void
  onOpenBugs: () => void
}) {
  const remaining = daysLeft(sprint.ends_at)
  const cat = categorize(sprint)
  const byPriority = useMemo(() => {
    const map: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const i of issues) {
      if (i.priority in map) map[i.priority]++
    }
    return map
  }, [issues])
  // 4 колонки за legacy status — як у прототипі: Очікує / У роботі / На ревʼю / Готово
  const columns = useMemo(
    () => [
      { key: 'open', label: 'Очікує', issues: issues.filter(i => i.status === 'open') },
      { key: 'in_progress', label: 'У роботі', issues: issues.filter(i => i.status === 'in_progress') },
      { key: 'review', label: 'На ревʼю', issues: issues.filter(i => i.status === 'review' || i.status === 'blocked') },
      { key: 'done', label: 'Готово', issues: issues.filter(i => i.status === 'done' || i.status === 'cancelled') },
    ],
    [issues],
  )

  return (
    <>
      <div className="sprint-head">
        <div>
          <h2 style={{ margin: 0 }}>{sprint.name}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            {formatDateShort(sprint.starts_at)} — {formatDateShort(sprint.ends_at)}
            {cat === 'active' && (
              <>
                {' · '}
                <b style={{ color: 'var(--pri-high)' }}>залишилось {remaining} днів</b>
              </>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={onEdit}>
            <Ic.Edit sz={12} /> Редагувати
          </button>
          {cat === 'active' ? (
            <button className="btn" onClick={onComplete}>
              <Ic.Check sz={12} /> Завершити спринт
            </button>
          ) : (
            <button className="btn" onClick={onDelete} title="Видалити">
              <Ic.Trash sz={12} /> Видалити
            </button>
          )}
        </div>
      </div>

      {sprint.goal && (
        <div className="sprint-goal">
          <div className="lbl">
            <Ic.Flag sz={11} /> ЦІЛЬ СПРИНТУ
          </div>
          <p>{sprint.goal}</p>
        </div>
      )}

      <div className="sprint-metrics">
        <div className="card metric">
          <div className="metric-lbl">
            <Ic.Activity sz={13} /> <span>Прогрес</span>
          </div>
          <div className="metric-val">
            {progress}<span className="unit">%</span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--bg-2)',
              borderRadius: 999,
              overflow: 'hidden',
              marginTop: 8,
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6 }}>
            {done}/{issues.length} задач завершено
          </div>
        </div>

        <div className="card metric">
          <div className="metric-lbl">
            <Ic.Bug sz={13} /> <span>Багів у спринті</span>
          </div>
          <div className="metric-val">{issues.length}</div>
          <button
            className="btn ghost sm"
            style={{ marginTop: 8 }}
            onClick={onOpenBugs}
          >
            Відкрити всі <Ic.Chev sz={11} />
          </button>
        </div>

        <div className="card metric">
          <div className="metric-lbl">
            <Ic.Beaker sz={13} /> <span>Velocity</span>
          </div>
          <div className="metric-val">
            {sprint.capacity_sp ?? '—'}<span className="unit">SP</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6 }}>
            планова ємність
          </div>
        </div>

        <div className="card metric">
          <div className="metric-lbl">
            <Ic.Clock sz={13} /> <span>Залишилось</span>
          </div>
          <div className="metric-val">
            {remaining}<span className="unit">днів</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6 }}>
            до {formatDateShort(sprint.ends_at)}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="card-head" style={{ padding: 0, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Розподіл за пріоритетом</h3>
        </div>
        <div className="sprint-priority">
          {(['critical', 'high', 'medium', 'low'] as const).map(p => (
            <div key={p} className="row">
              <PriorityBadge value={p} />
              <div className="bar">
                <div
                  className={`fill ${p}`}
                  style={{
                    width: issues.length
                      ? `${(byPriority[p] / issues.length) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="count">{byPriority[p]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 18 }}>
        <div className="card-head" style={{ padding: 0, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Дошка спринту</h3>
        </div>
        <div className="sprint-board">
          {columns.map(col => (
            <div key={col.key} className="sprint-col">
              <div className="head">
                <span className="dot" />
                <b>{col.label}</b>
                <span className="count">{col.issues.length}</span>
              </div>
              <div className="list">
                {col.issues.length === 0 ? (
                  <div className="empty-mini">—</div>
                ) : (
                  col.issues.slice(0, 8).map(it => (
                    <div key={it.id} className="card-mini">
                      <div className="id">BUG-{it.id}</div>
                      <div className="title">{it.title}</div>
                      <div className="meta">
                        <StatusPill value={it.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
