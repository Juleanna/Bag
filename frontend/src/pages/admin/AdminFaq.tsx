import { ItemsManager } from './ItemsManager'
import { TranslatableInput } from './TranslatableInput'
import { landingAdmin, t } from '../../api/landing'
import type { LandingFaqItem } from '../../api/landing'

export function AdminFaq() {
  return (
    <ItemsManager<LandingFaqItem>
      title="FAQ"
      subtitle="Питання-відповіді у нижній частині лендінгу."
      itemName="Питання"
      list={landingAdmin.listFaq}
      create={landingAdmin.createFaq}
      update={landingAdmin.updateFaq}
      remove={landingAdmin.deleteFaq}
      reorder={landingAdmin.reorderFaq}
      publish={landingAdmin.publishFaq}
      unpublish={landingAdmin.unpublishFaq}
      newItemDefaults={{
        question: { uk: 'Нове питання?', en: '' },
        answer: { uk: '', en: '' },
        is_visible: true,
        is_published: false,
      }}
      renderItemTitle={item => (
        <div>
          <b style={{ fontSize: 13 }}>{t(item.question) || '(без питання)'}</b>
        </div>
      )}
      renderItemForm={(item, update) => (
        <>
          <TranslatableInput
            label="Питання"
            value={item.question}
            onChange={v => update({ question: v })}
          />
          <TranslatableInput
            label="Відповідь"
            value={item.answer}
            onChange={v => update({ answer: v })}
            textarea
          />
        </>
      )}
    />
  )
}
