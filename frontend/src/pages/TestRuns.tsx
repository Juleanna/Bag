/**
 * Test Runs: створення run'у з виборкою кейсів, start/finish, оновлення
 * результатів кожного кейсу під час прогону.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { TestResult, TestRun } from '../api/extras'
import { listAll } from '../api/client'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  planned: { bg: 'var(--st-closed-bg)', fg: 'var(--st-closed-fg)' },
  in_progress: { bg: 'var(--st-progress-bg)', fg: 'var(--st-progress-fg)' },
  completed: { bg: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)' },
  aborted: { bg: 'var(--st-open-bg)', fg: 'var(--st-open-fg)' },
}

const RESULT_COLORS: Record<string, { bg: string; fg: string }> = {
  pass: { bg: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)' },
  fail: { bg: 'var(--st-open-bg)', fg: 'var(--st-open-fg)' },
  blocked: { bg: 'var(--st-blocked-bg)', fg: 'var(--st-blocked-fg)' },
  skip: { bg: 'var(--st-closed-bg)', fg: 'var(--st-closed-fg)' },
  pending: { bg: 'var(--bg-2)', fg: 'var(--fg-3)' },
}

export function TestRunsPage() {
  const toast = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [runs, setRuns] = useState<TestRun[]>([])
  const [activeRun, setActiveRun] = useState<TestRun | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps[0]) setProjectId(ps[0].id)
      setLoading(false)
    })()
  }, [])

  useEffect(() => {
    if (!projectId) return
    void api.listTestRuns(projectId).then(setRuns)
  }, [projectId])

  useEffect(() => {
    if (activeRun) {
      void api.listTestResults(activeRun.id).then(setResults)
    }
  }, [activeRun])

  const createRun = async () => {
    if (!projectId) return
    const name = prompt('Назва Test Run (наприклад "Smoke v4.18"):')
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
      setActiveRun(run)
      toast.show('Run створено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const startRun = async () => {
    if (!activeRun) return
    try {
      const r = await api.startTestRun(activeRun.id)
      setActiveRun(r)
      const res = await api.listTestResults(r.id)
      setResults(res)
      toast.show('Run запущено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const finishRun = async () => {
    if (!activeRun) return
    try {
      const r = await api.finishTestRun(activeRun.id)
      setActiveRun(r)
      toast.show('Run завершено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const setResult = async (id: number, result: TestResult['result']) => {
    try {
      const updated = await api.updateTestResult(id, { result })
      setResults(rs => rs.map(r => (r.id === id ? updated : r)))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) return <div className="bt-loading-overlay"><div className="bt-spinner" /></div>

  return (
    <div className="page" style={{ maxWidth: 1480 }}>
      <div className="page-head">
        <div>
          <h1>Test Runs</h1>
          <div className="sub">{runs.length} прогонів</div>
        </div>
        <div className="right">
          <select
            className="inp"
            value={projectId ?? ''}
            onChange={e => setProjectId(Number(e.target.value))}
            style={{ height: 28 }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn primary" onClick={createRun}><Ic.Plus sz={13} /> Новий run</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {runs.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--fg-3)', padding: '6px 8px' }}>
              Прогонів ще немає
            </div>
          )}
          {runs.map(r => {
            const c = STATUS_COLORS[r.status]
            return (
              <button
                key={r.id}
                className={`sb-item ${activeRun?.id === r.id ? 'active' : ''}`}
                onClick={() => setActiveRun(r)}
              >
                <span className="pill" style={{ background: c.bg, color: c.fg }}>
                  {r.status}
                </span>
                <span style={{ flex: 1 }}>{r.name}</span>
                <span className="sb-count">{r.cases_total}</span>
              </button>
            )
          })}
        </aside>

        <div className="card" style={{ padding: 18 }}>
          {!activeRun ? (
            <div className="empty">
              <Ic.Play sz={32} />
              <p>Оберіть run або створіть новий</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: 18 }}>{activeRun.name}</h2>
                  <div className="sub">
                    {activeRun.cases_total} кейсів · ✅ {activeRun.pass_count} · ❌ {activeRun.fail_count}
                  </div>
                </div>
                {activeRun.status === 'planned' && (
                  <button className="btn primary" onClick={startRun}>
                    <Ic.Play sz={12} /> Запустити
                  </button>
                )}
                {activeRun.status === 'in_progress' && (
                  <button className="btn primary" onClick={finishRun}>
                    <Ic.Check sz={12} /> Завершити
                  </button>
                )}
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {results.length === 0 ? (
                  <div className="empty">
                    <p>Запустіть run, щоб побачити кейси</p>
                  </div>
                ) : (
                  results.map(r => {
                    const c = RESULT_COLORS[r.result]
                    return (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 10px',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--surface-2)',
                        }}
                      >
                        <span className="id-cell">TC-{r.test_case}</span>
                        <span style={{ flex: 1, fontSize: 13 }}>{r.case_title}</span>
                        <span className="pill" style={{ background: c.bg, color: c.fg }}>
                          {r.result}
                        </span>
                        {(['pass', 'fail', 'blocked', 'skip'] as const).map(v => (
                          <button
                            key={v}
                            className="btn sm"
                            onClick={() => setResult(r.id, v)}
                            style={{
                              background: r.result === v ? RESULT_COLORS[v].bg : undefined,
                              color: r.result === v ? RESULT_COLORS[v].fg : undefined,
                              fontWeight: r.result === v ? 600 : undefined,
                            }}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
