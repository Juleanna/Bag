// Help Center pages — Documentation / Contact / Changelog

// ============ DOCUMENTATION ============
function Documentation({ goto }) {
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState('quickstart');

  const SECTIONS = [
    { id: 'getting-started', label: 'Початок роботи', icon: Ic.Spark, items: [
      { id: 'quickstart',   t: 'Швидкий старт',         time: '5 хв', desc: 'Створіть простір, додайте проєкт і репортіть перший баг за 5 хвилин.' },
      { id: 'invite-team',  t: 'Запрошення команди',    time: '3 хв', desc: 'Як запрошувати по email, домену чи посиланню. Ролі та права.' },
      { id: 'concepts',     t: 'Ключові поняття',       time: '7 хв', desc: 'Простір, проєкт, баг, тест-кейс, run, спринт — як вони пов’язані.' },
      { id: 'first-project',t: 'Перший проєкт',         time: '4 хв', desc: 'Створення проєкту з шаблону, налаштування статусів і пріоритетів.' },
    ]},
    { id: 'bugs', label: 'Баги', icon: Ic.Bug, items: [
      { id: 'create-bug',   t: 'Створення бага',        time: '4 хв', desc: 'Поля, шаблони, вкладення, environment.' },
      { id: 'bug-workflow', t: 'Workflow та статуси',   time: '6 хв', desc: 'Open → In progress → Review → Done. Кастомні статуси.' },
      { id: 'priority-sla', t: 'Пріоритети та SLA',     time: '5 хв', desc: 'Critical / High / Medium / Low та як автоматизувати ескалації.' },
      { id: 'duplicates',   t: 'Дублікати',             time: '3 хв', desc: 'AI-детекція схожих репортів і обʼєднання тікетів.' },
    ]},
    { id: 'tests', label: 'Тестування', icon: Ic.Beaker, items: [
      { id: 'test-cases',   t: 'Тест-кейси',            time: '5 хв', desc: 'Кроки, очікуваний результат, шаблони, версіонування.' },
      { id: 'runs',         t: 'Test Runs',             time: '6 хв', desc: 'Запуск, паралельне виконання, історія результатів.' },
      { id: 'test-plans',   t: 'Тест-плани',            time: '4 хв', desc: 'Smoke, регрес, реліз-чекліст. Звʼязок з релізами.' },
    ]},
    { id: 'sprints', label: 'Спринти', icon: Ic.Lightning, items: [
      { id: 'planning',     t: 'Планування',            time: '6 хв', desc: 'Story points, ємність команди, бэклог-грумінг.' },
      { id: 'kanban',       t: 'Kanban-дошка',          time: '4 хв', desc: 'Колонки, swim lanes, WIP-ліміти.' },
      { id: 'velocity',     t: 'Velocity та burndown',  time: '5 хв', desc: 'Метрики прогресу, прогноз завершення.' },
    ]},
    { id: 'reports', label: 'Звіти', icon: Ic.Chart, items: [
      { id: 'dashboards',   t: 'Дашборди',              time: '5 хв', desc: 'Створення, шерінг, періодичність.' },
      { id: 'kpis',         t: 'KPI та SLA',            time: '6 хв', desc: 'MTTR, escape rate, defect density.' },
      { id: 'export',       t: 'Експорт',               time: '3 хв', desc: 'CSV, PDF, scheduled-розсилки.' },
    ]},
    { id: 'integrations', label: 'Інтеграції', icon: Ic.Link, items: [
      { id: 'github',       t: 'GitHub',                time: '4 хв', desc: 'PR ↔ баг звʼязки, авто-закриття, sync labels.' },
      { id: 'slack',        t: 'Slack',                 time: '3 хв', desc: 'Сповіщення в каналах, /bug-команди, threading.' },
      { id: 'jira-import',  t: 'Jira',                  time: '8 хв', desc: 'Двосторонній sync або однократний імпорт.' },
      { id: 'sso',          t: 'SSO / SAML / SCIM',     time: '10 хв', desc: 'Okta, Google, Azure AD, провіжен користувачів.' },
    ]},
    { id: 'api', label: 'API & SDK', icon: Ic.Code, items: [
      { id: 'rest',         t: 'REST API',              time: '15 хв', desc: 'Авторизація, endpoints, rate limits.' },
      { id: 'graphql',      t: 'GraphQL',               time: '12 хв', desc: 'Schema, мутації, підписки.' },
      { id: 'webhooks',     t: 'Webhooks',              time: '8 хв', desc: 'Події, signing, retry-policy.' },
      { id: 'sdk-js',       t: 'JavaScript SDK',        time: '10 хв', desc: 'npm install @bugforge/sdk, типізація, приклади.' },
      { id: 'sdk-py',       t: 'Python SDK',            time: '10 хв', desc: 'pip install bugforge, async-клієнт.' },
    ]},
    { id: 'admin', label: 'Адміністрування', icon: Ic.Settings, items: [
      { id: 'workspaces',   t: 'Простори',              time: '5 хв', desc: 'Налаштування, регіон даних, бекапи.' },
      { id: 'roles',        t: 'Ролі та права',         time: '6 хв', desc: 'Адмін, Учасник, QA, Гість. Кастомні ролі.' },
      { id: 'audit',        t: 'Audit log',             time: '4 хв', desc: 'Журнал дій для compliance (Enterprise).' },
      { id: 'billing',      t: 'Білінг',                time: '3 хв', desc: 'Плани, місця, інвойси.' },
    ]},
  ];

  const POPULAR = [
    { t: 'Як перенести баги з Jira', icon: Ic.Download, link: 'jira-import' },
    { t: 'Налаштування Slack-сповіщень', icon: Ic.Slack, link: 'slack' },
    { t: 'API: створення бага через REST', icon: Ic.Code, link: 'rest' },
    { t: 'SAML SSO з Okta', icon: Ic.Lock, link: 'sso' },
    { t: 'Налаштування ролей команди', icon: Ic.Users, link: 'roles' },
    { t: 'Webhooks: signing та retries', icon: Ic.Link, link: 'webhooks' },
  ];

  const allItems = SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s.label, sectionId: s.id, icon: s.icon })));
  const filtered = q ? allItems.filter(i => (i.t + ' ' + i.desc).toLowerCase().includes(q.toLowerCase())) : null;

  return (
    <div className="scroll-inner">
      <div className="page" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-soft) 0%, transparent 70%)',
          border: '1px solid var(--border)', borderRadius: 14, padding: '32px 36px', marginBottom: 28, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'var(--accent-soft)', opacity: 0.5 }}/>
          <div style={{ position: 'relative' }}>
            <span className="tag" style={{ background: 'var(--accent)', color: 'white', borderColor: 'transparent', marginBottom: 12 }}>Документація · v4</span>
            <h1 style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 8px' }}>Як ми можемо допомогти?</h1>
            <p style={{ margin: '0 0 20px', color: 'var(--fg-2)', fontSize: 15, maxWidth: 580 }}>
              Гайди, API-довідник і розв’язання типових задач. Понад 240 статей, оновлюються щотижня.
            </p>
            <div style={{ position: 'relative', maxWidth: 540 }}>
              <Ic.Search sz={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-3)' }}/>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Пошук: «створити webhook», «імпорт з Jira»…"
                     style={{ width: '100%', height: 44, paddingLeft: 40, paddingRight: 80, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface-1)', fontSize: 14, color: 'var(--fg)' }}/>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)', background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4 }}>⌘ /</span>
            </div>
          </div>
        </div>

        {/* Search results */}
        {filtered && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-head"><h3>Знайдено: {filtered.length}</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              {filtered.length === 0 && (
                <div className="empty" style={{ padding: 32 }}>
                  <Ic.Search sz={28}/><h4>Нічого не знайшли</h4><p>Спробуйте інші слова або зверніться в підтримку.</p>
                </div>
              )}
              {filtered.slice(0, 12).map((it, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i ? '1px solid var(--divider)' : 'none', cursor: 'pointer' }}>
                  <it.icon sz={16}/>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: 13.5 }}>{it.t}</b>
                    <div style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>{it.section} · {it.desc}</div>
                  </div>
                  <Ic.Chev sz={12} style={{ color: 'var(--fg-3)' }}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {!filtered && (<>
          {/* Popular */}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: 'var(--fg-2)' }}>Популярне</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 28 }}>
            {POPULAR.map((p, i) => (
              <button key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, textAlign: 'left', background: 'var(--surface-1)', cursor: 'pointer' }}>
                <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><p.icon sz={15}/></span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{p.t}</span>
                <Ic.Chev sz={11} style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}/>
              </button>
            ))}
          </div>

          {/* Sections */}
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', color: 'var(--fg-2)' }}>Усі розділи</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {SECTIONS.map(s => (
              <div key={s.id} className="card">
                <div style={{ padding: '16px 18px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', display: 'grid', placeItems: 'center' }}><s.icon sz={15}/></span>
                  <b style={{ fontSize: 14 }}>{s.label}</b>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)' }}>{s.items.length} статей</span>
                </div>
                <div style={{ padding: '0 8px 8px' }}>
                  {s.items.map(it => (
                    <div key={it.id} onClick={() => setActive(it.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
                      cursor: 'pointer', fontSize: 13, transition: 'background .12s',
                      background: active === it.id ? 'var(--bg-2)' : 'transparent',
                    }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-2)'}
                       onMouseOut={e => e.currentTarget.style.background = active === it.id ? 'var(--bg-2)' : 'transparent'}>
                      <Ic.Doc sz={13} style={{ color: 'var(--fg-3)', flexShrink: 0 }}/>
                      <span style={{ color: 'var(--fg-2)', flex: 1 }}>{it.t}</span>
                      <span style={{ fontSize: 11, color: 'var(--fg-4)' }}>{it.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { ico: Ic.Comment, t: 'Не знайшли відповідь?', d: 'Напишіть в підтримку — відповідаємо за 4 год.', btn: 'Звʼязатись', go: 'contact' },
              { ico: Ic.Github, t: 'Що нового?', d: 'Релізи, фікси, дорожня карта.', btn: 'Changelog', go: 'changelog' },
              { ico: Ic.Users, t: 'Спільнота', d: '12k+ QA-інженерів у Slack.', btn: 'Приєднатись', go: null },
            ].map((c, i) => (
              <div key={i} className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <c.ico sz={20} style={{ color: 'var(--accent-soft-fg)' }}/>
                <b style={{ fontSize: 14 }}>{c.t}</b>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5, flex: 1 }}>{c.d}</p>
                <button className="btn" onClick={() => c.go && goto(c.go)} style={{ alignSelf: 'flex-start', marginTop: 4 }}>{c.btn} →</button>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

// ============ CONTACT ============
function Contact({ goto }) {
  const [topic, setTopic] = React.useState('bug');
  const [priority, setPriority] = React.useState('normal');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [files, setFiles] = React.useState([]);
  const [sent, setSent] = React.useState(false);

  const TOPICS = [
    { id: 'bug',     label: 'Технічна проблема', desc: 'Щось зламалось або працює не так', icon: Ic.Bug,    color: 'var(--st-open-fg)',     bg: 'var(--st-open-bg)' },
    { id: 'how',     label: 'Як це зробити?',     desc: 'Питання по використанню', icon: Ic.Help,             color: 'var(--accent-soft-fg)', bg: 'var(--accent-soft)' },
    { id: 'feature', label: 'Запит фічі',         desc: 'Хочу новий функціонал', icon: Ic.Spark,                color: 'var(--st-progress-fg)', bg: 'var(--st-progress-bg)' },
    { id: 'billing', label: 'Білінг та підписка', desc: 'Інвойси, плани, оплата', icon: Ic.Card,                color: 'var(--st-resolved-fg)', bg: 'var(--st-resolved-bg)' },
    { id: 'sales',   label: 'Продажі / Enterprise', desc: 'Демо, on-prem, SLA', icon: Ic.Building,                  color: '#9665C9',               bg: 'rgba(150,101,201,.13)' },
    { id: 'security',label: 'Безпека',            desc: 'Repirt vulnerability', icon: Ic.Lock,                  color: 'var(--st-blocked-fg)',  bg: 'var(--st-blocked-bg)' },
  ];

  const send = (e) => {
    e?.preventDefault?.();
    if (!subject || !message) return;
    setSent(true);
  };

  if (sent) {
    return (
      <div className="scroll-inner" style={{ display: 'grid', placeItems: 'center', minHeight: '100%' }}>
        <div style={{ maxWidth: 480, textAlign: 'center', padding: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 18, background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
            <Ic.Check sz={36}/>
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>Запит надіслано</h1>
          <p style={{ margin: '10px 0 24px', color: 'var(--fg-3)', fontSize: 14, lineHeight: 1.6 }}>
            Тікет <b style={{ color: 'var(--fg-2)', fontFamily: 'var(--font-mono)' }}>SUP-{Math.floor(Math.random() * 9000 + 1000)}</b> створено.
            Очікуйте відповідь на <b style={{ color: 'var(--fg-2)' }}>olena@acme.com</b> протягом{' '}
            <b style={{ color: 'var(--fg-2)' }}>{priority === 'urgent' ? '1 години' : priority === 'high' ? '4 годин' : '24 годин'}</b>.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn" onClick={() => goto('docs')}>← До документації</button>
            <button className="btn primary" onClick={() => { setSent(false); setSubject(''); setMessage(''); setFiles([]); }}>
              Новий запит
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll-inner">
      <div className="page" style={{ maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1>Звʼязатися з нами</h1>
            <div className="sub">Зазвичай відповідаємо за 4 години у робочий час · Pro/Enterprise — пріоритетна підтримка 24/7</div>
          </div>
          <div className="right">
            <button className="btn"><Ic.Globe sz={12}/> Статус: <span style={{ color: 'var(--st-resolved-fg)', marginLeft: 4 }}>● усі системи працюють</span></button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          {/* Form */}
          <form onSubmit={send} className="card" style={{ padding: 24 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600 }}>Чим можемо допомогти?</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12.5, color: 'var(--fg-3)' }}>Виберіть категорію — це допоможе спрямувати тікет до правильної команди.</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 22 }}>
              {TOPICS.map(t => (
                <button key={t.id} type="button" onClick={() => setTopic(t.id)}
                  style={{
                    border: '1px solid', borderColor: topic === t.id ? t.color : 'var(--border)',
                    background: topic === t.id ? t.bg : 'var(--surface-1)',
                    borderRadius: 10, padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', gap: 6, transition: 'all .12s',
                    boxShadow: topic === t.id ? `0 0 0 3px ${t.bg}` : 'none',
                  }}>
                  <t.icon sz={16} style={{ color: t.color }}/>
                  <b style={{ fontSize: 13 }}>{t.label}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{t.desc}</span>
                </button>
              ))}
            </div>

            <label className="form-lbl">Тема</label>
            <input className="inp" value={subject} onChange={e => setSubject(e.target.value)}
                   placeholder="Коротко опишіть суть запиту" style={{ marginBottom: 14 }}/>

            <label className="form-lbl">Пріоритет</label>
            <div className="seg" style={{ marginBottom: 14, width: 'fit-content' }}>
              {[['low','Низький'],['normal','Звичайний'],['high','Високий'],['urgent','Терміновий']].map(([v, l]) => (
                <button key={v} type="button" className={priority === v ? 'active' : ''} onClick={() => setPriority(v)}>{l}</button>
              ))}
            </div>

            <label className="form-lbl">Опис</label>
            <textarea className="inp" value={message} onChange={e => setMessage(e.target.value)}
                      placeholder="Опишіть проблему чи питання детально. Чим більше контексту — тим швидше допоможемо. Можна вставляти URL, скріншоти, логи."
                      style={{ minHeight: 160, marginBottom: 4, resize: 'vertical' }}/>
            <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginBottom: 14 }}>{message.length} символів · підтримується Markdown</div>

            <label className="form-lbl">Вкладення</label>
            <div style={{ border: '1.5px dashed var(--border-strong)', borderRadius: 10, padding: 18, textAlign: 'center', background: 'var(--bg-2)', marginBottom: 18, cursor: 'pointer' }}
                 onClick={() => setFiles(f => [...f, { name: `screenshot-${f.length + 1}.png`, size: '128 KB' }])}>
              <Ic.Upload sz={18} style={{ color: 'var(--fg-3)', marginBottom: 4 }}/>
              <div style={{ fontSize: 13, color: 'var(--fg-2)' }}>Натисніть, щоб додати скрін, лог чи відео</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>PNG, JPG, MP4, TXT, JSON · до 25 MB</div>
            </div>
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: -10, marginBottom: 18 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12.5 }}>
                    <Ic.File sz={13} style={{ color: 'var(--fg-3)' }}/>
                    <span style={{ flex: 1 }}>{f.name}</span>
                    <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>{f.size}</span>
                    <button type="button" className="btn ghost icon" onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}><Ic.X sz={11}/></button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid var(--divider)' }}>
              <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>
                <Ic.Lock sz={11} style={{ verticalAlign: '-2px', marginRight: 4 }}/>
                Дані шифруються та доступні лише команді підтримки
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button type="button" className="btn" onClick={() => goto('docs')}>Скасувати</button>
                <button type="submit" className="btn primary" disabled={!subject || !message} style={{ opacity: (!subject || !message) ? 0.5 : 1 }}>
                  <Ic.Send sz={12}/> Надіслати
                </button>
              </div>
            </div>
          </form>

          {/* Side panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Channels */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600 }}>Інші канали</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { ico: Ic.Mail,    t: 'Email',     v: 'support@bugforge.io', d: 'Відповідь до 4 год' },
                  { ico: Ic.Comment, t: 'Чат',       v: 'у застосунку, праворуч знизу',  d: 'Pn–Pt, 9:00–18:00' },
                  { ico: Ic.Slack,   t: 'Спільнота', v: 'bugforge-community.slack.com',   d: '12k+ учасників' },
                  { ico: Ic.Github,  t: 'GitHub',    v: 'github.com/bugforge/issues',     d: 'Open-source SDK' },
                ].map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', color: 'var(--fg-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><c.ico sz={14}/></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 12.5, display: 'block' }}>{c.t}</b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.v}</div>
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>{c.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA */}
            <div className="card" style={{ padding: 20, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Ic.Spark sz={14} style={{ color: 'var(--accent-soft-fg)' }}/>
                <b style={{ fontSize: 13, color: 'var(--accent-soft-fg)' }}>Ваш план: Team</b>
              </div>
              <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.55 }}>
                Email-підтримка 4 год SLA, Pn–Pt 9–18 (EET). Перейдіть на <b>Enterprise</b> для пріоритетної підтримки 24/7 з 1-год SLA.
              </p>
              <button className="btn primary" style={{ width: '100%', justifyContent: 'center' }}>
                Дізнатись про Enterprise →
              </button>
            </div>

            {/* Office hours */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600 }}>Робочий час</h3>
              <div style={{ fontSize: 12.5, color: 'var(--fg-2)', lineHeight: 1.7 }}>
                Pn–Pt · 9:00–18:00 EET<br/>
                Sb–Nd · тільки критичні (Enterprise)<br/>
                <span style={{ color: 'var(--st-resolved-fg)' }}>● Зараз доступні</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ CHANGELOG ============
function Changelog({ goto }) {
  const [filter, setFilter] = React.useState('all');

  const RELEASES = [
    {
      v: '4.18.0', date: '7 травня 2026', tag: 'major', tagLabel: 'Major',
      title: 'AI-помічник у редакторі багів',
      summary: 'Найбільший реліз цього кварталу: автогенерація стейпів репродукції, виявлення дублів, розумний пошук природньою мовою.',
      changes: [
        { type: 'new',   t: 'AI Reproducer — згенерує покрокову інструкцію з опису бага' },
        { type: 'new',   t: 'Розумний пошук: «всі critical-баги web за минулий тиждень»' },
        { type: 'new',   t: 'Авто-детекція дублікатів при створенні бага (94% точність)' },
        { type: 'imp',   t: 'Прискорення дашборду в 3.2× (новий движок агрегацій)' },
        { type: 'imp',   t: 'Drag-n-drop вкладень з системного буфера обміну' },
        { type: 'fix',   t: 'Виправлено втрату стану фільтрів при перемиканні вкладок' },
      ],
    },
    {
      v: '4.17.2', date: '29 квітня 2026', tag: 'patch', tagLabel: 'Patch',
      title: 'Виправлення стабільності',
      summary: 'Точкові фікси після релізу 4.17.0.',
      changes: [
        { type: 'fix', t: 'Webhook інколи дублював події bug.created при retry' },
        { type: 'fix', t: 'Невірний підрахунок MTTR у звітах для тижневого періоду' },
        { type: 'fix', t: 'iOS застосунок: краш при відкритті бага без автора' },
      ],
    },
    {
      v: '4.17.0', date: '22 квітня 2026', tag: 'minor', tagLabel: 'Minor',
      title: 'Спринти та kanban-дошка',
      summary: 'Повна реалізація спринтів зі story points, burndown-чартами та плануванням ємності.',
      changes: [
        { type: 'new', t: 'Спринти: планування, активний борд, retrospectives' },
        { type: 'new', t: 'Kanban з кастомними колонками та WIP-лімітами' },
        { type: 'new', t: 'Velocity-метрики, burndown- та burnup-чарти' },
        { type: 'imp', t: 'Топбар: новий блок створення з шорткатами' },
        { type: 'imp', t: 'Шаблони багів з версіонуванням' },
      ],
    },
    {
      v: '4.16.4', date: '15 квітня 2026', tag: 'security', tagLabel: 'Security',
      title: 'Оновлення безпеки',
      summary: 'Реагування на CVE-2026-0042 у залежності node-forge.',
      changes: [
        { type: 'sec', t: 'Оновлення node-forge до 1.3.2 (CVE-2026-0042)' },
        { type: 'sec', t: 'Підсилений SCIM-провіжен: тепер потребує signed JWT' },
      ],
    },
    {
      v: '4.16.0', date: '1 квітня 2026', tag: 'minor', tagLabel: 'Minor',
      title: 'Покращення інтеграцій',
      summary: 'Нові інтеграції та глибші можливості існуючих.',
      changes: [
        { type: 'new', t: 'Нативна інтеграція з Linear: двосторонній sync' },
        { type: 'new', t: 'Datadog: автоматична прив’язка бага до інциденту' },
        { type: 'imp', t: 'GitHub: підтримка sub-issues та tasks' },
        { type: 'imp', t: 'Slack: rich-карточки з кнопками дій' },
      ],
    },
    {
      v: '4.15.0', date: '18 березня 2026', tag: 'minor', tagLabel: 'Minor',
      title: 'Звіти та експорт',
      summary: 'Розширений редактор дашбордів та підписки на звіти.',
      changes: [
        { type: 'new', t: 'Конструктор звітів: 12 типів візуалізацій' },
        { type: 'new', t: 'Запланована email-доставка PDF-звітів' },
        { type: 'imp', t: 'Експорт CSV з підтримкою кодувань (UTF-8 BOM, Win-1251)' },
      ],
    },
  ];

  const FILTERS = [
    { id: 'all',      label: 'Усі',      count: RELEASES.length },
    { id: 'major',    label: 'Major',    count: RELEASES.filter(r => r.tag === 'major').length },
    { id: 'minor',    label: 'Minor',    count: RELEASES.filter(r => r.tag === 'minor').length },
    { id: 'patch',    label: 'Patches',  count: RELEASES.filter(r => r.tag === 'patch').length },
    { id: 'security', label: 'Security', count: RELEASES.filter(r => r.tag === 'security').length },
  ];

  const TYPE_STYLE = {
    new: { label: 'Нове',      color: 'var(--st-resolved-fg)', bg: 'var(--st-resolved-bg)', icon: Ic.Plus },
    imp: { label: 'Покращено', color: 'var(--accent-soft-fg)', bg: 'var(--accent-soft)',    icon: Ic.ChevUp },
    fix: { label: 'Виправлено',color: 'var(--st-progress-fg)', bg: 'var(--st-progress-bg)', icon: Ic.Bug },
    sec: { label: 'Безпека',   color: 'var(--st-blocked-fg)',  bg: 'var(--st-blocked-bg)',  icon: Ic.Lock },
  };

  const TAG_STYLE = {
    major:    { color: 'var(--accent-soft-fg)', bg: 'var(--accent-soft)' },
    minor:    { color: 'var(--st-resolved-fg)', bg: 'var(--st-resolved-bg)' },
    patch:    { color: 'var(--st-progress-fg)', bg: 'var(--st-progress-bg)' },
    security: { color: 'var(--st-blocked-fg)',  bg: 'var(--st-blocked-bg)' },
  };

  const filtered = filter === 'all' ? RELEASES : RELEASES.filter(r => r.tag === filter);

  return (
    <div className="scroll-inner">
      <div className="page" style={{ maxWidth: 920, margin: '0 auto', width: '100%' }}>
        <div className="page-head">
          <div>
            <h1>Changelog</h1>
            <div className="sub">Історія релізів BugForge · підпишіться, щоб не пропустити</div>
          </div>
          <div className="right">
            <button className="btn"><Ic.Rss sz={12}/> RSS</button>
            <button className="btn"><Ic.Mail sz={12}/> Підписатись</button>
            <button className="btn primary"><Ic.Github sz={12}/> Дорожня карта</button>
          </div>
        </div>

        {/* Filters */}
        <div className="seg" style={{ marginBottom: 24, width: 'fit-content' }}>
          {FILTERS.map(f => (
            <button key={f.id} className={filter === f.id ? 'active' : ''} onClick={() => setFilter(f.id)}>
              {f.label} <span style={{ marginLeft: 4, fontSize: 10.5, color: 'var(--fg-4)' }}>{f.count}</span>
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 11, top: 12, bottom: 12, width: 1.5, background: 'var(--divider)' }}/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {filtered.map((r, i) => {
              const tag = TAG_STYLE[r.tag];
              return (
                <div key={r.v} style={{ display: 'grid', gridTemplateColumns: '24px 1fr', gap: 18, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: tag.bg, color: tag.color,
                    display: 'grid', placeItems: 'center',
                    border: '3px solid var(--surface-1)', zIndex: 1, marginTop: 4,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: tag.color }}/>
                  </div>

                  {/* Content */}
                  <div className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.01em', fontFamily: 'var(--font-mono)' }}>v{r.v}</h2>
                      <span className="tag" style={{ background: tag.bg, color: tag.color, borderColor: 'transparent', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', fontSize: 10 }}>
                        {r.tagLabel}
                      </span>
                      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--fg-3)' }}>{r.date}</span>
                    </div>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>{r.title}</h3>
                    <p style={{ margin: '0 0 16px', fontSize: 13.5, color: 'var(--fg-2)', lineHeight: 1.6 }}>{r.summary}</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {r.changes.map((c, j) => {
                        const T = TYPE_STYLE[c.type];
                        return (
                          <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, lineHeight: 1.55 }}>
                            <span style={{
                              flexShrink: 0, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                              background: T.bg, color: T.color, marginTop: 2,
                              minWidth: 80, textAlign: 'center',
                              textTransform: 'uppercase', letterSpacing: '0.03em',
                            }}>{T.label}</span>
                            <span style={{ color: 'var(--fg-2)' }}>{c.t}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: 14, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--divider)', fontSize: 12, color: 'var(--fg-3)' }}>
                      <a style={{ cursor: 'pointer', color: 'var(--accent-soft-fg)' }}>Повні нотатки →</a>
                      <span>·</span>
                      <a style={{ cursor: 'pointer' }}>Поділитись</a>
                      <span style={{ marginLeft: 'auto' }}>
                        <button className="btn ghost icon" style={{ height: 22, width: 22 }} title="Корисно"><Ic.ChevUp sz={11}/></button>
                        <span style={{ margin: '0 4px', fontVariantNumeric: 'tabular-nums' }}>{Math.floor(Math.random() * 80 + 20)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscribe */}
        <div style={{ marginTop: 32, padding: 28, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 14, textAlign: 'center' }}>
          <Ic.Mail sz={24} style={{ color: 'var(--accent-soft-fg)', marginBottom: 8 }}/>
          <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>Не пропускайте релізи</h3>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--fg-3)' }}>Раз на тиждень — лише важливе. Без спаму.</p>
          <div style={{ display: 'flex', gap: 8, maxWidth: 400, margin: '0 auto' }}>
            <input className="inp" placeholder="email@company.com" style={{ flex: 1 }}/>
            <button className="btn primary">Підписатись</button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Documentation = Documentation;
window.Contact = Contact;
window.Changelog = Changelog;
