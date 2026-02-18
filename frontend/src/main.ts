/**
 * BugTracker — main application
 * Full CRUD for projects, issues, comments, labels, members
 */

import './style.css'
import {
  h,
  Navbar,
  NavbarItem,
  Container,
  PageHeader,
  Card,
  Button,
  PrimaryButton,
  SecondaryButton,
  DangerButton,
  Grid,
  Badge,
  StatusBadge,
  PriorityBadge,
  Input,
  Textarea,
  Select,
  FormGroup,
  Label,
  Form,
  EmptyState,
  Loader,
  Breadcrumb,
  showToast,
  showConfirm,
} from './components'
import { api } from './api'
import type { Project, Issue, Comment as IComment, UserShort, Label as ILabel, PaginatedResponse } from './api'

// ============ State ============

let projects: Project[] = []
let issues: Issue[] = []
let comments: IComment[] = []
let labels: ILabel[] = []
let currentUser: UserShort | null = null
let currentPage = 'login'
let selectedProject: Project | null = null
let selectedIssue: Issue | null = null
let loading = false

const app = document.querySelector<HTMLDivElement>('#app')!

// ============ Data Loading ============

async function checkAuth() {
  try {
    const auth = await api.getWhoami()
    if (auth.isAuthenticated && auth.user) {
      currentUser = auth.user
      currentPage = 'projects'
      loadProjects()
    } else {
      currentPage = 'login'
      render()
    }
  } catch {
    currentPage = 'login'
    render()
  }
}

async function handleLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username.trim() || !password.trim()) {
    showToast('Fill in all fields', 'warning')
    return
  }

  try {
    const auth = await api.login(username, password)
    if (auth.isAuthenticated && auth.user) {
      currentUser = auth.user
      currentPage = 'projects'
      loadProjects()
      showToast(`Welcome, ${auth.user.username}!`, 'success')
    } else {
      showToast(auth.error || 'Login failed', 'error')
    }
  } catch (error: any) {
    showToast(error.message || 'Invalid credentials', 'error')
  }
}

async function handleRegister(formData: FormData) {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!username.trim() || !email.trim() || !password.trim()) {
    showToast('Fill in all fields', 'warning')
    return
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'warning')
    return
  }

  try {
    const auth = await api.register(username, email, password)
    if (auth.isAuthenticated && auth.user) {
      currentUser = auth.user
      currentPage = 'projects'
      loadProjects()
      showToast('Registration successful!', 'success')
    }
  } catch (error: any) {
    showToast(error.message || 'Registration failed', 'error')
  }
}

async function handleLogout() {
  try {
    await api.logout()
    currentUser = null
    currentPage = 'login'
    projects = []
    issues = []
    comments = []
    selectedProject = null
    selectedIssue = null
    showToast('Logged out', 'success')
    render()
  } catch {
    showToast('Logout failed', 'error')
  }
}

async function loadProjects() {
  loading = true
  render()
  try {
    const response = await api.get<PaginatedResponse<Project>>('/projects/')
    projects = response.results || (response as any)
    loading = false
    render()
  } catch {
    loading = false
    showToast('Failed to load projects', 'error')
    render()
  }
}

async function loadIssues(projectId: number) {
  loading = true
  render()
  try {
    const response = await api.get<PaginatedResponse<Issue>>(`/issues/?project=${projectId}`)
    issues = response.results || (response as any)
    loading = false
    render()
  } catch {
    loading = false
    showToast('Failed to load issues', 'error')
    render()
  }
}

async function loadComments(issueId: number) {
  try {
    const response = await api.get<PaginatedResponse<IComment>>(`/comments/?issue=${issueId}`)
    comments = response.results || (response as any)
    render()
  } catch {
    showToast('Failed to load comments', 'error')
  }
}

async function loadLabels() {
  try {
    const response = await api.get<PaginatedResponse<ILabel>>('/labels/')
    labels = response.results || (response as any)
  } catch {
    labels = []
  }
}

// ============ CRUD — Projects ============

async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name.trim()) {
    showToast('Enter project name', 'warning')
    return
  }

  try {
    await api.post('/projects/', { name, description })
    showToast('Project created!', 'success')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || 'Failed to create project', 'error')
  }
}

async function updateProject(projectId: number, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  try {
    await api.patch(`/projects/${projectId}/`, { name, description })
    showToast('Project updated!', 'success')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || 'Failed to update project', 'error')
  }
}

async function deleteProject(projectId: number) {
  const confirmed = await showConfirm('Are you sure you want to delete this project? All issues will be lost.')
  if (!confirmed) return

  try {
    await api.delete(`/projects/${projectId}/`)
    showToast('Project deleted', 'success')
    selectedProject = null
    currentPage = 'projects'
    loadProjects()
  } catch (error: any) {
    showToast(error.message || 'Failed to delete project', 'error')
  }
}

// ============ CRUD — Issues ============

async function createIssue(formData: FormData) {
  if (!selectedProject) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string
  const status = formData.get('status') as string

  if (!title.trim()) {
    showToast('Enter issue title', 'warning')
    return
  }

  try {
    await api.post('/issues/', {
      title,
      description,
      priority: priority || 'medium',
      status: status || 'open',
      project: selectedProject.id,
    })
    showToast('Issue created!', 'success')
    loadIssues(selectedProject.id)
  } catch (error: any) {
    showToast(error.message || 'Failed to create issue', 'error')
  }
}

async function updateIssue(issueId: number, data: Record<string, any>) {
  try {
    const updated = await api.patch<Issue>(`/issues/${issueId}/`, data)
    if (selectedIssue && selectedIssue.id === issueId) {
      selectedIssue = updated
    }
    if (selectedProject) {
      loadIssues(selectedProject.id)
    }
    showToast('Issue updated!', 'success')
  } catch (error: any) {
    showToast(error.message || 'Failed to update issue', 'error')
  }
}

async function deleteIssue(issueId: number) {
  const confirmed = await showConfirm('Are you sure you want to delete this issue?')
  if (!confirmed) return

  try {
    await api.delete(`/issues/${issueId}/`)
    showToast('Issue deleted', 'success')
    selectedIssue = null
    if (selectedProject) {
      currentPage = 'issues'
      loadIssues(selectedProject.id)
    }
  } catch (error: any) {
    showToast(error.message || 'Failed to delete issue', 'error')
  }
}

// ============ CRUD — Comments ============

async function createComment(issueId: number, body: string) {
  if (!body.trim()) return

  try {
    await api.post('/comments/', { issue: issueId, body })
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || 'Failed to add comment', 'error')
  }
}

async function deleteComment(commentId: number, issueId: number) {
  try {
    await api.delete(`/comments/${commentId}/`)
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || 'Failed to delete comment', 'error')
  }
}

// ============ CRUD — Labels ============

async function createLabel(name: string, color: string) {
  try {
    await api.post('/labels/', { name, color })
    await loadLabels()
    showToast('Label created!', 'success')
    render()
  } catch (error: any) {
    showToast(error.message || 'Failed to create label', 'error')
  }
}

async function deleteLabel(labelId: number) {
  try {
    await api.delete(`/labels/${labelId}/`)
    await loadLabels()
    showToast('Label deleted', 'success')
    render()
  } catch (error: any) {
    showToast(error.message || 'Failed to delete label', 'error')
  }
}

// ============ Helpers ============

function closeModal(id: string) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.add('hidden')
}

function openModal(id: string) {
  const modal = document.getElementById(id)
  if (modal) modal.classList.remove('hidden')
}

function modalWrapper(id: string, title: string, content: Node): Node {
  return h(
    'div',
    {
      id,
      class: 'modal hidden',
      onClick: (e: MouseEvent) => {
        if (e.target === e.currentTarget) closeModal(id)
      },
    },
    h('div', { class: 'modal-box' },
      h('h3', { class: 'font-bold text-lg mb-4' }, title),
      content
    )
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ============ View — Navbar ============

function renderNavbar() {
  return Navbar(
    {},
    NavbarItem({ class: 'flex-1' },
      h('a', {
        class: 'text-xl font-bold text-primary cursor-pointer',
        onClick: () => { currentPage = 'projects'; selectedProject = null; selectedIssue = null; render() },
      }, 'BugTracker')
    ),
    NavbarItem(
      { class: 'gap-2' },
      currentUser && h('span', { class: 'text-sm text-base-content/70' }, currentUser.username),
      currentUser && h('button', {
        class: `btn btn-sm ${currentPage === 'projects' && !selectedProject ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => { currentPage = 'projects'; selectedProject = null; selectedIssue = null; loadProjects() },
      }, 'Projects'),
      currentUser && h('button', {
        class: `btn btn-sm ${currentPage === 'labels' ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => { currentPage = 'labels'; loadLabels().then(() => render()) },
      }, 'Labels'),
      currentUser && h('button', {
        class: `btn btn-sm ${currentPage === 'profile' ? 'btn-primary' : 'btn-ghost'}`,
        onClick: () => { currentPage = 'profile'; render() },
      }, 'Profile'),
      currentUser && h('button', {
        class: 'btn btn-sm btn-ghost',
        onClick: handleLogout,
      }, 'Logout')
    )
  )
}

// ============ View — Login ============

function renderLogin() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, 'BugTracker'),
        h('p', { class: 'text-base-content/70' }, 'Project & Issue Management')
      ),
      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, 'Login'),
          Form(
            {
              onSubmit: (e) => {
                handleLogin(new FormData(e.currentTarget as HTMLFormElement))
              },
            },
            FormGroup({},
              Label({}, 'Username or Email'),
              Input({ name: 'username', placeholder: 'Enter username or email', class: 'mt-2', type: 'text' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, 'Password'),
              Input({ name: 'password', placeholder: 'Enter password', class: 'mt-2', type: 'password' })
            ),
            h('div', { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ children: 'Login', type: 'submit', class: 'w-full' }),
              h('button', {
                type: 'button',
                class: 'btn btn-ghost w-full',
                onClick: () => { currentPage = 'register'; render() },
              }, 'Create Account')
            )
          )
        )
      )
    )
  )
}

// ============ View — Register ============

function renderRegister() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, 'BugTracker'),
        h('p', { class: 'text-base-content/70' }, 'Create your account')
      ),
      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, 'Register'),
          Form(
            {
              onSubmit: (e) => {
                handleRegister(new FormData(e.currentTarget as HTMLFormElement))
              },
            },
            FormGroup({},
              Label({}, 'Username'),
              Input({ name: 'username', placeholder: 'Choose a username', class: 'mt-2', type: 'text' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, 'Email'),
              Input({ name: 'email', placeholder: 'Your email', class: 'mt-2', type: 'email' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, 'Password'),
              Input({ name: 'password', placeholder: 'Create password', class: 'mt-2', type: 'password' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, 'Confirm Password'),
              Input({ name: 'confirmPassword', placeholder: 'Repeat password', class: 'mt-2', type: 'password' })
            ),
            h('div', { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ children: 'Create Account', type: 'submit', class: 'w-full' }),
              h('button', {
                type: 'button',
                class: 'btn btn-ghost w-full',
                onClick: () => { currentPage = 'login'; render() },
              }, 'Already have an account? Login')
            )
          )
        )
      )
    )
  )
}

// ============ View — Projects List ============

function renderProjectsList() {
  return Container(
    { class: 'py-8' },
    PageHeader('Projects', `${projects.length} projects total`),

    h('div', { class: 'mb-8' },
      PrimaryButton({ children: '+ New Project' }, () => openModal('project-modal'))
    ),

    loading
      ? Loader()
      : projects.length === 0
        ? EmptyState('No projects yet. Create your first project!')
        : Grid(
            { columns: 3 },
            ...projects.map((project) =>
              Card(
                {
                  class: 'hover-lift cursor-pointer',
                  onClick: () => {
                    selectedProject = project
                    currentPage = 'issues'
                    loadIssues(project.id)
                  },
                },
                project.name,
                h('div', { class: 'space-y-3' },
                  h('p', { class: 'text-sm text-base-content/70 line-clamp-2' },
                    project.description || 'No description'
                  ),
                  h('div', { class: 'flex justify-between items-center pt-4' },
                    Badge({ variant: 'primary' }, `${project.issues_count ?? 0} issues`),
                    h('small', { class: 'text-base-content/50' },
                      `Owner: ${project.owner?.username || 'unknown'}`
                    )
                  ),
                  h('div', { class: 'flex gap-1 pt-2' },
                    h('button', {
                      class: 'btn btn-xs btn-ghost',
                      onClick: (e: Event) => {
                        e.stopPropagation()
                        // Fill edit form
                        openModal('edit-project-modal')
                        setTimeout(() => {
                          const nameInput = document.querySelector('#edit-project-name') as HTMLInputElement
                          const descInput = document.querySelector('#edit-project-desc') as HTMLTextAreaElement
                          const idInput = document.querySelector('#edit-project-id') as HTMLInputElement
                          if (nameInput) nameInput.value = project.name
                          if (descInput) descInput.value = project.description
                          if (idInput) idInput.value = String(project.id)
                        }, 50)
                      },
                    }, 'Edit'),
                    h('button', {
                      class: 'btn btn-xs btn-ghost text-error',
                      onClick: (e: Event) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      },
                    }, 'Delete')
                  )
                )
              )
            )
          ),

    // Create Project Modal
    modalWrapper('project-modal', 'Create Project',
      Form(
        {
          onSubmit: (e) => {
            createProject(new FormData(e.currentTarget as HTMLFormElement))
            closeModal('project-modal')
            ;(e.currentTarget as HTMLFormElement).reset()
          },
        },
        FormGroup({},
          Label({}, 'Project Name'),
          Input({ name: 'name', placeholder: 'Enter name', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Description'),
          Textarea({ name: 'description', placeholder: 'Describe the project', class: 'mt-2' })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: 'Cancel', class: 'btn-ghost' }, () => closeModal('project-modal')),
          PrimaryButton({ children: 'Create', type: 'submit' })
        )
      )
    ),

    // Edit Project Modal
    modalWrapper('edit-project-modal', 'Edit Project',
      Form(
        {
          onSubmit: (e) => {
            const form = e.currentTarget as HTMLFormElement
            const fd = new FormData(form)
            const id = Number(fd.get('id'))
            updateProject(id, fd)
            closeModal('edit-project-modal')
          },
        },
        h('input', { type: 'hidden', name: 'id', id: 'edit-project-id' }),
        FormGroup({},
          Label({}, 'Project Name'),
          Input({ name: 'name', id: 'edit-project-name', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Description'),
          Textarea({ name: 'description', id: 'edit-project-desc', class: 'mt-2' })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: 'Cancel', class: 'btn-ghost' }, () => closeModal('edit-project-modal')),
          PrimaryButton({ children: 'Save', type: 'submit' })
        )
      )
    )
  )
}

// ============ View — Issues List ============

function renderIssuesList() {
  if (!selectedProject) return h('div')

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: 'Projects', onClick: () => { currentPage = 'projects'; selectedProject = null; loadProjects() } },
      { label: selectedProject.name },
    ]),

    h('div', { class: 'flex items-center justify-between mb-6' },
      PageHeader(selectedProject.name, `${issues.length} issues`),
      h('div', { class: 'flex gap-2' },
        PrimaryButton({ children: '+ New Issue' }, () => openModal('issue-modal')),
        SecondaryButton({ children: 'Members' }, () => {
          currentPage = 'members'
          render()
        })
      )
    ),

    // Filters
    h('div', { class: 'flex gap-2 mb-6 flex-wrap' },
      h('button', {
        class: 'btn btn-sm btn-outline',
        onClick: () => { loadIssues(selectedProject!.id) },
      }, 'All'),
      ...(['open', 'in_progress', 'done', 'cancelled'] as const).map(status =>
        h('button', {
          class: 'btn btn-sm btn-outline',
          onClick: async () => {
            const response = await api.get<PaginatedResponse<Issue>>(
              `/issues/?project=${selectedProject!.id}&status=${status}`
            )
            issues = response.results || (response as any)
            render()
          },
        }, status.replace('_', ' '))
      )
    ),

    loading
      ? Loader()
      : issues.length === 0
        ? EmptyState('No issues. Create your first issue!')
        : h('div', { class: 'space-y-3' },
            ...issues.map((issue) =>
              h('div', {
                class: 'card bg-base-100 shadow-sm border border-base-200 hover-lift cursor-pointer',
                onClick: () => {
                  selectedIssue = issue
                  currentPage = 'issue-detail'
                  loadComments(issue.id)
                },
              },
                h('div', { class: 'card-body py-4' },
                  h('div', { class: 'flex items-center justify-between' },
                    h('div', { class: 'flex-1' },
                      h('h3', { class: 'font-semibold text-base' }, issue.title),
                      h('p', { class: 'text-sm text-base-content/60 mt-1 line-clamp-1' },
                        issue.description || 'No description'
                      ),
                    ),
                    h('div', { class: 'flex gap-2 items-center' },
                      StatusBadge(issue.status),
                      PriorityBadge(issue.priority),
                    )
                  ),
                  h('div', { class: 'flex items-center gap-4 mt-2 text-xs text-base-content/50' },
                    h('span', {}, `Reporter: ${issue.reporter?.username || 'unknown'}`),
                    issue.assignee ? h('span', {}, `Assignee: #${issue.assignee}`) : null,
                    h('span', {}, formatDate(issue.created_at)),
                  )
                )
              )
            )
          ),

    // Create Issue Modal
    modalWrapper('issue-modal', 'Create Issue',
      Form(
        {
          onSubmit: (e) => {
            createIssue(new FormData(e.currentTarget as HTMLFormElement))
            closeModal('issue-modal')
            ;(e.currentTarget as HTMLFormElement).reset()
          },
        },
        FormGroup({},
          Label({}, 'Title'),
          Input({ name: 'title', placeholder: 'Issue title', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Description'),
          Textarea({ name: 'description', placeholder: 'Describe the issue', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Priority'),
          Select({
            name: 'priority',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
            ],
            class: 'mt-2',
          })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Status'),
          Select({
            name: 'status',
            options: [
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'done', label: 'Done' },
              { value: 'cancelled', label: 'Cancelled' },
            ],
            class: 'mt-2',
          })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: 'Cancel', class: 'btn-ghost' }, () => closeModal('issue-modal')),
          PrimaryButton({ children: 'Create', type: 'submit' })
        )
      )
    )
  )
}

// ============ View — Issue Detail ============

function renderIssueDetail() {
  if (!selectedIssue || !selectedProject) return h('div')

  const issue = selectedIssue

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: 'Projects', onClick: () => { currentPage = 'projects'; selectedProject = null; loadProjects() } },
      { label: selectedProject.name, onClick: () => { currentPage = 'issues'; selectedIssue = null; loadIssues(selectedProject!.id) } },
      { label: issue.title },
    ]),

    h('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
      // Main content
      h('div', { class: 'lg:col-span-2 space-y-6' },
        // Issue header
        Card({}, issue.title,
          h('div', { class: 'space-y-4' },
            h('p', { class: 'text-base-content/80 whitespace-pre-wrap' },
              issue.description || 'No description'
            ),
            h('div', { class: 'flex gap-2 flex-wrap' },
              StatusBadge(issue.status),
              PriorityBadge(issue.priority),
            ),
            h('div', { class: 'flex gap-2 pt-2' },
              SecondaryButton({ children: 'Edit' }, () => {
                openModal('edit-issue-modal')
                setTimeout(() => {
                  const ti = document.querySelector('#edit-issue-title') as HTMLInputElement
                  const de = document.querySelector('#edit-issue-desc') as HTMLTextAreaElement
                  if (ti) ti.value = issue.title
                  if (de) de.value = issue.description
                }, 50)
              }),
              DangerButton({ children: 'Delete' }, () => deleteIssue(issue.id)),
            )
          )
        ),

        // Comments section
        Card({}, `Comments (${comments.length})`,
          h('div', { class: 'space-y-4' },
            // Add comment form
            Form(
              {
                onSubmit: (e) => {
                  const form = e.currentTarget as HTMLFormElement
                  const fd = new FormData(form)
                  const body = fd.get('body') as string
                  createComment(issue.id, body)
                  form.reset()
                },
              },
              FormGroup({},
                Textarea({ name: 'body', placeholder: 'Write a comment...', class: 'mt-2', rows: '3' })
              ),
              h('div', { class: 'flex justify-end mt-2' },
                PrimaryButton({ children: 'Comment', type: 'submit' })
              )
            ),

            // Comments list
            comments.length === 0
              ? h('p', { class: 'text-base-content/50 text-center py-4' }, 'No comments yet')
              : h('div', { class: 'space-y-3 mt-4 border-t border-base-200 pt-4' },
                  ...comments.map(c =>
                    h('div', { class: 'bg-base-200/50 rounded-lg p-4' },
                      h('div', { class: 'flex items-center justify-between mb-2' },
                        h('span', { class: 'font-semibold text-sm' }, c.author?.username || 'unknown'),
                        h('div', { class: 'flex items-center gap-2' },
                          h('span', { class: 'text-xs text-base-content/50' }, formatDate(c.created_at)),
                          currentUser && c.author && c.author.id === currentUser.id
                            ? h('button', {
                                class: 'btn btn-xs btn-ghost text-error',
                                onClick: () => deleteComment(c.id, issue.id),
                              }, 'x')
                            : null
                        )
                      ),
                      h('p', { class: 'text-sm whitespace-pre-wrap' }, c.body)
                    )
                  )
                )
          )
        ),
      ),

      // Sidebar
      h('div', { class: 'space-y-4' },
        // Status change
        Card({}, 'Status',
          h('div', { class: 'space-y-2' },
            ...(['open', 'in_progress', 'done', 'cancelled'] as const).map(status =>
              h('button', {
                class: `btn btn-sm w-full ${issue.status === status ? 'btn-primary' : 'btn-outline'}`,
                onClick: () => updateIssue(issue.id, { status }),
              }, status.replace('_', ' '))
            )
          )
        ),

        // Priority change
        Card({}, 'Priority',
          h('div', { class: 'space-y-2' },
            ...(['low', 'medium', 'high'] as const).map(priority =>
              h('button', {
                class: `btn btn-sm w-full ${issue.priority === priority ? 'btn-primary' : 'btn-outline'}`,
                onClick: () => updateIssue(issue.id, { priority }),
              }, priority)
            )
          )
        ),

        // Info
        Card({}, 'Details',
          h('div', { class: 'space-y-2 text-sm' },
            h('div', {},
              h('span', { class: 'text-base-content/60' }, 'Reporter: '),
              h('span', { class: 'font-medium' }, issue.reporter?.username || 'unknown')
            ),
            h('div', {},
              h('span', { class: 'text-base-content/60' }, 'Created: '),
              h('span', { class: 'font-medium' }, formatDate(issue.created_at))
            ),
            h('div', {},
              h('span', { class: 'text-base-content/60' }, 'Updated: '),
              h('span', { class: 'font-medium' }, formatDate(issue.updated_at))
            ),
            issue.due_date ? h('div', {},
              h('span', { class: 'text-base-content/60' }, 'Due: '),
              h('span', { class: 'font-medium' }, issue.due_date)
            ) : null
          )
        ),
      ),
    ),

    // Edit Issue Modal
    modalWrapper('edit-issue-modal', 'Edit Issue',
      Form(
        {
          onSubmit: (e) => {
            const fd = new FormData(e.currentTarget as HTMLFormElement)
            const title = fd.get('title') as string
            const description = fd.get('description') as string
            updateIssue(issue.id, { title, description })
            closeModal('edit-issue-modal')
          },
        },
        FormGroup({},
          Label({}, 'Title'),
          Input({ name: 'title', id: 'edit-issue-title', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, 'Description'),
          Textarea({ name: 'description', id: 'edit-issue-desc', class: 'mt-2', rows: '5' })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: 'Cancel', class: 'btn-ghost' }, () => closeModal('edit-issue-modal')),
          PrimaryButton({ children: 'Save', type: 'submit' })
        )
      )
    )
  )
}

// ============ View — Labels ============

function renderLabels() {
  return Container(
    { class: 'py-8' },
    PageHeader('Labels', 'Manage issue labels'),

    h('div', { class: 'mb-6' },
      Form(
        {
          onSubmit: (e) => {
            const fd = new FormData(e.currentTarget as HTMLFormElement)
            const name = fd.get('name') as string
            const color = fd.get('color') as string
            if (name.trim()) {
              createLabel(name, color || '#3b82f6')
              ;(e.currentTarget as HTMLFormElement).reset()
            }
          },
        },
        h('div', { class: 'flex gap-2 items-end' },
          FormGroup({ class: 'flex-1' },
            Label({}, 'Label Name'),
            Input({ name: 'name', placeholder: 'e.g., bug, feature, docs', class: 'mt-2' })
          ),
          FormGroup({ class: 'w-32' },
            Label({}, 'Color'),
            h('input', { type: 'color', name: 'color', value: '#3b82f6', class: 'input mt-2 h-10 p-1' })
          ),
          PrimaryButton({ children: 'Add', type: 'submit', class: 'mb-0' })
        )
      )
    ),

    labels.length === 0
      ? EmptyState('No labels yet')
      : h('div', { class: 'flex flex-wrap gap-3' },
          ...labels.map(label =>
            h('div', {
              class: 'flex items-center gap-2 px-3 py-2 rounded-lg border border-base-200 bg-base-100',
            },
              h('span', {
                class: 'w-4 h-4 rounded-full',
                style: `background-color: ${label.color}`,
              }),
              h('span', { class: 'font-medium' }, label.name),
              h('button', {
                class: 'btn btn-xs btn-ghost text-error ml-2',
                onClick: () => deleteLabel(label.id),
              }, 'x')
            )
          )
        )
  )
}

// ============ View — Members ============

function renderMembers() {
  if (!selectedProject) return h('div')

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: 'Projects', onClick: () => { currentPage = 'projects'; selectedProject = null; loadProjects() } },
      { label: selectedProject.name, onClick: () => { currentPage = 'issues'; loadIssues(selectedProject!.id) } },
      { label: 'Members' },
    ]),

    PageHeader('Team Members', `Members of ${selectedProject.name}`),

    selectedProject.members && selectedProject.members.length > 0
      ? h('div', { class: 'space-y-3' },
          ...selectedProject.members.map(member =>
            h('div', { class: 'flex items-center gap-4 p-4 bg-base-100 rounded-lg border border-base-200' },
              h('div', { class: 'w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary' },
                member.username.charAt(0).toUpperCase()
              ),
              h('div', { class: 'flex-1' },
                h('p', { class: 'font-semibold' }, member.username),
                h('p', { class: 'text-sm text-base-content/60' },
                  [member.first_name, member.last_name].filter(Boolean).join(' ') || 'No name set'
                ),
              ),
              selectedProject!.owner && member.id === selectedProject!.owner.id
                ? Badge({ variant: 'primary' }, 'Owner')
                : Badge({ variant: 'success' }, 'Member')
            )
          )
        )
      : EmptyState('No members yet'),

    h('div', { class: 'mt-6' },
      SecondaryButton({ children: 'Back to Issues' }, () => {
        currentPage = 'issues'
        loadIssues(selectedProject!.id)
      })
    )
  )
}

// ============ View — Profile ============

function renderProfile() {
  if (!currentUser) return h('div')

  return Container(
    { class: 'py-8' },
    h('div', { class: 'mb-6' },
      h('button', {
        class: 'btn btn-ghost btn-sm mb-4',
        onClick: () => { currentPage = 'projects'; render() },
      }, '< Back to Projects')
    ),

    PageHeader('My Profile', 'Account information'),

    Card(
      {},
      'Profile Info',
      h('div', { class: 'space-y-4' },
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'Username'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.username)
        ),
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'First Name'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.first_name || 'Not set')
        ),
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'Last Name'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.last_name || 'Not set')
        ),
        h('div', { class: 'pt-4 border-t border-base-300' },
          DangerButton({ children: 'Logout', class: 'w-full' }, handleLogout)
        )
      )
    )
  )
}

// ============ Main Render ============

function render() {
  let content: Node

  switch (currentPage) {
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
    default:
      content = renderLogin()
  }

  app.innerHTML = ''
  if (currentPage !== 'login' && currentPage !== 'register') {
    app.appendChild(renderNavbar())
  }
  app.appendChild(content)
}

// ============ Init ============

checkAuth()
