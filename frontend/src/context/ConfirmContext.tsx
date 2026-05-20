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

export interface PromptOptions {
  title?: string
  /** Текст-підказка над полем вводу. */
  message?: string
  /** Початкове значення поля. */
  defaultValue?: string
  /** Placeholder поля вводу. */
  placeholder?: string
  /** Текст кнопки підтвердження. */
  confirmText?: string
  cancelText?: string
  /** Тип input-а (text / password / number). */
  inputType?: 'text' | 'password' | 'number'
  /** Не дозволяти підтвердити порожнє значення (тримова: false). */
  required?: boolean
}

interface ConfirmCtx {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  /** Модальний prompt — повертає рядок або null, якщо скасовано. */
  prompt: (options: PromptOptions) => Promise<string | null>
}

const ConfirmContext = createContext<ConfirmCtx | null>(null)

interface ConfirmState {
  options: ConfirmOptions
  resolve: (result: boolean) => void
}

interface PromptState {
  options: PromptOptions
  resolve: (result: string | null) => void
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [promptState, setPromptState] = useState<PromptState | null>(null)
  const [promptValue, setPromptValue] = useState('')
  // Помилка валідації prompt'а — підсвічуємо input і показуємо текст.
  // Раніше при required + порожньому кнопка просто стояла disabled, і
  // тестери трактували це як «нічого не відбувається» (BUG-17).
  const [promptError, setPromptError] = useState<string | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({ options, resolve })
    })
  }, [])

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>(resolve => {
      setPromptValue(options.defaultValue || '')
      setPromptError(null)
      setPromptState({ options, resolve })
    })
  }, [])

  const closeConfirm = (result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result)
      setConfirmState(null)
    }
  }

  const closePrompt = (result: string | null) => {
    if (promptState) {
      promptState.resolve(result)
      setPromptState(null)
      setPromptValue('')
      setPromptError(null)
    }
  }

  // Esc — Скасувати, Enter — Підтвердити
  const onKeyConfirm = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeConfirm(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      closeConfirm(true)
    }
  }

  const submitPrompt = () => {
    if (!promptState) return
    const v = promptValue.trim()
    if (promptState.options.required && !v) {
      // Показуємо помилку замість мовчазного no-op — тестер бачить
      // зрозумілий фідбек, чому кнопка нічого не зробила.
      setPromptError('Поле обовʼязкове для заповнення')
      return
    }
    closePrompt(promptValue)
  }

  const onKeyPrompt = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closePrompt(null)
    } else if (e.key === 'Enter' && !(e.target as HTMLElement).matches('textarea')) {
      e.preventDefault()
      submitPrompt()
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {confirmState && (
        <div className="confirm-overlay" onClick={() => closeConfirm(false)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            ref={el => el?.focus()}
            onClick={e => e.stopPropagation()}
            onKeyDown={onKeyConfirm}
          >
            <h3>{confirmState.options.title || 'Підтвердження'}</h3>
            <p>{confirmState.options.message}</p>
            <div className="confirm-actions">
              <button className="btn" type="button" onClick={() => closeConfirm(false)}>
                {confirmState.options.cancelText || 'Скасувати'}
              </button>
              <button
                className={`btn ${confirmState.options.danger ? 'danger' : 'primary'}`}
                type="button"
                onClick={() => closeConfirm(true)}
                autoFocus
              >
                {confirmState.options.confirmText || 'Підтвердити'}
              </button>
            </div>
          </div>
        </div>
      )}

      {promptState && (
        <div className="confirm-overlay" onClick={() => closePrompt(null)}>
          <div
            className="confirm-dialog"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            onKeyDown={onKeyPrompt}
          >
            <h3>{promptState.options.title || 'Введіть значення'}</h3>
            {promptState.options.message && (
              <p style={{ marginBottom: 10 }}>{promptState.options.message}</p>
            )}
            <input
              className="inp"
              type={promptState.options.inputType || 'text'}
              value={promptValue}
              onChange={e => {
                setPromptValue(e.target.value)
                // Скидаємо помилку як тільки користувач почав вводити.
                if (promptError) setPromptError(null)
              }}
              placeholder={promptState.options.placeholder}
              autoFocus
              style={
                promptError
                  ? { borderColor: 'var(--pri-high)', outline: 'none' }
                  : undefined
              }
            />
            {promptError && (
              <div
                style={{
                  color: 'var(--pri-high)',
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {promptError}
              </div>
            )}
            <div className="confirm-actions">
              <button className="btn" type="button" onClick={() => closePrompt(null)}>
                {promptState.options.cancelText || 'Скасувати'}
              </button>
              <button className="btn primary" type="button" onClick={submitPrompt}>
                {promptState.options.confirmText || 'OK'}
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

export function usePrompt() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('usePrompt має використовуватись усередині <ConfirmProvider>')
  return ctx.prompt
}
