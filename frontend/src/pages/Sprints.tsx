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
import type { Sprint, TestCase, TestRun } from '../api/extras'
import type { Issue, Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { StatusPill } from '../atoms/Status'

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
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testRuns, setTestRuns] = useState<TestRun[]>([])
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
      extras.listTestCases({ project: projectId }).catch(() => [] as TestCase[]),
      extras.listTestRuns(projectId).catch(() => [] as TestRun[]),
    ])
      .then(([sl, il, tc, tr]) => {
        setSprints(sl)
        setIssues(il)
        setTestCases(tc)
        setTestRuns(tr)
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
      ) : tab === 'completed' ? (
        <CompletedList
          sprints={filteredSprints}
          issues={issues}
          onOpen={s => navigate(`/bugs?sprint=${s.id}`)}
        />
      ) : tab === 'planning' ? (
        focusedSprint ? (
          <PlanningView
            sprint={focusedSprint}
            project={projects.find(p => p.id === projectId) || null}
            backlog={issues.filter(i => i.sprint == null)}
            onLaunch={async () => {
              try {
                const updated = await extras.updateSprint(focusedSprint.id, { is_active: true })
                setSprints(sl => sl.map(x => (x.id === updated.id ? updated : x)))
                setTab('active')
                toast.show('Спринт запущено', 'success')
              } catch (e) {
                toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
              }
            }}
          />
        ) : (
          <div className="empty" style={{ marginTop: 60 }}>
            <Ic.Calendar sz={36} />
            <h4>Немає запланованих спринтів</h4>
            <p>Створіть нову ітерацію наперед — і вона зʼявиться тут.</p>
            <button
              className="btn primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate('/sprints/new')}
            >
              <Ic.Plus sz={13} /> Новий спринт
            </button>
          </div>
        )
      ) : !focusedSprint ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Calendar sz={36} />
          <h4>Немає активного спринту</h4>
          <p>Створіть новий спринт або запустіть запланований</p>
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
          testCasesCount={testCases.length}
          activeRunsCount={
            testRuns.filter(r => r.status !== 'completed' && r.status !== 'aborted')
              .length
          }
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
  testCasesCount,
  activeRunsCount,
  onEdit,
  onComplete,
  onDelete,
  onOpenBugs,
}: {
  sprint: Sprint
  issues: Issue[]
  progress: number
  done: number
  testCasesCount: number
  activeRunsCount: number
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

      <div className="sprint-goal">
        <div className="lbl">
          <Ic.Flag sz={11} /> ЦІЛЬ СПРИНТУ
        </div>
        <p style={!sprint.goal ? { color: 'var(--fg-3)', fontStyle: 'italic' } : undefined}>
          {sprint.goal || 'Цілі не задано — додайте через «Редагувати»'}
        </p>
      </div>

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
            <Ic.Beaker sz={13} /> <span>Тест-кейси</span>
          </div>
          <div className="metric-val">{testCasesCount}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 6 }}>
            {activeRunsCount} активних runs
          </div>
        </div>
      </div>

      <div className="sprint-charts">
        <div className="card" style={{ padding: 18 }}>
          <div
            className="card-head"
            style={{ padding: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <h3 style={{ margin: 0 }}>Burndown</h3>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)' }}
            >
              <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} />
              Реальне
            </span>
            <span
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-4)' }}
            >
              <span
                style={{
                  width: 12,
                  height: 1.5,
                  background: 'var(--fg-4)',
                  display: 'inline-block',
                }}
              />
              Ідеальне
            </span>
            <span
              className="tag"
              style={{ marginLeft: 'auto', fontSize: 11 }}
            >
              Story points
            </span>
          </div>
          <SprintBurndown sprint={sprint} issues={issues} done={done} />
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="card-head" style={{ padding: 0, marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Розподіл за пріоритетом</h3>
          </div>
          <div className="sprint-priority">
            {(
              [
                { p: 'critical', label: 'Critical' },
                { p: 'high', label: 'High' },
                { p: 'medium', label: 'Medium' },
                { p: 'low', label: 'Low' },
              ] as const
            ).map(o => (
              <div key={o.p} className="row stacked">
                <div className="head">
                  <span className="lbl">{o.label}</span>
                  <span className="count">{byPriority[o.p]}</span>
                </div>
                <div className="bar">
                  <div
                    className={`fill ${o.p}`}
                    style={{
                      width: issues.length
                        ? `${(byPriority[o.p] / issues.length) * 100}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
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

// Рахуємо story_points з custom_fields; якщо не задано — рахуємо за 1 SP,
// щоб ємність команди не була нульовою для існуючих багів.
function spOf(i: Issue): number {
  const cf = (i.custom_fields || {}) as Record<string, unknown>
  const v = cf.story_points
  if (typeof v === 'number' && v >= 0) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n) && n >= 0) return n
  }
  return 1
}

function PlanningView({
  sprint,
  project,
  backlog,
  onLaunch,
}: {
  sprint: Sprint
  project: Project | null
  backlog: Issue[]
  onLaunch: () => void
}) {
  // Кандидати для планування — issues без спринта, відсортовані за пріоритетом.
  const PRI_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const candidates = useMemo(
    () =>
      [...backlog].sort(
        (a, b) =>
          (PRI_ORDER[a.priority] ?? 9) - (PRI_ORDER[b.priority] ?? 9) ||
          a.id - b.id,
      ),
    [backlog],
  )
  // Беремо тих, кого вже додали у спринт (тобто i.sprint === sprint.id) —
  // окремий зріз issues приходить ззовні, тут не маємо. Тимчасово відсутньо;
  // ємність будуємо лише на основі capacity_sp і випадково розподіленому
  // load = 0 для нових. Точніший варіант — після драг-н-дропу в спринт.
  const members = useMemo(() => {
    if (!project) return [] as Array<{ id: number; first_name?: string; last_name?: string; username: string }>
    const seen = new Set<number>()
    const out: Array<{ id: number; first_name?: string; last_name?: string; username: string }> = []
    if (project.owner) {
      seen.add(project.owner.id)
      out.push(project.owner)
    }
    for (const m of project.members || []) {
      if (!seen.has(m.id)) {
        seen.add(m.id)
        out.push(m)
      }
    }
    return out
  }, [project])

  const cap = sprint.capacity_sp ?? 0
  const perPerson = members.length > 0 ? Math.round(cap / members.length) : cap
  // Скільки SP уже призначено на людину з backlog'у — рахуємо тих, у кого
  // assignee збігається.
  const loadByUser = useMemo(() => {
    const m = new Map<number, number>()
    for (const i of backlog) {
      if (i.assignee != null) m.set(i.assignee, (m.get(i.assignee) ?? 0) + spOf(i))
    }
    return m
  }, [backlog])
  const plannedTotal = backlog.reduce((s, i) => s + spOf(i), 0)

  return (
    <>
      <div className="sprint-head">
        <div>
          <h2 style={{ margin: 0 }}>Планування {sprint.name}</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            Чернетка · початок {formatDateShort(sprint.starts_at)}
            {cap > 0 && ` · ємність команди ~${cap} SP`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={onLaunch}>
            <Ic.Play sz={11} /> Запустити спринт
          </button>
        </div>
      </div>

      <div className="planning-grid">
        <div className="card" style={{ padding: 16 }}>
          <div className="card-head" style={{ padding: 0, marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>
              Беклог · кандидати
              <span className="count" style={{ marginLeft: 8 }}>
                {candidates.length} items
              </span>
            </h3>
          </div>
          <div className="planning-list">
            {candidates.length === 0 ? (
              <div className="empty-mini" style={{ padding: 24 }}>
                У беклозі немає кандидатів
              </div>
            ) : (
              candidates.slice(0, 20).map(it => (
                <div key={it.id} className="planning-row">
                  <span className="id">BUG-{it.id}</span>
                  <span className="title" title={it.title}>{it.title}</span>
                  <span className="sp">{spOf(it)}SP</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div className="card-head" style={{ padding: 0, marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Ємність</h3>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>
                Заплановано
              </span>
              <b style={{ fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
                {plannedTotal} / {cap || '—'} SP
              </b>
            </div>
            <div
              style={{
                height: 6,
                background: 'var(--bg-2)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: cap > 0 ? `${Math.min(100, (plannedTotal / cap) * 100)}%` : '0%',
                  background:
                    plannedTotal > cap ? 'var(--pri-high)' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
          <div className="planning-capacity-list">
            {members.map(m => {
              const used = loadByUser.get(m.id) ?? 0
              return (
                <div key={m.id} className="row">
                  <div
                    className="avatar"
                    title={displayNameLocal(m)}
                    style={{ background: gradientForUser(m.id) }}
                  >
                    {initialsForUser(m)}
                  </div>
                  <span className="name" title={displayNameLocal(m)}>
                    {displayNameLocal(m)}
                  </span>
                  <span className="cap">
                    {used}/{perPerson || '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

function CompletedList({
  sprints,
  issues,
  onOpen,
}: {
  sprints: Sprint[]
  issues: Issue[]
  onOpen: (s: Sprint) => void
}) {
  if (sprints.length === 0) {
    return (
      <div className="empty" style={{ marginTop: 60 }}>
        <Ic.Check sz={36} />
        <h4>Немає завершених спринтів</h4>
        <p>Завершені спринти зʼявляться тут після завершення.</p>
      </div>
    )
  }
  return (
    <div>
      <div className="sprint-head">
        <div>
          <h2 style={{ margin: 0 }}>Завершені спринти</h2>
          <div className="sub" style={{ marginTop: 4 }}>
            Тренди velocity та виконання
          </div>
        </div>
      </div>
      <div className="completed-list">
        {sprints.map(s => {
          const total = issues.filter(i => i.sprint === s.id).length
          const done = issues.filter(
            i =>
              i.sprint === s.id && (i.status === 'done' || i.status === 'cancelled'),
          ).length
          const pct = total === 0 ? 0 : Math.round((done / total) * 100)
          return (
            <div key={s.id} className="completed-row card">
              <div className="info">
                <b>{s.name}</b>
                <div className="dates">
                  {formatDateShort(s.starts_at)} — {formatDateShort(s.ends_at)}
                </div>
              </div>
              <div className="metric">
                <span className="lbl">Velocity</span>
                <b>{s.capacity_sp ?? '—'} SP</b>
              </div>
              <div className="metric">
                <span className="lbl">Виконано</span>
                <b>{pct}%</b>
              </div>
              <div className="bar">
                <div className="fill" style={{ width: `${pct}%` }} />
              </div>
              <button className="btn" onClick={() => onOpen(s)}>
                Огляд
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Локальні утиліти для avatar-кружочка в Capacity (Avatar-компонент тут зайвий —
// він тягне свої стилі і пропси на повний UserShort).
function displayNameLocal(u: {
  first_name?: string
  last_name?: string
  username: string
}): string {
  const full = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
  return full || u.username
}
function initialsForUser(u: {
  first_name?: string
  last_name?: string
  username: string
}): string {
  const f = (u.first_name || '').trim()
  const l = (u.last_name || '').trim()
  if (f && l) return (f[0] + l[0]).toUpperCase()
  if (f) return f.slice(0, 2).toUpperCase()
  return u.username.slice(0, 2).toUpperCase()
}
function gradientForUser(id: number): string {
  const palette = [
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #6366f1, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #ec4899, #f43f5e)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
  ]
  return palette[id % palette.length]
}

/**
 * Burndown chart для спринта: вісь X — дні спринта, вісь Y — story points,
 * що залишилось. Дві лінії:
 *  - Реальне (синє) — totalSP мінус закриті за датами updated_at
 *  - Ідеальне (сіре пунктирне) — лінійне зменшення від totalSP до 0
 */
function SprintBurndown({
  sprint,
  issues,
  done,
}: {
  sprint: Sprint
  issues: Issue[]
  done: number
}) {
  // Будуємо дні спринта і scope. Якщо нема story_points у issues —
  // вважаємо 1 SP per issue, щоб графік не був порожнім.
  const totalSp = sprint.capacity_sp || issues.length || 5
  const startMs = new Date(sprint.starts_at).getTime()
  const endMs = new Date(sprint.ends_at).getTime()
  const totalDays = Math.max(1, Math.round((endMs - startMs) / 86400000) + 1)
  const days = Array.from({ length: totalDays }, (_, i) => i + 1)
  // Реальне: для кожного дня — totalSp мінус сума SP закритих до цього дня.
  const closedByDay = days.map(d => {
    const cutoff = new Date(startMs + (d - 1) * 86400000)
    cutoff.setHours(23, 59, 59, 999)
    return issues.filter(
      i =>
        (i.status === 'done' || i.status === 'cancelled') &&
        new Date(i.updated_at) <= cutoff,
    ).length
  })
  // SP per issue: рівномірно totalSp/issues.length. Якщо issues порожні —
  // лишаємо лінію плоскою.
  const spPerIssue = issues.length > 0 ? totalSp / issues.length : 0
  const real = closedByDay.map(c => Math.max(0, totalSp - c * spPerIssue))
  // Доводимо лінію 'реальне' лише до сьогоднішнього дня — далі pending.
  const today = Date.now()
  const lastRealIdx = Math.max(
    0,
    Math.min(totalDays - 1, Math.floor((today - startMs) / 86400000)),
  )

  const W = 560
  const H = 220
  const P = { l: 32, r: 14, t: 14, b: 28 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const max = Math.max(totalSp, 5)
  const x = (i: number) => P.l + (i / Math.max(1, totalDays - 1)) * innerW
  const y = (v: number) => P.t + innerH - (v / max) * innerH

  const idealPath = `M${x(0)},${y(totalSp)} L${x(totalDays - 1)},${y(0)}`
  const realPath = real
    .slice(0, lastRealIdx + 1)
    .map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`)
    .join(' ')
  const ticks = 4
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((max / ticks) * i),
  )

  // Якщо done = 0 не використовуємо — просто індикатор для лінійки real.
  void done

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line
            x1={P.l}
            x2={W - P.r}
            y1={y(v)}
            y2={y(v)}
            stroke="var(--divider)"
            strokeDasharray="2 3"
          />
          <text
            x={P.l - 6}
            y={y(v) + 3}
            fontSize="10"
            fill="var(--fg-3)"
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {v}
          </text>
        </g>
      ))}
      <path d={idealPath} stroke="var(--fg-4)" strokeWidth="1.2" strokeDasharray="3 4" fill="none" />
      <path d={realPath} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {real.slice(0, lastRealIdx + 1).map((v, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(v)}
          r={i === lastRealIdx ? 4 : 2.5}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth="1.5"
        />
      ))}
      {days.map((d, i) =>
        i % Math.max(1, Math.floor(totalDays / 8)) === 0 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 10}
            fontSize="10"
            fill="var(--fg-3)"
            textAnchor="middle"
            fontFamily="var(--font-mono)"
          >
            Д{d}
          </text>
        ) : null,
      )}
    </svg>
  )
}
