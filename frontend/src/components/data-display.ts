import { h, type ElementProps } from './h.ts'
import { t } from '../i18n/index.ts'

export function Badge(
  props: ElementProps & { variant?: 'primary' | 'success' | 'warning' | 'error'; children?: string },
  text?: string
) {
  const variant = props.variant || 'primary'
  const content = text || props.children || ''
  return h('span', {
    class: `badge badge-${variant} ${props.class || ''}`,
  }, content)
}

export function StatusBadge(status: string) {
  const statusColors: Record<string, string> = {
    open: 'warning',
    in_progress: 'primary',
    done: 'success',
    cancelled: 'error',
  }
  const color = statusColors[status] || 'primary'
  const label = t(status as any) || status
  return Badge({ variant: color as any }, label)
}

export function PriorityBadge(priority: string) {
  const priorityColors: Record<string, string> = {
    low: 'success',
    medium: 'warning',
    high: 'error',
  }
  const color = priorityColors[priority] || 'primary'
  const label = t(priority as any) || priority
  return Badge({ variant: color as any }, label)
}

export function Tab(props: ElementProps & { active?: boolean }, ...children: (Node | string)[]) {
  const isActive = props.active
  return h(
    'button',
    {
      ...props,
      class: `tab ${isActive ? 'tab-active' : ''} ${props.class || ''}`,
    },
    ...children
  )
}

export function Loader() {
  return h('div', { class: 'flex items-center justify-center gap-2 py-12' },
    h('span', { class: 'loading loading-spinner loading-sm' }),
    h('span', { class: 'text-base-content/60' }, t('loading'))
  )
}

export function EmptyState(message: string) {
  return h(
    'div',
    { class: 'flex flex-col items-center justify-center py-12' },
    h('p', { class: 'text-base-content/60 text-lg' }, message)
  )
}

export function Alert(
  props: ElementProps & { variant?: 'info' | 'success' | 'warning' | 'error' },
  ...children: (Node | string)[]
) {
  const variant = props.variant || 'info'
  return h(
    'div',
    {
      ...props,
      class: `alert alert-${variant} ${props.class || ''}`,
    },
    ...children
  )
}
