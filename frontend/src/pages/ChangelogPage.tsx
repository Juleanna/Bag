/**
 * Сторінка Changelog — історія релізів продукту.
 *
 * Вигляд за прототипом (proto/src/screens-help.jsx → Changelog):
 *  - заголовок + сегментний фільтр (Усі / Major / Minor / Patch / Security)
 *  - timeline з картками: версія, тег, дата, заголовок, summary, список змін
 *  - типи змін: new / imp / fix / sec (різні бейджі)
 *
 * Адмін-режим (user.is_staff): кнопки додавання / редагування / видалення
 * прямо на сторінці. Інші користувачі бачать read-only.
 */
import { useEffect, useMemo, useState } from 'react'
import { Ic } from '../icons/Ic'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'
import { api } from '../api/extras'
import type {
  ChangelogEntry,
  ChangelogChange,
  ChangelogChangeType,
  ChangelogTag,
} from '../api/extras'

type FilterId = 'all' | ChangelogTag

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'Усі' },
  { id: 'major', label: 'Major' },
  { id: 'minor', label: 'Minor' },
  { id: 'patch', label: 'Patches' },
  { id: 'security', label: 'Security' },
]

const TAG_STYLE: Record<ChangelogTag, { color: string; bg: string; label: string }> = {
  major: { color: 'var(--accent-soft-fg)', bg: 'var(--accent-soft)', label: 'Major' },
  minor: { color: 'var(--st-resolved-fg)', bg: 'var(--st-resolved-bg)', label: 'Minor' },
  patch: { color: 'var(--st-progress-fg)', bg: 'var(--st-progress-bg)', label: 'Patch' },
  security: {
    color: 'var(--st-blocked-fg)',
    bg: 'var(--st-blocked-bg)',
    label: 'Security',
  },
}

const TYPE_STYLE: Record<
  ChangelogChangeType,
  { label: string; color: string; bg: string }
> = {
  new: { label: 'Нове', color: 'var(--st-resolved-fg)', bg: 'var(--st-resolved-bg)' },
  imp: { label: 'Покращено', color: 'var(--accent-soft-fg)', bg: 'var(--accent-soft)' },
  fix: { label: 'Виправлено', color: 'var(--st-progress-fg)', bg: 'var(--st-progress-bg)' },
  sec: { label: 'Безпека', color: 'var(--st-blocked-fg)', bg: 'var(--st-blocked-bg)' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function ChangelogPage() {
  const { user } = useAuth()
  const toast = useToast()
  const confirm = useConfirm()
  const isAdmin = !!user?.is_staff

  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterId>('all')
  const [editing, setEditing] = useState<ChangelogEntry | null>(null)
  const [creating, setCreating] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await api.listChangelog()
      setEntries(list)
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

  const filtered = useMemo(
    () => (filter === 'all' ? entries : entries.filter(e => e.tag === filter)),
    [entries, filter]
  )

  const removeEntry = async (entry: ChangelogEntry) => {
    const ok = await confirm({
      title: `Видалити v${entry.version}?`,
      message: `«${entry.title}» буде видалено.`,
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteChangelogEntry(entry.id)
      setEntries(arr => arr.filter(e => e.id !== entry.id))
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="page" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
      <div className="page-head">
        <div>
          <h1>Changelog</h1>
          <div className="sub">Історія релізів BugTracker</div>
        </div>
        {isAdmin && (
          <div className="right">
            <button className="btn primary" onClick={() => setCreating(true)}>
              <Ic.Plus sz={12} /> Новий запис
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="seg" style={{ marginBottom: 24, width: 'fit-content' }}>
        {FILTERS.map(f => {
          const count =
            f.id === 'all' ? entries.length : entries.filter(e => e.tag === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              className={filter === f.id ? 'active' : ''}
              onClick={() => setFilter(f.id)}
            >
              {f.label}{' '}
              <span style={{ marginLeft: 4, fontSize: 10.5, color: 'var(--fg-4)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={180} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ marginTop: 40 }}>
          <Ic.Github sz={36} />
          <h4>Ще немає записів</h4>
          <p>
            {isAdmin
              ? 'Додайте перший запис кнопкою «Новий запис».'
              : 'Тут зʼявляться нотатки про релізи.'}
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: 11,
              top: 12,
              bottom: 12,
              width: 1.5,
              background: 'var(--divider)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {filtered.map(r => {
              const tag = TAG_STYLE[r.tag]
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr',
                    gap: 18,
                    position: 'relative',
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: tag.bg,
                      color: tag.color,
                      display: 'grid',
                      placeItems: 'center',
                      border: '3px solid var(--surface-1)',
                      zIndex: 1,
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: tag.color,
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="card" style={{ padding: '20px 24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 20,
                          fontWeight: 600,
                          letterSpacing: '-0.01em',
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        v{r.version}
                      </h2>
                      <span
                        className="tag"
                        style={{
                          background: tag.bg,
                          color: tag.color,
                          borderColor: 'transparent',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          fontSize: 10,
                        }}
                      >
                        {tag.label}
                      </span>
                      {!r.is_published && (
                        <span
                          className="tag"
                          style={{
                            background: 'var(--bg-3)',
                            color: 'var(--fg-3)',
                            borderColor: 'transparent',
                            fontSize: 10,
                          }}
                        >
                          Чернетка
                        </span>
                      )}
                      <span
                        style={{
                          marginLeft: 'auto',
                          fontSize: 12,
                          color: 'var(--fg-3)',
                        }}
                      >
                        {formatDate(r.release_date)}
                      </span>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            className="btn sm"
                            onClick={() => setEditing(r)}
                            title="Редагувати"
                          >
                            <Ic.Edit sz={11} />
                          </button>
                          <button
                            type="button"
                            className="btn sm danger"
                            onClick={() => removeEntry(r)}
                            title="Видалити"
                          >
                            <Ic.Trash sz={11} />
                          </button>
                        </div>
                      )}
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>
                      {r.title}
                    </h3>
                    {r.summary && (
                      <p
                        style={{
                          margin: '0 0 16px',
                          fontSize: 13.5,
                          color: 'var(--fg-2)',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {r.summary}
                      </p>
                    )}

                    <div
                      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                    >
                      {r.changes.map((c, j) => {
                        const T = TYPE_STYLE[c.type]
                        return (
                          <div
                            key={j}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              fontSize: 13,
                              lineHeight: 1.55,
                            }}
                          >
                            <span
                              style={{
                                flexShrink: 0,
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: 4,
                                background: T.bg,
                                color: T.color,
                                marginTop: 2,
                                minWidth: 80,
                                textAlign: 'center',
                                textTransform: 'uppercase',
                                letterSpacing: '0.03em',
                              }}
                            >
                              {T.label}
                            </span>
                            <span style={{ color: 'var(--fg-2)' }}>{c.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(editing || creating) && (
        <ChangelogEditor
          entry={editing}
          onClose={() => {
            setEditing(null)
            setCreating(false)
          }}
          onSaved={() => {
            setEditing(null)
            setCreating(false)
            void reload()
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// Editor (модал) — створення / редагування запису changelog
// ============================================================================

function ChangelogEditor({
  entry,
  onClose,
  onSaved,
}: {
  entry: ChangelogEntry | null
  onClose: () => void
  onSaved: () => void
}) {
  const toast = useToast()
  const isNew = !entry
  const [version, setVersion] = useState(entry?.version ?? '')
  const [releaseDate, setReleaseDate] = useState(
    entry?.release_date ?? new Date().toISOString().slice(0, 10)
  )
  const [tag, setTag] = useState<ChangelogTag>(entry?.tag ?? 'minor')
  const [title, setTitle] = useState(entry?.title ?? '')
  const [summary, setSummary] = useState(entry?.summary ?? '')
  const [changes, setChanges] = useState<ChangelogChange[]>(
    entry?.changes && entry.changes.length > 0
      ? entry.changes
      : [{ type: 'new', text: '' }]
  )
  const [isPublished, setIsPublished] = useState(entry?.is_published ?? true)
  const [saving, setSaving] = useState(false)

  const updateChange = (i: number, patch: Partial<ChangelogChange>) =>
    setChanges(arr => arr.map((c, idx) => (idx === i ? { ...c, ...patch } : c)))
  const addChange = () =>
    setChanges(arr => [...arr, { type: 'new', text: '' }])
  const removeChange = (i: number) =>
    setChanges(arr => arr.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!version.trim() || !title.trim()) {
      toast.show('Заповніть версію та заголовок', 'error')
      return
    }
    const cleanChanges = changes
      .map(c => ({ type: c.type, text: c.text.trim() }))
      .filter(c => c.text)
    if (cleanChanges.length === 0) {
      toast.show('Додайте хоча б одну зміну', 'error')
      return
    }
    setSaving(true)
    try {
      const payload = {
        version: version.trim(),
        release_date: releaseDate,
        tag,
        title: title.trim(),
        summary: summary.trim(),
        changes: cleanChanges,
        is_published: isPublished,
      }
      if (isNew) {
        await api.createChangelogEntry(payload)
        toast.show('Створено', 'success')
      } else {
        await api.updateChangelogEntry(entry!.id, payload)
        toast.show('Збережено', 'success')
      }
      onSaved()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
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
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18 }}>
            {isNew ? 'Новий запис' : `Редагування v${entry?.version}`}
          </h2>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <label className="form-lbl">Версія</label>
              <input
                className="inp"
                placeholder="4.18.0"
                value={version}
                onChange={e => setVersion(e.target.value)}
              />
            </div>
            <div>
              <label className="form-lbl">Дата</label>
              <input
                type="date"
                className="inp"
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-lbl">Тег</label>
              <select
                className="inp"
                value={tag}
                onChange={e => setTag(e.target.value as ChangelogTag)}
              >
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="patch">Patch</option>
                <option value="security">Security</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-lbl">Заголовок</label>
            <input
              className="inp"
              placeholder="Коротка назва релізу…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-lbl">Опис</label>
            <textarea
              className="inp"
              rows={3}
              placeholder="Що головне у цьому релізі"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div>
            <label className="form-lbl">Зміни</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {changes.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 6 }}>
                  <select
                    className="inp"
                    style={{ width: 130 }}
                    value={c.type}
                    onChange={e =>
                      updateChange(i, { type: e.target.value as ChangelogChangeType })
                    }
                  >
                    <option value="new">Нове</option>
                    <option value="imp">Покращено</option>
                    <option value="fix">Виправлено</option>
                    <option value="sec">Безпека</option>
                  </select>
                  <input
                    className="inp"
                    style={{ flex: 1 }}
                    placeholder="Опис зміни…"
                    value={c.text}
                    onChange={e => updateChange(i, { text: e.target.value })}
                  />
                  {changes.length > 1 && (
                    <button
                      type="button"
                      className="btn icon ghost"
                      onClick={() => removeChange(i)}
                      title="Видалити"
                    >
                      <Ic.X sz={11} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn sm ghost"
                onClick={addChange}
                style={{ alignSelf: 'flex-start' }}
              >
                <Ic.Plus sz={11} /> Додати зміну
              </button>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
            />
            Опубліковано (видно всім користувачам)
          </label>

          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
              marginTop: 8,
              paddingTop: 16,
              borderTop: '1px solid var(--divider)',
            }}
          >
            <button className="btn" onClick={onClose}>
              Скасувати
            </button>
            <button
              className="btn primary"
              onClick={submit}
              disabled={saving}
            >
              {saving ? 'Зберігаю…' : isNew ? 'Створити' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
