// New Bug / New Test Case / New Project / Notifications popover / Help modal

// ============ NEW BUG ============
function NewBug({ goto }) {
  const [pri, setPri] = React.useState('high');
  const [proj, setProj] = React.useState('web');
  const [tags, setTags] = React.useState(['security', 'auth']);
  const [steps, setSteps] = React.useState([
    'Відкрити налаштування акаунту → "Безпека"',
    'Увімкнути 2FA через authenticator app',
    'Зберегти налаштування та вийти з акаунту',
    'Залогінитись повторно',
  ]);
  const me = USERS[0];

  return (
    <div className="scroll-inner">
      <div className="form-page">
        <div className="form-page-head">
          <button className="btn ghost icon" onClick={() => goto('bugs')}><Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }}/></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Новий баг</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Опишіть проблему</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">Зберегти чернетку</button>
            <button className="btn">Скасувати</button>
            <button className="btn primary"><Ic.Plus sz={13}/> Створити баг</button>
          </div>
        </div>

        <div className="form-layout">
          <div className="form-main">
            <div className="big-title-input">
              <input className="big-input" placeholder="Короткий заголовок проблеми…" defaultValue="Не зберігаються налаштування 2FA після виходу з акаунту"/>
              <div className="hint">Стисло, як у git commit. Деталі — нижче.</div>
            </div>

            <div className="ai-card" style={{ marginTop: 18 }}>
              <div className="head">
                <Ic.AI sz={14} style={{ color: 'var(--accent-soft-fg)' }}/>
                <b>AI-помічник</b>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)' }}>Знайдено 2 схожі баги</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div className="ai-suggest">
                  <span className="id-cell">BUG-2034</span>
                  <span style={{ flex: 1 }}>Темна тема: контраст тексту нижче WCAG AA на сторінці білінгу</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>72% збіг</span>
                  <button className="btn sm">Звʼязати</button>
                </div>
                <div className="ai-suggest">
                  <span className="id-cell">BUG-1987</span>
                  <span style={{ flex: 1 }}>2FA: код приходить з затримкою &gt; 30с</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>58% збіг</span>
                  <button className="btn sm">Звʼязати</button>
                </div>
              </div>
            </div>

            <div className="form-section">
              <label className="form-lbl">Опис</label>
              <div className="md-toolbar">
                <button title="Heading"><b>H</b></button>
                <button title="Bold"><b>B</b></button>
                <button title="Italic"><i>I</i></button>
                <span className="sep"/>
                <button title="List">≡</button>
                <button title="Code">{'<>'}</button>
                <button title="Link"><Ic.Link sz={11}/></button>
                <span className="sep"/>
                <button title="Attach"><Ic.Paperclip sz={11}/></button>
                <button title="Image"><Ic.Image sz={11}/></button>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-3)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Markdown <span className="kbd">M</span>
                </span>
              </div>
              <textarea className="md-area" rows="5"
                defaultValue="Після увімкнення 2FA та виходу з акаунту, при повторному вході система не запитує 2FA-код. Це фактично відключає 2FA для користувача без його відома."/>
            </div>

            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-lbl">Кроки відтворення</label>
                <button className="btn sm ghost"><Ic.Plus sz={11}/> Додати крок</button>
              </div>
              <div className="steps-edit">
                {steps.map((s, i) => (
                  <div key={i} className="step-edit">
                    <div className="num">{i + 1}</div>
                    <input className="step-inp" defaultValue={s}/>
                    <button className="btn icon ghost sm"><Ic.X sz={11}/></button>
                  </div>
                ))}
                <div className="step-edit expected">
                  <div className="num" style={{ background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)', borderColor: 'transparent' }}>✓</div>
                  <input className="step-inp" placeholder="Очікуваний результат…" defaultValue="Система запитує 2FA-код при повторному вході"/>
                </div>
                <div className="step-edit expected">
                  <div className="num" style={{ background: 'var(--st-open-bg)', color: 'var(--st-open-fg)', borderColor: 'transparent' }}>✗</div>
                  <input className="step-inp" placeholder="Фактичний результат…" defaultValue="Вхід відбувається без запиту 2FA, акаунт автентифіковано напряму"/>
                </div>
              </div>
            </div>

            <div className="form-section">
              <label className="form-lbl">Вкладення</label>
              <div className="dropzone">
                <Ic.Upload sz={20}/>
                <div>
                  <b>Перетягніть файли сюди</b>
                  <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 2 }}>або <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500, cursor: 'pointer' }}>оберіть з компʼютера</span> · до 25 MB · PNG, JPG, MP4, HAR, JSON</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  ['screenshot-2fa-modal.png', '342 KB', 'image'],
                  ['network.har', '1.2 MB', 'har'],
                  ['console-log.txt', '8 KB', 'text'],
                ].map(([nm, sz, kind]) => (
                  <div key={nm} className="att-chip">
                    <span className="att-ico">{kind === 'image' ? <Ic.Image sz={12}/> : <Ic.Paperclip sz={12}/>}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{nm}</div>
                      <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{sz}</div>
                    </div>
                    <button className="btn icon ghost sm"><Ic.X sz={11}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="form-side">
            <div className="form-card">
              <div className="fc-row">
                <span className="fc-lbl">Проєкт</span>
                <div className="select" style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: PROJECTS.find(p => p.id === proj)?.color }}/>
                    {PROJECTS.find(p => p.id === proj)?.name}
                  </span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Статус</span>
                <span className="pill open" style={{ flex: 1, justifyContent: 'flex-start' }}><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Open</span>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Пріоритет</span>
                <div className="pri-picker">
                  {Object.entries(PRIORITY).map(([k, v]) => (
                    <button key={k} className={`pri-opt ${pri === k ? 'active' : ''}`} onClick={() => setPri(k)}>
                      <PriorityBadge value={k}/>
                    </button>
                  ))}
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Виконавець</span>
                <div className="select" style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Avatar user={me}/> {me.name}
                  </span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Reporter</span>
                <div className="select" style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Avatar user="iv"/> {userById('iv').name}
                  </span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Теги</span>
                <div className="tag-picker">
                  {tags.map(t => (
                    <span key={t} className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', borderColor: 'transparent' }}>
                      {t} <Ic.X sz={9} style={{ marginLeft: 3, cursor: 'pointer' }} onClick={() => setTags(tags.filter(x => x !== t))}/>
                    </span>
                  ))}
                  <button className="chip sm"><Ic.Plus sz={10}/> Додати</button>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Дедлайн</span>
                <div className="select" style={{ flex: 1 }}>
                  <span style={{ color: 'var(--fg-3)' }}>Не встановлено</span>
                  <Ic.Calendar sz={11}/>
                </div>
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Середовище</div>
              <div className="fc-row">
                <span className="fc-lbl">Env</span>
                <div className="select" style={{ flex: 1 }}>
                  <span>Production</span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Браузер</span>
                <div className="select" style={{ flex: 1 }}>
                  <span>Safari 17.4</span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">ОС</span>
                <div className="select" style={{ flex: 1 }}>
                  <span>macOS 14.4</span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Версія</span>
                <input className="inp" defaultValue="4.18.2" style={{ flex: 1 }}/>
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Звʼязки</div>
              <button className="btn sm" style={{ width: '100%', justifyContent: 'flex-start' }}><Ic.Branch sz={12}/> Звʼязати з PR / commit</button>
              <button className="btn sm" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 6 }}><Ic.Beaker sz={12}/> Звʼязати з тест-кейсом</button>
              <button className="btn sm" style={{ width: '100%', justifyContent: 'flex-start', marginTop: 6 }}><Ic.Bug sz={12}/> Звʼязати з іншим багом</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
window.NewBug = NewBug;

// ============ NEW TEST CASE ============
function NewTestCase({ goto }) {
  const [auto, setAuto] = React.useState(false);
  const [steps, setSteps] = React.useState([
    { action: 'Відкрити сторінку логіну', expected: 'Форма входу видима' },
    { action: 'Ввести валідні credentials', expected: 'Поля підсвічуються green' },
    { action: 'Натиснути "Увійти"', expected: 'Редирект на /dashboard' },
    { action: '', expected: '' },
  ]);

  return (
    <div className="scroll-inner">
      <div className="form-page">
        <div className="form-page-head">
          <button className="btn ghost icon" onClick={() => goto('tests')}><Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }}/></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Новий тест-кейс</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Опишіть сценарій тестування</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">Зберегти чернетку</button>
            <button className="btn"><Ic.Play sz={12}/> Запустити</button>
            <button className="btn primary"><Ic.Plus sz={13}/> Створити кейс</button>
          </div>
        </div>

        <div className="form-layout">
          <div className="form-main">
            <div className="big-title-input">
              <input className="big-input" placeholder="Назва кейса…" defaultValue="Користувач може увімкнути 2FA через email-код"/>
            </div>

            <div className="form-section">
              <label className="form-lbl">Опис / Передумови</label>
              <textarea className="md-area" rows="3"
                defaultValue="Користувач має активний акаунт з підтвердженим email. Email-провайдер доступний (sendgrid). 2FA вимкнено."/>
            </div>

            <div className="form-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label className="form-lbl">Кроки</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn sm ghost"><Ic.AI sz={11}/> Згенерувати з опису</button>
                  <button className="btn sm ghost"><Ic.Plus sz={11}/> Додати крок</button>
                </div>
              </div>
              <table className="step-table">
                <thead>
                  <tr><th style={{ width: 32 }}>#</th><th>Дія</th><th>Очікуваний результат</th><th style={{ width: 32 }}/></tr>
                </thead>
                <tbody>
                  {steps.map((s, i) => (
                    <tr key={i}>
                      <td><div className="num">{i + 1}</div></td>
                      <td><input className="step-inp" placeholder="Дія…" defaultValue={s.action}/></td>
                      <td><input className="step-inp" placeholder="Очікуваний результат…" defaultValue={s.expected}/></td>
                      <td><button className="btn icon ghost sm"><Ic.X sz={11}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {auto && (
              <div className="form-section">
                <label className="form-lbl">Автоматизація</label>
                <div className="auto-card">
                  <div className="auto-head">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Ic.Beaker sz={14} style={{ color: 'var(--accent)' }}/>
                      <b>Playwright</b>
                      <span className="tag" style={{ background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)', borderColor: 'transparent' }}>звʼязано</span>
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn sm">Замінити</button>
                      <button className="btn sm ghost"><Ic.X sz={11}/></button>
                    </div>
                  </div>
                  <div className="code-block">
                    <div className="code-meta"><span>tests/auth/2fa-email.spec.ts</span><span>main · 14 рядків</span></div>
                    <pre>{`test('user can enable 2FA via email code', async ({ page }) => {
  await page.goto('/account/security');
  await page.click('[data-test="enable-2fa"]');
  await page.fill('[data-test="email-code"]', await getMailCode());
  await page.click('[data-test="confirm"]');
  await expect(page.locator('[data-test="2fa-status"]')).toHaveText('Enabled');
});`}</pre>
                  </div>
                </div>
              </div>
            )}

            <div className="form-section">
              <label className="form-lbl">Вкладення / Тестові дані</label>
              <div className="dropzone small">
                <Ic.Upload sz={16}/>
                <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Перетягніть фікстури, JSON, скріни очікуваних результатів</span>
              </div>
            </div>
          </div>

          <aside className="form-side">
            <div className="form-card">
              <div className="fc-row">
                <span className="fc-lbl">Suite</span>
                <div className="select" style={{ flex: 1 }}>
                  <span>Authentication</span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Тип</span>
                <div className="seg" style={{ flex: 1 }}>
                  <button className={!auto ? 'active' : ''} onClick={() => setAuto(false)}>Manual</button>
                  <button className={auto ? 'active' : ''} onClick={() => setAuto(true)}><Ic.Lightning sz={10}/> Auto</button>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Пріоритет</span>
                <div className="pri-picker">
                  {Object.keys(PRIORITY).map(k => (
                    <button key={k} className={`pri-opt ${k === 'critical' ? 'active' : ''}`}>
                      <PriorityBadge value={k}/>
                    </button>
                  ))}
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Автор</span>
                <div className="select" style={{ flex: 1 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Avatar user={USERS[0]}/> {USERS[0].name}
                  </span>
                  <Ic.ChevDown sz={11}/>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">Тривалість</span>
                <input className="inp" defaultValue="2-3 хв" style={{ flex: 1 }}/>
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Категорії</div>
              <div className="tag-picker">
                {['smoke', 'regression', 'auth', 'critical-path'].map(t => (
                  <span key={t} className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', borderColor: 'transparent' }}>
                    {t} <Ic.X sz={9} style={{ marginLeft: 3, cursor: 'pointer' }}/>
                  </span>
                ))}
                <button className="chip sm"><Ic.Plus sz={10}/> Додати</button>
              </div>
            </div>

            <div className="form-card">
              <div className="fc-section-title">Запуск</div>
              <div className="fc-row">
                <span className="fc-lbl">Браузери</span>
                <div className="brow-list">
                  <span className="tag">Chrome</span>
                  <span className="tag">Firefox</span>
                  <span className="tag">Safari</span>
                </div>
              </div>
              <div className="fc-row">
                <span className="fc-lbl">CI</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                  <span className="toggle on"><span/></span>
                  <span style={{ color: 'var(--fg-3)' }}>На кожен PR</span>
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
window.NewTestCase = NewTestCase;

// ============ NEW PROJECT ============
function NewProject({ goto }) {
  const [color, setColor] = React.useState('#5E6AD2');
  const [icon, setIcon] = React.useState('Layout');
  const [tmpl, setTmpl] = React.useState('web');

  const colors = ['#5E6AD2', '#0EA5E9', '#10B981', '#D97757', '#9665C9', '#E04B43', '#D4951F', '#1F1E1A'];
  const icons = ['Layout', 'Mobile', 'Repo', 'Globe', 'Beaker', 'Bug', 'Spark', 'Tag'];

  const templates = [
    { id: 'blank', name: 'Чистий проєкт', desc: 'Почати з нуля без жодних шаблонів', icon: 'Plus' },
    { id: 'web', name: 'Web-застосунок', desc: 'Smoke + регресія + cross-browser. 24 кейси, 3 suite', icon: 'Globe' },
    { id: 'mobile', name: 'Мобільний застосунок', desc: 'iOS + Android. Crash detection, в тому числі offline', icon: 'Mobile' },
    { id: 'api', name: 'API / Backend', desc: 'Контракт-тести, навантаження, безпека. Postman / pytest', icon: 'Repo' },
    { id: 'import', name: 'Імпорт з JIRA / Linear', desc: 'Перенести існуючі баги, кейси та користувачів', icon: 'Download' },
  ];

  return (
    <div className="scroll-inner">
      <div className="form-page narrow">
        <div className="form-page-head">
          <button className="btn ghost icon" onClick={() => goto('dashboard')}><Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }}/></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>Створення проєкту</div>
            <h1 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em' }}>Налаштуйте новий проєкт</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn">Скасувати</button>
            <button className="btn primary"><Ic.Plus sz={13}/> Створити проєкт</button>
          </div>
        </div>

        <div className="form-section">
          <label className="form-lbl">Шаблон</label>
          <div className="tmpl-grid">
            {templates.map(t => {
              const Icn = Ic[t.icon] || Ic.Layout;
              return (
                <div key={t.id} className={`tmpl-card ${tmpl === t.id ? 'active' : ''}`} onClick={() => setTmpl(t.id)}>
                  <div className="tmpl-ico"><Icn sz={18}/></div>
                  <div className="tmpl-meta">
                    <b>{t.name}</b>
                    <span>{t.desc}</span>
                  </div>
                  {tmpl === t.id && <div className="tmpl-check"><Ic.Check sz={11}/></div>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="np-grid">
          <div className="form-card">
            <div className="fc-section-title">Ідентичність</div>
            <div className="np-identity">
              <div className="np-preview" style={{ background: color }}>
                {(() => { const Icn = Ic[icon] || Ic.Layout; return <Icn sz={28}/>; })()}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field">
                  <label>Назва</label>
                  <input className="inp" defaultValue="BugForge Mobile"/>
                </div>
                <div className="field">
                  <label>Ключ <span style={{ color: 'var(--fg-4)', fontWeight: 400 }}>(префікс ID, напр. BFM-101)</span></label>
                  <input className="inp" defaultValue="BFM" style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}/>
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Опис</label>
              <textarea className="inp" rows="2" defaultValue="QA-простір для нативного мобільного клієнта BugForge на iOS та Android."/>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Колір</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {colors.map(c => (
                  <button key={c} className="color-swatch" onClick={() => setColor(c)}
                    style={{ background: c, boxShadow: color === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none' }}/>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Іконка</label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {icons.map(name => {
                  const Icn = Ic[name];
                  return (
                    <button key={name} className={`icon-swatch ${icon === name ? 'active' : ''}`} onClick={() => setIcon(name)}>
                      <Icn sz={15}/>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="fc-section-title">Команда та доступ</div>
            <div className="field">
              <label>Видимість</label>
              <div className="seg" style={{ width: '100%' }}>
                <button className="active" style={{ flex: 1 }}><Ic.Users sz={11}/> Команда</button>
                <button style={{ flex: 1 }}><Ic.Globe sz={11}/> Уся організація</button>
                <button style={{ flex: 1 }}><Ic.Eye sz={11}/> Приватний</button>
              </div>
            </div>

            <div className="field" style={{ marginTop: 14 }}>
              <label>Учасники</label>
              <div className="member-list">
                {USERS.slice(0, 4).map((u, i) => (
                  <div key={u.id} className="member-row">
                    <Avatar user={u}/>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{['QA Lead', 'Backend', 'QA Engineer', 'Frontend'][i]}</div>
                    </div>
                    <div className="select" style={{ width: 110 }}>
                      <span style={{ fontSize: 12 }}>{i === 0 ? 'Owner' : i === 1 ? 'Maintainer' : 'Editor'}</span>
                      <Ic.ChevDown sz={10}/>
                    </div>
                  </div>
                ))}
                <button className="btn sm ghost" style={{ marginTop: 6 }}><Ic.Plus sz={11}/> Запросити людей</button>
              </div>
            </div>
          </div>

          <div className="form-card" style={{ gridColumn: 'span 2' }}>
            <div className="fc-section-title">Інтеграції</div>
            <div className="int-mini-grid">
              {[
                ['Github', 'GitHub', 'Звʼяжіть репозиторій для авто-закриття багів'],
                ['Slack', 'Slack', 'Сповіщення про fail tests та критичні баги'],
                ['Branch', 'GitLab', 'Альтернативний git-провайдер'],
                ['AI', 'OpenAI', 'AI-підсумки та авто-теги'],
              ].map(([icnName, nm, desc]) => {
                const Icn = Ic[icnName];
                return (
                  <div key={nm} className="int-mini">
                    <div className="int-mini-logo"><Icn sz={16}/></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: 13 }}>{nm}</b>
                      <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>{desc}</div>
                    </div>
                    <button className="btn sm">Підключити</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="form-card" style={{ gridColumn: 'span 2' }}>
            <div className="fc-section-title">Робочий процес</div>
            <div className="np-workflow">
              {[
                ['open', 'Open', 'var(--st-open-dot)'],
                ['progress', 'In Progress', 'var(--st-progress-dot)'],
                ['blocked', 'Blocked', 'var(--st-blocked-dot)'],
                ['resolved', 'Resolved', 'var(--st-resolved-dot)'],
                ['closed', 'Closed', 'var(--st-closed-dot)'],
              ].map(([k, l, c], i, arr) => (
                <React.Fragment key={k}>
                  <div className="wf-node">
                    <span className="dot" style={{ background: c }}/>
                    <span>{l}</span>
                  </div>
                  {i < arr.length - 1 && <Ic.Chev sz={11} style={{ color: 'var(--fg-4)' }}/>}
                </React.Fragment>
              ))}
              <button className="btn sm ghost" style={{ marginLeft: 'auto' }}><Ic.Edit sz={11}/> Налаштувати</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.NewProject = NewProject;

// ============ NOTIFICATIONS POPOVER ============
function NotificationsPopover({ open, onClose, onOpenInbox }) {
  if (!open) return null;
  const items = [
    { kind: 'mention', who: 'np', title: 'Згадала вас у BUG-2041', when: '12 хв', read: false },
    { kind: 'assigned', who: 'ds', title: 'Призначено вам · BUG-2041', when: '34 хв', read: false },
    { kind: 'fail', who: null, title: 'TC-102 впав у TR-58', when: '1 год', read: false },
    { kind: 'review', who: 'om', title: 'Запит на ревʼю · TC-104', when: '2 год', read: false },
    { kind: 'comment', who: 'ak', title: 'Коментар у BUG-2038', when: '3 год', read: true },
    { kind: 'closed', who: 'mt', title: 'Закрито · BUG-2032', when: '5 год', read: true },
  ];
  const kindIcon = {
    mention: <Ic.Comment sz={11}/>, assigned: <Ic.User sz={11}/>, fail: <Ic.X sz={11}/>,
    review: <Ic.Eye sz={11}/>, comment: <Ic.Comment sz={11}/>, closed: <Ic.Check sz={11}/>,
  };
  const kindBg = {
    mention: 'var(--accent-soft)', assigned: 'var(--st-progress-bg)', fail: 'var(--st-open-bg)',
    review: 'var(--accent-soft)', comment: 'var(--bg-2)', closed: 'var(--st-resolved-bg)',
  };
  const kindFg = {
    mention: 'var(--accent-soft-fg)', assigned: 'var(--st-progress-fg)', fail: 'var(--st-open-fg)',
    review: 'var(--accent-soft-fg)', comment: 'var(--fg-3)', closed: 'var(--st-resolved-fg)',
  };
  const unread = items.filter(i => !i.read).length;

  return (
    <div className="popover-overlay" onClick={onClose}>
      <div className="popover notif-pop" onClick={(e) => e.stopPropagation()}>
        <div className="pop-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <b style={{ fontSize: 14 }}>Сповіщення</b>
            {unread > 0 && <span className="tag" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', borderColor: 'transparent' }}>{unread} нові</span>}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn ghost icon sm" title="Позначити всі як прочитано"><Ic.Check sz={12}/></button>
            <button className="btn ghost icon sm" title="Налаштування" onClick={() => { onClose(); }}><Ic.Settings sz={12}/></button>
          </div>
        </div>
        <div className="pop-tabs">
          <button className="active">Усі <span className="cnt">{items.length}</span></button>
          <button>Згадки <span className="cnt">{items.filter(i => i.kind === 'mention').length}</span></button>
          <button>Призначено <span className="cnt">{items.filter(i => i.kind === 'assigned').length}</span></button>
          <button>Невдалі тести <span className="cnt">{items.filter(i => i.kind === 'fail').length}</span></button>
        </div>
        <div className="pop-list">
          {items.map((it, i) => (
            <div key={i} className={`pop-item ${!it.read ? 'unread' : ''}`}>
              <span className="ib-ico" style={{ background: kindBg[it.kind], color: kindFg[it.kind] }}>{kindIcon[it.kind]}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: it.read ? 450 : 600, color: it.read ? 'var(--fg-2)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</div>
                <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{it.when} тому{it.who && ` · ${userById(it.who).name}`}</div>
              </div>
              {!it.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}/>}
            </div>
          ))}
        </div>
        <button className="pop-foot" onClick={() => { onClose(); onOpenInbox(); }}>
          Відкрити інбокс <Ic.Chev sz={11}/>
        </button>
      </div>
    </div>
  );
}
window.NotificationsPopover = NotificationsPopover;

// ============ HELP MODAL ============
function HelpModal({ open, onClose, goto }) {
  const [tab, setTab] = React.useState('start');
  if (!open) return null;

  const sections = {
    start: [
      { q: 'Як створити перший баг?', a: 'Натисніть кнопку "Створити" у верхньому правому куті або скоротіть шлях клавішею C. Заповніть заголовок, опис та кроки відтворення. AI-помічник запропонує схожі баги та згенерує теги.' },
      { q: 'Як організувати тест-кейси?', a: 'Згрупуйте кейси у Suites за функціональністю (auth, billing, profile…). Кожен кейс може бути Manual або Auto — для Auto можна звʼязати з Playwright/Cypress тестами.' },
      { q: 'Як запустити Test Run?', a: 'У вкладці Test Runs створіть новий ран, виберіть кейси (smoke, regression, конкретні suite), браузери та середовище. Раннер виконає автоматизовані та підкаже які кейси прогнати manual.' },
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
    ],
    workflows: [
      { name: 'Bug → Resolution', steps: ['Створення', 'Тріаж (priority, assignee)', 'Відтворення на staging', 'Fix у PR', 'Code review', 'Resolved → Verify QA', 'Closed'] },
      { name: 'Test Case → Automation', steps: ['Manual чернетка', 'Затвердження кроків', 'Прогон вручну (3+ рази)', 'Кодування Playwright', 'Звʼязати з кейсом', 'Включити в smoke'] },
      { name: 'Release', steps: ['Створити Test Run', 'Прогнати regression', 'Зафіксувати всі fail як баги', 'Triage критичних', 'Sign-off від QA Lead'] },
    ],
    faq: [
      { q: 'Чи можна імпортувати з JIRA?', a: 'Так — у налаштуваннях проєкту → Імпорт. Підтримуємо JIRA, Linear, Asana та CSV. Зберігаються коментарі, статуси, вкладення та звʼязки.' },
      { q: 'Як AI-підсумок працює?', a: 'GPT-4o аналізує опис, кроки, коментарі та лог-файли вкладень, потім генерує короткий summary, ймовірну причину та пропонує план відтворення. Працює на ваших даних, не зберігається у моделі.' },
      { q: 'Скільки коштує?', a: 'Free до 5 користувачів. Team — $12 / місяць за користувача. Enterprise — на запит, з SSO, audit log та on-prem.' },
      { q: 'Чи є мобільний застосунок?', a: 'Так, iOS та Android — для перегляду, призначення, коментарів та швидкої фіксації багів зі скріншотами. Створення кейсів та запуск ранів — лише з вебу.' },
    ],
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-0.015em' }}>Довідковий центр</h2>
            <div style={{ fontSize: 12.5, color: 'var(--fg-3)', marginTop: 2 }}>Відповіді, шорткати та воркфлоу команди QA</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}><Ic.X sz={14}/></button>
        </div>

        <div className="help-search">
          <Ic.Search sz={13}/>
          <input placeholder="Шукати у довідці…"/>
          <span className="kbd">/</span>
        </div>

        <div className="help-body">
          <aside className="help-tabs">
            <button className={tab === 'start' ? 'active' : ''} onClick={() => setTab('start')}>
              <Ic.Spark sz={13}/> Початок роботи
            </button>
            <button className={tab === 'shortcuts' ? 'active' : ''} onClick={() => setTab('shortcuts')}>
              <Ic.Lightning sz={13}/> Шорткати
            </button>
            <button className={tab === 'workflows' ? 'active' : ''} onClick={() => setTab('workflows')}>
              <Ic.Branch sz={13}/> Воркфлоу
            </button>
            <button className={tab === 'faq' ? 'active' : ''} onClick={() => setTab('faq')}>
              <Ic.Help sz={13}/> Часті питання
            </button>
            <div className="help-tabs-divider"/>
            <button onClick={() => { onClose?.(); goto?.('docs'); }}><Ic.Globe sz={13}/> Документація</button>
            <button onClick={() => { onClose?.(); goto?.('contact'); }}><Ic.Comment sz={13}/> Звʼязатися з підтримкою</button>
            <button onClick={() => { onClose?.(); goto?.('changelog'); }}><Ic.Github sz={13}/> Changelog</button>
          </aside>

          <div className="help-content">
            {tab === 'start' && (
              <div className="qa-list">
                <div className="qa-hero">
                  <div className="qa-hero-icon"><Ic.Spark sz={22}/></div>
                  <div>
                    <h3>Ласкаво просимо до BugForge</h3>
                    <p>Усе, що потрібно вашій QA-команді в одному місці: баги, тест-кейси, прогони, аналітика. Почніть з трьох простих кроків нижче.</p>
                  </div>
                </div>
                {sections.start.map((s, i) => (
                  <details key={i} className="qa-item" open={i === 0}>
                    <summary>
                      <span className="qa-num">{i + 1}</span>
                      <b>{s.q}</b>
                      <Ic.Chev sz={12} className="chev"/>
                    </summary>
                    <p>{s.a}</p>
                  </details>
                ))}
              </div>
            )}
            {tab === 'shortcuts' && (
              <div>
                <p style={{ color: 'var(--fg-3)', fontSize: 13, margin: '0 0 16px' }}>BugForge створений для роботи з клавіатури — більшість дій мають шорткати.</p>
                <div className="kbd-cards">
                  {sections.shortcuts.map(([k, l]) => (
                    <div key={k} className="kbd-card">
                      <span style={{ fontSize: 13 }}>{l}</span>
                      <span style={{ display: 'flex', gap: 4 }}>{k.split(' ').map((p, i) => <span key={i} className="kbd">{p}</span>)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'workflows' && (
              <div className="qa-list">
                {sections.workflows.map((w, i) => (
                  <div key={i} className="wf-card">
                    <h4>{w.name}</h4>
                    <div className="wf-steps">
                      {w.steps.map((s, j) => (
                        <React.Fragment key={j}>
                          <div className="wf-step">
                            <div className="wf-step-num">{j + 1}</div>
                            <span>{s}</span>
                          </div>
                          {j < w.steps.length - 1 && <Ic.Chev sz={10} style={{ color: 'var(--fg-4)' }}/>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {tab === 'faq' && (
              <div className="qa-list">
                {sections.faq.map((s, i) => (
                  <details key={i} className="qa-item" open={i === 0}>
                    <summary><b>{s.q}</b><Ic.Chev sz={12} className="chev"/></summary>
                    <p>{s.a}</p>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
window.HelpModal = HelpModal;
