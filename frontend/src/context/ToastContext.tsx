import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type ToastKind = 'info' | 'success' | 'error'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, kind, message }])
    // Авто-приховування через 4 секунди
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="bt-toast-host">
        {toasts.map(t => (
          <div key={t.id} className={`bt-toast ${t.kind}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast має використовуватись усередині <ToastProvider>')
  return ctx
}
