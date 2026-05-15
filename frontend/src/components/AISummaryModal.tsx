/**
 * Modal зі стислим конспектом треда коментарів бага.
 *
 * Backend: /api/ai/summarize/ (extractive TextRank-подібний score).
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { AISummaryResult } from '../api/extras'

export function AISummaryModal({
  issueId,
  onClose,
}: {
  issueId: number
  onClose: () => void
}) {
  const [data, setData] = useState<AISummaryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await api.aiSummarize(issueId)
        setData(res)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Помилка')
      } finally {
        setLoading(false)
      }
    })()
  }, [issueId])

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '85vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ic.AI sz={14} style={{ color: 'var(--accent-soft-fg)' }} />
            Конспект обговорення
          </h2>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
            Аналізую тред…
          </div>
        ) : error ? (
          <div style={{ color: 'var(--st-open-fg)', fontSize: 13 }}>{error}</div>
        ) : data ? (
          <>
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-3)',
                marginBottom: 12,
              }}
            >
              На основі {data.comments_total}{' '}
              {data.comments_total === 1 ? 'коментаря' : 'коментарів'}
              {data.first_author &&
                data.last_author &&
                ` · від ${data.first_author} до ${data.last_author}`}
            </div>
            <div
              style={{
                fontSize: 13.5,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                padding: 14,
                background: 'var(--accent-soft)',
                borderRadius: 10,
                marginBottom: 16,
                color: 'var(--fg-2)',
              }}
            >
              {data.summary}
            </div>
            {data.highlights.length > 0 && (
              <>
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: 11,
                    color: 'var(--fg-3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  Ключові репліки
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.highlights.map((h, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 10,
                        background: 'var(--surface-2)',
                        borderRadius: 8,
                        fontSize: 12.5,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--fg-3)',
                          marginBottom: 4,
                        }}
                      >
                        <b style={{ color: 'var(--fg-2)' }}>{h.author}</b>
                        {h.when &&
                          ` · ${new Date(h.when).toLocaleString('uk-UA', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`}
                      </div>
                      <div>{h.text}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div
              style={{
                marginTop: 16,
                fontSize: 11,
                color: 'var(--fg-4)',
              }}
            >
              Алгоритмічний extractive-конспект (без LLM). Точно цитує реальні
              слова з треда.
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
