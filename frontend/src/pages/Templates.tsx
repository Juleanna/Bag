/**
 * Шаблони — карткова сітка за прототипом. Пошук + фільтри типу
 * (Усі / Баги / Тест-кейси / Test Runs) + кнопки «Імпорт» і «+ Новий шаблон».
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api as extras } from '../api/extras'
import type { IssueTemplate, TemplateKind } from '../api/extras'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

type FilterKind = 'all' | TemplateKind

const FILTERS: { k: FilterKind; label: string; icon: keyof typeof Ic | null }[] = [
  { k: 'all', label: 'Усі', icon: null },
  { k: 'bug', label: 'Баги', icon: 'Bug' },
  { k: 'test_case', label: 'Тест-кейси', icon: 'Beaker' },
  { k: 'test_run', label: 'Test Runs', icon: 'Play' },
]

const KIND_META: Record<
  TemplateKind,
  { label: string; icon: keyof typeof Ic; color: string; bg: string }
> = {
  bug: {
    label: 'Bug',
    icon: 'Bug',
    color: 'var(--st-open-fg)',
    bg: 'var(--st-open-bg)',
  },
  test_case: {
    label: 'Test case',
    icon: 'Beaker',
    color: 'var(--st-resolved-fg)',
    bg: 'var(--st-resolved-bg)',
  },
  test_run: {
    label: 'Run',
    icon: 'Play',
    color: 'var(--st-progress-fg)',
    bg: 'var(--st-progress-bg)',
  },
}

export function TemplatesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [templates, setTemplates] = useState<IssueTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKind>('all')
  const [query, setQuery] = useState('')
  // Авторів витягуємо ліниво через useUsers — поки що показуємо лише name
  // через author_id (заглушка для відображення).

  useEffect(() => {
    setLoading(true)
    extras
      .listTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return templates.filter(t => {
      if (filter !== 'all' && t.kind !== filter) return false
      if (q) {
        const inName = t.name.toLowerCase().includes(q)
        const inDesc = (t.description || '').toLowerCase().includes(q)
        const inTags = (t.tags || []).some(x => x.toLowerCase().includes(q))
        if (!inName && !inDesc && !inTags) return false
      }
      return true
    })
  }, [templates, filter, query])

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
      setTemplates(arr => arr.filter(x => x.id !== t.id))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flex: 1,
            flexWrap: 'wrap',
          }}
        >
          <div className="tpl-search">
            <Ic.Search sz={12} />
            <input
              placeholder="Шукати шаблон…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="tpl-filters">
            {FILTERS.map(f => {
              const Icn = f.icon ? (Ic[f.icon] as typeof Ic.Bug) : null
              return (
                <button
                  key={f.k}
                  className={`tpl-filter ${filter === f.k ? 'active' : ''}`}
                  onClick={() => setFilter(f.k)}
                >
                  {Icn && <Icn sz={12} />} {f.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="right" style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn"
            onClick={() => toast.show('Імпорт у плані', 'info')}
          >
            <Ic.Download sz={13} /> Імпорт
          </button>
          <button
            className="btn primary"
            onClick={() => navigate('/templates/new')}
          >
            <Ic.Plus sz={13} /> Новий шаблон
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <h1 style={{ margin: 0 }}>Шаблони</h1>
        <div className="sub" style={{ marginTop: 4 }}>
          Багорепорти, тест-кейси та runs з готовою структурою ·{' '}
          {templates.length} {templates.length === 1 ? 'шаблон' : 'шаблонів'}
        </div>
      </div>

      {loading ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={220} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <Ic.Beaker sz={36} />
          <h4>{query ? 'Нічого не знайдено' : 'Поки немає шаблонів'}</h4>
          <p>
            {query
              ? 'Спробуйте інший пошуковий запит'
              : 'Створіть перший — заощаджуйте час на повторюваних задачах'}
          </p>
          {!query && (
            <button
              className="btn primary"
              style={{ marginTop: 12 }}
              onClick={() => navigate('/templates/new')}
            >
              <Ic.Plus sz={13} /> Новий шаблон
            </button>
          )}
        </div>
      ) : (
        <div className="tpl-grid">
          {filtered.map(t => {
            const meta = KIND_META[t.kind] || KIND_META.bug
            const Icn = Ic[meta.icon] as typeof Ic.Bug
            return (
              <div key={t.id} className="tpl-card">
                <div className="tpl-head">
                  <span
                    className="tpl-icon"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <Icn sz={14} />
                  </span>
                  <span
                    className="tpl-kind"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                </div>
                <h4 className="tpl-name" title={t.name}>{t.name}</h4>
                {t.description && (
                  <p className="tpl-desc" title={t.description}>{t.description}</p>
                )}
                {t.tags?.length > 0 && (
                  <div className="tpl-tags">
                    {t.tags.slice(0, 3).map(x => (
                      <span key={x} className="tag">{x}</span>
                    ))}
                  </div>
                )}
                <div className="tpl-foot">
                  <div className="author" title="Автор шаблону">
                    {/* Без додаткового запиту авторів — лише іконка-плейсхолдер. */}
                    <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--bg-2)', display: 'inline-block' }} />
                    <span>{t.author ? `#${t.author}` : '—'}</span>
                  </div>
                  <span className="usage">{t.usage_count}× використано</span>
                  <button
                    className="btn sm"
                    onClick={() => toast.show('Використання у плані', 'info')}
                  >
                    <Ic.Plus sz={11} /> Створити
                  </button>
                </div>
                {/* Дії — на hover. Редагувати/Видалити лишаються в одному
                    контейнері справа зверху, щоб не плодити кнопки в нижньому
                    рядку футера. */}
                <div className="tpl-actions">
                  <button
                    className="btn ghost icon sm"
                    onClick={() => navigate(`/templates/${t.id}/edit`)}
                    title="Редагувати"
                  >
                    <Ic.Edit sz={11} />
                  </button>
                  <button
                    className="btn ghost icon sm"
                    onClick={() => remove(t)}
                    title="Видалити"
                  >
                    <Ic.Trash sz={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
