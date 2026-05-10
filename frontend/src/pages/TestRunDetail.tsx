/**
 * Сторінка прогону тестового ран'у:
 *  - шапка з контролами: Запустити / Завершити / Перервати
 *  - прогрес-бар і лічильники pass/fail/skip
 *  - двоколонкова: ліворуч черга кейсів, праворуч — деталі обраного
 *  - швидкі дії pass/fail/blocked/skip + нотатки + посилання на баг
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { api } from '../api/extras'
import type { TestCase, TestResult, TestRun } from '../api/extras'
import { apiGet } from '../api/client'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'
import { Skeleton } from '../components/Skeleton'

type ResultKind = 'pass' | 'fail' | 'blocked' | 'skip' | 'pending'

const RESULT_META: Record<ResultKind, { label: string; cls: string; dot: string }> = {
  pass: { label: 'Pass', cls: 'resolved', dot: 'var(--st-resolved-dot)' },
  fail: { label: 'Fail', cls: 'open', dot: 'var(--st-open-dot)' },
  blocked: { label: 'Blocked', cls: 'blocked', dot: 'var(--st-blocked-dot)' },
  skip: { label: 'Skip', cls: 'closed', dot: 'var(--st-closed-dot)' },
  pending: { label: 'Pending', cls: 'closed', dot: 'var(--fg-4)' },
}

const RUN_STATUS_LABELS: Record<TestRun['status'], string> = {
  planned: 'Заплановано',
  in_progress: 'В процесі',
  completed: 'Завершено',
  aborted: 'Перервано',
}

export function TestRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const runId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()

  const [run, setRun] = useState<TestRun | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [cases, setCases] = useState<TestCase[]>([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const r = await apiGet<TestRun>(`/test-runs/${runId}/`)
      setRun(r)
      const [res, cs] = await Promise.all([
        api.listTestResults(runId),
        api.listTestCases({ project: r.project }),
      ])
      setResults(res)
      setCases(cs)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
      navigate('/runs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!runId) return
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  // Map test_case_id → TestCase для швидкого пошуку title/steps
  const caseMap = useMemo(() => {
    const m = new Map<number, TestCase>()
    cases.forEach(c => m.set(c.id, c))
    return m
  }, [cases])

  const stats = useMemo(() => {
    const pass = results.filter(r => r.result === 'pass').length
    const fail = results.filter(r => r.result === 'fail').length
    const blocked = results.filter(r => r.result === 'blocked').length
    const skip = results.filter(r => r.result === 'skip').length
    const pending = results.filter(r => r.result === 'pending').length
    const done = pass + fail + blocked + skip
    const total = results.length
    const pct = total === 0 ? 0 : Math.round((done / total) * 100)
    return { pass, fail, blocked, skip, pending, done, total, pct }
  }, [results])

  const activeResult = results[activeIdx]
  const activeCase = activeResult ? caseMap.get(activeResult.test_case) : null

  // При зміні активного — підтягуємо нотатку
  useEffect(() => {
    setNote(activeResult?.note || '')
  }, [activeResult?.id])

  const startRun = async () => {
    if (!run) return
    try {
      const r = await api.startTestRun(run.id)
      setRun(r)
      const res = await api.listTestResults(run.id)
      setResults(res)
      toast.show('Run запущено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const finishRun = async () => {
    if (!run) return
    const remaining = stats.pending
    if (remaining > 0) {
      const ok = await confirm({
        title: `Завершити з ${remaining} незапущеними кейсами?`,
        message:
          'Кейси, які залишились у статусі Pending, будуть позначені як Skipped.',
        confirmText: 'Завершити',
      })
      if (!ok) return
    }
    try {
      const r = await api.finishTestRun(run.id)
      setRun(r)
      void load()
      toast.show('Run завершено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const setResult = async (resultId: number, value: ResultKind) => {
    try {
      const updated = await api.updateTestResult(resultId, { result: value })
      setResults(rs => rs.map(r => (r.id === resultId ? updated : r)))
      // Автоматично переходимо до наступного pending-кейса
      if (value !== 'pending') {
        const idx = results.findIndex(r => r.id === resultId)
        const nextPending = results.findIndex(
          (r, i) => i > idx && r.result === 'pending'
        )
        if (nextPending !== -1) {
          setTimeout(() => setActiveIdx(nextPending), 200)
        }
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const saveNote = async () => {
    if (!activeResult) return
    if (note === activeResult.note) return
    try {
      const updated = await api.updateTestResult(activeResult.id, { note })
      setResults(rs => rs.map(r => (r.id === activeResult.id ? updated : r)))
      toast.show('Нотатку збережено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  if (loading || !run) {
    return (
      <div className="page" style={{ maxWidth: 1480 }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={400} />
        </div>
      </div>
    )
  }

  const status = run.status
  const isPlanned = status === 'planned'
  const isRunning = status === 'in_progress'

  return (
    <>
      {/* Шапка з контролами */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          flexWrap: 'wrap',
        }}
      >
        <button
          className="btn ghost icon"
          onClick={() => navigate('/runs')}
          title="Назад"
        >
          <Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            <span className="id-cell">TR-{run.id}</span> · {run.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
            {RUN_STATUS_LABELS[status]}
            {run.started_at && ` · стартовано ${new Date(run.started_at).toLocaleString('uk-UA')}`}
          </div>
        </div>

        {isPlanned && (
          <button className="btn primary" onClick={startRun}>
            <Ic.Play sz={12} /> Запустити
          </button>
        )}
        {isRunning && (
          <button className="btn primary" onClick={finishRun}>
            <Ic.Check sz={12} /> Завершити
          </button>
        )}

        {/* Прогрес */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 200,
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>
            {stats.done} / {stats.total} кейсів
          </span>
          <div
            style={{
              flex: 1,
              minWidth: 100,
              height: 8,
              background: 'var(--bg-2)',
              borderRadius: 999,
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${stats.total ? (stats.pass / stats.total) * 100 : 0}%`,
                background: 'var(--st-resolved-dot)',
              }}
            />
            <div
              style={{
                width: `${stats.total ? (stats.fail / stats.total) * 100 : 0}%`,
                background: 'var(--st-open-dot)',
              }}
            />
            <div
              style={{
                width: `${stats.total ? (stats.skip / stats.total) * 100 : 0}%`,
                background: 'var(--st-closed-dot)',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              minWidth: 40,
              textAlign: 'right',
            }}
          >
            {stats.pct}%
          </span>
        </div>

        <span
          style={{
            display: 'flex',
            gap: 12,
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <span style={{ color: 'var(--st-resolved-fg)' }}>● {stats.pass} pass</span>
          <span style={{ color: 'var(--st-open-fg)' }}>● {stats.fail} fail</span>
          <span style={{ color: 'var(--st-closed-fg)' }}>● {stats.skip} skip</span>
        </span>
      </div>

      {/* Основний вміст: список кейсів + деталі активного */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '380px minmax(0,1fr)',
          minHeight: 0,
        }}
      >
        {/* Черга кейсів */}
        <aside
          style={{
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            padding: '12px 8px',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 200px)',
          }}
        >
          <div className="sb-section" style={{ padding: '4px 8px 6px' }}>
            <span className="sb-section-label">
              Черга ({results.length})
            </span>
          </div>
          {results.length === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: 'var(--fg-3)',
                padding: '20px 8px',
                textAlign: 'center',
              }}
            >
              {isPlanned
                ? 'Натисніть «Запустити», щоб ініціалізувати кейси'
                : 'Кейсів немає'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {results.map((r, i) => {
                const tc = caseMap.get(r.test_case)
                const meta = RESULT_META[r.result as ResultKind]
                const isActive = i === activeIdx
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 10px',
                      border: 'none',
                      background: isActive ? 'var(--accent-soft)' : 'transparent',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 50,
                        background: meta.dot,
                        color: 'white',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {r.result === 'pass' && <Ic.Check sz={10} />}
                      {r.result === 'fail' && <Ic.X sz={10} />}
                      {r.result === 'pending' && (
                        <span style={{ fontSize: 10, color: 'white' }}>·</span>
                      )}
                    </span>
                    <span
                      className="id-cell"
                      style={{ fontSize: 11, flexShrink: 0 }}
                    >
                      TC-{r.test_case}
                    </span>
                    <span
                      style={{
                        fontSize: 12.5,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: isActive ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      {tc?.title || r.case_title || `Кейс #${r.test_case}`}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        {/* Деталі активного кейса */}
        <div style={{ padding: '20px 24px', overflow: 'auto' }}>
          {!activeResult ? (
            <div className="empty" style={{ marginTop: 60 }}>
              <Ic.Play sz={32} />
              <h4>{isPlanned ? 'Run ще не запущено' : 'Оберіть кейс'}</h4>
              <p>
                {isPlanned
                  ? 'Натисніть «Запустити» в шапці, щоб створити результати кейсів'
                  : 'Виберіть кейс зі списку зліва'}
              </p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                  flexWrap: 'wrap',
                }}
              >
                <span className="id-cell">TC-{activeResult.test_case}</span>
                <span
                  className={`pill ${RESULT_META[activeResult.result as ResultKind].cls}`}
                >
                  <span
                    className="dot"
                    style={{
                      background: RESULT_META[activeResult.result as ResultKind].dot,
                    }}
                  />
                  {RESULT_META[activeResult.result as ResultKind].label}
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {activeResult.result === 'fail' && (
                    <button
                      className="btn sm"
                      onClick={() =>
                        navigate(
                          `/bugs/new?title=${encodeURIComponent(
                            'Failed: ' + (activeCase?.title || '')
                          )}`
                        )
                      }
                    >
                      <Ic.Bug sz={12} /> Створити баг
                    </button>
                  )}
                  {activeResult.result !== 'pending' && (
                    <button
                      className="btn sm"
                      onClick={() => setResult(activeResult.id, 'pending')}
                    >
                      <Ic.Refresh sz={12} /> Перезапустити
                    </button>
                  )}
                </span>
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '-0.015em',
                }}
              >
                {activeCase?.title || activeResult.case_title}
              </h2>

              {activeCase?.preconditions && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: 'var(--bg-2)',
                    borderRadius: 8,
                    fontSize: 13,
                    color: 'var(--fg-2)',
                  }}
                >
                  <b style={{ fontSize: 11, color: 'var(--fg-3)', textTransform: 'uppercase' }}>
                    Передумови
                  </b>
                  <p style={{ margin: '4px 0 0' }}>{activeCase.preconditions}</p>
                </div>
              )}

              {/* Кроки виконання — підсвічуємо за статусом ран'у */}
              {activeCase?.steps && activeCase.steps.length > 0 && (
                <div style={{ marginTop: 18 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>
                    Кроки виконання
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {activeCase.steps.map((s, i) => {
                      // Логіка підсвічення: якщо весь кейс passed — всі зелені;
                      // failed — попередні зелені, останній (де впало) червоний;
                      // інакше — нейтральні
                      const totalSteps = activeCase.steps.length
                      const stepStatus: 'pass' | 'fail' | 'pending' =
                        activeResult.result === 'pass'
                          ? 'pass'
                          : activeResult.result === 'fail' && i === totalSteps - 1
                          ? 'fail'
                          : activeResult.result === 'fail' && i < totalSteps - 1
                          ? 'pass'
                          : 'pending'
                      const isFail = stepStatus === 'fail'
                      const isPass = stepStatus === 'pass'
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 12,
                            padding: 12,
                            border: `1px solid ${
                              isFail ? 'var(--st-open-bg)' : 'var(--border)'
                            }`,
                            borderRadius: 8,
                            background: isFail
                              ? 'var(--st-open-bg)'
                              : 'var(--surface)',
                          }}
                        >
                          <div
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 50,
                              background: isPass
                                ? 'var(--st-resolved-dot)'
                                : isFail
                                ? 'var(--st-open-dot)'
                                : 'var(--bg-2)',
                              color: isPass || isFail ? 'white' : 'var(--fg-2)',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: 12,
                              fontWeight: 600,
                              flexShrink: 0,
                              border: 'none',
                            }}
                          >
                            {isPass ? (
                              <Ic.Check sz={11} />
                            ) : isFail ? (
                              <Ic.X sz={11} />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <div style={{ flex: 1, fontSize: 13, minWidth: 0 }}>
                            <div>{s.step}</div>
                            {s.expected && (
                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 12,
                                  color: isFail
                                    ? 'var(--st-open-fg)'
                                    : 'var(--st-resolved-fg)',
                                }}
                              >
                                {isFail ? '✕' : '→'} {s.expected}
                              </div>
                            )}
                            {isFail && activeResult.note && (
                              <div
                                style={{
                                  marginTop: 6,
                                  padding: '8px 10px',
                                  background: 'var(--surface)',
                                  border: '1px solid var(--st-open-bg)',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  color: 'var(--st-open-fg)',
                                  fontFamily: 'var(--font-mono)',
                                  whiteSpace: 'pre-wrap',
                                }}
                              >
                                ✕ {activeResult.note}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Артефакти — плейсхолдер (drag-drop для скріншотів/відео/HAR) */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>
                  Артефакти
                </h3>
                <div
                  className="dropzone small"
                  style={{ padding: 16 }}
                  onClick={() =>
                    toast.show(
                      'Завантаження артефактів буде доступне в наступному релізі',
                      'info'
                    )
                  }
                >
                  <Ic.Upload sz={16} />
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                    Скріншоти, відео-запис, HAR, console.log
                  </span>
                </div>
              </div>

              {/* Логи — нотатка виконавця або системні логи */}
              {activeResult.note && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>
                    Логи
                  </h3>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px 14px',
                      background: 'var(--bg-2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                      lineHeight: 1.6,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--fg-2)',
                      whiteSpace: 'pre-wrap',
                      maxHeight: 240,
                      overflow: 'auto',
                    }}
                  >
                    {activeResult.note}
                  </pre>
                </div>
              )}

              {/* Дії: pass/fail/blocked/skip */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>
                  Результат
                </h3>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['pass', 'fail', 'blocked', 'skip'] as const).map(v => {
                    const meta = RESULT_META[v]
                    const active = activeResult.result === v
                    return (
                      <button
                        key={v}
                        type="button"
                        className="btn"
                        onClick={() => setResult(activeResult.id, v)}
                        style={{
                          background: active ? meta.dot : undefined,
                          color: active ? 'white' : undefined,
                          borderColor: active ? 'transparent' : undefined,
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        {v === 'pass' && <Ic.Check sz={12} />}
                        {v === 'fail' && <Ic.X sz={12} />}
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Нотатки */}
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 13.5, fontWeight: 600, margin: '0 0 10px' }}>
                  Нотатки виконавця
                </h3>
                <textarea
                  className="md-area"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onBlur={saveNote}
                  placeholder="Що пішло не так? Опишіть деталі для команди…"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
