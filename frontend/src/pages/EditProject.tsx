/**
 * Сторінка редагування існуючого проєкту.
 * Використовує той самий API та структуру форми, що NewProject, але:
 *  - завантажує дані по id з URL
 *  - PATCH замість POST
 *  - додатково: кнопка «Видалити проєкт» (архівування з підтвердженням)
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { apiDelete, apiGet, apiPatch, apiPost, listAll } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import type { Project, ProjectVisibility, UserShort } from '../api/types'
import { Skeleton } from '../components/Skeleton'
import { WorkflowEditor } from '../components/WorkflowEditor'
import { useWorkflow } from '../hooks/useWorkflow'
import { displayName } from '../utils/user'

const COLORS = ['#5E6AD2', '#0EA5E9', '#10B981', '#D97757', '#9665C9', '#E04B43', '#D4951F', '#1F1E1A']
const ICONS: Array<keyof typeof Ic> = ['Layout', 'Mobile', 'Repo', 'Globe', 'Beaker', 'Bug', 'Spark', 'Tag']

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

type MembershipRole = 'viewer' | 'member' | 'manager' | 'owner'

const ROLE_OPTIONS: Array<{ id: MembershipRole; label: string; desc: string }> = [
  { id: 'viewer', label: 'Спостерігач', desc: 'Лише читання' },
  { id: 'member', label: 'Учасник', desc: 'Створює і редагує задачі' },
  { id: 'manager', label: 'Менеджер', desc: 'Керує учасниками та налаштуваннями' },
]

interface Membership {
  id: number
  user: UserShort
  role: MembershipRole
}

const INTEGRATIONS: Array<{ icon: keyof typeof Ic; name: string; desc: string }> = [
  { icon: 'Github', name: 'GitHub', desc: 'Звʼяжіть репозиторій для авто-закриття багів' },
  { icon: 'Slack', name: 'Slack', desc: 'Сповіщення про fail tests та критичні баги' },
  { icon: 'Branch', name: 'GitLab', desc: 'Альтернативний git-провайдер' },
  { icon: 'AI', name: 'OpenAI', desc: 'AI-підсумки та авто-теги' },
]


interface WorkspaceShort {
  id: number
  name: string
  color: string
}

export function EditProjectPage() {
  const { id } = useParams<{ id: string }>()
  const projectId = Number(id)
  // Реальні статуси проекту з API (не hard-coded WORKFLOW).
  const { statuses: workflowStatuses } = useWorkflow(projectId)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState<keyof typeof Ic>('Layout')
  const [visibility, setVisibility] = useState<ProjectVisibility>('team')
  const [workspaceIds, setWorkspaceIds] = useState<number[]>([])
  const [workspaces, setWorkspaces] = useState<WorkspaceShort[]>([])
  const [workflowOpen, setWorkflowOpen] = useState(false)
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [ownerId, setOwnerId] = useState<number | null>(null)
  const [allUsers, setAllUsers] = useState<UserShort[]>([])
  const [memberPickerOpen, setMemberPickerOpen] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) return
    void (async () => {
      try {
        // archived=all потрібно щоб дістати і архівований проєкт
        const [project, ws, users, mems] = await Promise.all([
          apiGet<Project>(`/projects/${projectId}/?archived=all`),
          listAll<WorkspaceShort>('/workspaces/?page_size=50').catch(
            () => [] as WorkspaceShort[]
          ),
          listAll<UserShort>('/users/?page_size=200').catch(() => [] as UserShort[]),
          listAll<Membership>(`/memberships/?project=${projectId}&page_size=100`).catch(
            () => [] as Membership[]
          ),
        ])
        setName(project.name)
        setKey(project.key || '')
        setDescription(project.description || '')
        setColor(project.color || COLORS[0])
        setIcon((project.icon as keyof typeof Ic) || 'Layout')
        setVisibility(project.visibility || 'team')
        setWorkspaceIds(project.workspaces || [])
        setIsArchived(!!project.is_archived)
        setOwnerId(project.owner.id)
        setMemberships(mems)
        setWorkspaces(ws)
        setAllUsers(users)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Не вдалось завантажити', 'error')
        navigate('/dashboard')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Локально додаємо учасника (запис створиться на бекенді при сабміті)
  const addMember = (u: UserShort) => {
    if (memberships.find(m => m.user.id === u.id)) return
    setMemberships(ms => [
      ...ms,
      { id: -Date.now(), user: u, role: 'member' as MembershipRole },
    ])
  }

  const removeMember = (mid: number) => {
    setMemberships(ms => ms.filter(m => m.id !== mid))
  }

  const updateRole = (mid: number, role: MembershipRole) => {
    setMemberships(ms => ms.map(m => (m.id === mid ? { ...m, role } : m)))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Назва не може бути порожньою')
      return
    }
    setSubmitting(true)
    try {
      await apiPatch<Project>(`/projects/${projectId}/`, {
        name: name.trim(),
        key: key.trim().toUpperCase(),
        description,
        color,
        icon,
        visibility,
        workspaces: workspaceIds,
      })

      // Синхронізуємо учасників: дивимось серверний стан і обчислюємо diff
      const serverMems = await listAll<Membership>(
        `/memberships/?project=${projectId}&page_size=100`
      ).catch(() => [] as Membership[])
      const serverByUser = new Map(serverMems.map(m => [m.user.id, m]))
      const localByUser = new Map(memberships.map(m => [m.user.id, m]))

      const ops: Promise<unknown>[] = []
      // Додавання нових / зміна ролі
      for (const local of memberships) {
        const server = serverByUser.get(local.user.id)
        if (!server) {
          ops.push(
            apiPost(`/projects/${projectId}/add_member/`, {
              user_id: local.user.id,
              role: local.role,
            }).catch(() => null)
          )
        } else if (server.role !== local.role && server.role !== 'owner') {
          ops.push(
            apiPatch(`/memberships/${server.id}/`, { role: local.role }).catch(() => null)
          )
        }
      }
      // Видалення тих, кого вже немає локально (крім owner)
      for (const server of serverMems) {
        if (server.role === 'owner') continue
        if (!localByUser.has(server.user.id)) {
          ops.push(apiDelete(`/memberships/${server.id}/`).catch(() => null))
        }
      }
      await Promise.all(ops)

      window.dispatchEvent(new CustomEvent('project:created'))
      toast.show('Проєкт оновлено', 'success')
      navigate(`/bugs?project=${projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка збереження')
    } finally {
      setSubmitting(false)
    }
  }

  const restore = async () => {
    try {
      await apiPost(`/projects/${projectId}/restore/`, {})
      setIsArchived(false)
      window.dispatchEvent(new CustomEvent('project:created'))
      toast.show('Проєкт відновлено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const archive = async () => {
    const ok = await confirm({
      title: `Архівувати проєкт «${name}»?`,
      message:
        'Проєкт перестане зʼявлятися у списках, але всі задачі збережуться. Можна відновити пізніше.',
      confirmText: 'Архівувати',
      danger: true,
    })
    if (!ok) return
    try {
      await apiDelete(`/projects/${projectId}/`)
      window.dispatchEvent(new CustomEvent('project:deleted'))
      toast.show('Проєкт архівовано', 'success')
      navigate('/dashboard')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const remove = async () => {
    const ok = await confirm({
      title: `Видалити проєкт «${name}» назавжди?`,
      message:
        'Усі задачі, коментарі, вкладення та звʼязки будуть знищені без можливості відновлення. Цю дію неможливо скасувати.',
      confirmText: 'Видалити назавжди',
      danger: true,
    })
    if (!ok) return
    try {
      await apiDelete(`/projects/${projectId}/?force=true`)
      window.dispatchEvent(new CustomEvent('project:deleted'))
      toast.show('Проєкт видалено', 'success')
      navigate('/dashboard')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page" style={{ maxWidth: 960 }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 12 }}>
          <Skeleton height={400} />
        </div>
      </div>
    )
  }

  const SelectedIcon = Ic[icon] || Ic.Layout

  return (
    <div className="scroll-inner">
      <form className="form-page" onSubmit={submit}>
        <div className="form-page-head">
          <button
            type="button"
            className="btn ghost icon"
            onClick={() => navigate(`/bugs?project=${projectId}`)}
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
              Редагування проєкту
            </div>
            <h1
              style={{
                margin: '4px 0 0',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-0.015em',
              }}
            >
              {name || 'Проєкт'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {isArchived ? (
              <button type="button" className="btn primary" onClick={restore}>
                <Ic.Refresh sz={12} /> Відновити
              </button>
            ) : (
              <button type="button" className="btn" onClick={archive}>
                <Ic.Trash sz={12} /> Архівувати
              </button>
            )}
            <button type="button" className="btn danger" onClick={remove}>
              <Ic.X sz={12} /> Видалити
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => navigate(`/bugs?project=${projectId}`)}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={submitting || !name.trim()}
            >
              <Ic.Check sz={12} /> {submitting ? 'Збереження…' : 'Зберегти'}
            </button>
          </div>
        </div>

        {error && <div className="bt-error-banner">{error}</div>}

        {isArchived && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              margin: '0 0 16px',
              background: 'var(--st-closed-bg)',
              color: 'var(--st-closed-fg)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              fontSize: 13,
            }}
          >
            <Ic.Trash sz={14} />
            <span style={{ flex: 1 }}>
              <b>Цей проєкт архівований</b> — не зʼявляється у списках. Натисніть{' '}
              «Відновити», щоб повернути його у роботу.
            </span>
            <button type="button" className="btn primary sm" onClick={restore}>
              <Ic.Refresh sz={11} /> Відновити
            </button>
          </div>
        )}

        {/* Простори */}
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
              <label>Учасники ({memberships.length})</label>
              <div className="member-list">
                {memberships.length === 0 && (
                  <div
                    style={{
                      padding: 10,
                      fontSize: 12,
                      color: 'var(--fg-3)',
                      textAlign: 'center',
                    }}
                  >
                    Лише власник має доступ
                  </div>
                )}
                {memberships.map(m => {
                  const isOwner = m.role === 'owner' || m.user.id === ownerId
                  return (
                    <div key={m.id} className="member-row">
                      <Avatar user={m.user} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b
                          style={{
                            fontWeight: 500,
                            fontSize: 13,
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {displayName(m.user)}
                        </b>
                        <div
                          style={{
                            fontSize: 11.5,
                            color: 'var(--fg-3)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.user.email || `@${m.user.username}`}
                        </div>
                      </div>
                      {isOwner ? (
                        <span
                          className="tag"
                          style={{
                            background: 'var(--accent-soft)',
                            color: 'var(--accent-soft-fg)',
                            borderColor: 'transparent',
                          }}
                        >
                          Власник
                        </span>
                      ) : (
                        <>
                          <select
                            className="inp role-select"
                            value={m.role}
                            onChange={e =>
                              updateRole(m.id, e.target.value as MembershipRole)
                            }
                          >
                            {ROLE_OPTIONS.map(r => (
                              <option key={r.id} value={r.id}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="btn ghost icon sm"
                            onClick={() => removeMember(m.id)}
                            title="Прибрати"
                          >
                            <Ic.X sz={11} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                })}

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
                        Немає інших користувачів
                      </div>
                    ) : (
                      allUsers
                        .filter(u => !memberships.find(m => m.user.id === u.id))
                        .map(u => (
                          <button
                            type="button"
                            key={u.id}
                            className="drop-item"
                            onClick={() => {
                              addMember(u)
                              setMemberPickerOpen(false)
                            }}
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
                            <Ic.Plus sz={11} />
                          </button>
                        ))
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn sm ghost"
                    style={{ marginTop: 6 }}
                    onClick={() => setMemberPickerOpen(true)}
                  >
                    <Ic.Plus sz={11} /> Додати учасників
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
                      title="Налаштовується через Webhooks"
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
              {workflowStatuses.map((s, i) => (
                <span
                  key={s.id}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <div className="wf-node">
                    <span className="dot" style={{ background: s.color }} />
                    <span>{s.label}</span>
                  </div>
                  {i < workflowStatuses.length - 1 && (
                    <Ic.Chev sz={11} style={{ color: 'var(--fg-4)' }} />
                  )}
                </span>
              ))}
              <button
                type="button"
                className="btn sm ghost"
                style={{ marginLeft: 'auto' }}
                onClick={() => setWorkflowOpen(true)}
                title="Налаштувати статуси"
              >
                <Ic.Edit sz={11} /> Налаштувати
              </button>
            </div>
          </div>
        </div>
      </form>

      {workflowOpen && (
        <WorkflowEditor
          projectId={projectId}
          onClose={() => setWorkflowOpen(false)}
        />
      )}
    </div>
  )
}
