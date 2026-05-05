import { useEffect, useMemo, useState } from 'react'
import { Ic } from '../icons/Ic'

type Tab = 'start' | 'shortcuts' | 'workflows' | 'faq'

interface Props {
  open: boolean
  onClose: () => void
}

const SECTIONS = {
  start: [
    {
      q: 'Як створити перший баг?',
      a: 'Натисніть кнопку "Створити" у верхньому правому куті або скоротіть шлях клавішею C. Заповніть заголовок, опис та кроки відтворення.',
    },
    {
      q: 'Як організувати тест-кейси?',
      a: 'Згрупуйте кейси у Suites за функціональністю (auth, billing, profile…). Кожен кейс може бути Manual або Auto.',
    },
    {
      q: 'Як запустити Test Run?',
      a: 'У вкладці Test Runs створіть новий ран, виберіть кейси, браузери та середовище. Раннер виконає автоматизовані та підкаже які кейси прогнати manual.',
    },
  ],
  shortcuts: [
    ['⌘ K', 'Відкрити команд палітру'],
    ['⌘ 1 — 4', 'Швидкий перехід між розділами'],
    ['C', 'Створити баг'],
    ['⇧ C', 'Створити тест-кейс'],
    ['/', 'Пошук'],
    ['I', 'Призначити мені'],
    ['E', 'Позначити готовим'],
    ['J / K', 'Навігація списком вгору / вниз'],
    ['↵', 'Відкрити елемент'],
    ['⌘ ⌫', 'Архівувати'],
    ['?', 'Показати цю довідку'],
    ['Esc', 'Закрити модальне вікно'],
  ] as const,
  workflows: [
    {
      name: 'Bug → Resolution',
      steps: ['Створення', 'Тріаж (priority, assignee)', 'Відтворення на staging', 'Fix у PR', 'Code review', 'Resolved → Verify QA', 'Closed'],
    },
    {
      name: 'Test Case → Automation',
      steps: ['Manual чернетка', 'Затвердження кроків', 'Прогон вручну (3+ рази)', 'Кодування Playwright', 'Звʼязати з кейсом', 'Включити в smoke'],
    },
    {
      name: 'Release',
      steps: ['Створити Test Run', 'Прогнати regression', 'Зафіксувати всі fail як баги', 'Triage критичних', 'Sign-off від QA Lead'],
    },
  ],
  faq: [
    {
      q: 'Чи можна імпортувати з JIRA?',
      a: 'Так — у налаштуваннях проєкту → Імпорт. Підтримуємо JIRA, Linear, Asana та CSV. Зберігаються коментарі, статуси, вкладення та звʼязки.',
    },
    {
      q: 'Як AI-підсумок працює?',
      a: 'Аналізує опис, кроки, коментарі та лог-файли вкладень, генерує короткий summary, ймовірну причину та план відтворення. Працює на ваших даних — без використання у тренуванні моделі.',
    },
    {
      q: 'Скільки коштує?',
      a: 'Free до 5 користувачів. Team — за договором. Enterprise — на запит, з SSO, audit log та self-hosted Docker.',
    },
    {
      q: 'Чи є мобільний застосунок?',
      a: 'Веб-інтерфейс адаптивний — повноцінно працює на телефоні для перегляду, призначення та коментарів. Нативного застосунку поки немає.',
    },
  ],
}

export function HelpModal({ open, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('start')
  const [query, setQuery] = useState('')

  // Esc — закриває; / — фокус на пошук
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('.help-search input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Скидаємо стан при відкритті
  useEffect(() => {
    if (open) {
      setTab('start')
      setQuery('')
    }
  }, [open])

  // Простий локальний пошук — підсвічує лише ті елементи поточної вкладки, що містять query
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return null
    return {
      start: SECTIONS.start.filter(s => s.q.toLowerCase().includes(q) || s.a.toLowerCase().includes(q)),
      shortcuts: SECTIONS.shortcuts.filter(([k, l]) => k.toLowerCase().includes(q) || l.toLowerCase().includes(q)),
      workflows: SECTIONS.workflows.filter(w => w.name.toLowerCase().includes(q) || w.steps.some(s => s.toLowerCase().includes(q))),
      faq: SECTIONS.faq.filter(s => s.q.toLowerCase().includes(q) || s.a.toLowerCase().includes(q)),
    }
  }, [query])

  if (!open) return null

  const startItems = filtered?.start ?? SECTIONS.start
  const shortcutItems = filtered?.shortcuts ?? SECTIONS.shortcuts
  const workflowItems = filtered?.workflows ?? SECTIONS.workflows
  const faqItems = filtered?.faq ?? SECTIONS.faq

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal help-modal"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>
              Довідковий центр
            </h2>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>
              Відповіді, шорткати та воркфлоу команди QA
            </div>
          </div>
          <button className="btn ghost icon" onClick={onClose} title="Закрити">
            <Ic.X sz={14} />
          </button>
        </div>

        <div className="help-search">
          <Ic.Search sz={13} />
          <input
            placeholder="Шукати у довідці…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <span className="kbd">/</span>
        </div>

        <div className="help-body">
          <aside className="help-tabs">
            <button className={tab === 'start' ? 'active' : ''} onClick={() => setTab('start')}>
              <Ic.Spark sz={13} /> Початок роботи
            </button>
            <button
              className={tab === 'shortcuts' ? 'active' : ''}
              onClick={() => setTab('shortcuts')}
            >
              <Ic.Lightning sz={13} /> Шорткати
            </button>
            <button
              className={tab === 'workflows' ? 'active' : ''}
              onClick={() => setTab('workflows')}
            >
              <Ic.Branch sz={13} /> Воркфлоу
            </button>
            <button className={tab === 'faq' ? 'active' : ''} onClick={() => setTab('faq')}>
              <Ic.Help sz={13} /> Часті питання
            </button>
            <div className="help-tabs-divider" />
            <button>
              <Ic.Globe sz={13} /> Документація
            </button>
            <button>
              <Ic.Comment sz={13} /> Звʼязатися з підтримкою
            </button>
            <button>
              <Ic.Github sz={13} /> Changelog
            </button>
          </aside>

          <div className="help-content">
            {tab === 'start' && (
              <div className="qa-list">
                {!query && (
                  <div className="qa-hero">
                    <div className="qa-hero-icon">
                      <Ic.Spark sz={22} />
                    </div>
                    <div>
                      <h3>Ласкаво просимо до BugTracker</h3>
                      <p>
                        Усе, що потрібно вашій команді в одному місці: задачі, коментарі,
                        сповіщення, звіти. Почніть з трьох простих кроків нижче.
                      </p>
                    </div>
                  </div>
                )}
                {startItems.length === 0 ? (
                  <EmptyResults />
                ) : (
                  startItems.map((s, i) => (
                    <details key={i} className="qa-item" open={i === 0}>
                      <summary>
                        <span className="qa-num">{i + 1}</span>
                        <b>{s.q}</b>
                        <Ic.Chev sz={12} className="chev" />
                      </summary>
                      <p>{s.a}</p>
                    </details>
                  ))
                )}
              </div>
            )}

            {tab === 'shortcuts' && (
              <div>
                <p style={{ color: 'var(--fg-3)', fontSize: 13, margin: '0 0 16px' }}>
                  BugTracker створений для роботи з клавіатури — більшість дій мають шорткати.
                </p>
                {shortcutItems.length === 0 ? (
                  <EmptyResults />
                ) : (
                  <div className="kbd-cards">
                    {shortcutItems.map(([k, l]) => (
                      <div key={k} className="kbd-card">
                        <span style={{ fontSize: 13 }}>{l}</span>
                        <span style={{ display: 'flex', gap: 4 }}>
                          {k.split(' ').map((p, i) => (
                            <span key={i} className="kbd">
                              {p}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'workflows' && (
              <div className="qa-list">
                {workflowItems.length === 0 ? (
                  <EmptyResults />
                ) : (
                  workflowItems.map((w, i) => (
                    <div key={i} className="wf-card">
                      <h4>{w.name}</h4>
                      <div className="wf-steps">
                        {w.steps.map((s, j) => (
                          <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span className="wf-step">
                              <span className="wf-step-num">{j + 1}</span>
                              <span>{s}</span>
                            </span>
                            {j < w.steps.length - 1 && (
                              <Ic.Chev sz={10} style={{ color: 'var(--fg-4)' }} />
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'faq' && (
              <div className="qa-list">
                {faqItems.length === 0 ? (
                  <EmptyResults />
                ) : (
                  faqItems.map((s, i) => (
                    <details key={i} className="qa-item" open={i === 0}>
                      <summary>
                        <b>{s.q}</b>
                        <Ic.Chev sz={12} className="chev" />
                      </summary>
                      <p>{s.a}</p>
                    </details>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyResults() {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: 'var(--fg-3)',
        fontSize: 13,
      }}
    >
      Нічого не знайдено
    </div>
  )
}
