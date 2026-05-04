/**
 * Типи + API-обгортка для адмін-панелі лендінгу.
 *
 * Текстові поля можуть бути або `string` (коли GET /api/landing/?lang=xx), або
 * dict {uk, en}. Тип `LangText` описує обидва варіанти. Helper `t(value, lang)`
 * витягує рядок з fallback.
 */

import { apiDelete, apiGet, apiPatch, apiPost, apiUpload } from './client'

export type Lang = 'uk' | 'en'

export type LangText = string | Partial<Record<Lang, string>>

export function t(value: LangText | undefined | null, lang: Lang = 'uk'): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  return value[lang] || value.uk || value.en || ''
}

export interface LandingHero {
  eyebrow_badge: string
  eyebrow_text: LangText
  eyebrow_version: string
  title_a: LangText
  title_accent: LangText
  title_b: LangText
  lede: LangText
  primary_cta_text: LangText
  primary_cta_link: string
  secondary_cta_text: LangText
  secondary_cta_link: string
  foot_text_1: LangText
  foot_text_2: LangText
  foot_text_3: LangText
  draft_data?: Record<string, unknown> | null
  has_draft?: boolean
  updated_at?: string
}

export type IconName =
  | 'Bug' | 'Beaker' | 'Play' | 'Layout' | 'Chart' | 'Comment' | 'Bell'
  | 'Lightning' | 'AI' | 'User' | 'Users' | 'Github' | 'Slack' | 'Spark'
  | 'Star' | 'Globe' | 'Refresh' | 'Settings' | 'Lock' | 'Activity'

export type ColorVariant = 'accent' | 'resolved' | 'progress' | 'blocked' | 'open' | 'closed'

export interface BaseItem {
  id: number
  position: number
  is_visible: boolean
  is_published: boolean
}

export interface LandingFeature extends BaseItem {
  title: LangText
  description: LangText
  icon: IconName
  color_variant: ColorVariant
  featured: boolean
}

export interface LandingUseCase extends BaseItem {
  title: LangText
  description: LangText
  icon: IconName
  color_variant: ColorVariant
  bullets: LangText
  bullets_list: string[]
}

export interface LandingIntegration extends BaseItem {
  name: string
  mark: string
  color: string
  logo: string | null
  logo_url: string | null
}

export interface LandingMetric extends BaseItem {
  value: string
  label: LangText
}

export interface LandingTestimonial extends BaseItem {
  quote: LangText
  author_name: string
  author_role: LangText
  avatar_initials: string
  avatar_color: string
  featured: boolean
}

export interface LandingFaqItem extends BaseItem {
  question: LangText
  answer: LangText
}

export interface LandingSettings {
  show_features: boolean
  show_use_cases: boolean
  show_metrics: boolean
  show_integrations: boolean
  show_testimonials: boolean
  show_faq: boolean
  show_cta_strip: boolean
  features_kicker: LangText
  features_title: LangText
  features_subtitle: LangText
  use_cases_kicker: LangText
  use_cases_title: LangText
  use_cases_subtitle: LangText
  integrations_kicker: LangText
  integrations_title: LangText
  integrations_subtitle: LangText
  testimonials_kicker: LangText
  testimonials_title: LangText
  faq_kicker: LangText
  faq_title: LangText
  cta_title: LangText
  cta_subtitle: LangText
  cta_primary_text: LangText
  cta_primary_link: string
  cta_secondary_text: LangText
  cta_secondary_link: string
  footer_brand_text: LangText
  footer_copyright: LangText
  draft_data?: Record<string, unknown> | null
  has_draft?: boolean
  updated_at?: string
}

export interface LandingPublic {
  hero: LandingHero
  settings: LandingSettings
  features: LandingFeature[]
  use_cases: LandingUseCase[]
  integrations: LandingIntegration[]
  metrics: LandingMetric[]
  testimonials: LandingTestimonial[]
  faq: LandingFaqItem[]
}

export interface ChangeLogEntry {
  id: number
  model_name: string
  object_id: number | null
  object_label: string
  action:
    | 'created' | 'updated' | 'deleted'
    | 'published' | 'unpublished'
    | 'published_draft' | 'draft_discarded'
  user: number | null
  user_name: string | null
  timestamp: string
  data_snapshot: Record<string, unknown> | null
}

// ============================================================================
// Public API
// ============================================================================

export async function fetchLandingPublic(opts?: {
  lang?: Lang
  preview?: boolean
}): Promise<LandingPublic> {
  const qs = new URLSearchParams()
  if (opts?.lang) qs.set('lang', opts.lang)
  if (opts?.preview) qs.set('preview', 'true')
  const suffix = qs.toString() ? `?${qs}` : ''
  return apiGet<LandingPublic>(`/landing/${suffix}`)
}

// ============================================================================
// Admin API
// ============================================================================

export const landingAdmin = {
  // Hero (singleton + drafts)
  getHero: () => apiGet<LandingHero>('/admin/landing/hero/1/'),
  updateHero: (data: Partial<LandingHero>) =>
    apiPatch<LandingHero>('/admin/landing/hero/1/', data),
  saveDraftHero: (data: Record<string, unknown>) =>
    apiPost<LandingHero>('/admin/landing/hero/save-draft/', data),
  publishDraftHero: () => apiPost<LandingHero>('/admin/landing/hero/publish-draft/', {}),
  discardDraftHero: () => apiPost<LandingHero>('/admin/landing/hero/discard-draft/', {}),

  // Settings (singleton + drafts)
  getSettings: () => apiGet<LandingSettings>('/admin/landing/settings/1/'),
  updateSettings: (data: Partial<LandingSettings>) =>
    apiPatch<LandingSettings>('/admin/landing/settings/1/', data),
  saveDraftSettings: (data: Record<string, unknown>) =>
    apiPost<LandingSettings>('/admin/landing/settings/save-draft/', data),
  publishDraftSettings: () =>
    apiPost<LandingSettings>('/admin/landing/settings/publish-draft/', {}),
  discardDraftSettings: () =>
    apiPost<LandingSettings>('/admin/landing/settings/discard-draft/', {}),

  // Features
  listFeatures: () => apiGet<{ results: LandingFeature[] } | LandingFeature[]>('/admin/landing/features/'),
  createFeature: (data: Partial<LandingFeature>) =>
    apiPost<LandingFeature>('/admin/landing/features/', data),
  updateFeature: (id: number, data: Partial<LandingFeature>) =>
    apiPatch<LandingFeature>(`/admin/landing/features/${id}/`, data),
  deleteFeature: (id: number) => apiDelete(`/admin/landing/features/${id}/`),
  reorderFeatures: (order: number[]) => apiPost('/admin/landing/features/reorder/', { order }),
  publishFeature: (id: number) =>
    apiPost<LandingFeature>(`/admin/landing/features/${id}/publish/`, {}),
  unpublishFeature: (id: number) =>
    apiPost<LandingFeature>(`/admin/landing/features/${id}/unpublish/`, {}),

  // Use cases
  listUseCases: () => apiGet<{ results: LandingUseCase[] } | LandingUseCase[]>('/admin/landing/use-cases/'),
  createUseCase: (data: Partial<LandingUseCase>) =>
    apiPost<LandingUseCase>('/admin/landing/use-cases/', data),
  updateUseCase: (id: number, data: Partial<LandingUseCase>) =>
    apiPatch<LandingUseCase>(`/admin/landing/use-cases/${id}/`, data),
  deleteUseCase: (id: number) => apiDelete(`/admin/landing/use-cases/${id}/`),
  reorderUseCases: (order: number[]) => apiPost('/admin/landing/use-cases/reorder/', { order }),
  publishUseCase: (id: number) =>
    apiPost<LandingUseCase>(`/admin/landing/use-cases/${id}/publish/`, {}),
  unpublishUseCase: (id: number) =>
    apiPost<LandingUseCase>(`/admin/landing/use-cases/${id}/unpublish/`, {}),

  // Integrations
  listIntegrations: () => apiGet<{ results: LandingIntegration[] } | LandingIntegration[]>('/admin/landing/integrations/'),
  createIntegration: (data: Partial<LandingIntegration>) =>
    apiPost<LandingIntegration>('/admin/landing/integrations/', data),
  updateIntegration: (id: number, data: Partial<LandingIntegration>) =>
    apiPatch<LandingIntegration>(`/admin/landing/integrations/${id}/`, data),
  uploadIntegrationLogo: (id: number, file: File) => {
    const fd = new FormData()
    fd.append('logo', file)
    return apiUpload<LandingIntegration>(`/admin/landing/integrations/${id}/`, fd, 'PATCH')
  },
  removeIntegrationLogo: (id: number) =>
    apiPatch<LandingIntegration>(`/admin/landing/integrations/${id}/`, { logo: null }),
  deleteIntegration: (id: number) => apiDelete(`/admin/landing/integrations/${id}/`),
  reorderIntegrations: (order: number[]) =>
    apiPost('/admin/landing/integrations/reorder/', { order }),
  publishIntegration: (id: number) =>
    apiPost<LandingIntegration>(`/admin/landing/integrations/${id}/publish/`, {}),
  unpublishIntegration: (id: number) =>
    apiPost<LandingIntegration>(`/admin/landing/integrations/${id}/unpublish/`, {}),

  // Metrics
  listMetrics: () => apiGet<{ results: LandingMetric[] } | LandingMetric[]>('/admin/landing/metrics/'),
  createMetric: (data: Partial<LandingMetric>) =>
    apiPost<LandingMetric>('/admin/landing/metrics/', data),
  updateMetric: (id: number, data: Partial<LandingMetric>) =>
    apiPatch<LandingMetric>(`/admin/landing/metrics/${id}/`, data),
  deleteMetric: (id: number) => apiDelete(`/admin/landing/metrics/${id}/`),
  reorderMetrics: (order: number[]) => apiPost('/admin/landing/metrics/reorder/', { order }),
  publishMetric: (id: number) =>
    apiPost<LandingMetric>(`/admin/landing/metrics/${id}/publish/`, {}),
  unpublishMetric: (id: number) =>
    apiPost<LandingMetric>(`/admin/landing/metrics/${id}/unpublish/`, {}),

  // Testimonials
  listTestimonials: () => apiGet<{ results: LandingTestimonial[] } | LandingTestimonial[]>('/admin/landing/testimonials/'),
  createTestimonial: (data: Partial<LandingTestimonial>) =>
    apiPost<LandingTestimonial>('/admin/landing/testimonials/', data),
  updateTestimonial: (id: number, data: Partial<LandingTestimonial>) =>
    apiPatch<LandingTestimonial>(`/admin/landing/testimonials/${id}/`, data),
  deleteTestimonial: (id: number) => apiDelete(`/admin/landing/testimonials/${id}/`),
  reorderTestimonials: (order: number[]) =>
    apiPost('/admin/landing/testimonials/reorder/', { order }),
  publishTestimonial: (id: number) =>
    apiPost<LandingTestimonial>(`/admin/landing/testimonials/${id}/publish/`, {}),
  unpublishTestimonial: (id: number) =>
    apiPost<LandingTestimonial>(`/admin/landing/testimonials/${id}/unpublish/`, {}),

  // FAQ
  listFaq: () => apiGet<{ results: LandingFaqItem[] } | LandingFaqItem[]>('/admin/landing/faq/'),
  createFaq: (data: Partial<LandingFaqItem>) =>
    apiPost<LandingFaqItem>('/admin/landing/faq/', data),
  updateFaq: (id: number, data: Partial<LandingFaqItem>) =>
    apiPatch<LandingFaqItem>(`/admin/landing/faq/${id}/`, data),
  deleteFaq: (id: number) => apiDelete(`/admin/landing/faq/${id}/`),
  reorderFaq: (order: number[]) => apiPost('/admin/landing/faq/reorder/', { order }),
  publishFaq: (id: number) =>
    apiPost<LandingFaqItem>(`/admin/landing/faq/${id}/publish/`, {}),
  unpublishFaq: (id: number) =>
    apiPost<LandingFaqItem>(`/admin/landing/faq/${id}/unpublish/`, {}),

  // ChangeLog
  listChangeLog: (params?: { model?: string; object_id?: number }) => {
    const qs = new URLSearchParams()
    if (params?.model) qs.set('model', params.model)
    if (params?.object_id) qs.set('object_id', String(params.object_id))
    return apiGet<{ results: ChangeLogEntry[] } | ChangeLogEntry[]>(
      `/admin/landing/changelog/${qs.toString() ? '?' + qs : ''}`
    )
  },
}

export function unwrapList<T>(res: { results: T[] } | T[]): T[] {
  return Array.isArray(res) ? res : res.results || []
}
