import { h, Navbar, NavbarItem } from './components.ts'
import { t, getLang, setLang, langNames } from './i18n/index.ts'
import type { Lang } from './i18n/index.ts'
import { api } from './api.ts'
import type { Notification as ApiNotification, PaginatedResponse } from './api.ts'
import { state, render, navigate, toggleTheme } from './state.ts'
import { loadProjects } from './pages/projects.ts'
import { loadLabels } from './pages/labels.ts'
import { loadComments } from './pages/issue-detail.ts'
import { handleLogout } from './pages/profile.ts'

let notifDropdownOpen = false
let notifPollTimer: ReturnType<typeof setInterval> | null = null
let notifSSE: EventSource | null = null

export async function loadNotifications() {
  try {
    const res = await api.get<PaginatedResponse<ApiNotification>>('/notifications/')
    state.notifications = res.results || (res as any)
  } catch { /* ignore */ }
}

/**
 * Запускає realtime-канал сповіщень.
 * Спочатку пробує SSE; якщо браузер не підтримує або з'єднання падає —
 * відкочується на periodic polling як fallback.
 */
export function startNotificationPolling() {
  loadNotifications()

  // Спроба SSE — миттєвий push нових сповіщень із сервера
  if ('EventSource' in window && !notifSSE) {
    try {
      notifSSE = new EventSource('/api/notifications/stream/', { withCredentials: true })
      notifSSE.onmessage = ev => {
        try {
          const notif = JSON.parse(ev.data)
          if (notif && notif.id) {
            // Додаємо нове сповіщення на початок списку, ігноруємо дублікати
            const exists = state.notifications.some(n => n.id === notif.id)
            if (!exists) {
              state.notifications = [notif, ...state.notifications].slice(0, 50)
              render()
            }
          }
        } catch { /* ігноруємо погані пакети */ }
      }
      notifSSE.onerror = () => {
        // Падіння SSE → відкат на polling
        if (notifSSE) {
          notifSSE.close()
          notifSSE = null
        }
        if (!notifPollTimer) {
          notifPollTimer = setInterval(loadNotifications, 30000)
        }
      }
      return
    } catch {
      notifSSE = null
    }
  }

  // Fallback: periodic polling кожні 30 сек
  if (!notifPollTimer) {
    notifPollTimer = setInterval(loadNotifications, 30000)
  }
}

export function stopNotificationPolling() {
  if (notifPollTimer) {
    clearInterval(notifPollTimer)
    notifPollTimer = null
  }
  if (notifSSE) {
    notifSSE.close()
    notifSSE = null
  }
}

async function markAllRead() {
  try {
    await api.post('/notifications/mark_all_read/', {})
    state.notifications = state.notifications.map(n => ({ ...n, is_read: true }))
    render()
  } catch { /* ignore */ }
}

async function markRead(id: number) {
  try {
    await api.post(`/notifications/${id}/mark_read/`, {})
    state.notifications = state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
    render()
  } catch { /* ignore */ }
}

function renderNotificationBell() {
  const unread = state.notifications.filter(n => !n.is_read).length

  return h('div', { class: 'relative' },
    h('button', {
      class: 'btn btn-sm btn-ghost relative',
      onClick: (e: Event) => {
        e.stopPropagation()
        notifDropdownOpen = !notifDropdownOpen
        render()
      },
      title: t('notifications'),
    },
      '\uD83D\uDD14',
      unread > 0
        ? h('span', {
            class: 'absolute -top-1 -right-1 bg-error text-error-content text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1',
          }, String(unread > 99 ? '99+' : unread))
        : null,
    ),
    notifDropdownOpen
      ? h('div', {
          class: 'absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-base-100 rounded-xl shadow-2xl border border-base-200 z-50',
          onClick: (e: Event) => e.stopPropagation(),
        },
          h('div', { class: 'flex items-center justify-between p-3 border-b border-base-200' },
            h('span', { class: 'font-semibold text-sm' }, t('notifications')),
            unread > 0
              ? h('button', {
                  class: 'btn btn-xs btn-ghost text-primary',
                  onClick: markAllRead,
                }, t('markAllRead'))
              : null,
          ),
          state.notifications.length === 0
            ? h('div', { class: 'p-6 text-center text-sm text-base-content/50' }, t('noNotifications'))
            : h('div', { class: 'divide-y divide-base-200' },
                ...state.notifications.slice(0, 20).map(n =>
                  h('div', {
                    class: `p-3 text-sm cursor-pointer hover:bg-base-200/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`,
                    onClick: () => {
                      if (!n.is_read) markRead(n.id)
                      if (n.issue) {
                        const issue = state.issues.find(i => i.id === n.issue)
                        if (issue) {
                          state.selectedIssue = issue
                          navigate('issue-detail')
                          loadComments(issue.id)
                        }
                      }
                      notifDropdownOpen = false
                      render()
                    },
                  },
                    h('div', { class: 'flex items-start gap-2' },
                      !n.is_read
                        ? h('span', { class: 'w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5' })
                        : h('span', { class: 'w-2 shrink-0' }),
                      h('div', { class: 'flex-1 min-w-0' },
                        h('p', { class: `${!n.is_read ? 'font-medium' : 'text-base-content/70'}` }, n.message),
                        h('p', { class: 'text-xs text-base-content/40 mt-0.5' },
                          new Date(n.created_at).toLocaleString()
                        ),
                      ),
                    ),
                  )
                )
              ),
        )
      : null,
  )
}

export function renderNavbar() {
  return Navbar(
    {},
    NavbarItem({ class: 'flex-1' },
      h('a', {
        class: 'text-xl font-bold text-primary cursor-pointer',
        onClick: () => { state.selectedProject = null; state.selectedIssue = null; navigate('projects') },
      }, t('appName'))
    ),
    NavbarItem(
      { class: 'flex items-center gap-1' },
      state.currentUser && h('span', { class: 'text-sm text-base-content/70 mr-3' }, state.currentUser.username),
      state.currentUser && h('div', { class: 'w-px h-6 bg-base-300 mr-2' }),
      state.currentUser && h('button', {
        class: `btn btn-sm ${state.currentPage === 'projects' && !state.selectedProject ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => { state.selectedProject = null; state.selectedIssue = null; loadProjects(); navigate('projects') },
      }, t('projects')),
      state.currentUser && h('button', {
        class: `btn btn-sm ${state.currentPage === 'labels' ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => { loadLabels().then(() => { navigate('labels') }) },
      }, t('labels')),
      state.currentUser && h('button', {
        class: `btn btn-sm ${state.currentPage === 'profile' ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => navigate('profile'),
      }, t('profile')),
      h('div', { class: 'w-px h-6 bg-base-300 mx-1' }),
      // Notification bell
      state.currentUser ? renderNotificationBell() : null,
      // Theme toggle
      h('button', {
        class: 'btn btn-sm btn-ghost',
        onClick: toggleTheme,
        title: t('theme'),
      }, state.theme === 'light' ? '\u2600' : '\u263E'),
      renderLangSwitcher(),
      // Keyboard shortcut hint
      h('button', {
        class: 'btn btn-sm btn-ghost text-base-content/40',
        onClick: () => { state.shortcutsOpen = true; render() },
        title: t('keyboardShortcuts'),
      }, '?'),
      h('div', { class: 'w-px h-6 bg-base-300 mx-1' }),
      state.currentUser && h('button', {
        class: 'btn btn-sm btn-ghost text-error/70 hover:text-error',
        onClick: handleLogout,
      }, t('logout'))
    )
  )
}

function renderLangSwitcher() {
  const current = getLang()
  return h('div', { class: 'dropdown dropdown-end' },
    h('label', { tabindex: '0', class: 'btn btn-sm btn-ghost gap-1' },
      h('span', {}, langNames[current]),
      h('span', { class: 'text-xs' }, '\u25BE')
    ),
    h('ul', { tabindex: '0', class: 'dropdown-content menu bg-base-100 rounded-box z-[1] w-40 p-2 shadow border border-base-200' },
      ...(['uk', 'en'] as Lang[]).map(lang =>
        h('li', {},
          h('a', {
            class: lang === current ? 'active' : '',
            onClick: () => {
              setLang(lang)
              render()
            },
          }, langNames[lang])
        )
      )
    )
  )
}

// Close notification dropdown on outside click
document.addEventListener('click', () => {
  if (notifDropdownOpen) {
    notifDropdownOpen = false
    render()
  }
})
