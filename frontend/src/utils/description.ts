/**
 * Парсер markdown-опису бага в структуровану форму.
 *
 * Опис будується через buildDescription у NewBug як:
 *   <preamble>
 *
 *   ### Кроки відтворення
 *   1. ...
 *   2. ...
 *
 *   ### Очікуваний результат
 *   ...
 *
 *   ### Фактичний результат
 *   ...
 *
 * Цей парсер витягує preamble + список кроків. Решта секцій (Очікуваний/
 * Фактичний/Середовище) ігноруються — вони задубльовані у custom_fields і
 * рендеряться окремо у BugDetail.
 *
 * Виносимо в utils, щоб NewBug (форма редагування) і BugDetail (рендер)
 * мали спільне джерело істини щодо формату.
 */
export interface ParsedDescription {
  preamble: string
  steps: string[]
  /** Очікуваний результат — з секції «### Очікуваний результат». */
  expectedResult: string
  /** Фактичний результат — з секції «### Фактичний результат». */
  actualResult: string
}

export function parseDescription(md: string): ParsedDescription {
  if (!md) {
    return { preamble: '', steps: [], expectedResult: '', actualResult: '' }
  }
  const lines = md.split('\n')
  const preambleLines: string[] = []
  const steps: string[] = []
  const expectedLines: string[] = []
  const actualLines: string[] = []
  let section: 'preamble' | 'steps' | 'expected' | 'actual' | 'other' = 'preamble'
  for (const raw of lines) {
    const h = raw.match(/^###\s+(.*)$/)
    if (h) {
      const title = h[1].trim().toLowerCase()
      if (title.includes('крок')) section = 'steps'
      else if (title.includes('очікуван')) section = 'expected'
      else if (title.includes('фактичн')) section = 'actual'
      else section = 'other'
      continue
    }
    if (section === 'preamble') {
      preambleLines.push(raw)
    } else if (section === 'steps') {
      const m = raw.match(/^\s*\d+\.\s*(.*)$/)
      if (m && m[1].trim()) steps.push(m[1].trim())
    } else if (section === 'expected') {
      expectedLines.push(raw)
    } else if (section === 'actual') {
      actualLines.push(raw)
    }
  }
  return {
    preamble: preambleLines.join('\n').trim(),
    steps,
    expectedResult: expectedLines.join('\n').trim(),
    actualResult: actualLines.join('\n').trim(),
  }
}
