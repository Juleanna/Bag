/**
 * Modal зі згенерованим test case-ом, що можна редагувати і зберегти
 * як справжній TestCase у проєкті.
 *
 * Backend: /api/ai/generate-test-case/ (rule-based з опису бага).
 */
import { useEffect, useState } from 'react'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { AIGeneratedTestCase } from '../api/extras'
import { useToast } from '../context/ToastContext'

export function AITestCaseModal({
  issueId,
  projectId,
  onClose,
  onCreated,
}: {
  issueId: number
  projectId: number
  onClose: () => void
  onCreated?: () => void
}) {
  const toast = useToast()
  const [data, setData] = useState<AIGeneratedTestCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [suites, setSuites] = useState<{ id: number; name: string }[]>([])
  const [suiteId, setSuiteId] = useState<number | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [gen, suiteList] = await Promise.all([
          api.aiGenerateTestCase(issueId),
          api.listTestSuites(projectId).catch(() => []),
        ])
        setData(gen)
        setSuites(suiteList)
        if (suiteList[0]) setSuiteId(suiteList[0].id)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueId, projectId])

  const save = async () => {
    if (!data) return
    if (!suiteId) {
      toast.show('Оберіть suite або створіть на сторінці тест-кейсів', 'error')
      return
    }
    setSaving(true)
    try {
      const cleanSteps = (data.steps || [])
        .map(s => ({ step: s.step.trim(), expected: s.expected.trim() }))
        .filter(s => s.step)
      await api.createTestCase({
        suite: suiteId,
        title: data.title,
        preconditions: data.preconditions,
        steps: cleanSteps,
        expected_result: data.expected_result,
        type: data.type,
        priority: data.priority,
      })
      toast.show('Тест-кейс створено', 'success')
      onCreated?.()
      onClose()
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (patch: Partial<AIGeneratedTestCase>) =>
    setData(d => (d ? { ...d, ...patch } : d))

  const updateStep = (i: number, patch: Partial<AIGeneratedTestCase['steps'][0]>) =>
    setData(d =>
      d
        ? {
            ...d,
            steps: d.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
          }
        : d
    )

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 1000,
        padding: 24,
      }}
    >
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Ic.AI sz={14} style={{ color: 'var(--accent-soft-fg)' }} />
            Згенерований тест-кейс
          </h2>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-3)' }}>
            Аналізую опис бага…
          </div>
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label className="form-lbl">Заголовок</label>
              <input
                className="inp"
                value={data.title}
                onChange={e => updateField({ title: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label className="form-lbl">Suite</label>
                <select
                  className="inp"
                  value={suiteId ?? ''}
                  onChange={e =>
                    setSuiteId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  {suites.length === 0 && <option value="">Немає suite</option>}
                  {suites.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-lbl">Пріоритет</label>
                <select
                  className="inp"
                  value={data.priority}
                  onChange={e =>
                    updateField({
                      priority: e.target.value as AIGeneratedTestCase['priority'],
                    })
                  }
                >
                  <option value="low">Низький</option>
                  <option value="medium">Середній</option>
                  <option value="high">Високий</option>
                  <option value="critical">Критичний</option>
                </select>
              </div>
            </div>
            <div>
              <label className="form-lbl">Передумови</label>
              <textarea
                className="inp"
                rows={2}
                value={data.preconditions}
                onChange={e => updateField({ preconditions: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div>
              <label className="form-lbl">Кроки</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.steps.map((s, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 1fr 1fr 28px', gap: 6, alignItems: 'center' }}>
                    <span style={{ color: 'var(--fg-4)', fontSize: 12, textAlign: 'right' }}>
                      {i + 1}.
                    </span>
                    <input
                      className="inp"
                      placeholder="Дія"
                      value={s.step}
                      onChange={e => updateStep(i, { step: e.target.value })}
                    />
                    <input
                      className="inp"
                      placeholder="Очікуваний результат"
                      value={s.expected}
                      onChange={e => updateStep(i, { expected: e.target.value })}
                    />
                    <button
                      type="button"
                      className="btn icon ghost sm"
                      onClick={() =>
                        setData(d =>
                          d ? { ...d, steps: d.steps.filter((_, idx) => idx !== i) } : d
                        )
                      }
                      title="Видалити"
                    >
                      <Ic.X sz={11} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() =>
                    setData(d =>
                      d ? { ...d, steps: [...d.steps, { step: '', expected: '' }] } : d
                    )
                  }
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Ic.Plus sz={11} /> Додати крок
                </button>
              </div>
            </div>
            <div>
              <label className="form-lbl">Очікуваний результат</label>
              <textarea
                className="inp"
                rows={2}
                value={data.expected_result}
                onChange={e => updateField({ expected_result: e.target.value })}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--fg-4)',
                fontStyle: 'italic',
              }}
            >
              Згенеровано алгоритмічно з опису бага. Перегляньте і відредагуйте
              перед збереженням.
            </div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                paddingTop: 12,
                borderTop: '1px solid var(--divider)',
              }}
            >
              <button className="btn" onClick={onClose}>
                Скасувати
              </button>
              <button
                className="btn primary"
                onClick={save}
                disabled={saving || !suiteId}
              >
                <Ic.Beaker sz={11} /> {saving ? 'Зберігаю…' : 'Створити тест-кейс'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
