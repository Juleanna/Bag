import { h, Container, Card, Form, FormGroup, Label, Input, PrimaryButton, showToast } from '../components.ts'
import { api } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, navigate } from '../state.ts'
import { loadProjects } from './projects.ts'

async function handleLogin(formData: FormData) {
  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username.trim() || !password.trim()) {
    showToast(t('fillAllFields'), 'warning')
    return
  }

  try {
    const auth = await api.login(username, password)
    if (auth.isAuthenticated && auth.user) {
      state.currentUser = auth.user
      navigate('projects')
      loadProjects()
      showToast(t('welcomeUser', { name: auth.user.username }), 'success')
    } else {
      showToast(auth.error || t('loginFailed'), 'error')
    }
  } catch (error: any) {
    showToast(error.message || t('invalidCredentials'), 'error')
  }
}

export function renderLogin() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, t('appName')),
        h('p', { class: 'text-base-content/70' }, t('projectAndIssueManagement'))
      ),
      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, t('login')),
          Form(
            {
              onSubmit: (e) => {
                handleLogin(new FormData(e.currentTarget as HTMLFormElement))
              },
            },
            FormGroup({},
              Label({}, t('usernameOrEmail')),
              Input({ name: 'username', placeholder: t('enterUsernameOrEmail'), class: 'mt-2', type: 'text' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, t('password')),
              Input({ name: 'password', placeholder: t('enterPassword'), class: 'mt-2', type: 'password' })
            ),
            h('div', { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ children: t('login'), type: 'submit', class: 'w-full' }),
              h('button', {
                type: 'button',
                class: 'btn btn-ghost w-full',
                onClick: () => navigate('register'),
              }, t('createAccount'))
            )
          )
        )
      )
    )
  )
}
