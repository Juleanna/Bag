/**
 * Сторінка керування наборами тестів (TestSuite).
 *
 * Окрема CRUD-сторінка з повноцінними полями (name + description).
 * Раніше створення відбувалося лише через inline-prompt у Tests.tsx
 * або кнопкою «+ Новий» у формі тест-кейса — без опису і поза контекстом.
 *
 * Доступна з sidebar та з форми нового тест-кейса.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { listAll } from '../api/client'
import { api } from '../api/extras'
import type { TestSuite } from '../api/extras'
import type { Project } from '../api/types'

export function TestSuitesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [params, setParams] = useSearchParams()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TestSuite | null>(null)
  const [creating, setCreating] = useState(false)

  // Ініціалізація: тягнемо проєкти, обираємо з URL або перший
  useEffect(() => {
    void (async () => {
      try {
        const ps = await listAll<Project>('/projects/?page_size=50')
        setProjects(ps)
        const urlProject = params.get('project')
        const initial = urlProject ? Number(urlProject) : ps[0]?.id ?? null
        setProjectId(initial)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Перевантажуємо suites при зміні проєкту
  useEffect(() => {
    if (!projectId) {
      setLoading(false)
      return
    }
    setLoading(true)
    void (async () => {
      try {
        const sl = await api.listTestSuites(projectId)
        setSuites(sl)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [projectId])

  const setProject = (id: number | null) => {
    setProjectId(id)
    if (id) setParams({ project: String(id) })
    else setParams({})
  }

  const removeSuite = async (s: TestSuite) => {
    const ok = await confirm({
      title: `Видалити набір «${s.name}»?`,
      message:
        s.cases_count > 0
          ? `У наборі ${s.cases_count} тест-кейсів — їх теж буде видалено.`
          : 'Набір буде видалено.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTestSuite(s.id)
      setSuites(arr => arr.filter(x => x.id !== s.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const currentProject = useMemo(
    () => projects.find(p => p.id === projectId),
    [projects, projectId]
  )

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        <button
          className="btn ghost sm"
          onClick={() => navigate('/tests')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Тест-кейси
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span style={{ color: 'var(--fg-3)' }}>Набори</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Набори тестів</h1>
          <div className="sub">
            Групи логічно повʼязаних тест-кейсів{' '}
            {currentProject && ` · проєкт ${currentProject.name}`}
          </div>
        </div>
        <div className="right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {projects.length > 1 && (
            <select
              className="inp"
              value={projectId ?? ''}
              onChange={e => setProject(e.target.value ? Number(e.target.value) : null)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn primary"
            onClick={() => setCreating(true)}
            disabled={!projectId}
          >
            <Ic.Plus sz={12} /> Новий набір
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : suites.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Beaker sz={36} />
          <h4>Ще немає наборів</h4>
          <p>
            Створіть перший набір, щоб згрупувати тест-кейси за областю
            (наприклад «Auth», «Billing», «Smoke»).
          </p>
          <button
            className="btn primary"
            onClick={() => setCreating(true)}
            disabled={!projectId}
            style={{ marginTop: 12 }}
          >
            <Ic.Plus sz={12} /> Створити перший
          </button>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 18 }}>Назва</th>
                <th>Опис</th>
                <th style={{ width: 110 }}>Кейсів</th>
                <th style={{ width: 100, paddingRight: 18 }} />
              </tr>
            </thead>
            <tbody>
              {suites.map(s => (
                <tr key={s.id}>
                  <td style={{ paddingLeft: 18 }}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/tests?project=${projectId}&suite=${s.id}`)
                      }
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: 'var(--fg)',
                        textAlign: 'left',
                      }}
                    >
                      <Ic.Folder
                        sz={12}
                        style={{ marginRight: 6, color: 'var(--fg-3)' }}
                      />
                      {s.name}
                    </button>
                  </td>
                  <td
                    className="muted"
                    style={{
                      fontSize: 12.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 480,
                    }}
                  >
                    {s.description || '—'}
                  </td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
                    {s.cases_count}
                  </td>
                  <td className="right" style={{ paddingRight: 18 }}>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => setEditing(s)}
                      title="Редагувати"
                      style={{ marginRight: 4 }}
                    >
                      <Ic.Edit sz={11} />
                    </button>
                    <button
                      type="button"
                      className="btn sm danger"
                      onClick={() => removeSuite(s)}
                      title="Видалити"
                    >
                      <Ic.Trash sz={11} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && projectId && (
        <SuiteEditor
          suite={editing}
          projectId={projectId}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={async saved => {
            if (editing) {
              setSuites(arr => arr.map(x => (x.id === saved.id ? saved : x)))
            } else {
              setSuites(arr => [...arr, saved])
            }
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// SuiteEditor — модал create/edit з полями name + description
// ============================================================================

function SuiteEditor({
  suite,
  projectId,
  onClose,
  onSaved,
}: {
  suite: TestSuite | null
  projectId: number
  onClose: () => void
  onSaved: (saved: TestSuite) => void
}) {
  const toast = useToast()
  const isNew = !suite
  const [name, setName] = useState(suite?.name ?? '')
  const [description, setDescription] = useState(suite?.description ?? '')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.show('Введіть назву', 'error')
      return
    }
    setSaving(true)
    try {
      const saved = isNew
        ? await api.createTestSuite({
            project: projectId,
            name: name.trim(),
            description: description.trim(),
          })
        : await api.updateTestSuite(suite!.id, {
            name: name.trim(),
            description: description.trim(),
          })
      toast.show(isNew ? 'Створено' : 'Збережено', 'success')
      onSaved(saved)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: 'min(520px, 100%)', padding: 24 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {isNew ? 'Новий набір' : 'Редагування набору'}
          </h2>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-lbl">Назва</label>
            <input
              autoFocus
              className="inp"
              placeholder="Auth, Billing, Smoke…"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  void submit()
                }
              }}
            />
          </div>
          <div>
            <label className="form-lbl">Опис (опц.)</label>
            <textarea
              className="inp"
              rows={3}
              placeholder="Що покриває цей набір. Наприклад: «Сценарії входу/виходу та 2FA»"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              paddingTop: 12,
              borderTop: '1px solid var(--divider)',
            }}
          >
            <button className="btn" onClick={onClose}>
              Скасувати
            </button>
            <button className="btn primary" onClick={submit} disabled={saving}>
              {saving ? 'Зберігаю…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
