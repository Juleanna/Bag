import { h, type ElementProps } from './h.ts'

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

export function FormGroup(props: ElementProps, ...children: (Node | string | null)[]) {
  return h('div', { ...props, class: `form-control w-full ${props.class || ''}` }, ...children)
}

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

export function Input(props: ElementProps) {
  return h('input', {
    ...props,
    class: `input ${props.class || ''}`,
    type: props.type || 'text',
  })
}

export function Select(
  props: ElementProps & { options: { value: string; label: string }[] }
) {
  const { options, ...rest } = props
  return h(
    'select',
    {
      ...rest,
      class: `select ${props.class || ''}`,
    },
    ...options.map((opt) => h('option', { value: opt.value }, opt.label))
  )
}

export function Textarea(props: ElementProps) {
  return h('textarea', {
    ...props,
    class: `textarea ${props.class || ''}`,
  })
}
