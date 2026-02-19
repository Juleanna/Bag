import {
  h, Container, PageHeader, Card, PrimaryButton, Button, Grid, Badge,
  Form, FormGroup, Label, Input, Textarea, EmptyState, Loader, showToast, showConfirm,
} from '../components.ts'
import { api } from '../api.ts'
import type { Project, PaginatedResponse } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render, navigate } from '../state.ts'
import { openModal, closeModal, modalWrapper } from '../helpers.ts'
import { loadIssues } from './issues.ts'

export async function loadProjects() {
  state.loading = true
  render()
  try {
    const response = await api.get<PaginatedResponse<Project>>('/projects/')
    state.projects = response.results || (response as any)
    state.loading = false
    render()
  } catch {
    state.loading = false
    showToast(t('failedLoadProjects'), 'error')
    render()
  }
}

async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name.trim()) {
    showToast(t('enterProjectName'), 'warning')
    return
  }

  try {
    await api.post('/projects/', { name, description })
    showToast(t('projectCreated'), 'success')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || t('failedCreateProject'), 'error')
  }
}

async function updateProject(projectId: number, formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  try {
    await api.patch(`/projects/${projectId}/`, { name, description })
    showToast(t('projectUpdated'), 'success')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || t('failedUpdateProject'), 'error')
  }
}

export async function deleteProject(projectId: number) {
  const confirmed = await showConfirm(t('deleteProjectConfirm'))
  if (!confirmed) return

  try {
    await api.delete(`/projects/${projectId}/`)
    showToast(t('projectDeleted'), 'success')
    state.selectedProject = null
    navigate('projects')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || t('failedDeleteProject'), 'error')
  }
}

export function renderProjectsList() {
  return Container(
    { class: 'py-8' },
    PageHeader(t('projects'), t('projectsTotal', { count: state.projects.length })),

    h('div', { class: 'mb-8' },
      PrimaryButton({ children: t('newProject') }, () => openModal('project-modal'))
    ),

    state.loading
      ? Loader()
      : state.projects.length === 0
        ? EmptyState(t('noProjectsYet'))
        : Grid(
            { columns: 3 },
            ...state.projects.map((project) =>
              Card(
                {
                  class: 'hover-lift cursor-pointer',
                  onClick: () => {
                    state.selectedProject = project
                    navigate('issues')
                    loadIssues(project.id)
                  },
                },
                project.name,
                h('div', { class: 'space-y-3' },
                  h('p', { class: 'text-sm text-base-content/70 line-clamp-2' },
                    project.description || t('noDescription')
                  ),
                  h('div', { class: 'flex justify-between items-center pt-4' },
                    Badge({ variant: 'primary' }, t('issuesCount', { count: project.issues_count ?? 0 })),
                    h('small', { class: 'text-base-content/50' },
                      `${t('owner')}: ${project.owner?.username || t('unknown')}`
                    )
                  ),
                  h('div', { class: 'flex gap-1 pt-2' },
                    h('button', {
                      class: 'btn btn-xs btn-ghost',
                      onClick: (e: Event) => {
                        e.stopPropagation()
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
                    }, t('edit')),
                    h('button', {
                      class: 'btn btn-xs btn-ghost text-error',
                      onClick: (e: Event) => {
                        e.stopPropagation()
                        deleteProject(project.id)
                      },
                    }, t('delete'))
                  )
                )
              )
            )
          ),

    modalWrapper('project-modal', t('createProject'),
      Form(
        {
          onSubmit: (e) => {
            createProject(new FormData(e.currentTarget as HTMLFormElement))
            closeModal('project-modal')
            ;(e.currentTarget as HTMLFormElement).reset()
          },
        },
        FormGroup({},
          Label({}, t('projectName')),
          Input({ name: 'name', placeholder: t('enterName'), class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, t('description')),
          Textarea({ name: 'description', placeholder: t('describeProject'), class: 'mt-2' })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: t('cancel'), class: 'btn-ghost' }, () => closeModal('project-modal')),
          PrimaryButton({ children: t('create'), type: 'submit' })
        )
      )
    ),

    modalWrapper('edit-project-modal', t('editProject'),
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
          Label({}, t('projectName')),
          Input({ name: 'name', id: 'edit-project-name', class: 'mt-2' })
        ),
        FormGroup({ class: 'mt-4' },
          Label({}, t('description')),
          Textarea({ name: 'description', id: 'edit-project-desc', class: 'mt-2' })
        ),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: t('cancel'), class: 'btn-ghost' }, () => closeModal('edit-project-modal')),
          PrimaryButton({ children: t('save'), type: 'submit' })
        )
      )
    )
  )
}
