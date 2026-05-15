import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { AISummaryModal } from '../components/AISummaryModal'
import { AITestCaseModal } from '../components/AITestCaseModal'
import { Avatar } from '../atoms/Avatar'
import { StatusPill, PriorityBadge, PRIORITY_MAP } from '../atoms/Status'
import { useWorkflow } from '../hooks/useWorkflow'
import { apiDelete, apiGet, apiPatch, apiPost, apiUpload, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/ConfirmContext'
import { useGlobalShortcut } from '../hooks/useGlobalShortcut'
import { api as extras } from '../api/extras'
import { displayName } from '../utils/user'
import type { TimeLog } from '../api/extras'
import type {
  Attachment,
  Comment,
  Issue,
  IssueActivity,
  IssuePriority,
  IssueRelation,
  IssueStatus,
  Project,
  UserShort,
} from '../api/types'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('uk-UA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function parseTimeInput(s: string): number {
  const trimmed = s.trim().toLowerCase()
  if (!trimmed) return 0
  const re = /(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+)m)?/
  const m = trimmed.match(re)
  if (m && (m[1] || m[2])) {
    const h = m[1] ? parseFloat(m[1]) : 0
    const min = m[2] ? parseInt(m[2], 10) : 0
    return Math.round(h * 60 + min)
  }
  const n = parseInt(trimmed, 10)
  return Number.isFinite(n) ? n : 0
}

function isImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp|avif)$/i.test(name)
}

function formatMinutes(m: number): string {
  if (!m) return '0m'
  const h = Math.floor(m / 60)
  const min = m % 60
  if (h && min) return `${h}h ${min}m`
  if (h) return `${h}h`
  return `${min}m`
}

// Колірний градієнт для прев'ю файла за розширенням — так само як у прототипі.
function attachGradient(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (/^(png|jpe?g|gif|webp|bmp|avif|svg)$/.test(ext)) return 'linear-gradient(135deg,#FCE8E4,#F4A261)'
  if (/^(log|txt|md)$/.test(ext)) return 'linear-gradient(135deg,#DDEFDC,#4CA85C)'
  if (/^(json|xml|yaml|yml|har)$/.test(ext)) return 'linear-gradient(135deg,#ECEDFB,#5E6AD2)'
  if (/^(mov|mp4|webm|avi|mkv)$/.test(ext)) return 'linear-gradient(160deg,#1F1E1A,#3D3C38)'
  if (/^(pdf|doc|docx)$/.test(ext)) return 'linear-gradient(135deg,#FFE7C2,#E08E45)'
  if (/^(zip|tar|gz|rar|7z)$/.test(ext)) return 'linear-gradient(135deg,#E6E6E6,#6B7280)'
  return 'linear-gradient(135deg,#E4E4E7,#71717A)'
}

/** Мінімальний парсер маркдауну: `### Заг.`, **bold**, `code`, порожні рядки = новий абзац. */
function renderMarkdown(text: string) {
  if (!text) return null
  const lines = text.split('\n')
  const blocks: { kind: 'h' | 'p'; level?: number; text: string }[] = []
  let buf: string[] = []
  const flush = () => {
    if (buf.length) {
      blocks.push({ kind: 'p', text: buf.join('\n') })
      buf = []
    }
  }
  for (const raw of lines) {
    const m = raw.match(/^(#{1,4})\s+(.*)$/)
    if (m) {
      flush()
      blocks.push({ kind: 'h', level: m[1].length, text: m[2].trim() })
    } else if (raw.trim() === '') {
      flush()
    } else {
      buf.push(raw)
    }
  }
  flush()
  const inline = (s: string) => {
    const parts: (string | { code?: string; bold?: string })[] = []
    const re = /(`[^`]+`|\*\*[^*]+\*\*)/g
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(s)) !== null) {
      if (m.index > last) parts.push(s.slice(last, m.index))
      if (m[0].startsWith('`')) parts.push({ code: m[0].slice(1, -1) })
      else parts.push({ bold: m[0].slice(2, -2) })
      last = re.lastIndex
    }
    if (last < s.length) parts.push(s.slice(last))
    return parts.map((p, i) => {
      if (typeof p === 'string') return <Fragment key={i}>{p}</Fragment>
      if ('code' in p) return <code key={i}>{p.code}</code>
      return <b key={i}>{p.bold}</b>
    })
  }
  return blocks.map((b, i) => {
    if (b.kind === 'h') {
      const Tag = (b.level && b.level <= 3 ? 'h4' : 'h5') as 'h4' | 'h5'
      return (
        <Tag key={i} style={{ margin: '14px 0 6px', fontSize: 13.5, fontWeight: 600, color: 'var(--fg)' }}>
          {inline(b.text)}
        </Tag>
      )
    }
    return <p key={i}>{b.text.split('\n').map((line, j) => (
      <Fragment key={j}>{j > 0 && <br />}{inline(line)}</Fragment>
    ))}</p>
  })
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
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([])
  const [relations, setRelations] = useState<IssueRelation[]>([])
  const [loading, setLoading] = useState(true)
  const [comment, setComment] = useState('')
  const [timeMin, setTimeMin] = useState('')
  const [timeNote, setTimeNote] = useState('')
  const [lightbox, setLightbox] = useState<{ url: string; name: string } | null>(null)
  // Який рядок Властивостей зараз у режимі редагування (показуємо select замість пілки).
  const [editingField, setEditingField] = useState<null | 'status' | 'priority' | 'assignee' | 'due'>(null)
  const [starred, setStarred] = useState(false)
  const [aiSummaryOpen, setAiSummaryOpen] = useState(false)
  const [aiTestCaseOpen, setAiTestCaseOpen] = useState(false)

  const issueId = Number(id)
  const { statuses: workflowStatuses } = useWorkflow(project?.id ?? null)

  const reload = async () => {
    if (!issueId) return
    try {
      const iss = await apiGet<Issue>(`/issues/${issueId}/`)
      setIssue(iss)
      const proj = await apiGet<Project>(`/projects/${iss.project}/`)
      setProject(proj)
      const [cm, at, ac, tl, rel, st] = await Promise.all([
        listAll<Comment>(`/comments/?issue=${issueId}&page_size=100`),
        listAll<Attachment>(`/attachments/?issue=${issueId}&page_size=50`),
        listAll<IssueActivity>(`/activities/?issue=${issueId}&page_size=50`),
        extras.listTimeLogs(issueId).catch(() => [] as TimeLog[]),
        listAll<IssueRelation>(`/relations/?from_issue=${issueId}&page_size=50`).catch(() => [] as IssueRelation[]),
        listAll<{ id: number; issue: number }>(`/starred/?issue=${issueId}&page_size=1`).catch(() => []),
      ])
      setComments(cm)
      setAttachments(at)
      setActivities(ac)
      setTimeLogs(tl)
      setRelations(rel)
      setStarred(st.length > 0)
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

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightbox])

  useGlobalShortcut({
    key: 'i',
    enabled: !!user && !!issue,
    handler: () => {
      if (!user || !issue) return
      void apiPatch<Issue>(`/issues/${issue.id}/`, { assignee: user.id }).then(() => {
        toast.show('Призначено вам', 'success')
        void reload()
      })
    },
  })
  useGlobalShortcut({
    key: 'e',
    enabled: !!issue,
    handler: () => {
      if (!issue) return
      const next: IssueStatus = issue.status === 'done' ? 'open' : 'done'
      void apiPatch<Issue>(`/issues/${issue.id}/`, { status: next }).then(() => {
        toast.show(next === 'done' ? 'Позначено готовим' : 'Перевідкрито', 'success')
        void reload()
      })
    },
  })
  useGlobalShortcut({
    key: 'meta+backspace',
    enabled: !!issue,
    handler: () => {
      if (issue) void removeIssue()
    },
  })

  const assignee = useMemo<UserShort | null>(() => {
    if (!issue || !project) return null
    return project.members.find(m => m.id === issue.assignee) || null
  }, [issue, project])

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
      // Подія, на яку реагує Sidebar (лічильник inbox/багів) — у бекенду
      // _notify створив свіже сповіщення, треба перечитати.
      window.dispatchEvent(new CustomEvent('issue:changed'))
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

  const addTimeLog = async () => {
    const minutes = parseTimeInput(timeMin)
    if (!minutes || minutes <= 0) {
      toast.show('Вкажіть час: 30m, 1h30m або просто число хвилин', 'info')
      return
    }
    try {
      await extras.createTimeLog({ issue: issue.id, minutes, note: timeNote })
      setTimeMin('')
      setTimeNote('')
      toast.show('Час залоговано', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeTimeLog = async (tid: number) => {
    try {
      await extras.deleteTimeLog(tid)
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
      // Сповіщаємо Sidebar, щоб лічильник багів оновився одразу
      window.dispatchEvent(new CustomEvent('issue:changed'))
      toast.show('Видалено', 'success')
      navigate('/bugs')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleStar = async () => {
    try {
      const res = await apiPost<{ starred: boolean }>('/starred/toggle/', { issue: issue.id })
      setStarred(res.starred)
      toast.show(res.starred ? 'Додано в обране' : 'Прибрано з обраного', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const copyShareLink = async () => {
    const url = window.location.href
    // navigator.clipboard працює лише в secure context (https/localhost).
    // На HTTP-сервері використовуємо застарілий execCommand-fallback.
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(url)
        toast.show('Посилання скопійовано', 'success')
        return
      } catch {
        // падаємо в legacy-шлях нижче
      }
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.style.position = 'fixed'
      ta.style.top = '-9999px'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) toast.show('Посилання скопійовано', 'success')
      else throw new Error('execCommand failed')
    } catch {
      // Останній рятувальник: показуємо посилання в prompt, щоб юзер скопіював вручну.
      window.prompt('Скопіюйте посилання:', url)
    }
  }

  const members = project?.members || []
  const canEdit = !!user
  const relationsByType: Record<string, IssueRelation[]> = {}
  relations.forEach(r => {
    relationsByType[r.relation_type] = relationsByType[r.relation_type] || []
    relationsByType[r.relation_type].push(r)
  })

  return (
    <div className="detail">
      <div className="detail-main">
        {/* Хлібні крихти + дії праворуч */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <button className="btn ghost sm" onClick={() => navigate('/bugs')}>
            <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Усі баги
          </button>
          <span style={{ color: 'var(--fg-4)' }}>/</span>
          <span className="id-cell" style={{ fontSize: 13 }}>BUG-{issue.id}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              className="btn sm"
              title={starred ? 'Прибрати з обраного' : 'В обране'}
              onClick={toggleStar}
              style={starred ? { color: '#F4B400' } : undefined}
            >
              <Ic.Star sz={12} style={starred ? { fill: '#F4B400' } : undefined} />
            </button>
            <button className="btn sm" onClick={copyShareLink}><Ic.Link sz={12} /> Поділитись</button>
            <button
              className="btn sm"
              onClick={() => setAiTestCaseOpen(true)}
              title="Згенерувати тест-кейс з опису бага"
            >
              <Ic.AI sz={12} /> Згенерувати тест
            </button>
            {(comments?.length ?? 0) >= 3 && (
              <button
                className="btn sm"
                onClick={() => setAiSummaryOpen(true)}
                title="Стиснути тред у короткий конспект"
              >
                <Ic.AI sz={12} /> Стиснути тред
              </button>
            )}
            {canEdit && (
              <button
                className="btn sm primary"
                onClick={() => navigate(`/bugs/${issue.id}/edit`)}
                title="Редагувати"
              >
                <Ic.Edit sz={12} /> Редагувати
              </button>
            )}
            {canEdit && (
              <button className="btn sm danger" onClick={removeIssue} title="Видалити">
                <Ic.Trash sz={12} /> Видалити
              </button>
            )}
          </div>
        </div>

        {/* Заголовок (read-only — редагувати на окремій сторінці) */}
        <h1 className="detail-title">{issue.title}</h1>

        {/* Мета-рядок: ID · "відкрито Х час" · StatusPill · PriorityBadge */}
        <div className="detail-meta">
          <span className="id">BUG-{issue.id}</span>
          <span>·</span>
          <span>
            відкрито <b style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{displayName(issue.reporter)}</b> {formatWhen(issue.created_at)}
          </span>
          <span>·</span>
          <StatusPill value={issue.status} label={issue.status_display} color={issue.status_color} />
          <PriorityBadge value={issue.priority} />
          {issue.due_date && (
            <>
              <span>·</span>
              <span style={{ color: new Date(issue.due_date) < new Date() && !issue.status_is_done ? 'var(--st-open-fg)' : 'inherit' }}>
                <Ic.Calendar sz={11} /> до {issue.due_date}
              </span>
            </>
          )}
        </div>

        {/* Опис — read-only, редагування на /bugs/:id/edit */}
        <div className="section">
          <h3>Опис</h3>
          <div className="prose">
            {issue.description ? (
              renderMarkdown(issue.description)
            ) : canEdit ? (
              <p style={{ color: 'var(--fg-3)' }}>
                Опис не задано.{' '}
                <a
                  href={`/bugs/${issue.id}/edit`}
                  onClick={e => {
                    e.preventDefault()
                    navigate(`/bugs/${issue.id}/edit`)
                  }}
                  style={{ color: 'var(--accent-soft-fg)' }}
                >
                  Додати опис
                </a>
              </p>
            ) : (
              <p style={{ color: 'var(--fg-3)' }}>Опис не задано</p>
            )}
          </div>
        </div>

        {/* Вкладення — у вигляді сітки тайлів */}
        <div className="section">
          <h3>
            Вкладення <span className="count">{attachments.length} {attachments.length === 1 ? 'файл' : 'файлів'}</span>
          </h3>
          <div className="attach-grid">
            {attachments.map(a => {
              const isImg = isImageName(a.name)
              const bg = isImg ? undefined : attachGradient(a.name)
              const onClick = () => {
                if (isImg) setLightbox({ url: a.url, name: a.name })
                else window.open(a.url, '_blank', 'noopener,noreferrer')
              }
              return (
                <div
                  key={a.id}
                  className="attach"
                  style={{
                    background: bg,
                    backgroundImage: isImg ? `url(${a.url})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onClick={onClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onClick()
                    }
                  }}
                >
                  <span className="label">
                    {isImg ? <Ic.Image sz={11} /> : <Ic.Paperclip sz={11} />} {a.name}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        void removeAttachment(a.id)
                      }}
                      title="Видалити"
                      style={{
                        position: 'absolute',
                        top: 6,
                        right: 6,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Ic.X sz={10} />
                    </button>
                  )}
                </div>
              )
            })}
            <div
              className="attach"
              style={{
                background: 'transparent',
                border: '1.5px dashed var(--border-strong)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--fg-3)',
                cursor: 'pointer',
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
              <div style={{ textAlign: 'center', fontSize: 12 }}>
                <Ic.Upload sz={18} style={{ marginBottom: 6 }} />
                <div>Перетягніть файли</div>
              </div>
            </div>
          </div>
        </div>

        {/* Час роботи */}
        <div className="section">
          <h3>
            <Ic.Clock sz={12} /> Час роботи{' '}
            <span className="count">
              {formatMinutes(timeLogs.reduce((s, l) => s + l.minutes, 0))}
            </span>
          </h3>
          {user && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <input
                className="inp"
                placeholder="30m / 1h30m / 90"
                value={timeMin}
                onChange={e => setTimeMin(e.target.value)}
                style={{ width: 120 }}
              />
              <input
                className="inp"
                placeholder="Що робив(ла)? (опц.)"
                value={timeNote}
                onChange={e => setTimeNote(e.target.value)}
                style={{ flex: 1 }}
              />
              <button className="btn primary sm" onClick={addTimeLog}>
                <Ic.Plus sz={11} /> Залогувати
              </button>
            </div>
          )}
          {timeLogs.length === 0 ? (
            <div style={{ color: 'var(--fg-3)', fontSize: 12.5, padding: '6px 0' }}>
              Ще не залоговано часу
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {timeLogs.map(t => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    background: 'var(--surface-2)',
                    borderRadius: 6,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: 60 }}>
                    {formatMinutes(t.minutes)}
                  </span>
                  <span style={{ color: 'var(--fg-2)' }}>{t.user_name}</span>
                  {t.note && <span style={{ color: 'var(--fg-3)' }}>· {t.note}</span>}
                  <span style={{ color: 'var(--fg-4)', fontSize: 11, marginLeft: 'auto' }}>
                    {formatWhen(t.logged_at)}
                  </span>
                  {user && (
                    <button
                      className="btn ghost icon sm"
                      onClick={() => removeTimeLog(t.id)}
                      title="Видалити"
                    >
                      <Ic.X sz={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Коментарі */}
        <div className="section">
          <h3>
            Коментарі <span className="count">{comments.length}</span>
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
                      Надіслати
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
                      <b>{displayName(c.author)}</b>
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
                        <p key={i}>{l || ' '}</p>
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
              Історія змін <span className="count">{activities.length}</span>
            </h3>
            <div className="history">
              {activities.map(a => (
                <div key={a.id} className="h-row">
                  <div className="ico">
                    <Ic.Activity sz={11} />
                  </div>
                  <div>
                    <b>{displayName(a.user)}</b> {actionLabel(a.action)}
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

      {/* Бічна панель — 3 картки */}
      <aside className="detail-side">
        <div className="card" style={{ padding: 14 }}>
          <div className="side-section">
            <h4>Властивості</h4>
            <div className="side-row">
              <span className="lbl">Статус</span>
              <span className="val" onClick={() => canEdit && setEditingField('status')} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                {editingField === 'status' ? (
                  <select
                    autoFocus
                    className="select"
                    // Підставляємо id поточного workflow_status; якщо його ще немає
                    // (legacy issue без FK) — fallback на статус з тим самим key.
                    value={String(
                      issue.workflow_status ??
                        workflowStatuses.find(s => s.key === issue.status)?.id ??
                        ''
                    )}
                    onChange={e => {
                      const wsId = Number(e.target.value)
                      // Відправляємо workflow_status (id) — джерело істини на бекенді.
                      // legacy "status" key не використовуємо, бо кастомні значення
                      // (наприклад "blocked") не входять у Issue.Status.choices і
                      // дають 400 Bad Request на валідації DRF.
                      void updateField({ workflow_status: wsId } as Partial<Issue>)
                      setEditingField(null)
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{ width: '100%' }}
                  >
                    {workflowStatuses.map(s => (
                      <option key={s.id} value={String(s.id)}>{s.label}</option>
                    ))}
                  </select>
                ) : (
                  <StatusPill value={issue.status} label={issue.status_display} color={issue.status_color} />
                )}
              </span>
            </div>
            <div className="side-row">
              <span className="lbl">Пріоритет</span>
              <span className="val" onClick={() => canEdit && setEditingField('priority')} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                {editingField === 'priority' ? (
                  <select
                    autoFocus
                    className="select"
                    value={issue.priority}
                    onChange={e => {
                      void updateField({ priority: e.target.value as IssuePriority })
                      setEditingField(null)
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{ width: '100%' }}
                  >
                    {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                ) : (
                  <PriorityBadge value={issue.priority} />
                )}
              </span>
            </div>
            <div className="side-row">
              <span className="lbl">Виконавець</span>
              <span className="val" onClick={() => canEdit && setEditingField('assignee')} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                {editingField === 'assignee' ? (
                  <select
                    autoFocus
                    className="select"
                    value={issue.assignee || ''}
                    onChange={e => {
                      void updateField({ assignee: e.target.value ? Number(e.target.value) : null })
                      setEditingField(null)
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{ width: '100%' }}
                  >
                    <option value="">Не призначено</option>
                    {members.map((m: UserShort) => (
                      <option key={m.id} value={m.id}>{displayName(m)}</option>
                    ))}
                  </select>
                ) : assignee ? (
                  <>
                    <Avatar user={assignee} />
                    <span>{displayName(assignee)}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--fg-3)' }}>Не призначено</span>
                )}
              </span>
            </div>
            <div className="side-row">
              <span className="lbl">Репортер</span>
              <span className="val">
                <Avatar user={issue.reporter} />
                <span>{displayName(issue.reporter)}</span>
              </span>
            </div>
            <div className="side-row">
              <span className="lbl">Проєкт</span>
              <span className="val">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: project?.color || 'var(--accent)', display: 'inline-block' }} />
                <span>{project?.name || '—'}</span>
              </span>
            </div>
            <div className="side-row">
              <span className="lbl">Дедлайн</span>
              <span className="val" onClick={() => canEdit && setEditingField('due')} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
                {editingField === 'due' ? (
                  <input
                    autoFocus
                    type="date"
                    className="inp"
                    value={issue.due_date || ''}
                    onChange={e => {
                      void updateField({ due_date: e.target.value || null })
                      setEditingField(null)
                    }}
                    onBlur={() => setEditingField(null)}
                    style={{ width: '100%' }}
                  />
                ) : issue.due_date ? (
                  <span className="tag">{issue.due_date}</span>
                ) : (
                  <span style={{ color: 'var(--fg-3)' }}>—</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="side-section">
            <h4>Зв'язки</h4>
            {(['blocks', 'blocked_by', 'relates_to', 'duplicate_of'] as const).map(rt => {
              const items = relationsByType[rt] || []
              const labels: Record<typeof rt, string> = {
                blocks: 'Блокує',
                blocked_by: 'Заблоковано',
                relates_to: 'Повʼязано з',
                duplicate_of: 'Дублікат до',
              }
              return (
                <div key={rt} className="side-row" style={{ alignItems: 'flex-start' }}>
                  <span className="lbl">{labels[rt]}</span>
                  <span className="val" style={{ flexWrap: 'wrap' }}>
                    {items.length === 0 ? (
                      <span style={{ color: 'var(--fg-3)' }}>—</span>
                    ) : (
                      items.map(r => (
                        <a
                          key={r.id}
                          href={`/bugs/${r.to_issue}`}
                          onClick={e => {
                            e.preventDefault()
                            navigate(`/bugs/${r.to_issue}`)
                          }}
                          className="id-cell"
                          style={{ color: 'var(--accent-soft-fg)', fontWeight: 500, textDecoration: 'none' }}
                          title={r.to_issue_title}
                        >
                          BUG-{r.to_issue}
                        </a>
                      ))
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 14 }}>
          <div className="side-section">
            <h4>Активність</h4>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--fg-3)' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                  {comments.length}
                </div>
                коментарів
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                  {attachments.length}
                </div>
                файлів
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>
                  {activities.length}
                </div>
                подій
              </div>
            </div>
          </div>
        </div>
      </aside>

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.name}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'zoom-out',
            padding: 24,
            overflow: 'auto',
          }}
        >
          <img
            src={lightbox.url}
            alt={lightbox.name}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 'calc(100vw - 48px)',
              maxHeight: 'calc(100vh - 96px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              borderRadius: 8,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              cursor: 'default',
            }}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            title="Закрити (Esc)"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              fontSize: 18,
            }}
          >
            ✕
          </button>
          <a
            href={lightbox.url}
            download={lightbox.name}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'white',
              fontSize: 12,
              textDecoration: 'underline',
              opacity: 0.85,
            }}
          >
            {lightbox.name} — завантажити
          </a>
        </div>
      )}

      {aiSummaryOpen && (
        <AISummaryModal
          issueId={issue.id}
          onClose={() => setAiSummaryOpen(false)}
        />
      )}
      {aiTestCaseOpen && (
        <AITestCaseModal
          issueId={issue.id}
          projectId={issue.project}
          onClose={() => setAiTestCaseOpen(false)}
        />
      )}
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
