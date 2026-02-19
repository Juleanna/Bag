import { en } from './en.ts'
import { uk } from './uk.ts'
import { ru } from './ru.ts'

export type Lang = 'en' | 'uk' | 'ru'
export type TranslationKeys = keyof typeof en

const translations: Record<Lang, Record<string, string>> = { en, uk, ru }

const STORAGE_KEY = 'bugtracker-lang'

let currentLang: Lang = (localStorage.getItem(STORAGE_KEY) as Lang) || 'en'

export function getLang(): Lang {
  return currentLang
}

export function setLang(lang: Lang) {
  currentLang = lang
  localStorage.setItem(STORAGE_KEY, lang)
}

export function t(key: TranslationKeys, params?: Record<string, string | number>): string {
  let text = translations[currentLang]?.[key] || translations.en[key] || key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

export const langNames: Record<Lang, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
}
