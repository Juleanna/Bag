import {
  h, Container, PageHeader, PrimaryButton, SecondaryButton, Button,
  StatusBadge, PriorityBadge, Select, Form, FormGroup, Label, Input, Textarea,
  EmptyState, Loader, Breadcrumb, showToast, showConfirm,
} from '../components.ts'
import { api } from '../api.ts'
import type { Issue, PaginatedResponse } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render, navigate } from '../state.ts'
import type { SortField } from '../state.ts'
import { openModal, closeModal, modalWrapper, formatDate } from '../helpers.ts'
import { loadProjects } from './projects.ts'
import { loadComments } from './issue-detail.ts'
import { loadLabels } from './labels.ts'
import { resetMembershipsLoaded } from './members.ts'

let selectedLabelIds: number[] = []
let searchQuery = ''
let filterLabelId: number | null = null
let activeStatusFilter: string | null = null

// ========== Saved Filters ==========

interface SavedFilter {
  name: string
  status: string | null
  label: number | null
  sortField: string
  sortOrder: string
}

function getSavedFilters(): SavedFilter[] {
  try {
    return JSON.parse(localStorage.getItem('bt-saved-filters') || '[]')
  } catch { return [] }
}

function saveFilter(name: string) {
  if (!name.trim()) return
  const filters = getSavedFilters()
  filters.push({
    name,
    status: activeStatusFilter,
    label: filterLabelId,
    sortField: state.issuesSortField,
    sortOrder: state.issuesSortOrder,
  })
  localStorage.setItem('bt-saved-filters', JSON.stringify(filters))
  showToast(t('filterSaved'), 'success')
  render()
}

function deleteSavedFilter(index: number) {
  const filters = getSavedFilters()
  filters.splice(index, 1)
  localStorage.setItem('bt-saved-filters', JSON.stringify(filters))
  showToast(t('filterDeleted'), 'success')
  render()
}

function applyFilter(filter: SavedFilter) {
  activeStatusFilter = filter.status
  filterLabelId = filter.label
  state.issuesSortField = filter.sortField as SortField
  state.issuesSortOrder = filter.sortOrder as 'asc' | 'desc'
  state.issuesPage = 1
  if (state.selectedProject) loadIssues(state.selectedProject.id)
}

// ========== CSV Export ==========

function exportCsv() {
  const issues = getFilteredIssues()
  if (issues.length === 0) return

  const proj = state.selectedProject
  const headers = ['ID', 'Title', 'Status', 'Priority', 'Assignee', 'Reporter', 'Due Date', 'Created', 'Updated']
  const rows = issues.map(i => [
    i.id,
    `"${(i.title || '').replace(/"/g, '""')}"`,
    i.status,
    i.priority,
    i.assignee ? (proj?.members.find(m => m.id === i.assignee)?.username || i.assignee) : '',
    i.reporter?.username || '',
    i.due_date || '',
    i.created_at?.split('T')[0] || '',
    i.updated_at?.split('T')[0] || '',
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `issues-${proj?.name || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
  showToast(t('exported'), 'success')
}

// ========== Data loading ==========

export async function loadIssues(projectId: number) {
  state.loading = true
  render()
  try {
    if (state.labels.length === 0) await loadLabels()

    const ordering = `${state.issuesSortOrder === 'desc' ? '-' : ''}${state.issuesSortField}`
    const offset = (state.issuesPage - 1) * state.issuesPageSize
    let url = `/issues/?project=${projectId}&ordering=${ordering}&limit=${state.issuesPageSize}&offset=${offset}`
    if (activeStatusFilter) url += `&status=${activeStatusFilter}`
    const response = await api.get<PaginatedResponse<Issue>>(url)
    state.issues = response.results || (response as any)
    state.issuesTotal = response.count ?? state.issues.length
    state.loading = false
    render()
  } catch {
    state.loading = false
    showToast(t('failedLoadIssues'), 'error')
    render()
  }
}

async function createIssue(formData: FormData) {
  if (!state.selectedProject) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string
  const status = formData.get('status') as string
  const assignee = formData.get('assignee') as string
  const due_date = formData.get('due_date') as string

  if (!title.trim()) {
    showToast(t('enterIssueTitle'), 'warning')
    return
  }

  try {
    await api.post('/issues/', {
      title,
      description,
      priority: priority || 'medium',
      status: status || 'open',
      project: state.selectedProject.id,
      labels: selectedLabelIds,
      assignee: assignee ? Number(assignee) : null,
      due_date: due_date || null,
    })
    selectedLabelIds = []
    showToast(t('issueCreated'), 'success')
    loadIssues(state.selectedProject.id)
  } catch (error: any) {
    showToast(error.message || t('failedCreateIssue'), 'error')
  }
}

export async function updateIssue(issueId: number, data: Record<string, any>) {
  try {
    const updated = await api.patch<Issue>(`/issues/${issueId}/`, data)
    if (state.selectedIssue && state.selectedIssue.id === issueId) {
      state.selectedIssue = updated
    }
    if (state.selectedProject) {
      loadIssues(state.selectedProject.id)
    }
    showToast(t('issueUpdated'), 'success')
  } catch (error: any) {
    showToast(error.message || t('failedUpdateIssue'), 'error')
  }
}

export async function deleteIssue(issueId: number) {
  const confirmed = await showConfirm(t('deleteIssueConfirm'))
  if (!confirmed) return

  try {
    await api.delete(`/issues/${issueId}/`)
    showToast(t('issueDeleted'), 'success')
    state.selectedIssue = null
    if (state.selectedProject) {
      navigate('issues')
      loadIssues(state.selectedProject.id)
    }
  } catch (error: any) {
    showToast(error.message || t('failedDeleteIssue'), 'error')
  }
}

function getFilteredIssues(): Issue[] {
  let filtered = state.issues
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(i =>
      i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    )
  }
  if (filterLabelId !== null) {
    filtered = filtered.filter(i => i.labels.includes(filterLabelId!))
  }
  return filtered
}

function isOverdue(issue: Issue): boolean {
  return !!issue.due_date && new Date(issue.due_date) < new Date() && issue.status !== 'done' && issue.status !== 'cancelled'
}

// ========== Bulk operations ==========

function toggleIssueSelection(id: number) {
  if (state.selectedIssueIds.includes(id)) {
    state.selectedIssueIds = state.selectedIssueIds.filter(x => x !== id)
  } else {
    state.selectedIssueIds = [...state.selectedIssueIds, id]
  }
  render()
}

function selectAllVisible() {
  const filtered = getFilteredIssues()
  state.selectedIssueIds = filtered.map(i => i.id)
  render()
}

function deselectAll() {
  state.selectedIssueIds = []
  render()
}

async function bulkUpdateStatus(status: string) {
  const ids = state.selectedIssueIds
  if (ids.length === 0) return
  try {
    await Promise.all(ids.map(id => api.patch(`/issues/${id}/`, { status })))
    showToast(t('bulkUpdateSuccess', { count: ids.length }), 'success')
    state.selectedIssueIds = []
    if (state.selectedProject) loadIssues(state.selectedProject.id)
  } catch (error: any) {
    showToast(error.message || t('failedUpdateIssue'), 'error')
  }
}

async function bulkUpdatePriority(priority: string) {
  const ids = state.selectedIssueIds
  if (ids.length === 0) return
  try {
    await Promise.all(ids.map(id => api.patch(`/issues/${id}/`, { priority })))
    showToast(t('bulkUpdateSuccess', { count: ids.length }), 'success')
    state.selectedIssueIds = []
    if (state.selectedProject) loadIssues(state.selectedProject.id)
  } catch (error: any) {
    showToast(error.message || t('failedUpdateIssue'), 'error')
  }
}

async function bulkDelete() {
  const ids = state.selectedIssueIds
  if (ids.length === 0) return
  const confirmed = await showConfirm(t('bulkDeleteConfirm', { count: ids.length }))
  if (!confirmed) return
  try {
    await Promise.all(ids.map(id => api.delete(`/issues/${id}/`)))
    showToast(t('bulkDeleted', { count: ids.length }), 'success')
    state.selectedIssueIds = []
    if (state.selectedProject) loadIssues(state.selectedProject.id)
  } catch (error: any) {
    showToast(error.message || t('failedDeleteIssue'), 'error')
  }
}

// ========== Pagination helpers ==========

function totalPages(): number {
  return Math.max(1, Math.ceil(state.issuesTotal / state.issuesPageSize))
}

function goToPage(page: number) {
  if (!state.selectedProject) return
  state.issuesPage = Math.max(1, Math.min(page, totalPages()))
  loadIssues(state.selectedProject.id)
}

// ========== Gantt Chart ==========

function renderGantt(issues: Issue[], _proj: { members: { id: number; username: string }[] }) {
  const withDates = issues.filter(i => i.due_date || i.created_at)
  if (withDates.length === 0) {
    return h('div', { class: 'text-center py-8 text-base-content/50' }, t('noIssuesWithDates'))
  }

  const now = new Date()
  const dates = withDates.flatMap(i => {
    const d: number[] = []
    if (i.created_at) d.push(new Date(i.created_at).getTime())
    if (i.due_date) d.push(new Date(i.due_date).getTime())
    return d
  })
  dates.push(now.getTime())

  const minTime = Math.min(...dates)
  const maxTime = Math.max(...dates)
  const rangeMs = Math.max(maxTime - minTime, 86400000) // At least 1 day
  const totalDays = Math.ceil(rangeMs / 86400000)

  const statusColors: Record<string, string> = {
    open: 'bg-info',
    in_progress: 'bg-warning',
    done: 'bg-success',
    cancelled: 'bg-base-300',
  }

  // Today marker position
  const todayPct = ((now.getTime() - minTime) / rangeMs) * 100

  return h('div', { class: 'overflow-x-auto' },
    h('div', { class: 'min-w-[600px]' },
      // Header with date range
      h('div', { class: 'flex items-center justify-between text-xs text-base-content/50 mb-2 px-1' },
        h('span', {}, new Date(minTime).toLocaleDateString()),
        h('span', { class: 'font-medium text-primary' }, t('today')),
        h('span', {}, new Date(maxTime).toLocaleDateString()),
      ),
      // Gantt area
      h('div', { class: 'relative bg-base-200/20 rounded-lg border border-base-200 py-2' },
        // Today line
        h('div', {
          class: 'absolute top-0 bottom-0 w-px bg-error/40 z-10',
          style: `left: ${todayPct}%`,
        },
          h('div', { class: 'absolute -top-0.5 -left-1.5 w-3 h-1 bg-error rounded-full' })
        ),
        // Rows
        ...withDates.map(issue => {
          const start = new Date(issue.created_at).getTime()
          const end = issue.due_date ? new Date(issue.due_date).getTime() : now.getTime()
          const leftPct = ((start - minTime) / rangeMs) * 100
          const widthPct = Math.max(((end - start) / rangeMs) * 100, 1)

          return h('div', { class: 'flex items-center gap-2 px-2 py-1 group' },
            h('div', { class: 'w-40 shrink-0 truncate text-xs font-medium' },
              h('span', {
                class: 'cursor-pointer hover:text-primary',
                onClick: () => {
                  state.selectedIssue = issue
                  navigate('issue-detail')
                  loadComments(issue.id)
                },
              }, issue.title)
            ),
            h('div', { class: 'flex-1 relative h-6' },
              h('div', {
                class: `absolute h-5 rounded-full ${statusColors[issue.status] || 'bg-base-300'} opacity-80 hover:opacity-100 transition-opacity cursor-pointer flex items-center px-2 overflow-hidden`,
                style: `left: ${leftPct}%; width: ${widthPct}%;`,
                title: `${issue.title} (${issue.status})${issue.due_date ? ' | Due: ' + issue.due_date : ''}`,
                onClick: () => {
                  state.selectedIssue = issue
                  navigate('issue-detail')
                  loadComments(issue.id)
                },
              },
                h('span', { class: 'text-[10px] text-base-content truncate' },
                  issue.due_date ? formatDate(issue.due_date) : ''
                )
              ),
            ),
          )
        }),
      ),
      // Legend
      h('div', { class: 'flex gap-4 mt-3 text-xs text-base-content/60 px-1' },
        ...Object.entries(statusColors).map(([s, c]) =>
          h('span', { class: 'flex items-center gap-1' },
            h('span', { class: `w-3 h-2 rounded-sm ${c}` }),
            t(s as any)
          )
        ),
        h('span', {}, `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`),
      ),
    )
  )
}

// ========== Kanban board ==========

function renderKanban(issues: Issue[], proj: { id: number; members: { id: number; username: string }[] }) {
  const statuses = ['open', 'in_progress', 'done', 'cancelled'] as const
  const columns = statuses.map(s => ({
    status: s,
    issues: issues.filter(i => i.status === s),
  }))

  return h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' },
    ...columns.map(col =>
      h('div', {
        class: 'bg-base-200/30 rounded-xl p-3 min-h-[200px]',
        onDragover: (e: DragEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('ring-2', 'ring-primary/30') },
        onDragleave: (e: DragEvent) => { (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-primary/30') },
        onDrop: (e: DragEvent) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).classList.remove('ring-2', 'ring-primary/30')
          const issueId = Number(e.dataTransfer?.getData('text/plain'))
          if (issueId) updateIssue(issueId, { status: col.status })
        },
      },
        h('div', { class: 'flex items-center justify-between mb-3 px-1' },
          h('h3', { class: 'font-semibold text-sm' }, t(col.status)),
          h('span', { class: 'text-xs text-base-content/50 bg-base-200 px-2 py-0.5 rounded-full' }, String(col.issues.length)),
        ),
        h('div', { class: 'space-y-2' },
          ...col.issues.map(issue =>
            h('div', {
              class: `card bg-base-100 shadow-sm border cursor-pointer ${isOverdue(issue) ? 'border-error/40' : 'border-base-200'}`,
              draggable: 'true',
              onDragstart: (e: DragEvent) => { e.dataTransfer?.setData('text/plain', String(issue.id)) },
              onClick: () => {
                state.selectedIssue = issue
                navigate('issue-detail')
                loadComments(issue.id)
              },
            },
              h('div', { class: 'p-3' },
                h('p', { class: 'font-medium text-sm mb-1' }, issue.title),
                h('div', { class: 'flex gap-1 items-center flex-wrap' },
                  PriorityBadge(issue.priority),
                  issue.assignee
                    ? h('span', { class: 'text-xs text-base-content/50' },
                        proj.members.find(m => m.id === issue.assignee)?.username || '#' + issue.assignee)
                    : null,
                  issue.due_date
                    ? h('span', { class: `text-xs ${isOverdue(issue) ? 'text-error font-medium' : 'text-base-content/50'}` },
                        formatDate(issue.due_date))
                    : null,
                ),
                issue.labels.length > 0
                  ? h('div', { class: 'flex gap-1 flex-wrap mt-1' },
                      ...issue.labels.map(labelId => {
                        const lb = state.labels.find(l => l.id === labelId)
                        return lb
                          ? h('span', {
                              class: 'w-2 h-2 rounded-full inline-block',
                              style: `background-color: ${lb.color}`,
                              title: lb.name,
                            })
                          : null
                      })
                    )
                  : null,
              )
            )
          )
        )
      )
    )
  )
}

// ========== Sort controls ==========

function renderSortControls() {
  return h('div', { class: 'flex gap-2 items-center' },
    h('select', {
      class: 'select select-sm',
      value: state.issuesSortField,
      onChange: (e: Event) => {
        state.issuesSortField = (e.target as HTMLSelectElement).value as SortField
        state.issuesPage = 1
        if (state.selectedProject) loadIssues(state.selectedProject.id)
      },
    },
      h('option', { value: 'created_at' }, t('sortByCreated')),
      h('option', { value: 'updated_at' }, t('sortByUpdated')),
      h('option', { value: 'priority' }, t('sortByPriority')),
      h('option', { value: 'due_date' }, t('sortByDueDate')),
    ),
    h('button', {
      class: 'btn btn-sm btn-ghost',
      onClick: () => {
        state.issuesSortOrder = state.issuesSortOrder === 'asc' ? 'desc' : 'asc'
        state.issuesPage = 1
        if (state.selectedProject) loadIssues(state.selectedProject.id)
      },
    }, state.issuesSortOrder === 'asc' ? '\u2191' : '\u2193'),
  )
}

// ========== Pagination controls ==========

function renderPagination() {
  const tp = totalPages()
  if (tp <= 1) return h('div')

  const from = (state.issuesPage - 1) * state.issuesPageSize + 1
  const to = Math.min(state.issuesPage * state.issuesPageSize, state.issuesTotal)

  return h('div', { class: 'flex items-center justify-between mt-4' },
    h('span', { class: 'text-sm text-base-content/60' },
      t('showingOf', { from, to, total: state.issuesTotal })
    ),
    h('div', { class: 'flex gap-1' },
      h('button', {
        class: 'btn btn-sm btn-outline',
        disabled: state.issuesPage <= 1,
        onClick: () => goToPage(state.issuesPage - 1),
      }, t('prevPage')),
      ...Array.from({ length: Math.min(tp, 5) }, (_, i) => {
        let p: number
        if (tp <= 5) {
          p = i + 1
        } else if (state.issuesPage <= 3) {
          p = i + 1
        } else if (state.issuesPage >= tp - 2) {
          p = tp - 4 + i
        } else {
          p = state.issuesPage - 2 + i
        }
        return h('button', {
          class: `btn btn-sm ${p === state.issuesPage ? 'btn-primary' : 'btn-outline'}`,
          onClick: () => goToPage(p),
        }, String(p))
      }),
      h('button', {
        class: 'btn btn-sm btn-outline',
        disabled: state.issuesPage >= tp,
        onClick: () => goToPage(state.issuesPage + 1),
      }, t('nextPage')),
    )
  )
}

// ========== Bulk actions bar ==========

function renderBulkBar() {
  if (state.selectedIssueIds.length === 0) return null

  return h('div', { class: 'flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-4' },
    h('span', { class: 'text-sm font-medium' },
      t('selectedCount', { count: state.selectedIssueIds.length })
    ),
    h('select', {
      class: 'select select-sm',
      onChange: (e: Event) => {
        const val = (e.target as HTMLSelectElement).value
        if (val) { bulkUpdateStatus(val); (e.target as HTMLSelectElement).value = '' }
      },
    },
      h('option', { value: '' }, t('status')),
      h('option', { value: 'open' }, t('open')),
      h('option', { value: 'in_progress' }, t('in_progress')),
      h('option', { value: 'done' }, t('done')),
      h('option', { value: 'cancelled' }, t('cancelled')),
    ),
    h('select', {
      class: 'select select-sm',
      onChange: (e: Event) => {
        const val = (e.target as HTMLSelectElement).value
        if (val) { bulkUpdatePriority(val); (e.target as HTMLSelectElement).value = '' }
      },
    },
      h('option', { value: '' }, t('priority')),
      h('option', { value: 'low' }, t('low')),
      h('option', { value: 'medium' }, t('medium')),
      h('option', { value: 'high' }, t('high')),
    ),
    h('button', {
      class: 'btn btn-sm btn-error btn-outline',
      onClick: bulkDelete,
    }, t('delete')),
    h('button', {
      class: 'btn btn-sm btn-ghost',
      onClick: deselectAll,
    }, t('deselectAll')),
  )
}

// ========== Saved Filters Bar ==========

function renderSavedFilters() {
  const filters = getSavedFilters()

  return h('div', { class: 'flex items-center gap-2 mb-4 flex-wrap' },
    // Save current filter button
    h('button', {
      class: 'btn btn-xs btn-outline btn-primary gap-1',
      onClick: () => {
        const name = prompt(t('filterName'))
        if (name) saveFilter(name)
      },
    }, '\u2605 ' + t('saveCurrentFilter')),
    // Saved filter chips
    ...filters.map((f, i) =>
      h('div', { class: 'flex items-center gap-0.5 bg-base-200/50 rounded-full pr-1' },
        h('button', {
          class: 'btn btn-xs btn-ghost rounded-full',
          onClick: () => applyFilter(f),
        }, f.name),
        h('button', {
          class: 'btn btn-xs btn-ghost btn-circle text-error/60 hover:text-error',
          onClick: () => deleteSavedFilter(i),
        }, 'x'),
      )
    ),
    filters.length === 0
      ? h('span', { class: 'text-xs text-base-content/40' }, t('noSavedFilters'))
      : null,
  )
}

// ========== Issue card (list view) ==========

function renderIssueCard(issue: Issue, proj: { members: { id: number; username: string }[] }) {
  const selected = state.selectedIssueIds.includes(issue.id)

  return h('div', {
    class: `card bg-base-100 shadow-sm border hover-lift ${isOverdue(issue) ? 'border-error/40' : selected ? 'border-primary/40' : 'border-base-200'}`,
  },
    h('div', { class: 'card-body py-4' },
      h('div', { class: 'flex items-center gap-3' },
        h('input', {
          type: 'checkbox',
          class: 'checkbox checkbox-sm checkbox-primary',
          checked: selected,
          onClick: (e: Event) => {
            e.stopPropagation()
            toggleIssueSelection(issue.id)
          },
        }),
        h('div', {
          class: 'flex-1 cursor-pointer',
          onClick: () => {
            state.selectedIssue = issue
            navigate('issue-detail')
            loadComments(issue.id)
          },
        },
          h('div', { class: 'flex items-center justify-between' },
            h('div', { class: 'flex-1' },
              h('h3', { class: 'font-semibold text-base' }, issue.title),
              h('p', { class: 'text-sm text-base-content/60 mt-1 line-clamp-1' },
                issue.description || t('noDescription')
              ),
            ),
            h('div', { class: 'flex gap-2 items-center' },
              StatusBadge(issue.status),
              PriorityBadge(issue.priority),
            )
          ),
          issue.labels.length > 0
            ? h('div', { class: 'flex gap-1 flex-wrap mt-2' },
                ...issue.labels.map(labelId => {
                  const lb = state.labels.find(l => l.id === labelId)
                  return lb
                    ? h('span', {
                        class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white',
                        style: `background-color: ${lb.color}`,
                      }, lb.name)
                    : null
                })
              )
            : null,
          h('div', { class: 'flex items-center gap-4 mt-2 text-xs text-base-content/50' },
            h('span', {}, `${t('reporter')}: ${issue.reporter?.username || t('unknown')}`),
            issue.assignee
              ? h('span', {}, `${t('assignee')}: ${proj.members.find(m => m.id === issue.assignee)?.username || '#' + issue.assignee}`)
              : null,
            issue.due_date
              ? h('span', { class: isOverdue(issue) ? 'text-error font-medium' : '' },
                  `${t('due')}: ${formatDate(issue.due_date)}${isOverdue(issue) ? ' !' : ''}`)
              : null,
            h('span', {}, formatDate(issue.created_at)),
          )
        ),
      )
    )
  )
}

// ========== Main render ==========

export function renderIssuesList() {
  if (!state.selectedProject) return h('div')
  const proj = state.selectedProject
  const filteredIssues = getFilteredIssues()

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: t('projects'), onClick: () => { state.selectedProject = null; navigate('projects'); loadProjects() } },
      { label: proj.name },
    ]),

    h('div', { class: 'flex items-center justify-between mb-6' },
      PageHeader(proj.name, t('issuesTotal', { count: state.issuesTotal || state.issues.length })),
      h('div', { class: 'flex gap-2 flex-wrap' },
        PrimaryButton({ children: t('newIssue') }, () => openModal('issue-modal')),
        SecondaryButton({ children: t('exportCsv') }, exportCsv),
        SecondaryButton({ children: t('members') }, () => { resetMembershipsLoaded(); navigate('members') }),
        SecondaryButton({ children: t('dashboard') }, () => navigate('dashboard')),
      )
    ),

    // Search + filters + sort + view toggle
    h('div', { class: 'flex gap-2 mb-4 flex-wrap items-center' },
      h('input', {
        type: 'text',
        class: 'input input-sm flex-1 min-w-[200px]',
        placeholder: t('searchIssues'),
        value: searchQuery,
        onInput: (e: Event) => {
          searchQuery = (e.target as HTMLInputElement).value
          render()
        },
      }),
      state.labels.length > 0
        ? h('select', {
            class: 'select select-sm',
            onChange: (e: Event) => {
              const val = (e.target as HTMLSelectElement).value
              filterLabelId = val ? Number(val) : null
              render()
            },
          },
            h('option', { value: '' }, t('filterByLabel')),
            ...state.labels.map(lb =>
              h('option', { value: String(lb.id) }, lb.name)
            )
          )
        : null,
      renderSortControls(),
      h('div', { class: 'flex border border-base-300 rounded-lg overflow-hidden' },
        h('button', {
          class: `btn btn-sm rounded-none border-0 ${state.issuesViewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => { state.issuesViewMode = 'list'; render() },
        }, t('listView')),
        h('button', {
          class: `btn btn-sm rounded-none border-0 ${state.issuesViewMode === 'kanban' ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => { state.issuesViewMode = 'kanban'; render() },
        }, t('kanbanView')),
        h('button', {
          class: `btn btn-sm rounded-none border-0 ${state.issuesViewMode === 'gantt' ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => { state.issuesViewMode = 'gantt'; render() },
        }, t('ganttView')),
      ),
    ),

    // Status filter tabs
    h('div', { class: 'flex gap-2 mb-4 flex-wrap' },
      h('button', {
        class: `btn btn-sm ${!activeStatusFilter ? 'btn-primary' : 'btn-outline'}`,
        onClick: () => { activeStatusFilter = null; state.issuesPage = 1; loadIssues(proj.id) },
      }, t('all')),
      ...(['open', 'in_progress', 'done', 'cancelled'] as const).map(s =>
        h('button', {
          class: `btn btn-sm ${activeStatusFilter === s ? 'btn-primary' : 'btn-outline'}`,
          onClick: () => {
            activeStatusFilter = s
            state.issuesPage = 1
            loadIssues(proj.id)
          },
        }, t(s))
      )
    ),

    // Saved filters
    renderSavedFilters(),

    // Bulk actions bar
    renderBulkBar(),

    // Content
    state.loading
      ? Loader()
      : filteredIssues.length === 0
        ? EmptyState(state.issues.length === 0 ? t('noIssuesYet') : t('noResults'))
        : state.issuesViewMode === 'gantt'
          ? renderGantt(filteredIssues, proj)
          : state.issuesViewMode === 'kanban'
            ? renderKanban(filteredIssues, proj)
            : h('div', { class: 'space-y-3' },
                // Select all checkbox
                h('div', { class: 'flex items-center gap-2 px-1' },
                  h('input', {
                    type: 'checkbox',
                    class: 'checkbox checkbox-sm checkbox-primary',
                    checked: state.selectedIssueIds.length === filteredIssues.length && filteredIssues.length > 0,
                    onClick: () => {
                      if (state.selectedIssueIds.length === filteredIssues.length) deselectAll()
                      else selectAllVisible()
                    },
                  }),
                  h('span', { class: 'text-sm text-base-content/60' }, t('selectAll')),
                ),
                ...filteredIssues.map(issue => renderIssueCard(issue, proj))
              ),

    // Pagination
    state.issuesViewMode === 'list' ? renderPagination() : null,

    // Create issue modal
    modalWrapper('issue-modal', t('createIssue'),
      Form(
        {
          onSubmit: (e) => {
            createIssue(new FormData(e.currentTarget as HTMLFormElement))
            closeModal('issue-modal')
            ;(e.currentTarget as HTMLFormElement).reset()
          },
        },
        FormGroup({},
          Label({}, t('title')),
          Input({ name: 'title', placeholder: t('issueTitle'), class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, t('description')),
          Textarea({ name: 'description', placeholder: t('describeIssue'), class: 'mt-2' })
        ),
        h('div', { class: 'grid grid-cols-2 gap-4 mt-4' },
          FormGroup({},
            Label({}, t('priority')),
            Select({
              name: 'priority',
              options: [
                { value: 'low', label: t('low') },
                { value: 'medium', label: t('medium') },
                { value: 'high', label: t('high') },
              ],
              class: 'mt-2',
            })
          ),
          FormGroup({},
            Label({}, t('status')),
            Select({
              name: 'status',
              options: [
                { value: 'open', label: t('open') },
                { value: 'in_progress', label: t('in_progress') },
                { value: 'done', label: t('done') },
                { value: 'cancelled', label: t('cancelled') },
              ],
              class: 'mt-2',
            })
          ),
        ),
        h('div', { class: 'grid grid-cols-2 gap-4 mt-4' },
          FormGroup({},
            Label({}, t('assignee')),
            Select({
              name: 'assignee',
              options: [
                { value: '', label: t('unassigned') },
                ...proj.members.map(m => ({ value: String(m.id), label: m.username })),
              ],
              class: 'mt-2',
            })
          ),
          FormGroup({},
            Label({}, t('dueDate')),
            h('input', { type: 'date', name: 'due_date', class: 'input mt-2' })
          ),
        ),
        state.labels.length > 0
          ? FormGroup({ class: 'mt-4' },
              Label({}, t('labels')),
              h('div', { class: 'flex flex-wrap gap-2 mt-2' },
                ...state.labels.map(lb =>
                  h('label', {
                    class: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer border-2 transition-all ${
                      selectedLabelIds.includes(lb.id)
                        ? 'border-primary bg-primary/10 font-medium'
                        : 'border-base-300 bg-base-100 hover:border-base-content/30'
                    }`,
                    onClick: () => {
                      if (selectedLabelIds.includes(lb.id)) {
                        selectedLabelIds = selectedLabelIds.filter(id => id !== lb.id)
                      } else {
                        selectedLabelIds = [...selectedLabelIds, lb.id]
                      }
                      render()
                    },
                  },
                    h('span', {
                      class: 'w-3 h-3 rounded-full shrink-0',
                      style: `background-color: ${lb.color}`,
                    }),
                    lb.name
                  )
                )
              )
            )
          : null,
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: t('cancel'), class: 'btn-ghost' }, () => closeModal('issue-modal')),
          PrimaryButton({ children: t('create'), type: 'submit' })
        )
      )
    )
  )
}
