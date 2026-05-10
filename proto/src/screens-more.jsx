// Sprints / Templates / Webhooks screens

// ============ SPRINTS ============
function Sprints({ goto }) {
  const [tab, setTab] = React.useState('active');

  const ACTIVE = {
    name: 'Sprint 24 · Web v4.18',
    range: '13 тра — 27 тра',
    daysLeft: 7, totalDays: 14,
    goal: 'Стабілізувати чекаут і закрити критичні баги iOS.',
    points: { done: 34, inProgress: 18, todo: 22, total: 74 },
    bugs: 12, tests: 38, runs: 4,
    velocity: 41,
  };
  const pct = (ACTIVE.points.done / ACTIVE.points.total) * 100;
  const inProgPct = (ACTIVE.points.inProgress / ACTIVE.points.total) * 100;
  const burndown = [74, 71, 68, 64, 58, 52, 46, 40];
  const ideal = burndown.map((_, i) => 74 - (74 / 7) * i);

  const COLUMNS = [
    { id: 'todo', label: 'Очікує', n: 11, color: 'var(--st-closed-fg)' },
    { id: 'progress', label: 'У роботі', n: 7, color: 'var(--st-progress-fg)' },
    { id: 'review', label: 'На рев’ю', n: 4, color: 'var(--st-blocked-fg)' },
    { id: 'done', label: 'Готово', n: 18, color: 'var(--st-resolved-fg)' },
  ];

  const SPRINT_ITEMS = {
    todo: [
      { id: 'BUG-2089', t: 'Кнопка «Сплатити» не реагує на Safari iOS', pri: 'high', who: 'om', est: 5 },
      { id: 'TC-318',   t: 'E2E чекаут — гостьова покупка', pri: 'medium', who: 'ds', est: 3 },
      { id: 'BUG-2092', t: 'Невірне округлення PVA в API', pri: 'medium', who: 'np', est: 2 },
    ],
    progress: [
      { id: 'BUG-2076', t: 'Падіння при свайпі на каталозі товарів', pri: 'critical', who: 'iv', est: 8 },
      { id: 'TC-310',   t: 'Регрес: реєстрація → email-підтвердження', pri: 'high', who: 'ak', est: 5 },
    ],
    review: [
      { id: 'BUG-2065', t: 'Вирівнювання чекбоксів на /settings', pri: 'low', who: 'mt', est: 1 },
      { id: 'TC-302',   t: 'Smoke: вхід через Google', pri: 'medium', who: 'om', est: 2 },
    ],
    done: [
      { id: 'BUG-2041', t: 'Невірний total на сторінці кошика', pri: 'critical', who: 'om', est: 5 },
      { id: 'BUG-2052', t: 'Спіннер не зникає після помилки', pri: 'medium', who: 'ds', est: 2 },
      { id: 'TC-298',   t: 'Чекаут — Apple Pay', pri: 'high', who: 'np', est: 3 },
    ],
  };

  const PAST = [
    { name: 'Sprint 23 · Web v4.17', range: '29 кві — 12 тра', velocity: 38, completed: 92, scope: 41 },
    { name: 'Sprint 22 · Web v4.16', range: '15 — 28 кві',     velocity: 44, completed: 86, scope: 51 },
    { name: 'Sprint 21 · Web v4.15', range: '01 — 14 кві',     velocity: 36, completed: 100, scope: 36 },
    { name: 'Sprint 20 · Web v4.14', range: '18 — 31 бер',     velocity: 39, completed: 79, scope: 49 },
  ];

  return (
    <div className="scroll-inner">
      <div className="filters">
        <div className="seg">
          {[['active','Активний'],['planning','Планування'],['past','Завершені']].map(([v,l]) => (
            <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
        <button className="chip"><Ic.Folder sz={12}/> Web App</button>
        <button className="chip"><Ic.Users sz={12}/> Уся команда</button>
        <span className="spacer"/>
        <button className="btn"><Ic.Calendar sz={12}/> Календар</button>
        <button className="btn primary" onClick={() => goto('new-sprint')}><Ic.Plus sz={13}/> Новий спринт</button>
      </div>

      {tab === 'active' && (
        <div className="page">
          {/* Header */}
          <div className="page-head">
            <div>
              <h1>{ACTIVE.name}</h1>
              <div className="sub">
                {ACTIVE.range} · <b style={{ color: 'var(--st-progress-fg)' }}>залишилось {ACTIVE.daysLeft} днів</b>
              </div>
            </div>
            <div className="right">
              <button className="btn"><Ic.Edit sz={12}/> Редагувати</button>
              <button className="btn"><Ic.Stop sz={12}/> Завершити спринт</button>
            </div>
          </div>

          {/* Goal */}
          <div className="ai-card" style={{ marginBottom: 16 }}>
            <div className="head"><Ic.Flag sz={14}/><b>Ціль спринту</b></div>
            <p>{ACTIVE.goal}</p>
          </div>

          {/* Top metrics */}
          <div className="metrics" style={{ marginBottom: 16 }}>
            <div className="card metric">
              <div className="metric-lbl"><Ic.Activity sz={12}/> Прогрес</div>
              <div className="metric-val">{Math.round(pct)}<span className="unit">%</span></div>
              <div className="bar-stack" style={{ marginTop: 6 }}>
                <span style={{ width: pct + '%', background: 'var(--st-resolved-dot)' }}/>
                <span style={{ width: inProgPct + '%', background: 'var(--st-progress-dot)' }}/>
              </div>
              <div className="metric-delta flat"><span className="since">{ACTIVE.points.done}/{ACTIVE.points.total} story points</span></div>
            </div>
            <div className="card metric">
              <div className="metric-lbl"><Ic.Bug sz={12}/> Баги в спринті</div>
              <div className="metric-val">{ACTIVE.bugs}</div>
              <div className="metric-delta down"><Ic.ChevDown sz={11}/>3 <span className="since">vs. минулий</span></div>
            </div>
            <div className="card metric">
              <div className="metric-lbl"><Ic.Beaker sz={12}/> Тест-кейси</div>
              <div className="metric-val">{ACTIVE.tests}</div>
              <div className="metric-delta flat"><span className="since">{ACTIVE.runs} активних runs</span></div>
            </div>
            <div className="card metric">
              <div className="metric-lbl"><Ic.Lightning sz={12}/> Velocity</div>
              <div className="metric-val">{ACTIVE.velocity}<span className="unit">SP / спринт</span></div>
              <div className="metric-delta up"><Ic.ChevUp sz={11}/>+8% <span className="since">сер. за 6 спр.</span></div>
            </div>
          </div>

          {/* Burndown + scope */}
          <div className="rep-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16 }}>
            <div className="card">
              <div className="card-head">
                <h3>Burndown</h3>
                <span className="legend"><span className="dot" style={{ background: 'var(--accent)' }}/>Реальне</span>
                <span className="legend"><span className="dot" style={{ background: 'var(--border-strong)' }}/>Ідеальне</span>
                <div className="right"><span className="tag">Story points</span></div>
              </div>
              <div className="card-body bordered" style={{ padding: '14px 18px' }}>
                <svg viewBox="0 0 600 200" style={{ width: '100%', height: 200 }}>
                  {[0, 25, 50, 75].map(y => (
                    <line key={y} x1="40" x2="590" y1={20 + y * 1.6} y2={20 + y * 1.6} stroke="var(--divider)" strokeDasharray="3 3"/>
                  ))}
                  {[0, 18.75, 37.5, 56.25, 75].map((v, i) => (
                    <text key={i} x="32" y={184 - i * 41} textAnchor="end" fontSize="10" fill="var(--fg-3)">{Math.round(v)}</text>
                  ))}
                  {/* ideal line */}
                  <polyline fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="4 4"
                    points={ideal.map((v, i) => `${40 + i * 78},${184 - (v / 75) * 164}`).join(' ')}/>
                  {/* real */}
                  <polyline fill="none" stroke="var(--accent)" strokeWidth="2.4"
                    points={burndown.map((v, i) => `${40 + i * 78},${184 - (v / 75) * 164}`).join(' ')}/>
                  {burndown.map((v, i) => (
                    <circle key={i} cx={40 + i * 78} cy={184 - (v / 75) * 164} r="3.5" fill="var(--accent)"/>
                  ))}
                  {['Д1','Д2','Д3','Д4','Д5','Д6','Д7','Д8'].map((d, i) => (
                    <text key={i} x={40 + i * 78} y="196" textAnchor="middle" fontSize="10" fill="var(--fg-3)">{d}</text>
                  ))}
                </svg>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Розподіл за пріоритетом</h3></div>
              <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'Critical', v: 4, c: 'var(--pri-critical)' },
                  { l: 'High', v: 11, c: 'var(--pri-high)' },
                  { l: 'Medium', v: 18, c: 'var(--pri-medium)' },
                  { l: 'Low', v: 7, c: 'var(--pri-low)' },
                ].map(p => (
                  <div key={p.l}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                      <span style={{ color: 'var(--fg-2)' }}>{p.l}</span>
                      <b style={{ fontVariantNumeric: 'tabular-nums' }}>{p.v}</b>
                    </div>
                    <div className="bar-stack"><span style={{ width: (p.v / 40) * 100 + '%', background: p.c }}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Kanban */}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '4px 0 10px' }}>Дошка спринту</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {COLUMNS.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, minHeight: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px 10px' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 50, background: c.color }}/>
                  <b style={{ fontSize: 13 }}>{c.label}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{c.n}</span>
                  <button className="btn ghost icon" style={{ marginLeft: 'auto', height: 22, width: 22 }}><Ic.Plus sz={11}/></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(SPRINT_ITEMS[c.id] || []).map(it => {
                    const u = USERS.find(u => u.initials.toLowerCase() === it.who) || USERS[0];
                    const pri = { critical: 'var(--pri-critical)', high: 'var(--pri-high)', medium: 'var(--pri-medium)', low: 'var(--pri-low)' }[it.pri];
                    return (
                      <div key={it.id} className="kcard" onClick={() => goto(it.id.startsWith('BUG') ? 'bug-detail' : 'test-detail')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="id">{it.id}</span>
                          <span style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: 50, background: pri }}/>
                        </div>
                        <div className="title">{it.t}</div>
                        <div className="meta">
                          <span className="tag"><span style={{ width: 6, height: 6, borderRadius: 50, background: pri, marginRight: 4, display: 'inline-block' }}/>{it.est} SP</span>
                          <div className="right">
                            <span className="avatar" style={{ background: u.color, width: 18, height: 18, fontSize: 9 }}>{u.initials}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'planning' && (
        <div className="page">
          <div className="page-head">
            <div>
              <h1>Планування Sprint 25</h1>
              <div className="sub">Чернетка · початок 28 тра · ємність команди ~42 SP</div>
            </div>
            <div className="right">
              <button className="btn"><Ic.AI sz={12}/> AI підказати склад</button>
              <button className="btn primary"><Ic.Play sz={13}/> Запустити спринт</button>
            </div>
          </div>

          <div className="rep-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: 16 }}>
            <div className="card">
              <div className="card-head"><h3>Бэклог · кандидати</h3><span className="tag" style={{ marginLeft: 8 }}>132 items</span></div>
              <div className="card-body bordered" style={{ padding: 0 }}>
                {[
                  { id: 'BUG-2104', t: 'Експорт CSV ламає кодування для UA імен', pri: 'high', est: 3 },
                  { id: 'BUG-2107', t: 'Невірний фокус після закриття модалки', pri: 'low', est: 1 },
                  { id: 'TC-322',   t: 'Регрес: вхід через SSO', pri: 'medium', est: 5 },
                  { id: 'BUG-2113', t: 'Падіння при ре-сабміті форми', pri: 'critical', est: 8 },
                  { id: 'TC-326',   t: 'Smoke: відновлення пароля', pri: 'high', est: 2 },
                ].map(it => (
                  <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '20px 90px 1fr 50px 28px', gap: 10, alignItems: 'center', padding: '10px 18px', borderTop: '1px solid var(--divider)' }}>
                    <input type="checkbox" className="cb"/>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>{it.id}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{it.t}</span>
                    <span className="tag">{it.est} SP</span>
                    <button className="btn ghost icon"><Ic.Plus sz={12}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Ємність</h3></div>
              <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 4 }}>
                    <span>Заплановано</span><b>28 / 42 SP</b>
                  </div>
                  <div className="bar-stack"><span style={{ width: '67%', background: 'var(--accent)' }}/></div>
                </div>
                <div style={{ borderTop: '1px solid var(--divider)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {USERS.slice(0, 5).map(u => {
                    const cap = 8 + Math.floor(Math.random() * 4);
                    const used = Math.floor(Math.random() * (cap + 1));
                    return (
                      <div key={u.initials} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                        <span className="avatar" style={{ background: u.color }}>{u.initials}</span>
                        <span style={{ flex: 1 }}>{u.name}</span>
                        <b style={{ fontVariantNumeric: 'tabular-nums', color: used > cap ? 'var(--st-open-fg)' : 'var(--fg-2)' }}>{used}/{cap}</b>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'past' && (
        <div className="page">
          <div className="page-head">
            <div><h1>Завершені спринти</h1><div className="sub">Тренди velocity та виконання</div></div>
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              {PAST.map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 100px 1fr 90px', gap: 16, alignItems: 'center', padding: '14px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                  <div>
                    <b style={{ fontSize: 14 }}>{s.name}</b>
                    <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{s.range}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Velocity</div>
                    <b style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>{s.velocity} SP</b>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>Виконано</div>
                    <b style={{ fontSize: 16, color: s.completed >= 90 ? 'var(--st-resolved-fg)' : 'var(--fg)' }}>{s.completed}%</b>
                  </div>
                  <div className="bar-stack" style={{ height: 6 }}>
                    <span style={{ width: s.completed + '%', background: 'var(--st-resolved-dot)' }}/>
                  </div>
                  <button className="btn sm">Огляд</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ TEMPLATES ============
function Templates({ goto }) {
  const [type, setType] = React.useState('all');
  const [q, setQ] = React.useState('');

  const TEMPLATES = [
    { id: 'tpl-bug-crash',   type: 'bug',  title: 'Краш-репорт мобільного', desc: 'Кроки + stack trace + ОС + версія застосунку', uses: 247, by: 'om', tags: ['mobile', 'crash'] },
    { id: 'tpl-bug-ui',      type: 'bug',  title: 'UI-баг (web)',           desc: 'Скрін до/після, браузер, екран, очікуване', uses: 189, by: 'ds', tags: ['web', 'visual'] },
    { id: 'tpl-bug-sec',     type: 'bug',  title: 'Security report',        desc: 'CVSS, repro, impact, suggested fix', uses: 41,  by: 'iv', tags: ['security'] },
    { id: 'tpl-bug-perf',    type: 'bug',  title: 'Деградація продуктивності', desc: 'Метрики до/після, профайл, scenario', uses: 33,  by: 'np', tags: ['perf'] },
    { id: 'tpl-tc-smoke',    type: 'test', title: 'Smoke-тест чекаут',      desc: '8 кроків, результат для кожного', uses: 412, by: 'om', tags: ['e2e', 'critical-path'] },
    { id: 'tpl-tc-api',      type: 'test', title: 'API endpoint test',      desc: 'Headers, payload, очікуваний JSON', uses: 156, by: 'np', tags: ['api'] },
    { id: 'tpl-tc-a11y',     type: 'test', title: 'Перевірка доступності',  desc: 'WCAG 2.1 AA, screen reader, keyboard nav', uses: 78,  by: 'ak', tags: ['a11y'] },
    { id: 'tpl-run-release', type: 'run',  title: 'Реліз-чекліст',          desc: '32 smoke + 18 critical-path кейсів', uses: 98,  by: 'ds', tags: ['release'] },
    { id: 'tpl-run-hotfix',  type: 'run',  title: 'Hotfix sanity',          desc: '12 кейсів критичного шляху', uses: 67,  by: 'om', tags: ['hotfix'] },
  ];

  const TYPES = [
    { id: 'all',  label: 'Усі', icon: Ic.Layout },
    { id: 'bug',  label: 'Баги', icon: Ic.Bug },
    { id: 'test', label: 'Тест-кейси', icon: Ic.Beaker },
    { id: 'run',  label: 'Test Runs', icon: Ic.Play },
  ];

  const filtered = TEMPLATES.filter(t =>
    (type === 'all' || t.type === type) &&
    (!q || (t.title + ' ' + t.tags.join(' ')).toLowerCase().includes(q.toLowerCase()))
  );

  const typeColor = (t) => ({
    bug:  { bg: 'var(--st-open-bg)',     fg: 'var(--st-open-fg)' },
    test: { bg: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)' },
    run:  { bg: 'var(--st-progress-bg)', fg: 'var(--st-progress-fg)' },
  }[t]);
  const typeIcon = (t) => ({ bug: Ic.Bug, test: Ic.Beaker, run: Ic.Play }[t]);
  const typeLabel = (t) => ({ bug: 'Bug', test: 'Test case', run: 'Run' }[t]);

  return (
    <div className="scroll-inner">
      <div className="filters">
        <input className="search-input" placeholder="Шукати шаблон…" value={q} onChange={e => setQ(e.target.value)}/>
        <div className="seg">
          {TYPES.map(T => (
            <button key={T.id} className={type === T.id ? 'active' : ''} onClick={() => setType(T.id)}>
              <T.icon sz={11}/> {T.label}
            </button>
          ))}
        </div>
        <span className="spacer"/>
        <button className="btn"><Ic.Download sz={12}/> Імпорт</button>
        <button className="btn primary" onClick={() => goto('new-template')}><Ic.Plus sz={13}/> Новий шаблон</button>
      </div>

      <div className="page">
        <div className="page-head">
          <div>
            <h1>Шаблони</h1>
            <div className="sub">Багорепорти, тест-кейси та runs з готовою структурою · {TEMPLATES.length} шаблонів</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(t => {
            const TI = typeIcon(t.type);
            const c = typeColor(t.type);
            const u = USERS.find(u => u.initials.toLowerCase() === t.by) || USERS[0];
            return (
              <div key={t.id} className="card" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                <div style={{ padding: 18, paddingBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: c.bg, color: c.fg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <TI sz={18}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span className="tag" style={{ background: c.bg, color: c.fg, borderColor: 'transparent' }}>{typeLabel(t.type)}</span>
                    </div>
                    <b style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 4 }}>{t.title}</b>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>{t.desc}</p>
                  </div>
                </div>
                <div style={{ padding: '0 18px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {t.tags.map(tg => <span key={tg} className="tag">{tg}</span>)}
                </div>
                <div style={{ marginTop: 'auto', padding: '12px 18px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-3)' }}>
                  <span className="avatar" style={{ background: u.color, width: 18, height: 18, fontSize: 9 }}>{u.initials}</span>
                  <span>{u.name}</span>
                  <span style={{ marginLeft: 'auto' }}>{t.uses}× використано</span>
                  <button className="btn sm"><Ic.Plus sz={11}/> Створити</button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <Ic.Layout sz={32}/>
            <h4>Нічого не знайдено</h4>
            <p>Спробуйте інший запит або створіть новий шаблон.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ WEBHOOKS ============
function Webhooks({ goto }) {
  const [tab, setTab] = React.useState('webhooks');

  const WEBHOOKS = [
    { id: 'wh-1', name: 'Slack — #qa-alerts',  url: 'https://hooks.slack.com/services/T0X/B7Y/k…', events: ['bug.created', 'bug.priority_changed'], status: 'active', last: '2 хв тому', success: 487, failed: 0 },
    { id: 'wh-2', name: 'GitHub PR sync',      url: 'https://api.github.com/repos/acme/web/dispatches', events: ['bug.linked_to_pr'], status: 'active', last: '38 хв тому', success: 156, failed: 2 },
    { id: 'wh-3', name: 'Internal CI · Jenkins', url: 'https://ci.acme.com/webhook/bugforge', events: ['run.completed', 'run.failed'], status: 'failing', last: '4 год тому', success: 89, failed: 14 },
    { id: 'wh-4', name: 'PagerDuty — critical', url: 'https://events.pagerduty.com/v2/enqueue', events: ['bug.created'], status: 'paused', last: 'вчора', success: 23, failed: 0 },
  ];

  const EVENTS = [
    { group: 'Баги', items: [
      { id: 'bug.created', desc: 'Створено новий баг' },
      { id: 'bug.updated', desc: 'Оновлено поля бага' },
      { id: 'bug.status_changed', desc: 'Змінено статус' },
      { id: 'bug.priority_changed', desc: 'Змінено пріоритет' },
      { id: 'bug.assigned', desc: 'Призначено виконавця' },
      { id: 'bug.commented', desc: 'Додано коментар' },
      { id: 'bug.linked_to_pr', desc: 'Зв’язок з PR' },
    ]},
    { group: 'Тести', items: [
      { id: 'test.created', desc: 'Створено тест-кейс' },
      { id: 'test.updated', desc: 'Оновлено тест-кейс' },
    ]},
    { group: 'Runs', items: [
      { id: 'run.started', desc: 'Запущено run' },
      { id: 'run.completed', desc: 'Run завершено' },
      { id: 'run.failed', desc: 'Run з помилкою' },
    ]},
  ];

  const DELIVERIES = [
    { time: '14:23:08', event: 'bug.created',          target: 'Slack', status: 'ok',   code: 200, ms: 124 },
    { time: '14:21:45', event: 'bug.priority_changed', target: 'Slack', status: 'ok',   code: 200, ms: 89 },
    { time: '14:19:12', event: 'run.completed',        target: 'Jenkins', status: 'fail', code: 504, ms: 5012 },
    { time: '14:14:33', event: 'bug.linked_to_pr',     target: 'GitHub PR sync', status: 'ok', code: 204, ms: 312 },
    { time: '14:08:21', event: 'run.completed',        target: 'Jenkins', status: 'fail', code: 503, ms: 4980 },
    { time: '14:02:55', event: 'bug.created',          target: 'Slack', status: 'ok',   code: 200, ms: 102 },
    { time: '13:58:14', event: 'bug.assigned',         target: 'Slack', status: 'ok',   code: 200, ms: 134 },
  ];

  const statusBadge = (s) => {
    if (s === 'active')  return <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Активний</span>;
    if (s === 'failing') return <span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Збій</span>;
    if (s === 'paused')  return <span className="pill closed"><span className="dot" style={{ background: 'var(--st-closed-dot)' }}/>Пауза</span>;
  };

  return (
    <div className="scroll-inner">
      <div className="filters">
        <div className="seg">
          {[['webhooks','Webhooks'],['events','Події'],['deliveries','Доставки'],['secrets','API Keys']].map(([v,l]) => (
            <button key={v} className={tab === v ? 'active' : ''} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
        <span className="spacer"/>
        <button className="btn"><Ic.Help sz={12}/> Документація</button>
        <button className="btn primary" onClick={() => goto('new-webhook')}><Ic.Plus sz={13}/> Новий webhook</button>
      </div>

      <div className="page">
        {tab === 'webhooks' && (<>
          <div className="page-head">
            <div><h1>Webhooks</h1><div className="sub">Надсилайте події BugForge у зовнішні сервіси через HTTP</div></div>
          </div>

          <div className="metrics" style={{ marginBottom: 16 }}>
            {[
              { l: 'Активних', v: 3, ico: Ic.Lightning },
              { l: 'Доставок (24г)', v: 412, ico: Ic.Activity },
              { l: 'Успішно', v: '98.2%', col: 'var(--st-resolved-fg)', ico: Ic.Check2 },
              { l: 'Помилок (24г)', v: 14, col: 'var(--st-open-fg)', ico: Ic.X },
            ].map(m => (
              <div key={m.l} className="card metric">
                <div className="metric-lbl"><m.ico sz={12}/> {m.l}</div>
                <div className="metric-val" style={{ color: m.col }}>{m.v}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 18 }}>Назва / URL</th>
                    <th>Події</th>
                    <th>Статус</th>
                    <th>Останнє</th>
                    <th>Успіх / помилки</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {WEBHOOKS.map(w => (
                    <tr key={w.id}>
                      <td style={{ paddingLeft: 18, maxWidth: 320 }}>
                        <div style={{ fontWeight: 500 }}>{w.name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{w.url}</div>
                      </td>
                      <td>
                        {w.events.slice(0, 2).map(e => <span key={e} className="tag" style={{ marginRight: 4, fontFamily: 'var(--font-mono)', fontSize: 11 }}>{e}</span>)}
                        {w.events.length > 2 && <span className="tag">+{w.events.length - 2}</span>}
                      </td>
                      <td>{statusBadge(w.status)}</td>
                      <td className="muted">{w.last}</td>
                      <td>
                        <span style={{ color: 'var(--st-resolved-fg)', fontVariantNumeric: 'tabular-nums' }}>{w.success}</span>
                        <span style={{ color: 'var(--fg-4)' }}> / </span>
                        <span style={{ color: w.failed > 0 ? 'var(--st-open-fg)' : 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{w.failed}</span>
                      </td>
                      <td className="right" style={{ paddingRight: 14 }}>
                        <button className="btn sm ghost"><Ic.Refresh sz={11}/> Test</button>
                        <button className="btn sm ghost"><Ic.More sz={12}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {tab === 'events' && (<>
          <div className="page-head">
            <div><h1>Події</h1><div className="sub">Усі події, на які можна підписати webhook</div></div>
          </div>
          {EVENTS.map(g => (
            <div key={g.group} className="section">
              <h3>{g.group} <span className="count">{g.items.length}</span></h3>
              <div className="card">
                <div className="card-body" style={{ padding: 0 }}>
                  {g.items.map((e, i) => (
                    <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '260px 1fr auto', gap: 16, alignItems: 'center', padding: '12px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, color: 'var(--accent-soft-fg)', background: 'var(--accent-soft)', padding: '2px 8px', borderRadius: 4, justifySelf: 'start' }}>{e.id}</code>
                      <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{e.desc}</span>
                      <button className="btn sm">Тригер тест</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </>)}

        {tab === 'deliveries' && (<>
          <div className="page-head">
            <div><h1>Останні доставки</h1><div className="sub">Лог за останні 24 години · оновлюється в реальному часі</div></div>
            <div className="right">
              <button className="btn"><Ic.Refresh sz={12}/> Оновити</button>
            </div>
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table">
                <thead>
                  <tr><th style={{ paddingLeft: 18 }}>Час</th><th>Подія</th><th>Адресат</th><th>Статус</th><th className="right">Код</th><th className="right" style={{ paddingRight: 18 }}>Тривалість</th></tr>
                </thead>
                <tbody>
                  {DELIVERIES.map((d, i) => (
                    <tr key={i}>
                      <td style={{ paddingLeft: 18, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{d.time}</td>
                      <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-soft-fg)' }}>{d.event}</code></td>
                      <td>{d.target}</td>
                      <td>
                        {d.status === 'ok'
                          ? <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>OK</span>
                          : <span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Помилка</span>}
                      </td>
                      <td className="right" style={{ fontVariantNumeric: 'tabular-nums', color: d.code >= 400 ? 'var(--st-open-fg)' : 'var(--fg-2)' }}>{d.code}</td>
                      <td className="right" style={{ paddingRight: 18, fontVariantNumeric: 'tabular-nums', color: d.ms > 1000 ? 'var(--st-progress-fg)' : 'var(--fg-3)' }}>{d.ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>)}

        {tab === 'secrets' && (<>
          <div className="page-head">
            <div><h1>API Keys</h1><div className="sub">Ключі для прямих API-викликів та підпису webhooks</div></div>
            <div className="right"><button className="btn primary"><Ic.Plus sz={13}/> Згенерувати ключ</button></div>
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              {[
                { name: 'Production · CI', key: 'bf_live_xK28A9rQt7…m0Z2', scope: 'read+write', created: '12 кві', last: '3 хв тому' },
                { name: 'Slack bot',       key: 'bf_live_h7Pqm2cN8…aR4F', scope: 'read', created: '02 кві', last: '14 хв тому' },
                { name: 'Reporting · BI',  key: 'bf_live_2Lp8Kf4Vt…xQ91', scope: 'read', created: '28 бер', last: 'вчора' },
              ].map((k, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 280px 100px 120px auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                  <b style={{ fontSize: 13.5 }}>{k.name}</b>
                  <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>{k.key}</code>
                  <span className="tag">{k.scope}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>останнє: {k.last}</span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn sm"><Ic.Link sz={11}/> Копіювати</button>
                    <button className="btn sm ghost"><Ic.Trash sz={11}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="note" style={{ marginTop: 16 }}>
            <Ic.Help sz={12} style={{ verticalAlign: '-2px', marginRight: 6 }}/>
            Ключі показуються повністю лише один раз — у момент генерації. Зберігайте їх у secret manager.
          </div>
        </>)}
      </div>
    </div>
  );
}

window.Sprints = Sprints;
window.Templates = Templates;
window.Webhooks = Webhooks;
