import { useEffect, useState } from 'react'
import { Ic } from '../../icons/Ic'
import { landingAdmin, unwrapList } from '../../api/landing'
import type { ChangeLogEntry } from '../../api/landing'

const ACTION_LABELS: Record<ChangeLogEntry['action'], string> = {
  created: 'Створено',
  updated: 'Оновлено',
  deleted: 'Видалено',
  published: 'Опубліковано',
  unpublished: 'Знято з публікації',
  published_draft: 'Опублікований чорновик',
  draft_discarded: 'Чорновик скасовано',
}

const ACTION_COLORS: Record<ChangeLogEntry['action'], { bg: string; fg: string }> = {
  created: { bg: 'var(--accent-soft)', fg: 'var(--accent-soft-fg)' },
  updated: { bg: 'var(--st-progress-bg)', fg: 'var(--st-progress-fg)' },
  deleted: { bg: 'var(--st-open-bg)', fg: 'var(--st-open-fg)' },
  published: { bg: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)' },
  unpublished: { bg: 'var(--st-closed-bg)', fg: 'var(--st-closed-fg)' },
  published_draft: { bg: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)' },
  draft_discarded: { bg: 'var(--st-closed-bg)', fg: 'var(--st-closed-fg)' },
}

const MODEL_LABELS: Record<string, string> = {
  landinghero: 'Hero',
  landingsettings: 'Налаштування',
  landingfeature: 'Можливість',
  landingusecase: 'Use Case',
  landingintegration: 'Інтеграція',
  landingmetric: 'Метрика',
  landingtestimonial: 'Відгук',
  landingfaqitem: 'FAQ',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  return d.toLocaleString('uk-UA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminChangeLog() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterModel, setFilterModel] = useState<string>('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const reload = async () => {
    setLoading(true)
    try {
      const params: { model?: string } = {}
      if (filterModel) params.model = filterModel
      const res = await landingAdmin.listChangeLog(params)
      setEntries(unwrapList(res))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModel])

  return (
    <>
      <h1>Журнал змін</h1>
      <p className="sub">
        Усі дії на лендінгу — створення, оновлення, публікація, видалення. Зберігається останні 200
        записів.
      </p>

      <div className="admin-form-section">
        <div className="field">
          <label>Фільтр по типу</label>
          <select
            className="inp"
            value={filterModel}
            onChange={e => setFilterModel(e.target.value)}
          >
            <option value="">Усі типи</option>
            {Object.entries(MODEL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="bt-spinner" />}

      {!loading && entries.length === 0 && (
        <div className="empty">
          <Ic.Activity sz={32} />
          <h4>Записів немає</h4>
          <p>Зробіть будь-яку зміну в адмін-панелі — вона з'явиться тут.</p>
        </div>
      )}

      {!loading &&
        entries.map(entry => {
          const color = ACTION_COLORS[entry.action]
          const isExpanded = expanded === entry.id
          return (
            <div key={entry.id} className="admin-item-card">
              <div
                className="admin-item-head"
                style={{ marginBottom: isExpanded ? 10 : 0, cursor: 'pointer' }}
                onClick={() => setExpanded(isExpanded ? null : entry.id)}
              >
                <span
                  className="pill"
                  style={{
                    background: color.bg,
                    color: color.fg,
                  }}
                >
                  {ACTION_LABELS[entry.action]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>
                    {MODEL_LABELS[entry.model_name] || entry.model_name}
                    {entry.object_id != null && ` #${entry.object_id}`}
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
                    {entry.object_label || '—'}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--fg-3)',
                    textAlign: 'right',
                    minWidth: 120,
                  }}
                >
                  <div>{entry.user_name || 'system'}</div>
                  <div>{formatDate(entry.timestamp)}</div>
                </div>
                <Ic.Chev
                  sz={12}
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                />
              </div>

              {isExpanded && entry.data_snapshot && (
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    background: 'var(--bg-2)',
                    borderRadius: 7,
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    overflow: 'auto',
                    maxHeight: 300,
                  }}
                >
                  {JSON.stringify(entry.data_snapshot, null, 2)}
                </pre>
              )}
            </div>
          )
        })}
    </>
  )
}
