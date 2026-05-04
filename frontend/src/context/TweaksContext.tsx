import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export interface Tweaks {
  theme: 'light' | 'dark'
  accent: string
  density: 'compact' | 'comfortable'
  fontSize: number
  sidebarWidth: number
  borderRadius: number
}

const DEFAULT_TWEAKS: Tweaks = {
  theme: 'light',
  accent: '#5E6AD2',
  density: 'comfortable',
  fontSize: 14,
  sidebarWidth: 240,
  borderRadius: 12,
}

const STORAGE_KEY = 'bugtracker-tweaks'

interface TweaksCtx {
  tweaks: Tweaks
  set: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
  reset: () => void
}

const TweaksContext = createContext<TweaksCtx | null>(null)

function loadTweaks(): Tweaks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_TWEAKS, ...JSON.parse(raw) }
  } catch {
    /* ігноруємо помилки парсингу */
  }
  return DEFAULT_TWEAKS
}

// Перетворення hex → rgba для accent-soft
function withAlpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

function adjustAccent(hex: string, amt = -10): string {
  const n = parseInt(hex.slice(1), 16)
  let r = (n >> 16) + amt
  let g = ((n >> 8) & 255) + amt
  let b = (n & 255) + amt
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')
}

export function TweaksProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<Tweaks>(loadTweaks)

  // Зберігаємо у localStorage + застосовуємо CSS-змінні до <html>
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks))
    const root = document.documentElement
    root.setAttribute('data-theme', tweaks.theme)
    root.setAttribute('data-density', tweaks.density)
    root.style.setProperty('--accent', tweaks.accent)
    root.style.setProperty('--accent-soft', withAlpha(tweaks.accent, 0.13))
    root.style.setProperty('--accent-soft-fg', adjustAccent(tweaks.accent, -30))
    root.style.setProperty('--base-fz', `${tweaks.fontSize}px`)
    root.style.setProperty('--radius-lg', `${tweaks.borderRadius}px`)
    root.style.setProperty('--sidebar-w', `${tweaks.sidebarWidth}px`)
  }, [tweaks])

  const set = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks(prev => ({ ...prev, [key]: value }))
  }

  const reset = () => setTweaks(DEFAULT_TWEAKS)

  return <TweaksContext.Provider value={{ tweaks, set, reset }}>{children}</TweaksContext.Provider>
}

export function useTweaks(): TweaksCtx {
  const ctx = useContext(TweaksContext)
  if (!ctx) throw new Error('useTweaks має використовуватись усередині <TweaksProvider>')
  return ctx
}
