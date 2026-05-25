/**
 * Сторінка редагування тест-кейсу — структура така ж як NewTest:
 *  - двоколонковий form-layout
 *  - title, опис/передумови, кроки, вкладення
 *  - sidebar: Suite, Тип (картки), Пріоритет, Виконавець, Тривалість
 *  - Категорії, Запуск (браузери / CI)
 * Відмінності: PATCH замість POST + кнопка «Видалити».
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { PriorityBadge } from '../atoms/Status'
import { api } from '../api/extras'
import type { TestCase, TestSuite } from '../api/extras'
import { apiGet, listAll } from '../api/client'
import type { IssuePriority, Project, UserShort } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { useAuth } from '../context/AuthContext'
import { Skeleton } from '../components/Skeleton'
import { displayName, truncateDisplayName } from '../utils/user'

type CaseType = 'manual' | 'automated'
type CasePriority = 'critical' | 'high' | 'medium' | 'low'

interface StepRow {
  action: string
  expected: string
}

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Edge']
const PRIORITIES: CasePriority[] = ['critical', 'high', 'medium', 'low']

interface PendingFile {
  id: string
  file: File
  name: string
  size: number
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export function EditTestPage() {
  const { id } = useParams<{ id: string }>()
  const caseId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [users, setUsers] = useState<UserShort[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suiteId, setSuiteId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [preconditions, setPreconditions] = useState('')
  const [steps, setSteps] = useState<StepRow[]>([{ action: '', expected: '' }])
  const [type, setType] = useState<CaseType>('manual')
  const [priority, setPriority] = useState<CasePriority>('medium')
  const [assigneeId, setAssigneeId] = useState<number | null>(null)
  const [duration, setDuration] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [browsers, setBrowsers] = useState<string[]>(['Chrome', 'Firefox', 'Safari'])
  const [ciOnPR, setCiOnPR] = useState(true)
  const [files, setFiles] = useState<PendingFile[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!caseId) return
    void (async () => {
      try {
        const [tc, ps, us] = await Promise.all([
          apiGet<TestCase>(`/test-cases/${caseId}/`),
          listAll<Project>('/projects/?page_size=50'),
          listAll<UserShort>('/users/?page_size=200').catch(() => [] as UserShort[]),
        ])
        setProjects(ps)
        setUsers(us)
        setProjectId(tc.project)
        const sl = await api.listTestSuites(tc.project)
        setSuites(sl)
        setSuiteId(tc.suite)
        setTitle(tc.title)
        setPreconditions(tc.preconditions || '')
        setSteps(
          tc.steps && tc.steps.length > 0
            ? tc.steps.map(s => ({
                action: s.step || '',
                expected: s.expected || '',
              }))
            : [{ action: '', expected: '' }]
        )
        setType(tc.type)
        setPriority(tc.priority)
        setAssigneeId(tc.created_by ?? user?.id ?? null)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
        navigate('/tests')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  // Перезавантажуємо suites при зміні проєкту
  useEffect(() => {
    if (!projectId) return
    void api.listTestSuites(projectId).then(sl => {
      setSuites(sl)
      if (!sl.find(s => s.id === suiteId)) {
        setSuiteId(sl[0]?.id ?? null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const addStep = () => setSteps(s => [...s, { action: '', expected: '' }])
  const updateStep = (i: number, patch: Partial<StepRow>) =>
    setSteps(s => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeStep = (i: number) =>
    setSteps(s => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))
  const toggleBrowser = (b: string) =>
    setBrowsers(arr => (arr.includes(b) ? arr.filter(x => x !== b) : [...arr, b]))

  const onFilesSelected = (fl: FileList | null) => {
    if (!fl) return
    const next: PendingFile[] = Array.from(fl).map(f => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      name: f.name,
      size: f.size,
    }))
    setFiles(p => [...p, ...next])
  }
  const removeFile = (id: string) => setFiles(p => p.filter(f => f.id !== id))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Вкажіть назву')
      return
    }
    if (!suiteId) {
      setError('Оберіть набір')
      return
    }
    setSubmitting(true)
    try {
      const cleanSteps = steps
        .map(s => ({ step: s.action.trim(), expected: s.expected.trim() }))
        .filter(s => s.step)
      await api.updateTestCase(caseId, {
        suite: suiteId,
        title: title.trim(),
        preconditions,
        steps: cleanSteps,
        type,
        priority,
      })
      toast.show('Кейс оновлено', 'success')
      navigate('/tests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: 'Видалити тест-кейс?',
      message: 'Цю дію неможливо скасувати.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTestCase(caseId)
      toast.show('Кейс видалено', 'success')
      navigate('/tests')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: 1480 }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 12 }}>
          <Skeleton height={400} />
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
            onClick={() => navigate('/tests')}
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
              Редагування тест-кейсу
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              TC-{caseId} · {title || 'Тест-кейс'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn danger" onClick={remove}>
              <Ic.Trash sz={12} /> Видалити
            </button>
            <button type="button" className="btn" onClick={() => navigate('/tests')}>
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !title.trim()}
            >
              <Ic.Check sz={12} /> {submitting ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>

        {error && <div className="bt-error-banner">{error}</div>}

        <div className="form-layout">
          <div className="form-main">
            <div className="big-title-input">
              <input
                className="big-input"
                placeholder="Назва кейса…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-section">
              <label className="form-lbl">Опис / Передумови</label>
              <textarea
                className="md-area"
                rows={3}
                value={preconditions}
                onChange={e => setPreconditions(e.target.value)}
                placeholder="Контекст і початковий стан перед виконанням сценарію"
              />
            </div>

            <div className="form-section">
              <label className="form-lbl">Кроки</label>
              <table className="step-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Дія</th>
                    <th>Очікуваний результат</th>
                    <th style={{ width: 32 }} />
                  </tr>
                </thead>
                <tbody>
                  {steps.map((s, i) => (
                    <tr key={i}>
                      <td>
                        <div className="num">{i + 1}</div>
                      </td>
                      <td>
                        <input
                          className="step-inp"
                          placeholder="Дія…"
                          value={s.action}
                          onChange={e => updateStep(i, { action: e.target.value })}
                        />
                      </td>
                      <td>
                        <input
                          className="step-inp"
                          placeholder="Очікуваний результат…"
                          value={s.expected}
                          onChange={e => updateStep(i, { expected: e.target.value })}
                        />
                      </td>
                      <td>
                        {steps.length > 1 && (
                          <button
                            type="button"
                            className="btn icon ghost sm"
                            onClick={() => removeStep(i)}
                          >
                            <Ic.X sz={11} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr
                    onClick={addStep}
                    style={{ cursor: 'pointer' }}
                    className="step-table-add-row"
                    title="Додати ще один крок"
                  >
                    <td>
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
                    </td>
                    <td
                      colSpan={3}
                      style={{
                        color: 'var(--fg-3)',
                        fontSize: 13,
                        padding: '10px 12px',
                      }}
                    >
                      Додати крок…
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="form-section">
              <label className="form-lbl">Вкладення / Тестові дані</label>
              <div
                className="dropzone small"
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
                <Ic.Upload sz={16} />
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                  Перетягніть фікстури, JSON, скріни очікуваних результатів
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  hidden
                  onChange={e => onFilesSelected(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {files.map(f => (
                    <div key={f.id} className="att-chip">
                      <span className="att-ico">
                        <Ic.Paperclip sz={12} />
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{f.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                          {formatBytes(f.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn icon ghost sm"
                        onClick={() => removeFile(f.id)}
                      >
                        <Ic.X sz={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="form-side">
            <div className="form-card">
              <div className="fc-row">
                <span className="fc-lbl">Проєкт</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={projectId ?? ''}
                  onChange={e => setProjectId(Number(e.target.value))}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Suite</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={suiteId ?? ''}
                  onChange={e => setSuiteId(e.target.value ? Number(e.target.value) : null)}
                  disabled={suites.length === 0}
                >
                  {suites.length === 0 ? (
                    <option value="">Немає suites</option>
                  ) : (
                    suites.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="fc-row" style={{ alignItems: 'flex-start' }}>
                <span className="fc-lbl">Тип</span>
                <div className="type-picker">
                  <button
                    type="button"
                    className={`type-card ${type === 'manual' ? 'active' : ''}`}
                    onClick={() => setType('manual')}
                  >
                    <span className="type-ico">
                      <Ic.User sz={14} />
                    </span>
                    <b>Manual</b>
                    <span className="type-desc">Виконується вручну</span>
                  </button>
                  <button
                    type="button"
                    className={`type-card ${type === 'automated' ? 'active' : ''}`}
                    onClick={() => setType('automated')}
                  >
                    <span className="type-ico">
                      <Ic.Lightning sz={14} />
                    </span>
                    <b>Auto</b>
                    <span className="type-desc">Запускається у CI</span>
                  </button>
                </div>
              </div>
              <div className="fc-row" style={{ alignItems: 'flex-start' }}>
                <span className="fc-lbl">Пріоритет</span>
                <div className="pri-picker">
                  {PRIORITIES.map(k => (
                    <button
                      type="button"
                      key={k}
                      className={`pri-opt ${priority === k ? 'active' : ''}`}
                      onClick={() => setPriority(k)}
                      title={k}
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
                  value={assigneeId ?? ''}
                  onChange={e =>
                    setAssigneeId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Не призначено</option>
                  {user && (
                    <option value={user.id} title={`${displayName(user)} (ви)`}>
                      {truncateDisplayName(user)} (ви)
                    </option>
                  )}
                  {users.map(u => (
                    <option key={u.id} value={u.id} title={displayName(u)}>
                      {truncateDisplayName(u)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Тривалість</span>
                <input
                  className="inp"
                  style={{ flex: 1 }}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="Наприклад: 2-3 хв"
                />
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Категорії</div>
              <div className="tag-picker">
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
                  placeholder="smoke, regression…"
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

            <div className="form-card">
              <div className="fc-section-title">Запуск</div>
              <div className="fc-row" style={{ alignItems: 'flex-start' }}>
                <span className="fc-lbl">Браузери</span>
                <div className="brow-list" style={{ flexWrap: 'wrap' }}>
                  {BROWSERS.map(b => {
                    const active = browsers.includes(b)
                    return (
                      <button
                        type="button"
                        key={b}
                        className="tag"
                        onClick={() => toggleBrowser(b)}
                        style={
                          active
                            ? {
                                background: 'var(--accent-soft)',
                                color: 'var(--accent-soft-fg)',
                                borderColor: 'transparent',
                                cursor: 'pointer',
                              }
                            : { cursor: 'pointer', opacity: 0.6 }
                        }
                      >
                        {b}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">CI</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <span
                    className={ciOnPR ? 'toggle on' : 'toggle'}
                    onClick={() => setCiOnPR(c => !c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span />
                  </span>
                  <span style={{ color: 'var(--fg-3)', fontSize: 12.5 }}>На кожен PR</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
