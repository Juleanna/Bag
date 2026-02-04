/**
 * Компоненты UI для BugTracker с Tailwind + DaisyUI
 */

export type ElementProps = Record<string, any>

/**
 * JSX-подобная функция для создания элементов
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  
  for (const [k, v] of Object.entries(props)) {
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
 * Кнопка
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
 * Первичная кнопка
 */
export function PrimaryButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: 'btn btn-primary' }, onClick)
}

/**
 * Карточка
 */
export function Card(props: ElementProps, title: string, body: Node) {
  return h(
    'div',
    { ...props, class: `card bg-base-100 shadow-md border border-base-200 ${props.class || ''}` },
    h(
      'div',
      { class: 'card-body' },
      h('h2', { class: 'card-title text-xl font-bold mb-4' }, title),
      body
    )
  )
}

/**
 * Контейнер
 */
export function Container(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `container ${props.class || ''}` }, ...children)
}

/**
 * Хедер страницы
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
 * Навбар
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
 * Navbar элемент
 */
export function NavbarItem(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `navbar-item ${props.class || ''}` }, ...children)
}

/**
 * Инпут
 */
export function Input(props: ElementProps) {
  return h('input', {
    ...props,
    class: `input ${props.class || ''}`,
    type: props.type || 'text',
  })
}

/**
 * Селект
 */
export function Select(
  props: ElementProps & { options: { value: string; label: string }[] }
) {
  const select = h(
    'select',
    {
      ...props,
      class: `select ${props.class || ''}`,
    },
    h('option', { value: '', disabled: true }, 'Выберите...'),
    ...props.options.map((opt) => h('option', { value: opt.value }, opt.label))
  )
  return select
}

/**
 * Текстовое поле
 */
export function Textarea(props: ElementProps) {
  return h('textarea', {
    ...props,
    class: `textarea ${props.class || ''}`,
  })
}

/**
 * Бейдж
 */
export function Badge(
  props: ElementProps & { variant?: 'primary' | 'success' | 'warning' | 'error' }
) {
  const variant = props.variant || 'primary'
  return h('span', {
    ...props,
    class: `badge badge-${variant} ${props.class || ''}`,
  })
}

/**
 * Таб
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
 * Лоадер
 */
export function Loader() {
  return h('div', { class: 'flex items-center justify-center gap-2' },
    h('span', { class: 'loading loading-spinner loading-sm' }),
    h('span', { class: 'text-base-content/60' }, 'Загрузка...')
  )
}

/**
 * Алерт
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
 * Модальное окно
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
 * Таблица
 */
export function Table(props: ElementProps, ...rows: Node[]) {
  return h('table', { ...props, class: `table ${props.class || ''}` }, ...rows)
}

/**
 * Форма
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
 * Группа формы (для выравнивания)
 */
export function FormGroup(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `form-control w-full ${props.class || ''}` }, ...children)
}

/**
 * Лейбл
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
 * Grid контейнер
 */
export function Grid(
  props: ElementProps & { columns?: number },
  ...children: (Node | string)[]
) {
  const cols = props.columns || 3
  return h(
    'div',
    {
      ...props,
      class: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6 ${props.class || ''}`,
    },
    ...children
  )
}

/**
 * Статус бейдж
 */
export function StatusBadge(status: string) {
  const statusConfig: Record<string, { color: string; label: string }> = {
    open: { color: 'warning', label: 'В работе' },
    in_progress: { color: 'primary', label: 'В процессе' },
    done: { color: 'success', label: 'Готово' },
    cancelled: { color: 'error', label: 'Отменено' },
  }

  const config = statusConfig[status] || { color: 'default', label: status }

  return Badge({ variant: config.color as any }, config.label)
}

/**
 * Приоритет бейдж
 */
export function PriorityBadge(priority: string) {
  const priorityConfig: Record<string, { color: string; label: string }> = {
    low: { color: 'success', label: '🟢 Низкий' },
    medium: { color: 'warning', label: '🟡 Средний' },
    high: { color: 'error', label: '🔴 Высокий' },
  }

  const config = priorityConfig[priority] || { color: 'default', label: priority }

  return Badge({ variant: config.color as any }, config.label)
}

/**
 * Пустой список
 */
export function EmptyState(message: string, icon: string = '📭') {
  return h(
    'div',
    { class: 'flex flex-col items-center justify-center py-12' },
    h('div', { class: 'text-6xl mb-4' }, icon),
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
export function Breadcrumb(
  items: { label: string; href?: string }[]
) {
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
          item.href ? h('a', { href: item.href }, item.label) : item.label
        )
      )
    )
  )
}

/**
 * Success Toast
 */
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  const toast = h('div', {
    class: `toast toast-${type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}`,
  })
  
  const alert = h('div', { class: `alert alert-${type}` }, message)
  toast.appendChild(alert)
  
  document.body.appendChild(toast)
  
  setTimeout(() => {
    toast.remove()
  }, 3000)
}
