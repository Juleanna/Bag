import { useEffect, useState } from 'react'
import { Ic } from '../../icons/Ic'
import { landingAdmin } from '../../api/landing'
import type { Lang, LandingSettings, LangText } from '../../api/landing'
import { useToast } from '../../context/ToastContext'
import { useLanding } from '../../context/LandingContext'
import { Field, SaveBar } from './AdminHero'
import { TranslatableInput } from './TranslatableInput'
import { Toggle } from './Toggle'

export function AdminSettings() {
  const toast = useToast()
  const { refresh } = useLanding()
  const [settings, setSettings] = useState<LandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      setSettings(await landingAdmin.getSettings())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const update = <K extends keyof LandingSettings>(key: K, value: LandingSettings[K]) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
  }
  const updateTrans = (key: keyof LandingSettings) => (next: Record<Lang, string>) => {
    update(key, next as never)
  }

  const stripMeta = (s: LandingSettings) => {
    const { has_draft: _hd, draft_data: _dd, updated_at: _ua, ...rest } = s
    void _hd
    void _dd
    void _ua
    return rest
  }

  const saveLive = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await landingAdmin.updateSettings(stripMeta(settings))
      setSettings(updated)
      toast.show('Опубліковано', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveDraft = async () => {
    if (!settings) return
    setSaving(true)
    try {
      const updated = await landingAdmin.saveDraftSettings(stripMeta(settings))
      setSettings(updated)
      toast.show('Чорновик збережено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const publishDraft = async () => {
    setSaving(true)
    try {
      const updated = await landingAdmin.publishDraftSettings()
      setSettings(updated)
      toast.show('Чорновик опубліковано', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const discardDraft = async () => {
    if (!confirm('Скасувати чорновик?')) return
    setSaving(true)
    try {
      await landingAdmin.discardDraftSettings()
      void reload()
      toast.show('Чорновик скасовано', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="bt-spinner" />
  if (!settings) return <div>Не вдалось завантажити налаштування</div>

  const SECTION_TOGGLES: { key: keyof LandingSettings; label: string }[] = [
    { key: 'show_features', label: 'Можливості' },
    { key: 'show_use_cases', label: 'Для кого' },
    { key: 'show_metrics', label: 'Метрики' },
    { key: 'show_integrations', label: 'Інтеграції' },
    { key: 'show_testimonials', label: 'Відгуки' },
    { key: 'show_faq', label: 'FAQ' },
    { key: 'show_cta_strip', label: 'CTA-strip' },
  ]

  return (
    <>
      <h1>Налаштування лендінгу</h1>
      <p className="sub">Видимість секцій + заголовки + CTA-strip + footer.</p>

      {settings.has_draft && (
        <div
          style={{
            background: 'var(--st-progress-bg)',
            color: 'var(--st-progress-fg)',
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
          }}
        >
          <Ic.Edit sz={14} />
          <span style={{ flex: 1 }}>Є незбережений чорновик.</span>
          <button className="btn primary sm" onClick={publishDraft} disabled={saving}>
            Опублікувати чорновик
          </button>
          <button className="btn sm" onClick={discardDraft} disabled={saving}>
            Скасувати
          </button>
        </div>
      )}

      <div className="admin-form-section">
        <h3>Видимість секцій</h3>
        {SECTION_TOGGLES.map(t => (
          <div key={t.key} className="admin-toggle-row">
            <span>{t.label}</span>
            <Toggle
              checked={Boolean(settings[t.key])}
              onChange={v => update(t.key, v as never)}
            />
          </div>
        ))}
      </div>

      <div className="admin-form-section">
        <h3>Заголовки секцій</h3>
        <SectionHeader
          prefix="Можливості"
          kicker={settings.features_kicker}
          title={settings.features_title}
          subtitle={settings.features_subtitle}
          onChangeKicker={updateTrans('features_kicker')}
          onChangeTitle={updateTrans('features_title')}
          onChangeSubtitle={updateTrans('features_subtitle')}
        />
        <SectionHeader
          prefix="Для кого"
          kicker={settings.use_cases_kicker}
          title={settings.use_cases_title}
          subtitle={settings.use_cases_subtitle}
          onChangeKicker={updateTrans('use_cases_kicker')}
          onChangeTitle={updateTrans('use_cases_title')}
          onChangeSubtitle={updateTrans('use_cases_subtitle')}
        />
        <SectionHeader
          prefix="Інтеграції"
          kicker={settings.integrations_kicker}
          title={settings.integrations_title}
          subtitle={settings.integrations_subtitle}
          onChangeKicker={updateTrans('integrations_kicker')}
          onChangeTitle={updateTrans('integrations_title')}
          onChangeSubtitle={updateTrans('integrations_subtitle')}
        />
        <SectionHeader
          prefix="Відгуки"
          kicker={settings.testimonials_kicker}
          title={settings.testimonials_title}
          onChangeKicker={updateTrans('testimonials_kicker')}
          onChangeTitle={updateTrans('testimonials_title')}
        />
        <SectionHeader
          prefix="FAQ"
          kicker={settings.faq_kicker}
          title={settings.faq_title}
          onChangeKicker={updateTrans('faq_kicker')}
          onChangeTitle={updateTrans('faq_title')}
        />
      </div>

      <div className="admin-form-section">
        <h3>CTA-strip</h3>
        <TranslatableInput
          label="Заголовок"
          value={settings.cta_title}
          onChange={updateTrans('cta_title')}
        />
        <TranslatableInput
          label="Підзаголовок"
          value={settings.cta_subtitle}
          onChange={updateTrans('cta_subtitle')}
          textarea
        />
        <div className="admin-grid-2">
          <TranslatableInput
            label="Primary текст"
            value={settings.cta_primary_text}
            onChange={updateTrans('cta_primary_text')}
          />
          <Field
            label="Primary посилання"
            value={settings.cta_primary_link}
            onChange={v => update('cta_primary_link', v)}
          />
          <TranslatableInput
            label="Secondary текст"
            value={settings.cta_secondary_text}
            onChange={updateTrans('cta_secondary_text')}
          />
          <Field
            label="Secondary посилання"
            value={settings.cta_secondary_link}
            onChange={v => update('cta_secondary_link', v)}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Footer</h3>
        <TranslatableInput
          label="Опис бренду"
          value={settings.footer_brand_text}
          onChange={updateTrans('footer_brand_text')}
          textarea
        />
        <TranslatableInput
          label="Підпис унизу"
          value={settings.footer_copyright}
          onChange={updateTrans('footer_copyright')}
        />
      </div>

      <SaveBar saving={saving} onSaveDraft={saveDraft} onPublish={saveLive} />
    </>
  )
}

interface SectionHeaderProps {
  prefix: string
  kicker: LangText
  title: LangText
  subtitle?: LangText
  onChangeKicker: (v: Record<Lang, string>) => void
  onChangeTitle: (v: Record<Lang, string>) => void
  onChangeSubtitle?: (v: Record<Lang, string>) => void
}

function SectionHeader({
  prefix,
  kicker,
  title,
  subtitle,
  onChangeKicker,
  onChangeTitle,
  onChangeSubtitle,
}: SectionHeaderProps) {
  return (
    <div
      style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--divider)' }}
    >
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-3)',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        {prefix}
      </div>
      <div className="admin-grid-2">
        <TranslatableInput label="Kicker" value={kicker} onChange={onChangeKicker} />
        <TranslatableInput label="Заголовок" value={title} onChange={onChangeTitle} />
      </div>
      {subtitle !== undefined && onChangeSubtitle && (
        <TranslatableInput
          label="Підзаголовок"
          value={subtitle}
          onChange={onChangeSubtitle}
          textarea
        />
      )}
    </div>
  )
}
