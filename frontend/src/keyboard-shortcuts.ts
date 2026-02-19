import { h } from './components.ts'
import { t } from './i18n/index.ts'
import { state, render, navigate } from './state.ts'
import { openPalette, closePalette } from './command-palette.ts'
import { openModal } from './helpers.ts'

export function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    // Don't trigger inside inputs/textareas
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    // Ctrl+K or Cmd+K: Command Palette
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      if (state.commandPaletteOpen) closePalette()
      else openPalette()
      return
    }

    // Escape: close modals / go back
    if (e.key === 'Escape') {
      if (state.commandPaletteOpen) { closePalette(); return }
      if (state.shortcutsOpen) { state.shortcutsOpen = false; render(); return }
      // Navigate back
      if (state.currentPage === 'issue-detail') {
        state.selectedIssue = null
        navigate('issues')
      } else if (state.currentPage === 'issues' || state.currentPage === 'dashboard' || state.currentPage === 'members') {
        navigate('projects')
      }
      return
    }

    // ? : Show shortcuts
    if (e.key === '?') {
      state.shortcutsOpen = !state.shortcutsOpen
      render()
      return
    }

    // c : Create issue (if on issues page)
    if (e.key === 'c' && state.currentPage === 'issues' && state.selectedProject) {
      openModal('issue-modal')
      return
    }
  })
}

export function renderShortcutsModal(): Node | null {
  if (!state.shortcutsOpen) return null

  const shortcuts = [
    { keys: 'Ctrl+K', desc: t('shortcutSearch') },
    { keys: 'c', desc: t('shortcutNewIssue') },
    { keys: 'Esc', desc: t('shortcutBack') },
    { keys: '?', desc: t('shortcutHelp') },
  ]

  return h('div', {
    class: 'bt-overlay',
    style: 'z-index: 100',
    onClick: (e: MouseEvent) => { if (e.target === e.currentTarget) { state.shortcutsOpen = false; render() } },
  },
    h('div', { class: 'bg-base-100 rounded-xl shadow-2xl max-w-md w-full mx-4 p-6' },
      h('h3', { class: 'font-bold text-lg mb-4' }, t('keyboardShortcuts')),
      h('div', { class: 'space-y-3' },
        ...shortcuts.map(s =>
          h('div', { class: 'flex items-center justify-between' },
            h('span', { class: 'text-sm text-base-content/80' }, s.desc),
            h('kbd', { class: 'kbd kbd-sm bg-base-200 px-2 py-1 rounded text-xs font-mono' }, s.keys),
          )
        )
      ),
      h('div', { class: 'mt-4 pt-3 border-t border-base-200 text-center' },
        h('button', {
          class: 'btn btn-sm btn-ghost',
          onClick: () => { state.shortcutsOpen = false; render() },
        }, t('cancel'))
      )
    )
  )
}
