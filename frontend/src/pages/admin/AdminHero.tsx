import { useEffect, useState } from 'react'
import { Ic } from '../../icons/Ic'
import { landingAdmin } from '../../api/landing'
import type { Lang, LandingHero } from '../../api/landing'
import { useToast } from '../../context/ToastContext'
import { useLanding } from '../../context/LandingContext'
import { TranslatableInput } from './TranslatableInput'

export function AdminHero() {
  const toast = useToast()
  const { refresh } = useLanding()
  const [hero, setHero] = useState<LandingHero | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const data = await landingAdmin.getHero()
      setHero(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [])

  const update = <K extends keyof LandingHero>(key: K, value: LandingHero[K]) => {
    if (!hero) return
    setHero({ ...hero, [key]: value })
  }

  const updateTrans = (key: keyof LandingHero) => (next: Record<Lang, string>) => {
    update(key, next as never)
  }

  const stripMeta = (h: LandingHero) => {
    const { has_draft: _hd, draft_data: _dd, updated_at: _ua, ...rest } = h
    void _hd
    void _dd
    void _ua
    return rest
  }

  const saveLive = async () => {
    if (!hero) return
    setSaving(true)
    try {
      const updated = await landingAdmin.updateHero(stripMeta(hero))
      setHero(updated)
      toast.show('Опубліковано', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveDraft = async () => {
    if (!hero) return
    setSaving(true)
    try {
      const updated = await landingAdmin.saveDraftHero(stripMeta(hero))
      setHero(updated)
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
      const updated = await landingAdmin.publishDraftHero()
      setHero(updated)
      toast.show('Чорновик опубліковано', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const discardDraft = async () => {
    if (!confirm('Скасувати чорновик? Усі незбережені зміни буде втрачено.')) return
    setSaving(true)
    try {
      await landingAdmin.discardDraftHero()
      toast.show('Чорновик скасовано', 'success')
      void reload()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="bt-spinner" />
  if (!hero) return <div>Не вдалось завантажити Hero</div>

  return (
    <>
      <h1>Hero блок</h1>
      <p className="sub">Головний банер на лендінгу — заголовок, описи, CTA-кнопки.</p>

      {hero.has_draft && (
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
          <span style={{ flex: 1 }}>
            Є незбережений чорновик. Опублікуйте або скасуйте, щоб продовжити.
          </span>
          <button className="btn primary sm" onClick={publishDraft} disabled={saving}>
            Опублікувати чорновик
          </button>
          <button className="btn sm" onClick={discardDraft} disabled={saving}>
            Скасувати
          </button>
        </div>
      )}

      <div className="admin-form-section">
        <h3>Eyebrow (рядок над заголовком)</h3>
        <div className="admin-grid-2">
          <Field label="Бейдж" value={hero.eyebrow_badge} onChange={v => update('eyebrow_badge', v)} />
          <Field
            label="Версія / другий бейдж"
            value={hero.eyebrow_version}
            onChange={v => update('eyebrow_version', v)}
          />
          <TranslatableInput
            full
            label="Текст"
            value={hero.eyebrow_text}
            onChange={updateTrans('eyebrow_text')}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Заголовок</h3>
        <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 0 }}>
          Заголовок розбитий на 3 частини. <b>title_accent</b> — градієнтний акцент.
        </p>
        <div className="admin-grid-2">
          <TranslatableInput label="Title A" value={hero.title_a} onChange={updateTrans('title_a')} />
          <TranslatableInput
            label="Title Accent (градієнт)"
            value={hero.title_accent}
            onChange={updateTrans('title_accent')}
          />
          <TranslatableInput full label="Title B" value={hero.title_b} onChange={updateTrans('title_b')} />
        </div>
        <TranslatableInput label="Підзаголовок (lede)" value={hero.lede} onChange={updateTrans('lede')} textarea />
      </div>

      <div className="admin-form-section">
        <h3>CTA-кнопки</h3>
        <div className="admin-grid-2">
          <TranslatableInput
            label="Primary — текст"
            value={hero.primary_cta_text}
            onChange={updateTrans('primary_cta_text')}
          />
          <Field
            label="Primary — посилання"
            value={hero.primary_cta_link}
            onChange={v => update('primary_cta_link', v)}
          />
          <TranslatableInput
            label="Secondary — текст"
            value={hero.secondary_cta_text}
            onChange={updateTrans('secondary_cta_text')}
          />
          <Field
            label="Secondary — посилання"
            value={hero.secondary_cta_link}
            onChange={v => update('secondary_cta_link', v)}
          />
        </div>
      </div>

      <div className="admin-form-section">
        <h3>Чек-маркери під CTA</h3>
        <TranslatableInput label="Маркер 1" value={hero.foot_text_1} onChange={updateTrans('foot_text_1')} />
        <TranslatableInput label="Маркер 2" value={hero.foot_text_2} onChange={updateTrans('foot_text_2')} />
        <TranslatableInput label="Маркер 3" value={hero.foot_text_3} onChange={updateTrans('foot_text_3')} />
      </div>

      <SaveBar saving={saving} onSaveDraft={saveDraft} onPublish={saveLive} />
    </>
  )
}

export function SaveBar({
  saving,
  onSaveDraft,
  onPublish,
}: {
  saving: boolean
  onSaveDraft: () => void
  onPublish: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        position: 'sticky',
        bottom: 0,
        paddingTop: 12,
        paddingBottom: 12,
        background: 'var(--bg)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <button className="btn" onClick={onSaveDraft} disabled={saving}>
        {saving ? '…' : 'Зберегти як чорновик'}
      </button>
      <button className="btn primary" onClick={onPublish} disabled={saving}>
        {saving ? 'Збереження…' : 'Опублікувати'}
      </button>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  textarea?: boolean
  full?: boolean
}

export function Field({ label, value, onChange, textarea, full }: FieldProps) {
  return (
    <div className="field" style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label>{label}</label>
      {textarea ? (
        <textarea
          className="inp"
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
        />
      ) : (
        <input className="inp" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  )
}
