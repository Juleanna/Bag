/**
 * Issue Templates — список шаблонів багів для швидкого створення нових,
 * з типовим описом, пріоритетом та чек-лістом.
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { api as extras } from '../api/extras'
import type { IssueTemplate } from '../api/extras'
import type { Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

const EMPTY: Partial<IssueTemplate> = {
  name: '',
  description_template: '',
  default_priority: 'medium',
  project: null,
}

export function TemplatesPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const [templates, setTemplates] = useState<IssueTemplate[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partial<IssueTemplate> | null>(null)

  const reload = () => {
    setLoading(true)
    Promise.all([
      extras.listTemplates().catch(() => [] as IssueTemplate[]),
      listAll<Project>('/projects/?page_size=50').catch(() => [] as Project[]),
    ])
      .then(([ts, ps]) => {
        setTemplates(ts)
        setProjects(ps)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  const startEdit = (t: Partial<IssueTemplate> = EMPTY) => {
    setEditing({ ...t })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    try {
      await extras.createTemplate(editing)
      setEditing(null)
      toast.show('Шаблон збережено', 'success')
      reload()
    } catch (err) {
      toast.show(err instanceof Error ? err.message : 'Помилка', 'error')
    }
  }

  const remove = async (t: IssueTemplate) => {
    const ok = await confirm({
      title: `Видалити шаблон «${t.name}»?`,
      message: 'Цю дію неможливо скасувати.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await extras.deleteTemplate(t.id)
      reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Шаблони багів</h1>
          <div className="sub">
            Готові форми для типових типів задач — пришвидшує створення
          </div>
        </div>
        <div className="right">
          <button className="btn primary" onClick={() => startEdit()}>
            <Ic.Plus sz={13} /> Новий шаблон
          </button>
        </div>
      </div>

      {editing && (
        <form className="card" style={{ padding: 18, marginBottom: 16 }} onSubmit={save}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>
            {editing.id ? 'Редагування шаблону' : 'Новий шаблон'}
          </h3>
          <div className="admin-grid-2">
            <div className="field">
              <label>Назва *</label>
              <input
                className="inp"
                value={editing.name || ''}
                onChange={e => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label>Проєкт</label>
              <select
                className="inp"
                value={editing.project ?? ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    project: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Глобальний</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Типовий пріоритет</label>
              <select
                className="inp"
                value={editing.default_priority || 'medium'}
                onChange={e => setEditing({ ...editing, default_priority: e.target.value })}
              >
                <option value="low">Низький</option>
                <option value="medium">Середній</option>
                <option value="high">Високий</option>
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Шаблон опису</label>
              <textarea
                className="inp"
                rows={6}
                value={editing.description_template || ''}
                onChange={e =>
                  setEditing({ ...editing, description_template: e.target.value })
                }
                placeholder={`### Кроки для відтворення\n1.\n2.\n\n### Очікувано\n\n### Фактично`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button type="button" className="btn ghost" onClick={() => setEditing(null)}>
              Скасувати
            </button>
            <button type="submit" className="btn primary">
              Зберегти
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={56} />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="empty" style={{ marginTop: 60 }}>
          <Ic.Beaker sz={36} />
          <h4>Поки немає шаблонів</h4>
          <p>Створіть перший — заощаджуйте час на повторюваних задачах</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Назва</th>
                <th>Проєкт</th>
                <th>Пріоритет</th>
                <th>Custom-поля</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t.id}>
                  <td>
                    <b>{t.name}</b>
                    {t.description_template && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: 'var(--fg-3)',
                          maxWidth: 360,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.description_template.slice(0, 80)}…
                      </div>
                    )}
                  </td>
                  <td className="muted">
                    {t.project
                      ? projects.find(p => p.id === t.project)?.name || `#${t.project}`
                      : 'глобальний'}
                  </td>
                  <td>{t.default_priority}</td>
                  <td className="muted">{t.custom_fields_schema?.length || 0} полів</td>
                  <td className="right">
                    <button
                      className="btn ghost icon sm"
                      title="Редагувати"
                      onClick={() => startEdit(t)}
                    >
                      <Ic.Edit sz={11} />
                    </button>
                    <button
                      className="btn ghost icon sm"
                      title="Видалити"
                      onClick={() => remove(t)}
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
