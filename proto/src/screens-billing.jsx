// Billing & Plans page
function Billing({ goto }) {
  const [cycle, setCycle] = React.useState('yearly');
  const [tab, setTab] = React.useState('plans');
  const [seats, setSeats] = React.useState(12);
  const current = 'team';

  const PLANS = [
    {
      id: 'free', name: 'Free', tag: null,
      priceM: 0, priceY: 0,
      desc: 'Для невеликих команд, що пробують BugForge',
      cta: 'Поточний план',
      features: [
        'До 5 користувачів',
        '2 проєкти',
        '500 багів у місяць',
        'Базові звіти',
        'Спільнота · email-підтримка',
      ],
      lim: '2 GB сховища',
    },
    {
      id: 'team', name: 'Team', tag: 'Поточний',
      priceM: 14, priceY: 12,
      desc: 'Для зростаючих QA-команд',
      cta: 'Активний',
      features: [
        'Необмежені користувачі',
        'Необмежені проєкти',
        'Спринти + Kanban',
        'Шаблони багів і тест-кейсів',
        'Webhooks + REST API',
        'GitHub, Slack, Jira',
        '4-год SLA email-підтримки',
      ],
      lim: '50 GB сховища',
      highlight: true,
    },
    {
      id: 'business', name: 'Business', tag: 'Популярне',
      priceM: 28, priceY: 24,
      desc: 'Для зрілих команд із кількома продуктами',
      cta: 'Перейти на Business',
      features: [
        'Усе з Team',
        'AI-помічник (репро, дублі)',
        'Кастомні дашборди + scheduled reports',
        'Audit log (90 днів)',
        'Кастомні ролі',
        'Public Status Page',
        'Пріоритетна підтримка',
      ],
      lim: '500 GB сховища',
    },
    {
      id: 'enterprise', name: 'Enterprise', tag: null,
      priceM: null, priceY: null,
      desc: 'Для великих організацій з compliance-вимогами',
      cta: 'Звʼязатись з продажами',
      features: [
        'Усе з Business',
        'SAML SSO + SCIM-провіжен',
        'On-premise / Self-hosted',
        'Audit log (необмежено)',
        'DPA, SOC 2, GDPR',
        '99.99% SLA · 1-год reaction',
        'Виділений CSM',
      ],
      lim: 'Необмежене сховище',
    },
  ];

  const COMPARE = [
    { group: 'Команда', rows: [
      ['Користувачі',         '5',          'Необмежено', 'Необмежено', 'Необмежено'],
      ['Проєкти',             '2',          'Необмежено', 'Необмежено', 'Необмежено'],
      ['Гостьові акаунти',    false,        '∞',          '∞',          '∞'],
      ['Кастомні ролі',       false,        false,        true,         true],
    ]},
    { group: 'Функціонал', rows: [
      ['Баги · базове',       true,         true,         true,         true],
      ['Тест-кейси та runs',  true,         true,         true,         true],
      ['Спринти + Kanban',    false,        true,         true,         true],
      ['Шаблони',             '2',          '∞',          '∞',          '∞'],
      ['AI-помічник',         false,        false,        true,         true],
      ['Кастомні дашборди',   false,        '3',          '∞',          '∞'],
    ]},
    { group: 'Інтеграції', rows: [
      ['GitHub / Slack',      true,         true,         true,         true],
      ['Jira / Linear / Asana', false,      true,         true,         true],
      ['Webhooks',            '3',          '∞',          '∞',          '∞'],
      ['REST + GraphQL API',  false,        true,         true,         true],
      ['Zapier / Make',       false,        true,         true,         true],
    ]},
    { group: 'Безпека та compliance', rows: [
      ['2FA',                 true,         true,         true,         true],
      ['Audit log',           false,        '7 днів',     '90 днів',    '∞'],
      ['SAML SSO',            false,        false,        false,        true],
      ['SCIM-провіжен',       false,        false,        false,        true],
      ['SOC 2 / DPA',         false,        false,        false,        true],
      ['On-premise',          false,        false,        false,        true],
    ]},
    { group: 'Підтримка', rows: [
      ['Email',               'Спільнота',  '4 год',      '2 год',      '1 год'],
      ['Чат у застосунку',    false,        true,         true,         true],
      ['Виділений CSM',       false,        false,        false,        true],
      ['SLA',                 false,        false,        '99.9%',      '99.99%'],
    ]},
  ];

  const FAQ = [
    { q: 'Чи можна змінити план у будь-який момент?', a: 'Так. При апгрейді доплачуєте пропорційно до кінця поточного циклу. При даунгрейді — кредит на наступний інвойс.' },
    { q: 'Як рахуються користувачі?', a: 'Активні в межах місяця. Гості та read-only безкоштовно на всіх платних планах.' },
    { q: 'Чи є знижки для стартапів та НКО?', a: '50% для стартапів до 2 років (підтвердження інвестицій) і 100% для зареєстрованих НКО. Напишіть на sales@bugforge.io.' },
    { q: 'Як можна оплачувати?', a: 'Картка (Visa, Mastercard, Amex), SEPA, банківський переказ для річних планів від $5k. Інвойси формуються автоматично.' },
  ];

  const INVOICES = [
    { n: 'INV-2026-0512', d: '01 трав 2026', amt: 168, status: 'paid',     desc: 'Team · 12 місць · травень' },
    { n: 'INV-2026-0411', d: '01 кві 2026',  amt: 168, status: 'paid',     desc: 'Team · 12 місць · квітень' },
    { n: 'INV-2026-0310', d: '01 бер 2026',  amt: 154, status: 'paid',     desc: 'Team · 11 місць · березень' },
    { n: 'INV-2026-0209', d: '01 лют 2026',  amt: 140, status: 'paid',     desc: 'Team · 10 місць · лютий' },
    { n: 'INV-2026-0108', d: '01 січ 2026',  amt: 140, status: 'paid',     desc: 'Team · 10 місць · січень' },
  ];

  const renderCell = (v) => {
    if (v === true)  return <Ic.Check sz={15} style={{ color: 'var(--st-resolved-fg)' }}/>;
    if (v === false) return <Ic.X sz={13} style={{ color: 'var(--fg-4)' }}/>;
    return <span style={{ fontSize: 12.5, color: 'var(--fg-2)' }}>{v}</span>;
  };

  return (
    <div className="scroll-inner">
      <div className="page" style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div className="page-head">
          <div>
            <h1>Білінг та плани</h1>
            <div className="sub">Поточний: <b style={{ color: 'var(--accent-soft-fg)' }}>Team</b> · 12 місць · наступний інвойс <b style={{ color: 'var(--fg-2)' }}>$168.00</b> 1 червня</div>
          </div>
          <div className="right">
            <button className="btn"><Ic.Download sz={12}/> Експорт інвойсів</button>
            <button className="btn"><Ic.Card sz={12}/> Спосіб оплати</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="seg" style={{ marginBottom: 22, width: 'fit-content' }}>
          {[['plans','Плани'],['usage','Споживання'],['invoices','Інвойси'],['method','Спосіб оплати']].map(([v,l]) => (
            <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {tab === 'plans' && (<>
          {/* Cycle toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: cycle === 'monthly' ? 'var(--fg)' : 'var(--fg-3)', fontWeight: cycle === 'monthly' ? 500 : 400 }}>Щомісячно</span>
            <span className={cycle === 'yearly' ? 'toggle on' : 'toggle'} onClick={() => setCycle(c => c === 'yearly' ? 'monthly' : 'yearly')}><span/></span>
            <span style={{ fontSize: 13, color: cycle === 'yearly' ? 'var(--fg)' : 'var(--fg-3)', fontWeight: cycle === 'yearly' ? 500 : 400 }}>Щорічно</span>
            <span className="tag" style={{ background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)', borderColor: 'transparent' }}>Економія 17%</span>
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 36 }}>
            {PLANS.map(p => {
              const price = cycle === 'yearly' ? p.priceY : p.priceM;
              const isCurrent = p.id === current;
              return (
                <div key={p.id} className="card" style={{
                  padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative',
                  borderColor: p.highlight ? 'var(--accent)' : 'var(--border)',
                  borderWidth: p.highlight ? 2 : 1,
                  boxShadow: p.highlight ? '0 0 0 6px var(--accent-soft)' : 'none',
                }}>
                  {p.tag && (
                    <span style={{
                      position: 'absolute', top: -10, left: 22,
                      background: p.highlight ? 'var(--accent)' : 'var(--bg-2)',
                      color: p.highlight ? 'white' : 'var(--fg-2)',
                      padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{p.tag}</span>
                  )}
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{p.name}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--fg-3)', minHeight: 36, lineHeight: 1.5 }}>{p.desc}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    {price === null ? (
                      <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Custom</span>
                    ) : price === 0 ? (
                      <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em' }}>$0</span>
                    ) : (<>
                      <span style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em' }}>${price}</span>
                      <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>/міс/користувач</span>
                    </>)}
                  </div>
                  <button className={p.highlight && !isCurrent ? 'btn primary' : 'btn'}
                          disabled={isCurrent}
                          style={{ width: '100%', justifyContent: 'center', opacity: isCurrent ? 0.65 : 1 }}>
                    {isCurrent ? <><Ic.Check sz={12}/> {p.cta}</> : p.cta}
                  </button>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'var(--fg-2)' }}>
                    {p.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <Ic.Check sz={13} style={{ color: 'var(--st-resolved-fg)', flexShrink: 0, marginTop: 2 }}/>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--divider)', fontSize: 11.5, color: 'var(--fg-3)' }}>{p.lim}</div>
                </div>
              );
            })}
          </div>

          {/* Compare */}
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 14px', textAlign: 'center' }}>Порівняння планів</h2>
          <div className="card" style={{ marginBottom: 36, overflow: 'hidden' }}>
            <table className="table" style={{ tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: '32%', paddingLeft: 20 }}></th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ textAlign: 'center', fontWeight: 600, color: p.id === current ? 'var(--accent-soft-fg)' : 'var(--fg)' }}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(g => (
                  <React.Fragment key={g.group}>
                    <tr>
                      <td colSpan={5} style={{ background: 'var(--bg-2)', padding: '8px 20px', fontSize: 11.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--fg-3)' }}>{g.group}</td>
                    </tr>
                    {g.rows.map((row, i) => (
                      <tr key={i}>
                        <td style={{ paddingLeft: 20, fontSize: 13, color: 'var(--fg-2)' }}>{row[0]}</td>
                        {row.slice(1).map((v, j) => (
                          <td key={j} style={{ textAlign: 'center' }}>{renderCell(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* FAQ */}
          <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', margin: '0 0 14px', textAlign: 'center' }}>Часті питання</h2>
          <div style={{ maxWidth: 720, margin: '0 auto 32px' }}>
            {FAQ.map((f, i) => (
              <details key={i} style={{ borderTop: '1px solid var(--divider)', borderBottom: i === FAQ.length - 1 ? '1px solid var(--divider)' : 'none' }}>
                <summary style={{ padding: '16px 4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, listStyle: 'none' }}>
                  <span style={{ flex: 1 }}>{f.q}</span>
                  <Ic.ChevDown sz={14} style={{ color: 'var(--fg-3)' }}/>
                </summary>
                <p style={{ margin: '0 0 16px', padding: '0 4px', fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6 }}>{f.a}</p>
              </details>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="card" style={{ padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center', background: 'var(--bg-2)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Ic.Building sz={16} style={{ color: 'var(--accent-soft-fg)' }}/>
                <b style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-soft-fg)' }}>Enterprise</b>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>Потрібно більше? Поговоріть з нами.</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.55 }}>
                Кастомні умови, on-prem, виділений CSM, SOC 2 і DPA. Демо за 30 хв.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn">Подивитись демо</button>
              <button className="btn primary" onClick={() => goto('contact')}>Звʼязатись</button>
            </div>
          </div>
        </>)}

        {tab === 'usage' && (<>
          <div className="metrics" style={{ marginBottom: 16 }}>
            {[
              { l: 'Місць використано', v: '12 / ∞', sub: 'Team план',  ic: Ic.Users },
              { l: 'Активні баги',      v: '47',     sub: 'без ліміту', ic: Ic.Bug },
              { l: 'API виклики (міс.)', v: '24.8k', sub: 'з 100k',     ic: Ic.Code, pct: 25 },
              { l: 'Сховище',           v: '12.4 GB', sub: 'з 50 GB',   ic: Ic.Folder, pct: 25 },
            ].map((m, i) => (
              <div key={i} className="card metric">
                <div className="metric-lbl"><m.ic sz={12}/> {m.l}</div>
                <div className="metric-val">{m.v}</div>
                <div className="metric-delta flat"><span className="since">{m.sub}</span></div>
                {m.pct != null && <div className="bar-stack" style={{ marginTop: 10 }}><span style={{ width: m.pct + '%', background: 'var(--accent)' }}/></div>}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-head"><h3>Місць · симулятор вартості</h3></div>
            <div className="card-body bordered">
              <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--fg-3)' }}>Скільки коштуватиме при різній кількості користувачів.</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <input type="range" min="1" max="200" value={seats} onChange={e => setSeats(+e.target.value)} style={{ flex: 1 }}/>
                <div style={{ minWidth: 200, textAlign: 'right' }}>
                  <b style={{ fontSize: 22, fontVariantNumeric: 'tabular-nums' }}>{seats}</b>
                  <span style={{ color: 'var(--fg-3)', fontSize: 13 }}> місць · </span>
                  <b style={{ fontSize: 22, color: 'var(--accent-soft-fg)' }}>${seats * 12}</b>
                  <span style={{ color: 'var(--fg-3)', fontSize: 13 }}>/міс</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[['Team', 12], ['Business', 24], ['Enterprise', '—']].map(([n, p]) => (
                  <div key={n} style={{ padding: 14, background: 'var(--bg-2)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{n}</div>
                    <b style={{ fontSize: 20, fontVariantNumeric: 'tabular-nums' }}>{p === '—' ? 'Custom' : `$${seats * p}/міс`}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}

        {tab === 'invoices' && (
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead><tr><th style={{ paddingLeft: 18 }}>Інвойс</th><th>Дата</th><th>Опис</th><th className="right">Сума</th><th>Статус</th><th></th></tr></thead>
                <tbody>
                  {INVOICES.map(inv => (
                    <tr key={inv.n}>
                      <td style={{ paddingLeft: 18, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}>{inv.n}</td>
                      <td className="muted">{inv.d}</td>
                      <td>{inv.desc}</td>
                      <td className="right" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>${inv.amt}.00</td>
                      <td><span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Сплачено</span></td>
                      <td className="right" style={{ paddingRight: 14 }}>
                        <button className="btn sm ghost"><Ic.Download sz={11}/> PDF</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'method' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Картка</h3>
              <div style={{
                background: 'linear-gradient(135deg, #1F2244 0%, #5E6AD2 100%)', color: 'white',
                padding: 22, borderRadius: 12, marginBottom: 14, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                  <span style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Visa · Debit</span>
                  <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.04em' }}>VISA</span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, letterSpacing: '0.12em', marginBottom: 14 }}>•••• •••• •••• 4242</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, opacity: 0.85 }}>
                  <span>OLENA MELNYK</span><span>12 / 27</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" style={{ flex: 1, justifyContent: 'center' }}><Ic.Edit sz={11}/> Замінити</button>
                <button className="btn ghost" style={{ flex: 1, justifyContent: 'center' }}><Ic.Trash sz={11}/> Видалити</button>
              </div>
            </div>

            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Реквізити для інвойсів</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                {[
                  ['Компанія',     'Acme Inc.'],
                  ['Email для інвойсів', 'finance@acme.com'],
                  ['Адреса',        '12 Velyka Vasylkivska, Kyiv 01004, UA'],
                  ['VAT ID',        'UA 1234567890'],
                  ['Спосіб оплати', 'Картка · автосписання'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--divider)' }}>
                    <span style={{ color: 'var(--fg-3)' }}>{k}</span>
                    <b style={{ color: 'var(--fg-2)' }}>{v}</b>
                  </div>
                ))}
              </div>
              <button className="btn" style={{ marginTop: 14 }}><Ic.Edit sz={11}/> Редагувати</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.Billing = Billing;
