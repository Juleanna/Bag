import type { UserShort } from '../api/types'

// Гарантовано детермінований колір аватара від ID/username.
// 6 градієнтів — як у прототипі.
const GRADIENTS = [
  'linear-gradient(135deg,#F4A261,#E76F51)',
  'linear-gradient(135deg,#6BB6FF,#4651B5)',
  'linear-gradient(135deg,#9665C9,#6B3F9C)',
  'linear-gradient(135deg,#4CA85C,#2F7A3D)',
  'linear-gradient(135deg,#E04B43,#B8413A)',
  'linear-gradient(135deg,#D4951F,#9A6B0F)',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function gradientFor(key: string | number): string {
  return GRADIENTS[hashStr(String(key)) % GRADIENTS.length]
}

export function initialsFor(user: Pick<UserShort, 'username' | 'first_name' | 'last_name'>): string {
  const fn = (user.first_name || '').trim()
  const ln = (user.last_name || '').trim()
  if (fn || ln) return `${fn[0] || ''}${ln[0] || ''}`.toUpperCase().slice(0, 2)
  return (user.username || '?').slice(0, 2).toUpperCase()
}

interface AvatarProps {
  user: UserShort | null | undefined
  size?: 'sm' | 'lg'
  title?: string
}

export function Avatar({ user, size = 'sm', title }: AvatarProps) {
  if (!user) {
    return (
      <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} style={{ background: 'var(--bg-2)', color: 'var(--fg-3)' }}>
        ?
      </span>
    )
  }
  // Якщо є завантажена аватарка — показуємо її як фонове зображення.
  if (user.avatar_url) {
    return (
      <span
        className={`avatar ${size === 'lg' ? 'lg' : ''}`}
        style={{
          backgroundImage: `url(${user.avatar_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'var(--bg-2)',
          color: 'transparent',
        }}
        title={title || user.username}
      >
        {/* Прозорий fallback на випадок, якщо зображення не завантажиться */}
        {initialsFor(user)}
      </span>
    )
  }
  const initials = initialsFor(user)
  return (
    <span
      className={`avatar ${size === 'lg' ? 'lg' : ''}`}
      style={{ background: gradientFor(user.id ?? user.username) }}
      title={title || user.username}
    >
      {initials}
    </span>
  )
}

export function AvatarStack({
  users,
  max = 3,
}: {
  users: UserShort[]
  max?: number
}) {
  const shown = users.slice(0, max)
  const extra = users.length - max
  return (
    <span className="avatar-stack">
      {shown.map(u => (
        <Avatar key={u.id} user={u} />
      ))}
      {extra > 0 && (
        <span className="avatar" style={{ background: 'var(--bg-2)', color: 'var(--fg-3)' }}>
          +{extra}
        </span>
      )}
    </span>
  )
}
