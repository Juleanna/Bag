/**
 * API клієнт для розширених фіч: Tests, Sprints, Time tracking, API tokens,
 * Login history, Webhooks, Saved filters, Templates, Reports.
 */
import { apiDelete, apiGet, apiPatch, apiPost } from './client'
import type { PaginatedResponse } from './types'

export interface Sprint {
  id: number
  project: number
  name: string
  goal: string
  starts_at: string
  ends_at: string
  is_active: boolean
  capacity_sp: number | null
  created_at: string
  issues_count: number
}

export interface IssueTemplate {
  id: number
  project: number | null
  name: string
  description_template: string
  default_priority: string
  default_labels: number[]
  custom_fields_schema: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'select'
    options?: string[]
  }>
}

export interface TimeLog {
  id: number
  issue: number
  user: number
  user_name: string
  minutes: number
  note: string
  logged_at: string
}

export interface SavedFilter {
  id: number
  name: string
  params: Record<string, string>
  is_pinned: boolean
  icon: string
}

export interface TestSuite {
  id: number
  project: number
  name: string
  description: string
  cases_count: number
}

export interface TestCase {
  id: number
  suite: number
  suite_name: string
  project: number
  title: string
  preconditions: string
  steps: Array<{ step: string; expected?: string }>
  expected_result: string
  type: 'manual' | 'automated'
  priority: 'critical' | 'high' | 'medium' | 'low'
  automation_link: string
  created_by: number | null
  created_by_name?: string | null
  created_by_avatar?: string | null
  steps_count?: number
  last_result?: 'pass' | 'fail' | 'blocked' | 'skip' | 'pending' | null
  last_run_at?: string | null
  created_at: string
}

export interface TestRun {
  id: number
  project: number
  name: string
  description: string
  environment: string
  status: 'planned' | 'in_progress' | 'completed' | 'aborted'
  test_cases: number[]
  cases_total: number
  pass_count: number
  fail_count: number
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface TestResult {
  id: number
  run: number
  test_case: number
  case_title: string
  case_title_snapshot?: string
  case_steps_snapshot?: Array<{ step: string; expected?: string }>
  case_preconditions_snapshot?: string
  result: 'pass' | 'fail' | 'blocked' | 'skip' | 'pending'
  note: string
  related_issue: number | null
  executed_by: number | null
  executed_by_name: string | null
  executed_at: string | null
}

export interface ApiToken {
  id: number
  name: string
  key?: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

export interface LoginEvent {
  id: number
  user: number | null
  user_name: string | null
  username_attempted: string
  success: boolean
  ip_address: string | null
  user_agent: string
  method: string
  created_at: string
}

export interface Webhook {
  id: number
  project: number | null
  name: string
  url: string
  events: string[]
  secret: string
  is_active: boolean
  created_at: string
  last_called_at: string | null
  last_status_code: number | null
}

export interface ReportsSummary {
  days: Array<{ day: string; created: number; closed: number }>
  mttr_hours: number
  by_status: Array<{ status: string; n: number }>
  top_assignees: Array<{ assignee: number; assignee__username: string; n: number }>
}

export type ChangelogTag = 'major' | 'minor' | 'patch' | 'security'
export type ChangelogChangeType = 'new' | 'imp' | 'fix' | 'sec'

export interface ChangelogChange {
  type: ChangelogChangeType
  text: string
}

export type SupportPriority = 'low' | 'normal' | 'high' | 'urgent'
export type SupportTicketStatus = 'open' | 'in_progress' | 'closed'
export type SupportStatusKind =
  | 'operational'
  | 'maintenance'
  | 'degraded'
  | 'minor'
  | 'major'
  | 'down'
  | 'investigating'
  | 'resolved'

export type SupportCategoryIcon =
  | 'bug'
  | 'help'
  | 'lightning'
  | 'card'
  | 'users'
  | 'lock'
  | 'mail'
  | 'globe'
  | 'calendar'
  | 'star'
  | 'clock'
  | 'ai'
  | 'tag'
  | 'activity'
  | 'shield'
  | 'flag'
  | 'image'
  | 'inbox'
  | 'bell'
  | 'chart'
  | 'beaker'
  | 'play'
  | 'edit'
  | 'folder'
  | 'link'
  | 'spark'
  | 'github'
  | 'slack'
  | 'key'
  | 'eye'
  | 'comment'
  | 'refresh'
  | 'upload'
  | 'download'

export type SupportCategoryTone =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'gray'

export interface SupportCategory {
  key: string
  label: string
  description: string
  icon?: SupportCategoryIcon
  tone?: SupportCategoryTone
}

export interface SupportSettings {
  id: number
  intro_text: string
  status_kind: SupportStatusKind
  status_text: string
  email: string
  email_response_time: string
  chat_hours: string
  community_link: string
  community_label: string
  github_link: string
  github_label: string
  business_hours_weekday: string
  business_hours_weekend: string
  categories: SupportCategory[]
  updated_at: string
}

export interface SupportTicket {
  id: number
  category: string
  subject: string
  priority: SupportPriority
  description: string
  status: SupportTicketStatus
  submitted_by: number | null
  submitted_by_name: string | null
  submitted_email: string
  created_at: string
  updated_at: string
}

export interface SupportComment {
  id: number
  ticket: number
  author: number | null
  author_name: string | null
  body: string
  is_staff_reply: boolean
  created_at: string
}

export interface SupportAgentPermission {
  id: number
  user: number
  username: string
  email: string
  can_view_all: boolean
  categories: string[]
  created_at: string
  updated_at: string
}

export type RoadmapStatus = 'planned' | 'in_progress' | 'done' | 'cancelled'

export interface RoadmapItem {
  id: number
  title: string
  description: string
  status: RoadmapStatus
  quarter: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ChangelogSubscriptionRow {
  id: number
  email: string
  is_active: boolean
  created_at: string
}

export interface ChangelogEntry {
  id: number
  version: string
  release_date: string
  tag: ChangelogTag
  title: string
  summary: string
  changes: ChangelogChange[]
  is_published: boolean
  helpful_count?: number
  is_helpful_by_me?: boolean
  created_at: string
  updated_at: string
}

function unwrap<T>(res: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(res)) return res
  return res.results || []
}

export const api = {
  // Sprints
  listSprints: async (projectId?: number) => {
    const qs = projectId ? `?project=${projectId}` : ''
    return unwrap(await apiGet<PaginatedResponse<Sprint>>(`/sprints/${qs}`))
  },
  createSprint: (data: Partial<Sprint>) => apiPost<Sprint>('/sprints/', data),
  updateSprint: (id: number, data: Partial<Sprint>) =>
    apiPatch<Sprint>(`/sprints/${id}/`, data),
  deleteSprint: (id: number) => apiDelete(`/sprints/${id}/`),

  // Issue Templates
  listTemplates: async () =>
    unwrap(await apiGet<PaginatedResponse<IssueTemplate>>('/templates/')),
  createTemplate: (data: Partial<IssueTemplate>) =>
    apiPost<IssueTemplate>('/templates/', data),
  deleteTemplate: (id: number) => apiDelete(`/templates/${id}/`),

  // Time logs
  listTimeLogs: async (issueId: number) =>
    unwrap(await apiGet<PaginatedResponse<TimeLog>>(`/time-logs/?issue=${issueId}`)),
  createTimeLog: (data: { issue: number; minutes: number; note?: string }) =>
    apiPost<TimeLog>('/time-logs/', data),
  deleteTimeLog: (id: number) => apiDelete(`/time-logs/${id}/`),

  // Saved filters
  listSavedFilters: async () =>
    unwrap(await apiGet<PaginatedResponse<SavedFilter>>('/saved-filters/')),
  createSavedFilter: (data: Partial<SavedFilter>) =>
    apiPost<SavedFilter>('/saved-filters/', data),
  updateSavedFilter: (id: number, data: Partial<SavedFilter>) =>
    apiPatch<SavedFilter>(`/saved-filters/${id}/`, data),
  deleteSavedFilter: (id: number) => apiDelete(`/saved-filters/${id}/`),

  // Test management
  listTestSuites: async (projectId?: number) => {
    const qs = projectId ? `?project=${projectId}` : ''
    return unwrap(await apiGet<PaginatedResponse<TestSuite>>(`/test-suites/${qs}`))
  },
  createTestSuite: (data: Partial<TestSuite>) =>
    apiPost<TestSuite>('/test-suites/', data),
  updateTestSuite: (id: number, data: Partial<TestSuite>) =>
    apiPatch<TestSuite>(`/test-suites/${id}/`, data),
  deleteTestSuite: (id: number) => apiDelete(`/test-suites/${id}/`),

  listTestCases: async (params?: { suite?: number; project?: number }) => {
    const qs = new URLSearchParams()
    if (params?.suite) qs.set('suite', String(params.suite))
    if (params?.project) qs.set('project', String(params.project))
    const url = `/test-cases/${qs.toString() ? '?' + qs : ''}`
    return unwrap(await apiGet<PaginatedResponse<TestCase>>(url))
  },
  createTestCase: (data: Partial<TestCase>) => apiPost<TestCase>('/test-cases/', data),
  updateTestCase: (id: number, data: Partial<TestCase>) =>
    apiPatch<TestCase>(`/test-cases/${id}/`, data),
  deleteTestCase: (id: number) => apiDelete(`/test-cases/${id}/`),

  listTestRuns: async (projectId?: number) => {
    const qs = projectId ? `?project=${projectId}` : ''
    return unwrap(await apiGet<PaginatedResponse<TestRun>>(`/test-runs/${qs}`))
  },
  createTestRun: (data: Partial<TestRun>) => apiPost<TestRun>('/test-runs/', data),
  startTestRun: (id: number) => apiPost<TestRun>(`/test-runs/${id}/start/`, {}),
  finishTestRun: (id: number) => apiPost<TestRun>(`/test-runs/${id}/finish/`, {}),
  deleteTestRun: (id: number) => apiDelete(`/test-runs/${id}/`),

  listTestResults: async (filter: number | { run?: number; test_case?: number }) => {
    const qs = new URLSearchParams()
    if (typeof filter === 'number') {
      qs.set('run', String(filter))
    } else {
      if (filter.run) qs.set('run', String(filter.run))
      if (filter.test_case) qs.set('test_case', String(filter.test_case))
    }
    return unwrap(
      await apiGet<PaginatedResponse<TestResult>>(`/test-results/?${qs}`)
    )
  },
  updateTestResult: (id: number, data: Partial<TestResult>) =>
    apiPatch<TestResult>(`/test-results/${id}/`, data),
  // Drift-resolve: оновити snapshot result-а з актуального TestCase (run += case)
  syncResultFromCase: (id: number) =>
    apiPost<TestResult>(`/test-results/${id}/sync_from_case/`, {}),
  // Drift-resolve: вставити snapshot result-а у TestCase (case := run)
  syncResultToCase: (id: number) =>
    apiPost<TestResult>(`/test-results/${id}/sync_to_case/`, {}),

  // API tokens
  listApiTokens: async () =>
    unwrap(await apiGet<PaginatedResponse<ApiToken>>('/api-tokens/')),
  createApiToken: (name: string) => apiPost<ApiToken>('/api-tokens/', { name }),
  revokeApiToken: (id: number) =>
    apiPost<ApiToken>(`/api-tokens/${id}/revoke/`, {}),
  deleteApiToken: (id: number) => apiDelete(`/api-tokens/${id}/`),

  // Login events
  listLoginEvents: async () =>
    unwrap(await apiGet<PaginatedResponse<LoginEvent>>('/login-events/')),

  // Webhooks
  listWebhooks: async () =>
    unwrap(await apiGet<PaginatedResponse<Webhook>>('/webhooks/')),
  createWebhook: (data: Partial<Webhook>) => apiPost<Webhook>('/webhooks/', data),
  updateWebhook: (id: number, data: Partial<Webhook>) =>
    apiPatch<Webhook>(`/webhooks/${id}/`, data),
  deleteWebhook: (id: number) => apiDelete(`/webhooks/${id}/`),

  // Reports + Activity
  reportsSummary: (projectId?: number) => {
    const qs = projectId ? `?project=${projectId}` : ''
    return apiGet<ReportsSummary>(`/reports/summary/${qs}`)
  },
  activityFeed: () => apiGet<unknown[]>('/activity/feed/'),

  // Bulk archive / restore
  bulkArchive: (ids: number[]) => apiPost<{ archived: number }>('/issues/bulk-archive/', { ids }),
  bulkRestore: (ids: number[]) => apiPost<{ restored: number }>('/issues/bulk-restore/', { ids }),

  // Import
  importIssues: (project: number, items: Array<Record<string, unknown>>) =>
    apiPost<{ created: number; ids: number[] }>('/issues/import/', { project, items }),

  // 2FA
  totpEnroll: () =>
    apiPost<{ secret: string; otpauth_uri: string; issuer: string }>(
      '/auth/2fa/enroll/',
      {}
    ),
  totpVerify: (code: string) =>
    apiPost<{ ok: boolean; enabled: boolean }>('/auth/2fa/verify/', { code }),
  totpDisable: (code: string) =>
    apiPost<{ ok: boolean; enabled: boolean }>('/auth/2fa/disable/', { code }),

  // Changelog
  listChangelog: async () =>
    unwrap(await apiGet<PaginatedResponse<ChangelogEntry>>('/changelog/?page_size=100')),
  createChangelogEntry: (data: Partial<ChangelogEntry>) =>
    apiPost<ChangelogEntry>('/changelog/', data),
  updateChangelogEntry: (id: number, data: Partial<ChangelogEntry>) =>
    apiPatch<ChangelogEntry>(`/changelog/${id}/`, data),
  deleteChangelogEntry: (id: number) => apiDelete(`/changelog/${id}/`),
  toggleChangelogHelpful: (id: number) =>
    apiPost<{ helpful_count: number; is_helpful_by_me: boolean }>(
      `/changelog/${id}/helpful/`,
      {}
    ),
  notifyChangelogSubscribers: (id: number) =>
    apiPost<{ sent: number }>(`/changelog/${id}/notify_subscribers/`, {}),

  // Адмін-керування підписками
  listChangelogSubscriptions: async () =>
    unwrap(
      await apiGet<PaginatedResponse<ChangelogSubscriptionRow>>(
        '/changelog-subscriptions/?page_size=500'
      )
    ),
  updateChangelogSubscription: (
    id: number,
    data: { is_active: boolean }
  ) =>
    apiPatch<ChangelogSubscriptionRow>(`/changelog-subscriptions/${id}/`, data),
  deleteChangelogSubscription: (id: number) =>
    apiDelete(`/changelog-subscriptions/${id}/`),

  subscribeChangelog: (email: string) =>
    apiPost<{ ok: boolean; created: boolean; email: string }>(
      '/changelog/subscribe/',
      { email }
    ),

  // Roadmap
  listRoadmap: async () =>
    unwrap(await apiGet<PaginatedResponse<RoadmapItem>>('/roadmap/?page_size=200')),
  createRoadmapItem: (data: Partial<RoadmapItem>) =>
    apiPost<RoadmapItem>('/roadmap/', data),
  updateRoadmapItem: (id: number, data: Partial<RoadmapItem>) =>
    apiPatch<RoadmapItem>(`/roadmap/${id}/`, data),
  deleteRoadmapItem: (id: number) => apiDelete(`/roadmap/${id}/`),

  // Support
  getSupportSettings: () => apiGet<SupportSettings>('/support/settings/'),
  updateSupportSettings: (data: Partial<SupportSettings>) =>
    apiPatch<SupportSettings>('/support/settings/', data),
  createSupportTicket: (data: {
    category: string
    subject: string
    priority: SupportPriority
    description: string
  }) => apiPost<SupportTicket>('/support/tickets/', data),
  listSupportTickets: async () =>
    unwrap(
      await apiGet<PaginatedResponse<SupportTicket>>(
        '/support/tickets/?page_size=100'
      )
    ),
  getSupportTicket: (id: number) =>
    apiGet<SupportTicket>(`/support/tickets/${id}/`),
  updateSupportTicket: (id: number, data: Partial<SupportTicket>) =>
    apiPatch<SupportTicket>(`/support/tickets/${id}/`, data),
  supportOpenCount: () =>
    apiGet<{ count: number }>('/support/tickets/open_count/'),
  listSupportComments: (ticketId: number) =>
    apiGet<SupportComment[]>(`/support/tickets/${ticketId}/comments/`),
  postSupportComment: (ticketId: number, body: string) =>
    apiPost<SupportComment>(`/support/tickets/${ticketId}/comments/`, { body }),
  listSupportAgents: async () =>
    unwrap(
      await apiGet<PaginatedResponse<SupportAgentPermission>>(
        '/support/agents/?page_size=200'
      )
    ),
  createSupportAgent: (data: {
    user_id: number
    can_view_all: boolean
    categories: string[]
  }) => apiPost<SupportAgentPermission>('/support/agents/', data),
  updateSupportAgent: (id: number, data: Partial<SupportAgentPermission>) =>
    apiPatch<SupportAgentPermission>(`/support/agents/${id}/`, data),
  deleteSupportAgent: (id: number) => apiDelete(`/support/agents/${id}/`),

  // AI-помічник (без зовнішніх LLM — алгоритмічні методи)
  aiDuplicates: (data: {
    project?: number | null
    title: string
    description?: string
    exclude_id?: number
    limit?: number
  }) => apiPost<{ results: AIDuplicateResult[] }>('/ai/duplicates/', data),
  aiSearch: (query: string) =>
    apiPost<{ query: string; results: AISearchResult[] }>('/ai/search/', { query }),
  aiGenerateTestCase: (issueId: number) =>
    apiPost<AIGeneratedTestCase>('/ai/generate-test-case/', { issue_id: issueId }),
  aiSummarize: (issueId: number) =>
    apiPost<AISummaryResult>('/ai/summarize/', { issue_id: issueId }),
}

// AI-результати
export interface AIDuplicateResult {
  id: number
  title: string
  status: string
  status_display: string
  priority: string
  project: number
  created_at: string
  score: number | null
}
export interface AISearchResult {
  id: number
  title: string
  status: string
  status_display: string
  priority: string
  project: number
  created_at: string
}
export interface AIGeneratedTestCase {
  title: string
  preconditions: string
  steps: { step: string; expected: string }[]
  expected_result: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'manual' | 'automated'
}
export interface AISummaryResult {
  summary: string
  highlights: { text: string; author: string; when: string }[]
  comments_total: number
  first_author?: string
  last_author?: string
}
