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

  listTestResults: async (runId: number) =>
    unwrap(await apiGet<PaginatedResponse<TestResult>>(`/test-results/?run=${runId}`)),
  updateTestResult: (id: number, data: Partial<TestResult>) =>
    apiPatch<TestResult>(`/test-results/${id}/`, data),

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
}
