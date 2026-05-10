// Creation forms: Workspace / Sprint / Template / Webhook / Report + Integrations page

// ============ NEW WORKSPACE ============
function NewWorkspace({ goto }) {
  const [step, setStep] = React.useState(1);
  const [name, setName] = React.useState('');
  const [slug, setSlug] = React.useState('');
  const [size, setSize] = React.useState('1-10');
  const [industry, setIndustry] = React.useState('saas');
  const [color, setColor] = React.useState('#5E6AD2');
  const [region, setRegion] = React.useState('eu');
  const [domain, setDomain] = React.useState(true);
  const PALETTE = ['#5E6AD2','#0EA5E9','#10B981','#D97757','#9665C9','#1F1E1A'];

  const onName = (v) => {
    setName(v);
    setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24));
  };

  return (
    <div style={{ padding: '32px 28px 64px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-3)', marginBottom: 16 }}>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: step >= 1 ? 'var(--accent)' : 'var(--bg-2)', color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>1</span>
        <b style={{ color: step === 1 ? 'var(--fg)' : 'var(--fg-3)' }}>Простір</b>
        <span style={{ width: 24, height: 1, background: 'var(--border)' }}/>
        <span style={{ width: 22, height: 22, borderRadius: 6, background: step >= 2 ? 'var(--accent)' : 'var(--bg-2)', color: step >= 2 ? 'white' : 'var(--fg-3)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>2</span>
        <b style={{ color: step === 2 ? 'var(--fg)' : 'var(--fg-3)' }}>Налаштування</b>
      </div>

      <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>Новий простір</h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>
        Простір — окрема організація з власними проєктами, людьми і білінгом.
      </p>

      {step === 1 && (
        <div className="card">
          <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 14, background: color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, flexShrink: 0 }}>
                {(name || 'A')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="field">
                  <label>Назва простору</label>
                  <input className="inp" placeholder="Acme Inc." value={name} onChange={e => onName(e.target.value)}/>
                </div>
              </div>
            </div>

            <div className="field">
              <label>URL-адреса</label>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--surface)', overflow: 'hidden' }}>
                <span style={{ padding: '0 10px', color: 'var(--fg-3)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>app.bugforge.io/</span>
                <input className="inp" value={slug} onChange={e => setSlug(e.target.value)} style={{ border: 'none', flex: 1, fontFamily: 'var(--font-mono)' }}/>
              </div>
            </div>

            <div className="field">
              <label>Колір простору</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{ width: 30, height: 30, borderRadius: 7, background: c, border: 'none', cursor: 'pointer', boxShadow: color === c ? '0 0 0 2px var(--surface), 0 0 0 4px ' + c : 'none' }}/>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="field">
                <label>Розмір команди</label>
                <select className="inp" value={size} onChange={e => setSize(e.target.value)}>
                  <option value="1-10">1–10 людей</option>
                  <option value="11-50">11–50 людей</option>
                  <option value="51-200">51–200 людей</option>
                  <option value="200+">200+ людей</option>
                </select>
              </div>
              <div className="field">
                <label>Сфера</label>
                <select className="inp" value={industry} onChange={e => setIndustry(e.target.value)}>
                  <option value="saas">SaaS / B2B</option>
                  <option value="ecom">E-commerce</option>
                  <option value="fintech">Fintech</option>
                  <option value="games">Ігри</option>
                  <option value="other">Інше</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--divider)' }}>
              <button className="btn" onClick={() => goto('dashboard')}>Скасувати</button>
              <button className="btn primary" onClick={() => setStep(2)} disabled={!name || !slug} style={{ opacity: (!name || !slug) ? 0.5 : 1 }}>
                Далі <Ic.Chev sz={12}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <div className="card-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>Регіон даних</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[['eu', '🇪🇺 EU · Frankfurt'], ['us', '🇺🇸 US · Virginia'], ['ap', '🌏 AP · Tokyo']].map(([v, l]) => (
                  <button key={v} onClick={() => setRegion(v)} style={{
                    padding: '12px 14px', border: region === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 8, background: region === v ? 'var(--accent-soft)' : 'var(--surface)',
                    fontSize: 13, fontWeight: 500, textAlign: 'left', cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', background: 'var(--bg-2)', borderRadius: 10 }}>
              <span style={{ marginTop: 2 }}><Ic.Globe sz={16}/></span>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13 }}>Авто-приєднання за доменом</b>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>Хтось з email на цьому домені приєднається автоматично як Учасник.</p>
              </div>
              <span className={domain ? 'toggle on' : 'toggle'} onClick={() => setDomain(d => !d)}><span/></span>
            </div>

            <div className="ai-card">
              <div className="head"><Ic.Spark sz={14}/><b>Що далі</b></div>
              <ul>
                <li>Створіть перший проєкт або імпортуйте з Jira / Linear</li>
                <li>Запросіть команду та налаштуйте ролі</li>
                <li>Підключіть GitHub, Slack або Webhooks</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--divider)' }}>
              <button className="btn" onClick={() => setStep(1)}><Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }}/> Назад</button>
              <button className="btn primary" onClick={() => goto('dashboard')}><Ic.Check sz={12}/> Створити простір</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ NEW SPRINT ============
function NewSprint({ goto }) {
  const [name, setName] = React.useState('Sprint 25 · Web v4.19');
  const [start, setStart] = React.useState('2026-05-28');
  const [end, setEnd] = React.useState('2026-06-10');
  const [goal, setGoal] = React.useState('');
  const [project, setProject] = React.useState('web');
  const [capacity, setCapacity] = React.useState(42);
  const [duration, setDuration] = React.useState('2w');
  const [autoStart, setAutoStart] = React.useState(true);

  return (
    <div style={{ padding: '24px 28px 64px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Новий спринт</h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>Сплануйте ітерацію 1–4 тижні з метою та ємністю.</p>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Основне</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Назва спринту</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)}/>
          </div>
          <div className="field">
            <label>Ціль спринту</label>
            <textarea className="inp" rows={3} value={goal} onChange={e => setGoal(e.target.value)}
              placeholder="Що команда хоче досягти за цю ітерацію?"/>
            <span style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>Використовується в звіті по завершенні · 0/200</span>
          </div>
          <div className="field">
            <label>Проєкт</label>
            <select className="inp" value={project} onChange={e => setProject(e.target.value)}>
              <option value="web">Web App</option>
              <option value="ios">iOS App</option>
              <option value="api">Public API</option>
              <option value="admin">Admin Panel</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Тривалість</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Шаблон тривалості</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[['1w', '1 тиждень'], ['2w', '2 тижні'], ['3w', '3 тижні'], ['custom', 'Власна']].map(([v, l]) => (
                <button key={v} onClick={() => setDuration(v)} style={{
                  padding: '10px 8px', border: duration === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 7, background: duration === v ? 'var(--accent-soft)' : 'var(--surface)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Старт</label>
              <input className="inp" type="date" value={start} onChange={e => setStart(e.target.value)}/>
            </div>
            <div className="field">
              <label>Кінець</label>
              <input className="inp" type="date" value={end} onChange={e => setEnd(e.target.value)}/>
            </div>
          </div>
          <div className="field">
            <label>Ємність команди (story points)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="range" min="10" max="100" step="2" value={capacity}
                     onChange={e => setCapacity(Number(e.target.value))}
                     style={{ flex: 1, accentColor: 'var(--accent)' }}/>
              <b style={{ fontSize: 18, fontVariantNumeric: 'tabular-nums', minWidth: 50, textAlign: 'right' }}>{capacity} SP</b>
            </div>
            <span style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 2 }}>Середня velocity за 6 спринтів: 41 SP</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ic.Lightning sz={18}/>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>Автоматично запустити</b>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>Спринт активується о 09:00 в день старту</p>
          </div>
          <span className={autoStart ? 'toggle on' : 'toggle'} onClick={() => setAutoStart(a => !a)}><span/></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => goto('sprints')}>Скасувати</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => goto('sprints')}>Зберегти як чернетку</button>
          <button className="btn primary" onClick={() => goto('sprints')}><Ic.Play sz={12}/> Створити та запустити</button>
        </div>
      </div>
    </div>
  );
}

// ============ NEW TEMPLATE ============
function NewTemplate({ goto }) {
  const [type, setType] = React.useState('bug');
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [tags, setTags] = React.useState(['']);
  const [fields, setFields] = React.useState([
    { key: 'steps', label: 'Кроки відтворення', kind: 'multiline', required: true },
    { key: 'expected', label: 'Очікуваний результат', kind: 'multiline', required: true },
    { key: 'actual', label: 'Фактичний результат', kind: 'multiline', required: true },
    { key: 'env', label: 'Середовище', kind: 'select', required: false },
  ]);
  const [shared, setShared] = React.useState('workspace');

  const TYPES = [
    { id: 'bug',  label: 'Баг',     icon: Ic.Bug,    desc: 'Шаблон для звіту про дефект' },
    { id: 'test', label: 'Тест-кейс', icon: Ic.Beaker, desc: 'Сценарій з кроками' },
    { id: 'run',  label: 'Test Run', icon: Ic.Play,   desc: 'Набір кейсів для прогону' },
  ];

  const addField = () => setFields(fs => [...fs, { key: 'field_' + (fs.length + 1), label: 'Нове поле', kind: 'text', required: false }]);
  const updField = (i, k, v) => setFields(fs => fs.map((f, j) => j === i ? { ...f, [k]: v } : f));
  const rmField = (i) => setFields(fs => fs.filter((_, j) => j !== i));

  return (
    <div style={{ padding: '24px 28px 64px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Новий шаблон</h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>Шаблони прискорюють створення багів, тест-кейсів і runs.</p>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Тип</h3></div>
        <div className="card-body bordered" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {TYPES.map(T => (
            <button key={T.id} onClick={() => setType(T.id)} style={{
              padding: 14, border: type === T.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 10, background: type === T.id ? 'var(--accent-soft)' : 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
              <T.icon sz={18}/>
              <b style={{ fontSize: 13.5 }}>{T.label}</b>
              <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{T.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Метадані</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Назва шаблону</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Наприклад: Краш-репорт мобільного"/>
          </div>
          <div className="field">
            <label>Опис</label>
            <textarea className="inp" rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Коли і як використовувати цей шаблон"/>
          </div>
          <div className="field">
            <label>Теги</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {tags.map((t, i) => (
                <input key={i} className="inp" value={t} onChange={e => setTags(ts => ts.map((x, j) => j === i ? e.target.value : x))}
                  placeholder="тег…" style={{ width: 120, height: 28 }}/>
              ))}
              <button className="btn sm" onClick={() => setTags(ts => [...ts, ''])}><Ic.Plus sz={11}/> Тег</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Поля шаблону</h3>
          <span className="tag" style={{ marginLeft: 8 }}>{fields.length}</span>
          <div className="right">
            <button className="btn sm" onClick={addField}><Ic.Plus sz={11}/> Додати поле</button>
          </div>
        </div>
        <div className="card-body bordered" style={{ padding: 0 }}>
          {fields.map((f, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 140px 100px 28px', gap: 10, alignItems: 'center', padding: '12px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
              <Ic.Sort sz={14} style={{ color: 'var(--fg-4)', cursor: 'grab' }}/>
              <input className="inp" value={f.label} onChange={e => updField(i, 'label', e.target.value)}/>
              <select className="inp" value={f.kind} onChange={e => updField(i, 'kind', e.target.value)}>
                <option value="text">Текст</option>
                <option value="multiline">Великий текст</option>
                <option value="select">Список</option>
                <option value="checkbox">Чекбокс</option>
                <option value="user">Користувач</option>
                <option value="date">Дата</option>
                <option value="attach">Файл</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-3)', cursor: 'pointer' }}>
                <input type="checkbox" className="cb" checked={f.required} onChange={e => updField(i, 'required', e.target.checked)}/>
                обов'язкове
              </label>
              <button className="btn ghost icon" onClick={() => rmField(i)}><Ic.X sz={12}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>Доступність</h3></div>
        <div className="card-body bordered" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[['private', 'Тільки я', Ic.User], ['workspace', 'Простір', Ic.Layout], ['public', 'Публічний', Ic.Globe]].map(([v, l, I]) => (
            <button key={v} onClick={() => setShared(v)} style={{
              padding: 12, border: shared === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 8, background: shared === v ? 'var(--accent-soft)' : 'var(--surface)',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textAlign: 'left',
            }}>
              <I sz={15}/>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{l}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => goto('templates')}>Скасувати</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Ic.Eye sz={12}/> Передогляд</button>
          <button className="btn primary" onClick={() => goto('templates')}><Ic.Check sz={12}/> Створити шаблон</button>
        </div>
      </div>
    </div>
  );
}

// ============ NEW WEBHOOK ============
function NewWebhook({ goto }) {
  const [name, setName] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [method, setMethod] = React.useState('POST');
  const [secret, setSecret] = React.useState('whsec_' + Math.random().toString(36).slice(2, 26));
  const [events, setEvents] = React.useState(['bug.created']);
  const [active, setActive] = React.useState(true);
  const [retries, setRetries] = React.useState(3);
  const [contentType, setContentType] = React.useState('application/json');

  const ALL_EVENTS = [
    { group: 'Баги', items: [
      'bug.created', 'bug.updated', 'bug.status_changed', 'bug.priority_changed',
      'bug.assigned', 'bug.commented', 'bug.linked_to_pr',
    ]},
    { group: 'Тести', items: ['test.created', 'test.updated'] },
    { group: 'Runs', items: ['run.started', 'run.completed', 'run.failed'] },
    { group: 'Спринти', items: ['sprint.started', 'sprint.completed'] },
  ];

  const toggle = (e) => setEvents(ev => ev.includes(e) ? ev.filter(x => x !== e) : [...ev, e]);

  return (
    <div style={{ padding: '24px 28px 64px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Новий webhook</h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>Надсилайте події BugForge у зовнішню систему через HTTP-запит.</p>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Endpoint</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Назва</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Slack — #qa-alerts"/>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
            <div className="field">
              <label>Метод</label>
              <select className="inp" value={method} onChange={e => setMethod(e.target.value)}>
                <option>POST</option><option>PUT</option><option>PATCH</option>
              </select>
            </div>
            <div className="field">
              <label>URL</label>
              <input className="inp" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/…" style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}/>
            </div>
          </div>
          <div className="field">
            <label>Content-Type</label>
            <select className="inp" value={contentType} onChange={e => setContentType(e.target.value)} style={{ width: 240 }}>
              <option>application/json</option>
              <option>application/x-www-form-urlencoded</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Події</h3>
          <span className="tag" style={{ marginLeft: 8 }}>{events.length} вибрано</span>
        </div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ALL_EVENTS.map(g => (
            <div key={g.group}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-4)', marginBottom: 8 }}>{g.group}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                {g.items.map(e => {
                  const on = events.includes(e);
                  return (
                    <label key={e} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                      border: on ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 7, background: on ? 'var(--accent-soft)' : 'var(--surface)',
                      cursor: 'pointer', fontSize: 12.5,
                    }}>
                      <input type="checkbox" className="cb" checked={on} onChange={() => toggle(e)}/>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: on ? 'var(--accent-soft-fg)' : 'var(--fg-2)' }}>{e}</code>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Безпека та надійність</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Signing secret</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
              <input className="inp" readOnly value={secret} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}/>
              <button className="btn" onClick={() => setSecret('whsec_' + Math.random().toString(36).slice(2, 26))}>
                <Ic.Refresh sz={11}/> Регенерувати
              </button>
            </div>
            <span style={{ fontSize: 11, color: 'var(--fg-4)', marginTop: 4 }}>
              Кожен запит підписується HMAC SHA-256 у заголовку <code>X-BugForge-Signature</code>.
            </span>
          </div>
          <div className="field">
            <label>Спроби при помилці</label>
            <select className="inp" value={retries} onChange={e => setRetries(Number(e.target.value))} style={{ width: 200 }}>
              <option value="0">Без повторів</option>
              <option value="3">3 спроби (експ. бекоф)</option>
              <option value="5">5 спроб</option>
              <option value="10">10 спроб (24г)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-body" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Ic.Lightning sz={16}/>
          <div style={{ flex: 1 }}>
            <b style={{ fontSize: 13.5 }}>Активний</b>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-3)' }}>Webhook буде надсилати події одразу після створення</p>
          </div>
          <span className={active ? 'toggle on' : 'toggle'} onClick={() => setActive(a => !a)}><span/></span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => goto('webhooks')}>Скасувати</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Ic.Lightning sz={12}/> Тест-запит</button>
          <button className="btn primary" onClick={() => goto('webhooks')} disabled={!url || !events.length} style={{ opacity: (!url || !events.length) ? 0.5 : 1 }}>
            <Ic.Check sz={12}/> Створити webhook
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ NEW REPORT ============
function NewReport({ goto }) {
  const [tpl, setTpl] = React.useState('quality');
  const [name, setName] = React.useState('');
  const [range, setRange] = React.useState('30d');
  const [metrics, setMetrics] = React.useState(['open', 'resolved', 'avg_time', 'pass_rate']);
  const [chart, setChart] = React.useState('bar');
  const [groupBy, setGroupBy] = React.useState('project');
  const [schedule, setSchedule] = React.useState('off');
  const [recipients, setRecipients] = React.useState('');

  const TEMPLATES = [
    { id: 'quality',  label: 'Огляд якості',     icon: Ic.Chart,    desc: 'Pass rate, throughput, відкриті vs закриті' },
    { id: 'sla',      label: 'SLA / Response',   icon: Ic.Clock,    desc: 'Час до first response та resolve' },
    { id: 'velocity', label: 'Velocity команди', icon: Ic.Lightning, desc: 'Story points за спринт + тренди' },
    { id: 'flaky',    label: 'Flaky тести',      icon: Ic.Activity, desc: 'Нестабільні кейси з ratio' },
    { id: 'blank',    label: 'З нуля',           icon: Ic.Plus,     desc: 'Самостійний звіт' },
  ];

  const METRICS = [
    { id: 'open', label: 'Відкриті баги' },
    { id: 'resolved', label: 'Закриті баги' },
    { id: 'avg_time', label: 'Середній час до закриття' },
    { id: 'pass_rate', label: 'Pass rate' },
    { id: 'flaky', label: 'Flaky %' },
    { id: 'velocity', label: 'Velocity' },
    { id: 'sla', label: 'SLA дотримання' },
    { id: 'created_count', label: 'Створено за період' },
  ];
  const tog = (id) => setMetrics(m => m.includes(id) ? m.filter(x => x !== id) : [...m, id]);

  return (
    <div style={{ padding: '24px 28px 64px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>Новий звіт</h1>
      <p style={{ margin: '6px 0 24px', color: 'var(--fg-3)', fontSize: 14 }}>Поєднайте метрики, період та групування — отримаєте дашборд із розкладом доставки.</p>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Шаблон</h3></div>
        <div className="card-body bordered" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {TEMPLATES.map(T => (
            <button key={T.id} onClick={() => setTpl(T.id)} style={{
              padding: 12, border: tpl === T.id ? '1.5px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 10, background: tpl === T.id ? 'var(--accent-soft)' : 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 110,
            }}>
              <T.icon sz={16}/>
              <b style={{ fontSize: 13 }}>{T.label}</b>
              <span style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.4 }}>{T.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head"><h3>Параметри</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Назва звіту</label>
            <input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="Огляд якості — Web App"/>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Період</label>
              <select className="inp" value={range} onChange={e => setRange(e.target.value)}>
                <option value="7d">Останні 7 днів</option>
                <option value="30d">Останні 30 днів</option>
                <option value="90d">Останні 90 днів</option>
                <option value="ytd">З початку року</option>
                <option value="custom">Вибрана дата</option>
              </select>
            </div>
            <div className="field">
              <label>Групувати за</label>
              <select className="inp" value={groupBy} onChange={e => setGroupBy(e.target.value)}>
                <option value="project">Проєктом</option>
                <option value="team">Командою</option>
                <option value="severity">Пріоритетом</option>
                <option value="tag">Тегом</option>
                <option value="sprint">Спринтом</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Тип візуалізації</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[['bar', 'Стовпчики'], ['line', 'Лінія'], ['stack', 'Стек'], ['table', 'Таблиця']].map(([v, l]) => (
                <button key={v} onClick={() => setChart(v)} style={{
                  padding: '10px', border: chart === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 7, background: chart === v ? 'var(--accent-soft)' : 'var(--surface)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3>Метрики</h3>
          <span className="tag" style={{ marginLeft: 8 }}>{metrics.length} обрано</span>
        </div>
        <div className="card-body bordered" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
          {METRICS.map(m => {
            const on = metrics.includes(m.id);
            return (
              <label key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
                border: on ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 7, background: on ? 'var(--accent-soft)' : 'var(--surface)',
                cursor: 'pointer', fontSize: 13,
              }}>
                <input type="checkbox" className="cb" checked={on} onChange={() => tog(m.id)}/>
                <span>{m.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>Розклад</h3></div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="field">
            <label>Доставляти автоматично</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[['off', 'Вимкнено'], ['daily', 'Щоденно'], ['weekly', 'Щотижня'], ['monthly', 'Щомісяця']].map(([v, l]) => (
                <button key={v} onClick={() => setSchedule(v)} style={{
                  padding: 10, border: schedule === v ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                  borderRadius: 7, background: schedule === v ? 'var(--accent-soft)' : 'var(--surface)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                }}>{l}</button>
              ))}
            </div>
          </div>
          {schedule !== 'off' && (
            <div className="field">
              <label>Отримувачі (email через кому)</label>
              <input className="inp" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="qa-leads@acme.com, cto@acme.com"/>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => goto('reports')}>Скасувати</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn"><Ic.Eye sz={12}/> Передогляд</button>
          <button className="btn primary" onClick={() => goto('reports')}><Ic.Check sz={12}/> Створити звіт</button>
        </div>
      </div>
    </div>
  );
}

// ============ INTEGRATIONS ============
function Integrations({ goto }) {
  const [cat, setCat] = React.useState('all');
  const [q, setQ] = React.useState('');

  const ITEMS = [
    { id: 'github',     name: 'GitHub',          cat: 'dev',     desc: 'Автоматичне зв’язування PR з багами та комітами', logo: 'GH', color: '#1F1E1A', status: 'connected', meta: 'acme/web · 14 репо' },
    { id: 'gitlab',     name: 'GitLab',          cat: 'dev',     desc: 'MR-и та pipelines у картках багів',                logo: 'GL', color: '#FC6D26', status: 'available' },
    { id: 'bitbucket',  name: 'Bitbucket',       cat: 'dev',     desc: 'PR-и та pipelines',                                logo: 'BB', color: '#2684FF', status: 'available' },
    { id: 'slack',      name: 'Slack',           cat: 'comm',    desc: 'Сповіщення в канали та ниті',                      logo: 'Sl', color: '#4A154B', status: 'connected', meta: '#qa, #releases · 7 каналів' },
    { id: 'discord',    name: 'Discord',         cat: 'comm',    desc: 'Сповіщення в сервери',                             logo: 'Ds', color: '#5865F2', status: 'available' },
    { id: 'teams',      name: 'Microsoft Teams', cat: 'comm',    desc: 'Сповіщення в канали',                              logo: 'Ts', color: '#5059C9', status: 'available' },
    { id: 'jira',       name: 'Jira',            cat: 'pm',      desc: 'Двостороння синхронізація issue ↔ bug',            logo: 'Jr', color: '#0052CC', status: 'connected', meta: 'WEB-проєкт · sync 2 хв тому' },
    { id: 'linear',     name: 'Linear',          cat: 'pm',      desc: 'Імпорт issue та статусів',                         logo: 'Ln', color: '#5E6AD2', status: 'available' },
    { id: 'asana',      name: 'Asana',           cat: 'pm',      desc: 'Tasks ↔ bugs',                                     logo: 'As', color: '#F06A6A', status: 'available' },
    { id: 'figma',      name: 'Figma',           cat: 'design',  desc: 'Прев’ю кадрів у багах',                            logo: 'Fg', color: '#A259FF', status: 'connected', meta: '3 файли' },
    { id: 'sentry',     name: 'Sentry',          cat: 'monitor', desc: 'Авто-створення багів з event-ів',                  logo: 'Sn', color: '#362D59', status: 'connected', meta: '2 проєкти' },
    { id: 'datadog',    name: 'Datadog',         cat: 'monitor', desc: 'Алерти як баги критичного пріоритету',             logo: 'Dd', color: '#632CA6', status: 'available' },
    { id: 'pagerduty',  name: 'PagerDuty',       cat: 'monitor', desc: 'Інциденти ↔ critical bugs',                        logo: 'PD', color: '#06AC38', status: 'available' },
    { id: 'jenkins',    name: 'Jenkins',         cat: 'ci',      desc: 'Запуск runs з CI',                                 logo: 'Jk', color: '#D33833', status: 'failing', meta: '14 помилок за добу' },
    { id: 'circleci',   name: 'CircleCI',        cat: 'ci',      desc: 'Pipelines у runs',                                 logo: 'Cc', color: '#161616', status: 'available' },
    { id: 'gha',        name: 'GitHub Actions',  cat: 'ci',      desc: 'Автоматичні runs на push/PR',                      logo: 'Ga', color: '#2088FF', status: 'available' },
    { id: 'browserstack', name: 'BrowserStack',  cat: 'test',    desc: 'Кросбраузерні runs',                               logo: 'BS', color: '#EE6C37', status: 'available' },
    { id: 'saucelabs',  name: 'Sauce Labs',      cat: 'test',    desc: 'Cloud-тести',                                      logo: 'SL', color: '#E2231A', status: 'available' },
    { id: 'testrail',   name: 'TestRail',        cat: 'test',    desc: 'Імпорт тест-кейсів',                               logo: 'TR', color: '#65A30D', status: 'available' },
    { id: 'zapier',     name: 'Zapier',          cat: 'auto',    desc: 'Тригери на 5000+ сервісів',                        logo: 'Zp', color: '#FF4A00', status: 'available' },
    { id: 'make',       name: 'Make',            cat: 'auto',    desc: 'Авто-сценарії',                                    logo: 'Mk', color: '#6D00CC', status: 'available' },
  ];

  const CATS = [
    { id: 'all', label: 'Усі' },
    { id: 'dev', label: 'Код' },
    { id: 'pm', label: 'Менеджмент' },
    { id: 'comm', label: 'Месенджери' },
    { id: 'monitor', label: 'Моніторинг' },
    { id: 'ci', label: 'CI / CD' },
    { id: 'test', label: 'Тестування' },
    { id: 'design', label: 'Дизайн' },
    { id: 'auto', label: 'Автоматизація' },
  ];

  const filtered = ITEMS.filter(i =>
    (cat === 'all' || i.cat === cat) &&
    (!q || (i.name + ' ' + i.desc).toLowerCase().includes(q.toLowerCase()))
  );
  const connected = ITEMS.filter(i => i.status === 'connected' || i.status === 'failing');

  const statusBadge = (s) => {
    if (s === 'connected') return <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Підключено</span>;
    if (s === 'failing') return <span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Збій</span>;
    return null;
  };

  return (
    <div className="scroll-inner">
      <div className="filters">
        <input className="search-input" placeholder="Шукати інтеграцію…" value={q} onChange={e => setQ(e.target.value)}/>
        <span className="spacer"/>
        <button className="btn"><Ic.Help sz={12}/> Документація</button>
        <button className="btn primary"><Ic.Plus sz={13}/> Запит на нову</button>
      </div>

      <div className="page">
        <div className="page-head">
          <div>
            <h1>Інтеграції</h1>
            <div className="sub">{connected.length} підключено · доступно {ITEMS.length} інтеграцій</div>
          </div>
        </div>

        {/* Connected summary */}
        {connected.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Підключені</h3>
            <div className="card">
              <div className="card-body" style={{ padding: 0 }}>
                {connected.map((it, i) => (
                  <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto auto auto', gap: 14, alignItems: 'center', padding: '14px 18px', borderTop: i ? '1px solid var(--divider)' : 'none' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: it.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700 }}>{it.logo}</div>
                    <div>
                      <b style={{ fontSize: 13.5 }}>{it.name}</b>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>{it.meta}</div>
                    </div>
                    {statusBadge(it.status)}
                    <button className="btn sm">Налаштувати</button>
                    <button className="btn sm ghost"><Ic.More sz={12}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Browse */}
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Каталог</h3>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)} style={{
              padding: '6px 12px', border: cat === c.id ? '1px solid var(--accent)' : '1px solid var(--border)',
              borderRadius: 999, background: cat === c.id ? 'var(--accent-soft)' : 'var(--surface)',
              color: cat === c.id ? 'var(--accent-soft-fg)' : 'var(--fg-2)',
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            }}>{c.label}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map(it => (
            <div key={it.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 16, display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: it.color, color: 'white', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{it.logo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <b style={{ fontSize: 14 }}>{it.name}</b>
                    {it.status === 'connected' && <span style={{ width: 7, height: 7, borderRadius: 50, background: 'var(--st-resolved-dot)' }}/>}
                    {it.status === 'failing' && <span style={{ width: 7, height: 7, borderRadius: 50, background: 'var(--st-open-dot)' }}/>}
                  </div>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>{it.desc}</p>
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="tag" style={{ marginRight: 'auto' }}>{CATS.find(c => c.id === it.cat)?.label}</span>
                {it.status === 'connected' || it.status === 'failing'
                  ? <button className="btn sm">Керувати</button>
                  : <button className="btn sm primary"><Ic.Plus sz={11}/> Підключити</button>
                }
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <Ic.Link sz={32}/>
            <h4>Нічого не знайдено</h4>
            <p>Спробуйте іншу категорію або запросіть нову інтеграцію.</p>
          </div>
        )}
      </div>
    </div>
  );
}

window.NewWorkspace = NewWorkspace;
window.NewSprint = NewSprint;
window.NewTemplate = NewTemplate;
window.NewWebhook = NewWebhook;
window.NewReport = NewReport;
window.Integrations = Integrations;
