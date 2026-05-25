import type { UserShort } from '../api/types'

/**
 * Повертає ім'я для відображення у UI:
 *   - якщо задано first_name і/або last_name → "First Last" (з пропуском пробілів)
 *   - інакше → username
 *   - інакше → "—"
 *
 * Username використовуємо лише як @handle (наприклад, на Profile-сторінці), а скрізь у списках,
 * коментарях, активності тощо — справжнє ім'я.
 */
export function displayName(user: Pick<UserShort, 'first_name' | 'last_name' | 'username'> | null | undefined): string {
  if (!user) return '—'
  const full = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
  return full || user.username || '—'
}

/**
 * Обрізає довге ім'я для використання у native <option>. Нативний
 * <select> popup автоматично розширюється до найдовшого option-тексту,
 * і CSS-обмеження ширини на сам popup не діють — єдиний робочий fix
 * це обрізати сам рядок.
 */
export function truncateDisplayName(
  user: Pick<UserShort, 'first_name' | 'last_name' | 'username'> | null | undefined,
  max = 28,
): string {
  const s = displayName(user)
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}
