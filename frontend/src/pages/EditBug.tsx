/**
 * Сторінка редагування існуючого багу — простіша версія NewBug:
 * базові поля (title, description, status, priority, assignee, due_date),
 * PATCH замість POST, без drafts і AI-suggest.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { PRIORITY_MAP } from '../atoms/Status'
import { apiGet, apiPatch } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useWorkflow } from '../hooks/useWorkflow'
import { displayName } from '../utils/user'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'

export function EditBugPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const issueId = Number(id)

  const [issue, setIssue] = useState<Issue | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('open')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [assignee, setAssignee] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState('')

  const { statuses: workflowStatuses } = useWorkflow(project?.id ?? null)

  useEffect(() => {
    if (!issueId) return
    void (async () => {
      try {
        const iss = await apiGet<Issue>(`/issues/${issueId}/`)
        const proj = await apiGet<Project>(`/projects/${iss.project}/`)
        setIssue(iss)
        setProject(proj)
        setTitle(iss.title)
        setDescription(iss.description || '')
        setStatus(iss.status)
        setPriority(iss.priority)
        setAssignee(iss.assignee)
        setDueDate(iss.due_date || '')
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Не вдалося завантажити баг', 'error')
        navigate('/bugs')
      } finally {
        setLoading(false)
      }
    })()
  }, [issueId, navigate, toast])

  const members: UserShort[] = useMemo(() => {
    if (!project) return []
    return [project.owner, ...project.members.filter(m => m.id !== project.owner.id)]
  }, [project])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issue) return
    setError(null)
    if (!title.trim()) {
      setError('Вкажіть заголовок')
      return
    }
    setSubmitting(true)
    try {
      const payload: Partial<Issue> = {
        title: title.trim(),
        description,
        status,
        priority,
        assignee,
        due_date: dueDate || null,
      }
      await apiPatch<Issue>(`/issues/${issue.id}/`, payload)
      toast.show('Збережено', 'success')
      navigate(`/bugs/${issue.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !issue) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  return (
    <div className="scroll-inner">
      <form className="form-page" onSubmit={submit}>
        <div className="form-page-head">
          <button
            type="button"
            className="btn ghost icon"
            onClick={() => navigate(`/bugs/${issue.id}`)}
            title="Назад"
          >
            <Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }} />
          </button>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--fg-3)',
              }}
            >
              BUG-{issue.id}
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              Редагування бага
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => navigate(`/bugs/${issue.id}`)}>
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !title.trim()}
            >
              {submitting ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>

        {error && <div className="bt-error-banner">{error}</div>}

        <div className="form-layout">
          <div className="form-main">
            <div className="big-title-input">
              <input
                className="big-input"
                placeholder="Короткий заголовок…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="form-section">
              <label className="form-lbl">Опис</label>
              <textarea
                className="md-area"
                rows={14}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Що саме не працює? У якому контексті виникає? Що вже пробували? Підтримує markdown — ###, **bold**, `code`."
              />
              <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
                Підтримує markdown: <code>### Заголовок</code>, <code>**жирний**</code>, <code>`код`</code>
              </div>
            </div>
          </div>

          <aside className="form-side">
            <div className="form-section">
              <label className="form-lbl">Статус</label>
              <select
                className="select"
                value={status}
                onChange={e => setStatus(e.target.value as IssueStatus)}
                style={{ width: '100%' }}
              >
                {workflowStatuses.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label className="form-lbl">Пріоритет</label>
              <select
                className="select"
                value={priority}
                onChange={e => setPriority(e.target.value as IssuePriority)}
                style={{ width: '100%' }}
              >
                {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label className="form-lbl">Виконавець</label>
              <select
                className="select"
                value={assignee ?? ''}
                onChange={e => setAssignee(e.target.value ? Number(e.target.value) : null)}
                style={{ width: '100%' }}
              >
                <option value="">Не призначено</option>
                {user && !members.find(m => m.id === user.id) && (
                  <option value={user.id}>{displayName(user)} (ви)</option>
                )}
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {displayName(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label className="form-lbl">Дедлайн</label>
              <input
                type="date"
                className="inp"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div className="form-section">
              <label className="form-lbl">Репортер</label>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--fg-2)',
                }}
              >
                <Avatar user={issue.reporter} />
                <span>{displayName(issue.reporter)}</span>
              </div>
            </div>

            <div className="form-section">
              <label className="form-lbl">Проєкт</label>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  color: 'var(--fg-2)',
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: project?.color || 'var(--accent)',
                  }}
                />
                <span>{project?.name || '—'}</span>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
