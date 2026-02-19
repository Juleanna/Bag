import type {
  Project, Issue, Comment, UserShort, Label, Attachment, ProjectMembership, Invitation,
  IssueActivity, IssueRelation, ChecklistItem, Notification as ApiNotification,
} from './api.ts'

export type PageName =
  | 'login'
  | 'register'
  | 'projects'
  | 'issues'
  | 'issue-detail'
  | 'labels'
  | 'members'
  | 'profile'
  | 'dashboard'

export type IssueViewMode = 'list' | 'kanban' | 'gantt'
export type SortField = 'created_at' | 'updated_at' | 'priority' | 'due_date'
export type SortOrder = 'asc' | 'desc'

export const state = {
  projects: [] as Project[],
  issues: [] as Issue[],
  comments: [] as Comment[],
  labels: [] as Label[],
  attachments: [] as Attachment[],
  memberships: [] as ProjectMembership[],
  invitations: [] as Invitation[],
  currentUser: null as UserShort | null,
  currentPage: 'login' as PageName,
  selectedProject: null as Project | null,
  selectedIssue: null as Issue | null,
  loading: false,
  theme: (localStorage.getItem('bugtracker-theme') || 'light') as 'light' | 'dark',

  // Issues view state
  issuesViewMode: 'list' as IssueViewMode,
  issuesSortField: 'created_at' as SortField,
  issuesSortOrder: 'desc' as SortOrder,
  issuesPage: 1,
  issuesTotal: 0,
  issuesPageSize: 20,
  selectedIssueIds: [] as number[],

  // New feature state
  activities: [] as IssueActivity[],
  relations: [] as IssueRelation[],
  checklistItems: [] as ChecklistItem[],
  notifications: [] as ApiNotification[],
  starredIssueIds: [] as number[],
  commandPaletteOpen: false,
  shortcutsOpen: false,
}

document.documentElement.setAttribute('data-theme', state.theme)

let renderFn: (() => void) | null = null

export function setRenderer(fn: () => void) {
  renderFn = fn
}

export function render() {
  renderFn?.()
}

export function navigate(page: PageName) {
  state.currentPage = page
  render()
}

export function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light'
  localStorage.setItem('bugtracker-theme', state.theme)
  document.documentElement.setAttribute('data-theme', state.theme)
  render()
}
