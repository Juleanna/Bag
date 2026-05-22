/**
 * Textarea з autocomplete @згадками.
 *
 * Поведінка:
 *  - Як тільки користувач вводить «@» — відкривається dropdown з користувачами.
 *  - Подальші букви фільтрують список (по username, first_name, last_name).
 *  - ↑/↓ — навігація по варіантах, Enter або Tab — вставка вибраного,
 *    Esc — закрити без вставки.
 *  - Бекенд (issues/views_api.py CommentViewSet.perform_create) парсить
 *    @(\w+) у тілі коментаря і шле нотифікації згаданим учасникам проєкту.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Avatar } from '../atoms/Avatar'
import type { UserShort } from '../api/types'
import { displayName } from '../utils/user'

interface Props {
  value: string
  onChange: (v: string) => void
  users: UserShort[]
  placeholder?: string
  className?: string
  /** Скільки максимум варіантів показувати у dropdown. */
  maxResults?: number
  /** Submit shortcut — спрацьовує на Ctrl/Cmd+Enter (звичайний Enter
      переноситься на новий рядок). Викликається лише коли mention popup закритий. */
  onSubmit?: () => void
}

interface MentionState {
  /** Індекс символу `@` у value. */
  start: number
  /** Текст після `@` (поки що набраний). */
  query: string
}

export function MentionTextarea({
  value,
  onChange,
  users,
  placeholder,
  className,
  maxResults = 6,
  onSubmit,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [mention, setMention] = useState<MentionState | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)

  // Перевіряємо, чи курсор стоїть після «@слово» — і виставляємо стейт.
  // Викликаємо після кожної зміни value або руху курсора.
  const detectMention = () => {
    const ta = taRef.current
    if (!ta) return
    const pos = ta.selectionStart ?? 0
    const before = value.slice(0, pos)
    // Шукаємо @ найближчий зліва, але без пробілів / переносів між ним і курсором.
    const m = /(^|\s)@(\w*)$/.exec(before)
    if (m) {
      const queryStart = before.length - m[2].length - 1 // позиція самого @
      setMention({ start: queryStart, query: m[2] })
      setActiveIdx(0)
    } else {
      setMention(null)
    }
  }

  // Фільтр кандидатів. Дублікатів немає, бо проєкт повертає унікальних members.
  const candidates = useMemo(() => {
    if (!mention) return []
    const q = mention.query.toLowerCase()
    return users
      .filter(u => {
        if (!q) return true
        return (
          u.username.toLowerCase().includes(q) ||
          (u.first_name || '').toLowerCase().includes(q) ||
          (u.last_name || '').toLowerCase().includes(q)
        )
      })
      .slice(0, maxResults)
  }, [users, mention, maxResults])

  // Якщо після фільтра нічого не знайшли — приховуємо popup, інакше Esc
  // ламає логіку (нема за що клавіш ловити).
  const showPopup = !!mention && candidates.length > 0

  const insertMention = (u: UserShort) => {
    if (!mention) return
    const before = value.slice(0, mention.start)
    const after = value.slice(mention.start + 1 + mention.query.length)
    // Додаємо пробіл після username — щоб одразу можна було продовжити писати.
    const next = `${before}@${u.username} ${after}`
    onChange(next)
    setMention(null)
    // Ставимо курсор після вставленого username + пробіл.
    const newPos = before.length + u.username.length + 2
    requestAnimationFrame(() => {
      const ta = taRef.current
      if (ta) {
        ta.focus()
        ta.setSelectionRange(newPos, newPos)
      }
    })
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cmd/Ctrl+Enter — submit. Перевіряємо перш ніж дивитися popup,
    // бо це глобальний shortcut, а звичайний Enter всередині popup
    // обробляється нижче як «вставити обраний @-варіант».
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit?.()
      return
    }
    if (!showPopup) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx(i => Math.min(i + 1, candidates.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx(i => Math.max(0, i - 1))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      insertMention(candidates[activeIdx])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setMention(null)
    }
  }

  // Перевіряємо також при кліку (зміна позиції курсора без onChange).
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    const onSel = () => detectMention()
    ta.addEventListener('click', onSel)
    ta.addEventListener('keyup', onSel)
    return () => {
      ta.removeEventListener('click', onSel)
      ta.removeEventListener('keyup', onSel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="mention-wrap">
      <textarea
        ref={taRef}
        className={className}
        value={value}
        placeholder={placeholder}
        onChange={e => {
          onChange(e.target.value)
          // detectMention треба викликати після того, як стейт оновлено,
          // інакше зчитується старе value.
          requestAnimationFrame(detectMention)
        }}
        onKeyDown={onKeyDown}
      />
      {showPopup && (
        <div className="mention-popup">
          {candidates.map((u, i) => (
            <button
              key={u.id}
              type="button"
              className={`mention-item ${i === activeIdx ? 'active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              // onMouseDown а не onClick — щоб textarea не встиг втратити фокус
              // (на blur нашого textarea браузер скидає selectionStart).
              onMouseDown={e => {
                e.preventDefault()
                insertMention(u)
              }}
            >
              <Avatar user={u} />
              <div className="meta">
                <b>{displayName(u)}</b>
                <span>@{u.username}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
