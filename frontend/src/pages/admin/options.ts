/** Whitelist значень для select-полів адмінки. */

import type { ColorVariant, IconName } from '../../api/landing'

export const ICON_OPTIONS: { value: IconName; label: string }[] = [
  { value: 'Bug', label: '🐛 Bug' },
  { value: 'Beaker', label: '🧪 Beaker' },
  { value: 'Play', label: '▶ Play' },
  { value: 'Layout', label: '▦ Layout' },
  { value: 'Chart', label: '📊 Chart' },
  { value: 'Comment', label: '💬 Comment' },
  { value: 'Bell', label: '🔔 Bell' },
  { value: 'Lightning', label: '⚡ Lightning' },
  { value: 'AI', label: '✨ AI' },
  { value: 'User', label: '👤 User' },
  { value: 'Users', label: '👥 Users' },
  { value: 'Github', label: 'Github' },
  { value: 'Slack', label: 'Slack' },
  { value: 'Spark', label: '✦ Spark' },
  { value: 'Star', label: '★ Star' },
  { value: 'Globe', label: '🌐 Globe' },
  { value: 'Refresh', label: '↻ Refresh' },
  { value: 'Settings', label: '⚙ Settings' },
  { value: 'Lock', label: '🔒 Lock' },
  { value: 'Activity', label: '📈 Activity' },
]

export const COLOR_OPTIONS: { value: ColorVariant; label: string }[] = [
  { value: 'accent', label: 'Акцент (фіолетовий)' },
  { value: 'resolved', label: 'Зелений' },
  { value: 'progress', label: 'Жовтий' },
  { value: 'blocked', label: 'Пурпуровий' },
  { value: 'open', label: 'Червоний' },
  { value: 'closed', label: 'Сірий' },
]
