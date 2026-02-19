import {
  h, Container, PageHeader, Card, Badge, SecondaryButton, PrimaryButton,
  EmptyState, Breadcrumb, Form, FormGroup, Label, Input, Select, showToast, showConfirm,
} from '../components.ts'
import { api } from '../api.ts'
import type { ProjectMembership, Invitation, PaginatedResponse } from '../api.ts'
import { t } from '../i18n/index.ts'
import { state, render, navigate } from '../state.ts'
import { loadProjects } from './projects.ts'
import { loadIssues } from './issues.ts'

let membershipsLoaded = false

export function resetMembershipsLoaded() {
  membershipsLoaded = false
}

export async function loadMemberships(projectId: number) {
  try {
    const [membRes, invRes] = await Promise.all([
      api.get<PaginatedResponse<ProjectMembership>>(`/memberships/?project=${projectId}`),
      api.get<PaginatedResponse<Invitation>>(`/invitations/?project=${projectId}`),
    ])
    state.memberships = membRes.results || (membRes as any)
    state.invitations = invRes.results || (invRes as any)
    membershipsLoaded = true
    render()
  } catch {
    state.memberships = []
    state.invitations = []
  }
}

async function updateMemberRole(membershipId: number, role: string, projectId: number) {
  try {
    await api.patch(`/memberships/${membershipId}/`, { role })
    showToast(t('roleUpdated'), 'success')
    loadMemberships(projectId)
  } catch (error: any) {
    showToast(error.message || t('failedUpdateRole'), 'error')
  }
}

async function removeMember(membershipId: number, projectId: number) {
  const confirmed = await showConfirm(t('confirmRemoveMember'))
  if (!confirmed) return
  try {
    await api.delete(`/memberships/${membershipId}/`)
    showToast(t('memberRemoved'), 'success')
    loadMemberships(projectId)
    loadProjects()
  } catch (error: any) {
    showToast(error.message || t('failedRemoveMember'), 'error')
  }
}

async function sendInvite(projectId: number, email: string, role: string) {
  try {
    await api.post('/invitations/', { project: projectId, email, role: role || 'member' })
    showToast(t('inviteSent'), 'success')
    loadMemberships(projectId)
  } catch (error: any) {
    showToast(error.message || t('failedSendInvite'), 'error')
  }
}

async function deleteInvite(inviteId: number, projectId: number) {
  try {
    await api.delete(`/invitations/${inviteId}/`)
    loadMemberships(projectId)
  } catch { /* ignore */ }
}

async function acceptInviteToken(token: string) {
  try {
    await api.post('/invitations/accept/', { token })
    showToast(t('inviteAccepted'), 'success')
    loadProjects()
  } catch (error: any) {
    showToast(error.message || t('failedAcceptInvite'), 'error')
  }
}

function getRoleBadgeVariant(role: string): 'primary' | 'success' | 'warning' | 'error' {
  switch (role) {
    case 'owner': return 'primary'
    case 'manager': return 'warning'
    case 'member': return 'success'
    default: return 'error'
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case 'owner': return t('owner')
    case 'manager': return t('manager')
    case 'member': return t('member')
    case 'viewer': return t('viewer')
    default: return role
  }
}

export function renderMembers() {
  if (!state.selectedProject) return h('div')
  const proj = state.selectedProject
  const isOwner = state.currentUser && proj.owner && proj.owner.id === state.currentUser.id

  if (!membershipsLoaded) {
    membershipsLoaded = true
    loadMemberships(proj.id)
  }

  return Container(
    { class: 'py-8' },
    Breadcrumb([
      { label: t('projects'), onClick: () => { state.selectedProject = null; navigate('projects'); loadProjects() } },
      { label: proj.name, onClick: () => { navigate('issues'); loadIssues(proj.id) } },
      { label: t('members') },
    ]),

    PageHeader(t('teamMembers'), t('membersOf', { name: proj.name })),

    // Member list with roles
    Card({ class: 'mb-6' }, t('members'),
      proj.members && proj.members.length > 0
        ? h('div', { class: 'space-y-3' },
            ...proj.members.map(member => {
              const membership = state.memberships.find(m => m.user.id === member.id)
              const memberIsOwner = proj.owner && member.id === proj.owner.id
              const role = memberIsOwner ? 'owner' : (membership?.role || 'member')

              return h('div', { class: 'flex items-center gap-4 p-4 bg-base-200/30 rounded-lg' },
                h('div', { class: 'w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary' },
                  member.username.charAt(0).toUpperCase()
                ),
                h('div', { class: 'flex-1 min-w-0' },
                  h('p', { class: 'font-semibold truncate' }, member.username),
                  h('p', { class: 'text-sm text-base-content/60 truncate' },
                    [member.first_name, member.last_name].filter(Boolean).join(' ') || t('noNameSet')
                  ),
                ),
                Badge({ variant: getRoleBadgeVariant(role) }, getRoleLabel(role)),
                isOwner && !memberIsOwner && membership
                  ? h('div', { class: 'flex items-center gap-1' },
                      h('select', {
                        class: 'select select-xs',
                        value: role,
                        onChange: (e: Event) => {
                          updateMemberRole(membership.id, (e.target as HTMLSelectElement).value, proj.id)
                        },
                      },
                        h('option', { value: 'viewer' }, t('viewer')),
                        h('option', { value: 'member' }, t('member')),
                        h('option', { value: 'manager' }, t('manager')),
                      ),
                      h('button', {
                        class: 'btn btn-xs btn-ghost text-error',
                        onClick: () => removeMember(membership.id, proj.id),
                      }, 'x')
                    )
                  : null,
              )
            })
          )
        : EmptyState(t('noMembersYet'))
    ),

    // Invite form (owner only)
    isOwner
      ? Card({ class: 'mb-6' }, t('inviteByEmail'),
          Form(
            {
              onSubmit: (e) => {
                const fd = new FormData(e.currentTarget as HTMLFormElement)
                const email = fd.get('email') as string
                const role = fd.get('role') as string
                if (email.trim()) {
                  sendInvite(proj.id, email, role)
                  ;(e.currentTarget as HTMLFormElement).reset()
                }
              },
            },
            h('div', { class: 'flex gap-2 items-end flex-wrap' },
              FormGroup({ class: 'flex-1 min-w-[200px]' },
                Label({}, t('inviteEmail')),
                Input({ name: 'email', type: 'email', placeholder: 'user@example.com', class: 'mt-2' })
              ),
              FormGroup({ class: 'w-40' },
                Label({}, t('inviteRole')),
                Select({
                  name: 'role',
                  options: [
                    { value: 'member', label: t('member') },
                    { value: 'viewer', label: t('viewer') },
                    { value: 'manager', label: t('manager') },
                  ],
                  class: 'mt-2',
                })
              ),
              PrimaryButton({ children: t('send'), type: 'submit' })
            )
          )
        )
      : null,

    // Pending invitations
    isOwner && state.invitations.length > 0
      ? Card({ class: 'mb-6' }, t('pendingInvites'),
          h('div', { class: 'space-y-2' },
            ...state.invitations.map(inv =>
              h('div', { class: 'flex items-center gap-3 p-3 bg-base-200/30 rounded-lg' },
                h('span', { class: 'flex-1 text-sm font-medium' }, inv.email),
                Badge(
                  { variant: inv.accepted ? 'success' : 'warning' },
                  inv.accepted ? t('accepted') : t('pending')
                ),
                Badge({ variant: getRoleBadgeVariant(inv.role) }, getRoleLabel(inv.role)),
                !inv.accepted
                  ? h('span', { class: 'text-xs text-base-content/40 font-mono' }, inv.token.substring(0, 8) + '...')
                  : null,
                h('button', {
                  class: 'btn btn-xs btn-ghost text-error',
                  onClick: () => deleteInvite(inv.id, proj.id),
                }, 'x')
              )
            )
          )
        )
      : null,

    // Accept invitation by token
    Card({ class: 'mb-6' }, t('acceptInvite'),
      Form(
        {
          onSubmit: (e) => {
            const fd = new FormData(e.currentTarget as HTMLFormElement)
            const token = fd.get('token') as string
            if (token.trim()) {
              acceptInviteToken(token)
              ;(e.currentTarget as HTMLFormElement).reset()
            }
          },
        },
        h('div', { class: 'flex gap-2 items-end' },
          FormGroup({ class: 'flex-1' },
            Label({}, t('inviteToken')),
            Input({ name: 'token', placeholder: t('enterInviteToken'), class: 'mt-2' })
          ),
          PrimaryButton({ children: t('accept'), type: 'submit' })
        )
      )
    ),

    h('div', { class: 'mt-6' },
      SecondaryButton({ children: t('backToIssues') }, () => {
        navigate('issues')
        loadIssues(proj.id)
      })
    )
  )
}
