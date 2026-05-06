/**
 * Швидке створення тест-кейсу через shortcut Shift+C — мінімальна форма.
 * Більше деталей — на /tests після створення.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { TestSuite } from '../api/extras'
import { listAll } from '../api/client'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'

export function NewTestPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suiteId, setSuiteId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<'manual' | 'automated'>('manual')
  const [priority, setPriority] = useState<'critical' | 'high' | 'medium' | 'low'>('medium')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps[0]) setProjectId(ps[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!projectId) return
    void api.listTestSuites(projectId).then(sl => {
      setSuites(sl)
      setSuiteId(sl[0]?.id ?? null)
    })
  }, [projectId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!suiteId) {
      toast.show('Спершу створіть suite на сторінці Тест-кейси', 'info')
      return
    }
    setSubmitting(true)
    try {
      await api.createTestCase({ suite: suiteId, title, type, priority })
      toast.show('Кейс створено', 'success')
      navigate('/tests')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Помилка', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <h1>Новий тест-кейс</h1>
          <div className="sub">Базовий створення — деталі редагуйте після збереження</div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <Ic.Beaker sz={36} />
          <h4>Спершу створіть проєкт</h4>
        </div>
      ) : (
        <form className="card" style={{ padding: 22 }} onSubmit={submit}>
          <div className="field">
            <label>Назва *</label>
            <input
              className="inp"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              autoFocus
              placeholder='Наприклад: "Користувач може увімкнути 2FA"'
            />
          </div>
          <div className="admin-grid-2" style={{ marginTop: 12 }}>
            <div className="field">
              <label>Проєкт</label>
              <select
                className="inp"
                value={projectId ?? ''}
                onChange={e => setProjectId(Number(e.target.value))}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Suite</label>
              <select
                className="inp"
                value={suiteId ?? ''}
                onChange={e => setSuiteId(Number(e.target.value))}
                disabled={suites.length === 0}
              >
                {suites.length === 0 ? (
                  <option value="">Немає suites — створіть</option>
                ) : (
                  suites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                )}
              </select>
            </div>
            <div className="field">
              <label>Тип</label>
              <select className="inp" value={type} onChange={e => setType(e.target.value as 'manual' | 'automated')}>
                <option value="manual">Manual</option>
                <option value="automated">Automated</option>
              </select>
            </div>
            <div className="field">
              <label>Пріоритет</label>
              <select
                className="inp"
                value={priority}
                onChange={e => setPriority(e.target.value as 'critical' | 'high' | 'medium' | 'low')}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => navigate('/tests')}>
              Скасувати
            </button>
            <button type="submit" className="btn primary" disabled={submitting || !title}>
              {submitting ? 'Створення…' : 'Створити'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
