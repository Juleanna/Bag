/**
 * BugTracker — entry point & router
 */

import './style.css'
import { state, setRenderer } from './state.ts'
import { checkAuth } from './auth.ts'
import { renderNavbar } from './navbar.ts'
import { renderCommandPalette } from './command-palette.ts'
import { initKeyboardShortcuts, renderShortcutsModal } from './keyboard-shortcuts.ts'

import { renderLogin } from './pages/login.ts'
import { renderRegister } from './pages/register.ts'
import { renderProjectsList } from './pages/projects.ts'
import { renderIssuesList } from './pages/issues.ts'
import { renderIssueDetail } from './pages/issue-detail.ts'
import { renderLabels } from './pages/labels.ts'
import { renderMembers } from './pages/members.ts'
import { renderProfile } from './pages/profile.ts'
import { renderDashboard } from './pages/dashboard.ts'

const app = document.querySelector<HTMLDivElement>('#app')!

function doRender() {
  let content: Node

  switch (state.currentPage) {
    case 'login':
      content = renderLogin()
      break
    case 'register':
      content = renderRegister()
      break
    case 'profile':
      content = renderProfile()
      break
    case 'projects':
      content = renderProjectsList()
      break
    case 'issues':
      content = renderIssuesList()
      break
    case 'issue-detail':
      content = renderIssueDetail()
      break
    case 'labels':
      content = renderLabels()
      break
    case 'members':
      content = renderMembers()
      break
    case 'dashboard':
      content = renderDashboard()
      break
    default:
      content = renderLogin()
  }

  app.innerHTML = ''
  if (state.currentPage !== 'login' && state.currentPage !== 'register') {
    app.appendChild(renderNavbar())
  }
  app.appendChild(content)

  // Overlays (command palette, shortcuts modal)
  const palette = renderCommandPalette()
  if (palette) app.appendChild(palette)
  const shortcuts = renderShortcutsModal()
  if (shortcuts) app.appendChild(shortcuts)
}

setRenderer(doRender)
initKeyboardShortcuts()
checkAuth()
