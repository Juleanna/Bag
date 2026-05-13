/**
 * Деталі тест-кейса (read-only) — за макетом прототипу:
 *  - хлібні крихти + кнопки [Редагувати, Запустити]
 *  - Заголовок з ID, метаданими (автор, пріоритет, тип)
 *  - Передумови (markdown-list)
 *  - Кроки (нумеровані картки з → expected)
 *  - Очікуваний результат
 *  - Останні рани (last 5 з TestResult)
 *  - Sidebar справа: ВЛАСТИВОСТІ + PASS-RATE 30 ДНІВ + ЗВ'ЯЗАНІ БАГИ
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { PriorityBadge } from '../atoms/Status'
import { Sparkline } from '../atoms/Charts'
import { api } from '../api/extras'
import type { TestCase, TestResult } from '../api/extras'
import { apiGet } from '../api/client'
import type { IssuePriority } from '../api/types'
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

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)} дн тому`
  return d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function TestCaseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const caseId = Number(id)
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const [launching, setLaunching] = useState(false)

  const [tc, setTc] = useState<TestCase | null>(null)
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!caseId) return
    void (async () => {
      try {
        const [c, res] = await Promise.all([
          apiGet<TestCase>(`/test-cases/${caseId}/`),
          api.listTestResults({ test_case: caseId }).catch(() => [] as TestResult[]),
        ])
        setTc(c)
        setResults(res)
      } catch (e) {
        toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
        navigate('/tests')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  // Pass-rate за 30 днів (із TestResult) + sparkline
  const stats = useMemo(() => {
    const cutoff = Date.now() - 30 * 86400 * 1000
    const recent = results.filter(r => {
      if (!r.executed_at) return false
      return new Date(r.executed_at).getTime() > cutoff
    })
    const pass = recent.filter(r => r.result === 'pass').length
    const fail = recent.filter(r => r.result === 'fail').length
    const total = pass + fail
    const passRate = total === 0 ? 0 : Math.round((pass / total) * 100)
    // Будуємо sparkline pass-rate по днях
    const dayPoints: number[] = []
    for (let i = 14; i >= 0; i--) {
      const dayStart = Date.now() - i * 86400 * 1000
      const dayEnd = dayStart + 86400 * 1000
      const dayRes = results.filter(r => {
        if (!r.executed_at) return false
        const t = new Date(r.executed_at).getTime()
        return t >= dayStart && t < dayEnd
      })
      const dp = dayRes.filter(r => r.result === 'pass').length
      const df = dayRes.filter(r => r.result === 'fail').length
      const dt = dp + df
      dayPoints.push(dt === 0 ? passRate : Math.round((dp / dt) * 100))
    }
    return { pass, fail, total, passRate, dayPoints }
  }, [results])

  const recent5 = results.slice(0, 5)

  /**
   * «Запустити» — комплексна логіка:
   *  1. Шукаємо найновіший активний run (planned/in_progress) проєкту,
   *     що містить цей кейс.
   *  2. Якщо знайдено → порівнюємо snapshot (title + steps + preconditions)
   *     з поточним TestCase. Якщо є drift — пропонуємо вибір:
   *        a) Оновити run з кейса (run := case)
   *        b) Оновити кейс з рану (case := run, прийняти стару версію)
   *        c) Залишити як є
   *  3. Якщо не знайдено — створюємо новий ад-хок run «Run для TC-N» з
   *     одним кейсом і відкриваємо його.
   */
  const launchRun = async () => {
    if (!tc || launching) return
    setLaunching(true)
    try {
      const allRuns = await api.listTestRuns(tc.project)
      const activeRun = allRuns.find(
        r =>
          (r.status === 'planned' || r.status === 'in_progress') &&
          (r.test_cases || []).includes(tc.id)
      )

      if (activeRun) {
        const runResults = await api.listTestResults(activeRun.id)
        const myResult = runResults.find(r => r.test_case === tc.id)

        if (myResult) {
          // Drift-detection: title / steps / preconditions
          const titleDrift =
            !!myResult.case_title_snapshot &&
            myResult.case_title_snapshot !== tc.title
          const snapStepsJson = JSON.stringify(myResult.case_steps_snapshot || [])
          const tcStepsJson = JSON.stringify(
            (tc.steps || []).map(s => ({ step: s.step, expected: s.expected || '' }))
          )
          const stepsDrift =
            (myResult.case_steps_snapshot || []).length > 0 &&
            snapStepsJson !== tcStepsJson
          const precDrift =
            !!myResult.case_preconditions_snapshot &&
            myResult.case_preconditions_snapshot !== (tc.preconditions || '')

          const hasDrift = titleDrift || stepsDrift || precDrift

          if (hasDrift) {
            const choice = await driftPrompt({
              titleDrift,
              stepsDrift,
              precDrift,
              caseTitle: tc.title,
              snapshotTitle: myResult.case_title_snapshot || '',
            })

            if (choice === 'cancel') {
              setLaunching(false)
              return
            }
            if (choice === 'update_run') {
              await api.syncResultFromCase(myResult.id)
              toast.show('Run оновлено з актуальних даних кейса', 'success')
            } else if (choice === 'update_case') {
              await api.syncResultToCase(myResult.id)
              // Оновлюємо локальний стан, щоб користувач побачив зміни
              setTc({
                ...tc,
                title: myResult.case_title_snapshot || tc.title,
                steps:
                  myResult.case_steps_snapshot && myResult.case_steps_snapshot.length > 0
                    ? myResult.case_steps_snapshot
                    : tc.steps,
                preconditions:
                  myResult.case_preconditions_snapshot ?? tc.preconditions,
              })
              toast.show('Кейс оновлено даними з рану', 'success')
            }
            // 'keep' — нічого не робимо, переходимо в run як є
          }
        }

        toast.show(`Відкрито активний run TR-${activeRun.id}`, 'info')
        navigate(`/runs/${activeRun.id}`)
        return
      }

      // Активного run-у немає → створюємо новий ад-хок
      const fresh = await api.createTestRun({
        project: tc.project,
        name: `Run для TC-${tc.id} · ${tc.title.slice(0, 40)}`,
        test_cases: [tc.id],
      })
      toast.show('Run створено', 'success')
      navigate(`/runs/${fresh.id}`)
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    } finally {
      setLaunching(false)
    }
  }

  /**
   * Diалог drift-вирішення: повертає одне з:
   *  - 'update_run' — синхронізувати run snapshot з поточних даних кейса
   *  - 'update_case' — синхронізувати кейс з snapshot ран'у
   *  - 'keep' — залишити як є, відкрити run
   *  - 'cancel' — нічого не робити
   *
   * Реалізовано через 2 послідовні confirm-діалоги (3-way).
   */
  const driftPrompt = async (info: {
    titleDrift: boolean
    stepsDrift: boolean
    precDrift: boolean
    caseTitle: string
    snapshotTitle: string
  }): Promise<'update_run' | 'update_case' | 'keep' | 'cancel'> => {
    const fields: string[] = []
    if (info.titleDrift) fields.push('назва')
    if (info.stepsDrift) fields.push('кроки')
    if (info.precDrift) fields.push('передумови')
    const fieldsStr = fields.join(', ')

    // Перший діалог — пропонуємо «Оновити run з кейса» (найчастіший сценарій)
    const updateRun = await confirm({
      title: 'Дані кейса змінились після створення рану',
      message: `Розбіжності: ${fieldsStr}. Оновити run актуальними даними кейса?`,
      confirmText: 'Оновити run',
      cancelText: 'Інші варіанти',
    })
    if (updateRun) return 'update_run'

    // Другий діалог — оновити кейс зі snapshot рану (відкочуємо до старої версії)
    const updateCase = await confirm({
      title: 'Прийняти стару версію з рану?',
      message:
        'Поточні зміни в кейсі будуть замінені snapshot-даними з рану. Корисно якщо редагування було помилковим.',
      confirmText: 'Оновити кейс',
      cancelText: 'Залишити як є',
      danger: true,
    })
    if (updateCase) return 'update_case'

    return 'keep'
  }

  if (loading || !tc) {
    return (
      <div className="page" style={{ maxWidth: 1480 }}>
        <Skeleton width={300} height={28} />
        <div style={{ marginTop: 16 }}>
          <Skeleton height={400} />
        </div>
      </div>
    )
  }

  return (
    <div className="page" style={{ maxWidth: 1480 }}>
      {/* Хлібні крихти + Дії */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        <button
          className="btn ghost sm"
          onClick={() => navigate('/tests')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }} />
          Тест-кейси
        </button>
        <span style={{ color: 'var(--fg-4)' }}>/</span>
        <span className="id-cell">TC-{tc.id}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button
            className="btn sm primary"
            onClick={launchRun}
            disabled={launching}
          >
            <Ic.Play sz={12} /> {launching ? 'Запуск…' : 'Запустити'}
          </button>
          <button
            className="btn sm"
            onClick={() => navigate(`/tests/${tc.id}/edit`)}
            title="Редагувати"
          >
            <Ic.Edit sz={12} /> Редагувати
          </button>
          <button
            className="btn sm danger"
            onClick={async () => {
              const ok = await confirm({
                title: `Видалити TC-${tc.id}?`,
                message: 'Кейс буде видалено разом з його історією запусків.',
                confirmText: 'Видалити',
                danger: true,
              })
              if (!ok) return
              try {
                await api.deleteTestCase(tc.id)
                toast.show('Кейс видалено', 'success')
                navigate('/tests')
              } catch (e) {
                toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
              }
            }}
            title="Видалити"
          >
            <Ic.Trash sz={12} /> Видалити
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 24 }}>
        {/* Основний контент */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}
          >
            {tc.title}
          </h1>
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12.5,
              color: 'var(--fg-3)',
              flexWrap: 'wrap',
            }}
          >
            <span className="id-cell" style={{ fontSize: 12 }}>
              TC-{tc.id}
            </span>
            <span>·</span>
            <span>
              автор{' '}
              <b style={{ color: 'var(--fg-2)', fontWeight: 500 }}>
                {tc.created_by_name || '—'}
              </b>
            </span>
            <span>·</span>
            <PriorityBadge value={tc.priority as IssuePriority} />
            <span
              className="tag"
              style={
                tc.type === 'automated'
                  ? {
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-soft-fg)',
                      borderColor: 'transparent',
                    }
                  : undefined
              }
            >
              {tc.type === 'automated' ? (
                <>
                  <Ic.Lightning sz={10} style={{ marginRight: 3 }} /> Automated
                </>
              ) : (
                'Manual'
              )}
            </span>
          </div>

          {/* Передумови */}
          {tc.preconditions && (
            <div className="section" style={{ marginTop: 24 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>
                Передумови
              </h3>
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--fg-2)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {tc.preconditions}
              </div>
            </div>
          )}

          {/* Кроки */}
          {tc.steps && tc.steps.length > 0 && (
            <div className="section" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Кроки</h3>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                  {tc.steps.length} кроків
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tc.steps.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: 14,
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      background: 'var(--surface)',
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 50,
                        background: 'var(--bg-2)',
                        color: 'var(--fg-2)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, fontSize: 13.5 }}>
                      <div>{s.step}</div>
                      {s.expected && (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12.5,
                            color: 'var(--st-resolved-fg)',
                          }}
                        >
                          → {s.expected}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Очікуваний результат */}
          {tc.expected_result && (
            <div className="section" style={{ marginTop: 24 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600 }}>
                Очікуваний результат
              </h3>
              <div
                style={{
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: 'var(--fg-2)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {tc.expected_result}
              </div>
            </div>
          )}

          {/* Останні рани */}
          <div className="section" style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Останні рани</h3>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                останні {Math.min(recent5.length, 5)}
              </span>
            </div>
            {recent5.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: 'center',
                  color: 'var(--fg-3)',
                  fontSize: 13,
                  border: '1px dashed var(--border)',
                  borderRadius: 10,
                }}
              >
                Кейс ще не виконувався
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recent5.map(r => {
                  const meta = RESULT_META[r.result as ResultKind]
                  return (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/runs/${r.run}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 50,
                          background: meta.dot,
                          color: 'white',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {r.result === 'pass' && <Ic.Check sz={11} />}
                        {r.result === 'fail' && <Ic.X sz={11} />}
                      </span>
                      <span className="id-cell" style={{ fontSize: 12 }}>
                        TR-{r.run}
                      </span>
                      {r.executed_by && (
                        <Avatar
                          user={{
                            id: r.executed_by,
                            username: r.executed_by_name || '',
                            first_name: '',
                            last_name: '',
                          }}
                        />
                      )}
                      <span style={{ flex: 1, color: 'var(--fg-2)' }}>
                        {r.executed_by_name || '—'}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: 'var(--fg-3)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {r.executed_at ? formatRelative(r.executed_at) : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar справа */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <h4
              style={{
                margin: '0 0 12px',
                fontSize: 11,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Властивості
            </h4>
            <PropRow label="Набір">
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12.5,
                }}
              >
                <Ic.Folder sz={12} /> {tc.suite_name || '—'}
              </span>
            </PropRow>
            <PropRow label="Пріоритет">
              <PriorityBadge value={tc.priority as IssuePriority} />
            </PropRow>
            <PropRow label="Тип">
              <span
                className="tag"
                style={
                  tc.type === 'automated'
                    ? {
                        background: 'var(--accent-soft)',
                        color: 'var(--accent-soft-fg)',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                {tc.type === 'automated' ? (
                  <>
                    <Ic.Lightning sz={10} style={{ marginRight: 3 }} /> Automated
                  </>
                ) : (
                  'Manual'
                )}
              </span>
            </PropRow>
            <PropRow label="Кроків">
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                {tc.steps?.length ?? 0}
              </span>
            </PropRow>
            <PropRow label="Автор">
              {tc.created_by_name ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12.5,
                  }}
                >
                  <Avatar
                    user={{
                      id: tc.created_by ?? 0,
                      username: tc.created_by_name,
                      first_name: '',
                      last_name: '',
                      avatar_url: tc.created_by_avatar,
                    }}
                  />
                  {tc.created_by_name}
                </span>
              ) : (
                '—'
              )}
            </PropRow>
            {tc.automation_link && (
              <PropRow label="Automation">
                <a
                  href={tc.automation_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: 'var(--accent-soft-fg)',
                    fontFamily: 'var(--font-mono)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'inline-block',
                    maxWidth: 180,
                  }}
                >
                  {tc.automation_link}
                </a>
              </PropRow>
            )}
          </div>

          {/* Pass-rate · 30 днів */}
          <div className="card" style={{ padding: 16 }}>
            <h4
              style={{
                margin: 0,
                fontSize: 11,
                color: 'var(--fg-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
              }}
            >
              Pass-rate · 30 днів
            </h4>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                marginTop: 8,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {stats.passRate}
              </span>
              <span style={{ fontSize: 16, color: 'var(--fg-3)' }}>%</span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 10 }}>
              {stats.pass} pass / {stats.fail} fail
            </div>
            {stats.dayPoints.length > 0 && (
              <Sparkline
                data={stats.dayPoints}
                color="var(--st-resolved-dot)"
                w={280}
                h={50}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function PropRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '7px 0',
        fontSize: 12.5,
        borderBottom: '1px solid var(--divider)',
      }}
    >
      <span style={{ color: 'var(--fg-3)' }}>{label}</span>
      <span style={{ textAlign: 'right' }}>{children}</span>
    </div>
  )
}
