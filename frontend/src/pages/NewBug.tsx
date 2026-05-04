import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { PRIORITY_MAP, STATUS_MAP } from '../atoms/Status'
import { apiPost, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import type { IssuePriority, IssueStatus, Project, UserShort } from '../api/types'

export function NewBugPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState({
    project: 0,
    title: '',
    description: '',
    status: 'open' as IssueStatus,
    priority: 'medium' as IssuePriority,
    assignee: '' as number | '',
    due_date: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps.length > 0) setForm(f => ({ ...f, project: ps[0].id }))
    })()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.project) {
      setError('Спочатку створіть проєкт')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        project: form.project,
        title: form.title,
        description: form.description,
        status: form.status,
        priority: form.priority,
      }
      if (form.assignee) payload.assignee = form.assignee
      if (form.due_date) payload.due_date = form.due_date
      const created = await apiPost<{ id: number }>('/issues/', payload)
      toast.show('Баг створено', 'success')
      navigate(`/bugs/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення')
    } finally {
      setSubmitting(false)
    }
  }

  const currentProject = projects.find(p => p.id === form.project)
  const members: UserShort[] = currentProject
    ? [currentProject.owner, ...currentProject.members.filter(m => m.id !== currentProject.owner.id)]
    : []

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="page-head">
        <div>
          <h1>Новий баг</h1>
          <div className="sub">Зафіксуйте дефект — додайте кроки відтворення</div>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="empty">
          <Ic.Layout sz={36} />
          <h4>Немає проєктів</h4>
          <p>Спершу створіть проєкт, щоб додавати в нього баги</p>
          <button
            className="btn primary"
            style={{ marginTop: 14 }}
            onClick={() => navigate('/projects/new')}
          >
            <Ic.Plus sz={13} /> Створити проєкт
          </button>
        </div>
      ) : (
        <form className="card" style={{ padding: 22 }} onSubmit={submit}>
          {error && <div className="bt-error-banner">{error}</div>}

          <div className="form-grid">
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Назва *</label>
              <input
                className="inp"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                autoFocus
                placeholder="Коротко опишіть проблему"
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Опис</label>
              <textarea
                className="inp"
                rows={6}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Кроки відтворення, очікувана / фактична поведінка, середовище"
              />
            </div>
            <div className="field">
              <label>Проєкт *</label>
              <select
                className="inp"
                value={form.project}
                onChange={e => setForm(f => ({ ...f, project: Number(e.target.value) }))}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Виконавець</label>
              <select
                className="inp"
                value={form.assignee}
                onChange={e =>
                  setForm(f => ({ ...f, assignee: e.target.value ? Number(e.target.value) : '' }))
                }
              >
                <option value="">Не призначено</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Статус</label>
              <select
                className="inp"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value as IssueStatus }))}
              >
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Пріоритет</label>
              <select
                className="inp"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as IssuePriority }))}
              >
                {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Дедлайн</label>
              <input
                type="date"
                className="inp"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => navigate('/bugs')}>
              Скасувати
            </button>
            <button type="submit" className="btn primary" disabled={submitting || !form.title}>
              {submitting ? 'Створення…' : 'Створити баг'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
