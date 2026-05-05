import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  /** Червона "небезпечна" primary-кнопка — для destructive дій (видалення тощо). */
  danger?: boolean
}

interface ConfirmCtx {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmCtx | null>(null)

interface ConfirmState {
  options: ConfirmOptions
  resolve: (result: boolean) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setState({ options, resolve })
    })
  }, [])

  const close = (result: boolean) => {
    if (state) {
      state.resolve(result)
      setState(null)
    }
  }

  // Esc — Скасувати, Enter — Підтвердити
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      close(true)
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="confirm-overlay" onClick={() => close(false)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            ref={el => el?.focus()}
            onClick={e => e.stopPropagation()}
            onKeyDown={onKey}
          >
            <h3>{state.options.title || 'Підтвердження'}</h3>
            <p>{state.options.message}</p>
            <div className="confirm-actions">
              <button className="btn" type="button" onClick={() => close(false)}>
                {state.options.cancelText || 'Скасувати'}
              </button>
              <button
                className={`btn ${state.options.danger ? 'danger' : 'primary'}`}
                type="button"
                onClick={() => close(true)}
                autoFocus
              >
                {state.options.confirmText || 'Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm має використовуватись усередині <ConfirmProvider>')
  return ctx.confirm
}
