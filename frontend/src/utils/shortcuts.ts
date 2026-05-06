/**
 * Утиліти для відображення гарячих клавіш.
 *
 * Гарячі клавіші ловляться через `e.metaKey || e.ctrlKey` — тобто і Cmd на Mac,
 * і Ctrl на Windows працюють однаково. Цей файл лише для коректного
 * **відображення** символу залежно від ОС.
 */

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false
  // navigator.platform deprecated, але ще працює в усіх браузерах;
  // userAgentData — новіший API, поки не всюди підтримується.
  const plat =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    ''
  return /Mac|iPhone|iPad|iPod/i.test(plat)
}

/** Символ Cmd / Ctrl залежно від ОС. */
export const MOD_KEY = isMac() ? '⌘' : 'Ctrl'

/** Символ Shift / ⇧ залежно від ОС. */
export const SHIFT_KEY = isMac() ? '⇧' : 'Shift'

/** Backspace символ. */
export const BACKSPACE_KEY = isMac() ? '⌫' : 'Backspace'
