/**
 * Сторінка створення нового простору — двокроковий wizard за макетом прототипу.
 * Крок 1 (Простір): аватар-літера, назва, slug, колір, розмір команди, сфера.
 * Крок 2 (Налаштування): регіон даних, авто-приєднання за доменом, AI-підказки.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiPost, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'

interface Workspace {
  id: number
  name: string
  slug: string
  color: string
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

// Транслітерація укр/рос кирилиці у латиницю (спрощена згідно постанови КМУ №55).
// Для URL-ів: без апострофів, без різниці між початком та серединою слова.
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie',
  ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '',
  ю: 'iu', я: 'ia',
  // Російські, яких немає в українській
  ы: 'y', э: 'e', ъ: '', ё: 'e',
  // Польські/чеські (часто зустрічаються у назвах)
  ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z',
  á: 'a', č: 'c', ď: 'd', é: 'e', ě: 'e', í: 'i', ň: 'n', ř: 'r',
  š: 's', ť: 't', ú: 'u', ů: 'u', ý: 'y', ž: 'z',
}

function transliterate(s: string): string {
  let out = ''
  for (const ch of s.toLowerCase()) {
    const t = TRANSLIT[ch]
    out += t !== undefined ? t : ch
  }
  return out
}

function slugify(s: string): string {
  return transliterate(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // діакритика
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
}

export function NewWorkspacePage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [color, setColor] = useState(PALETTE[0])
  const [teamSize, setTeamSize] = useState('1-10')
  const [industry, setIndustry] = useState('saas')
  const [region, setRegion] = useState('')
  const [regions, setRegions] = useState<Region[]>([])
  const [autoJoin, setAutoJoin] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-slug з назви, поки користувач не редагує його вручну.
  useEffect(() => {
    if (slugTouched) return
    setSlug(slugify(name))
  }, [name, slugTouched])

  // Завантажуємо регіони з API
  useEffect(() => {
    void (async () => {
      try {
        const list = await listAll<Region>('/regions/')
        const active = list.filter(r => r.is_active)
        setRegions(active)
        const def = active.find(r => r.is_default) || active[0]
        if (def) setRegion(def.code)
      } catch {
        /* мовчки — крок 2 використає fallback */
      }
    })()
  }, [])

  const submit = async () => {
    setError(null)
    if (!name.trim() || !slug.trim()) {
      setError('Заповніть назву та URL')
      return
    }
    setSubmitting(true)
    try {
      const created = await apiPost<Workspace>('/workspaces/', {
        name: name.trim(),
        slug: slug.trim(),
        color,
        team_size: teamSize,
        industry,
        region,
        auto_join_domain: autoJoin,
      })
      // Запамʼятовуємо новий простір як активний і повідомляємо інші компоненти
      localStorage.setItem('bt:activeWorkspace', String(created.id))
      window.dispatchEvent(new CustomEvent('workspace:created', { detail: created }))
      toast.show('Простір створено', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення')
      setStep(1)
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => {
    if (!name.trim() || !slug.trim()) {
      setError('Заповніть назву та URL')
      return
    }
    setError(null)
    setStep(2)
  }

  const initialLetter = (name || 'A')[0].toUpperCase()

  return (
    <div style={{ padding: '32px 28px 64px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      {/* Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: 'var(--fg-3)',
          marginBottom: 16,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: step >= 1 ? 'var(--accent)' : 'var(--bg-2)',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          1
        </span>
        <b style={{ color: step === 1 ? 'var(--fg)' : 'var(--fg-3)' }}>Простір</b>
        <span style={{ width: 24, height: 1, background: 'var(--border)' }} />
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: step >= 2 ? 'var(--accent)' : 'var(--bg-2)',
            color: step >= 2 ? 'white' : 'var(--fg-3)',
            display: 'grid',
            placeItems: 'center',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          2
        </span>
        <b style={{ color: step === 2 ? 'var(--fg)' : 'var(--fg-3)' }}>Налаштування</b>
      </div>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Новий простір
      </h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>
        Простір — окрема організація з власними проєктами, людьми і білінгом.
      </p>

      {error && <div className="bt-error-banner">{error}</div>}

      {step === 1 && (
        <div className="card">
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
                    placeholder="Acme Inc."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
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
                  onChange={e => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  style={{ border: 'none', flex: 1, fontFamily: 'var(--font-mono)' }}
                  placeholder="acme"
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
                    title={c}
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button type="button" className="btn" onClick={() => navigate('/dashboard')}>
                Скасувати
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={goNext}
                disabled={!name || !slug}
                style={{ opacity: !name || !slug ? 0.5 : 1 }}
              >
                Далі <Ic.Chev sz={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div
            className="card-body"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div className="field">
              <label>Регіон даних</label>
              {regions.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    fontSize: 12.5,
                    color: 'var(--fg-3)',
                    background: 'var(--bg-2)',
                    borderRadius: 8,
                  }}
                >
                  Немає налаштованих регіонів. Адміністратор може додати їх у
                  розділі «Регіони».
                </div>
              ) : (
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
              )}
            </div>

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

            <div className="ai-card">
              <div className="head">
                <Ic.Spark sz={14} />
                <b>Що далі</b>
              </div>
              <ul>
                <li>Створіть перший проєкт або імпортуйте з Jira / Linear</li>
                <li>Запросіть команду та налаштуйте ролі</li>
                <li>Підключіть GitHub, Slack або Webhooks</li>
              </ul>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 8,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button type="button" className="btn" onClick={() => setStep(1)}>
                <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Назад
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={submit}
                disabled={submitting}
              >
                <Ic.Check sz={12} /> {submitting ? 'Створення…' : 'Створити простір'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
