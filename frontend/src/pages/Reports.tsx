/**
 * Reports — графіки created/closed по днях, MTTR, top assignees, by-status pie.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { ReportsSummary } from '../api/extras'
import { listAll } from '../api/client'
import type { Project } from '../api/types'
import { Sparkline, BarStack } from '../atoms/Charts'

export function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [data, setData] = useState<ReportsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
    })()
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .reportsSummary(projectId ?? undefined)
      .then(setData)
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading || !data) return <div className="bt-loading-overlay"><div className="bt-spinner" /></div>

  const created = data.days.map(d => d.created)
  const closed = data.days.map(d => d.closed)
  const totalCreated = created.reduce((s, x) => s + x, 0)
  const totalClosed = closed.reduce((s, x) => s + x, 0)

  const STATUS_COLORS: Record<string, string> = {
    open: 'var(--st-open-dot)',
    in_progress: 'var(--st-progress-dot)',
    done: 'var(--st-resolved-dot)',
    cancelled: 'var(--st-closed-dot)',
  }

  return (
    <div className="page" style={{ maxWidth: 1480 }}>
      <div className="page-head">
        <div>
          <h1>Звіти</h1>
          <div className="sub">Метрики команди за останні 30 днів</div>
        </div>
        <div className="right">
          <select
            className="inp"
            value={projectId ?? ''}
            onChange={e => setProjectId(e.target.value ? Number(e.target.value) : null)}
            style={{ height: 28 }}
          >
            <option value="">Усі проєкти</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Метрики */}
      <div className="metrics" style={{ marginBottom: 16 }}>
        <div className="card metric">
          <div className="metric-lbl">Створено</div>
          <div className="metric-val">{totalCreated}</div>
          <Sparkline data={created} color="var(--st-open-dot)" w={120} h={28} />
        </div>
        <div className="card metric">
          <div className="metric-lbl">Закрито</div>
          <div className="metric-val">{totalClosed}</div>
          <Sparkline data={closed} color="var(--st-resolved-dot)" w={120} h={28} />
        </div>
        <div className="card metric">
          <div className="metric-lbl">MTTR (середній час до закриття)</div>
          <div className="metric-val">{data.mttr_hours}<span className="unit">год</span></div>
        </div>
        <div className="card metric">
          <div className="metric-lbl">Активних виконавців</div>
          <div className="metric-val">{data.top_assignees.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* By status */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 14, fontSize: 14 }}>Розподіл за статусом</h3>
          {data.by_status.length === 0 ? (
            <div className="empty"><p>Немає даних</p></div>
          ) : (
            <>
              <BarStack
                parts={data.by_status.map(s => ({
                  value: s.n,
                  color: STATUS_COLORS[s.status] || 'var(--fg-4)',
                  label: s.status,
                }))}
              />
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.by_status.map(s => (
                  <div key={s.status} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[s.status] || 'var(--fg-4)' }} />
                    <span style={{ flex: 1 }}>{s.status}</span>
                    <span style={{ color: 'var(--fg-3)' }}>{s.n}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Top assignees */}
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ margin: 0, marginBottom: 14, fontSize: 14 }}>Топ-виконавці (закрито)</h3>
          {data.top_assignees.length === 0 ? (
            <div className="empty"><p>Немає закритих задач</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.top_assignees.map((a, i) => (
                <div key={a.assignee} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: 11 }}>
                    {i + 1}
                  </span>
                  <span style={{ flex: 1 }}>{a.assignee__username}</span>
                  <span className="tag">{a.n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily activity */}
      <div className="card" style={{ marginTop: 16, padding: 18 }}>
        <h3 style={{ margin: 0, marginBottom: 14, fontSize: 14 }}>
          <Ic.Activity sz={14} /> Created / Closed по днях
        </h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
          {data.days.map(d => {
            const max = Math.max(...data.days.flatMap(x => [x.created, x.closed]), 1)
            return (
              <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 130 }}>
                  <div
                    style={{
                      width: 6,
                      height: `${(d.created / max) * 100}%`,
                      background: 'var(--st-open-dot)',
                      borderRadius: '2px 2px 0 0',
                      minHeight: 1,
                    }}
                    title={`${d.day}: ${d.created} створено`}
                  />
                  <div
                    style={{
                      width: 6,
                      height: `${(d.closed / max) * 100}%`,
                      background: 'var(--st-resolved-dot)',
                      borderRadius: '2px 2px 0 0',
                      minHeight: 1,
                    }}
                    title={`${d.day}: ${d.closed} закрито`}
                  />
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--fg-3)' }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--st-open-dot)', borderRadius: 2, marginRight: 4 }} />Створено</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--st-resolved-dot)', borderRadius: 2, marginRight: 4 }} />Закрито</span>
        </div>
      </div>
    </div>
  )
}
