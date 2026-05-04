import { ItemsManager } from './ItemsManager'
import { TranslatableInput } from './TranslatableInput'
import { Toggle } from './Toggle'
import { landingAdmin, t } from '../../api/landing'
import type { ColorVariant, IconName, LandingFeature } from '../../api/landing'
import { ICON_OPTIONS, COLOR_OPTIONS } from './options'

export function AdminFeatures() {
  return (
    <ItemsManager<LandingFeature>
      title="Можливості"
      subtitle="Картки секції 'Можливості'. Featured — займають 2 колонки в сітці."
      itemName="Можливість"
      list={landingAdmin.listFeatures}
      create={landingAdmin.createFeature}
      update={landingAdmin.updateFeature}
      remove={landingAdmin.deleteFeature}
      reorder={landingAdmin.reorderFeatures}
      publish={landingAdmin.publishFeature}
      unpublish={landingAdmin.unpublishFeature}
      newItemDefaults={{
        title: { uk: 'Нова можливість', en: '' },
        description: { uk: '', en: '' },
        icon: 'Bug' as IconName,
        color_variant: 'accent' as ColorVariant,
        featured: false,
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div>
          <b style={{ fontSize: 13 }}>{t(item.title) || '(без назви)'}</b>
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            {item.icon} · {item.color_variant} {item.featured && '· featured'}
          </div>
        </div>
      )}
      renderItemForm={(item, update) => (
        <>
          <TranslatableInput label="Назва" value={item.title} onChange={v => update({ title: v })} />
          <TranslatableInput
            label="Опис"
            value={item.description}
            onChange={v => update({ description: v })}
            textarea
          />
          <div className="admin-grid-2">
            <div className="field">
              <label>Іконка</label>
              <select
                className="inp"
                value={item.icon}
                onChange={e => update({ icon: e.target.value as IconName })}
              >
                {ICON_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Колір</label>
              <select
                className="inp"
                value={item.color_variant}
                onChange={e => update({ color_variant: e.target.value as ColorVariant })}
              >
                {COLOR_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="admin-toggle-row">
            <span>Featured (на 2 колонки)</span>
            <Toggle checked={item.featured} onChange={v => update({ featured: v })} />
          </div>
        </>
      )}
    />
  )
}
