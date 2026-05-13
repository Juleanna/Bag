/**
 * Спільні стилі та іконки для категорій звернень у Support.
 * Використовується і на сторінці /support (рендер карток), і у адмінці
 * /admin/support (селектори в формі редагування).
 */
import type { ComponentType, CSSProperties } from 'react'
import { Ic } from '../icons/Ic'
import type {
  SupportCategoryIcon,
  SupportCategoryTone,
} from '../api/extras'

// Реальні React-компоненти іконок з Ic.tsx
export const SUPPORT_ICONS: Record<
  SupportCategoryIcon,
  ComponentType<{ sz?: number; style?: CSSProperties }>
> = {
  bug: Ic.Bug,
  help: Ic.Help,
  lightning: Ic.Lightning,
  card: Ic.Settings, // прихована плата — Settings/gear як найближче
  users: Ic.Users,
  lock: Ic.Lock,
  mail: Ic.Mail,
  globe: Ic.Globe,
}

export const SUPPORT_ICON_OPTIONS: { id: SupportCategoryIcon; label: string }[] = [
  { id: 'bug', label: 'Жук (Bug)' },
  { id: 'help', label: 'Питання' },
  { id: 'lightning', label: 'Блискавка' },
  { id: 'card', label: 'Шестерня' },
  { id: 'users', label: 'Люди' },
  { id: 'lock', label: 'Замок' },
  { id: 'mail', label: 'Конверт' },
  { id: 'globe', label: 'Глобус' },
]

// Кольори: статичний фон+рамка для активної картки, плюс акцентний колір.
export const SUPPORT_TONE_STYLES: Record<
  SupportCategoryTone,
  {
    label: string
    activeBg: string
    activeBorder: string
    activeColor: string
    iconBg: string
    iconColor: string
  }
> = {
  red: {
    label: 'Червоний',
    activeBg: 'var(--st-open-bg)',
    activeBorder: 'var(--st-open-dot)',
    activeColor: 'var(--st-open-fg)',
    iconBg: 'var(--st-open-bg)',
    iconColor: 'var(--st-open-fg)',
  },
  blue: {
    label: 'Синій',
    activeBg: 'var(--accent-soft)',
    activeBorder: 'var(--accent)',
    activeColor: 'var(--accent-soft-fg)',
    iconBg: 'var(--accent-soft)',
    iconColor: 'var(--accent-soft-fg)',
  },
  green: {
    label: 'Зелений',
    activeBg: 'var(--st-resolved-bg)',
    activeBorder: 'var(--st-resolved-dot)',
    activeColor: 'var(--st-resolved-fg)',
    iconBg: 'var(--st-resolved-bg)',
    iconColor: 'var(--st-resolved-fg)',
  },
  yellow: {
    label: 'Жовтий',
    activeBg: 'var(--st-progress-bg)',
    activeBorder: 'var(--st-progress-dot)',
    activeColor: 'var(--st-progress-fg)',
    iconBg: 'var(--st-progress-bg)',
    iconColor: 'var(--st-progress-fg)',
  },
  purple: {
    label: 'Фіолетовий',
    activeBg: 'var(--accent-soft)',
    activeBorder: 'var(--accent)',
    activeColor: 'var(--accent-soft-fg)',
    iconBg: 'var(--accent-soft)',
    iconColor: 'var(--accent-soft-fg)',
  },
  gray: {
    label: 'Сірий',
    activeBg: 'var(--bg-2)',
    activeBorder: 'var(--border-strong)',
    activeColor: 'var(--fg-2)',
    iconBg: 'var(--bg-2)',
    iconColor: 'var(--fg-2)',
  },
}

export const SUPPORT_TONE_OPTIONS: { id: SupportCategoryTone; label: string }[] =
  Object.entries(SUPPORT_TONE_STYLES).map(([id, v]) => ({
    id: id as SupportCategoryTone,
    label: v.label,
  }))
