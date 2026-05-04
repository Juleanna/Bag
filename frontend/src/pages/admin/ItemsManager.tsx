import { useEffect, useState } from 'react'
import { Ic } from '../../icons/Ic'
import { unwrapList } from '../../api/landing'
import type { BaseItem } from '../../api/landing'
import { useToast } from '../../context/ToastContext'
import { useLanding } from '../../context/LandingContext'
import { Toggle } from './Toggle'
import { useDragReorder } from './useDragReorder'

interface ItemsManagerProps<T extends BaseItem> {
  /** Заголовок сторінки */
  title: string
  /** Підзаголовок */
  subtitle?: string
  /** Назва типу для текстів ("Можливість", "Інтеграція" …) */
  itemName: string

  /** API: список */
  list: () => Promise<{ results: T[] } | T[]>
  /** API: створити */
  create: (data: Partial<T>) => Promise<T>
  /** API: оновити */
  update: (id: number, data: Partial<T>) => Promise<T>
  /** API: видалити */
  remove: (id: number) => Promise<void>
  /** API: змінити порядок */
  reorder: (order: number[]) => Promise<unknown>
  /** API: опублікувати */
  publish: (id: number) => Promise<T>
  /** API: зняти з публікації */
  unpublish: (id: number) => Promise<T>

  /** Дефолтні значення для нового item */
  newItemDefaults: Partial<T>

  /** Render функція для тіла картки (саме форма редагування) */
  renderItemForm: (item: T, update: (patch: Partial<T>) => void) => React.ReactNode

  /** Відображення зведення (заголовок картки) */
  renderItemTitle: (item: T) => React.ReactNode
}

/** Універсальна сторінка адмінки для items-секції з DnD-сортуванням. */
export function ItemsManager<T extends BaseItem>({
  title,
  subtitle,
  itemName,
  list,
  create,
  update,
  remove,
  reorder,
  publish,
  unpublish,
  newItemDefaults,
  renderItemForm,
  renderItemTitle,
}: ItemsManagerProps<T>) {
  const toast = useToast()
  const { refresh } = useLanding()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const res = await list()
        setItems(unwrapList(res))
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dnd = useDragReorder<T>(items, async newItems => {
    setItems(newItems)
    try {
      await reorder(newItems.map(i => i.id))
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка сортування', 'error')
    }
  })

  const updateLocal = (id: number, patch: Partial<T>) => {
    setItems(items => items.map(i => (i.id === id ? { ...i, ...patch } : i)))
  }

  const saveItem = async (item: T) => {
    setSaving(true)
    try {
      const updated = await update(item.id, item)
      updateLocal(updated.id, updated)
      toast.show(`${itemName} збережено`, 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const removeItem = async (id: number) => {
    if (!confirm(`Видалити ${itemName.toLowerCase()}?`)) return
    try {
      await remove(id)
      setItems(items => items.filter(i => i.id !== id))
      toast.show(`${itemName} видалено`, 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const addItem = async () => {
    try {
      const created = await create({
        ...newItemDefaults,
        position: items.length,
      } as Partial<T>)
      setItems(items => [...items, created])
      setOpenId(created.id)
      toast.show(`${itemName} створено (як чорновик — натисніть Опублікувати)`, 'info')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const togglePublish = async (item: T) => {
    try {
      const updated = item.is_published
        ? await unpublish(item.id)
        : await publish(item.id)
      updateLocal(updated.id, updated)
      toast.show(item.is_published ? 'Знято з публікації' : 'Опубліковано', 'success')
      void refresh()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading) return <div className="bt-spinner" />

  return (
    <>
      <h1>{title}</h1>
      {subtitle && <p className="sub">{subtitle}</p>}

      {items.length === 0 && (
        <div className="empty">
          <Ic.Layout sz={32} />
          <h4>Поки немає елементів</h4>
          <p>Натисніть "+ Додати", щоб створити перший</p>
        </div>
      )}

      {items.map(item => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className={`admin-item-card ${dnd.isDragging(item.id) ? 'dragging' : ''} ${
              dnd.overId === item.id ? 'drag-over' : ''
            }`}
            {...dnd.handlers(item.id)}
          >
            <div className="admin-item-head">
              <span className="drag-handle" title="Перетягніть для сортування">
                <Ic.Sort sz={14} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>{renderItemTitle(item)}</div>
              {/* Бейдж статусу */}
              <span
                className={`pill ${item.is_published ? 'resolved' : 'progress'}`}
                title={item.is_published ? 'Опубліковано' : 'Чорновик'}
              >
                <span
                  className="dot"
                  style={{
                    background: item.is_published
                      ? 'var(--st-resolved-dot)'
                      : 'var(--st-progress-dot)',
                  }}
                />
                {item.is_published ? 'Live' : 'Draft'}
              </span>
              <button
                className="btn sm"
                onClick={() => togglePublish(item)}
                title={item.is_published ? 'Зняти з публікації' : 'Опублікувати'}
              >
                {item.is_published ? 'Зняти' : 'Опубл.'}
              </button>
              <Toggle
                checked={item.is_visible}
                onChange={v => updateLocal(item.id, { is_visible: v } as Partial<T>)}
              />
              <button
                className="btn ghost icon sm"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                title={isOpen ? 'Згорнути' : 'Редагувати'}
              >
                {isOpen ? <Ic.ChevUp sz={12} /> : <Ic.ChevDown sz={12} />}
              </button>
              <button
                className="btn ghost icon sm"
                onClick={() => removeItem(item.id)}
                title="Видалити"
              >
                <Ic.Trash sz={12} />
              </button>
            </div>

            {isOpen && (
              <>
                {renderItemForm(item, patch => updateLocal(item.id, patch))}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button className="btn primary sm" onClick={() => saveItem(item)} disabled={saving}>
                    {saving ? 'Збереження…' : 'Зберегти'}
                  </button>
                </div>
              </>
            )}
          </div>
        )
      })}

      <button className="btn" onClick={addItem} style={{ marginTop: 16 }}>
        <Ic.Plus sz={13} /> Додати {itemName.toLowerCase()}
      </button>
    </>
  )
}
