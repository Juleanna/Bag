/**
 * Тест-кейси — за макетом прототипу:
 *  - sidebar з двома секціями: НАБОРИ (suite + Усі) і ТИП (Manual/Auto)
 *  - filter bar: search + applied chips + + Фільтр + Сортувати
 *  - таблиця з колонками: ☐ ID Тайтл Набір Пріоритет Тип Кроків Автор
 *  - bulk-вибір через checkbox
 *  - sub-text з % автоматизації
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { Avatar } from '../atoms/Avatar'
import { PriorityBadge } from '../atoms/Status'
import { api } from '../api/extras'
import type { TestCase, TestSuite } from '../api/extras'
import { listAll } from '../api/client'
import type { IssuePriority, Project } from '../api/types'
import { useToast } from '../context/ToastContext'
import { useConfirm, usePrompt } from '../context/ConfirmContext'

type CaseTypeFilter = 'all' | 'manual' | 'automated'

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'щойно'
  if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`
  if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)} дн тому`
  return d.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const RESULT_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  pass: { label: 'Passed', cls: 'resolved', dot: 'var(--st-resolved-dot)' },
  fail: { label: 'Failed', cls: 'open', dot: 'var(--st-open-dot)' },
  blocked: { label: 'Blocked', cls: 'blocked', dot: 'var(--st-blocked-dot)' },
  skip: { label: 'Skipped', cls: 'closed', dot: 'var(--st-closed-dot)' },
  pending: { label: 'Pending', cls: 'closed', dot: 'var(--st-closed-dot)' },
}

export function TestsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const prompt = usePrompt()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState<number | null>(null)
  const [suites, setSuites] = useState<TestSuite[]>([])
  const [cases, setCases] = useState<TestCase[]>([])
  const [activeSuite, setActiveSuite] = useState<number | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<CaseTypeFilter>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sortKey, setSortKey] = useState<'id' | 'title' | 'priority'>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    try {
      const ps = await listAll<Project>('/projects/?page_size=50')
      setProjects(ps)
      if (ps.length === 0) {
        setLoading(false)
        return
      }
      const pid = projectId || ps[0].id
      setProjectId(pid)
      const [sl, cl] = await Promise.all([
        api.listTestSuites(pid),
        api.listTestCases({ project: pid }),
      ])
      setSuites(sl)
      setCases(cl)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!projectId) return
    Promise.all([
      api.listTestSuites(projectId),
      api.listTestCases({ project: projectId }),
    ]).then(([sl, cl]) => {
      setSuites(sl)
      setCases(cl)
    })
  }, [projectId])

  // Лічильники для бічної панелі
  const casesPerSuite = useMemo(() => {
    const m = new Map<number, number>()
    for (const c of cases) m.set(c.suite, (m.get(c.suite) || 0) + 1)
    return m
  }, [cases])
  const autoCount = useMemo(
    () => cases.filter(c => c.type === 'automated').length,
    [cases]
  )
  const manualCount = cases.length - autoCount
  const autoRatio = cases.length === 0 ? 0 : Math.round((autoCount / cases.length) * 100)

  const filtered = useMemo(() => {
    const priOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    const dir = sortDir === 'desc' ? -1 : 1
    const list = cases.filter(c => {
      if (activeSuite !== 'all' && c.suite !== activeSuite) return false
      if (typeFilter !== 'all' && c.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.title.toLowerCase().includes(q) &&
          !String(c.id).includes(q) &&
          !(c.suite_name || '').toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
    list.sort((a, b) => {
      let r = 0
      switch (sortKey) {
        case 'id':
          r = a.id - b.id
          break
        case 'title':
          r = a.title.localeCompare(b.title)
          break
        case 'priority':
          r = (priOrder[a.priority] ?? 99) - (priOrder[b.priority] ?? 99)
          break
      }
      return r * dir
    })
    return list
  }, [cases, activeSuite, typeFilter, search, sortKey, sortDir])

  const toggleSelect = (id: number) => {
    setSelected(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }
  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }
  const clearSelection = () => setSelected(new Set())

  const addSuite = async () => {
    const name = await prompt({
      title: 'Новий набір',
      message: 'Назва набору (наприклад "Auth", "Billing"):',
      placeholder: 'Auth',
      confirmText: 'Створити',
      required: true,
    })
    if (!name || !projectId) return
    try {
      const created = await api.createTestSuite({ project: projectId, name })
      setSuites(s => [...s, created])
      setActiveSuite(created.id)
      toast.show('Набір створено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const renameSuite = async (s: TestSuite) => {
    const name = await prompt({
      title: 'Перейменувати набір',
      message: 'Нова назва:',
      defaultValue: s.name,
      confirmText: 'Зберегти',
      required: true,
    })
    if (!name || name === s.name) return
    try {
      const updated = await api.updateTestSuite(s.id, { name })
      setSuites(arr => arr.map(x => (x.id === s.id ? updated : x)))
      toast.show('Перейменовано', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeSuite = async (s: TestSuite) => {
    const count = casesPerSuite.get(s.id) || 0
    const ok = await confirm({
      title: `Видалити набір «${s.name}»?`,
      message:
        count > 0
          ? `Усі ${count} тест-кейсів цього набору будуть видалені разом з ним. Цю дію неможливо скасувати.`
          : 'Цю дію неможливо скасувати.',
      confirmText: 'Видалити',
      danger: true,
    })
    if (!ok) return
    try {
      await api.deleteTestSuite(s.id)
      setSuites(arr => arr.filter(x => x.id !== s.id))
      setCases(arr => arr.filter(c => c.suite !== s.id))
      if (activeSuite === s.id) setActiveSuite('all')
      toast.show('Видалено', 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const removeCase = async (id: number) => {
    const ok = await confirm({
      title: 'Видалити тест-кейс?',
      message: 'Цю дію не можна скасувати.',
      danger: true,
      confirmText: 'Видалити',
    })
    if (!ok) return
    try {
      await api.deleteTestCase(id)
      setCases(cs => cs.filter(c => c.id !== id))
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const bulkDelete = async () => {
    const ok = await confirm({
      title: `Видалити ${selected.size} тест-кейсів?`,
      message: 'Цю дію не можна скасувати.',
      danger: true,
      confirmText: 'Видалити',
    })
    if (!ok) return
    try {
      await Promise.all(
        Array.from(selected).map(id => api.deleteTestCase(id).catch(() => null))
      )
      setCases(cs => cs.filter(c => !selected.has(c.id)))
      clearSelection()
      toast.show(`Видалено ${selected.size} кейсів`, 'success')
    } catch (e) {
      toast.show(e instanceof Error ? e.message : 'Помилка', 'error')
    }
  }

  const exportCSV = () => {
    const headers = ['ID', 'Тайтл', 'Набір', 'Пріоритет', 'Тип', 'Кроків', 'Автор']
    const rows = filtered.map(c => [
      `TC-${c.id}`,
      c.title,
      c.suite_name || '',
      c.priority,
      c.type === 'automated' ? 'Auto' : 'Manual',
      c.steps?.length || 0,
      c.created_by_name || '',
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-cases-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="bt-loading-overlay">
        <div className="bt-spinner" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="page">
        <div className="empty">
          <Ic.Beaker sz={36} />
          <h4>Немає проєктів</h4>
          <p>Створіть проєкт, щоб додавати тест-кейси</p>
        </div>
      </div>
    )
  }

  const activeSuiteName =
    activeSuite === 'all' ? null : suites.find(s => s.id === activeSuite)?.name

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 'unset' }}>
        <div>
          <h1>Тест-кейси</h1>
          <div className="sub">
            {cases.length} {cases.length === 1 ? 'кейс' : 'кейсів'} ·{' '}
            {suites.length} {suites.length === 1 ? 'набір' : 'наборів'} ·{' '}
            {autoRatio}% автоматизовано
          </div>
        </div>
        <div className="right">
          <select
            className="inp"
            value={projectId ?? ''}
            onChange={e => setProjectId(Number(e.target.value))}
            style={{ minWidth: 160, width: 'auto' }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={exportCSV} disabled={filtered.length === 0}>
            <Ic.Download sz={13} /> Експорт
          </button>
          <button className="btn" onClick={() => navigate('/runs')}>
            <Ic.Play sz={12} /> Запустити ран
          </button>
          <button className="btn primary" onClick={() => navigate('/tests/new')}>
            <Ic.Plus sz={13} /> Новий кейс
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Пошук кейсів…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {activeSuite !== 'all' && (
          <button
            type="button"
            className="chip applied"
            onClick={() => setActiveSuite('all')}
            title="Скинути фільтр набору"
          >
            <span style={{ color: 'var(--fg-3)' }}>Набір:</span>
            <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>
              {activeSuiteName}
            </span>
            <Ic.X sz={11} />
          </button>
        )}
        {typeFilter !== 'all' && (
          <button
            type="button"
            className="chip applied"
            onClick={() => setTypeFilter('all')}
          >
            <span style={{ color: 'var(--fg-3)' }}>Тип:</span>
            <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>
              {typeFilter === 'automated' ? 'Auto' : 'Manual'}
            </span>
            <Ic.X sz={11} />
          </button>
        )}
        <button type="button" className="chip" onClick={addSuite}>
          <Ic.Plus sz={11} /> Набір
        </button>

        <div className="spacer" />

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="btn sm"
            onClick={() => setSortMenuOpen(o => !o)}
          >
            <Ic.Sort sz={12} /> Сортувати <Ic.ChevDown sz={11} />
          </button>
          {sortMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                onClick={() => setSortMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  minWidth: 200,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  boxShadow: 'var(--shadow-lg)',
                  padding: 6,
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                    color: 'var(--fg-3)',
                    padding: '6px 8px 2px',
                  }}
                >
                  Сортувати за
                </div>
                {(['id', 'title', 'priority'] as const).map(k => (
                  <button
                    key={k}
                    type="button"
                    className={`drop-item ${sortKey === k ? 'active' : ''}`}
                    onClick={() => {
                      setSortKey(k)
                      setSortMenuOpen(false)
                    }}
                  >
                    {k === 'id' ? 'ID' : k === 'title' ? 'Тайтлом' : 'Пріоритетом'}
                    {sortKey === k && <Ic.Check sz={11} style={{ marginLeft: 'auto' }} />}
                  </button>
                ))}
                <div style={{ borderTop: '1px solid var(--divider)', marginTop: 6, paddingTop: 6 }}>
                  <button
                    type="button"
                    className="drop-item"
                    onClick={() => setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))}
                  >
                    Напрямок: {sortDir === 'desc' ? '↓ спадання' : '↑ зростання'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px minmax(0,1fr)',
          minHeight: 0,
        }}
      >
        <aside
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--surface-2)',
            borderRight: '1px solid var(--border)',
            padding: '12px 8px',
          }}
        >
          <div>
            <div className="sb-section" style={{ padding: '4px 8px 6px' }}>
              <span className="sb-section-label">Набори</span>
            </div>
            <div className="sb-nav" style={{ padding: 0 }}>
              <button
                className={`sb-item ${activeSuite === 'all' ? 'active' : ''}`}
                onClick={() => setActiveSuite('all')}
              >
                <Ic.Folder sz={14} />
                <span>Усі</span>
                <span className="sb-count">{cases.length}</span>
              </button>
              {suites.map(s => {
                const count = casesPerSuite.get(s.id) || 0
                const isActive = activeSuite === s.id
                return (
                  <div key={s.id} className="suite-row">
                    <button
                      className={`sb-item ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveSuite(s.id)}
                      style={{ flex: 1 }}
                    >
                      <Ic.Folder sz={14} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </span>
                      <span className="sb-count">{count}</span>
                    </button>
                    <button
                      type="button"
                      className="suite-action"
                      onClick={() => renameSuite(s)}
                      title="Перейменувати"
                    >
                      <Ic.Edit sz={11} />
                    </button>
                    <button
                      type="button"
                      className="suite-action"
                      onClick={() => removeSuite(s)}
                      title="Видалити"
                    >
                      <Ic.Trash sz={11} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="sb-section" style={{ padding: '14px 8px 6px' }}>
              <span className="sb-section-label">Тип</span>
            </div>
            <div className="sb-nav" style={{ padding: 0 }}>
              <button
                className={`sb-item ${typeFilter === 'automated' ? 'active' : ''}`}
                onClick={() =>
                  setTypeFilter(t => (t === 'automated' ? 'all' : 'automated'))
                }
              >
                <Ic.Lightning sz={14} />
                <span>Автоматизовані</span>
                <span className="sb-count">{autoCount}</span>
              </button>
              <button
                className={`sb-item ${typeFilter === 'manual' ? 'active' : ''}`}
                onClick={() => setTypeFilter(t => (t === 'manual' ? 'all' : 'manual'))}
              >
                <Ic.User sz={14} />
                <span>Manual</span>
                <span className="sb-count">{manualCount}</span>
              </button>
            </div>
          </div>
        </aside>

        <div style={{ minWidth: 0 }}>
          {filtered.length === 0 ? (
            <div className="empty" style={{ padding: 60 }}>
              <Ic.Beaker sz={32} />
              <h4>Кейсів немає</h4>
              <p>Спробуйте змінити фільтри або створіть новий тест-кейс</p>
            </div>
          ) : (
            <div className="tbl-wrap" style={{ overflowX: 'auto' }}>
              <table
                className="table"
                style={{ tableLayout: 'fixed', width: '100%', minWidth: 0 }}
              >
                <colgroup>
                  <col style={{ width: 36 }} />{/* checkbox */}
                  <col style={{ width: 72 }} />{/* ID */}
                  <col />{/* Тайтл — гнучка */}
                  <col style={{ width: 130 }} />{/* Набір */}
                  <col style={{ width: 110 }} />{/* Пріоритет */}
                  <col style={{ width: 120 }} />{/* Останній статус */}
                  <col style={{ width: 88 }} />{/* Тип */}
                  <col style={{ width: 64 }} />{/* Кроків */}
                  <col style={{ width: 120 }} />{/* Автор */}
                  <col style={{ width: 100 }} />{/* Останній ран */}
                  <col style={{ width: 36 }} />{/* ✕ */}
                </colgroup>
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input
                        type="checkbox"
                        className="cb"
                        checked={selected.size > 0 && selected.size === filtered.length}
                        onChange={selectAll}
                      />
                    </th>
                    <th>ID</th>
                    <th>Тайтл</th>
                    <th>Набір</th>
                    <th>Пріоритет</th>
                    <th>Статус</th>
                    <th>Тип</th>
                    <th>Кроків</th>
                    <th>Автор</th>
                    <th>Ран</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => {
                    const isSelected = selected.has(c.id)
                    return (
                      <tr
                        key={c.id}
                        className={isSelected ? 'selected' : ''}
                        onClick={() => navigate(`/tests/${c.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td
                          className="checkbox-col"
                          onClick={e => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="cb"
                            checked={isSelected}
                            onChange={() => toggleSelect(c.id)}
                          />
                        </td>
                        <td className="id-cell" style={{ whiteSpace: 'nowrap' }}>
                          TC-{c.id}
                        </td>
                        <td>
                          <span
                            className="title-cell"
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={c.title}
                          >
                            {c.title}
                          </span>
                        </td>
                        <td>
                          <span
                            className="tag"
                            style={{
                              display: 'inline-block',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={c.suite_name || ''}
                          >
                            {c.suite_name || '—'}
                          </span>
                        </td>
                        <td>
                          <PriorityBadge value={c.priority as IssuePriority} />
                        </td>
                        <td>
                          {c.last_result ? (
                            <span className={`pill ${RESULT_LABELS[c.last_result].cls}`}>
                              <span
                                className="dot"
                                style={{
                                  background: RESULT_LABELS[c.last_result].dot,
                                }}
                              />
                              {RESULT_LABELS[c.last_result].label}
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          {c.type === 'automated' ? (
                            <span
                              className="tag"
                              style={{
                                background: 'var(--accent-soft)',
                                color: 'var(--accent-soft-fg)',
                                borderColor: 'transparent',
                              }}
                            >
                              <Ic.Lightning sz={10} style={{ marginRight: 3 }} /> Auto
                            </span>
                          ) : (
                            <span className="tag">Manual</span>
                          )}
                        </td>
                        <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {c.steps_count ?? c.steps?.length ?? 0}
                        </td>
                        <td>
                          {c.created_by_name ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 12.5,
                                minWidth: 0,
                              }}
                            >
                              <Avatar
                                user={{
                                  id: c.created_by ?? 0,
                                  username: c.created_by_name,
                                  first_name: '',
                                  last_name: '',
                                  avatar_url: c.created_by_avatar,
                                }}
                              />
                              <span
                                style={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {c.created_by_name}
                              </span>
                            </div>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                          {c.last_run_at ? formatRelative(c.last_run_at) : '—'}
                        </td>
                        <td
                          className="right"
                          style={{ paddingRight: 12 }}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="btn ghost icon sm"
                            onClick={() => removeCase(c.id)}
                            title="Видалити"
                          >
                            <Ic.Trash sz={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '10px 14px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 100,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 500 }}>Обрано: {selected.size}</span>
          <button className="btn sm" onClick={bulkDelete}>
            <Ic.Trash sz={11} /> Видалити
          </button>
          <button className="btn ghost sm" onClick={clearSelection}>
            <Ic.X sz={11} />
          </button>
        </div>
      )}
    </>
  )
}
