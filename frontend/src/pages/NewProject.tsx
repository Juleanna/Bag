/**
 * Сторінка створення нового проєкту (всередині простору) — за макетом прототипу:
 *  - вибір шаблону (Чистий / Web / Mobile / API / Імпорт)
 *  - блок ідентичності: іконка, колір, назва, ключ, опис
 *  - блок команди й доступу: видимість, учасники
 *  - блок інтеграцій: GitHub, Slack, GitLab, OpenAI (плейсхолдери)
 *  - блок робочого процесу: візуалізація переходів статусів
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { apiPost, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import type { Project, ProjectVisibility, UserShort } from '../api/types'
import { displayName } from '../utils/user'
import { PROJECT_COLORS as COLORS, PROJECT_ICONS as ICONS } from '../utils/projectAssets'

interface ProjectTemplate {
  id: 'blank' | 'web' | 'mobile' | 'api' | 'import'
  name: string
  desc: string
  icon: keyof typeof Ic
}

const TEMPLATES: ProjectTemplate[] = [
  { id: 'blank', name: 'Чистий проєкт', desc: 'Почати з нуля без жодних шаблонів', icon: 'Plus' },
  { id: 'web', name: 'Web-застосунок', desc: 'Smoke + регресія + cross-browser. 24 кейси, 3 suite', icon: 'Globe' },
  { id: 'mobile', name: 'Мобільний застосунок', desc: 'iOS + Android. Crash detection, в тому числі offline', icon: 'Mobile' },
  { id: 'api', name: 'API / Backend', desc: 'Контракт-тести, навантаження, безпека. Postman / pytest', icon: 'Repo' },
  { id: 'import', name: 'Імпорт з JIRA / Linear', desc: 'Перенести існуючі баги, кейси та користувачів', icon: 'Download' },
]

const VISIBILITY_OPTIONS: Array<{
  id: ProjectVisibility
  label: string
  icon: keyof typeof Ic
  desc: string
}> = [
  { id: 'team', label: 'Команда', icon: 'Users', desc: 'Тільки запрошені учасники' },
  { id: 'org', label: 'Організація', icon: 'Globe', desc: 'Усі в організації' },
  { id: 'private', label: 'Приватний', icon: 'Eye', desc: 'Лише власник' },
]

const INTEGRATIONS: Array<{ icon: keyof typeof Ic; name: string; desc: string }> = [
  { icon: 'Github', name: 'GitHub', desc: 'Звʼяжіть репозиторій для авто-закриття багів' },
  { icon: 'Slack', name: 'Slack', desc: 'Сповіщення про fail tests та критичні баги' },
  { icon: 'Branch', name: 'GitLab', desc: 'Альтернативний git-провайдер' },
  { icon: 'AI', name: 'OpenAI', desc: 'AI-підсумки та авто-теги' },
]

const WORKFLOW: Array<{ key: string; label: string; color: string }> = [
  { key: 'open', label: 'Open', color: 'var(--st-open-dot)' },
  { key: 'progress', label: 'In Progress', color: 'var(--st-progress-dot)' },
  { key: 'blocked', label: 'Blocked', color: 'var(--st-blocked-dot)' },
  { key: 'resolved', label: 'Resolved', color: 'var(--st-resolved-dot)' },
  { key: 'closed', label: 'Closed', color: 'var(--st-closed-dot)' },
]

interface WorkspaceShort {
  id: number
  name: string
  color: string
}

export function NewProjectPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()

  const [template, setTemplate] = useState<ProjectTemplate['id']>('blank')
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState<keyof typeof Ic>('Layout')
  const [visibility, setVisibility] = useState<ProjectVisibility>('team')
  const [workspaceIds, setWorkspaceIds] = useState<number[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceShort[]>([])
  const [members, setMembers] = useState<UserShort[]>([])
  const [allUsers, setAllUsers] = useState<UserShort[]>([])
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [ws, users] = await Promise.all([
          listAll<WorkspaceShort>('/workspaces/?page_size=50').catch(
            () => [] as WorkspaceShort[]
          ),
          listAll<UserShort>('/users/?page_size=200').catch(() => [] as UserShort[]),
        ])
        setAllUsers(users)
        setWorkspaces(ws)
        // Без простору проєкт створити не можна — редиректимо на створення простору
        if (ws.length === 0) {
          toast.show('Спершу створіть простір', 'info')
          navigate('/workspaces/new')
          return
        }
        // За замовчуванням вибираємо активний простір з sidebar (якщо є), інакше перший
        const activeId = Number(localStorage.getItem('bt:activeWorkspace') || 0)
        const preselect = activeId && ws.find(w => w.id === activeId) ? activeId : ws[0]?.id
        if (preselect) setWorkspaceIds([preselect])
      } catch {
        /* мовчки */
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-key з назви
  useEffect(() => {
    if (key) return
    const generated = name
      .trim()
      .toUpperCase()
      .replace(/[^A-ZА-ЯҐЄІЇ0-9 ]/g, '')
      .split(/\s+/)
      .slice(0, 2)
      .map(w => w.slice(0, 3))
      .join('')
      .slice(0, 6)
    setKey(generated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  const toggleMember = (u: UserShort) => {
    setMembers(ms => (ms.find(m => m.id === u.id) ? ms.filter(m => m.id !== u.id) : [...ms, u]))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Вкажіть назву проєкту')
      return
    }
    if (workspaceIds.length === 0) {
      setError('Оберіть принаймні один простір')
      return
    }
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description,
        color,
        icon,
        visibility,
        workspaces: workspaceIds,
      }
      const created = await apiPost<Project>('/projects/', payload)
      if (members.length > 0) {
        await Promise.all(
          members.map(m =>
            apiPost(`/projects/${created.id}/add_member/`, {
              user_id: m.id,
              role: 'member',
            }).catch(() => null)
          )
        )
      }
      // Застосовуємо шаблон тестів (web/mobile/api). Для blank/import — нічого.
      if (template === 'web' || template === 'mobile' || template === 'api') {
        try {
          const r = await apiPost<{ suites: number; cases: number }>(
            `/projects/${created.id}/apply_template/`,
            { template }
          )
          if (r.suites > 0) {
            toast.show(
              `Шаблон застосовано: ${r.suites} suite, ${r.cases} тест-кейсів`,
              'success'
            )
          }
        } catch {
          /* мовчки — проєкт вже створено */
        }
      }
      window.dispatchEvent(new CustomEvent('project:created', { detail: created }))
      toast.show('Проєкт створено', 'success')
      if (template === 'import') {
        // Імпорт з JIRA/Linear поки що — інформаційний шлях; направляємо
        // на список багів проєкту, щоб користувач міг імпортувати CSV
        toast.show(
          'Готово! Імпорт з JIRA/Linear доступний у налаштуваннях проєкту',
          'info'
        )
      }
      navigate(`/bugs?project=${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення')
    } finally {
      setSubmitting(false)
    }
  }

  const SelectedIcon = Ic[icon] || Ic.Layout

  return (
    <div className="scroll-inner">
      <form className="form-page" onSubmit={submit}>
        <div className="form-page-head">
          <button
            type="button"
            className="btn ghost icon"
            onClick={() => navigate('/dashboard')}
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
              Створення проєкту
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              Налаштуйте новий проєкт
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn" onClick={() => navigate('/dashboard')}>
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !name.trim()}
            >
              <Ic.Plus sz={13} /> {submitting ? 'Створення…' : 'Створити проєкт'}
            </button>
          </div>
        </div>

        {error && <div className="bt-error-banner">{error}</div>}

        {/* Простори (M2M) */}
        {workspaces.length > 0 && (
          <div className="form-section">
            <label className="form-lbl">
              Простори{' '}
              <span style={{ color: 'var(--fg-4)', fontWeight: 400, fontSize: 11 }}>
                (можна обрати декілька)
              </span>
            </label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {workspaces.map(w => {
                const active = workspaceIds.includes(w.id)
                return (
                  <button
                    type="button"
                    key={w.id}
                    onClick={() =>
                      setWorkspaceIds(ids =>
                        ids.includes(w.id) ? ids.filter(x => x !== w.id) : [...ids, w.id]
                      )
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      border: active
                        ? '1px solid var(--accent)'
                        : '1px solid var(--border)',
                      borderRadius: 999,
                      background: active ? 'var(--accent-soft)' : 'var(--surface)',
                      color: active ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
                      fontSize: 12.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 4,
                        background: w.color || 'var(--accent)',
                        color: 'white',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                      }}
                    >
                      {w.name[0].toUpperCase()}
                    </span>
                    {w.name}
                    {active && <Ic.Check sz={11} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Шаблон — створює пресет TestSuite + TestCase після збереження */}
        <div className="form-section">
          <label className="form-lbl">Шаблон</label>
          <div className="tmpl-grid">
            {TEMPLATES.map(t => {
              const Icn = Ic[t.icon] || Ic.Layout
              return (
                <div
                  key={t.id}
                  className={`tmpl-card ${template === t.id ? 'active' : ''}`}
                  onClick={() => setTemplate(t.id)}
                >
                  <div className="tmpl-ico">
                    <Icn sz={18} />
                  </div>
                  <div className="tmpl-meta">
                    <b>{t.name}</b>
                    <span>{t.desc}</span>
                  </div>
                  {template === t.id && (
                    <div className="tmpl-check">
                      <Ic.Check sz={11} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="np-grid">
          {/* Ідентичність */}
          <div className="form-card">
            <div className="fc-section-title">Ідентичність</div>
            <div className="np-identity">
              <div className="np-preview" style={{ background: color }}>
                <SelectedIcon sz={28} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field">
                  <label>Назва *</label>
                  <input
                    className="inp"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Наприклад: Web App"
                    autoFocus
                    required
                  />
                </div>
                <div className="field">
                  <label>
                    Ключ{' '}
                    <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>
                      (префікс ID, напр. WEB-101)
                    </span>
                  </label>
                  <input
                    className="inp"
                    value={key}
                    onChange={e => setKey(e.target.value.toUpperCase().slice(0, 10))}
                    style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                    placeholder="WEB"
                  />
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Опис</label>
              <textarea
                className="inp"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Призначення проєкту, стек, посилання на репозиторій"
              />
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Колір</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    className="color-swatch"
                    onClick={() => setColor(c)}
                    style={{
                      background: c,
                      boxShadow:
                        color === c
                          ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}`
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Іконка</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {ICONS.map(n => {
                  const Icn = Ic[n]
                  return (
                    <button
                      type="button"
                      key={n}
                      className={`icon-swatch ${icon === n ? 'active' : ''}`}
                      onClick={() => setIcon(n)}
                      title={n}
                    >
                      <Icn sz={15} />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Команда та доступ */}
          <div className="form-card">
            <div className="fc-section-title">Команда та доступ</div>
            <div className="field">
              <label>Видимість</label>
              <div className="visibility-cards">
                {VISIBILITY_OPTIONS.map(v => {
                  const VIcn = Ic[v.icon]
                  const active = visibility === v.id
                  return (
                    <button
                      type="button"
                      key={v.id}
                      onClick={() => setVisibility(v.id)}
                      className={`vis-card ${active ? 'active' : ''}`}
                    >
                      <span className="vis-ico">
                        <VIcn sz={14} />
                      </span>
                      <b>{v.label}</b>
                      <span className="vis-desc">{v.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Учасники</label>
              <div className="member-list">
                {user && (
                  <div className="member-row">
                    <Avatar user={user} />
                    <div style={{ flex: 1 }}>
                      <b style={{ fontWeight: 500, fontSize: 13 }}>
                        {displayName(user)}{' '}
                        <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>(ви)</span>
                      </b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{user.email}</div>
                    </div>
                    <span
                      className="tag"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent-soft-fg)',
                        borderColor: 'transparent',
                      }}
                    >
                      Owner
                    </span>
                  </div>
                )}
                {members.map(m => (
                  <div key={m.id} className="member-row">
                    <Avatar user={m} />
                    <div style={{ flex: 1 }}>
                      <b style={{ fontWeight: 500, fontSize: 13 }}>
                        {displayName(m)}
                      </b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{m.email}</div>
                    </div>
                    <button
                      type="button"
                      className="btn ghost icon sm"
                      onClick={() => toggleMember(m)}
                      title="Прибрати"
                    >
                      <Ic.X sz={11} />
                    </button>
                  </div>
                ))}

                {memberPickerOpen ? (
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      marginTop: 6,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {allUsers.length === 0 ? (
                      <div
                        style={{
                          padding: 12,
                          fontSize: 12,
                          color: 'var(--fg-3)',
                          textAlign: 'center',
                        }}
                      >
                        Немає інших користувачів у системі
                      </div>
                    ) : (
                      allUsers.map(u => {
                        const picked = !!members.find(m => m.id === u.id)
                        return (
                          <button
                            type="button"
                            key={u.id}
                            className="drop-item"
                            onClick={() => toggleMember(u)}
                            style={{ width: '100%' }}
                          >
                            <Avatar user={u} />
                            <span style={{ flex: 1, textAlign: 'left' }}>
                              <b style={{ fontWeight: 500 }}>
                                {displayName(u)}
                              </b>
                              <span
                                style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 6 }}
                              >
                                @{u.username}
                              </span>
                            </span>
                            {picked && <Ic.Check sz={11} />}
                          </button>
                        )
                      })
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn sm ghost"
                    style={{ marginTop: 6 }}
                    onClick={() => setMemberPickerOpen(true)}
                  >
                    <Ic.Plus sz={11} /> Запросити людей
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Інтеграції */}
          <div className="form-card" style={{ gridColumn: 'span 2' }}>
            <div className="fc-section-title">Інтеграції</div>
            <div className="int-mini-grid">
              {INTEGRATIONS.map(i => {
                const IcCmp = Ic[i.icon]
                return (
                  <div key={i.name} className="int-mini">
                    <div className="int-mini-logo">
                      <IcCmp sz={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13 }}>{i.name}</b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>
                        {i.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn sm"
                      onClick={() => navigate('/webhooks')}
                      title="Налаштовується після створення"
                    >
                      Підключити
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Робочий процес */}
          <div className="form-card" style={{ gridColumn: 'span 2' }}>
            <div className="fc-section-title">Робочий процес</div>
            <div className="np-workflow">
              {WORKFLOW.map((s, i) => (
                <span
                  key={s.key}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <div className="wf-node">
                    <span className="dot" style={{ background: s.color }} />
                    <span>{s.label}</span>
                  </div>
                  {i < WORKFLOW.length - 1 && (
                    <Ic.Chev sz={11} style={{ color: 'var(--fg-4)' }} />
                  )}
                </span>
              ))}
              <button
                type="button"
                className="btn sm ghost"
                style={{ marginLeft: 'auto' }}
                disabled
                title="Налаштовується після створення"
              >
                <Ic.Edit sz={11} /> Налаштувати
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
