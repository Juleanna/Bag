/**
 * Тест-кейси: список Suites + Cases. Створення suite, створення кейса,
 * редагування кроків (JSON-масив).
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { TestCase, TestSuite } from '../api/extras'
import { listAll } from '../api/client'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm, usePrompt } from '../context/ConfirmContext'

export function TestsPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [cases, setCases] = useState<TestCase[]>([])
  const [activeSuite, setActiveSuite] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

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
      const [sl, cl] = await Promise.all([api.listTestSuites(pid), api.listTestCases({ project: pid })])
      setSuites(sl)
      setCases(cl)
      if (sl.length > 0 && activeSuite == null) setActiveSuite(sl[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (projectId) {
      Promise.all([api.listTestSuites(projectId), api.listTestCases({ project: projectId })]).then(
        ([sl, cl]) => {
          setSuites(sl)
          setCases(cl)
          setActiveSuite(sl[0]?.id ?? null)
        }
      )
    }
  }, [projectId])

  const addSuite = async () => {
    const name = await prompt({
      title: 'Новий suite',
      message: 'Назва suite (наприклад "Auth", "Billing"):',
      placeholder: 'Auth',
      confirmText: 'Створити',
      required: true,
    })
    if (!name || !projectId) return
    try {
      await api.createTestSuite({ project: projectId, name })
      toast.show('Suite створено', 'success')
      const sl = await api.listTestSuites(projectId)
      setSuites(sl)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const addCase = async () => {
    if (!activeSuite) {
      toast.show('Спершу оберіть suite', 'info')
      return
    }
    const title = await prompt({
      title: 'Новий тест-кейс',
      message: 'Назва тест-кейсу:',
      placeholder: 'Користувач може увімкнути 2FA',
      confirmText: 'Створити',
      required: true,
    })
    if (!title) return
    try {
      const created = await api.createTestCase({ suite: activeSuite, title })
      setCases(cs => [created, ...cs])
      toast.show('Кейс створено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeCase = async (id: number) => {
    const ok = await confirm({
      title: 'Видалити тест-кейс?',
      message: 'Цю дію не можна скасувати.',
      danger: true,
      confirmText: 'Видалити',
    })
    if (!ok) return
    try {
      await api.deleteTestCase(id)
      setCases(cs => cs.filter(c => c.id !== id))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) return <div className="bt-loading-overlay"><div className="bt-spinner" /></div>

  if (projects.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <Ic.Beaker sz={36} />
          <h4>Немає проєктів</h4>
          <p>Створіть проєкт, щоб додавати тест-кейси</p>
        </div>
      </div>
    )
  }

  const filtered = activeSuite ? cases.filter(c => c.suite === activeSuite) : cases

  return (
    <div className="page" style={{ maxWidth: 1480 }}>
      <div className="page-head">
        <div>
          <h1>Тест-кейси</h1>
          <div className="sub">{cases.length} кейсів у {suites.length} suites</div>
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
          <button className="btn" onClick={addSuite}><Ic.Plus sz={13} /> Suite</button>
          <button className="btn primary" onClick={addCase}><Ic.Plus sz={13} /> Тест-кейс</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {suites.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--fg-3)', padding: '6px 8px' }}>
              Немає suites. Створіть перший.
            </div>
          )}
          {suites.map(s => (
            <button
              key={s.id}
              className={`sb-item ${activeSuite === s.id ? 'active' : ''}`}
              onClick={() => setActiveSuite(s.id)}
            >
              <Ic.Beaker sz={14} />
              <span>{s.name}</span>
              <span className="sb-count">{s.cases_count}</span>
            </button>
          ))}
        </aside>

        <div className="card">
          {filtered.length === 0 ? (
            <div className="empty">
              <Ic.Beaker sz={32} />
              <h4>Кейсів немає</h4>
              <p>Додайте перший тест-кейс</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18 }}>Назва</th>
                  <th>Тип</th>
                  <th>Пріоритет</th>
                  <th className="right" style={{ paddingRight: 18 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td style={{ paddingLeft: 18 }}>
                      <span className="id-cell">TC-{c.id}</span>{' '}
                      <span className="title-cell">{c.title}</span>
                    </td>
                    <td>
                      <span className="tag">{c.type === 'automated' ? 'Auto' : 'Manual'}</span>
                    </td>
                    <td className="muted">{c.priority}</td>
                    <td className="right" style={{ paddingRight: 18 }}>
                      <button className="btn ghost icon sm" onClick={() => removeCase(c.id)}>
                        <Ic.Trash sz={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
