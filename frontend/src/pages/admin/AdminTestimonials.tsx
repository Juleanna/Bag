import { ItemsManager } from './ItemsManager'
import { Field } from './AdminHero'
import { TranslatableInput } from './TranslatableInput'
import { Toggle } from './Toggle'
import { landingAdmin, t } from '../../api/landing'
import type { LandingTestimonial } from '../../api/landing'

export function AdminTestimonials() {
  return (
    <ItemsManager<LandingTestimonial>
      title="Відгуки"
      subtitle="Featured-картка має градієнтний фон (рекомендовано 1 з 3)."
      itemName="Відгук"
      list={landingAdmin.listTestimonials}
      create={landingAdmin.createTestimonial}
      update={landingAdmin.updateTestimonial}
      remove={landingAdmin.deleteTestimonial}
      reorder={landingAdmin.reorderTestimonials}
      publish={landingAdmin.publishTestimonial}
      unpublish={landingAdmin.unpublishTestimonial}
      newItemDefaults={{
        quote: { uk: '', en: '' },
        author_name: 'Автор',
        author_role: { uk: 'Посада, Компанія', en: '' },
        avatar_initials: '??',
        avatar_color: '#5E6AD2',
        featured: false,
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: item.avatar_color,
              color: 'white',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            {item.avatar_initials}
          </span>
          <div>
            <b style={{ fontSize: 13 }}>{item.author_name}</b>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{t(item.author_role)}</div>
          </div>
        </div>
      )}
      renderItemForm={(item, update) => (
        <>
          <TranslatableInput
            label="Цитата"
            value={item.quote}
            onChange={v => update({ quote: v })}
            textarea
          />
          <div className="admin-grid-2">
            <Field
              label="Імʼя автора"
              value={item.author_name}
              onChange={v => update({ author_name: v })}
            />
            <TranslatableInput
              label="Посада"
              value={item.author_role}
              onChange={v => update({ author_role: v })}
            />
            <Field
              label="Ініціали (2 літери)"
              value={item.avatar_initials}
              onChange={v => update({ avatar_initials: v.slice(0, 4) })}
            />
            <div className="field">
              <label>Колір аватара</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="color"
                  value={item.avatar_color}
                  onChange={e => update({ avatar_color: e.target.value })}
                  style={{ width: 40, height: 32 }}
                />
                <input
                  className="inp"
                  value={item.avatar_color}
                  onChange={e => update({ avatar_color: e.target.value })}
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>
          <div className="admin-toggle-row">
            <span>Featured (градієнтний фон)</span>
            <Toggle checked={item.featured} onChange={v => update({ featured: v })} />
          </div>
        </>
      )}
    />
  )
}
