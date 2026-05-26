/**
 * Створення нового шаблону — за прототипом «Шаблони / Новий».
 *
 * Блоки:
 *  - Тип (3 картки: Баг / Тест-кейс / Test Run)
 *  - Метадані (Назва, Опис, Теги)
 *  - Поля шаблону (динамічний список з типами і прапорцем «обовʼязкове»)
 *  - Доступність (Тільки я / Простір / Публічний)
 *  - Кнопки внизу: Скасувати / Передогляд / Створити шаблон
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api as extras } from '../api/extras'
import type {
  TemplateField,
  TemplateKind,
  TemplateVisibility,
} from '../api/extras'
import { useToast } from '../context/ToastContext'

interface KindOption {
  k: TemplateKind
  icon: keyof typeof Ic
  title: string
  desc: string
}

const KIND_OPTIONS: KindOption[] = [
  { k: 'bug', icon: 'Bug', title: 'Баг', desc: 'Шаблон для звіту про дефект' },
  { k: 'test_case', icon: 'Beaker', title: 'Тест-кейс', desc: 'Сценарій з кроками' },
  { k: 'test_run', icon: 'Play', title: 'Test Run', desc: 'Набір кейсів для прогону' },
]

// Дефолтні поля за типом — щоб користувач не починав з порожнього списку.
const DEFAULT_FIELDS: Record<TemplateKind, TemplateField[]> = {
  bug: [
    { name: 'steps', label: 'Кроки відтворення', type: 'textarea', required: true },
    { name: 'expected', label: 'Очікуваний результат', type: 'textarea', required: true },
    { name: 'actual', label: 'Фактичний результат', type: 'textarea', required: true },
    { name: 'env', label: 'Середовище', type: 'select', options: ['Production', 'Staging', 'Local'] },
  ],
  test_case: [
    { name: 'preconditions', label: 'Передумови', type: 'textarea', required: false },
    { name: 'steps', label: 'Кроки', type: 'textarea', required: true },
    { name: 'expected', label: 'Очікуваний результат', type: 'textarea', required: true },
  ],
  test_run: [
    { name: 'cases', label: 'Кейси для прогону', type: 'textarea', required: true },
    { name: 'browsers', label: 'Браузери', type: 'text', required: false },
  ],
}

const FIELD_TYPES: { v: TemplateField['type']; label: string }[] = [
  { v: 'text', label: 'Малий текст' },
  { v: 'textarea', label: 'Великий текст' },
  { v: 'number', label: 'Число' },
  { v: 'select', label: 'Список' },
]

export function NewTemplatePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [kind, setKind] = useState<TemplateKind>('bug')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [fields, setFields] = useState<TemplateField[]>(DEFAULT_FIELDS.bug)
  const [visibility, setVisibility] = useState<TemplateVisibility>('space')
  const [saving, setSaving] = useState(false)

  const onKindChange = (k: TemplateKind) => {
    setKind(k)
    // При зміні типу — підставляємо дефолтні поля, але лише якщо користувач
    // ще не редагував список (порівнюємо з попереднім дефолтом).
    setFields(prev => {
      const prevDefault = DEFAULT_FIELDS[kind]
      const sameAsDefault =
        prev.length === prevDefault.length &&
        prev.every((f, i) => f.name === prevDefault[i].name && f.label === prevDefault[i].label)
      return sameAsDefault ? DEFAULT_FIELDS[k] : prev
    })
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t) return
    if (!tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(tags.filter(x => x !== t))

  const addField = () => {
    setFields([...fields, { name: `field_${fields.length + 1}`, label: '', type: 'text' }])
  }
  const updateField = (i: number, patch: Partial<TemplateField>) => {
    setFields(arr => arr.map((f, idx) => (idx === i ? { ...f, ...patch } : f)))
  }
  const removeField = (i: number) => setFields(arr => arr.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (!name.trim()) {
      toast.show('Введіть назву шаблону', 'error')
      return
    }
    setSaving(true)
    try {
      await extras.createTemplate({
        name: name.trim(),
        description: description.trim(),
        kind,
        tags,
        visibility,
        custom_fields_schema: fields.filter(f => f.label.trim()),
      })
      toast.show('Шаблон створено', 'success')
      navigate('/templates')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 4 }}>Новий шаблон</h1>
        <p style={{ color: 'var(--fg-3)', marginTop: 0, marginBottom: 24 }}>
          Шаблони прискорюють створення багів, тест-кейсів і runs.
        </p>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Тип</h3>
          <div className="kind-picker">
            {KIND_OPTIONS.map(o => {
              const Icn = Ic[o.icon] as typeof Ic.Bug
              return (
                <button
                  key={o.k}
                  type="button"
                  className={`kind-card ${kind === o.k ? 'active' : ''}`}
                  onClick={() => onKindChange(o.k)}
                >
                  <Icn sz={18} />
                  <b>{o.title}</b>
                  <span>{o.desc}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Метадані</h3>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Назва шаблону</label>
            <input
              className="inp"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Наприклад: Краш-репорт мобільного"
              maxLength={120}
            />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>Опис</label>
            <textarea
              className="inp"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Коли і як використовувати цей шаблон"
              style={{ resize: 'vertical' }}
            />
          </div>
          <div className="field">
            <label>Теги</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {tags.map(t => (
                <span key={t} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {t}
                  <button
                    type="button"
                    className="btn ghost icon sm"
                    onClick={() => removeTag(t)}
                    title="Прибрати"
                  >
                    <Ic.X sz={9} />
                  </button>
                </span>
              ))}
              <input
                className="inp"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="тег…"
                style={{ width: 140 }}
              />
              <button type="button" className="btn sm" onClick={addTag}>
                <Ic.Plus sz={11} /> Тег
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0 }}>
              Поля шаблону{' '}
              <span className="count">{fields.length}</span>
            </h3>
            <button type="button" className="btn sm" onClick={addField}>
              <Ic.Plus sz={11} /> Додати поле
            </button>
          </div>
          <div className="template-fields">
            {fields.map((f, i) => (
              <div key={i} className="template-field-row">
                <Ic.Sort sz={12} />
                <input
                  className="inp"
                  value={f.label}
                  onChange={e => updateField(i, { label: e.target.value })}
                  placeholder="Назва поля"
                />
                <select
                  className="inp"
                  value={f.type}
                  onChange={e => updateField(i, { type: e.target.value as TemplateField['type'] })}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.v} value={t.v}>{t.label}</option>
                  ))}
                </select>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!f.required}
                    onChange={e => updateField(i, { required: e.target.checked })}
                  />
                  обовʼязкове
                </label>
                <button
                  type="button"
                  className="btn ghost icon sm"
                  onClick={() => removeField(i)}
                  title="Видалити поле"
                >
                  <Ic.X sz={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding: 18, marginBottom: 16 }}>
          <h3 style={{ margin: 0, marginBottom: 12 }}>Доступність</h3>
          <div className="visibility-cards">
            {(
              [
                { v: 'me', icon: 'User', label: 'Тільки я' },
                { v: 'space', icon: 'Layout', label: 'Простір' },
                { v: 'public', icon: 'Globe', label: 'Публічний' },
              ] as { v: TemplateVisibility; icon: keyof typeof Ic; label: string }[]
            ).map(o => {
              const Icn = Ic[o.icon] as typeof Ic.User
              return (
                <button
                  key={o.v}
                  type="button"
                  className={`vis-card ${visibility === o.v ? 'active' : ''}`}
                  onClick={() => setVisibility(o.v)}
                >
                  <Icn sz={14} />
                  <span>{o.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 8,
            paddingBottom: 24,
          }}
        >
          <button type="button" className="btn" onClick={() => navigate('/templates')}>
            Скасувати
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn"
              onClick={() => toast.show('Передогляд у плані', 'info')}
            >
              <Ic.Eye sz={11} /> Передогляд
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={saving}
              onClick={submit}
            >
              <Ic.Check sz={11} /> {saving ? 'Збереження…' : 'Створити шаблон'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
