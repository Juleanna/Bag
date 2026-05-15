/**
 * Палітра «AI-пошук» — natural language → результати багів.
 *
 * Backend: /api/ai/search/ (Postgres SearchVector + парсер ключових слів
 * типу «critical», «за тиждень», «open»).
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { AISearchResult } from '../api/extras'

const EXAMPLES = [
  'critical баги за тиждень',
  'open авторизація',
  'помилка експорту',
  'все що зломалось сьогодні',
]

export function AISearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AISearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const runSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    setHasSearched(true)
    try {
      const res = await api.aiSearch(trimmed)
      setResults(res.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

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
        placeItems: 'flex-start center',
        paddingTop: 80,
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card"
        style={{ width: 'min(640px, 92%)', padding: 0, overflow: 'hidden' }}
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            void runSearch(query)
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: '1px solid var(--divider)',
          }}
        >
          <Ic.AI sz={16} style={{ color: 'var(--accent-soft-fg)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Запитайте природньою мовою…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 15,
              color: 'var(--fg)',
              fontFamily: 'inherit',
            }}
          />
          {loading && (
            <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>шукаю…</span>
          )}
          <button
            type="button"
            className="btn ghost icon sm"
            onClick={onClose}
            title="Закрити"
          >
            <Ic.X sz={12} />
          </button>
        </form>

        <div style={{ maxHeight: 420, overflow: 'auto' }}>
          {!hasSearched ? (
            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--fg-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Приклади запитів
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXAMPLES.map(ex => (
                  <button
                    key={ex}
                    type="button"
                    className="btn sm ghost"
                    onClick={() => {
                      setQuery(ex)
                      void runSearch(ex)
                    }}
                  >
                    {ex}
                  </button>
                ))}
              </div>
              <div
                style={{
                  marginTop: 16,
                  fontSize: 11,
                  color: 'var(--fg-4)',
                  lineHeight: 1.5,
                }}
              >
                Розпізнаю: пріоритети (critical/high/medium/low), статуси
                (open/in&nbsp;progress/done/blocked), часові межі (за
                сьогодні/тиждень/місяць). Решта — повнотекстовий пошук у
                title&nbsp;+ description.
              </div>
            </div>
          ) : results.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                color: 'var(--fg-3)',
                fontSize: 13,
              }}
            >
              Нічого не знайшов за «{query}»
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    navigate(`/bugs/${r.id}`)
                    onClose()
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '10px 16px',
                    borderTop: '1px solid var(--divider)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 13,
                  }}
                >
                  <span className="id-cell" style={{ fontSize: 11 }}>
                    BUG-{r.id}
                  </span>
                  <span style={{ flex: 1 }}>{r.title}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--fg-3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.status_display} · {r.priority}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
