/**
 * Адмін-сторінка керування агентами тех-підтримки.
 *
 * Адмін призначає користувачам, які категорії звернень вони можуть
 * бачити та обробляти. Адміни (is_staff) бачать усі без запису.
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { listAll } from '../api/client'
import { api } from '../api/extras'
import type {
  SupportAgentPermission,
  SupportSettings,
} from '../api/extras'
import type { UserShort } from '../api/types'

export function SupportAgentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [agents, setAgents] = useState<SupportAgentPermission[]>([])
  const [users, setUsers] = useState<UserShort[]>([])
  const [settings, setSettings] = useState<SupportSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newUserId, setNewUserId] = useState<number | null>(null)
  const [newCategories, setNewCategories] = useState<string[]>([])
  const [newAll, setNewAll] = useState(false)

  useEffect(() => {
    if (!user?.is_staff) {
      navigate('/support')
      return
    }
    void (async () => {
      try {
        const [a, u, s] = await Promise.all([
          api.listSupportAgents(),
          listAll<UserShort>('/users/?page_size=200'),
          api.getSupportSettings(),
        ])
        setAgents(a)
        setUsers(u)
        setSettings(s)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const usersById = useMemo(() => {
    const m = new Map<number, UserShort>()
    for (const u of users) m.set(u.id, u)
    return m
  }, [users])

  const availableUsers = users.filter(u => !agents.some(a => a.user === u.id))

  const submitAdd = async () => {
    if (!newUserId) {
      toast.show('Оберіть користувача', 'error')
      return
    }
    if (!newAll && newCategories.length === 0) {
      toast.show('Оберіть хоча б одну категорію або позначте «Усі»', 'error')
      return
    }
    try {
      const created = await api.createSupportAgent({
        user_id: newUserId,
        can_view_all: newAll,
        categories: newAll ? [] : newCategories,
      })
      setAgents(arr => [...arr, created])
      toast.show('Агента додано', 'success')
      setAdding(false)
      setNewUserId(null)
      setNewCategories([])
      setNewAll(false)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleCategory = async (a: SupportAgentPermission, key: string) => {
    const has = (a.categories || []).includes(key)
    const nextCats = has
      ? a.categories.filter(c => c !== key)
      : [...a.categories, key]
    setAgents(arr =>
      arr.map(x => (x.id === a.id ? { ...x, categories: nextCats } : x))
    )
    try {
      await api.updateSupportAgent(a.id, { categories: nextCats })
    } catch (e) {
      setAgents(arr =>
        arr.map(x => (x.id === a.id ? { ...x, categories: a.categories } : x))
      )
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const toggleAll = async (a: SupportAgentPermission) => {
    const next = !a.can_view_all
    setAgents(arr =>
      arr.map(x => (x.id === a.id ? { ...x, can_view_all: next } : x))
    )
    try {
      await api.updateSupportAgent(a.id, { can_view_all: next })
    } catch (e) {
      setAgents(arr =>
        arr.map(x => (x.id === a.id ? { ...x, can_view_all: a.can_view_all } : x))
      )
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeAgent = async (a: SupportAgentPermission) => {
    const ok = await confirm({
      title: `Прибрати ${a.username} з агентів?`,
      message: 'Користувач більше не отримуватиме сповіщення про нові звернення.',
      confirmText: 'Прибрати',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteSupportAgent(a.id)
      setAgents(arr => arr.filter(x => x.id !== a.id))
      toast.show('Прибрано', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

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
          onClick={() => navigate('/admin/support')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> Підтримка
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span style={{ color: 'var(--fg-3)' }}>Агенти</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Агенти підтримки</h1>
          <div className="sub">
            Хто відповідає за які категорії звернень. Адміни (is_staff) автоматично
            мають доступ до всіх категорій.
          </div>
        </div>
        <div className="right">
          {!adding && availableUsers.length > 0 && (
            <button className="btn primary" onClick={() => setAdding(true)}>
              <Ic.Plus sz={12} /> Додати агента
            </button>
          )}
        </div>
      </div>

      {/* Форма додавання */}
      {adding && settings && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Новий агент</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="form-lbl">Користувач</label>
              <select
                className="inp"
                value={newUserId ?? ''}
                onChange={e =>
                  setNewUserId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">— оберіть —</option>
                {availableUsers.map(u => {
                  const full = `${u.username}${u.email ? ` (${u.email})` : ''}`
                  // Нативний select popup розширюється до найдовшого option-
                  // тексту — обрізаємо, щоб довгі email/нікнейми не ламали ширину.
                  const short = full.length > 40 ? full.slice(0, 39) + '…' : full
                  return (
                    <option key={u.id} value={u.id} title={full}>
                      {short}
                    </option>
                  )
                })}
              </select>
            </div>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              <input
                type="checkbox"
                checked={newAll}
                onChange={e => setNewAll(e.target.checked)}
              />
              Має доступ до <b>усіх</b> категорій
            </label>
            {!newAll && (
              <div>
                <label className="form-lbl">Доступні категорії</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {settings.categories.map(c => {
                    const active = newCategories.includes(c.key)
                    return (
                      <button
                        key={c.key}
                        type="button"
                        className={`btn sm ${active ? 'primary' : ''}`}
                        onClick={() =>
                          setNewCategories(arr =>
                            active
                              ? arr.filter(k => k !== c.key)
                              : [...arr, c.key]
                          )
                        }
                      >
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                paddingTop: 12,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button
                className="btn"
                onClick={() => {
                  setAdding(false)
                  setNewUserId(null)
                  setNewCategories([])
                  setNewAll(false)
                }}
              >
                Скасувати
              </button>
              <button className="btn primary" onClick={submitAdd}>
                Додати
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <Ic.Users sz={36} />
          <h4>Ще немає агентів</h4>
          <p>
            Адміни (is_staff) бачать усі тікети без призначення. Якщо хочете
            делегувати конкретну категорію іншому співробітнику — додайте його тут.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {agents.map(a => {
            const u = usersById.get(a.user)
            return (
              <div key={a.id} className="card" style={{ padding: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <b style={{ fontSize: 14 }}>{a.username || u?.username}</b>
                    {a.email && (
                      <span
                        style={{ color: 'var(--fg-3)', marginLeft: 8, fontSize: 12.5 }}
                      >
                        {a.email}
                      </span>
                    )}
                  </div>
                  <button
                    className="btn sm danger"
                    onClick={() => removeAgent(a)}
                    title="Прибрати"
                  >
                    <Ic.Trash sz={11} />
                  </button>
                </div>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 12.5,
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={a.can_view_all}
                    onChange={() => toggleAll(a)}
                  />
                  Має доступ до <b>усіх</b> категорій
                </label>
                {!a.can_view_all && settings && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {settings.categories.map(c => {
                      const active = (a.categories || []).includes(c.key)
                      return (
                        <button
                          key={c.key}
                          type="button"
                          className={`btn sm ${active ? 'primary' : ''}`}
                          onClick={() => toggleCategory(a, c.key)}
                        >
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
