import { useEffect } from 'react'

/**
 * Вмикає саас-режим (скрол сторінки замість фіксованого app-shell).
 * Активний поки компонент змонтований; при анмаунті атрибут знімається.
 */
export function useSaasMode() {
  useEffect(() => {
    document.documentElement.setAttribute('data-mode', 'saas')
    return () => {
      document.documentElement.removeAttribute('data-mode')
    }
  }, [])
}
