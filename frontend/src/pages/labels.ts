import {
  h, Container, PageHeader, PrimaryButton, Form, FormGroup, Label, Input,
  EmptyState, showToast,
} from '../components.ts'
import { api } from '../api.ts'
import type { Label as ILabel, PaginatedResponse } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render } from '../state.ts'

export async function loadLabels() {
  try {
    const response = await api.get<PaginatedResponse<ILabel>>('/labels/')
    state.labels = response.results || (response as any)
  } catch {
    state.labels = []
  }
}

async function createLabel(name: string, color: string) {
  try {
    await api.post('/labels/', { name, color })
    await loadLabels()
    showToast(t('labelCreated'), 'success')
    render()
  } catch (error: any) {
    showToast(error.message || t('failedCreateLabel'), 'error')
  }
}

async function deleteLabel(labelId: number) {
  try {
    await api.delete(`/labels/${labelId}/`)
    await loadLabels()
    showToast(t('labelDeleted'), 'success')
    render()
  } catch (error: any) {
    showToast(error.message || t('failedDeleteLabel'), 'error')
  }
}

export function renderLabels() {
  return Container(
    { class: 'py-8' },
    PageHeader(t('labels'), t('manageLabels')),

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
            Label({}, t('labelName')),
            Input({ name: 'name', placeholder: t('labelPlaceholder'), class: 'mt-2' })
          ),
          FormGroup({ class: 'w-32' },
            Label({}, t('color')),
            h('input', { type: 'color', name: 'color', value: '#3b82f6', class: 'input mt-2 h-10 p-1' })
          ),
          PrimaryButton({ children: t('add'), type: 'submit', class: 'mb-0' })
        )
      )
    ),

    state.labels.length === 0
      ? EmptyState(t('noLabelsYet'))
      : h('div', { class: 'flex flex-wrap gap-3' },
          ...state.labels.map(label =>
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
