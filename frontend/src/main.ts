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
import { api } from './api.ts'
import type { Project, Issue, User } from './api.ts'

// ============ Состояние приложения ============

let projects: Project[] = []
let issues: Issue[] = []
let currentUser: User | null = null
let currentPage = 'login' // Начинаем со страницы входа
let selectedProject: Project | null = null

const app = document.querySelector<HTMLDivElement>('#app')!

// ============ Загрузка данных ============

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
  } catch (error) {
    console.error('Failed to check auth:', error)
    currentPage = 'login'
    render()
  }
}

async function handleLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username.trim() || !password.trim()) {
    showToast('Заполните все поля', 'warning')
    return
  }

  try {
    const auth = await api.login(username, password)
    if (auth.isAuthenticated && auth.user) {
      currentUser = auth.user
      currentPage = 'projects'
      loadProjects()
      showToast(`Добро пожаловать, ${auth.user.username}!`, 'success')
    } else {
      showToast('Ошибка входа', 'error')
    }
  } catch (error) {
    console.error('Login failed:', error)
    showToast('Неверный логин или пароль', 'error')
  }
}

async function handleRegister(formData: FormData) {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!username.trim() || !email.trim() || !password.trim()) {
    showToast('Заполните все поля', 'warning')
    return
  }

  if (password !== confirmPassword) {
    showToast('Пароли не совпадают', 'warning')
    return
  }

  try {
    await api.register(username, email, password)
    showToast('Регистрация успешна! Войдите в аккаунт', 'success')
    currentPage = 'login'
    render()
  } catch (error) {
    console.error('Register failed:', error)
    showToast('Ошибка регистрации. Возможно, пользователь уже существует', 'error')
  }
}

async function handleLogout() {
  try {
    await api.logout()
    currentUser = null
    currentPage = 'login'
    showToast('Вы вышли из аккаунта', 'success')
    render()
  } catch (error) {
    console.error('Logout failed:', error)
    showToast('Ошибка выхода', 'error')
  }
}

async function loadProjects() {
  try {
    const response = await api.get<any>('/projects/')
    projects = response.results || response
    render()
  } catch (error) {
    console.error('Failed to load projects:', error)
    showToast('Ошибка загрузки проектов', 'error')
  }
}

async function loadIssues(projectId: number) {
  try {
    const response = await api.get<any>(`/issues/?project=${projectId}`)
    issues = response.results || response
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
      currentUser && h('span', { class: 'text-sm text-base-content/70' }, `👤 ${currentUser.username}`),
      currentUser && h(
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
      currentUser && h(
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
      ),
      currentUser && h(
        'button',
        {
          class: `btn btn-sm ${currentPage === 'profile' ? 'btn-primary' : 'btn-ghost'}`,
          onClick: () => {
            currentPage = 'profile'
            render()
          },
        },
        'Профиль'
      ),
      currentUser && h(
        'button',
        {
          class: 'btn btn-sm btn-ghost',
          onClick: handleLogout,
        },
        'Выход'
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
                  Badge({ variant: 'primary', children: `${3} задач` }),
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

function renderLogin() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, '🐛 BugTracker'),
        h('p', { class: 'text-base-content/70' }, 'Управляйте проектами и задачами')
      ),

      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, 'Вход'),

          Form(
            {
              onSubmit: (e) => {
                const formData = new FormData(e.currentTarget as HTMLFormElement)
                handleLogin(formData)
                ;(e.currentTarget as HTMLFormElement).reset()
              },
            },
            FormGroup(
              {},
              Label({}, 'Логин или почта'),
              Input({ 
                name: 'username', 
                placeholder: 'Введите логин или почту', 
                class: 'mt-2',
                type: 'text'
              })
            ),

            FormGroup(
              { class: 'mt-4' },
              Label({}, 'Пароль'),
              Input({ 
                name: 'password', 
                placeholder: 'Введите пароль', 
                class: 'mt-2',
                type: 'password'
              })
            ),

            h(
              'div',
              { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ 
                children: 'Войти', 
                type: 'submit',
                class: 'w-full'
              }),
              h(
                'button',
                {
                  type: 'button',
                  class: 'btn btn-ghost w-full',
                  onClick: () => {
                    currentPage = 'register'
                    render()
                  }
                },
                'Создать аккаунт'
              )
            )
          )
        )
      )
    )
  )
}

function renderRegister() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, '🐛 BugTracker'),
        h('p', { class: 'text-base-content/70' }, 'Создайте аккаунт для начала')
      ),

      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, 'Регистрация'),

          Form(
            {
              onSubmit: (e) => {
                const formData = new FormData(e.currentTarget as HTMLFormElement)
                handleRegister(formData)
                ;(e.currentTarget as HTMLFormElement).reset()
              },
            },
            FormGroup(
              {},
              Label({}, 'Логин'),
              Input({ 
                name: 'username', 
                placeholder: 'Придумайте логин', 
                class: 'mt-2',
                type: 'text'
              })
            ),

            FormGroup(
              { class: 'mt-4' },
              Label({}, 'Почта'),
              Input({ 
                name: 'email', 
                placeholder: 'Ваша почта', 
                class: 'mt-2',
                type: 'email'
              })
            ),

            FormGroup(
              { class: 'mt-4' },
              Label({}, 'Пароль'),
              Input({ 
                name: 'password', 
                placeholder: 'Придумайте пароль', 
                class: 'mt-2',
                type: 'password'
              })
            ),

            FormGroup(
              { class: 'mt-4' },
              Label({}, 'Повторите пароль'),
              Input({ 
                name: 'confirmPassword', 
                placeholder: 'Повторите пароль', 
                class: 'mt-2',
                type: 'password'
              })
            ),

            h(
              'div',
              { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ 
                children: 'Создать аккаунт', 
                type: 'submit',
                class: 'w-full'
              }),
              h(
                'button',
                {
                  type: 'button',
                  class: 'btn btn-ghost w-full',
                  onClick: () => {
                    currentPage = 'login'
                    render()
                  }
                },
                'Уже есть аккаунт? Войти'
              )
            )
          )
        )
      )
    )
  )
}

function renderProfile() {
  if (!currentUser) return h('div')

  return Container(
    { class: 'py-8' },
    h(
      'div',
      { class: 'mb-6' },
      h(
        'button',
        {
          class: 'btn btn-ghost btn-sm mb-4',
          onClick: () => {
            currentPage = 'projects'
            render()
          },
        },
        '← Назад к проектам'
      )
    ),
    
    PageHeader('Мой профиль', 'Информация о вашем аккаунте'),

    Card(
      {},
      'Информация профиля',
      h('div', { class: 'space-y-4' },
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'Логин'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.username)
        ),
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'Имя'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.first_name || 'Не указано')
        ),
        h('div', {},
          h('label', { class: 'text-sm text-base-content/70' }, 'Фамилия'),
          h('p', { class: 'text-lg font-semibold mt-1' }, currentUser.last_name || 'Не указано')
        ),
        h('div', { class: 'pt-4 border-t border-base-300' },
          h(
            'button',
            {
              class: 'btn btn-error btn-outline w-full',
              onClick: handleLogout,
            },
            '🚪 Выход из аккаунта'
          )
        )
      )
    )
  )
}

function render() {
  const content = 
    currentPage === 'login' ? renderLogin() :
    currentPage === 'register' ? renderRegister() :
    currentPage === 'profile' ? renderProfile() :
    currentPage === 'projects' ? renderProjectsList() : 
    renderIssuesList()

  app.innerHTML = ''
  if (currentPage !== 'login' && currentPage !== 'register') {
    app.appendChild(renderNavbar())
  }
  app.appendChild(content)
}

// ============ Инициализация ============

checkAuth()
