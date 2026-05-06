/**
 * Sprints — список спринтів проєкту з можливістю створення нового
 * та простим burndown по поточному активному спринту.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { api as extras } from '../api/extras'
import type { Sprint } from '../api/extras'
import type { Issue, Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

export function SprintsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', goal: '', starts_at: '', ends_at: '' })

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps[0]) setProjectId(ps[0].id)
    })()
  }, [])

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    Promise.all([
      extras.listSprints(projectId).catch(() => [] as Sprint[]),
      listAll<Issue>(`/issues/?project=${projectId}&page_size=200`).catch(() => [] as Issue[]),
    ])
      .then(([sl, il]) => {
        setSprints(sl)
        setIssues(il)
      })
      .finally(() => setLoading(false))
  }, [projectId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return
    try {
      const s = await extras.createSprint({
        project: projectId,
        name: form.name,
        goal: form.goal,
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        is_active: true,
      })
      setSprints(sl => [s, ...sl])
      setForm({ name: '', goal: '', starts_at: '', ends_at: '' })
      setCreating(false)
      toast.show('Спринт створено', 'success')
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Помилка', 'error')
    }
  }

  const removeSprint = async (s: Sprint) => {
    const ok = await confirm({
      title: `Видалити спринт «${s.name}»?`,
      message: 'Задачі спринта не видалятимуться, лише відвʼязуються.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.deleteSprint(s.id)
      setSprints(sl => sl.filter(x => x.id !== s.id))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const activeSprint = sprints.find(s => s.is_active) || sprints[0]
  const sprintIssues = useMemo(
    () => (activeSprint ? issues.filter(i => i.sprint === activeSprint.id) : []),
    [issues, activeSprint]
  )
  const sprintDone = sprintIssues.filter(i => i.status === 'done' || i.status === 'cancelled').length
  const sprintProgress = sprintIssues.length === 0
    ? 0
    : Math.round((sprintDone / sprintIssues.length) * 100)

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Спринти</h1>
          <div className="sub">
            {sprints.length} {sprints.length === 1 ? 'спринт' : 'спринтів'}
          </div>
        </div>
        <div className="right" style={{ display: 'flex', gap: 8 }}>
          <select
            className="inp"
            value={projectId ?? ''}
            onChange={e => setProjectId(Number(e.target.value))}
            style={{ minWidth: 180 }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button className="btn primary" onClick={() => setCreating(c => !c)}>
            <Ic.Plus sz={13} /> Новий спринт
          </button>
        </div>
      </div>

      {creating && (
        <form className="card" style={{ padding: 18, marginBottom: 16 }} onSubmit={submit}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Новий спринт</h3>
          <div className="admin-grid-2">
            <div className="field">
              <label>Назва *</label>
              <input
                className="inp"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Мета</label>
              <input
                className="inp"
                value={form.goal}
                onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                placeholder="Наприклад: «Полагодити критичні баги перед реліз-кандидатом»"
              />
            </div>
            <div className="field">
              <label>Початок</label>
              <input
                className="inp"
                type="date"
                value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                required
              />
            </div>
            <div className="field">
              <label>Кінець</label>
              <input
                className="inp"
                type="date"
                value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
                required
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => setCreating(false)}>
              Скасувати
            </button>
            <button type="submit" className="btn primary">
              Створити
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={64} />
          ))}
        </div>
      ) : sprints.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Calendar sz={36} />
          <h4>Немає спринтів</h4>
          <p>Створіть перший спринт, щоб згрупувати задачі за тижнями</p>
        </div>
      ) : (
        <>
          {/* Активний спринт - картка з прогресом */}
          {activeSprint && (
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div className="card-head">
                <h3>
                  <span className="pill resolved">
                    <span className="dot" style={{ background: 'var(--st-resolved-dot)' }} /> активний
                  </span>{' '}
                  {activeSprint.name}
                </h3>
                <span className="sub">
                  {activeSprint.starts_at} → {activeSprint.ends_at}
                </span>
              </div>
              {activeSprint.goal && (
                <p style={{ color: 'var(--fg-2)', margin: '8px 0' }}>🎯 {activeSprint.goal}</p>
              )}
              <div style={{ marginTop: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ color: 'var(--fg-3)' }}>
                    {sprintDone} з {sprintIssues.length} задач завершено
                  </span>
                  <b style={{ fontVariantNumeric: 'tabular-nums' }}>{sprintProgress}%</b>
                </div>
                <div
                  style={{
                    height: 8,
                    background: 'var(--bg-2)',
                    borderRadius: 999,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${sprintProgress}%`,
                      background: 'var(--accent)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Список усіх спринтів */}
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>Період</th>
                  <th>Задач</th>
                  <th>Стан</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sprints.map(s => (
                  <tr key={s.id}>
                    <td>
                      <b>{s.name}</b>
                      {s.goal && (
                        <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{s.goal}</div>
                      )}
                    </td>
                    <td className="muted">
                      {s.starts_at} → {s.ends_at}
                    </td>
                    <td>{s.issues_count}</td>
                    <td>
                      {s.is_active ? (
                        <span className="pill resolved">активний</span>
                      ) : (
                        <span className="pill closed">завершений</span>
                      )}
                    </td>
                    <td className="right">
                      <button
                        className="btn ghost icon sm"
                        title="Перейти до задач спринта"
                        onClick={() => navigate(`/bugs?sprint=${s.id}`)}
                      >
                        <Ic.Chev sz={11} />
                      </button>
                      <button
                        className="btn ghost icon sm"
                        title="Видалити"
                        onClick={() => removeSprint(s)}
                      >
                        <Ic.Trash sz={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
