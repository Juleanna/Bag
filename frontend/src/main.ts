import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

// Единый набор классов для полей ввода
const baseField = 'w-full rounded-lg border-base-300 bg-base-100 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60'

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  ...children: (Node | string | null | undefined)[]
) {
  const el = document.createElement(tag)
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') el.className = v
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.substring(2).toLowerCase(), v)
    else el.setAttribute(k, String(v))
  }
  for (const c of children) {
    if (c == null) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
  return el
}

function card(title: string, body: Node) {
  return h(
    'div',
    { class: 'card bg-base-100 shadow-md border border-base-200' },
    h('div', { class: 'card-body' }, h('h2', { class: 'card-title' }, title), body)
  )
}

// Safe children replace helper (на случай отсутствия replaceChildren)
function setChildren(el: Element | null, ...children: (Node | string)[]) {
  if (!el) return
  const nodes = children.map((c) => (c instanceof Node ? c : document.createTextNode(String(c))))
  // @ts-ignore
  if (typeof (el as any).replaceChildren === 'function') (el as any).replaceChildren(...nodes)
  else {
    while (el.firstChild) el.removeChild(el.firstChild)
    for (const n of nodes) el.appendChild(n)
  }
}

// Tooltip helper (DaisyUI)
function tooltip(el: HTMLElement, tip: string) {
  const wrap = document.createElement('div')
  wrap.className = 'tooltip'
  ;(wrap as any).dataset.tip = tip
  wrap.appendChild(el)
  return wrap
}

// Toast helper (DaisyUI) — глобальная функция чтобы исключить коллизии имён
;(window as any).__bt_toast = function (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success', timeout = 2500) {
  let container = document.querySelector('.toast.toast-end') as HTMLElement | null
  if (!container) {
    container = document.createElement('div')
    container.className = 'toast toast-end'
    document.body.appendChild(container)
  }
  const alert = document.createElement('div')
  alert.className = `alert alert-${type}`
  const span = document.createElement('span')
  span.textContent = message
  alert.appendChild(span)
  container.appendChild(alert)
  setTimeout(() => alert.remove(), timeout)
}

// Modal helpers (DaisyUI)
async function modalConfirm(message: string, title = 'Подтверждение', confirmText = 'Да', cancelText = 'Отмена'): Promise<boolean> {
  return new Promise((resolve) => {
    const dlg = document.createElement('dialog')
    dlg.className = 'modal'
    dlg.innerHTML = `
      <div class="modal-box">
        <h3 class="font-bold text-lg">${title}</h3>
        <p class="py-4">${message}</p>
        <div class="modal-action">
          <button class="btn btn-ghost">${cancelText}</button>
          <button class="btn btn-primary">${confirmText}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    `
    document.body.appendChild(dlg)
    const [cancelBtn, okBtn] = dlg.querySelectorAll('.modal-action .btn') as unknown as [HTMLButtonElement, HTMLButtonElement]
    cancelBtn.addEventListener('click', () => { (dlg as any).close(); dlg.remove(); resolve(false) })
    okBtn.addEventListener('click', () => { (dlg as any).close(); dlg.remove(); resolve(true) })
    ;(dlg as any).showModal()
  })
}

async function modalAlert(message: string, title = 'Сообщение', okText = 'Ок') {
  return new Promise<void>((resolve) => {
    const dlg = document.createElement('dialog')
    dlg.className = 'modal'
    dlg.innerHTML = `
      <div class="modal-box">
        <h3 class="font-bold text-lg">${title}</h3>
        <p class="py-4">${message}</p>
        <div class="modal-action">
          <button class="btn btn-primary">${okText}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    `
    document.body.appendChild(dlg)
    const okBtn = dlg.querySelector('.modal-action .btn') as HTMLButtonElement
    okBtn.addEventListener('click', () => { (dlg as any).close(); dlg.remove(); resolve() })
    ;(dlg as any).showModal()
  })
}

function getCSRFCookie(name = 'csrftoken') {
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match.pop()!) : ''
}

async function fetchJSON<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.method && options.method !== 'GET' ? { 'X-CSRFToken': getCSRFCookie() } : {}),
    },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
}

function ProjectList(projects: any[]) {
  const list = h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' })
  for (const p of projects) {
    const body = h(
      'div',
      { class: 'space-y-2' },
      h('p', { class: 'text-sm opacity-70' }, p.description || 'Без описания'),
      h(
        'div',
        { class: 'card-actions mt-1' },
        h('span', {
          class: 'inline-flex items-center whitespace-nowrap badge badge-primary rounded-full px-4 py-2 text-sm md:text-base shadow',
        }, `Задач • ${p.issues_count ?? '—'}`)
      )
    )

    list.append(card(p.name, body))
  }
  return list
}

function statusColor(status: string) {
  switch (status) {
    case 'open':
      return 'bg-warning/10 border-warning/40 ring-1 ring-warning/30'
    case 'in_progress':
      // Сделаем заметно более «синий» и более светлый
      return 'bg-info/5 border-info/25 ring-1 ring-info/20'
    case 'done':
      // Гораздо более насыщённый зелёный, чтобы отличался от in_progress
      return 'bg-success/30 border-success/70 ring-2 ring-success/60'
    case 'cancelled':
      return 'bg-error/10 border-error/40 ring-1 ring-error/30'
    default:
      return 'bg-base-100 border-base-300'
  }
}

function statusBadge(status: string) {
  const m: Record<string, string> = {
    open: 'badge-warning',
    in_progress: 'badge-info',
    done: 'badge-success',
    cancelled: 'badge-error',
  }
  return `badge ${m[status] ?? 'badge-ghost'}`
}

function svgIcon(type: 'status' | 'priority' | 'action', value: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('width', '16')
  svg.setAttribute('height', '16')
  svg.classList.add('mr-1')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '1.5')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')

  function path(d: string) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    p.setAttribute('d', d)
    return p
  }
  function circle(cx: number, cy: number, r: number) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    c.setAttribute('cx', String(cx))
    c.setAttribute('cy', String(cy))
    c.setAttribute('r', String(r))
    return c
  }
  function poly(points: string) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    g.setAttribute('points', points)
    return g
  }

  if (type === 'status') {
    switch (value) {
      case 'open': // clock
        svg.appendChild(circle(8, 8, 6.5))
        svg.appendChild(path('M8 4.5 V8 L10.5 9.5'))
        break
      case 'in_progress': // refresh cw
        svg.appendChild(path('M12.5 8a4.5 4.5 0 1 1-2.2-3.9'))
        svg.appendChild(path('M12.5 4.1v3.2H9.3'))
        break
      case 'done': // check-circle
        svg.appendChild(circle(8, 8, 6.5))
        svg.appendChild(path('M5 8.5l2 2 4-4'))
        break
      case 'cancelled': // x-circle
        svg.appendChild(circle(8, 8, 6.5))
        svg.appendChild(path('M5.2 5.2l5.6 5.6M10.8 5.2L5.2 10.8'))
        break
      default:
        svg.appendChild(circle(8, 8, 2))
    }
  } else if (type === 'priority') {
    switch (value) {
      case 'low': // arrow-down-circle
        svg.appendChild(circle(8, 8, 6.5))
        svg.appendChild(path('M8 5v6M6.5 9.5L8 11l1.5-1.5'))
        break
      case 'medium': // minus-circle
        svg.appendChild(circle(8, 8, 6.5))
        svg.appendChild(path('M5 8h6'))
        break
      case 'high': // alert-triangle
        svg.appendChild(poly('8,2.5 14,13.5 2,13.5'))
        svg.appendChild(path('M8 6v4'))
        svg.appendChild(path('M8 12.5h0'))
        break
      default:
        svg.appendChild(circle(8, 8, 2))
    }
  } else {
    // action icons (edit/delete)
    switch (value) {
      case 'edit': // pencil
        svg.appendChild(path('M3 12.5V14h1.5l7.8-7.8-1.5-1.5L3 12.5z'))
        svg.appendChild(path('M10.2 3.2l1.6 1.6'))
        break
      case 'trash': // trash bin
        svg.appendChild(path('M4 5h8'))
        svg.appendChild(path('M6 3.8h4'))
        svg.appendChild(path('M5 5.5v7.2h6V5.5'))
        svg.appendChild(path('M7.5 7v5'))
        svg.appendChild(path('M8.5 7v5'))
        break
      default:
        svg.appendChild(circle(8, 8, 2))
    }
  }
  return svg
}

function IssueItem(
  issue: any,
  projects: any[],
  onUpdated: (updated: any, previousProjectId: number) => void,
  onDeleted: (deleted: any) => void,
) {
  const container = h(
    'div',
    { class: `relative border rounded-lg p-3 pb-12 flex items-start gap-3 ${statusColor(issue.status)}` },
    h('div', { class: 'flex-1 space-y-2' },
      h('div', { class: 'font-medium' }, issue.title),
      h('div', { class: 'text-sm opacity-70' }, issue.description || '—')
    ),
    h('div', { class: 'flex flex-col items-end gap-1' },
      tooltip(h('span', { class: statusBadge(issue.status) }, svgIcon('status', issue.status), issue.status_display ?? issue.status), 'Статус'),
      tooltip(h('span', { class: priorityBadge(issue.priority) }, svgIcon('priority', issue.priority), issue.priority_display ?? issue.priority), 'Приоритет')
    )
  )
  // селект изменения статуса
  const select = h('select', { class: 'select select-bordered select-sm mt-1' }) as HTMLSelectElement
  // Примечание: в native <select> нельзя безопасно вставлять SVG, поэтому
  // оставляем чистый текст без эмодзи — иконки показываются на бейджах.
  select.append(
    h('option', { value: 'open' }, 'В работе'),
    h('option', { value: 'in_progress' }, 'В процессе'),
    h('option', { value: 'done' }, 'Готово'),
    h('option', { value: 'cancelled' }, 'Отменено'),
  )
  select.value = issue.status
  select.addEventListener('change', async () => {
    try {
      try { await fetchJSON('/api/auth/csrf/') } catch {}
      const updated = await fetchJSON(`/api/issues/${issue.id}/`, { method: 'PATCH', body: JSON.stringify({ status: select.value }) })
      issue.status = updated.status
      issue.status_display = updated.status_display
      container.className = `border rounded-lg p-3 flex items-start gap-3 ${statusColor(issue.status)}`
      const badge = container.querySelector('span.badge') as HTMLSpanElement
      if (badge) {
        badge.className = statusBadge(issue.status)setChildren(svgIcon('status', issue.status), document.createTextNode(issue.status_display ?? issue.status))
      }
      (window as any).__bt_toast('Статус обновлён', 'success')
    } catch (e: any) {
      console.error(e)
      alert('Не удалось обновить статус: ' + (e?.message || e))
    }
  })
  ;(container.querySelector('.flex-1') as HTMLElement).append(select)
  // селект изменения приоритета
  const psel = h('select', { class: 'select select-bordered select-sm mt-1 ml-2' }) as HTMLSelectElement
  psel.append(
    h('option', { value: 'low' }, 'Низкий'),
    h('option', { value: 'medium' }, 'Средний'),
    h('option', { value: 'high' }, 'Высокий'),
  )
  psel.value = issue.priority
  psel.addEventListener('change', async () => {
    try {
      try { await fetchJSON('/api/auth/csrf/') } catch {}
      const updated = await fetchJSON(`/api/issues/${issue.id}/`, { method: 'PATCH', body: JSON.stringify({ priority: psel.value }) })
      issue.priority = updated.priority
      issue.priority_display = updated.priority_display
      const pb = container.querySelectorAll('span.badge')[1] as HTMLSpanElement
      if (pb) {
        pb.className = priorityBadge(issue.priority)setChildren(svgIcon('priority', issue.priority), document.createTextNode(issue.priority_display ?? issue.priority))
      }
      (window as any).__bt_toast('Приоритет обновлён', 'success')
    } catch (e: any) {
      console.error(e)
      alert('Не удалось обновить приоритет: ' + (e?.message || e))
    }
  })
  ;(container.querySelector('.flex-1') as HTMLElement).append(psel)

  // Плавающие кнопки действий (правый нижний угол)
  const actions = h('div', { class: 'absolute right-3 bottom-3 z-10 flex gap-2' })
  const editBtn = h('button', { class: 'btn btn-circle btn-sm btn-ghost hover:bg-base-300/60', 'aria-label': 'Изменить' }) as HTMLButtonElement
  editBtn.append(svgIcon('action', 'edit'))
  const delBtn = h('button', { class: 'btn btn-circle btn-sm btn-error text-error-content', 'aria-label': 'Удалить' }) as HTMLButtonElement
  delBtn.append(svgIcon('action', 'trash'))
  actions.append(tooltip(editBtn, 'Изменить'), tooltip(delBtn, 'Удалить'))
  container.append(actions)

  // Форма редактирования (скрытая)
  const editArea = h('div', { class: 'mt-3 hidden space-y-2' })
  const eProject = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  for (const p of projects) eProject.append(h('option', { value: String(p.id) }, p.name))
  const eTitle = h('input', { class: `input input-bordered ${baseField}`, placeholder: 'Заголовок' }) as HTMLInputElement
  const eDesc = h('textarea', { class: `textarea textarea-bordered ${baseField}`, placeholder: 'Описание' }) as HTMLTextAreaElement
  const eStatus = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  eStatus.append(
    h('option', { value: 'open' }, 'В работе'),
    h('option', { value: 'in_progress' }, 'В процессе'),
    h('option', { value: 'done' }, 'Готово'),
    h('option', { value: 'cancelled' }, 'Отменено'),
  )
  const ePriority = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  ePriority.append(
    h('option', { value: 'low' }, 'Низкий'),
    h('option', { value: 'medium' }, 'Средний'),
    h('option', { value: 'high' }, 'Высокий'),
  )
  const saveBtn = h('button', { class: 'btn btn-primary' }, 'Сохранить') as HTMLButtonElement
  const cancelBtn = h('button', { class: 'btn' }, 'Отмена') as HTMLButtonElement
  editArea.append(
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Проект'), eProject),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Заголовок'), eTitle),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Описание'), eDesc),
    h('div', { class: 'grid grid-cols-2 gap-2' },
      h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Статус'), eStatus),
      h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Приоритет'), ePriority),
    ),
    h('div', { class: 'flex gap-2' }, saveBtn, cancelBtn),
  )
  ;(container.querySelector('.flex-1') as HTMLElement).append(editArea)

  function openEdit() {
    eProject.value = String(issue.project)
    eTitle.value = issue.title || ''
    eDesc.value = issue.description || ''
    eStatus.value = issue.status
    ePriority.value = issue.priority
    editArea.classList.remove('hidden')
  }
  function closeEdit() {
    editArea.classList.add('hidden')
  }
  editBtn.addEventListener('click', openEdit)
  cancelBtn.addEventListener('click', closeEdit)

  saveBtn.addEventListener('click', async () => {
    try {
      const payload = {
        project: Number(eProject.value),
        title: eTitle.value.trim(),
        description: eDesc.value.trim(),
        status: eStatus.value,
        priority: ePriority.value,
      }
      try { await fetchJSON('/api/auth/csrf/') } catch {}
      const updated = await fetchJSON(`/api/issues/${issue.id}/`, { method: 'PATCH', body: JSON.stringify(payload) })
      closeEdit()
      onUpdated(updated, issue.project)
      (window as any).__bt_toast('Изменения сохранены', 'success')
    } catch (e: any) {
      alert('Не удалось сохранить изменения: ' + (e?.message || e))
    }
  })

  delBtn.addEventListener('click', async () => {
    if (!(await modalConfirm('Удалить задачу?', 'Удаление'))) return
    try {
      try { await fetchJSON('/api/auth/csrf/') } catch {}
      await fetchJSON(`/api/issues/${issue.id}/`, { method: 'DELETE' })
      onDeleted(issue)
    } catch (e: any) {
      modalAlert('Не удалось удалить задачу: ' + (e?.message || e), 'Ошибка')
    }
  })
  return container
}

function IssueList(issues: any[], projects: any[], onUpdated: (u: any, prevProjectId: number) => void, onDeleted: (i: any) => void) {
  const list = h('div', { class: 'space-y-2' })
  for (const i of issues) list.append(IssueItem(i, projects, onUpdated, onDeleted))
  return list
}

function priorityBadge(priority: string) {
  const m: Record<string, string> = {
    low: 'badge-ghost',
    medium: 'badge-warning',
    high: 'badge-error',
  }
  return `badge ${m[priority] ?? 'badge-ghost'}`
}

// Новый вариант формы создания задачи (для модального окна)
function NewIssueForm(projects: any[], onCreated: (issue: any, projectId: number) => void) {
  const title = h('input', { class: `input input-bordered ${baseField}`, placeholder: 'Заголовок', required: true }) as HTMLInputElement
  const desc = h('textarea', { class: `textarea textarea-bordered ${baseField}`, placeholder: 'Описание' }) as HTMLTextAreaElement
  const project = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  const status = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  const priority = h('select', { class: `select select-bordered ${baseField}` }) as HTMLSelectElement
  for (const p of projects) project.append(h('option', { value: String(p.id) }, p.name))
  status.append(
    h('option', { value: 'open' }, 'В работе'),
    h('option', { value: 'in_progress' }, 'В процессе'),
    h('option', { value: 'done' }, 'Готово'),
    h('option', { value: 'cancelled' }, 'Отменено'),
  )
  priority.append(
    h('option', { value: 'low' }, 'Низкий'),
    h('option', { value: 'medium' }, 'Средний'),
    h('option', { value: 'high' }, 'Высокий'),
  )
  const submit = h('button', { class: 'btn btn-primary mt-3', type: 'button' }, 'Создать') as HTMLButtonElement

  const form = h('div', { class: 'space-y-2' },
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Проект'), project),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Заголовок'), title),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Описание'), desc),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Статус'), status),
    h('label', { class: 'form-control' }, h('div', { class: 'label' }, 'Приоритет'), priority),
    submit
  )

  submit.addEventListener('click', async () => {
    if (!title.value.trim()) return
    try {
      try { await fetchJSON('/api/auth/csrf/') } catch {}
      submit.disabled = true
      const payload = {
        project: Number(project.value),
        title: title.value.trim(),
        description: desc.value.trim(),
        status: status.value,
        priority: priority.value,
      }
      const created = await fetchJSON<any>('/api/issues/', { method: 'POST', body: JSON.stringify(payload) })
      title.value = ''
      desc.value = ''
      onCreated(created, Number(project.value))
      (window as any).__bt_toast('Задача создана', 'success')
    } catch (e) {
      const msg = (e as any)?.message || 'Ошибка при создании задачи.'
      modalAlert(msg, 'Ошибка')
    }
    finally { submit.disabled = false }
  })

  return form
}

async function renderApp() {
  app.className = 'min-h-screen bg-base-200'

  const container = h('div', { class: 'container py-6 space-y-6' })
  const adminUrl = `${location.protocol}//${location.hostname}:8000/admin/`
  // Тема из localStorage
  const savedTheme = localStorage.getItem('theme') || 'corporate'
  document.documentElement.setAttribute('data-theme', savedTheme)

  const header = h(
    'div',
    { class: 'navbar bg-base-100 rounded-xl shadow' },
    h('div', { class: 'flex-1' }, h('a', { class: 'btn btn-ghost text-xl' }, 'BugTracker')),
    h('div', { class: 'flex-none space-x-2' },
      tooltip(h('a', { class: 'btn btn-outline btn-primary rounded-xl shadow-sm', href: adminUrl, target: '_blank' }, 'Admin'), 'Админка'),
      tooltip(h('button', { class: 'btn rounded-xl shadow-sm', id: 'themeToggle' }, 'Тема'), 'Переключить тему'),
      tooltip(h('button', { class: 'btn btn-primary rounded-xl shadow-sm', id: 'logoutBtn' }, 'Выйти'), 'Завершить сессию')
    )
  )
  header.querySelector<HTMLButtonElement>('#themeToggle')!.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'corporate'
    const next = current === 'corporate' ? 'business' : 'corporate'
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
    (window as any).__bt_toast(`Тема: ${next}`, 'info')
  })
  header.querySelector<HTMLButtonElement>('#logoutBtn')!.addEventListener('click', async () => {
    try {
      await fetchJSON('/api/auth/csrf/')
      await fetchJSON('/api/auth/logout/', { method: 'POST' })
      (window as any).__bt_toast('Вы вышли из системы', 'info')
    } catch (e) {
      console.warn('Logout error:', e)
      modalAlert('Не удалось выйти из системы', 'Ошибка')
    }
    await renderLogin()
  })

  const content = h('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6 items-start' })
  const projectsCol = h('div', { class: 'lg:col-span-1 space-y-4' })
  const issuesCol = h('div', { class: 'lg:col-span-2 space-y-4' })

  const [projects, issues] = await Promise.all([
    fetchJSON<any[]>('/api/projects/'),
    fetchJSON<any[]>('/api/issues/'),
  ])

  const projectListCard = card('Проекты', ProjectList(projects))
  const issuesListCard = card('Задачи', document.createElement('div'))
  // Заготовки для панелей (переопределяются ниже)
  let modeBar: HTMLElement = document.createElement('div')
  let filtersBar: HTMLElement = document.createElement('div')
  let currentMode: 'list' | 'board' = 'list'
  const renderListInside = () => {
    const filtered = applyFilters()
    issuesListCard.querySelector('.card-body')setChildren(
      h('h2', { class: 'card-title' }, 'Задачи'),
      modeBar,
      filtersBar,
      IssueList(filtered, projects, onUpdated, onDeleted)
    )
  }
  const renderBoardInside = () => {
    issuesListCard.querySelector('.card-body')setChildren(
      h('h2', { class: 'card-title' }, 'Задачи'),
      modeBar,
      filtersBar,
      boardHolder
    )
    renderBoard(applyFilters())
  }
  const rerenderIssues = () => {
    if (currentMode === 'list') renderListInside()
    else renderBoardInside()
  }
  const onUpdated = (updated: any, prevProjectId: number) => {
    const idx = issues.findIndex((x: any) => x.id === updated.id)
    if (idx >= 0) issues[idx] = updated
    // если проект изменился — обновим счётчики
    if (prevProjectId !== updated.project) {
      const prev = projects.find((p: any) => p.id === prevProjectId)
      if (prev && typeof prev.issues_count === 'number') prev.issues_count = Math.max(0, prev.issues_count - 1)
      const next = projects.find((p: any) => p.id === updated.project)
      if (next) next.issues_count = (next.issues_count ?? 0) + 1
      projectListCard.querySelector('.card-body')setChildren(
        h('h2', { class: 'card-title' }, 'Проекты'),
        ProjectList(projects)
      )
    }
    rerenderIssues()
  }
  const onDeleted = (removed: any) => {
    const idx = issues.findIndex((x: any) => x.id === removed.id)
    if (idx >= 0) issues.splice(idx, 1)
    const proj = projects.find((p: any) => p.id === removed.project)
    if (proj && typeof proj.issues_count === 'number') proj.issues_count = Math.max(0, proj.issues_count - 1)
    projectListCard.querySelector('.card-body')setChildren(
      h('h2', { class: 'card-title' }, 'Проекты'),
      ProjectList(projects)
    )
    rerenderIssues()
    (window as any).__bt_toast('Задача удалена', 'success')
  }
  // отрисовка выполнится после инициализации панелей (см. ниже)

  // Открыть модальное окно создания задачи
  function openCreateIssue() {
    const box = document.createElement('div')
    box.className = 'space-y-2'
    const form = NewIssueForm(projects, (i, projId) => {
      issues.unshift(i)
      rerenderIssues()
      const found = projects.find((p) => p.id === projId)
      if (found) found.issues_count = (found.issues_count ?? 0) + 1
      projectListCard.querySelector('.card-body')setChildren(
        h('h2', { class: 'card-title' }, 'Проекты'),
        ProjectList(projects)
      )
      (window as any).__bt_toast('Задача создана', 'success')
      // Закрыть модалку
      (box.closest('dialog') as HTMLDialogElement | null)?.close()
      ;(box.closest('dialog') as HTMLDialogElement | null)?.remove()
    })
    box.append(form)
    // Сгенерируем модалку с заголовком
    const dlg = document.createElement('dialog')
    dlg.className = 'modal'
    dlg.innerHTML = `
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-2">Новая задача</h3>
        <div id="modal-content"></div>
        <div class="modal-action">
          <button class="btn">Закрыть</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>`
    ;(dlg.querySelector('#modal-content') as HTMLElement).appendChild(box)
    dlg.querySelector('.modal-action .btn')!.addEventListener('click', () => { (dlg as any).close(); dlg.remove() })
    document.body.appendChild(dlg)
    ;(dlg as any).showModal()
  }

  projectsCol.append(projectListCard)
  // Панель переключения режима + кнопка создания
  modeBar = h('div', { class: 'flex items-center justify-between mb-2' },
    h('div', { class: 'join' },
      tooltip(h('button', { class: 'btn btn-sm join-item', id: 'listBtn' }, 'Список'), 'Список'),
      tooltip(h('button', { class: 'btn btn-sm join-item', id: 'boardBtn' }, 'Доска'), 'Канбан‑доска'),
    ),
    tooltip(h('button', { class: 'btn btn-sm btn-primary', id: 'createIssueBtn' }, 'Новая задача'), 'Создать задачу')
  )
  // Панель фильтров (показывается только в режиме доски)
  filtersBar = h('div', { class: 'flex gap-2 mb-2' },
    h('input', { class: 'input input-bordered input-sm', placeholder: 'Поиск…', id: 'searchInput' }),
    h('select', { class: 'select select-bordered select-sm', id: 'statusFilter' },
      h('option', { value: '' }, 'Все статусы'),
      h('option', { value: 'open' }, 'В работе'),
      h('option', { value: 'in_progress' }, 'В процессе'),
      h('option', { value: 'done' }, 'Готово'),
      h('option', { value: 'cancelled' }, 'Отменено'),
    ),
    h('select', { class: 'select select-bordered select-sm', id: 'priorityFilter' },
      h('option', { value: '' }, 'Любой приоритет'),
      h('option', { value: 'low' }, 'Низкий'),
      h('option', { value: 'medium' }, 'Средний'),
      h('option', { value: 'high' }, 'Высокий'),
    ),
  )

  const boardHolder = document.createElement('div')
  function renderBoard(filtered: any[]) {
    const cols: { key: string; title: string }[] = [
      { key: 'open', title: 'В работе' },
      { key: 'in_progress', title: 'В процессе' },
      { key: 'done', title: 'Готово' },
      { key: 'cancelled', title: 'Отменено' },
    ]
    const grid = h('div', { class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' })
    for (const c of cols) {
      const col = h('div', { class: 'bg-base-100 border border-base-300 rounded-xl p-3 min-h-40', 'data-status': c.key })
      col.append(h('h3', { class: 'font-semibold mb-2' }, c.title))
      const zone = h('div', { class: 'space-y-2', 'data-dropzone': '1' })
      col.append(zone)
      grid.append(col)
    }
    // map issues
    for (const it of filtered) {
      const cardEl = IssueItem(it, projects, onUpdated, onDeleted)
      cardEl.setAttribute('draggable', 'true')
      cardEl.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/plain', String(it.id))
        e.dataTransfer?.setDragImage(cardEl, 20, 20)
      })
      const target = grid.querySelector(`div[data-status="${it.status}"] [data-dropzone]`)
      target?.appendChild(cardEl)
    }
    // dnd handlers
    grid.querySelectorAll('[data-dropzone]').forEach((z) => {
      z.addEventListener('dragover', (e) => e.preventDefault())
      z.addEventListener('drop', async (e) => {
        e.preventDefault()
        const id = Number((e.dataTransfer?.getData('text/plain') || 0))
        const newStatus = (z.parentElement as HTMLElement)?.getAttribute('data-status') || 'open'
        const item = issues.find((x: any) => x.id === id)
        if (!item || item.status === newStatus) return
        try { await fetchJSON('/api/auth/csrf/') } catch {}
        const updated = await fetchJSON(`/api/issues/${id}/`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
        const idx = issues.findIndex((x: any) => x.id === id)
        if (idx >= 0) issues[idx] = updated
        renderBoard(applyFilters())
        (window as any).__bt_toast('Статус обновлён', 'success')
      })
    })setChildren(grid)
  }

  function applyFilters(): any[] {
    const q = (filtersBar.querySelector('#searchInput') as HTMLInputElement).value.trim().toLowerCase()
    const st = (filtersBar.querySelector('#statusFilter') as HTMLSelectElement).value
    const pr = (filtersBar.querySelector('#priorityFilter') as HTMLSelectElement).value
    return issues.filter((i: any) => {
      if (st && i.status !== st) return false
      if (pr && i.priority !== pr) return false
      if (q && !(`${i.title} ${i.description}`.toLowerCase().includes(q))) return false
      return true
    })
  }

  function updateByFilters() {
    if (currentMode === 'board') renderBoardInside()
    else renderListInside()
  }

  function setToggleState(mode: 'list' | 'board') {
    const lb = modeBar.querySelector('#listBtn') as HTMLButtonElement
    const bb = modeBar.querySelector('#boardBtn') as HTMLButtonElement
    lb.classList.toggle('btn-primary', mode === 'list')
    bb.classList.toggle('btn-primary', mode === 'board')
  }
  function showList() {
    currentMode = 'list'
    setToggleState('list')
    renderListInside()
  }
  function showBoard() {
    currentMode = 'board'
    setToggleState('board')
    renderBoardInside()
  }

  ;(modeBar.querySelector('#listBtn') as HTMLButtonElement).addEventListener('click', showList)
  ;(modeBar.querySelector('#boardBtn') as HTMLButtonElement).addEventListener('click', showBoard)
  filtersBar.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', updateByFilters))

  // По умолчанию: список (кнопки и список внутри карточки)
  issuesCol.append(issuesListCard)
  showList()

  ;(modeBar.querySelector('#createIssueBtn') as HTMLButtonElement).addEventListener('click', openCreateIssue)
  content.append(projectsCol, issuesCol)

  container.append(header, content)setChildren(container)
}

async function renderLogin() {
  try { await fetchJSON('/api/auth/csrf/') } catch {}

  const box = h(
    'div',
    { class: 'min-h-screen bg-base-200 flex items-center justify-center p-4' },
    h(
      'div',
      { class: 'card w-full max-w-md bg-base-100 shadow-xl' },
      h(
        'div',
        { class: 'card-body space-y-4' },
        h('h2', { class: 'card-title justify-center' }, 'Вход в BugTracker'),
        (() => {
          const u = h('input', { class: `input input-bordered ${baseField}`, placeholder: 'Логин или e‑mail' }) as HTMLInputElement
          const p = h('input', { class: `input input-bordered ${baseField}`, placeholder: 'Пароль', type: 'password' }) as HTMLInputElement
          const err = h('div', { class: 'text-error text-sm min-h-5' })
          const btn = h('button', { class: 'btn btn-primary w-full' }, 'Войти') as HTMLButtonElement
          btn.addEventListener('click', async () => {
            err.textContent = ''
            try {
              await fetchJSON('/api/auth/login/', {
                method: 'POST',
                body: JSON.stringify({ username: u.value.trim(), password: p.value }),
              })
              await renderApp()
            } catch (e) {
              try {
                const msg = typeof e === 'string' ? e : (e as any)?.message || ''
                err.textContent = /учетн|логин|парол/i.test(msg) ? 'Неверный логин/почта или пароль' : 'Ошибка входа'
              } catch {
                err.textContent = 'Ошибка входа'
              }
            }
          })
          return h('div', { class: 'space-y-3' }, u, p, err, btn)
        })()
      )
    )
  )setChildren(box)
}

async function bootstrap() {
  try {
    const who = await fetchJSON<{ isAuthenticated: boolean }>('/api/auth/whoami/')
    if (who && who.isAuthenticated) await renderApp()
    else await renderLogin()
  } catch (e) {
    console.error(e)
    await renderLogin()
  }
}

bootstrap()
