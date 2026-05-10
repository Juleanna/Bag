/**
 * Test Runs — список тестових прогонів за стилем Tests.tsx:
 *  - sidebar з фільтром за статусом (Усі / Заплановані / В процесі / Завершені)
 *  - таблиця: ID / Назва / Статус / Кейсів / Pass / Fail / Прогрес / Створено
 *  - search + bulk-вибір
 *  - клік відкриває сторінку прогону /runs/<id>
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { TestRun } from '../api/extras'
import { listAll } from '../api/client'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm, usePrompt } from '../context/ConfirmContext'

type StatusFilter = 'all' | 'planned' | 'in_progress' | 'completed' | 'aborted'

const STATUS_LABELS: Record<TestRun['status'], { label: string; cls: string; dot: string }> = {
  planned: { label: 'Заплановано', cls: 'closed', dot: 'var(--st-closed-dot)' },
  in_progress: { label: 'В процесі', cls: 'progress', dot: 'var(--st-progress-dot)' },
  completed: { label: 'Завершено', cls: 'resolved', dot: 'var(--st-resolved-dot)' },
  aborted: { label: 'Перервано', cls: 'open', dot: 'var(--st-open-dot)' },
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)} дн тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TestRunsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [runs, setRuns] = useState<TestRun[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const reload = async () => {
    setLoading(true)
    try {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps.length === 0) {
        setLoading(false)
        return
      }
      const pid = projectId || ps[0].id
      setProjectId(pid)
      const rs = await api.listTestRuns(pid)
      setRuns(rs)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!projectId) return
    void api.listTestRuns(projectId).then(setRuns)
  }, [projectId])

  const filtered = useMemo(() => {
    return runs.filter(r => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.name.toLowerCase().includes(q) && !String(r.id).includes(q)) return false
      }
      return true
    })
  }, [runs, statusFilter, search])

  const stats = useMemo(() => {
    return {
      total: runs.length,
      planned: runs.filter(r => r.status === 'planned').length,
      inProgress: runs.filter(r => r.status === 'in_progress').length,
      completed: runs.filter(r => r.status === 'completed').length,
      aborted: runs.filter(r => r.status === 'aborted').length,
    }
  }, [runs])

  // Pass-rate серед завершених прогонів
  const passRate = useMemo(() => {
    const completed = runs.filter(r => r.status === 'completed')
    if (completed.length === 0) return 0
    const totalCases = completed.reduce((s, r) => s + r.cases_total, 0)
    if (totalCases === 0) return 0
    const totalPass = completed.reduce((s, r) => s + r.pass_count, 0)
    return Math.round((totalPass / totalCases) * 100)
  }, [runs])

  const createRun = async () => {
    if (!projectId) return
    const name = await prompt({
      title: 'Новий Test Run',
      message: 'Назва Test Run (наприклад "Smoke v4.18"):',
      placeholder: 'Smoke v4.18',
      confirmText: 'Створити',
      required: true,
    })
    if (!name) return
    const cases = await api.listTestCases({ project: projectId })
    if (cases.length === 0) {
      toast.show('Спершу створіть тест-кейси', 'info')
      return
    }
    try {
      const run = await api.createTestRun({
        project: projectId,
        name,
        test_cases: cases.map(c => c.id),
      })
      setRuns(rs => [run, ...rs])
      toast.show('Run створено — натисніть, щоб запустити', 'success')
      navigate(`/runs/${run.id}`)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeRun = async (r: TestRun) => {
    const ok = await confirm({
      title: `Видалити «${r.name}»?`,
      message: 'Усі результати кейсів цього прогону будуть видалені.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTestRun(r.id)
      setRuns(arr => arr.filter(x => x.id !== r.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleSelect = (id: number) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(r => r.id)))
  }

  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <Ic.Play sz={36} />
          <h4>Немає проєктів</h4>
          <p>Створіть проєкт, щоб запускати тести</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 'unset' }}>
        <div>
          <h1>Test Runs</h1>
          <div className="sub">
            {stats.total} {stats.total === 1 ? 'прогін' : 'прогонів'} ·{' '}
            {stats.inProgress} в процесі · {passRate}% pass-rate
          </div>
        </div>
        <div className="right">
          <select
            className="inp"
            value={projectId ?? ''}
            onChange={e => setProjectId(Number(e.target.value))}
            style={{ minWidth: 160, width: 'auto' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn primary" onClick={createRun}>
            <Ic.Plus sz={13} /> Новий run
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Пошук прогонів…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {statusFilter !== 'all' && (
          <button
            type="button"
            className="chip applied"
            onClick={() => setStatusFilter('all')}
          >
            <span style={{ color: 'var(--fg-3)' }}>Статус:</span>
            <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>
              {STATUS_LABELS[statusFilter as TestRun['status']]?.label}
            </span>
            <Ic.X sz={11} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
          minHeight: 0,
        }}
      >
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            padding: '12px 8px',
          }}
        >
          <div>
            <div className="sb-section" style={{ padding: '4px 8px 6px' }}>
              <span className="sb-section-label">Статус</span>
            </div>
            <div className="sb-nav" style={{ padding: 0 }}>
              <button
                className={`sb-item ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                <Ic.Layout sz={14} />
                <span>Усі</span>
                <span className="sb-count">{stats.total}</span>
              </button>
              <button
                className={`sb-item ${statusFilter === 'planned' ? 'active' : ''}`}
                onClick={() => setStatusFilter('planned')}
              >
                <Ic.Calendar sz={14} />
                <span>Заплановані</span>
                <span className="sb-count">{stats.planned}</span>
              </button>
              <button
                className={`sb-item ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                <Ic.Play sz={14} />
                <span>В процесі</span>
                <span className="sb-count">{stats.inProgress}</span>
              </button>
              <button
                className={`sb-item ${statusFilter === 'completed' ? 'active' : ''}`}
                onClick={() => setStatusFilter('completed')}
              >
                <Ic.Check sz={14} />
                <span>Завершені</span>
                <span className="sb-count">{stats.completed}</span>
              </button>
              <button
                className={`sb-item ${statusFilter === 'aborted' ? 'active' : ''}`}
                onClick={() => setStatusFilter('aborted')}
              >
                <Ic.X sz={14} />
                <span>Перервані</span>
                <span className="sb-count">{stats.aborted}</span>
              </button>
            </div>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: 60 }}>
              <Ic.Play sz={32} />
              <h4>Прогонів немає</h4>
              <p>Створіть перший Test Run для прогону тест-кейсів</p>
            </div>
          ) : (
            <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: 36 }} />
                  <col style={{ width: 72 }} />
                  <col />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 70 }} />
                  <col style={{ width: 130 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 36 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        className="cb"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={selectAll}
                      />
                    </th>
                    <th>ID</th>
                    <th>Назва</th>
                    <th>Статус</th>
                    <th>Кейсів</th>
                    <th>Pass</th>
                    <th>Fail</th>
                    <th>Прогрес</th>
                    <th>Створено</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => {
                    const status = STATUS_LABELS[r.status]
                    const done = r.pass_count + r.fail_count
                    const pct = r.cases_total === 0 ? 0 : Math.round((done / r.cases_total) * 100)
                    const isSelected = selected.has(r.id)
                    return (
                      <tr
                        key={r.id}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => navigate(`/runs/${r.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td
                          className="checkbox-col"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="cb"
                            checked={isSelected}
                            onChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        <td className="id-cell" style={{ whiteSpace: 'nowrap' }}>
                          TR-{r.id}
                        </td>
                        <td>
                          <span
                            className="title-cell"
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={r.name}
                          >
                            {r.name}
                          </span>
                        </td>
                        <td>
                          <span className={`pill ${status.cls}`}>
                            <span className="dot" style={{ background: status.dot }} />
                            {status.label}
                          </span>
                        </td>
                        <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {r.cases_total}
                        </td>
                        <td
                          style={{
                            color: 'var(--st-resolved-fg)',
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {r.pass_count}
                        </td>
                        <td
                          style={{
                            color: r.fail_count > 0 ? 'var(--st-open-fg)' : 'var(--fg-4)',
                            fontWeight: 500,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {r.fail_count}
                        </td>
                        <td>
                          <div
                            style={{
                              width: '100%',
                              height: 6,
                              background: 'var(--bg-2)',
                              borderRadius: 999,
                              overflow: 'hidden',
                              display: 'flex',
                            }}
                            title={`${pct}%`}
                          >
                            <div
                              style={{
                                width: `${
                                  r.cases_total
                                    ? (r.pass_count / r.cases_total) * 100
                                    : 0
                                }%`,
                                background: 'var(--st-resolved-dot)',
                              }}
                            />
                            <div
                              style={{
                                width: `${
                                  r.cases_total
                                    ? (r.fail_count / r.cases_total) * 100
                                    : 0
                                }%`,
                                background: 'var(--st-open-dot)',
                              }}
                            />
                          </div>
                        </td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          {formatRelative(r.created_at)}
                        </td>
                        <td
                          className="right"
                          style={{ paddingRight: 12 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="btn ghost icon sm"
                            onClick={() => removeRun(r)}
                            title="Видалити"
                          >
                            <Ic.Trash sz={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
