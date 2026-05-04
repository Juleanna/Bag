import { useRef } from 'react'
import { ItemsManager } from './ItemsManager'
import { Field } from './AdminHero'
import { Ic } from '../../icons/Ic'
import { landingAdmin } from '../../api/landing'
import { useToast } from '../../context/ToastContext'
import { useLanding } from '../../context/LandingContext'
import type { LandingIntegration } from '../../api/landing'

export function AdminIntegrations() {
  return (
    <ItemsManager<LandingIntegration>
      title="Інтеграції"
      subtitle="Тайли в секції 'Інтеграції'. Якщо завантажити логотип — він замінить mark/color."
      itemName="Інтеграція"
      list={landingAdmin.listIntegrations}
      create={landingAdmin.createIntegration}
      update={landingAdmin.updateIntegration}
      remove={landingAdmin.deleteIntegration}
      reorder={landingAdmin.reorderIntegrations}
      publish={landingAdmin.publishIntegration}
      unpublish={landingAdmin.unpublishIntegration}
      newItemDefaults={{
        name: 'Нова інтеграція',
        mark: '??',
        color: '#5E6AD2',
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt={item.name}
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                objectFit: 'contain',
              }}
            />
          ) : (
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: item.color,
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 11,
              }}
            >
              {item.mark}
            </span>
          )}
          <b style={{ fontSize: 13 }}>{item.name || '(без назви)'}</b>
        </div>
      )}
      renderItemForm={(item, update) => (
        <IntegrationForm item={item} update={update} />
      )}
    />
  )
}

function IntegrationForm({
  item,
  update,
}: {
  item: LandingIntegration
  update: (patch: Partial<LandingIntegration>) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const { refresh } = useLanding()

  const handleUpload = async (file: File) => {
    try {
      const updated = await landingAdmin.uploadIntegrationLogo(item.id, file)
      update(updated)
      toast.show('Логотип завантажено', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка завантаження', 'error')
    }
  }

  const handleRemoveLogo = async () => {
    try {
      const updated = await landingAdmin.removeIntegrationLogo(item.id)
      update(updated)
      toast.show('Логотип видалено', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  return (
    <div className="admin-grid-2">
      <Field label="Назва" value={item.name} onChange={v => update({ name: v })} />
      <Field
        label="Mark (2 літери, якщо немає логотипу)"
        value={item.mark}
        onChange={v => update({ mark: v.slice(0, 4) })}
      />
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Колір (HEX, якщо немає логотипу)</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="color"
            value={item.color}
            onChange={e => update({ color: e.target.value })}
            style={{ width: 40, height: 32 }}
          />
          <input
            className="inp"
            value={item.color}
            onChange={e => update({ color: e.target.value })}
            style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label>Логотип</label>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {item.logo_url ? (
            <img
              src={item.logo_url}
              alt={item.name}
              style={{
                width: 48,
                height: 48,
                objectFit: 'contain',
                background: 'var(--bg-2)',
                borderRadius: 8,
                border: '1px solid var(--border)',
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: 'var(--bg-2)',
                border: '1px dashed var(--border-strong)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--fg-4)',
              }}
            >
              <Ic.Image sz={20} />
            </div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleUpload(file)
            }}
          />
          <button
            className="btn sm"
            onClick={() => fileInput.current?.click()}
            type="button"
          >
            <Ic.Upload sz={12} /> {item.logo_url ? 'Змінити' : 'Завантажити'}
          </button>
          {item.logo_url && (
            <button className="btn sm ghost" onClick={handleRemoveLogo} type="button">
              <Ic.Trash sz={12} /> Видалити
            </button>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
          PNG / JPG / WEBP / SVG. Якщо є логотип — він замінює mark/color у тайлі.
        </span>
      </div>
    </div>
  )
}
