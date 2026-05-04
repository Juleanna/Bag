import { ItemsManager } from './ItemsManager'
import { TranslatableInput } from './TranslatableInput'
import { landingAdmin, t } from '../../api/landing'
import type { ColorVariant, IconName, LandingUseCase } from '../../api/landing'
import { ICON_OPTIONS, COLOR_OPTIONS } from './options'

export function AdminUseCases() {
  return (
    <ItemsManager<LandingUseCase>
      title="Для кого"
      subtitle="Картки за ролями. Маркований список — один пункт на рядок."
      itemName="Use case"
      list={landingAdmin.listUseCases}
      create={landingAdmin.createUseCase}
      update={landingAdmin.updateUseCase}
      remove={landingAdmin.deleteUseCase}
      reorder={landingAdmin.reorderUseCases}
      publish={landingAdmin.publishUseCase}
      unpublish={landingAdmin.unpublishUseCase}
      newItemDefaults={{
        title: { uk: 'Нова роль', en: '' },
        description: { uk: '', en: '' },
        icon: 'User' as IconName,
        color_variant: 'accent' as ColorVariant,
        bullets: { uk: '', en: '' },
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div>
          <b style={{ fontSize: 13 }}>{t(item.title) || '(без назви)'}</b>
          <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            {item.icon} · {item.color_variant}
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
          <TranslatableInput
            label="Список пунктів (один на рядок)"
            value={item.bullets}
            onChange={v => update({ bullets: v })}
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
        </>
      )}
    />
  )
}
