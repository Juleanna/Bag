import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge } from '../atoms/Status'
import { BarStack, DonutChart, Sparkline } from '../atoms/Charts'
import { listAll } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Issue, IssueActivity, Project } from '../api/types'

interface MetricProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  unit?: string
  delta?: string
  deltaKind?: 'up' | 'down' | 'flat'
  since?: string
  sparkData?: number[]
  sparkColor?: string
}

function MetricCard({ icon, label, value, unit, delta, deltaKind, since, sparkData, sparkColor }: MetricProps) {
  return (
    <div className="card metric">
      <div className="metric-lbl">{icon}<span>{label}</span></div>
      <div className="metric-val">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className={`metric-delta ${deltaKind || 'flat'}`}>
          {deltaKind === 'up' && <Ic.ChevUp sz={11} />}
          {deltaKind === 'down' && <Ic.ChevDown sz={11} />}
          {delta}
          {since && <span className="since">{since}</span>}
        </span>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={sparkColor || 'var(--accent)'} w={88} h={26} />
        )}
      </div>
    </div>
  )
}

// Burndown — generujemy z історії issues (created_at vs updated_at).
// На MVP-фазі показуємо просту версію: для кожного дня за 14 днів — скільки issues
// було створено / закрито.
interface BurnPoint { d: string; opened: number; closed: number; open: number }

function buildBurndown(issues: Issue[]): BurnPoint[] {
  const days = 14
  const today = new Date()
  const out: BurnPoint[] = []
  let runningOpen = 0
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(today)
    day.setDate(today.getDate() - i)
    const dayKey = day.toISOString().slice(0, 10)
    const dayLabel = `${String(day.getDate()).padStart(2, '0')}.${String(day.getMonth() + 1).padStart(2, '0')}`
    const opened = issues.filter(it => it.created_at.startsWith(dayKey)).length
    const closed = issues.filter(
      it => (it.status === 'done' || it.status === 'cancelled') && it.updated_at.startsWith(dayKey)
    ).length
    runningOpen += opened - closed
    if (runningOpen < 0) runningOpen = 0
    out.push({ d: dayLabel, opened, closed, open: runningOpen })
  }
  return out
}

function BurndownChart({ data }: { data: BurnPoint[] }) {
  if (data.length === 0) return null
  const W = 720
  const H = 200
  const P = { l: 36, r: 12, t: 12, b: 26 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const max = Math.max(...data.map(d => d.open), 5) + 2
  const min = 0
  const x = (i: number) => P.l + (i / Math.max(1, data.length - 1)) * innerW
  const y = (v: number) => P.t + innerH - ((v - min) / Math.max(1, max - min)) * innerH
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.open)}`)
    .join(' ')
  const fillPath = `${linePath} L${x(data.length - 1)},${P.t + innerH} L${x(0)},${P.t + innerH} Z`
  const barW = Math.max(2, (innerW / data.length) * 0.34)
  const ticks = 4
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => Math.round(min + ((max - min) * i) / ticks))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bd-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="var(--divider)" strokeDasharray="2 3" />
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
      {data.map((d, i) => {
        const openedH = (d.opened / Math.max(1, max - min)) * innerH
        const closedH = (d.closed / Math.max(1, max - min)) * innerH
        return (
          <g key={i}>
            <rect
              x={x(i) - barW - 1}
              y={y(0) - openedH}
              width={barW}
              height={openedH}
              fill="var(--st-open-dot)"
              opacity="0.55"
              rx="1.5"
            />
            <rect
              x={x(i) + 1}
              y={y(0) - closedH}
              width={barW}
              height={closedH}
              fill="var(--st-resolved-dot)"
              opacity="0.55"
              rx="1.5"
            />
          </g>
        )
      })}
      <path d={fillPath} fill="url(#bd-grad)" />
      <path d={linePath} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" />
      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.open)}
          r={i === data.length - 1 ? 4 : 0}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth="2"
        />
      ))}
      {data.map(
        (d, i) =>
          i % 2 === 0 && (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              fontSize="10"
              fill="var(--fg-3)"
              textAnchor="middle"
              fontFamily="var(--font-mono)"
            >
              {d.d}
            </text>
          )
      )}
    </svg>
  )
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  return `${Math.floor(diff / 86400)} дн тому`
}

function ActivityRow({ a }: { a: IssueActivity }) {
  return (
    <div className="act-row">
      <Avatar user={a.user} />
      <div className="body">
        <b>{a.user.username}</b> {actionLabel(a.action)}{' '}
        <span className="lnk">#{a.issue}</span>
        {(a.old_value || a.new_value) && (
          <div style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 2 }}>
            {a.old_value && <>з «{a.old_value}»</>}{' '}
            {a.new_value && <>→ «{a.new_value}»</>}
          </div>
        )}
      </div>
      <span className="when">{formatWhen(a.created_at)}</span>
    </div>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    created: 'створив(ла)',
    status_changed: 'змінив(ла) статус',
    priority_changed: 'змінив(ла) пріоритет',
    assignee_changed: 'переназначив(ла)',
    title_changed: 'перейменував(ла)',
    due_date_changed: 'змінив(ла) дедлайн',
    comment_added: 'прокоментував(ла)',
    bulk_updated: 'масово оновив(ла)',
  }
  return map[action] || action
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [issues, setIssues] = useState<Issue[]>([])
  const [activities, setActivities] = useState<IssueActivity[]>([])
  const [, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const [iss, acts, projs] = await Promise.all([
          listAll<Issue>('/issues/?page_size=100'),
          listAll<IssueActivity>('/activities/?page_size=10'),
          listAll<Project>('/projects/?page_size=20'),
        ])
        setIssues(iss)
        setActivities(acts)
        setProjects(projs)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const stats = useMemo(() => {
    const open = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length
    const done = issues.filter(i => i.status === 'done').length
    const today = new Date().toISOString().slice(0, 10)
    const week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    const closedThisWeek = issues.filter(
      i => i.status === 'done' && i.updated_at >= week
    ).length
    const burndown = buildBurndown(issues)
    const byPriority = [
      { label: 'Високий', value: issues.filter(i => i.priority === 'high').length, color: 'var(--pri-high)' },
      { label: 'Середній', value: issues.filter(i => i.priority === 'medium').length, color: 'var(--pri-medium)' },
      { label: 'Низький', value: issues.filter(i => i.priority === 'low').length, color: 'var(--pri-low)' },
    ]
    return { open, done, today, closedThisWeek, burndown, byPriority }
  }, [issues])

  const hottest = issues
    .filter(i => i.status === 'open' || i.status === 'in_progress')
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5)

  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Доброго ранку'
    if (hour < 18) return 'Добрий день'
    return 'Доброго вечора'
  })()
  const userName = user?.first_name || user?.username || 'друже'

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>
            {greeting}, {userName} 👋
          </h1>
          <div className="sub">
            <b style={{ color: 'var(--fg)' }}>{stats.open}</b> відкритих ·{' '}
            {stats.closedThisWeek} закрито за тиждень
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => navigate('/bugs/new')}>
            <Ic.Plus sz={14} /> Новий баг
          </button>
        </div>
      </div>

      <div className="metrics" style={{ marginBottom: 16 }}>
        <MetricCard
          icon={<Ic.Bug sz={13} />}
          label="Відкриті баги"
          value={stats.open}
          delta={stats.open > 0 ? `+${stats.open} активних` : '—'}
          deltaKind={stats.open > 0 ? 'up' : 'flat'}
          sparkData={stats.burndown.map(b => b.open)}
          sparkColor="var(--st-open-dot)"
        />
        <MetricCard
          icon={<Ic.Check2 sz={13} />}
          label="Закриті за тиждень"
          value={stats.closedThisWeek}
          delta={stats.closedThisWeek > 0 ? '🎉 робота йде' : '—'}
          deltaKind="down"
          sparkData={stats.burndown.map(b => b.closed)}
          sparkColor="var(--st-resolved-dot)"
        />
        <MetricCard
          icon={<Ic.Beaker sz={13} />}
          label="Загалом задач"
          value={issues.length}
          unit=""
          delta={`${stats.done} готових`}
          deltaKind="flat"
        />
        <MetricCard
          icon={<Ic.Clock sz={13} />}
          label="Останнє оновлення"
          value={issues[0] ? formatWhen(issues[0].updated_at) : '—'}
          delta=""
          deltaKind="flat"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Burndown · відкриті баги</h3>
            <span className="sub">останні 14 днів</span>
            <div className="right">
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--st-open-dot)', borderRadius: 2, opacity: 0.7 }} />{' '}
                Відкрито
              </span>
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span
                  style={{ width: 8, height: 8, background: 'var(--st-resolved-dot)', borderRadius: 2, opacity: 0.7 }}
                />{' '}
                Закрито
              </span>
            </div>
          </div>
          <div className="card-body">
            <BurndownChart data={stats.burndown} />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>За пріоритетом</h3>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <DonutChart parts={stats.byPriority} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {stats.byPriority.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ color: 'var(--fg-2)' }}>{p.label}</span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--fg-3)',
                    }}
                  >
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Найгарячіші баги</h3>
            <span className="sub">потребують уваги</span>
            <div className="right">
              <button className="btn sm" onClick={() => navigate('/bugs')}>
                Усі баги <Ic.Chev sz={11} />
              </button>
            </div>
          </div>
          {hottest.length === 0 ? (
            <div className="empty">
              <Ic.Bug sz={32} />
              <h4>Поки тихо 🌿</h4>
              <p>Немає відкритих багів</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18 }}>Баг</th>
                  <th>Пріоритет</th>
                  <th>Статус</th>
                  <th className="right" style={{ paddingRight: 18 }}>
                    Оновлено
                  </th>
                </tr>
              </thead>
              <tbody>
                {hottest.map(b => (
                  <tr key={b.id} onClick={() => navigate(`/bugs/${b.id}`)}>
                    <td style={{ paddingLeft: 18 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="id-cell">BUG-{b.id}</span>
                        <span
                          className="title-cell"
                          style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {b.title}
                        </span>
                      </div>
                    </td>
                    <td>
                      <PriorityBadge value={b.priority} />
                    </td>
                    <td>
                      <StatusPill value={b.status} />
                    </td>
                    <td className="right muted" style={{ paddingRight: 18 }}>
                      {formatWhen(b.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Активність команди</h3>
            <div className="right">
              <span className="pill resolved">
                <span className="dot" style={{ background: 'var(--st-resolved-dot)' }} /> live
              </span>
            </div>
          </div>
          <div className="activity">
            {activities.length === 0 ? (
              <div className="empty">
                <Ic.Activity sz={28} />
                <p>Поки немає активності</p>
              </div>
            ) : (
              activities.slice(0, 8).map(a => <ActivityRow key={a.id} a={a} />)
            )}
          </div>
        </div>
      </div>

      {/* Прогрес проєктів через BarStack */}
      {issues.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Розподіл по проєктах</h3>
            <span className="sub">статус задач</span>
          </div>
          <div className="card-body">
            <ProjectsProgress issues={issues} />
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectsProgress({ issues }: { issues: Issue[] }) {
  const byProject = issues.reduce<Record<number, Issue[]>>((acc, i) => {
    if (!acc[i.project]) acc[i.project] = []
    acc[i.project].push(i)
    return acc
  }, {})

  const items = Object.entries(byProject).map(([projId, list]) => {
    const total = list.length
    const done = list.filter(i => i.status === 'done').length
    const inProgress = list.filter(i => i.status === 'in_progress').length
    const open = list.filter(i => i.status === 'open').length
    return { projId: Number(projId), total, done, inProgress, open }
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, paddingTop: 4 }}>
      {items.map(it => {
        const pct = it.total > 0 ? Math.round((it.done / it.total) * 100) : 0
        return (
          <div key={it.projId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <b>Проєкт #{it.projId}</b>
              <span style={{ color: 'var(--fg-3)' }}>{pct}%</span>
            </div>
            <BarStack
              parts={[
                { value: it.done, color: 'var(--st-resolved-dot)', label: 'done' },
                { value: it.inProgress, color: 'var(--st-progress-dot)', label: 'in_progress' },
                { value: it.open, color: 'var(--st-open-dot)', label: 'open' },
              ]}
            />
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--fg-3)' }}>
              <span>● {it.done}</span>
              <span>● {it.inProgress}</span>
              <span>● {it.open}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
