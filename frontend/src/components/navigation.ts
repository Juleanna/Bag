import { h, type ElementProps } from './h.ts'

export function Navbar(props: ElementProps, ...children: (Node | string | null)[]) {
  return h(
    'nav',
    {
      ...props,
      class: `navbar bg-base-100 border-b border-base-200 shadow-sm sticky top-0 z-50 px-4 sm:px-6 lg:px-8 ${props.class || ''}`,
    },
    ...children
  )
}

export function NavbarItem(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `navbar-item ${props.class || ''}` }, ...children)
}

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
