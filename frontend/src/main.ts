/**
 * Главная страница BugTracker с красивым UI
 * Использует Tailwind CSS + DaisyUI + компоненты из components.ts
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
  showToast,
} from './components'
import { api, Project, Issue } from './api'

// ============ Состояние приложения ============

let projects: Project[] = []
let issues: Issue[] = []
let currentPage = 'projects'
let selectedProject: Project | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

// ============ Загрузка данных ============

async function loadProjects() {
  try {
    projects = await api.get<Project[]>('/projects/')
    render()
  } catch (error) {
    console.error('Failed to load projects:', error)
    showToast('Ошибка загрузки проектов', 'error')
  }
}

async function loadIssues(projectId: number) {
  try {
    issues = await api.get<Issue[]>(`/issues/?project=${projectId}`)
    render()
  } catch (error) {
    console.error('Failed to load issues:', error)
    showToast('Ошибка загрузки задач', 'error')
  }
}

// ============ CRUD операции ============

async function createProject(formData: FormData) {
  const name = formData.get('name') as string
  const description = formData.get('description') as string

  if (!name.trim()) {
    showToast('Введите название проекта', 'warning')
    return
  }

  try {
    await api.post('/projects/', { name, description })
    showToast('Проект создан успешно!', 'success')
    loadProjects()
  } catch (error) {
    console.error('Failed to create project:', error)
    showToast('Ошибка создания проекта', 'error')
  }
}

async function createIssue(formData: FormData) {
  if (!selectedProject) return

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const priority = formData.get('priority') as string

  if (!title.trim()) {
    showToast('Введите название задачи', 'warning')
    return
  }

  try {
    await api.post('/issues/', {
      title,
      description,
      priority,
      project: selectedProject.id,
      reporter: 1, // TODO: Get from auth
    })
    showToast('Задача создана успешно!', 'success')
    loadIssues(selectedProject.id)
  } catch (error) {
    console.error('Failed to create issue:', error)
    showToast('Ошибка создания задачи', 'error')
  }
}

// ============ Компоненты представления ============

function renderNavbar() {
  return Navbar(
    {},
    NavbarItem({ class: 'flex-1' }, h('a', { class: 'text-xl font-bold text-primary' }, '🐛 BugTracker')),
    NavbarItem(
      { class: 'gap-2' },
      h(
        'button',
        {
          class: `btn btn-sm ${currentPage === 'projects' ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => {
            currentPage = 'projects'
            render()
          },
        },
        'Проекты'
      ),
      h(
        'button',
        {
          class: `btn btn-sm ${currentPage === 'issues' && selectedProject ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => {
            if (selectedProject) {
              currentPage = 'issues'
              render()
            }
          },
        },
        'Задачи'
      )
    )
  )
}

function renderProjectsList() {
  return Container(
    { class: 'py-8' },
    PageHeader('Проекты', 'Управляйте вашими проектами и задачами'),

    h('div', { class: 'mb-8 flex gap-4' },
      PrimaryButton({ children: '➕ Новый проект' }, () => {
        const modal = document.getElementById('project-modal')
        if (modal) modal.classList.remove('hidden')
      })
    ),

    projects.length === 0
      ? EmptyState('Нет проектов. Создайте первый проект!')
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
              h(
                'div',
                { class: 'space-y-3' },
                h('p', { class: 'text-sm text-base-content/70' }, project.description),
                h(
                  'div',
                  { class: 'flex justify-between items-center pt-4' },
                  Badge({ variant: 'primary' }, `${3} задач`),
                  h('small', { class: 'text-base-content/50' }, 'Нажмите для открытия')
                )
              )
            )
          )
        ),

    // Модальное окно для создания проекта
    h(
      'div',
      {
        id: 'project-modal',
        class: 'modal hidden',
        onClick: (e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            const modal = document.getElementById('project-modal')
            if (modal) modal.classList.add('hidden')
          }
        },
      },
      h(
        'div',
        { class: 'modal-box' },
        h('h3', { class: 'font-bold text-lg mb-4' }, 'Создать новый проект'),

        Form(
          {
            onSubmit: (e) => {
              const formData = new FormData(e.currentTarget as HTMLFormElement)
              createProject(formData)
              const modal = document.getElementById('project-modal')
              if (modal) modal.classList.add('hidden')
              ;(e.currentTarget as HTMLFormElement).reset()
            },
          },
          FormGroup(
            {},
            Label({}, 'Название проекта'),
            Input({ name: 'name', placeholder: 'Введите название', class: 'mt-2' })
          ),

          FormGroup(
            { class: 'mt-4' },
            Label({}, 'Описание'),
            Textarea({ name: 'description', placeholder: 'Опишите проект', class: 'mt-2' })
          ),

          h(
            'div',
            { class: 'modal-action gap-2 mt-6' },
            Button(
              {
                children: 'Отмена',
                class: 'btn-ghost',
                onClick: () => {
                  const modal = document.getElementById('project-modal')
                  if (modal) modal.classList.add('hidden')
                },
              }
            ),
            PrimaryButton({ children: 'Создать', type: 'submit' })
          )
        )
      )
    )
  )
}

function renderIssuesList() {
  if (!selectedProject) return h('div')

  return Container(
    { class: 'py-8' },
    h(
      'div',
      { class: 'mb-6 flex items-center justify-between' },
      h(
        'div',
        {},
        h(
          'button',
          {
            class: 'btn btn-ghost btn-sm mb-4',
            onClick: () => {
              currentPage = 'projects'
              selectedProject = null
              render()
            },
          },
          '← Назад к проектам'
        ),
        PageHeader(
          selectedProject.name,
          `${issues.length} задач`
        )
      )
    ),

    h('div', { class: 'mb-8 flex gap-4' },
      PrimaryButton({ children: '➕ Новая задача' }, () => {
        const modal = document.getElementById('issue-modal')
        if (modal) modal.classList.remove('hidden')
      })
    ),

    issues.length === 0
      ? EmptyState('Нет задач. Создайте первую задачу!')
      : h(
          'div',
          { class: 'space-y-4' },
          ...issues.map((issue) =>
            Card(
              { class: 'hover-lift' },
              issue.title,
              h(
                'div',
                { class: 'space-y-3' },
                h('p', { class: 'text-sm text-base-content/70' }, issue.description || 'Без описания'),
                h(
                  'div',
                  { class: 'flex flex-wrap gap-2 pt-4' },
                  StatusBadge(issue.status),
                  PriorityBadge(issue.priority)
                )
              )
            )
          )
        ),

    // Модальное окно для создания задачи
    h(
      'div',
      {
        id: 'issue-modal',
        class: 'modal hidden',
        onClick: (e: MouseEvent) => {
          if (e.target === e.currentTarget) {
            const modal = document.getElementById('issue-modal')
            if (modal) modal.classList.add('hidden')
          }
        },
      },
      h(
        'div',
        { class: 'modal-box' },
        h('h3', { class: 'font-bold text-lg mb-4' }, 'Создать новую задачу'),

        Form(
          {
            onSubmit: (e) => {
              const formData = new FormData(e.currentTarget as HTMLFormElement)
              createIssue(formData)
              const modal = document.getElementById('issue-modal')
              if (modal) modal.classList.add('hidden')
              ;(e.currentTarget as HTMLFormElement).reset()
            },
          },
          FormGroup(
            {},
            Label({}, 'Название задачи'),
            Input({ name: 'title', placeholder: 'Введите название', class: 'mt-2' })
          ),

          FormGroup(
            { class: 'mt-4' },
            Label({}, 'Описание'),
            Textarea({ name: 'description', placeholder: 'Опишите задачу', class: 'mt-2' })
          ),

          FormGroup(
            { class: 'mt-4' },
            Label({}, 'Приоритет'),
            Select({
              name: 'priority',
              options: [
                { value: 'low', label: 'Низкий' },
                { value: 'medium', label: 'Средний' },
                { value: 'high', label: 'Высокий' },
              ],
              class: 'mt-2',
            })
          ),

          h(
            'div',
            { class: 'modal-action gap-2 mt-6' },
            Button(
              {
                children: 'Отмена',
                class: 'btn-ghost',
                onClick: () => {
                  const modal = document.getElementById('issue-modal')
                  if (modal) modal.classList.add('hidden')
                },
              }
            ),
            PrimaryButton({ children: 'Создать', type: 'submit' })
          )
        )
      )
    )
  )
}

// ============ Главный рендер ============

function render() {
  const content = currentPage === 'projects' ? renderProjectsList() : renderIssuesList()

  app.innerHTML = ''
  app.appendChild(renderNavbar())
  app.appendChild(content)
}

// ============ Инициализация ============

loadProjects()
