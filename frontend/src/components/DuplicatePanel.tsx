/**
 * Панель «Схожі баги» — викликається у формі нового бага, коли користувач
 * вводить title (debounce 600 мс). Допомагає QA не плодити дублікати.
 *
 * Backend: /api/ai/duplicates/ (trigram similarity на Postgres).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { AIDuplicateResult } from '../api/extras'

const STATUS_COLOR: Record<string, string> = {
  open: 'var(--st-open-fg)',
  in_progress: 'var(--st-progress-fg)',
  done: 'var(--st-resolved-fg)',
  blocked: 'var(--st-blocked-fg)',
}

export function DuplicatePanel({
  title,
  description,
  project,
  excludeId,
}: {
  title: string
  description?: string
  project?: number | null
  excludeId?: number
}) {
  const navigate = useNavigate()
  const [results, setResults] = useState<AIDuplicateResult[]>([])
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!title || title.trim().length < 5 || dismissed) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await api.aiDuplicates({
          title,
          description: description?.slice(0, 500),
          project: project ?? undefined,
          exclude_id: excludeId,
          limit: 5,
        })
        setResults(res.results)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 600)
    return () => clearTimeout(t)
  }, [title, description, project, excludeId, dismissed])

  if (dismissed || (results.length === 0 && !loading)) return null

  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-soft-fg)',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Ic.AI sz={14} style={{ color: 'var(--accent-soft-fg)' }} />
        <b style={{ fontSize: 12.5, color: 'var(--accent-soft-fg)' }}>
          Схожі баги
        </b>
        <span style={{ fontSize: 11, color: 'var(--fg-3)', marginLeft: 'auto' }}>
          {loading ? 'шукаю…' : `${results.length} знайдено`}
        </span>
        <button
          type="button"
          className="btn ghost icon sm"
          onClick={() => setDismissed(true)}
          title="Сховати"
        >
          <Ic.X sz={11} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {results.map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => navigate(`/bugs/${r.id}`)}
            style={{
              textAlign: 'left',
              padding: '8px 10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
            }}
          >
            <span className="id-cell" style={{ fontSize: 11 }}>
              BUG-{r.id}
            </span>
            <span style={{ flex: 1 }}>{r.title}</span>
            <span style={{ color: STATUS_COLOR[r.status] || 'var(--fg-3)', fontSize: 11 }}>
              {r.status_display}
            </span>
            {r.score !== null && (
              <span style={{ color: 'var(--fg-4)', fontSize: 10.5 }}>
                {Math.round(r.score * 100)}%
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
