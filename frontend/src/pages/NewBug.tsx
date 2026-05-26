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
import { PriorityBadge, PRIORITY_MAP } from '../atoms/Status'
import { useWorkflow } from '../hooks/useWorkflow'
import { apiGet, apiPatch, apiPost, apiUpload, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import type { Issue, IssuePriority, IssueStatus, Project, UserShort } from '../api/types'
import { displayName } from '../utils/user'
import { parseDescription } from '../utils/description'
import { AssigneePicker } from '../components/AssigneePicker'
import { DuplicatePanel } from '../components/DuplicatePanel'

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

// parseDescription винесений у utils/description.ts — спільне джерело
// істини з BugDetail (де він використовується для відображення).

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
  const { statuses: workflowStatuses } = useWorkflow(project)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('open')
  // workflow_status id (FK). Заповнюється при завантаженні існуючого бага
  // і при виборі статусу з dropdown. Передається у PATCH замість legacy
  // `status` — щоб працювали кастомні статуси проєкту (напр. «Заблоковано»).
  const [workflowStatusId, setWorkflowStatusId] = useState<number | null>(null)
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

  // (історичний state allIssues видалено разом зі старим fuzzy-match;
  // підказки тепер живуть у DuplicatePanel через /api/ai/duplicates)

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)

      // Edit-режим: завантажити існуючий баг і заповнити форму
      if (isEdit && editId) {
        try {
          const existing = await apiGet<Issue>(`/issues/${editId}/`)
          setProject(existing.project)
          setTitle(existing.title)
          setStatus(existing.status)
          setWorkflowStatusId(existing.workflow_status ?? null)
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

  // Refs на input'и кроків — щоб після Enter сфокусуватись на новому кроці,
  // а після Backspace на порожньому — повернутись до попереднього.
  const stepRefs = useRef<(HTMLInputElement | null)[]>([])
  // Куди сфокусуватись після наступного рендеру (індекс кроку).
  const [focusStepIdx, setFocusStepIdx] = useState<number | null>(null)
  useEffect(() => {
    if (focusStepIdx === null) return
    const el = stepRefs.current[focusStepIdx]
    if (el) el.focus()
    setFocusStepIdx(null)
  }, [focusStepIdx])

  const addStep = () => {
    setSteps(s => {
      setFocusStepIdx(s.length)
      return [...s, '']
    })
  }
  const updateStep = (i: number, val: string) =>
    setSteps(s => s.map((x, idx) => (idx === i ? val : x)))
  const removeStep = (i: number) => setSteps(s => s.filter((_, idx) => idx !== i))

  const handleStepKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Не сабмітимо форму. Якщо поточний крок порожній — не плодимо ще
      // один порожній; просто гасимо натискання, фокус лишається тут.
      e.preventDefault()
      if (steps[i].trim() === '') return
      setSteps(s => {
        const next = [...s]
        next.splice(i + 1, 0, '')
        setFocusStepIdx(i + 1)
        return next
      })
    } else if (e.key === 'Backspace' && steps[i] === '' && steps.length > 1) {
      // Видаляємо порожній крок і переходимо до попереднього (або до 0,
      // якщо видаляли перший).
      e.preventDefault()
      const prevIdx = Math.max(0, i - 1)
      removeStep(i)
      setFocusStepIdx(prevIdx)
    }
  }

  // Drag-and-drop reorder для кроків. Native HTML5 DnD, без зайвих залежностей.
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const onStepDrop = (toIdx: number) => {
    if (dragIdx === null || dragIdx === toIdx) {
      setDragIdx(null)
      setHoverIdx(null)
      return
    }
    setSteps(arr => {
      const next = [...arr]
      const [item] = next.splice(dragIdx, 1)
      next.splice(toIdx, 0, item)
      return next
    })
    setDragIdx(null)
    setHoverIdx(null)
  }

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
        // Шлемо workflow_status id (а не legacy status key), щоб працювали
        // кастомні статуси проєкту. Якщо id ще немає (новий баг без явного
        // вибору) — fallback на status key.
        ...(workflowStatusId !== null
          ? { workflow_status: workflowStatusId }
          : { status }),
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
      // Сповіщаємо Sidebar/Dashboard про зміну, щоб лічильник багів оновився
      // без перезавантаження сторінки.
      window.dispatchEvent(new CustomEvent('issue:changed'))
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
            {/* Великий заголовок — textarea з автопереносом, щоб довгі назви не обрізались */}
            <div className="big-title-input">
              <textarea
                className="big-input"
                placeholder="Короткий заголовок проблеми…"
                value={title}
                onChange={e => {
                  setTitle(e.target.value)
                  const ta = e.target as HTMLTextAreaElement
                  ta.style.height = 'auto'
                  ta.style.height = ta.scrollHeight + 'px'
                }}
                onKeyDown={e => {
                  // Enter не має створювати новий рядок у заголовку.
                  if (e.key === 'Enter') e.preventDefault()
                }}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = el.scrollHeight + 'px'
                  }
                }}
                rows={1}
                autoFocus
                required
                style={{ resize: 'none', overflow: 'hidden', lineHeight: 1.3 }}
              />
              <div className="hint">Стисло, як у git commit. Деталі — нижче.</div>
            </div>

            {/* AI-помічник: схожі баги (backend pg_trgm similarity) */}
            {!isEdit && (
              <DuplicatePanel
                title={title}
                description={description}
                project={project}
              />
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
              <label className="form-lbl">Кроки відтворення</label>
              <div className="steps-edit">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="step-edit"
                    onDragOver={e => {
                      e.preventDefault()
                      if (dragIdx !== null && hoverIdx !== i) setHoverIdx(i)
                    }}
                    onDragLeave={() => {
                      if (hoverIdx === i) setHoverIdx(null)
                    }}
                    onDrop={() => onStepDrop(i)}
                    style={{
                      opacity: dragIdx === i ? 0.4 : 1,
                      outline:
                        hoverIdx === i && dragIdx !== null && dragIdx !== i
                          ? '2px dashed var(--accent)'
                          : undefined,
                      outlineOffset: -2,
                      borderRadius: 6,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div
                      className="num"
                      draggable
                      onDragStart={() => setDragIdx(i)}
                      onDragEnd={() => {
                        setDragIdx(null)
                        setHoverIdx(null)
                      }}
                      style={{ cursor: 'grab', userSelect: 'none' }}
                      title="Перетягніть, щоб змінити порядок"
                    >
                      {i + 1}
                    </div>
                    <input
                      ref={el => {
                        stepRefs.current[i] = el
                      }}
                      className="step-inp"
                      placeholder={i === 0 ? 'Перший крок…' : 'Наступний крок…'}
                      value={s}
                      onChange={e => updateStep(i, e.target.value)}
                      onKeyDown={e => handleStepKeyDown(i, e)}
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
                <div
                  className="step-edit"
                  onClick={addStep}
                  style={{ cursor: 'pointer', opacity: 0.7 }}
                  title="Додати ще один крок"
                >
                  <div
                    className="num"
                    style={{
                      background: 'transparent',
                      border: '1px dashed var(--border-strong)',
                      color: 'var(--fg-3)',
                    }}
                  >
                    +
                  </div>
                  <span
                    style={{
                      flex: 1,
                      color: 'var(--fg-3)',
                      fontSize: 13.5,
                      padding: '6px 0',
                    }}
                  >
                    Додати крок…
                  </span>
                </div>
              </div>
            </div>

            {/* Окремий блок: бажаний і фактичний результат — раніше були
                всередині списку кроків, що плутало тестерів. Тепер це
                власна секція з двома полями і власними label'ами. */}
            <div className="form-section">
              <label className="form-lbl">Очікуваний і фактичний результат</label>
              <div className="result-fields">
                <div className="step-edit">
                  <div
                    className="num"
                    style={{
                      background: 'var(--st-resolved-bg)',
                      color: 'var(--st-resolved-fg)',
                      borderColor: 'transparent',
                    }}
                    title="Очікуваний результат"
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
                <div className="step-edit">
                  <div
                    className="num"
                    style={{
                      background: 'var(--st-open-bg)',
                      color: 'var(--st-open-fg)',
                      borderColor: 'transparent',
                    }}
                    title="Фактичний результат"
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
                  value={String(
                    workflowStatusId ??
                      workflowStatuses.find(s => s.key === status)?.id ??
                      ''
                  )}
                  onChange={e => {
                    const id = Number(e.target.value)
                    setWorkflowStatusId(id)
                    const ws = workflowStatuses.find(s => s.id === id)
                    if (ws) setStatus(ws.key as IssueStatus)
                  }}
                >
                  {workflowStatuses.map(s => (
                    <option key={s.id} value={String(s.id)}>
                      {s.label}
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
                <AssigneePicker
                  value={assignee}
                  onChange={setAssignee}
                  users={members}
                />
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
