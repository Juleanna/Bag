import { h, type ElementProps } from './h.ts'
import { t } from '../i18n/index.ts'

export function Modal(
  props: ElementProps & { isOpen: boolean },
  ...children: (Node | string)[]
) {
  return h(
    'div',
    {
      ...props,
      class: `bt-overlay ${props.isOpen ? '' : 'bt-hidden'} ${props.class || ''}`,
    },
    ...children
  )
}

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

export function showConfirm(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = h('div', {
      class: 'bt-overlay',
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) {
          overlay.remove()
          resolve(false)
        }
      },
    },
      h('div', { class: 'bt-modal-box' },
        h('p', { class: 'text-lg mb-6' }, message),
        h('div', { class: 'flex gap-2 justify-end' },
          h('button', {
            class: 'btn btn-ghost',
            onClick: () => { overlay.remove(); resolve(false) },
          }, t('cancel')),
          h('button', {
            class: 'btn btn-error',
            onClick: () => { overlay.remove(); resolve(true) },
          }, t('confirm'))
        )
      )
    )
    document.body.appendChild(overlay)
  })
}
