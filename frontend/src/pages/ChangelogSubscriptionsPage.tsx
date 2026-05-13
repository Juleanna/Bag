/**
 * Адмін-сторінка керування підписками на Changelog.
 *
 * Доступна лише staff. Показує всіх підписників: email, активність,
 * дату підписки. Можна тимчасово деактивувати (не отримуватимуть листи,
 * але запис лишається) або повністю видалити.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type { ChangelogSubscriptionRow } from '../api/extras'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ChangelogSubscriptionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const isAdmin = !!user?.is_staff

  const [subs, setSubs] = useState<ChangelogSubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.listChangelogSubscriptions()
      setSubs(list)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      navigate('/changelog')
      return
    }
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleActive = async (row: ChangelogSubscriptionRow) => {
    const next = !row.is_active
    setSubs(arr =>
      arr.map(s => (s.id === row.id ? { ...s, is_active: next } : s))
    )
    try {
      await api.updateChangelogSubscription(row.id, { is_active: next })
    } catch (e) {
      setSubs(arr =>
        arr.map(s =>
          s.id === row.id ? { ...s, is_active: row.is_active } : s
        )
      )
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeRow = async (row: ChangelogSubscriptionRow) => {
    const ok = await confirm({
      title: `Видалити підписку ${row.email}?`,
      message:
        'Користувач більше не отримуватиме листи про релізи. Може підписатися знову через форму на сторінці Changelog.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteChangelogSubscription(row.id)
      setSubs(arr => arr.filter(s => s.id !== row.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const activeCount = subs.filter(s => s.is_active).length

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      {/* Хлібні крихти */}
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
          type="button"
          className="btn ghost sm"
          onClick={() => navigate('/changelog')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} />
          Changelog
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span style={{ color: 'var(--fg-3)' }}>Підписки</span>
      </div>

      <div className="page-head">
        <div>
          <h1>Підписки на Changelog</h1>
          <div className="sub">
            Усього {subs.length} · Активних {activeCount}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={48} />
          ))}
        </div>
      ) : subs.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Mail sz={36} />
          <h4>Ще немає підписників</h4>
          <p>Підписки з'являться, коли користувачі заповнять форму на сторінці Changelog.</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 18 }}>Email</th>
                <th>Підписано</th>
                <th>Активна</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {subs.map(row => (
                <tr key={row.id}>
                  <td style={{ paddingLeft: 18 }}>
                    <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                      {row.email}
                    </span>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {formatDate(row.created_at)}
                  </td>
                  <td>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        fontSize: 12.5,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={() => toggleActive(row)}
                      />
                      {row.is_active ? 'Так' : 'Ні'}
                    </label>
                  </td>
                  <td className="right" style={{ paddingRight: 18 }}>
                    <button
                      type="button"
                      className="btn sm danger"
                      onClick={() => removeRow(row)}
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
    </div>
  )
}
