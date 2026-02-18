/**
 * UI components for BugTracker with Tailwind + DaisyUI
 */

export type ElementProps = Record<string, any>

// Props that should NOT be set as HTML attributes
const INTERNAL_PROPS = new Set([
  'children', 'variant', 'options', 'columns', 'active', 'isOpen', 'onSubmit',
])

/**
 * JSX-like function for creating DOM elements
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  for (const [k, v] of Object.entries(props)) {
    if (INTERNAL_PROPS.has(k)) continue
    if (k === 'class') {
      el.className = v
    } else if (k.startsWith('on') && typeof v === 'function') {
      const eventName = k.substring(2).toLowerCase()
      el.addEventListener(eventName, v)
    } else if (v != null && v !== false) {
      el.setAttribute(k, String(v))
    }
  }

  for (const c of children) {
    if (c == null) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }

  return el
}

/**
 * Button
 */
export function Button(props: ElementProps & { children: string }, onClick?: () => void) {
  return h(
    'button',
    {
      ...props,
      class: `btn ${props.class || 'btn-primary'}`,
      onClick,
    },
    props.children
  )
}

/**
 * Primary button
 */
export function PrimaryButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-primary ${props.class || ''}` }, onClick)
}

/**
 * Secondary button
 */
export function SecondaryButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-outline ${props.class || ''}` }, onClick)
}

/**
 * Danger button
 */
export function DangerButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-error btn-outline ${props.class || ''}` }, onClick)
}

/**
 * Card
 */
export function Card(props: ElementProps, title: string, body: Node) {
  return h(
    'div',
    { ...props, class: `card bg-base-100 shadow-md border border-base-200 ${props.class || ''}` },
    h(
      'div',
      { class: 'card-body' },
      title ? h('h2', { class: 'card-title text-xl font-bold mb-4' }, title) : null,
      body
    )
  )
}

/**
 * Container
 */
export function Container(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `container ${props.class || ''}` }, ...children)
}

/**
 * Page header
 */
export function PageHeader(title: string, subtitle?: string) {
  return h(
    'div',
    { class: 'mb-8' },
    h('h1', { class: 'text-3xl font-bold text-base-content mb-2' }, title),
    subtitle ? h('p', { class: 'text-base-content/60' }, subtitle) : null
  )
}

/**
 * Navbar
 */
export function Navbar(props: ElementProps, ...children: (Node | string | null)[]) {
  return h(
    'nav',
    {
      ...props,
      class: `navbar bg-base-100 border-b border-base-200 shadow-sm sticky top-0 z-50 ${props.class || ''}`,
    },
    ...children
  )
}

/**
 * Navbar item
 */
export function NavbarItem(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `navbar-item ${props.class || ''}` }, ...children)
}

/**
 * Input
 */
export function Input(props: ElementProps) {
  return h('input', {
    ...props,
    class: `input ${props.class || ''}`,
    type: props.type || 'text',
  })
}

/**
 * Select — renders options from the options prop
 */
export function Select(
  props: ElementProps & { options: { value: string; label: string }[] }
) {
  const { options, ...rest } = props
  const select = h(
    'select',
    {
      ...rest,
      class: `select ${props.class || ''}`,
    },
    ...options.map((opt) => h('option', { value: opt.value }, opt.label))
  )
  return select
}

/**
 * Textarea
 */
export function Textarea(props: ElementProps) {
  return h('textarea', {
    ...props,
    class: `textarea ${props.class || ''}`,
  })
}

/**
 * Badge
 */
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

/**
 * Tab
 */
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

/**
 * Loader
 */
export function Loader() {
  return h('div', { class: 'flex items-center justify-center gap-2 py-12' },
    h('span', { class: 'loading loading-spinner loading-sm' }),
    h('span', { class: 'text-base-content/60' }, 'Loading...')
  )
}

/**
 * Alert
 */
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

/**
 * Modal
 */
export function Modal(
  props: ElementProps & { isOpen: boolean },
  ...children: (Node | string)[]
) {
  return h(
    'div',
    {
      ...props,
      class: `modal ${props.isOpen ? '' : 'hidden'} ${props.class || ''}`,
    },
    ...children
  )
}

/**
 * Form
 */
export function Form(
  props: ElementProps & { onSubmit?: (e: SubmitEvent) => void },
  ...children: (Node | string | null)[]
) {
  return h(
    'form',
    {
      ...props,
      onSubmit: (e: Event) => {
        e.preventDefault()
        props.onSubmit?.(e as SubmitEvent)
      },
    },
    ...children
  )
}

/**
 * Form group
 */
export function FormGroup(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `form-control w-full ${props.class || ''}` }, ...children)
}

/**
 * Label
 */
export function Label(props: ElementProps, ...children: (Node | string)[]) {
  return h(
    'label',
    {
      ...props,
      class: `label ${props.class || ''}`,
    },
    h('span', { class: 'label-text font-medium' }, ...children)
  )
}

/**
 * Grid — uses safe Tailwind classes
 */
export function Grid(
  props: ElementProps & { columns?: number },
  ...children: (Node | string)[]
) {
  const cols = props.columns || 3
  // Use safe class mapping instead of dynamic interpolation
  const colsClass: Record<number, string> = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
  }
  return h(
    'div',
    {
      ...props,
      class: `grid grid-cols-1 md:grid-cols-2 ${colsClass[cols] || 'lg:grid-cols-3'} gap-6 ${props.class || ''}`,
    },
    ...children
  )
}

/**
 * Status badge
 */
export function StatusBadge(status: string) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    open: { color: 'warning', label: 'Open' },
    in_progress: { color: 'primary', label: 'In Progress' },
    done: { color: 'success', label: 'Done' },
    cancelled: { color: 'error', label: 'Cancelled' },
  }

  const config = statusConfig[status] || { color: 'primary', label: status }
  return Badge({ variant: config.color as any }, config.label)
}

/**
 * Priority badge
 */
export function PriorityBadge(priority: string) {
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: 'success', label: 'Low' },
    medium: { color: 'warning', label: 'Medium' },
    high: { color: 'error', label: 'High' },
  }

  const config = priorityConfig[priority] || { color: 'primary', label: priority }
  return Badge({ variant: config.color as any }, config.label)
}

/**
 * Empty state
 */
export function EmptyState(message: string) {
  return h(
    'div',
    { class: 'flex flex-col items-center justify-center py-12' },
    h('p', { class: 'text-base-content/60 text-lg' }, message)
  )
}

/**
 * Divider
 */
export function Divider(props: ElementProps = {}) {
  return h('div', { ...props, class: `divider ${props.class || ''}` })
}

/**
 * Breadcrumb
 */
export function Breadcrumb(items: { label: string; onClick?: () => void }[]) {
  return h(
    'div',
    { class: 'breadcrumbs text-sm mb-6' },
    h(
      'ul',
      {},
      ...items.map((item) =>
        h(
          'li',
          {},
          item.onClick
            ? h('a', { class: 'link link-hover', onClick: item.onClick }, item.label)
            : item.label
        )
      )
    )
  )
}

/**
 * Toast notification
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  const toast = h('div', {
    class: 'fixed bottom-4 right-4 z-[100] animate-slide-in',
  })

  const alert = h('div', { class: `alert alert-${type} shadow-lg` }, message)
  toast.appendChild(alert)

  document.body.appendChild(toast)

  setTimeout(() => {
    toast.remove()
  }, 3000)
}

/**
 * Confirm dialog
 */
export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = h('div', {
      class: 'modal',
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
          overlay.remove()
          resolve(false)
        }
      },
    },
      h('div', { class: 'modal-box' },
        h('p', { class: 'text-lg mb-6' }, message),
        h('div', { class: 'flex gap-2 justify-end' },
          h('button', {
            class: 'btn btn-ghost',
            onClick: () => { overlay.remove(); resolve(false) },
          }, 'Cancel'),
          h('button', {
            class: 'btn btn-error',
            onClick: () => { overlay.remove(); resolve(true) },
          }, 'Confirm')
        )
      )
    )
    document.body.appendChild(overlay)
  })
}
