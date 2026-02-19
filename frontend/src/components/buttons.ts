import { h, type ElementProps } from './h.ts'

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

export function PrimaryButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-primary ${props.class || ''}` }, onClick)
}

export function SecondaryButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-outline ${props.class || ''}` }, onClick)
}

export function DangerButton(props: ElementProps & { children: string }, onClick?: () => void) {
  return Button({ ...props, class: `btn btn-error btn-outline ${props.class || ''}` }, onClick)
}
