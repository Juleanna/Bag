import {
  h, Container, Card, PageHeader, Breadcrumb, SecondaryButton, Loader,
} from '../components.ts'
import { api } from '../api.ts'
import type { Issue, PaginatedResponse } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render, navigate } from '../state.ts'
import { loadProjects } from './projects.ts'
import { loadIssues } from './issues.ts'

let dashboardIssues: Issue[] = []
let dashboardLoaded = false

export function resetDashboard() {
  dashboardLoaded = false
}

async function loadDashboardData(projectId: number) {
  try {
    const response = await api.get<PaginatedResponse<Issue>>(`/issues/?project=${projectId}&limit=1000`)
    dashboardIssues = response.results || (response as any)
    dashboardLoaded = true
    render()
  } catch {
    dashboardIssues = []
    dashboardLoaded = true
    render()
  }
}

function statCard(value: number, label: string, color: string) {
  return h('div', { class: 'bg-base-100 border border-base-200 rounded-xl p-5 text-center' },
    h('p', { class: `text-3xl font-bold ${color}` }, String(value)),
    h('p', { class: 'text-sm text-base-content/60 mt-1' }, label),
  )
}

function progressBar(label: string, value: number, total: number, color: string) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return h('div', { class: 'space-y-1' },
    h('div', { class: 'flex justify-between text-sm' },
      h('span', {}, label),
      h('span', { class: 'text-base-content/60' }, `${value} (${pct}%)`),
    ),
    h('div', { class: 'w-full bg-base-200 rounded-full h-2.5' },
      h('div', {
        class: `h-2.5 rounded-full ${color}`,
        style: `width: ${pct}%`,
      })
    ),
  )
}

export function renderDashboard() {
  if (!state.selectedProject) {
    return Container(
      { class: 'py-8' },
      h('div', { class: 'text-center py-20' },
        h('p', { class: 'text-base-content/60 text-lg' }, t('noProjectSelected'))
      )
    )
  }

  const proj = state.selectedProject

  if (!dashboardLoaded) {
    dashboardLoaded = true
    loadDashboardData(proj.id)
    return Container({ class: 'py-8' }, Loader())
  }

  const total = dashboardIssues.length
  const open = dashboardIssues.filter(i => i.status === 'open').length
  const inProgress = dashboardIssues.filter(i => i.status === 'in_progress').length
  const done = dashboardIssues.filter(i => i.status === 'done').length
  const cancelled = dashboardIssues.filter(i => i.status === 'cancelled').length

  const low = dashboardIssues.filter(i => i.priority === 'low').length
  const medium = dashboardIssues.filter(i => i.priority === 'medium').length
  const high = dashboardIssues.filter(i => i.priority === 'high').length

  const overdue = dashboardIssues.filter(i =>
    i.due_date && new Date(i.due_date) < new Date() && i.status !== 'done' && i.status !== 'cancelled'
  ).length

  const unassigned = dashboardIssues.filter(i => !i.assignee).length

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: t('projects'), onClick: () => { state.selectedProject = null; navigate('projects'); loadProjects() } },
      { label: proj.name, onClick: () => { navigate('issues'); loadIssues(proj.id) } },
      { label: t('dashboard') },
    ]),

    PageHeader(t('dashboard'), t('overview') + ' — ' + proj.name),

    // Stats grid
    h('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6' },
      statCard(total, t('totalIssues'), 'text-primary'),
      statCard(open, t('openIssues'), 'text-info'),
      statCard(inProgress, t('inProgressIssues'), 'text-warning'),
      statCard(done, t('doneIssues'), 'text-success'),
    ),

    h('div', { class: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6' },
      // Status breakdown
      Card({}, t('issuesByStatus'),
        h('div', { class: 'space-y-3' },
          progressBar(t('open'), open, total, 'bg-info'),
          progressBar(t('in_progress'), inProgress, total, 'bg-warning'),
          progressBar(t('done'), done, total, 'bg-success'),
          progressBar(t('cancelled'), cancelled, total, 'bg-error'),
        )
      ),

      // Priority breakdown
      Card({}, t('issuesByPriority'),
        h('div', { class: 'space-y-3' },
          progressBar(t('high'), high, total, 'bg-error'),
          progressBar(t('medium'), medium, total, 'bg-warning'),
          progressBar(t('low'), low, total, 'bg-success'),
        )
      ),
    ),

    // Extra stats
    h('div', { class: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6' },
      statCard(cancelled, t('cancelledIssues'), 'text-error'),
      statCard(overdue, t('overdue'), 'text-error'),
      statCard(unassigned, t('unassigned'), 'text-base-content/60'),
      statCard(proj.members.length, t('members'), 'text-primary'),
    ),

    h('div', { class: 'mt-6' },
      SecondaryButton({ children: t('backToIssues') }, () => {
        navigate('issues')
        loadIssues(proj.id)
      })
    )
  )
}
