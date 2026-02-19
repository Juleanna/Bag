import { h, Container, Card, Form, FormGroup, Label, Input, PrimaryButton, showToast } from '../components.ts'
import { api } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, navigate } from '../state.ts'
import { loadProjects } from './projects.ts'

async function handleRegister(formData: FormData) {
  const username = formData.get('username') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!username.trim() || !email.trim() || !password.trim()) {
    showToast(t('fillAllFields'), 'warning')
    return
  }

  if (password !== confirmPassword) {
    showToast(t('passwordsDoNotMatch'), 'warning')
    return
  }

  try {
    const auth = await api.register(username, email, password)
    if (auth.isAuthenticated && auth.user) {
      state.currentUser = auth.user
      navigate('projects')
      loadProjects()
      showToast(t('registrationSuccess'), 'success')
    }
  } catch (error: any) {
    showToast(error.message || t('registrationFailed'), 'error')
  }
}

export function renderRegister() {
  return Container(
    { class: 'py-12 flex items-center justify-center min-h-screen' },
    h('div', { class: 'w-full max-w-md' },
      h('div', { class: 'text-center mb-8' },
        h('h1', { class: 'text-4xl font-bold text-primary mb-2' }, t('appName')),
        h('p', { class: 'text-base-content/70' }, t('createYourAccount'))
      ),
      Card(
        { class: 'shadow-lg' },
        '',
        h('div', {},
          h('h2', { class: 'text-2xl font-bold mb-6 text-center' }, t('register')),
          Form(
            {
              onSubmit: (e) => {
                handleRegister(new FormData(e.currentTarget as HTMLFormElement))
              },
            },
            FormGroup({},
              Label({}, t('username')),
              Input({ name: 'username', placeholder: t('chooseUsername'), class: 'mt-2', type: 'text' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, t('email')),
              Input({ name: 'email', placeholder: t('yourEmail'), class: 'mt-2', type: 'email' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, t('password')),
              Input({ name: 'password', placeholder: t('createPassword'), class: 'mt-2', type: 'password' })
            ),
            FormGroup({ class: 'mt-4' },
              Label({}, t('confirmPassword')),
              Input({ name: 'confirmPassword', placeholder: t('repeatPassword'), class: 'mt-2', type: 'password' })
            ),
            h('div', { class: 'mt-6 flex flex-col gap-3' },
              PrimaryButton({ children: t('createAccount'), type: 'submit', class: 'w-full' }),
              h('button', {
                type: 'button',
                class: 'btn btn-ghost w-full',
                onClick: () => navigate('login'),
              }, t('alreadyHaveAccount'))
            )
          )
        )
      )
    )
  )
}
