import { h } from './components.ts'
import { getLang } from './i18n/index.ts'
import { state } from './state.ts'

export function closeModal(id: string) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.add('bt-hidden')
}

export function openModal(id: string) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.remove('bt-hidden')
}

export function modalWrapper(id: string, title: string, content: Node): Node {
  return h(
    'div',
    {
      id,
      class: 'bt-overlay bt-hidden',
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) closeModal(id)
      },
    },
    h('div', { class: 'bt-modal-box' },
      h('h3', { class: 'font-bold text-lg mb-4' }, title),
      content
    )
  )
}

export function formatDate(dateStr: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    uk: 'uk-UA',
    ru: 'ru-RU',
  }
  return new Date(dateStr).toLocaleDateString(localeMap[getLang()] || 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Simple markdown renderer: **bold**, *italic*, `code`, ```blocks```, [links](url), @mentions */
export function renderMarkdown(text: string): Node {
  const container = document.createElement('div')
  container.className = 'markdown-content'

  const parts = text.split(/(```[\s\S]*?```)/g)

  for (const part of parts) {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w*\n/, '')
      const pre = document.createElement('pre')
      pre.className = 'bg-base-200 rounded-lg p-3 my-2 overflow-x-auto text-sm font-mono'
      const codeEl = document.createElement('code')
      codeEl.textContent = code
      pre.appendChild(codeEl)
      container.appendChild(pre)
    } else {
      const lines = part.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) container.appendChild(document.createElement('br'))
        container.appendChild(renderInlineMarkdown(lines[i]))
      }
    }
  }

  return container
}

function renderInlineMarkdown(line: string): Node {
  const span = document.createElement('span')
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))|(@(\w+))/g
  let lastIdx = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      span.appendChild(document.createTextNode(line.slice(lastIdx, match.index)))
    }

    if (match[1]) {
      const b = document.createElement('strong')
      b.textContent = match[2]
      span.appendChild(b)
    } else if (match[3]) {
      const em = document.createElement('em')
      em.textContent = match[4]
      span.appendChild(em)
    } else if (match[5]) {
      const code = document.createElement('code')
      code.className = 'bg-base-200 px-1.5 py-0.5 rounded text-sm font-mono'
      code.textContent = match[6]
      span.appendChild(code)
    } else if (match[7]) {
      const a = document.createElement('a')
      a.href = match[9]
      a.textContent = match[8]
      a.className = 'link link-primary'
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      span.appendChild(a)
    } else if (match[10]) {
      const mentionName = match[11]
      const mentionEl = document.createElement('span')
      const isMember = state.selectedProject?.members.some(m => m.username === mentionName)
      mentionEl.className = isMember
        ? 'bg-primary/15 text-primary font-medium px-1 rounded cursor-pointer'
        : 'text-base-content/70 font-medium'
      mentionEl.textContent = '@' + mentionName
      span.appendChild(mentionEl)
    }

    lastIdx = match.index + match[0].length
  }

  if (lastIdx < line.length) {
    span.appendChild(document.createTextNode(line.slice(lastIdx)))
  }

  return span
}
