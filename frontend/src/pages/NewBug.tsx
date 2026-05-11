/**
 * Сторінка створення нового багу — за макетом прототипу:
 *  - двоколонковий form-layout (form-main + form-side)
 *  - великий title-input з підказкою
 *  - markdown-toolbar над описом
 *  - кроки відтворення з номерами + блоки очікуваного / фактичного
 *  - dropzone для вкладень + чіпи прикріплених файлів (uploadи відкладені до save)
 *  - sidebar: проєкт, статус, пріоритет (pri-picker), виконавець, теги, дедлайн
 *  - блок "Середовище" (Env / Browser / OS / Version) — зберігається у custom_fields
 *  - блок "Звʼязки" (плейсхолдер під майбутні relations)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { PriorityBadge, PRIORITY_MAP, STATUS_MAP } from '../atoms/Status'
import { apiGet, apiPatch, apiPost, apiUpload, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'
import { displayName } from '../utils/user'

const DRAFT_KEY = 'bt:newbug:draft'

// Поля чернетки, що серіалізуються у localStorage (без файлів)
interface DraftShape {
  project: number | null
  title: string
  description: string
  status: IssueStatus
  priority: IssuePriority
  assignee: number | null
  dueDate: string
  steps: string[]
  expectedResult: string
  actualResult: string
  tags: string[]
  env: string
  browser: string
  os: string
  version: string
}

interface PendingFile {
  id: string
  file: File
  name: string
  size: number
  isImage: boolean
}

const ENV_OPTIONS = ['Production', 'Staging', 'Development', 'Local']
const BROWSER_OPTIONS = ['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera', 'Mobile Safari', '—']
const OS_OPTIONS = ['macOS', 'Windows 11', 'Windows 10', 'Linux', 'iOS', 'Android', '—']

// Ключі localStorage для збереження кастомних значень середовища між сесіями.
const CUSTOM_KEYS = {
  env: 'bt:newbug:custom:env',
  browser: 'bt:newbug:custom:browser',
  os: 'bt:newbug:custom:os',
} as const

function loadCustom(key: string): string[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(x => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveCustom(key: string, values: string[]): void {
  localStorage.setItem(key, JSON.stringify(values))
}

/**
 * Select з можливістю додати власне значення.
 * При виборі опції "+ Додати своє…" переключається у режим вводу,
 * додані значення зберігаються у localStorage і памʼятаються між сесіями.
 */
interface EditableSelectProps {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  storageKey: string
  placeholder?: string
}

function EditableSelect({
  value,
  onChange,
  options,
  storageKey,
  placeholder,
}: EditableSelectProps) {
  const [custom, setCustom] = useState<string[]>(() => loadCustom(storageKey))
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const allOptions = useMemo(() => {
    const seen = new Set<string>()
    const merged: string[] = []
    for (const o of [...options, ...custom]) {
      if (o && !seen.has(o)) {
        seen.add(o)
        merged.push(o)
      }
    }
    return merged
  }, [options, custom])

  const commit = () => {
    const v = draft.trim()
    if (!v) {
      setEditing(false)
      return
    }
    if (!custom.includes(v) && !options.includes(v)) {
      const next = [...custom, v]
      setCustom(next)
      saveCustom(storageKey, next)
    }
    onChange(v)
    setDraft('')
    setEditing(false)
  }

  const removeCustom = (v: string) => {
    const next = custom.filter(x => x !== v)
    setCustom(next)
    saveCustom(storageKey, next)
    if (value === v && options[0]) onChange(options[0])
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
        <input
          className="inp"
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commit()
            } else if (e.key === 'Escape') {
              setDraft('')
              setEditing(false)
            }
          }}
          placeholder={placeholder || 'Введіть значення…'}
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="btn icon ghost sm"
          onClick={commit}
          title="Підтвердити"
        >
          <Ic.Check sz={11} />
        </button>
        <button
          type="button"
          className="btn icon ghost sm"
          onClick={() => {
            setDraft('')
            setEditing(false)
          }}
          title="Скасувати"
        >
          <Ic.X sz={11} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
      <select
        className="inp"
        style={{ flex: 1 }}
        value={value}
        onChange={e => {
          if (e.target.value === '__add__') {
            setDraft('')
            setEditing(true)
          } else {
            onChange(e.target.value)
          }
        }}
      >
        {allOptions.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option disabled>──────</option>
        <option value="__add__">+ Додати своє…</option>
      </select>
      {custom.includes(value) && (
        <button
          type="button"
          className="btn icon ghost sm"
          onClick={() => removeCustom(value)}
          title="Видалити з історії"
        >
          <Ic.X sz={11} />
        </button>
      )}
    </div>
  )
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Зворот `buildDescription` — розпарсити markdown-опис на компоненти.
 * Виокремлюємо preamble (текст до першого ###) і список кроків з блоку "### Кроки відтворення".
 * Решта блоків (Очікуваний/Фактичний/Середовище) ігноруються — вони є в custom_fields.
 */
function parseDescription(md: string): { preamble: string; steps: string[] } {
  if (!md) return { preamble: '', steps: [] }
  const lines = md.split('\n')
  const preambleLines: string[] = []
  const steps: string[] = []
  let section: 'preamble' | 'steps' | 'other' = 'preamble'
  for (const raw of lines) {
    const h = raw.match(/^###\s+(.*)$/)
    if (h) {
      const title = h[1].trim().toLowerCase()
      if (title.includes('крок')) section = 'steps'
      else section = 'other'
      continue
    }
    if (section === 'preamble') {
      preambleLines.push(raw)
    } else if (section === 'steps') {
      const m = raw.match(/^\s*\d+\.\s*(.*)$/)
      if (m && m[1].trim()) steps.push(m[1].trim())
    }
  }
  return { preamble: preambleLines.join('\n').trim(), steps }
}

interface BugFormPageProps {
  mode?: 'new' | 'edit'
}

export function NewBugPage({ mode = 'new' }: BugFormPageProps = {}) {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { id: editId } = useParams<{ id?: string }>()
  const isEdit = mode === 'edit' && !!editId

  const [projects, setProjects] = useState<Project[]>([])
  const [project, setProject] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('open')
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [assignee, setAssignee] = useState<number | null>(null)
  const [dueDate, setDueDate] = useState('')

  // Кроки відтворення (масив рядків)
  const [steps, setSteps] = useState<string[]>([''])
  const [expectedResult, setExpectedResult] = useState('')
  const [actualResult, setActualResult] = useState('')

  // Теги — як вільний список рядків (бекенд має модель Label, але тут зберігаємо у custom_fields)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Середовище
  const [env, setEnv] = useState(ENV_OPTIONS[0])
  const [browser, setBrowser] = useState(BROWSER_OPTIONS[0])
  const [os, setOs] = useState(OS_OPTIONS[0])
  const [version, setVersion] = useState('')

  // Вкладення (відкладене завантаження після створення issue)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Підказки AI-помічника на основі схожих заголовків (фронт-сайд fuzzy match,
  // поки немає бекенд-ендпоінта для семантичного пошуку).
  const [allIssues, setAllIssues] = useState<Issue[]>([])

  useEffect(() => {
    void (async () => {
      const [ps, iss] = await Promise.all([
        listAll<Project>('/projects/?page_size=50'),
        listAll<Issue>('/issues/?page_size=200').catch(() => [] as Issue[]),
      ])
      setProjects(ps)
      setAllIssues(iss)

      // Edit-режим: завантажити існуючий баг і заповнити форму
      if (isEdit && editId) {
        try {
          const existing = await apiGet<Issue>(`/issues/${editId}/`)
          setProject(existing.project)
          setTitle(existing.title)
          setStatus(existing.status)
          setPriority(existing.priority)
          setAssignee(existing.assignee)
          setDueDate(existing.due_date || '')
          const { preamble, steps: parsedSteps } = parseDescription(existing.description || '')
          setDescription(preamble)
          setSteps(parsedSteps.length ? parsedSteps : [''])
          const cf = (existing.custom_fields || {}) as Record<string, unknown>
          setExpectedResult(typeof cf.expected_result === 'string' ? cf.expected_result : '')
          setActualResult(typeof cf.actual_result === 'string' ? cf.actual_result : '')
          setTags(Array.isArray(cf.tags) ? (cf.tags as string[]) : [])
          setEnv(typeof cf.env === 'string' ? cf.env : ENV_OPTIONS[0])
          setBrowser(typeof cf.browser === 'string' ? cf.browser : BROWSER_OPTIONS[0])
          setOs(typeof cf.os === 'string' ? cf.os : OS_OPTIONS[0])
          setVersion(typeof cf.version === 'string' ? cf.version : '')
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Не вдалося завантажити баг')
        }
        return
      }

      // New-режим: пробуємо відновити чернетку
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) {
        try {
          const d = JSON.parse(raw) as DraftShape
          setProject(d.project ?? (ps[0]?.id ?? null))
          setTitle(d.title || '')
          setDescription(d.description || '')
          setStatus(d.status || 'open')
          setPriority(d.priority || 'medium')
          setAssignee(d.assignee ?? null)
          setDueDate(d.dueDate || '')
          setSteps(d.steps?.length ? d.steps : [''])
          setExpectedResult(d.expectedResult || '')
          setActualResult(d.actualResult || '')
          setTags(d.tags || [])
          setEnv(d.env || ENV_OPTIONS[0])
          setBrowser(d.browser || BROWSER_OPTIONS[0])
          setOs(d.os || OS_OPTIONS[0])
          setVersion(d.version || '')
          return
        } catch {
          /* проігнорувати невалідну чернетку */
        }
      }
      if (ps[0]) setProject(ps[0].id)
    })()
  }, [isEdit, editId])

  const currentProject = useMemo(
    () => projects.find(p => p.id === project) || null,
    [projects, project]
  )
  const members: UserShort[] = useMemo(() => {
    if (!currentProject) return []
    return [
      currentProject.owner,
      ...currentProject.members.filter(m => m.id !== currentProject.owner.id),
    ]
  }, [currentProject])

  const addStep = () => setSteps(s => [...s, ''])
  const updateStep = (i: number, val: string) =>
    setSteps(s => s.map((x, idx) => (idx === i ? val : x)))
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i))

  const addTag = () => {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

  const onFilesSelected = (files: FileList | null) => {
    if (!files) return
    const next: PendingFile[] = Array.from(files).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
      isImage: f.type.startsWith('image/'),
    }))
    setPendingFiles(p => [...p, ...next])
  }

  const removePending = (id: string) => setPendingFiles(p => p.filter(f => f.id !== id))

  /** Зібрати markdown-опис з усіх блоків. */
  const buildDescription = (): string => {
    const parts: string[] = []
    if (description.trim()) parts.push(description.trim())
    const cleanSteps = steps.map(s => s.trim()).filter(Boolean)
    if (cleanSteps.length) {
      parts.push(
        '\n### Кроки відтворення\n' + cleanSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      )
    }
    if (expectedResult.trim()) parts.push(`\n### Очікуваний результат\n${expectedResult.trim()}`)
    if (actualResult.trim()) parts.push(`\n### Фактичний результат\n${actualResult.trim()}`)
    const envLine = [
      env && env !== '—' && `Env: ${env}`,
      browser && browser !== '—' && `Browser: ${browser}`,
      os && os !== '—' && `OS: ${os}`,
      version && `Version: ${version}`,
    ]
      .filter(Boolean)
      .join(' · ')
    if (envLine) parts.push(`\n### Середовище\n${envLine}`)
    return parts.join('\n').trim()
  }

  const saveDraft = () => {
    const d: DraftShape = {
      project,
      title,
      description,
      status,
      priority,
      assignee,
      dueDate,
      steps,
      expectedResult,
      actualResult,
      tags,
      env,
      browser,
      os,
      version,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    const t = new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    setDraftSavedAt(t)
    toast.show(`Чернетку збережено о ${t}`, 'success')
  }

  // AI-помічник: знайти схожі баги за збігом слів у заголовку (>=2 спільні токени).
  const aiSuggestions = useMemo(() => {
    const q = title.trim().toLowerCase()
    if (q.length < 4) return []
    const tokens = q.split(/\s+/).filter(t => t.length >= 3)
    if (tokens.length === 0) return []
    return allIssues
      .map(it => {
        const t = (it.title || '').toLowerCase()
        const match = tokens.filter(tok => t.includes(tok)).length
        const ratio = match / tokens.length
        return { issue: it, ratio }
      })
      .filter(x => x.ratio >= 0.5)
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 3)
  }, [title, allIssues])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!project) {
      setError('Спочатку створіть проєкт')
      return
    }
    if (!title.trim()) {
      setError('Вкажіть заголовок')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        project,
        title: title.trim(),
        description: buildDescription(),
        status,
        priority,
        custom_fields: {
          env,
          browser,
          os,
          version,
          tags,
          expected_result: expectedResult,
          actual_result: actualResult,
        },
      }
      // assignee та due_date в edit-режимі мають передаватись завжди (включно з null),
      // щоб користувач міг очистити поле. У new-режимі — лише якщо вибрано.
      if (isEdit) {
        payload.assignee = assignee
        payload.due_date = dueDate || null
      } else {
        if (assignee) payload.assignee = assignee
        if (dueDate) payload.due_date = dueDate
      }

      let saved: Issue
      if (isEdit && editId) {
        saved = await apiPatch<Issue>(`/issues/${editId}/`, payload)
      } else {
        saved = await apiPost<Issue>('/issues/', payload)
      }

      // Завантажуємо вкладення, якщо є (тільки нові)
      if (pendingFiles.length) {
        await Promise.all(
          pendingFiles.map(p => {
            const fd = new FormData()
            fd.append('issue', String(saved.id))
            fd.append('file', p.file)
            fd.append('name', p.name)
            return apiUpload('/attachments/', fd).catch(() => null)
          })
        )
      }

      if (!isEdit) localStorage.removeItem(DRAFT_KEY)
      toast.show(isEdit ? 'Збережено' : 'Баг створено', 'success')
      navigate(`/bugs/${saved.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : isEdit ? 'Помилка збереження' : 'Помилка створення')
    } finally {
      setSubmitting(false)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="page" style={{ maxWidth: 820 }}>
        <div className="empty" style={{ marginTop: 60 }}>
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
            onClick={() => navigate('/bugs')}
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
              {isEdit ? `BUG-${editId}` : 'Новий баг'}
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              {isEdit ? 'Редагування бага' : 'Опишіть проблему'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isEdit && draftSavedAt && (
              <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                Збережено о {draftSavedAt}
              </span>
            )}
            {!isEdit && (
              <button type="button" className="btn" onClick={saveDraft}>
                Зберегти чернетку
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => navigate(isEdit && editId ? `/bugs/${editId}` : '/bugs')}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !title.trim()}
            >
              {isEdit ? (
                submitting ? 'Збереження…' : 'Зберегти'
              ) : (
                <>
                  <Ic.Plus sz={13} /> {submitting ? 'Створення…' : 'Створити баг'}
                </>
              )}
            </button>
          </div>
        </div>

        {error && <div className="bt-error-banner">{error}</div>}

        <div className="form-layout">
          <div className="form-main">
            {/* Великий заголовок */}
            <div className="big-title-input">
              <input
                className="big-input"
                placeholder="Короткий заголовок проблеми…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
                required
              />
              <div className="hint">Стисло, як у git commit. Деталі — нижче.</div>
            </div>

            {/* AI-помічник: схожі баги */}
            {aiSuggestions.length > 0 && (
              <div className="ai-card" style={{ marginTop: 18 }}>
                <div className="head">
                  <Ic.AI sz={14} style={{ color: 'var(--accent-soft-fg)' }} />
                  <b>AI-помічник</b>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)' }}>
                    Знайдено {aiSuggestions.length}{' '}
                    {aiSuggestions.length === 1 ? 'схожий баг' : 'схожих багів'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  {aiSuggestions.map(({ issue, ratio }) => (
                    <div key={issue.id} className="ai-suggest">
                      <span className="id-cell">BUG-{issue.id}</span>
                      <span style={{ flex: 1 }}>{issue.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                        {Math.round(ratio * 100)}% збіг
                      </span>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => navigate(`/bugs/${issue.id}`)}
                      >
                        Відкрити
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Опис з markdown-toolbar */}
            <div className="form-section">
              <label className="form-lbl">Опис</label>
              <div className="md-toolbar">
                <button type="button" title="Heading"><b>H</b></button>
                <button type="button" title="Bold"><b>B</b></button>
                <button type="button" title="Italic"><i>I</i></button>
                <span className="sep" />
                <button type="button" title="List">≡</button>
                <button type="button" title="Code">{'<>'}</button>
                <button type="button" title="Link"><Ic.Link sz={11} /></button>
                <span className="sep" />
                <button
                  type="button"
                  title="Attach"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Ic.Paperclip sz={11} />
                </button>
                <button type="button" title="Image">
                  <Ic.Image sz={11} />
                </button>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  Markdown <span className="kbd">M</span>
                </span>
              </div>
              <textarea
                className="md-area"
                rows={5}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Що саме не працює? У якому контексті виникає? Що вже пробували?"
              />
            </div>

            {/* Кроки відтворення */}
            <div className="form-section">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <label className="form-lbl">Кроки відтворення</label>
                <button type="button" className="btn sm ghost" onClick={addStep}>
                  <Ic.Plus sz={11} /> Додати крок
                </button>
              </div>
              <div className="steps-edit">
                {steps.map((s, i) => (
                  <div key={i} className="step-edit">
                    <div className="num">{i + 1}</div>
                    <input
                      className="step-inp"
                      placeholder={i === 0 ? 'Перший крок…' : 'Наступний крок…'}
                      value={s}
                      onChange={e => updateStep(i, e.target.value)}
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        className="btn icon ghost sm"
                        onClick={() => removeStep(i)}
                        title="Видалити"
                      >
                        <Ic.X sz={11} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="step-edit expected">
                  <div
                    className="num"
                    style={{
                      background: 'var(--st-resolved-bg)',
                      color: 'var(--st-resolved-fg)',
                      borderColor: 'transparent',
                    }}
                  >
                    ✓
                  </div>
                  <input
                    className="step-inp"
                    placeholder="Очікуваний результат…"
                    value={expectedResult}
                    onChange={e => setExpectedResult(e.target.value)}
                  />
                </div>
                <div className="step-edit expected">
                  <div
                    className="num"
                    style={{
                      background: 'var(--st-open-bg)',
                      color: 'var(--st-open-fg)',
                      borderColor: 'transparent',
                    }}
                  >
                    ✗
                  </div>
                  <input
                    className="step-inp"
                    placeholder="Фактичний результат…"
                    value={actualResult}
                    onChange={e => setActualResult(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Вкладення */}
            <div className="form-section">
              <label className="form-lbl">Вкладення</label>
              <div
                className="dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                }}
                onDragLeave={e => {
                  ;(e.currentTarget as HTMLElement).style.borderColor = ''
                }}
                onDrop={e => {
                  e.preventDefault()
                  ;(e.currentTarget as HTMLElement).style.borderColor = ''
                  onFilesSelected(e.dataTransfer.files)
                }}
              >
                <Ic.Upload sz={20} />
                <div>
                  <b>Перетягніть файли сюди</b>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                    або{' '}
                    <span
                      style={{
                        color: 'var(--accent-soft-fg)',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      оберіть з компʼютера
                    </span>{' '}
                    · до 25 MB · PNG, JPG, MP4, HAR, JSON
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={e => onFilesSelected(e.target.files)}
                />
              </div>
              {pendingFiles.length > 0 && (
                <div
                  style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}
                >
                  {pendingFiles.map(p => (
                    <div key={p.id} className="att-chip">
                      <span className="att-ico">
                        {p.isImage ? <Ic.Image sz={12} /> : <Ic.Paperclip sz={12} />}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                          {formatBytes(p.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn icon ghost sm"
                        onClick={() => removePending(p.id)}
                      >
                        <Ic.X sz={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="form-side">
            <div className="form-card">
              <div className="fc-row">
                <span className="fc-lbl">Проєкт</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={project ?? ''}
                  onChange={e => setProject(Number(e.target.value))}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Статус</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={status}
                  onChange={e => setStatus(e.target.value as IssueStatus)}
                >
                  {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Пріоритет</span>
                <div className="pri-picker">
                  {Object.keys(PRIORITY_MAP).map(k => (
                    <button
                      type="button"
                      key={k}
                      className={`pri-opt ${priority === k ? 'active' : ''}`}
                      onClick={() => setPriority(k as IssuePriority)}
                      title={PRIORITY_MAP[k as IssuePriority].label}
                    >
                      <PriorityBadge value={k as IssuePriority} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Виконавець</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={assignee ?? ''}
                  onChange={e =>
                    setAssignee(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Не призначено</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {displayName(m)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Reporter</span>
                {user && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      fontSize: 13,
                    }}
                  >
                    <Avatar user={user} /> {displayName(user)}
                  </div>
                )}
              </div>
              <div className="fc-row" style={{ alignItems: 'flex-start' }}>
                <span className="fc-lbl">Теги</span>
                <div className="tag-picker" style={{ flex: 1 }}>
                  {tags.map(t => (
                    <span
                      key={t}
                      className="tag"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent-soft-fg)',
                        borderColor: 'transparent',
                      }}
                    >
                      {t}{' '}
                      <Ic.X
                        sz={9}
                        style={{ marginLeft: 3, cursor: 'pointer' }}
                        onClick={() => removeTag(t)}
                      />
                    </span>
                  ))}
                  <input
                    className="inp"
                    placeholder="Додати тег…"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    style={{
                      flex: 1,
                      minWidth: 80,
                      height: 24,
                      fontSize: 12,
                      padding: '0 8px',
                    }}
                  />
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Дедлайн</span>
                <input
                  type="date"
                  className="inp"
                  style={{ flex: 1 }}
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Середовище</div>
              <div className="fc-row">
                <span className="fc-lbl">Env</span>
                <EditableSelect
                  value={env}
                  onChange={setEnv}
                  options={ENV_OPTIONS}
                  storageKey={CUSTOM_KEYS.env}
                  placeholder="Наприклад: QA / Preview"
                />
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Браузер</span>
                <EditableSelect
                  value={browser}
                  onChange={setBrowser}
                  options={BROWSER_OPTIONS}
                  storageKey={CUSTOM_KEYS.browser}
                  placeholder="Наприклад: Brave 1.62"
                />
              </div>
              <div className="fc-row">
                <span className="fc-lbl">ОС</span>
                <EditableSelect
                  value={os}
                  onChange={setOs}
                  options={OS_OPTIONS}
                  storageKey={CUSTOM_KEYS.os}
                  placeholder="Наприклад: ChromeOS / FreeBSD"
                />
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Версія</span>
                <input
                  className="inp"
                  style={{ flex: 1 }}
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="наприклад, 4.18.2"
                />
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Звʼязки</div>
              <button
                type="button"
                className="btn sm"
                style={{ width: '100%', justifyContent: 'flex-start' }}
                disabled
                title="Зʼявиться після створення багу"
              >
                <Ic.Branch sz={12} /> Звʼязати з PR / commit
              </button>
              <button
                type="button"
                className="btn sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  marginTop: 6,
                }}
                disabled
                title="Зʼявиться після створення багу"
              >
                <Ic.Beaker sz={12} /> Звʼязати з тест-кейсом
              </button>
              <button
                type="button"
                className="btn sm"
                style={{
                  width: '100%',
                  justifyContent: 'flex-start',
                  marginTop: 6,
                }}
                disabled
                title="Зʼявиться після створення багу"
              >
                <Ic.Bug sz={12} /> Звʼязати з іншим багом
              </button>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
