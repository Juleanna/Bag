import { h } from './components.ts'
import { t } from './i18n/index.ts'
import { state, render, navigate, toggleTheme } from './state.ts'
import { loadProjects } from './pages/projects.ts'
import { loadIssues } from './pages/issues.ts'
import { loadComments } from './pages/issue-detail.ts'
import { loadLabels } from './pages/labels.ts'
import { handleLogout } from './pages/profile.ts'
import { openModal } from './helpers.ts'

interface PaletteItem {
  label: string
  description?: string
  icon: string
  action: () => void
}

let query = ''

function getItems(): PaletteItem[] {
  const items: PaletteItem[] = []
  const q = query.toLowerCase()

  // Commands
  const commands: PaletteItem[] = [
    { label: t('cmdGoProjects'), icon: '\u{1F4C1}', action: () => { state.selectedProject = null; navigate('projects'); loadProjects() } },
    { label: t('cmdGoLabels'), icon: '\u{1F3F7}', action: () => { loadLabels().then(() => navigate('labels')) } },
    { label: t('cmdGoProfile'), icon: '\u{1F464}', action: () => navigate('profile') },
    { label: t('cmdToggleTheme'), icon: state.theme === 'light' ? '\u263E' : '\u2600', action: toggleTheme },
    { label: t('cmdLogout'), icon: '\u{1F6AA}', action: handleLogout },
  ]

  if (state.selectedProject) {
    commands.unshift({
      label: t('cmdNewIssue'),
      icon: '\u2795',
      action: () => { navigate('issues'); loadIssues(state.selectedProject!.id); setTimeout(() => openModal('issue-modal'), 100) },
    })
    commands.unshift({
      label: t('dashboard'),
      icon: '\u{1F4CA}',
      action: () => navigate('dashboard'),
    })
  }

  // Search projects
  for (const proj of state.projects) {
    if (!q || proj.name.toLowerCase().includes(q) || proj.description.toLowerCase().includes(q)) {
      items.push({
        label: proj.name,
        description: t('goToProject'),
        icon: '\u{1F4C2}',
        action: () => { state.selectedProject = proj; navigate('issues'); loadIssues(proj.id) },
      })
    }
  }

  // Search issues
  for (const issue of state.issues) {
    if (!q || issue.title.toLowerCase().includes(q) || issue.description.toLowerCase().includes(q)) {
      items.push({
        label: issue.title,
        description: t('goToIssue'),
        icon: '\u{1F4CB}',
        action: () => { state.selectedIssue = issue; navigate('issue-detail'); loadComments(issue.id) },
      })
    }
  }

  // Filter commands
  for (const cmd of commands) {
    if (!q || cmd.label.toLowerCase().includes(q)) {
      items.push(cmd)
    }
  }

  return items.slice(0, 15)
}

export function closePalette() {
  state.commandPaletteOpen = false
  query = ''
  render()
}

export function openPalette() {
  state.commandPaletteOpen = true
  query = ''
  render()
  setTimeout(() => {
    const input = document.getElementById('cmd-palette-input') as HTMLInputElement
    if (input) input.focus()
  }, 50)
}

let selectedIndex = 0

export function renderCommandPalette(): Node | null {
  if (!state.commandPaletteOpen) return null

  const items = getItems()
  if (selectedIndex >= items.length) selectedIndex = 0

  return h('div', {
    class: 'bt-overlay',
    style: 'z-index: 100',
    onClick: (e: MouseEvent) => { if (e.target === e.currentTarget) closePalette() },
  },
    h('div', {
      class: 'bg-base-100 rounded-xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden',
      style: 'margin-top: -10vh',
    },
      h('div', { class: 'p-4 border-b border-base-200' },
        h('input', {
          id: 'cmd-palette-input',
          type: 'text',
          class: 'input w-full text-lg',
          placeholder: t('typeToSearch'),
          value: query,
          onInput: (e: Event) => {
            query = (e.target as HTMLInputElement).value
            selectedIndex = 0
            render()
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, items.length - 1); render() }
            else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); render() }
            else if (e.key === 'Enter' && items[selectedIndex]) { closePalette(); items[selectedIndex].action() }
            else if (e.key === 'Escape') closePalette()
          },
        })
      ),
      h('div', { class: 'max-h-80 overflow-y-auto p-2' },
        items.length === 0
          ? h('p', { class: 'text-center text-base-content/50 py-8' }, t('noResults'))
          : h('div', { class: 'space-y-0.5' },
              ...items.map((item, i) =>
                h('button', {
                  class: `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    i === selectedIndex ? 'bg-primary/10 text-primary' : 'hover:bg-base-200'
                  }`,
                  onClick: () => { closePalette(); item.action() },
                  onMouseenter: () => { selectedIndex = i; render() },
                },
                  h('span', { class: 'text-lg w-6 text-center shrink-0' }, item.icon),
                  h('div', { class: 'flex-1 min-w-0' },
                    h('p', { class: 'font-medium text-sm truncate' }, item.label),
                    item.description
                      ? h('p', { class: 'text-xs text-base-content/50' }, item.description)
                      : null,
                  ),
                )
              )
            )
      ),
      h('div', { class: 'px-4 py-2 border-t border-base-200 flex gap-4 text-xs text-base-content/40' },
        h('span', {}, '\u2191\u2193 navigate'),
        h('span', {}, '\u23CE select'),
        h('span', {}, 'Esc close'),
      )
    )
  )
}
