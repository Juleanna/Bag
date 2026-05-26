/**
 * Picker виконавця: trigger у вигляді «аватар + імʼя» (як reporter)
 * з popover-списком учасників проєкту. Замість нативного <select>,
 * де довге імʼя розтягує popup і немає аватарів.
 */
import { useEffect, useRef, useState } from 'react'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { displayName } from '../utils/user'
import type { UserShort } from '../api/types'

interface Props {
  value: number | null
  onChange: (id: number | null) => void
  users: UserShort[]
  placeholder?: string
}

export function AssigneePicker({
  value,
  onChange,
  users,
  placeholder = 'Не призначено',
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = value != null ? users.find(u => u.id === value) || null : null

  // Закриваємо popover при кліку поза ним або Escape.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      setQuery('')
      // Фокус на пошук після відкриття. setTimeout — щоб popover точно
      // змонтувався у DOM.
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const q = query.toLowerCase().trim()
  const filtered = q
    ? users.filter(u =>
        [u.username, u.first_name, u.last_name]
          .filter(Boolean)
          .some(s => (s || '').toLowerCase().includes(q)),
      )
    : users

  const pick = (id: number | null) => {
    onChange(id)
    setOpen(false)
  }

  return (
    <div className="assignee-picker" ref={wrapRef}>
      <button
        type="button"
        className="assignee-trigger"
        onClick={() => setOpen(o => !o)}
      >
        {selected ? (
          <>
            <Avatar user={selected} />
            <span className="name">{displayName(selected)}</span>
          </>
        ) : (
          <>
            <span className="placeholder-avatar">
              <Ic.User sz={12} />
            </span>
            <span className="placeholder">{placeholder}</span>
          </>
        )}
        <Ic.ChevDown sz={11} className="chev" />
      </button>
      {open && (
        <div className="assignee-popup">
          {users.length > 5 && (
            <input
              ref={inputRef}
              className="assignee-search"
              placeholder="Пошук…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          )}
          <div className="assignee-list">
            <button
              type="button"
              className={`assignee-item ${value == null ? 'active' : ''}`}
              onClick={() => pick(null)}
            >
              <span className="placeholder-avatar">
                <Ic.User sz={12} />
              </span>
              <span>{placeholder}</span>
            </button>
            {filtered.map(u => (
              <button
                key={u.id}
                type="button"
                className={`assignee-item ${value === u.id ? 'active' : ''}`}
                onClick={() => pick(u.id)}
              >
                <Avatar user={u} />
                <span>{displayName(u)}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: 12,
                  textAlign: 'center',
                  color: 'var(--fg-3)',
                  fontSize: 12,
                }}
              >
                Нічого не знайдено
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
