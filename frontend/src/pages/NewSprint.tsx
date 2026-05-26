/**
 * Сторінка створення нового спринту — за прототипом «Спринти / Новий».
 * Дві картки: «Основне» (назва, ціль, проєкт) і «Тривалість»
 * (шаблон 1/2/3 тиж/власна, дати, ємність команди в SP).
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { api as extras } from '../api/extras'
import type { Sprint } from '../api/extras'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'

type DurationKind = '1w' | '2w' | '3w' | 'custom'

function addDays(iso: string, days: number): string {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function NewSprintPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [pastSprints, setPastSprints] = useState<Sprint[]>([])
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [duration, setDuration] = useState<DurationKind>('2w')
  const [startsAt, setStartsAt] = useState(todayISO())
  const [endsAt, setEndsAt] = useState(addDays(todayISO(), 14))
  const [capacity, setCapacity] = useState(40)
  const [autoStart, setAutoStart] = useState(true)
  const [saving, setSaving] = useState(false)

  // Шаблон → автоматично рахуємо ends_at.
  useEffect(() => {
    if (duration === 'custom') return
    const days = duration === '1w' ? 7 : duration === '2w' ? 14 : 21
    setEndsAt(addDays(startsAt, days))
  }, [duration, startsAt])

  useEffect(() => {
    void (async () => {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps[0]) setProjectId(ps[0].id)
    })()
  }, [])

  // Підтягуємо останні 6 спринтів проєкту — щоб порахувати середній capacity.
  useEffect(() => {
    if (!projectId) {
      setPastSprints([])
      return
    }
    void extras.listSprints(projectId).then(setPastSprints).catch(() => setPastSprints([]))
  }, [projectId])

  const avgVelocity = useMemo(() => {
    const last = pastSprints.slice(0, 6)
    const withCap = last.filter(s => s.capacity_sp != null)
    if (withCap.length === 0) return null
    const sum = withCap.reduce((s, x) => s + (x.capacity_sp || 0), 0)
    return Math.round(sum / withCap.length)
  }, [pastSprints])

  const submit = async (asActive: boolean) => {
    if (!projectId || !name.trim()) {
      toast.show('Заповніть назву та проєкт', 'error')
      return
    }
    setSaving(true)
    try {
      const s = await extras.createSprint({
        project: projectId,
        name: name.trim(),
        goal: goal.trim(),
        starts_at: startsAt,
        ends_at: endsAt,
        capacity_sp: capacity,
        is_active: asActive,
      })
      toast.show(
        asActive ? 'Спринт створено і запущено' : 'Спринт збережено як чернетку',
        'success',
      )
      navigate(`/sprints?focus=${s.id}`)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>Новий спринт</h1>
        <p style={{ color: 'var(--fg-3)', marginTop: 0, marginBottom: 24 }}>
          Сплануйте ітерацію 1–4 тижні з метою та ємністю.
        </p>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 14 }}>Основне</h3>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Назва спринту</label>
            <input
              className="inp"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Sprint 25 · Web v4.19"
              maxLength={120}
            />
          </div>
          <div className="field" style={{ marginBottom: 4 }}>
            <label>Ціль спринту</label>
            <textarea
              className="inp"
              rows={3}
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Що команда хоче досягти за цю ітерацію?"
              maxLength={200}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>
              Використовується в звіті по завершенні · {goal.length}/200
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Проєкт</label>
            <select
              className="inp"
              value={projectId ?? ''}
              onChange={e => setProjectId(Number(e.target.value))}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 14 }}>Тривалість</h3>
          <div style={{ marginBottom: 12 }}>
            <label className="form-lbl" style={{ display: 'block', marginBottom: 8 }}>
              Шаблон тривалості
            </label>
            <div className="duration-picker">
              {(
                [
                  { k: '1w', label: '1 тиждень' },
                  { k: '2w', label: '2 тижні' },
                  { k: '3w', label: '3 тижні' },
                  { k: 'custom', label: 'Власна' },
                ] as { k: DurationKind; label: string }[]
              ).map(o => (
                <button
                  key={o.k}
                  type="button"
                  className={`duration-opt ${duration === o.k ? 'active' : ''}`}
                  onClick={() => setDuration(o.k)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field">
              <label>Старт</label>
              <input
                className="inp"
                type="date"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Кінець</label>
              <input
                className="inp"
                type="date"
                value={endsAt}
                onChange={e => {
                  setEndsAt(e.target.value)
                  setDuration('custom')
                }}
              />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <label className="form-lbl" style={{ margin: 0 }}>
                Ємність команди (story points)
              </label>
              <b style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums' }}>
                {capacity} SP
              </b>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={1}
              value={capacity}
              onChange={e => setCapacity(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            {avgVelocity !== null && (
              <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 6 }}>
                Середня velocity за {Math.min(pastSprints.length, 6)} спринтів: {avgVelocity} SP
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginBottom: 24 }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <Ic.Lightning sz={18} style={{ color: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>Автоматично запустити</div>
              <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                Спринт активується о 09:00 в день старту
              </div>
            </div>
            <span
              className={`toggle ${autoStart ? 'on' : ''}`}
              onClick={() => setAutoStart(a => !a)}
              role="checkbox"
              aria-checked={autoStart}
            >
              <span />
            </span>
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            paddingBottom: 24,
          }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => navigate('/sprints')}
          >
            Скасувати
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              disabled={saving}
              onClick={() => submit(false)}
            >
              Зберегти як чернетку
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={saving}
              onClick={() => submit(true)}
            >
              <Ic.Play sz={11} /> Створити та запустити
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
