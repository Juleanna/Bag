import { ItemsManager } from './ItemsManager'
import { Field } from './AdminHero'
import { TranslatableInput } from './TranslatableInput'
import { landingAdmin, t } from '../../api/landing'
import type { LandingMetric } from '../../api/landing'

export function AdminMetrics() {
  return (
    <ItemsManager<LandingMetric>
      title="Метрики"
      subtitle="Великі числа в секції метрик. Value — короткий запис, label — підпис."
      itemName="Метрика"
      list={landingAdmin.listMetrics}
      create={landingAdmin.createMetric}
      update={landingAdmin.updateMetric}
      remove={landingAdmin.deleteMetric}
      reorder={landingAdmin.reorderMetrics}
      publish={landingAdmin.publishMetric}
      unpublish={landingAdmin.unpublishMetric}
      newItemDefaults={{
        value: '0',
        label: { uk: 'Нова метрика', en: '' },
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div>
          <b style={{ fontSize: 13 }}>{item.value || '?'}</b>
          <span style={{ marginLeft: 8, color: 'var(--fg-3)', fontSize: 12 }}>
            {t(item.label)}
          </span>
        </div>
      )}
      renderItemForm={(item, update) => (
        <>
          <div className="admin-grid-2">
            <Field label="Value" value={item.value} onChange={v => update({ value: v })} />
          </div>
          <TranslatableInput label="Label" value={item.label} onChange={v => update({ label: v })} />
        </>
      )}
    />
  )
}
