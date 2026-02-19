import { api } from './api.ts'
import type { StarredIssue, PaginatedResponse } from './api.ts'
import { state, render } from './state.ts'
import { loadProjects } from './pages/projects.ts'
import { startNotificationPolling } from './navbar.ts'

async function loadStarredIssues() {
  try {
    const res = await api.get<PaginatedResponse<StarredIssue>>('/starred/')
    const starred = res.results || (res as any)
    state.starredIssueIds = starred.map((s: StarredIssue) => s.issue)
  } catch { /* ignore */ }
}

export async function checkAuth() {
  try {
    await api.get('/auth/csrf/')
    const auth = await api.getWhoami()
    if (auth.isAuthenticated && auth.user) {
      state.currentUser = auth.user
      state.currentPage = 'projects'
      loadProjects()
      // Load starred issues and start notification polling
      loadStarredIssues()
      startNotificationPolling()
    } else {
      state.currentPage = 'login'
      render()
    }
  } catch {
    state.currentPage = 'login'
    render()
  }
}
