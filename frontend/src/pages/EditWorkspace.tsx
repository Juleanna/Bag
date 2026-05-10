/**
 * Сторінка редагування простору. Однокарточкова форма (без 2-step wizard,
 * бо при редагуванні усі поля доступні одразу).
 *  - PATCH /workspaces/:id/
 *  - DELETE /workspaces/:id/ — видалення з підтвердженням
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiDelete, apiGet, apiPatch, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

interface Workspace {
  id: number
  name: string
  slug: string
  color: string
  team_size?: string
  industry?: string
  region?: string
  auto_join_domain?: boolean
}

interface Region {
  id: number
  code: string
  label: string
  icon: string
  is_active: boolean
  is_default: boolean
}

const PALETTE = ['#5E6AD2', '#0EA5E9', '#10B981', '#D97757', '#9665C9', '#1F1E1A']

const TEAM_SIZES = [
  { value: '1-10', label: '1–10 людей' },
  { value: '11-50', label: '11–50 людей' },
  { value: '51-200', label: '51–200 людей' },
  { value: '200+', label: '200+ людей' },
]

const INDUSTRIES = [
  { value: 'saas', label: 'SaaS / B2B' },
  { value: 'ecom', label: 'E-commerce' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'games', label: 'Ігри' },
  { value: 'other', label: 'Інше' },
]

export function EditWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const wsId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [teamSize, setTeamSize] = useState('1-10')
  const [industry, setIndustry] = useState('saas')
  const [region, setRegion] = useState('')
  const [autoJoin, setAutoJoin] = useState(false)
  const [regions, setRegions] = useState<Region[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!wsId) return
    void (async () => {
      try {
        const [w, list] = await Promise.all([
          apiGet<Workspace>(`/workspaces/${wsId}/`),
          listAll<Region>('/regions/').catch(() => [] as Region[]),
        ])
        setName(w.name)
        setSlug(w.slug)
        setColor(w.color || PALETTE[0])
        setTeamSize(w.team_size || '1-10')
        setIndustry(w.industry || 'saas')
        setRegion(w.region || '')
        setAutoJoin(!!w.auto_join_domain)
        setRegions(list.filter(r => r.is_active))
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Не вдалось завантажити', 'error')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !slug.trim()) {
      setError('Заповніть назву та URL')
      return
    }
    setSubmitting(true)
    try {
      await apiPatch<Workspace>(`/workspaces/${wsId}/`, {
        name: name.trim(),
        slug: slug.trim(),
        color,
        team_size: teamSize,
        industry,
        region,
        auto_join_domain: autoJoin,
      })
      window.dispatchEvent(new CustomEvent('workspace:created'))
      toast.show('Простір оновлено', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async () => {
    // Дізнаємось скільки проєктів буде видалено (тільки в цьому просторі)
    // та скільки лише відвʼяжуться (належать ще іншим просторам).
    let willDelete = 0
    let willUnlink = 0
    try {
      const projects = await listAll<{ id: number; workspaces: number[] }>(
        `/projects/?workspace=${wsId}&page_size=200`
      )
      for (const p of projects) {
        if ((p.workspaces || []).length <= 1) willDelete += 1
        else willUnlink += 1
      }
    } catch {
      /* якщо не вдалося — просто покажемо загальне попередження */
    }

    const messageParts: string[] = []
    if (willDelete > 0) {
      messageParts.push(
        `${willDelete} проєкт${willDelete === 1 ? '' : willDelete < 5 ? 'и' : 'ів'} буде ВИДАЛЕНО разом з усіма задачами (належать лише цьому простору).`
      )
    }
    if (willUnlink > 0) {
      messageParts.push(
        `${willUnlink} проєкт${willUnlink === 1 ? '' : willUnlink < 5 ? 'и' : 'ів'} лише втратять привʼязку до простору (залишаться у інших).`
      )
    }
    if (messageParts.length === 0) {
      messageParts.push('У просторі немає проєктів.')
    }
    messageParts.push('Цю дію неможливо скасувати.')

    const ok = await confirm({
      title: `Видалити простір «${name}»?`,
      message: messageParts.join(' '),
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await apiDelete(`/workspaces/${wsId}/`)
      if (Number(localStorage.getItem('bt:activeWorkspace')) === wsId) {
        localStorage.removeItem('bt:activeWorkspace')
      }
      window.dispatchEvent(new CustomEvent('workspace:deleted'))
      window.dispatchEvent(new CustomEvent('project:deleted'))
      toast.show('Простір видалено', 'success')
      navigate('/dashboard')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '32px 28px', maxWidth: 720, margin: '0 auto' }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 12 }}>
          <Skeleton height={400} />
        </div>
      </div>
    )
  }

  const initialLetter = (name || 'A')[0].toUpperCase()

  return (
    <div style={{ padding: '32px 28px 64px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--fg-3)',
          marginBottom: 8,
        }}
      >
        Редагування простору
      </div>
      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
        {name || 'Простір'}
      </h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>
        Налаштування організації, видимих для всіх її учасників.
      </p>

      {error && <div className="bt-error-banner">{error}</div>}

      <form className="card" onSubmit={submit}>
        <div
          className="card-body"
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 14,
                background: color,
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontSize: 28,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initialLetter}
            </div>
            <div style={{ flex: 1 }}>
              <div className="field">
                <label>Назва простору</label>
                <input
                  className="inp"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="field">
            <label>URL-адреса</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: 7,
                background: 'var(--surface)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  padding: '0 10px',
                  color: 'var(--fg-3)',
                  fontSize: 13,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                app.bugforge.io/
              </span>
              <input
                className="inp"
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                style={{ border: 'none', flex: 1, fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          <div className="field">
            <label>Колір простору</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {PALETTE.map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 7,
                    background: c,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow:
                      color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label>Розмір команди</label>
              <select
                className="inp"
                value={teamSize}
                onChange={e => setTeamSize(e.target.value)}
              >
                {TEAM_SIZES.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Сфера</label>
              <select
                className="inp"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {regions.length > 0 && (
            <div className="field">
              <label>Регіон даних</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(regions.length, 3)}, 1fr)`,
                  gap: 8,
                }}
              >
                {regions.map(r => (
                  <button
                    type="button"
                    key={r.code}
                    onClick={() => setRegion(r.code)}
                    style={{
                      padding: '12px 14px',
                      border:
                        region === r.code
                          ? '1.5px solid var(--accent)'
                          : '1px solid var(--border)',
                      borderRadius: 8,
                      background:
                        region === r.code ? 'var(--accent-soft)' : 'var(--surface)',
                      fontSize: 13,
                      fontWeight: 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {r.icon ? `${r.icon} ` : ''}
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '14px 16px',
              background: 'var(--bg-2)',
              borderRadius: 10,
            }}
          >
            <span style={{ marginTop: 2 }}>
              <Ic.Globe sz={16} />
            </span>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 13 }}>Авто-приєднання за доменом</b>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>
                Хтось з email на цьому домені приєднається автоматично як Учасник.
              </p>
            </div>
            <span
              className={autoJoin ? 'toggle on' : 'toggle'}
              onClick={() => setAutoJoin(d => !d)}
              style={{ cursor: 'pointer' }}
            >
              <span />
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 12,
              borderTop: '1px solid var(--divider)',
            }}
          >
            <button type="button" className="btn danger" onClick={remove}>
              <Ic.Trash sz={12} /> Видалити простір
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn" onClick={() => navigate('/dashboard')}>
                Скасувати
              </button>
              <button type="submit" className="btn primary" disabled={submitting}>
                <Ic.Check sz={12} /> {submitting ? 'Збереження…' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
