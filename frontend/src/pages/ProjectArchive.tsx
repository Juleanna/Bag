/**
 * Сторінка архіву проєктів — показує усі архівовані проєкти користувача
 * з можливістю відновити або повністю видалити.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { apiDelete, apiPost, listAll } from '../api/client'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { displayName } from '../utils/user'

export function ProjectArchivePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await listAll<Project>('/projects/?archived=true&page_size=100')
      setProjects(list)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restore = async (p: Project) => {
    try {
      await apiPost(`/projects/${p.id}/restore/`, {})
      setProjects(arr => arr.filter(x => x.id !== p.id))
      window.dispatchEvent(new CustomEvent('project:created'))
      toast.show(`«${p.name}» відновлено`, 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const purge = async (p: Project) => {
    const ok = await confirm({
      title: `Видалити «${p.name}» назавжди?`,
      message:
        'Усі задачі, коментарі, вкладення та звʼязки будуть знищені без можливості відновлення.',
      confirmText: 'Видалити назавжди',
      danger: true,
    })
    if (!ok) return
    try {
      // archived=all потрібен щоб ViewSet включив архівований проєкт у queryset
      // (інакше get_object → 404 "No Project matches the given query.")
      await apiDelete(`/projects/${p.id}/?force=true&archived=all`)
      setProjects(arr => arr.filter(x => x.id !== p.id))
      window.dispatchEvent(new CustomEvent('project:deleted'))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 'unset' }}>
      <div className="page-head">
        <div>
          <h1>🗑 Архів проєктів</h1>
          <div className="sub">
            Архівовані проєкти приховані зі списків. Можна відновити їх назад або
            видалити назавжди.
          </div>
        </div>
        <div className="right">
          <button className="btn" onClick={() => navigate('/dashboard')}>
            <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} /> На головну
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Trash sz={36} />
          <h4>Архів порожній</h4>
          <p>Архівовані проєкти зʼявляться тут</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ paddingLeft: 18 }}>Проєкт</th>
                <th>Архівовано</th>
                <th>Власник</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id}>
                  <td style={{ paddingLeft: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: p.color || 'var(--accent)',
                          color: 'white',
                          display: 'grid',
                          placeItems: 'center',
                          fontSize: 13,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(p.name[0] || '?').toUpperCase()}
                      </span>
                      <div>
                        <b style={{ fontSize: 13.5 }}>{p.name}</b>
                        {p.key && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: 'var(--fg-3)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            {p.key}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {p.archived_at
                      ? new Date(p.archived_at).toLocaleString('uk-UA', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="muted" style={{ fontSize: 12.5 }}>
                    {p.owner ? displayName(p.owner) : '—'}
                  </td>
                  <td className="right" style={{ paddingRight: 18 }}>
                    <button
                      type="button"
                      className="btn sm primary"
                      onClick={() => restore(p)}
                      style={{ marginRight: 6 }}
                    >
                      <Ic.Refresh sz={11} /> Відновити
                    </button>
                    <button
                      type="button"
                      className="btn sm danger"
                      onClick={() => purge(p)}
                      title="Видалити назавжди"
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
