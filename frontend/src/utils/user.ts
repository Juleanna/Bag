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
