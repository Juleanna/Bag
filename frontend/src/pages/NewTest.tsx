/**
 * Сторінка створення тест-кейсу — за макетом прототипу:
 *  - двоколонковий form-layout (form-main + form-side)
 *  - велике поле title + опис/передумови
 *  - таблиця кроків (action / expected) з можливістю додавання
 *  - sidebar: Suite, Тип, Пріоритет (pri-picker), Автор, Тривалість
 *  - Категорії (теги — зберігаються у custom_fields)
 *  - Запуск: браузери, CI (поки візуально, через custom_fields)
 *  - Вкладення dropzone (відкладене завантаження після створення)
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { PriorityBadge } from '../atoms/Status'
import { api } from '../api/extras'
import type { TestSuite } from '../api/extras'
import { listAll } from '../api/client'
import type { IssuePriority, Project, UserShort } from '../api/types'
import { displayName } from '../utils/user'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'

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

export function NewTestPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [projects, setProjects] = useState<Project[]>([])
  const [suites, setSuites] = useState<TestSuite[]>([])
  // Inline-створення нового suite прямо з форми тест-кейса, без переходу
  // на сторінку Тест-кейси.
  const [creatingSuite, setCreatingSuite] = useState(false)
  const [newSuiteName, setNewSuiteName] = useState('')
  const [savingSuite, setSavingSuite] = useState(false)
  const [users, setUsers] = useState<UserShort[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suiteId, setSuiteId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [preconditions, setPreconditions] = useState('')
  const [steps, setSteps] = useState<StepRow[]>([{ action: '', expected: '' }])
  const [type, setType] = useState<CaseType>('manual')
  const [priority, setPriority] = useState<CasePriority>('medium')
  const [authorId, setAuthorId] = useState<number | null>(null)
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
    void (async () => {
      const [ps, us] = await Promise.all([
        listAll<Project>('/projects/?page_size=50'),
        listAll<UserShort>('/users/?page_size=200').catch(() => [] as UserShort[]),
      ])
      setProjects(ps)
      setUsers(us)
      if (ps[0]) setProjectId(ps[0].id)
      if (user) {
        setAuthorId(user.id)
        setAssigneeId(user.id)
      }
    })()
  }, [user])

  useEffect(() => {
    if (!projectId) return
    void api.listTestSuites(projectId).then(sl => {
      setSuites(sl)
      setSuiteId(sl[0]?.id ?? null)
    })
  }, [projectId])

  const addStep = () =>
    setSteps(s => [...s, { action: '', expected: '' }])
  const updateStep = (i: number, patch: Partial<StepRow>) =>
    setSteps(s => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  const removeStep = (i: number) =>
    setSteps(s => (s.length > 1 ? s.filter((_, idx) => idx !== i) : s))

  const submitNewSuite = async () => {
    const name = newSuiteName.trim()
    if (!name || !projectId) return
    setSavingSuite(true)
    try {
      const created = await api.createTestSuite({ project: projectId, name })
      setSuites(prev => [...prev, created])
      setSuiteId(created.id)
      setNewSuiteName('')
      setCreatingSuite(false)
      toast.show(`Suite «${created.name}» створено`, 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Не вдалося створити suite', 'error')
    } finally {
      setSavingSuite(false)
    }
  }

  const generateStepsFromDescription = () => {
    if (!preconditions.trim()) {
      toast.show('Спершу заповніть опис', 'info')
      return
    }
    // Простий "AI-помічник" без LLM: бере перші 3 речення з опису як кроки
    const sentences = preconditions
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5)
      .slice(0, 5)
    if (sentences.length === 0) {
      toast.show('Не вдалось згенерувати кроки', 'info')
      return
    }
    setSteps(sentences.map(s => ({ action: s, expected: '' })))
    toast.show(`Згенеровано ${sentences.length} кроків — відредагуйте за потреби`, 'success')
  }

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
      setError('Оберіть suite або створіть новий (кнопка «+ Новий» біля поля Suite)')
      return
    }
    setSubmitting(true)
    try {
      const cleanSteps = steps
        .map(s => ({ step: s.action.trim(), expected: s.expected.trim() }))
        .filter(s => s.step)
      await api.createTestCase({
        suite: suiteId,
        title: title.trim(),
        preconditions,
        steps: cleanSteps,
        type,
        priority,
      })
      toast.show('Кейс створено', 'success')
      navigate('/tests')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення')
    } finally {
      setSubmitting(false)
    }
  }

  if (projects.length === 0) {
    return (
      <div className="page" style={{ maxWidth: 720 }}>
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Beaker sz={36} />
          <h4>Немає проєктів</h4>
          <p>Створіть проєкт, щоб додавати тест-кейси</p>
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
              Новий тест-кейс
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              Опишіть сценарій тестування
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => navigate('/tests')}>
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !title.trim()}
            >
              <Ic.Plus sz={13} /> {submitting ? 'Створення…' : 'Створити кейс'}
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
                autoFocus
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
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <label className="form-lbl">Кроки</label>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={generateStepsFromDescription}
                >
                  <Ic.AI sz={11} /> Згенерувати з опису
                </button>
              </div>
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
              <div className="fc-row" style={{ alignItems: creatingSuite ? 'flex-start' : 'center' }}>
                <span className="fc-lbl">Suite</span>
                {creatingSuite ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <input
                        autoFocus
                        className="inp"
                        style={{ flex: 1 }}
                        placeholder="Назва нового suite…"
                        value={newSuiteName}
                        onChange={e => setNewSuiteName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void submitNewSuite()
                          } else if (e.key === 'Escape') {
                            setCreatingSuite(false)
                            setNewSuiteName('')
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn sm primary"
                        onClick={submitNewSuite}
                        disabled={!newSuiteName.trim() || savingSuite}
                      >
                        {savingSuite ? '…' : 'Створити'}
                      </button>
                      <button
                        type="button"
                        className="btn sm"
                        onClick={() => {
                          setCreatingSuite(false)
                          setNewSuiteName('')
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', gap: 4 }}>
                    <select
                      className="inp"
                      style={{ flex: 1 }}
                      value={suiteId ?? ''}
                      onChange={e => setSuiteId(e.target.value ? Number(e.target.value) : null)}
                    >
                      {suites.length === 0 && (
                        <option value="">Немає suites — натисніть +</option>
                      )}
                      {suites.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => setCreatingSuite(true)}
                      disabled={!projectId}
                      title={projectId ? 'Створити новий suite (швидко)' : 'Спершу оберіть проєкт'}
                    >
                      <Ic.Plus sz={11} /> Новий
                    </button>
                    <button
                      type="button"
                      className="btn sm ghost"
                      onClick={() =>
                        navigate(
                          projectId
                            ? `/tests/suites?project=${projectId}`
                            : '/tests/suites'
                        )
                      }
                      title="Відкрити сторінку керування наборами (з описами)"
                    >
                      <Ic.Folder sz={11} />
                    </button>
                  </div>
                )}
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
                <span className="fc-lbl">Автор</span>
                <select
                  className="inp"
                  style={{ flex: 1 }}
                  value={authorId ?? ''}
                  onChange={e => setAuthorId(e.target.value ? Number(e.target.value) : null)}
                >
                  {user && <option value={user.id}>{displayName(user)} (ви)</option>}
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {displayName(u)}
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
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <span
                    className={ciOnPR ? 'toggle on' : 'toggle'}
                    onClick={() => setCiOnPR(c => !c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span />
                  </span>
                  <span style={{ color: 'var(--fg-3)', fontSize: 12.5 }}>
                    На кожен PR
                  </span>
                </span>
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
                  {user && <option value={user.id}>{displayName(user)} (ви)</option>}
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {displayName(u)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
