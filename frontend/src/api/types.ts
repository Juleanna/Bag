/**
 * Типи відповіді API. Відповідає Django serializers/models.
 */

export interface UserShort {
  id: number
  username: string
  email?: string
  first_name: string
  last_name: string
  // is_staff і is_superuser приходять лише з /auth/whoami/, не з обʼєктів issues
  is_staff?: boolean
  is_superuser?: boolean
}

// Раніше це був enum, але після інтеграції з WorkflowStatus статуси стали
// кастомні — приймаємо будь-який рядок-ключ.
export type IssueStatus = string

export interface WorkflowStatus {
  id: number
  project: number
  key: string
  label: string
  color: string
  sort_order: number
  is_default: boolean
  is_done: boolean
}
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'

export type ProjectVisibility = 'team' | 'org' | 'private'

export interface Project {
  id: number
  name: string
  key?: string
  slug?: string
  description: string
  color?: string
  icon?: string
  visibility?: ProjectVisibility
  workspaces?: number[]
  team_size?: string
  industry?: string
  region?: string
  auto_join_domain?: boolean
  owner: UserShort
  members: UserShort[]
  issues_count: number
  is_archived?: boolean
  archived_at?: string | null
  created_at: string
  updated_at: string
}

export interface Issue {
  id: number
  title: string
  description: string
  project: number
  status: IssueStatus
  status_display: string
  status_color?: string
  status_is_done?: boolean
  workflow_status?: number | null
  priority: IssuePriority
  priority_display: string
  assignee: number | null
  reporter: UserShort
  labels: number[]
  due_date: string | null
  created_at: string
  updated_at: string
  // Розширені поля (опціональні — backend може їх не повертати у legacy-серіалізаторах)
  time_spent_minutes?: number
  custom_fields?: Record<string, unknown>
  is_archived?: boolean
  archived_at?: string | null
  sprint?: number | null
}

export interface Comment {
  id: number
  issue: number
  author: UserShort
  body: string
  created_at: string
}

export interface Label {
  id: number
  name: string
  color: string
}

export interface ProjectMembership {
  id: number
  project: number
  user: UserShort
  role: 'viewer' | 'member' | 'manager' | 'owner'
  created_at: string
}

export interface Attachment {
  id: number
  issue: number
  name: string
  file: string
  url: string
  uploader: number
  created_at: string
}

export interface Invitation {
  id: number
  project: number
  email: string
  role: string
  token?: string
  accepted: boolean
  created_at: string
}

export interface IssueActivity {
  id: number
  issue: number
  user: UserShort
  action: string
  field: string
  old_value: string
  new_value: string
  created_at: string
}

export interface IssueRelation {
  id: number
  from_issue: number
  to_issue: number
  relation_type: 'blocks' | 'blocked_by' | 'relates_to' | 'duplicate_of'
  from_issue_title: string
  to_issue_title: string
  created_at: string
}

export interface ChecklistItem {
  id: number
  issue: number
  text: string
  is_done: boolean
  position: number
  created_at: string
}

export interface Notification {
  id: number
  user: number
  issue: number | null
  message: string
  is_read: boolean
  created_at: string
}

export interface StarredIssue {
  id: number
  user: number
  issue: number
  created_at: string
}

export interface AuthState {
  ok?: boolean
  isAuthenticated: boolean
  user?: UserShort
  error?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
