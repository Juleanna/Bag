import {
  h, Container, Card, SecondaryButton, DangerButton, Button, PrimaryButton,
  StatusBadge, PriorityBadge, Form, FormGroup, Label, Input, Textarea,
  Breadcrumb, showToast,
} from '../components.ts'
import { api } from '../api.ts'
import type {
  Issue, Comment as IComment, Attachment, PaginatedResponse,
  IssueActivity, IssueRelation, ChecklistItem,
} from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render, navigate } from '../state.ts'
import { openModal, closeModal, modalWrapper, formatDate, renderMarkdown } from '../helpers.ts'
import { loadProjects } from './projects.ts'
import { loadIssues, updateIssue, deleteIssue } from './issues.ts'
import { loadLabels } from './labels.ts'

// ========== Data loading ==========

export async function loadComments(issueId: number) {
  try {
    if (state.labels.length === 0) await loadLabels()
    const [commentsRes, attachRes, activitiesRes, relationsRes, checklistRes] = await Promise.all([
      api.get<PaginatedResponse<IComment>>(`/comments/?issue=${issueId}`),
      api.get<PaginatedResponse<Attachment>>(`/attachments/?issue=${issueId}`),
      api.get<PaginatedResponse<IssueActivity>>(`/activities/?issue=${issueId}`),
      api.get<PaginatedResponse<IssueRelation>>(`/relations/?issue=${issueId}`),
      api.get<PaginatedResponse<ChecklistItem>>(`/checklist/?issue=${issueId}`),
    ])
    state.comments = commentsRes.results || (commentsRes as any)
    state.attachments = attachRes.results || (attachRes as any)
    state.activities = activitiesRes.results || (activitiesRes as any)
    state.relations = relationsRes.results || (relationsRes as any)
    state.checklistItems = checklistRes.results || (checklistRes as any)
    render()
  } catch {
    showToast(t('failedAddComment'), 'error')
  }
}

async function createComment(issueId: number, body: string) {
  if (!body.trim()) return
  try {
    await api.post('/comments/', { issue: issueId, body })
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || t('failedAddComment'), 'error')
  }
}

async function deleteComment(commentId: number, issueId: number) {
  try {
    await api.delete(`/comments/${commentId}/`)
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || t('failedDeleteComment'), 'error')
  }
}

async function uploadAttachment(issueId: number, file: File) {
  try {
    const fd = new FormData()
    fd.append('issue', String(issueId))
    fd.append('file', file)
    fd.append('name', file.name)
    await api.uploadFile('/attachments/', fd)
    showToast(t('fileUploaded'), 'success')
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || t('failedUploadFile'), 'error')
  }
}

async function deleteAttachment(attachmentId: number, issueId: number) {
  try {
    await api.delete(`/attachments/${attachmentId}/`)
    showToast(t('fileDeleted'), 'success')
    loadComments(issueId)
  } catch (error: any) {
    showToast(error.message || t('failedDeleteFile'), 'error')
  }
}

async function duplicateIssue(issue: Issue) {
  if (!state.selectedProject) return
  try {
    const newIssue = await api.post<Issue>('/issues/', {
      title: t('copyOf', { title: issue.title }),
      description: issue.description,
      priority: issue.priority,
      status: 'open',
      project: state.selectedProject.id,
      labels: issue.labels,
      assignee: issue.assignee,
      due_date: issue.due_date,
    })
    showToast(t('issueDuplicated'), 'success')
    state.selectedIssue = newIssue
    loadComments(newIssue.id)
    if (state.selectedProject) loadIssues(state.selectedProject.id)
  } catch (error: any) {
    showToast(error.message || t('failedCreateIssue'), 'error')
  }
}

async function toggleStar(issueId: number) {
  try {
    const res = await api.post<{ starred: boolean }>('/starred/toggle/', { issue: issueId })
    if (res.starred) {
      state.starredIssueIds = [...state.starredIssueIds, issueId]
    } else {
      state.starredIssueIds = state.starredIssueIds.filter(id => id !== issueId)
    }
    render()
  } catch { /* ignore */ }
}

// ========== Relations ==========

async function addRelation(fromIssue: number, toIssueId: string, relationType: string) {
  if (!toIssueId.trim() || !relationType) return
  try {
    await api.post('/relations/', {
      from_issue: fromIssue,
      to_issue: Number(toIssueId),
      relation_type: relationType,
    })
    showToast(t('relationAdded'), 'success')
    loadComments(fromIssue)
  } catch (error: any) {
    showToast(error.message || t('failedAddRelation'), 'error')
  }
}

async function removeRelation(relationId: number, issueId: number) {
  try {
    await api.delete(`/relations/${relationId}/`)
    showToast(t('relationRemoved'), 'success')
    loadComments(issueId)
  } catch { /* ignore */ }
}

// ========== Checklist ==========

async function addChecklistItem(issueId: number, text: string) {
  if (!text.trim()) return
  try {
    const pos = state.checklistItems.length
    await api.post('/checklist/', { issue: issueId, text, position: pos })
    loadComments(issueId)
  } catch { /* ignore */ }
}

async function toggleChecklistItem(itemId: number, isDone: boolean, issueId: number) {
  try {
    await api.patch(`/checklist/${itemId}/`, { is_done: !isDone })
    loadComments(issueId)
  } catch { /* ignore */ }
}

async function deleteChecklistItem(itemId: number, issueId: number) {
  try {
    await api.delete(`/checklist/${itemId}/`)
    loadComments(issueId)
  } catch { /* ignore */ }
}

// ========== Helpers ==========

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return '🖼'
  if (['pdf'].includes(ext)) return '📄'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '📦'
  if (['doc', 'docx', 'txt', 'md'].includes(ext)) return '📝'
  return '📎'
}

function getActivityLabel(action: string): string {
  switch (action) {
    case 'created': return t('issueCreatedActivity')
    case 'status_changed': return t('statusChanged')
    case 'priority_changed': return t('priorityChanged')
    case 'assignee_changed': return t('assigneeChanged')
    case 'title_changed': return t('titleChanged')
    case 'due_date_changed': return t('dueDateChanged')
    case 'comment_added': return t('commentAdded')
    default: return action
  }
}

function getRelationLabel(type: string): string {
  switch (type) {
    case 'blocks': return t('blocks')
    case 'blocked_by': return t('blockedBy')
    case 'relates_to': return t('relatesTo')
    case 'duplicate_of': return t('duplicateOf')
    default: return type
  }
}

// ========== Render sections ==========

function renderChecklist(issueId: number) {
  const items = state.checklistItems
  const done = items.filter(i => i.is_done).length

  return Card({}, t('checklist') + (items.length > 0 ? ` (${t('checklistProgress', { done, total: items.length })})` : ''),
    h('div', { class: 'space-y-2' },
      items.length > 0
        ? h('div', { class: 'w-full bg-base-200 rounded-full h-1.5 mb-2' },
            h('div', {
              class: 'h-1.5 rounded-full bg-success transition-all',
              style: `width: ${items.length > 0 ? Math.round((done / items.length) * 100) : 0}%`,
            })
          )
        : null,
      ...items.map(item =>
        h('div', { class: 'flex items-center gap-2 group' },
          h('input', {
            type: 'checkbox',
            class: 'checkbox checkbox-sm checkbox-success',
            checked: item.is_done,
            onClick: () => toggleChecklistItem(item.id, item.is_done, issueId),
          }),
          h('span', {
            class: `flex-1 text-sm ${item.is_done ? 'line-through text-base-content/40' : ''}`,
          }, item.text),
          h('button', {
            class: 'btn btn-xs btn-ghost text-error opacity-0 group-hover:opacity-100',
            onClick: () => deleteChecklistItem(item.id, issueId),
          }, 'x'),
        )
      ),
      // Add item form
      h('form', {
        class: 'flex gap-2 mt-2',
        onSubmit: (e: Event) => {
          e.preventDefault()
          const form = e.currentTarget as HTMLFormElement
          const input = form.querySelector('input') as HTMLInputElement
          addChecklistItem(issueId, input.value)
          input.value = ''
        },
      },
        h('input', {
          type: 'text',
          class: 'input input-sm flex-1',
          placeholder: t('checklistPlaceholder'),
        }),
        h('button', { type: 'submit', class: 'btn btn-sm btn-outline' }, t('addItem')),
      ),
    )
  )
}

function renderRelations(issueId: number) {
  return Card({}, t('relations'),
    h('div', { class: 'space-y-2' },
      state.relations.length > 0
        ? h('div', { class: 'space-y-1' },
            ...state.relations.map(rel => {
              const isFrom = rel.from_issue === issueId
              const targetTitle = isFrom ? rel.to_issue_title : rel.from_issue_title
              const targetId = isFrom ? rel.to_issue : rel.from_issue
              return h('div', { class: 'flex items-center gap-2 p-2 bg-base-200/30 rounded-lg text-sm' },
                h('span', { class: 'font-medium text-primary' }, getRelationLabel(rel.relation_type)),
                h('span', {
                  class: 'flex-1 truncate cursor-pointer hover:underline',
                  onClick: () => {
                    const target = state.issues.find(i => i.id === targetId)
                    if (target) {
                      state.selectedIssue = target
                      loadComments(target.id)
                      render()
                    }
                  },
                }, `#${targetId} ${targetTitle}`),
                h('button', {
                  class: 'btn btn-xs btn-ghost text-error',
                  onClick: () => removeRelation(rel.id, issueId),
                }, 'x'),
              )
            })
          )
        : null,
      // Add relation form
      h('form', {
        class: 'flex gap-2 mt-2 items-end',
        onSubmit: (e: Event) => {
          e.preventDefault()
          const form = e.currentTarget as HTMLFormElement
          const fd = new FormData(form)
          addRelation(issueId, fd.get('target') as string, fd.get('type') as string)
          form.reset()
        },
      },
        h('select', { name: 'type', class: 'select select-sm w-32' },
          h('option', { value: 'relates_to' }, t('relatesTo')),
          h('option', { value: 'blocks' }, t('blocks')),
          h('option', { value: 'blocked_by' }, t('blockedBy')),
          h('option', { value: 'duplicate_of' }, t('duplicateOf')),
        ),
        h('input', {
          name: 'target',
          type: 'number',
          class: 'input input-sm w-24',
          placeholder: 'ID',
        }),
        h('button', { type: 'submit', class: 'btn btn-sm btn-outline' }, t('add')),
      ),
    )
  )
}

function renderActivityTimeline() {
  if (state.activities.length === 0) return null

  return Card({}, t('activityTimeline'),
    h('div', { class: 'space-y-2 max-h-64 overflow-y-auto' },
      ...state.activities.map(act =>
        h('div', { class: 'flex items-start gap-2 text-xs py-1.5 border-b border-base-200/50 last:border-0' },
          h('div', { class: 'w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary mt-0.5' },
            act.user.username.charAt(0).toUpperCase()
          ),
          h('div', { class: 'flex-1 min-w-0' },
            h('span', { class: 'font-medium' }, act.user.username),
            h('span', { class: 'text-base-content/60' }, ' ' + getActivityLabel(act.action)),
            act.old_value && act.new_value
              ? h('span', { class: 'text-base-content/50' },
                  ` ${t('from')} "${act.old_value}" ${t('to')} "${act.new_value}"`)
              : null,
          ),
          h('span', { class: 'text-base-content/40 shrink-0' }, formatDate(act.created_at)),
        )
      )
    )
  )
}

// ========== Main render ==========

export function renderIssueDetail() {
  if (!state.selectedIssue || !state.selectedProject) return h('div')

  const issue = state.selectedIssue
  const proj = state.selectedProject
  const isStarred = state.starredIssueIds.includes(issue.id)

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: t('projects'), onClick: () => { state.selectedProject = null; navigate('projects'); loadProjects() } },
      { label: proj.name, onClick: () => { state.selectedIssue = null; navigate('issues'); loadIssues(proj.id) } },
      { label: issue.title },
    ]),

    h('div', { class: 'grid grid-cols-1 lg:grid-cols-3 gap-6' },
      h('div', { class: 'lg:col-span-2 space-y-6' },
        // Main issue card
        Card({}, issue.title,
          h('div', { class: 'space-y-4' },
            issue.description
              ? renderMarkdown(issue.description)
              : h('p', { class: 'text-base-content/50' }, t('noDescription')),
            h('div', { class: 'flex gap-2 flex-wrap' },
              StatusBadge(issue.status),
              PriorityBadge(issue.priority),
              ...issue.labels.map(labelId => {
                const lb = state.labels.find(l => l.id === labelId)
                return lb
                  ? h('span', {
                      class: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white',
                      style: `background-color: ${lb.color}`,
                    }, lb.name)
                  : null
              })
            ),
            h('div', { class: 'flex gap-2 pt-2 flex-wrap' },
              h('button', {
                class: `btn btn-sm ${isStarred ? 'btn-warning' : 'btn-outline'}`,
                onClick: () => toggleStar(issue.id),
              }, isStarred ? '\u2605 ' + t('unstarIssue') : '\u2606 ' + t('starIssue')),
              SecondaryButton({ children: t('edit') }, () => {
                openModal('edit-issue-modal')
                setTimeout(() => {
                  const ti = document.querySelector('#edit-issue-title') as HTMLInputElement
                  const de = document.querySelector('#edit-issue-desc') as HTMLTextAreaElement
                  const dd = document.querySelector('#edit-issue-due') as HTMLInputElement
                  if (ti) ti.value = issue.title
                  if (de) de.value = issue.description
                  if (dd) dd.value = issue.due_date || ''
                }, 50)
              }),
              SecondaryButton({ children: t('duplicateIssue') }, () => duplicateIssue(issue)),
              DangerButton({ children: t('delete') }, () => deleteIssue(issue.id)),
            )
          )
        ),

        // Checklist
        renderChecklist(issue.id),

        // Attachments
        Card({}, t('attachments'),
          h('div', { class: 'space-y-3' },
            h('div', { class: 'flex items-center gap-2' },
              h('button', {
                class: 'btn btn-sm btn-outline',
                onClick: () => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.onchange = () => {
                    if (input.files?.[0]) uploadAttachment(issue.id, input.files[0])
                  }
                  input.click()
                },
              }, t('attachFile'))
            ),
            state.attachments.length === 0
              ? h('p', { class: 'text-base-content/50 text-sm py-2' }, t('noAttachments'))
              : h('div', { class: 'space-y-2 mt-2' },
                  ...state.attachments.map(att =>
                    h('div', { class: 'flex items-center gap-3 p-3 bg-base-200/50 rounded-lg' },
                      h('span', { class: 'text-lg' }, getFileIcon(att.name)),
                      h('div', { class: 'flex-1 min-w-0' },
                        h('p', { class: 'font-medium text-sm truncate' }, att.name),
                        h('p', { class: 'text-xs text-base-content/50' }, formatDate(att.created_at)),
                      ),
                      h('a', { href: att.url, target: '_blank', class: 'btn btn-xs btn-ghost' }, t('downloadFile')),
                      state.currentUser
                        ? h('button', {
                            class: 'btn btn-xs btn-ghost text-error',
                            onClick: () => deleteAttachment(att.id, issue.id),
                          }, 'x')
                        : null,
                    )
                  )
                )
          )
        ),

        // Comments
        Card({}, t('commentsCount', { count: state.comments.length }),
          h('div', { class: 'space-y-4' },
            Form(
              {
                onSubmit: (e) => {
                  const form = e.currentTarget as HTMLFormElement
                  const fd = new FormData(form)
                  createComment(issue.id, fd.get('body') as string)
                  form.reset()
                },
              },
              FormGroup({},
                Textarea({ name: 'body', placeholder: t('writeComment'), class: 'mt-2', rows: '3' })
              ),
              h('div', { class: 'flex justify-end mt-2' },
                PrimaryButton({ children: t('comment'), type: 'submit' })
              )
            ),
            state.comments.length === 0
              ? h('p', { class: 'text-base-content/50 text-center py-4' }, t('noCommentsYet'))
              : h('div', { class: 'space-y-3 mt-4 border-t border-base-200 pt-4' },
                  ...state.comments.map(c =>
                    h('div', { class: 'bg-base-200/50 rounded-lg p-4' },
                      h('div', { class: 'flex items-center justify-between mb-2' },
                        h('span', { class: 'font-semibold text-sm' }, c.author?.username || t('unknown')),
                        h('div', { class: 'flex items-center gap-2' },
                          h('span', { class: 'text-xs text-base-content/50' }, formatDate(c.created_at)),
                          state.currentUser && c.author && c.author.id === state.currentUser.id
                            ? h('button', {
                                class: 'btn btn-xs btn-ghost text-error',
                                onClick: () => deleteComment(c.id, issue.id),
                              }, 'x')
                            : null
                        )
                      ),
                      renderMarkdown(c.body)
                    )
                  )
                )
          )
        ),

        // Activity timeline
        renderActivityTimeline(),
      ),

      // Sidebar
      h('div', { class: 'space-y-4' },
        // Status
        Card({}, t('status'),
          h('div', { class: 'space-y-2' },
            ...(['open', 'in_progress', 'done', 'cancelled'] as const).map(s =>
              h('button', {
                class: `btn btn-sm w-full ${issue.status === s ? 'btn-primary' : 'btn-outline'}`,
                onClick: () => updateIssue(issue.id, { status: s }),
              }, t(s))
            )
          )
        ),

        // Priority
        Card({}, t('priority'),
          h('div', { class: 'space-y-2' },
            ...(['low', 'medium', 'high'] as const).map(p =>
              h('button', {
                class: `btn btn-sm w-full ${issue.priority === p ? 'btn-primary' : 'btn-outline'}`,
                onClick: () => updateIssue(issue.id, { priority: p }),
              }, t(p))
            )
          )
        ),

        // Assignee
        Card({}, t('assignee'),
          h('div', { class: 'space-y-2' },
            h('button', {
              class: `btn btn-sm w-full ${issue.assignee === null ? 'btn-primary' : 'btn-outline'}`,
              onClick: () => updateIssue(issue.id, { assignee: null }),
            }, t('unassigned')),
            ...proj.members.map(m =>
              h('button', {
                class: `btn btn-sm w-full ${issue.assignee === m.id ? 'btn-primary' : 'btn-outline'}`,
                onClick: () => updateIssue(issue.id, { assignee: m.id }),
              }, m.username)
            )
          )
        ),

        // Labels
        Card({}, t('labels'),
          state.labels.length > 0
            ? h('div', { class: 'flex flex-wrap gap-2' },
                ...state.labels.map(lb => {
                  const isActive = issue.labels.includes(lb.id)
                  return h('button', {
                    class: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs cursor-pointer border-2 transition-all ${
                      isActive ? 'border-transparent text-white font-medium' : 'border-base-300 bg-base-100 hover:border-base-content/30'
                    }`,
                    style: isActive ? `background-color: ${lb.color}` : '',
                    onClick: () => {
                      const newLabels = isActive ? issue.labels.filter(id => id !== lb.id) : [...issue.labels, lb.id]
                      updateIssue(issue.id, { labels: newLabels })
                    },
                  },
                    h('span', { class: 'w-2.5 h-2.5 rounded-full shrink-0', style: `background-color: ${lb.color}` }),
                    lb.name
                  )
                })
              )
            : h('p', { class: 'text-sm text-base-content/50' }, t('noLabelsYet'))
        ),

        // Relations
        renderRelations(issue.id),

        // Due Date
        Card({}, t('dueDate'),
          h('div', { class: 'space-y-2' },
            issue.due_date
              ? h('div', { class: 'flex items-center justify-between' },
                  h('span', {
                    class: `font-medium text-sm ${new Date(issue.due_date) < new Date() && issue.status !== 'done' ? 'text-error' : ''}`,
                  }, formatDate(issue.due_date)),
                  h('button', { class: 'btn btn-xs btn-ghost text-error', onClick: () => updateIssue(issue.id, { due_date: null }) }, 'x')
                )
              : h('p', { class: 'text-sm text-base-content/50' }, t('noDueDate')),
            h('input', {
              type: 'date', class: 'input input-sm w-full mt-1', value: issue.due_date || '',
              onChange: (e: Event) => updateIssue(issue.id, { due_date: (e.target as HTMLInputElement).value || null }),
            }),
          )
        ),

        // Details
        Card({}, t('details'),
          h('div', { class: 'space-y-2 text-sm' },
            h('div', {},
              h('span', { class: 'text-base-content/60' }, `${t('reporter')}: `),
              h('span', { class: 'font-medium' }, issue.reporter?.username || t('unknown'))
            ),
            h('div', {},
              h('span', { class: 'text-base-content/60' }, `${t('assignee')}: `),
              h('span', { class: 'font-medium' },
                issue.assignee ? (proj.members.find(m => m.id === issue.assignee)?.username || `#${issue.assignee}`) : t('unassigned')
              )
            ),
            h('div', {},
              h('span', { class: 'text-base-content/60' }, `${t('created')}: `),
              h('span', { class: 'font-medium' }, formatDate(issue.created_at))
            ),
            h('div', {},
              h('span', { class: 'text-base-content/60' }, `${t('updated')}: `),
              h('span', { class: 'font-medium' }, formatDate(issue.updated_at))
            ),
          )
        ),
      ),
    ),

    // Edit Issue Modal
    modalWrapper('edit-issue-modal', t('editIssue'),
      Form(
        {
          onSubmit: (e) => {
            const fd = new FormData(e.currentTarget as HTMLFormElement)
            updateIssue(issue.id, {
              title: fd.get('title') as string,
              description: fd.get('description') as string,
              due_date: (fd.get('due_date') as string) || null,
            })
            closeModal('edit-issue-modal')
          },
        },
        FormGroup({}, Label({}, t('title')), Input({ name: 'title', id: 'edit-issue-title', class: 'mt-2' })),
        FormGroup({ class: 'mt-4' }, Label({}, t('description')), Textarea({ name: 'description', id: 'edit-issue-desc', class: 'mt-2', rows: '5' })),
        FormGroup({ class: 'mt-4' }, Label({}, t('dueDate')), h('input', { type: 'date', name: 'due_date', id: 'edit-issue-due', class: 'input mt-2' })),
        h('div', { class: 'flex gap-2 justify-end mt-6' },
          Button({ children: t('cancel'), class: 'btn-ghost' }, () => closeModal('edit-issue-modal')),
          PrimaryButton({ children: t('save'), type: 'submit' })
        )
      )
    )
  )
}
