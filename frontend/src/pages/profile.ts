import {
  h, Container, Card, PrimaryButton, DangerButton, SecondaryButton,
  Form, FormGroup, Label, Input, showToast,
} from '../components.ts'
import { api } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, navigate, render } from '../state.ts'

async function handleLogout() {
  try {
    await api.logout()
    state.currentUser = null
    state.projects = []
    state.issues = []
    state.comments = []
    state.selectedProject = null
    state.selectedIssue = null
    showToast(t('loggedOut'), 'success')
    navigate('login')
  } catch {
    showToast(t('logoutFailed'), 'error')
  }
}

export { handleLogout }

let editing = false
let changingPassword = false

async function handleSaveProfile(formData: FormData) {
  const first_name = formData.get('first_name') as string
  const last_name = formData.get('last_name') as string
  const email = formData.get('email') as string

  try {
    const result = await api.patch<{ ok: boolean; user: typeof state.currentUser }>('/auth/profile/', {
      first_name,
      last_name,
      email,
    })
    if (result.user) {
      state.currentUser = result.user
    }
    editing = false
    showToast(t('profileUpdated'), 'success')
    render()
  } catch (error: any) {
    showToast(error.message || t('failedUpdateProfile'), 'error')
  }
}

async function handleChangePassword(formData: FormData) {
  const current_password = formData.get('current_password') as string
  const new_password = formData.get('new_password') as string
  const confirm_password = formData.get('confirm_password') as string

  if (!current_password || !new_password) {
    showToast(t('fillAllFields'), 'warning')
    return
  }
  if (new_password.length < 6) {
    showToast(t('passwordTooShort'), 'warning')
    return
  }
  if (new_password !== confirm_password) {
    showToast(t('passwordsDoNotMatch'), 'warning')
    return
  }

  try {
    await api.post<{ ok: boolean }>('/auth/password/', { current_password, new_password })
    changingPassword = false
    showToast(t('passwordChanged'), 'success')
    render()
  } catch (error: any) {
    showToast(error.message || t('failedChangePassword'), 'error')
  }
}

function getInitials(user: NonNullable<typeof state.currentUser>): string {
  const f = user.first_name?.charAt(0) || ''
  const l = user.last_name?.charAt(0) || ''
  if (f || l) return (f + l).toUpperCase()
  return user.username.charAt(0).toUpperCase()
}

function getFullName(user: NonNullable<typeof state.currentUser>): string {
  return [user.first_name, user.last_name].filter(Boolean).join(' ')
}

export function renderProfile() {
  if (!state.currentUser) return h('div')
  const user = state.currentUser
  const fullName = getFullName(user)

  return Container(
    { class: 'py-8 max-w-3xl mx-auto' },

    h('div', { class: 'mb-6' },
      h('button', {
        class: 'btn btn-ghost btn-sm',
        onClick: () => navigate('projects'),
      }, t('backToProjects'))
    ),

    // Header — avatar + name
    Card(
      {},
      '',
      h('div', { class: 'flex items-center gap-6' },
        h('div', {
          class: 'w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary shrink-0',
        }, getInitials(user)),
        h('div', { class: 'flex-1 min-w-0' },
          h('h1', { class: 'text-2xl font-bold text-base-content truncate' },
            fullName || user.username
          ),
          h('p', { class: 'text-base-content/60 mt-1' }, `@${user.username}`),
          user.email
            ? h('p', { class: 'text-base-content/50 text-sm mt-1' }, user.email)
            : null,
        ),
        !editing
          ? SecondaryButton({ children: t('editProfile') }, () => {
              editing = true
              render()
            })
          : null,
      )
    ),

    h('div', { class: 'mt-6' }),

    editing ? renderEditForm(user) : renderInfoCard(user),

    h('div', { class: 'mt-6' }),

    // Password change
    changingPassword
      ? renderPasswordForm()
      : Card({}, t('changePassword'),
          h('div', { class: 'flex items-center justify-between' },
            h('p', { class: 'text-sm text-base-content/60' }, t('enterCurrentPassword')),
            SecondaryButton({ children: t('changePassword') }, () => {
              changingPassword = true
              render()
            }),
          )
        ),

    h('div', { class: 'mt-6' }),

    // Stats
    Card(
      {},
      t('yourProjects'),
      h('div', { class: 'flex gap-4 flex-wrap' },
        statBlock(String(state.projects.length), t('projects')),
        statBlock(
          String(state.projects.reduce((sum, p) => sum + (p.issues_count ?? 0), 0)),
          t('issues')
        ),
      )
    ),

    h('div', { class: 'mt-6' }),

    // Logout
    h('div', { class: 'border border-error/20 rounded-xl p-6' },
      h('div', { class: 'flex items-center justify-between' },
        h('div', {},
          h('h3', { class: 'font-semibold text-error' }, t('logout')),
          h('p', { class: 'text-sm text-base-content/60 mt-1' }, t('accountInfo')),
        ),
        DangerButton({ children: t('logout') }, handleLogout),
      )
    ),
  )
}

function renderInfoCard(user: NonNullable<typeof state.currentUser>) {
  return Card(
    {},
    t('personalInfo'),
    h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-6' },
      infoField(t('firstName'), user.first_name || t('notSet')),
      infoField(t('lastName'), user.last_name || t('notSet')),
      infoField(t('email'), user.email || t('notSet')),
      infoField(t('username'), user.username),
    )
  )
}

function renderEditForm(user: NonNullable<typeof state.currentUser>) {
  return Card(
    {},
    t('editProfile'),
    Form(
      {
        onSubmit: (e) => {
          handleSaveProfile(new FormData(e.currentTarget as HTMLFormElement))
        },
      },
      h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-4' },
        FormGroup({},
          Label({}, t('firstName')),
          Input({ name: 'first_name', value: user.first_name || '', class: 'mt-2' })
        ),
        FormGroup({},
          Label({}, t('lastName')),
          Input({ name: 'last_name', value: user.last_name || '', class: 'mt-2' })
        ),
      ),
      FormGroup({ class: 'mt-4' },
        Label({}, t('email')),
        Input({ name: 'email', type: 'email', value: user.email || '', class: 'mt-2' })
      ),
      h('div', { class: 'flex gap-3 justify-end mt-6' },
        h('button', {
          type: 'button',
          class: 'btn btn-ghost',
          onClick: () => { editing = false; render() },
        }, t('cancel')),
        PrimaryButton({ children: t('save'), type: 'submit' }),
      )
    )
  )
}

function renderPasswordForm() {
  return Card(
    {},
    t('changePassword'),
    Form(
      {
        onSubmit: (e) => {
          handleChangePassword(new FormData(e.currentTarget as HTMLFormElement))
        },
      },
      FormGroup({},
        Label({}, t('currentPassword')),
        Input({ name: 'current_password', type: 'password', placeholder: t('enterCurrentPassword'), class: 'mt-2' })
      ),
      FormGroup({ class: 'mt-4' },
        Label({}, t('newPassword')),
        Input({ name: 'new_password', type: 'password', placeholder: t('enterNewPassword'), class: 'mt-2' })
      ),
      FormGroup({ class: 'mt-4' },
        Label({}, t('confirmNewPassword')),
        Input({ name: 'confirm_password', type: 'password', placeholder: t('enterNewPassword'), class: 'mt-2' })
      ),
      h('div', { class: 'flex gap-3 justify-end mt-6' },
        h('button', {
          type: 'button',
          class: 'btn btn-ghost',
          onClick: () => { changingPassword = false; render() },
        }, t('cancel')),
        PrimaryButton({ children: t('save'), type: 'submit' }),
      )
    )
  )
}

function infoField(label: string, value: string) {
  return h('div', {},
    h('p', { class: 'text-sm text-base-content/50 mb-1' }, label),
    h('p', { class: 'text-base font-medium text-base-content' }, value),
  )
}

function statBlock(value: string, label: string) {
  return h('div', { class: 'bg-base-200/50 rounded-lg px-6 py-4 text-center min-w-[120px]' },
    h('p', { class: 'text-2xl font-bold text-primary' }, value),
    h('p', { class: 'text-sm text-base-content/60 mt-1' }, label),
  )
}
