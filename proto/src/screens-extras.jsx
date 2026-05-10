// Reports / Inbox / Profile screens

// ============ REPORTS ============
function Reports({ goto }) {
  const [range, setRange] = React.useState('30d');
  const [team, setTeam] = React.useState('all');

  // mock distribution data
  const byProject = [
    { name: 'Web App',     open: 28, progress: 14, resolved: 86, color: '#5E6AD2' },
    { name: 'iOS App',     open: 19, progress: 9,  resolved: 52, color: '#D97757' },
    { name: 'Public API',  open: 12, progress: 6,  resolved: 41, color: '#4CA85C' },
    { name: 'Admin Panel', open: 8,  progress: 4,  resolved: 23, color: '#9665C9' },
  ];
  const bySeverity = [
    { name: 'Critical', val: 6,  color: 'var(--pri-critical)' },
    { name: 'High',     val: 18, color: 'var(--pri-high)' },
    { name: 'Medium',   val: 41, color: 'var(--pri-medium)' },
    { name: 'Low',      val: 23, color: 'var(--pri-low)' },
  ];
  const totalSev = bySeverity.reduce((s, p) => s + p.val, 0);

  // weekly throughput bars
  const weeks = [
    { w: 'W12', opened: 14, closed: 9 },
    { w: 'W13', opened: 22, closed: 18 },
    { w: 'W14', opened: 17, closed: 24 },
    { w: 'W15', opened: 25, closed: 21 },
    { w: 'W16', opened: 19, closed: 28 },
    { w: 'W17', opened: 16, closed: 23 },
    { w: 'W18', opened: 12, closed: 19 },
    { w: 'W19', opened: 14, closed: 17 },
  ];
  const wmax = Math.max(...weeks.flatMap(w => [w.opened, w.closed]));

  // pass-rate trend (line)
  const trend = [88, 86, 89, 91, 87, 85, 88, 92, 94, 91, 93, 95];
  const tmax = 100, tmin = 80;

  // team performance
  const team_rows = [
    { who: 'om', resolved: 42, found: 28, avgTime: '2.4д', sla: 96 },
    { who: 'ds', resolved: 35, found: 19, avgTime: '3.1д', sla: 91 },
    { who: 'np', resolved: 31, found: 24, avgTime: '2.8д', sla: 94 },
    { who: 'ak', resolved: 28, found: 17, avgTime: '4.2д', sla: 82 },
    { who: 'iv', resolved: 26, found: 33, avgTime: '3.6д', sla: 88 },
    { who: 'mt', resolved: 22, found: 15, avgTime: '5.1д', sla: 78 },
  ];

  return (
    <div className="scroll-inner">
      <div className="filters">
        <div className="seg">
          {[['7d','7 днів'],['30d','30 днів'],['90d','90 днів'],['ytd','З початку року']].map(([v,l]) => (
            <button key={v} className={range === v ? 'active' : ''} onClick={() => setRange(v)}>{l}</button>
          ))}
        </div>
        <button className="chip"><Ic.Folder sz={12}/> Усі проєкти</button>
        <button className="chip"><Ic.Users sz={12}/> Уся команда</button>
        <button className="chip"><Ic.Tag sz={12}/> Усі теги</button>
        <span className="spacer"/>
        <button className="btn"><Ic.Calendar sz={12}/> 21.04 — 20.05</button>
        <button className="btn"><Ic.Download sz={12}/> Експорт CSV</button>
        <button className="btn"><Ic.Image sz={12}/> PDF звіт</button>
      </div>

      <div className="page">
        <div className="page-head">
          <div>
            <h1>Звіти та аналітика</h1>
            <div className="sub">Огляд якості за останні 30 днів · оновлено 12 хв тому</div>
          </div>
          <div className="right">
            <button className="btn"><Ic.Star sz={12}/> Додати в обране</button>
            <button className="btn primary" onClick={() => goto('new-report')}><Ic.Plus sz={13}/> Новий звіт</button>
          </div>
        </div>

        {/* Top metrics */}
        <div className="metrics" style={{ marginBottom: 16 }}>
          <div className="card metric">
            <div className="metric-lbl"><Ic.Bug sz={12}/> Знайдено багів</div>
            <div className="metric-val">88<span className="unit">за період</span></div>
            <div className="metric-delta up">▲ 14% <span className="since">vs минулий місяць</span></div>
          </div>
          <div className="card metric">
            <div className="metric-lbl"><Ic.Check sz={12}/> Закрито</div>
            <div className="metric-val">102</div>
            <div className="metric-delta down">▼ +18 <span className="since">більше ніж відкрито</span></div>
          </div>
          <div className="card metric">
            <div className="metric-lbl"><Ic.Clock sz={12}/> Середній час до резолва</div>
            <div className="metric-val">3.2<span className="unit">днів</span></div>
            <div className="metric-delta down">▼ 0.6 д <span className="since">за місяць</span></div>
          </div>
          <div className="card metric">
            <div className="metric-lbl"><Ic.Beaker sz={12}/> Pass rate</div>
            <div className="metric-val">94<span className="unit">%</span></div>
            <div className="metric-delta up">▲ 2.1% <span className="since">за місяць</span></div>
          </div>
        </div>

        {/* Throughput + severity */}
        <div className="rep-grid">
          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-head">
              <h3>Throughput по тижнях</h3>
              <span className="sub">Відкрито vs закрито</span>
              <div className="right">
                <span className="legend"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/> Відкрито</span>
                <span className="legend"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/> Закрито</span>
              </div>
            </div>
            <div className="card-body">
              <div className="bars">
                {weeks.map((w, i) => (
                  <div key={i} className="bar-pair">
                    <div className="bar-stack-vert">
                      <div className="bar opened" style={{ height: `${(w.opened / wmax) * 140}px` }} title={`${w.opened} відкрито`}/>
                      <div className="bar closed" style={{ height: `${(w.closed / wmax) * 140}px` }} title={`${w.closed} закрито`}/>
                    </div>
                    <span className="lbl">{w.w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>За пріоритетом</h3>
              <span className="sub">Активні баги</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bySeverity.map(s => (
                  <div key={s.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }}/>
                        {s.name}
                      </span>
                      <span style={{ color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{s.val} ({Math.round(s.val/totalSev*100)}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-2)', borderRadius: 999 }}>
                      <div style={{ width: `${s.val/totalSev*100}%`, height: '100%', background: s.color, borderRadius: 999 }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pass rate trend + by project */}
        <div className="rep-grid" style={{ marginTop: 16 }}>
          <div className="card">
            <div className="card-head">
              <h3>Pass rate</h3>
              <span className="sub">Тренд останніх 12 ранів</span>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>95%</span>
                <span style={{ color: 'var(--st-resolved-fg)', fontSize: 12, fontWeight: 500 }}>▲ 7%</span>
              </div>
              <svg width="100%" height="120" viewBox="0 0 280 120" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="rep-grad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--accent)" stopOpacity="0.2"/>
                    <stop offset="1" stopColor="var(--accent)" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[0,1,2,3].map(i => <line key={i} x1="0" x2="280" y1={i*30+10} y2={i*30+10} stroke="var(--divider)" strokeDasharray="2 4"/>)}
                {(() => {
                  const pts = trend.map((v, i) => [(i / (trend.length-1)) * 280, 110 - ((v-tmin)/(tmax-tmin)) * 100]);
                  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
                  return (
                    <>
                      <path d={`${d} L280,120 L0,120 Z`} fill="url(#rep-grad)"/>
                      <path d={d} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round"/>
                      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.5"/>)}
                    </>
                  );
                })()}
              </svg>
            </div>
          </div>

          <div className="card" style={{ gridColumn: 'span 2' }}>
            <div className="card-head">
              <h3>За проєктами</h3>
              <span className="sub">Розподіл за статусом</span>
            </div>
            <div className="card-body">
              <table className="table" style={{ marginTop: -4 }}>
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 0 }}>Проєкт</th>
                    <th style={{ width: 90 }}>Open</th>
                    <th style={{ width: 110 }}>In Progress</th>
                    <th style={{ width: 90 }}>Resolved</th>
                    <th>Розподіл</th>
                  </tr>
                </thead>
                <tbody>
                  {byProject.map(p => {
                    const total = p.open + p.progress + p.resolved;
                    return (
                      <tr key={p.name}>
                        <td style={{ paddingLeft: 0 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }}/>
                            <b style={{ fontWeight: 500 }}>{p.name}</b>
                          </span>
                        </td>
                        <td><span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>{p.open}</span></td>
                        <td><span className="pill progress"><span className="dot" style={{ background: 'var(--st-progress-dot)' }}/>{p.progress}</span></td>
                        <td><span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>{p.resolved}</span></td>
                        <td>
                          <BarStack parts={[
                            { value: p.open, color: 'var(--st-open-dot)', label: 'Open' },
                            { value: p.progress, color: 'var(--st-progress-dot)', label: 'In Progress' },
                            { value: p.resolved, color: 'var(--st-resolved-dot)', label: 'Resolved' },
                          ]}/>
                          <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{total} всього</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Team performance */}
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head">
            <h3>Performance команди</h3>
            <span className="sub">Останні 30 днів</span>
            <div className="right">
              <button className="btn sm">Деталі</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 18 }}>Учасник</th>
                  <th>Закрито</th>
                  <th>Створено</th>
                  <th>Сер. час</th>
                  <th>SLA</th>
                  <th>Активність</th>
                </tr>
              </thead>
              <tbody>
                {team_rows.map(r => {
                  const u = userById(r.who);
                  return (
                    <tr key={r.who}>
                      <td style={{ paddingLeft: 18 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <Avatar user={u}/>
                          <b style={{ fontWeight: 500 }}>{u.name}</b>
                        </span>
                      </td>
                      <td><b style={{ fontWeight: 600 }}>{r.resolved}</b></td>
                      <td className="muted">{r.found}</td>
                      <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{r.avgTime}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 5, background: 'var(--bg-2)', borderRadius: 999 }}>
                            <div style={{ width: `${r.sla}%`, height: '100%', borderRadius: 999, background: r.sla >= 90 ? 'var(--st-resolved-dot)' : r.sla >= 80 ? 'var(--st-progress-dot)' : 'var(--st-open-dot)' }}/>
                          </div>
                          <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--fg-2)' }}>{r.sla}%</span>
                        </span>
                      </td>
                      <td>
                        <Sparkline data={[3,5,2,7,4,6,8,5,9,7]} w={80} h={20} color="var(--accent)"/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Reports = Reports;

// ============ INBOX ============
function Inbox({ goto }) {
  const [filter, setFilter] = React.useState('all');
  const [selected, setSelected] = React.useState(0);

  const items = [
    { id: 1, kind: 'mention', who: 'np', title: 'Згадала вас у BUG-2041', detail: '"@Олена, можеш глянути HAR? Думаю проблема в secure-cookie"', when: '12 хв', read: false, project: 'web' },
    { id: 2, kind: 'assigned', who: 'ds', title: 'Призначено вам · BUG-2041', detail: 'Не зберігаються налаштування 2FA після виходу з акаунту', when: '34 хв', read: false, project: 'web', priority: 'critical' },
    { id: 3, kind: 'fail', who: null, title: 'TC-102 впав у TR-58', detail: 'Sign-in через Google зберігає сесію 30 днів — assertion failed at step 3', when: '1 год', read: false, project: 'web' },
    { id: 4, kind: 'review', who: 'om', title: 'Запит на ревʼю · TC-104', detail: 'Користувач може увімкнути 2FA через email-код · оновлено 2 кроки', when: '2 год', read: false, project: 'web' },
    { id: 5, kind: 'comment', who: 'ak', title: 'Коментар у BUG-2038', detail: '"Webhook ретраїть з тим самим ID — потрібен ідемпотентний ключ"', when: '3 год', read: true, project: 'api' },
    { id: 6, kind: 'closed', who: 'mt', title: 'Закрито · BUG-2032', detail: 'Пошук не індексує коментарі до тест-кейсів · resolved as Won\'t Fix', when: '5 год', read: true, project: 'admin' },
    { id: 7, kind: 'integration', who: null, title: 'GitHub: PR #4128 змерджено', detail: 'fix(auth): persist 2FA settings across sessions → master', when: 'вчора', read: true, project: 'web' },
    { id: 8, kind: 'run', who: 'mt', title: 'Test Run TR-57 завершено', detail: 'Smoke v4.17 · 142 / 142 кейсів · 138 pass, 3 fail, 1 skip', when: 'вчора', read: true, project: 'web' },
    { id: 9, kind: 'mention', who: 'iv', title: 'Згадала вас у BUG-2034', detail: '"@Олена контраст у білінгу — це твій компонент?"', when: '2 дні', read: true, project: 'web' },
  ];

  const filtered = filter === 'all' ? items : filter === 'unread' ? items.filter(i => !i.read) : items.filter(i => i.kind === filter);
  const cur = filtered[selected] || filtered[0];

  const kindIcon = {
    mention: <Ic.Comment sz={12}/>,
    assigned: <Ic.User sz={12}/>,
    fail: <Ic.X sz={12}/>,
    review: <Ic.Eye sz={12}/>,
    comment: <Ic.Comment sz={12}/>,
    closed: <Ic.Check sz={12}/>,
    integration: <Ic.Github sz={12}/>,
    run: <Ic.Play sz={12}/>,
  };
  const kindBg = {
    mention: 'var(--accent-soft)', assigned: 'var(--st-progress-bg)', fail: 'var(--st-open-bg)',
    review: 'var(--accent-soft)', comment: 'var(--bg-2)', closed: 'var(--st-resolved-bg)',
    integration: 'var(--bg-2)', run: 'var(--st-progress-bg)',
  };
  const kindFg = {
    mention: 'var(--accent-soft-fg)', assigned: 'var(--st-progress-fg)', fail: 'var(--st-open-fg)',
    review: 'var(--accent-soft-fg)', comment: 'var(--fg-3)', closed: 'var(--st-resolved-fg)',
    integration: 'var(--fg-3)', run: 'var(--st-progress-fg)',
  };

  return (
    <div className="inbox-wrap">
      <div className="inbox-list">
        <div className="inbox-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Інбокс</h2>
            <span className="tag">{filtered.filter(i => !i.read).length} непрочитано</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn ghost icon sm" title="Позначити всі як прочитано"><Ic.Check sz={13}/></button>
            <button className="btn ghost icon sm" title="Налаштування"><Ic.Settings sz={13}/></button>
          </div>
        </div>
        <div className="inbox-tabs">
          {[['all','Усі',items.length],['unread','Непрочитані',items.filter(i=>!i.read).length],['mention','Згадки',items.filter(i=>i.kind==='mention').length],['assigned','Призначено',items.filter(i=>i.kind==='assigned').length],['review','Ревʼю',1]].map(([v,l,c]) => (
            <button key={v} className={filter === v ? 'active' : ''} onClick={() => { setFilter(v); setSelected(0); }}>
              {l}<span className="cnt">{c}</span>
            </button>
          ))}
        </div>
        <div className="inbox-items">
          {filtered.map((it, i) => (
            <div key={it.id} className={`ib-row ${i === selected ? 'active' : ''} ${!it.read ? 'unread' : ''}`} onClick={() => setSelected(i)}>
              <span className="ib-ico" style={{ background: kindBg[it.kind], color: kindFg[it.kind] }}>{kindIcon[it.kind]}</span>
              <div className="ib-body">
                <div className="ib-top">
                  <span className="ib-title">{it.title}</span>
                  <span className="ib-when">{it.when}</span>
                </div>
                <div className="ib-detail">{it.detail}</div>
              </div>
              {!it.read && <span className="ib-dot"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="inbox-detail">
        {cur && (
          <>
            <div className="ibd-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {cur.who && <Avatar user={cur.who} size="lg"/>}
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>{cur.title}</h2>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>
                    {cur.who && `${userById(cur.who).name} · `}{cur.when} тому · {PROJECTS.find(p => p.id === cur.project)?.name}
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button className="btn ghost icon" title="Архів"><Ic.Folder sz={13}/></button>
                <button className="btn ghost icon" title="Вимкнути"><Ic.Bell sz={13}/></button>
                <button className="btn"><Ic.Check sz={12}/> Готово</button>
                <button className="btn primary"><Ic.Eye sz={12}/> Відкрити</button>
              </div>
            </div>

            <div className="ibd-body">
              <div className="quote-card">
                <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6 }}>{cur.detail}</div>
              </div>

              {cur.kind === 'mention' && (
                <>
                  <div className="ibd-section-title">Контекст</div>
                  <div className="card" style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span className="id-cell">BUG-2041</span>
                      <StatusPill value="open"/>
                      <PriorityBadge value="critical"/>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>Не зберігаються налаштування 2FA після виходу з акаунту</div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--fg-3)' }}>Production · 12 коментарів · 4 вкладення</div>
                  </div>
                </>
              )}

              <div className="ibd-section-title">Швидка відповідь</div>
              <div className="reply-box">
                <textarea placeholder="Напишіть відповідь… @згадка, # для тікета"/>
                <div className="reply-actions">
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn ghost icon sm"><Ic.Paperclip sz={12}/></button>
                    <button className="btn ghost icon sm"><Ic.Image sz={12}/></button>
                    <button className="btn ghost icon sm"><Ic.AI sz={12}/></button>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="btn sm">Зберегти чернетку</button>
                    <button className="btn primary sm">Відповісти <span className="kbd" style={{ background: 'rgba(255,255,255,0.18)', borderColor: 'transparent', color: 'rgba(255,255,255,0.9)' }}>⌘↵</span></button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
window.Inbox = Inbox;

// ============ PROFILE ============
function Profile({ goto }) {
  const [tab, setTab] = React.useState('account');
  const me = USERS[0];

  const stats = [
    { lbl: 'Закрито багів', val: 247, delta: '+18 цього місяця' },
    { lbl: 'Створено кейсів', val: 89,  delta: '+5 цього тижня' },
    { lbl: 'Test Runs', val: 56, delta: 'остання вчора' },
    { lbl: 'Pass rate', val: '94%', delta: '▲ 2.1% за квартал' },
  ];

  const recent = [
    { kind: 'closed', what: 'BUG-2031', detail: 'Drag-and-drop не працює у Firefox 124', when: '5 хв' },
    { kind: 'create', what: 'TC-105', detail: 'Resend 2FA email blocks duplicate sends', when: '2 год' },
    { kind: 'run', what: 'TR-58', detail: 'Smoke v4.18 · 73 кейсів · 71 pass · 2 fail', when: '4 год' },
    { kind: 'comment', what: 'BUG-2041', detail: 'Звʼязала з PR #4128. Тимчасовий workaround…', when: 'сьогодні' },
    { kind: 'review', what: 'TC-104', detail: 'Затвердила оновлення кроків від Дмитра', when: 'вчора' },
  ];

  const tabs = [['account','Акаунт',Ic.User],['notif','Сповіщення',Ic.Bell],['security','Безпека',Ic.Settings],['integrations','Інтеграції',Ic.Github],['shortcuts','Шорткати',Ic.Lightning],['billing','Білінг',Ic.Tag]];

  return (
    <div className="scroll-inner">
      <div className="profile-banner">
        <div className="pb-bg"/>
        <div className="pb-row">
          <div className="pb-avatar" style={{ background: me.color }}>{me.initials}</div>
          <div className="pb-meta">
            <h1>{me.name}</h1>
            <div className="pb-sub">QA Lead · Acme · Web team · Київ, Україна</div>
            <div className="pb-tags">
              <span className="tag"><Ic.Star sz={10} style={{ color: 'var(--pri-high)' }}/> Top performer Q1 2026</span>
              <span className="tag"><Ic.Beaker sz={10}/> Automation specialist</span>
              <span className="tag"><Ic.Clock sz={10}/> 2 роки 4 місяці</span>
            </div>
          </div>
          <div className="pb-actions">
            <button className="btn"><Ic.Edit sz={13}/> Редагувати профіль</button>
            <button className="btn primary"><Ic.Plus sz={13}/> Створити баг</button>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div className="metrics" style={{ marginBottom: 20 }}>
          {stats.map((s, i) => (
            <div key={i} className="card metric">
              <div className="metric-lbl">{s.lbl}</div>
              <div className="metric-val">{s.val}</div>
              <div className="metric-delta down">{s.delta}</div>
            </div>
          ))}
        </div>

        <div className="profile-grid">
          <aside className="profile-tabs">
            {tabs.map(([id, lbl, Ic2]) => (
              <button key={id} className={`pf-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
                <Ic2 sz={14}/> {lbl}
              </button>
            ))}
          </aside>

          <div className="profile-content">
            {tab === 'account' && (
              <div className="card">
                <div className="card-head"><h3>Загальна інформація</h3></div>
                <div className="card-body" style={{ paddingTop: 8 }}>
                  <div className="form-grid">
                    <div className="field">
                      <label>Імʼя</label>
                      <input className="inp" defaultValue="Олена"/>
                    </div>
                    <div className="field">
                      <label>Прізвище</label>
                      <input className="inp" defaultValue="Мельник"/>
                    </div>
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                      <label>Email</label>
                      <input className="inp" defaultValue="o.melnyk@acme.com" type="email"/>
                    </div>
                    <div className="field">
                      <label>Роль</label>
                      <div className="select"><span>QA Lead</span><Ic.ChevDown sz={12}/></div>
                    </div>
                    <div className="field">
                      <label>Часовий пояс</label>
                      <div className="select"><span>Europe/Kyiv (UTC+2)</span><Ic.ChevDown sz={12}/></div>
                    </div>
                    <div className="field">
                      <label>Мова інтерфейсу</label>
                      <div className="select"><span>Українська</span><Ic.ChevDown sz={12}/></div>
                    </div>
                    <div className="field">
                      <label>Формат дати</label>
                      <div className="select"><span>DD.MM.YYYY</span><Ic.ChevDown sz={12}/></div>
                    </div>
                    <div className="field" style={{ gridColumn: 'span 2' }}>
                      <label>Bio</label>
                      <textarea className="inp" rows="3" defaultValue="QA Lead з фокусом на автоматизацію та performance testing. Веду команду з 6 інженерів. Раніше — Senior QA в Monobank."/>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--divider)' }}>
                    <button className="btn">Скасувати</button>
                    <button className="btn primary">Зберегти зміни</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'notif' && (
              <div className="card">
                <div className="card-head"><h3>Налаштування сповіщень</h3></div>
                <div className="card-body" style={{ paddingTop: 8 }}>
                  <table className="notif-table">
                    <thead><tr><th>Подія</th><th>Email</th><th>Push</th><th>Slack</th><th>Інбокс</th></tr></thead>
                    <tbody>
                      {[
                        ['Призначено баг', [1,1,1,1]],
                        ['Згадка у коментарі', [1,1,1,1]],
                        ['Коментар у моєму бaзі', [0,1,0,1]],
                        ['Зміна статусу мого бага', [0,0,0,1]],
                        ['Failed test у моєму ranі', [1,1,1,1]],
                        ['Запит на ревʼю кейса', [1,0,1,1]],
                        ['Тижневий дайджест', [1,0,0,0]],
                      ].map(([n, vals]) => (
                        <tr key={n}>
                          <td>{n}</td>
                          {vals.map((v, i) => (
                            <td key={i}><span className={`toggle ${v ? 'on' : ''}`}><span/></span></td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="quiet-hours">
                    <div>
                      <b>Тихі години</b>
                      <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Не надсилати push та Slack після робочого часу</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input className="inp small" defaultValue="19:00"/>
                      <span style={{ color: 'var(--fg-3)' }}>—</span>
                      <input className="inp small" defaultValue="09:00"/>
                      <span className="toggle on"><span/></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'security' && (
              <>
                <div className="card">
                  <div className="card-head"><h3>Двофакторна автентифікація</h3></div>
                  <div className="card-body" style={{ paddingTop: 8 }}>
                    <div className="sec-row">
                      <div className="sec-ico ok"><Ic.Check sz={16}/></div>
                      <div style={{ flex: 1 }}>
                        <b>Authenticator app</b>
                        <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Увімкнено · 1Password · додано 12.03.2025</div>
                      </div>
                      <button className="btn">Переналаштувати</button>
                    </div>
                    <div className="sec-row">
                      <div className="sec-ico ok"><Ic.Check sz={16}/></div>
                      <div style={{ flex: 1 }}>
                        <b>Резервні коди</b>
                        <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>8 з 10 кодів залишилось</div>
                      </div>
                      <button className="btn">Згенерувати нові</button>
                    </div>
                    <div className="sec-row">
                      <div className="sec-ico warn"><Ic.X sz={14}/></div>
                      <div style={{ flex: 1 }}>
                        <b>SMS-fallback</b>
                        <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Не налаштовано (рекомендовано вимкнено)</div>
                      </div>
                      <button className="btn">Додати</button>
                    </div>
                  </div>
                </div>
                <div className="card" style={{ marginTop: 16 }}>
                  <div className="card-head"><h3>Активні сесії</h3><span className="sub">3 пристроя</span></div>
                  <div className="card-body" style={{ paddingTop: 4, paddingBottom: 4 }}>
                    {[
                      ['MacBook Pro · Chrome 124', 'Київ · зараз', true],
                      ['iPhone 15 Pro · BugForge iOS', 'Київ · 2 год тому', false],
                      ['Linux · Firefox 125', 'Львів · 3 дні тому', false],
                    ].map(([nm, where, cur]) => (
                      <div key={nm} className="sess-row">
                        <Ic.Mobile sz={14}/>
                        <div style={{ flex: 1 }}>
                          <b>{nm}{cur && <span className="tag" style={{ marginLeft: 8, background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)', borderColor: 'transparent' }}>Поточна</span>}</b>
                          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{where}</div>
                        </div>
                        {!cur && <button className="btn sm">Завершити</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {tab === 'integrations' && (
              <div className="card">
                <div className="card-head"><h3>Підключені сервіси</h3></div>
                <div className="card-body" style={{ paddingTop: 8 }}>
                  {[
                    [Ic.Github, 'GitHub', 'acme/web · acme/ios · acme/api', true, 'Звʼязує PR з багами, авто-закриває по merge'],
                    [Ic.Slack, 'Slack', '#qa · #incidents · #releases', true, 'Сповіщення про критичні баги та failed runs'],
                    [Ic.AI, 'OpenAI', 'AI підсумки та авто-теги', true, 'Працює на gpt-4o · 1.2k запитів цього місяця'],
                    [Ic.Calendar, 'Google Calendar', 'Не підключено', false, 'Синхронізує дедлайни багів та test runs'],
                    [Ic.Mobile, 'Sentry', 'Не підключено', false, 'Імпорт креш-репортів як баги автоматично'],
                  ].map(([Icn, nm, info, on, desc], i) => (
                    <div key={nm} className="int-row" style={{ borderTop: i === 0 ? 'none' : '1px solid var(--divider)' }}>
                      <div className="int-logo"><Icn sz={18}/></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <b>{nm}</b>
                          {on && <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Підключено</span>}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>{info}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--fg-4)', marginTop: 4 }}>{desc}</div>
                      </div>
                      <button className="btn sm">{on ? 'Налаштувати' : 'Підключити'}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'shortcuts' && (
              <div className="card">
                <div className="card-head"><h3>Клавіатурні скорочення</h3></div>
                <div className="card-body" style={{ paddingTop: 4 }}>
                  {[
                    ['Навігація', [['Команд палітра','⌘ K'],['Огляд','⌘ 1'],['Список багів','⌘ 2'],['Тест-кейси','⌘ 3'],['Test Runs','⌘ 4']]],
                    ['Дії', [['Створити баг','C'],['Створити кейс','⇧ C'],['Призначити мені','I'],['Готово','E'],['Архівувати','⌘ ⌫']]],
                    ['Список', [['Вгору / Вниз','J / K'],['Відкрити','↵'],['Множинний вибір','⇧ J / K'],['Фільтри','F'],['Пошук','/']]],
                  ].map(([sec, rows]) => (
                    <div key={sec} className="kbd-section">
                      <h5>{sec}</h5>
                      {rows.map(([n, k]) => (
                        <div key={n} className="kbd-row">
                          <span>{n}</span>
                          <span>{k.split(' ').map((part, i) => <span key={i} className="kbd">{part}</span>)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'billing' && (
              <div className="card">
                <div className="card-head"><h3>Тарифний план</h3></div>
                <div className="card-body" style={{ paddingTop: 8 }}>
                  <div className="plan-card">
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--accent-soft-fg)' }}>Поточний план</div>
                      <h2 style={{ margin: '6px 0 4px', fontSize: 22, fontWeight: 600 }}>Team · 24 місця</h2>
                      <div style={{ fontSize: 13, color: 'var(--fg-3)' }}>$12 / місяць за користувача · оновлено 03.05.2026</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em' }}>$288<span style={{ fontSize: 14, color: 'var(--fg-3)', fontWeight: 500 }}>/міс</span></div>
                      <button className="btn primary sm" style={{ marginTop: 8 }}>Змінити план</button>
                    </div>
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12.5, color: 'var(--fg-3)' }}>Наступне списання: <b style={{ color: 'var(--fg)' }}>03.06.2026</b> · Visa •••• 4421</div>
                </div>
              </div>
            )}
          </div>

          <aside className="profile-side">
            <div className="card">
              <div className="card-head"><h3>Остання активність</h3></div>
              <div className="card-body" style={{ paddingTop: 4 }}>
                {recent.map((r, i) => (
                  <div key={i} className="pf-act">
                    <span className={`pf-act-ico ${r.kind}`}>
                      {r.kind === 'closed' && <Ic.Check sz={11}/>}
                      {r.kind === 'create' && <Ic.Plus sz={11}/>}
                      {r.kind === 'run' && <Ic.Play sz={11}/>}
                      {r.kind === 'comment' && <Ic.Comment sz={11}/>}
                      {r.kind === 'review' && <Ic.Eye sz={11}/>}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--fg)', fontWeight: 500 }}><span className="id-cell">{r.what}</span> {r.detail}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{r.when}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-head"><h3>Контрибʼюції</h3><span className="sub">90 днів</span></div>
              <div className="card-body" style={{ paddingTop: 4 }}>
                <div className="heatmap">
                  {Array.from({ length: 91 }).map((_, i) => {
                    const intensity = [0,0,1,1,2,2,3,4][Math.floor(Math.abs(Math.sin(i * 1.13)) * 8)];
                    return <span key={i} className={`hm hm-${intensity}`}/>;
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--fg-3)' }}>
                  <span>лютий</span><span>квітень</span><span>зараз</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
window.Profile = Profile;
