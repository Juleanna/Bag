import { h, type ElementProps } from './h.ts'

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

export function Container(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `container ${props.class || ''}` }, ...children)
}

export function PageHeader(title: string, subtitle?: string) {
  return h(
    'div',
    { class: 'mb-8' },
    h('h1', { class: 'text-3xl font-bold text-base-content mb-2' }, title),
    subtitle ? h('p', { class: 'text-base-content/60' }, subtitle) : null
  )
}

export function Grid(
  props: ElementProps & { columns?: number },
  ...children: (Node | string)[]
) {
  const cols = props.columns || 3
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

export function Divider(props: ElementProps = {}) {
  return h('div', { ...props, class: `divider ${props.class || ''}` })
}
