/**
 * BugTracker — точка входу та роутер.
 * Сторінки завантажуються ліниво (dynamic import) — менший initial bundle.
 */

import './style.css'
import { state, setRenderer } from './state.ts'
import { checkAuth } from './auth.ts'
import { renderNavbar } from './navbar.ts'
import { renderCommandPalette } from './command-palette.ts'
import { initKeyboardShortcuts, renderShortcutsModal } from './keyboard-shortcuts.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

// Кеш промісів імпорту, щоб не імпортувати ту саму сторінку двічі
const pageCache = new Map<string, Promise<() => Node>>()

// Lazy-loader: повертає рендер-функцію сторінки за поточним state.currentPage
function loadPage(name: string): Promise<() => Node> {
  let promise = pageCache.get(name)
  if (promise) return promise

  switch (name) {
    case 'login':
      promise = import('./pages/login.ts').then(m => m.renderLogin)
      break
    case 'register':
      promise = import('./pages/register.ts').then(m => m.renderRegister)
      break
    case 'profile':
      promise = import('./pages/profile.ts').then(m => m.renderProfile)
      break
    case 'projects':
      promise = import('./pages/projects.ts').then(m => m.renderProjectsList)
      break
    case 'issues':
      promise = import('./pages/issues.ts').then(m => m.renderIssuesList)
      break
    case 'issue-detail':
      promise = import('./pages/issue-detail.ts').then(m => m.renderIssueDetail)
      break
    case 'labels':
      promise = import('./pages/labels.ts').then(m => m.renderLabels)
      break
    case 'members':
      promise = import('./pages/members.ts').then(m => m.renderMembers)
      break
    case 'dashboard':
      promise = import('./pages/dashboard.ts').then(m => m.renderDashboard)
      break
    default:
      promise = import('./pages/login.ts').then(m => m.renderLogin)
  }
  pageCache.set(name, promise)
  return promise
}

function renderLoadingSkeleton(): Node {
  const div = document.createElement('div')
  div.className = 'flex items-center justify-center min-h-screen'
  div.innerHTML = '<span class="loading loading-spinner loading-lg"></span>'
  return div
}

async function doRender() {
  // Поки сторінка вантажиться — показуємо спінер (миттєвий feedback)
  app.innerHTML = ''
  if (state.currentPage !== 'login' && state.currentPage !== 'register') {
    app.appendChild(renderNavbar())
  }
  const placeholder = renderLoadingSkeleton()
  app.appendChild(placeholder)

  const renderFn = await loadPage(state.currentPage)
  const content = renderFn()

  // Якщо за час завантаження юзер уже перейшов далі — нічого не оновлюємо
  if (placeholder.parentNode !== app) return

  app.removeChild(placeholder)
  app.appendChild(content)

  // Оверлеї (command palette, shortcuts modal)
  const palette = renderCommandPalette()
  if (palette) app.appendChild(palette)
  const shortcuts = renderShortcutsModal()
  if (shortcuts) app.appendChild(shortcuts)
}

setRenderer(() => {
  // Огорнули в проміс, щоб setRenderer лишався синхронним
  void doRender()
})
initKeyboardShortcuts()
checkAuth()
