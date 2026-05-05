import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge, STATUS_MAP, PRIORITY_MAP } from '../atoms/Status'
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import type {
  Attachment,
  Comment,
  Issue,
  IssueActivity,
  IssuePriority,
  IssueStatus,
  Project,
  UserShort,
} from '../api/types'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function BugDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()

  const [issue, setIssue] = useState<Issue | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [activities, setActivities] = useState<IssueActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')

  const issueId = Number(id)

  const reload = async () => {
    if (!issueId) return
    try {
      const iss = await apiGet<Issue>(`/issues/${issueId}/`)
      setIssue(iss)
      const proj = await apiGet<Project>(`/projects/${iss.project}/`)
      setProject(proj)
      const [cm, at, ac] = await Promise.all([
        listAll<Comment>(`/comments/?issue=${issueId}&page_size=100`),
        listAll<Attachment>(`/attachments/?issue=${issueId}&page_size=50`),
        listAll<IssueActivity>(`/activities/?issue=${issueId}&page_size=50`),
      ])
      setComments(cm)
      setAttachments(at)
      setActivities(ac)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не вдалося завантажити баг', 'error')
      navigate('/bugs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId])

  if (loading || !issue) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  const updateField = async (patch: Partial<Issue>) => {
    try {
      const updated = await apiPatch<Issue>(`/issues/${issue.id}/`, patch)
      setIssue(updated)
      toast.show('Оновлено', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не вдалось оновити', 'error')
    }
  }

  const submitComment = async () => {
    if (!comment.trim()) return
    try {
      await apiPost('/comments/', { issue: issue.id, body: comment })
      setComment('')
      toast.show('Коментар додано', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeComment = async (cid: number) => {
    try {
      await apiDelete(`/comments/${cid}/`)
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const uploadFile = async (file: File) => {
    const fd = new FormData()
    fd.append('issue', String(issue.id))
    fd.append('file', file)
    fd.append('name', file.name)
    try {
      await apiUpload('/attachments/', fd)
      toast.show('Файл завантажено', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка завантаження', 'error')
    }
  }

  const removeAttachment = async (aid: number) => {
    try {
      await apiDelete(`/attachments/${aid}/`)
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeIssue = async () => {
    const ok = await confirm({
      title: 'Видалити цей баг?',
      message: 'Цю дію неможливо скасувати — усі коментарі та вкладення зникнуть разом із багом.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await apiDelete(`/issues/${issue.id}/`)
      toast.show('Видалено', 'success')
      navigate('/bugs')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const members = project?.members || []
  const canEdit = !!user

  return (
    <div className="detail">
      <div className="detail-main">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <h1 className="detail-title" style={{ flex: 1 }}>
            {issue.title}
          </h1>
          {canEdit && (
            <button className="btn ghost icon" title="Видалити" onClick={removeIssue}>
              <Ic.Trash sz={14} />
            </button>
          )}
        </div>
        <div className="detail-meta">
          <span className="id">BUG-{issue.id}</span>
          <span>·</span>
          <span>створено {formatWhen(issue.created_at)}</span>
          {issue.due_date && (
            <>
              <span>·</span>
              <span style={{ color: new Date(issue.due_date) < new Date() && issue.status !== 'done' ? 'var(--st-open-fg)' : 'inherit' }}>
                <Ic.Calendar sz={11} /> до {issue.due_date}
              </span>
            </>
          )}
        </div>

        <div className="section">
          <h3>Опис</h3>
          <div className="prose">
            {issue.description ? (
              issue.description.split('\n').map((line, i) => <p key={i}>{line || ' '}</p>)
            ) : (
              <p style={{ color: 'var(--fg-3)' }}>Опис не задано</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>
            Вкладення <span className="count">({attachments.length})</span>
          </h3>
          <div
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 8,
              padding: 14,
              textAlign: 'center',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--fg-3)',
              marginBottom: 10,
            }}
            onDragOver={e => {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
            }}
            onDragLeave={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
            }}
            onDrop={e => {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'
              const files = Array.from(e.dataTransfer.files)
              files.forEach(f => uploadFile(f))
            }}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.onchange = () => {
                if (input.files) Array.from(input.files).forEach(f => uploadFile(f))
              }
              input.click()
            }}
          >
            <Ic.Upload sz={20} />
            <div style={{ marginTop: 4 }}>Перетягніть файл або клікніть, щоб обрати</div>
          </div>

          {attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attachments.map(a => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    background: 'var(--surface-2)',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <Ic.Paperclip sz={14} />
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      color: 'var(--fg)',
                      textDecoration: 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {a.name}
                  </a>
                  <span style={{ color: 'var(--fg-3)', fontSize: 11.5 }}>
                    {formatWhen(a.created_at)}
                  </span>
                  <button
                    className="btn ghost icon sm"
                    onClick={() => removeAttachment(a.id)}
                    title="Видалити"
                  >
                    <Ic.X sz={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section">
          <h3>
            Коментарі <span className="count">({comments.length})</span>
          </h3>
          {user && (
            <div className="comment-input">
              <Avatar user={user} />
              <div className="box">
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Напишіть коментар…"
                />
                <div className="actions">
                  <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                    Підтримує @згадки користувачів
                  </span>
                  <div className="right">
                    <button
                      className="btn primary sm"
                      disabled={!comment.trim()}
                      onClick={submitComment}
                    >
                      Додати
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            {comments.length === 0 ? (
              <div className="empty">
                <Ic.Comment sz={28} />
                <p>Поки немає коментарів</p>
              </div>
            ) : (
              comments.map(c => (
                <div key={c.id} className="comment">
                  <Avatar user={c.author} />
                  <div>
                    <div className="head">
                      <b>{c.author.username}</b>
                      <span className="when">{formatWhen(c.created_at)}</span>
                      {user && c.author.id === user.id && (
                        <button
                          className="btn ghost icon sm"
                          style={{ marginLeft: 'auto' }}
                          onClick={() => removeComment(c.id)}
                          title="Видалити"
                        >
                          <Ic.Trash sz={12} />
                        </button>
                      )}
                    </div>
                    <div className="body">
                      {c.body.split('\n').map((l, i) => (
                        <p key={i}>{l || ' '}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {activities.length > 0 && (
          <div className="section">
            <h3>
              Історія <span className="count">({activities.length})</span>
            </h3>
            <div className="history">
              {activities.map(a => (
                <div key={a.id} className="h-row">
                  <div className="ico">
                    <Ic.Activity sz={11} />
                  </div>
                  <div>
                    <b>{a.user.username}</b> {actionLabel(a.action)}
                    {(a.old_value || a.new_value) && (
                      <>
                        {' '}— <span style={{ color: 'var(--fg-3)' }}>
                          {a.old_value && <>з «{a.old_value}»</>} {a.new_value && <>→ «{a.new_value}»</>}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="when">{formatWhen(a.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="detail-side">
        <div className="card" style={{ padding: 14 }}>
          <SideRow label="Статус">
            <select
              className="select"
              value={issue.status}
              onChange={e => updateField({ status: e.target.value as IssueStatus })}
              style={{ width: '100%' }}
            >
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </SideRow>
          <SideRow label="Пріоритет">
            <select
              className="select"
              value={issue.priority}
              onChange={e => updateField({ priority: e.target.value as IssuePriority })}
              style={{ width: '100%' }}
            >
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </SideRow>
          <SideRow label="Виконавець">
            <select
              className="select"
              value={issue.assignee || ''}
              onChange={e => updateField({ assignee: e.target.value ? Number(e.target.value) : null })}
              style={{ width: '100%' }}
            >
              <option value="">Не призначено</option>
              {members.map((m: UserShort) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </select>
          </SideRow>
          <SideRow label="Дедлайн">
            <input
              type="date"
              className="inp"
              value={issue.due_date || ''}
              onChange={e => updateField({ due_date: e.target.value || null })}
              style={{ width: '100%' }}
            />
          </SideRow>
          <SideRow label="Автор">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Avatar user={issue.reporter} />
              <span style={{ fontSize: 13 }}>{issue.reporter.username}</span>
            </div>
          </SideRow>
          <SideRow label="Проєкт">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="pdot" style={{ width: 8, height: 8, borderRadius: 50, background: 'var(--accent)' }} />
              <span style={{ fontSize: 13 }}>{project?.name || '—'}</span>
            </div>
          </SideRow>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <h4 style={{ margin: 0 }}>
            <Ic.Eye sz={11} /> Поточний стан
          </h4>
          <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <StatusPill value={issue.status} />
            <PriorityBadge value={issue.priority} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SideRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="side-row">
      <span className="lbl">{label}</span>
      <span className="val">{children}</span>
    </div>
  )
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    created: 'створив(ла) баг',
    status_changed: 'змінив(ла) статус',
    priority_changed: 'змінив(ла) пріоритет',
    assignee_changed: 'переназначив(ла)',
    title_changed: 'перейменував(ла)',
    due_date_changed: 'змінив(ла) дедлайн',
    comment_added: 'додав(ла) коментар',
    bulk_updated: 'оновив(ла)',
  }
  return map[action] || action
}
