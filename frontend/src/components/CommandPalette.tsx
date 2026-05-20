import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { MOD_KEY } from '../utils/shortcuts'

interface PaletteItem {
  id: string
  label: string
  icon: typeof Ic.Bug
  section: string
  hint?: string
  action: () => void
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: Props) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items: PaletteItem[] = [
    {
      id: 'go-dashboard',
      label: 'Огляд',
      icon: Ic.Layout,
      section: 'Перейти',
      hint: `${MOD_KEY}+1`,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'go-bugs',
      label: 'Список багів',
      icon: Ic.Bug,
      section: 'Перейти',
      hint: `${MOD_KEY}+2`,
      action: () => navigate('/bugs'),
    },
    {
      id: 'go-tests',
      label: 'Тест-кейси',
      icon: Ic.Beaker,
      section: 'Перейти',
      hint: `${MOD_KEY}+3`,
      action: () => navigate('/tests'),
    },
    {
      id: 'go-runs',
      label: 'Test Runs',
      icon: Ic.Play,
      section: 'Перейти',
      hint: `${MOD_KEY}+4`,
      action: () => navigate('/runs'),
    },
    {
      id: 'go-reports',
      label: 'Звіти',
      icon: Ic.Chart,
      section: 'Перейти',
      action: () => navigate('/reports'),
    },
    {
      id: 'go-inbox',
      label: 'Інбокс',
      icon: Ic.Inbox,
      section: 'Перейти',
      action: () => navigate('/inbox'),
    },
    {
      id: 'go-profile',
      label: 'Профіль',
      icon: Ic.User,
      section: 'Перейти',
      action: () => navigate('/profile'),
    },
    {
      id: 'create-bug',
      label: 'Новий баг',
      icon: Ic.Plus,
      section: 'Створити',
      hint: 'C',
      action: () => navigate('/bugs/new'),
    },
    {
      id: 'create-project',
      label: 'Новий проєкт',
      icon: Ic.Layout,
      section: 'Створити',
      action: () => navigate('/projects/new'),
    },
  ]

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  if (!open) return null

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(0, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = filtered[active]
      if (item) {
        item.action()
        onClose()
      }
    }
  }

  // Групування за секцією для рендеру
  const grouped = filtered.reduce<Record<string, PaletteItem[]>>((acc, i) => {
    if (!acc[i.section]) acc[i.section] = []
    acc[i.section].push(i)
    return acc
  }, {})

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp" onClick={e => e.stopPropagation()} onKeyDown={onKey}>
        <input
          ref={inputRef}
          className="cp-input"
          placeholder="Пошук команд…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <div className="cp-list">
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
              Нічого не знайдено
            </div>
          )}
          {Object.entries(grouped).map(([section, list]) => (
            <div key={section}>
              <div className="cp-section">{section}</div>
              {list.map(item => {
                const idx = filtered.indexOf(item)
                return (
                  <div
                    key={item.id}
                    className={`cp-item ${idx === active ? 'active' : ''}`}
                    onMouseEnter={() => setActive(idx)}
                    onClick={() => {
                      item.action()
                      onClose()
                    }}
                  >
                    <item.icon sz={14} />
                    <span>{item.label}</span>
                    {item.hint && <span className="meta">{item.hint}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {/* Підказка з клавішами навігації — щоб користувач бачив, що
            палітра кероване з клавіатури, без потреби читати довідку. */}
        <div className="cp-footer">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> навігація</span>
          <span><span className="kbd">↵</span> відкрити</span>
          <span><span className="kbd">esc</span> закрити</span>
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
            Усі шорткати — у довідці ({MOD_KEY}+/ або ?)
          </span>
        </div>
      </div>
    </div>
  )
}
