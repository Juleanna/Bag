import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchLandingPublic } from '../api/landing'
import type { Lang, LandingPublic } from '../api/landing'

interface LandingCtx {
  data: LandingPublic | null
  loading: boolean
  error: string | null
  /** Поточна мова рендеру лендінгу (зберігається в localStorage). */
  lang: Lang
  setLang: (lang: Lang) => void
  /** Preview-режим — показує чорновики (тільки для staff). */
  preview: boolean
  setPreview: (v: boolean) => void
  refresh: () => Promise<void>
}

const LandingContext = createContext<LandingCtx | null>(null)

const LANG_STORAGE = 'bugtracker-landing-lang'

function loadLang(): Lang {
  const v = localStorage.getItem(LANG_STORAGE)
  return v === 'en' ? 'en' : 'uk'
}

export function LandingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<LandingPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLangState] = useState<Lang>(loadLang)
  const [preview, setPreview] = useState(false)

  const refresh = useCallback(async () => {
    try {
      // Без ?lang — backend повертає dict {uk, en}, frontend сам обирає
      // потрібну мову через t() з нашого `lang` стану.
      const res = await fetchLandingPublic({ preview: preview || undefined })
      setData(res)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Помилка завантаження лендінгу')
    } finally {
      setLoading(false)
    }
  }, [preview])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setLang = (next: Lang) => {
    setLangState(next)
    localStorage.setItem(LANG_STORAGE, next)
  }

  return (
    <LandingContext.Provider
      value={{ data, loading, error, lang, setLang, preview, setPreview, refresh }}
    >
      {children}
    </LandingContext.Provider>
  )
}

export function useLanding(): LandingCtx {
  const ctx = useContext(LandingContext)
  if (!ctx) throw new Error('useLanding має використовуватись усередині <LandingProvider>')
  return ctx
}
