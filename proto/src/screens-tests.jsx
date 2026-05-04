// Test cases list, detail, run screens
function TestCasesList({ goto }) {
  const [q, setQ] = React.useState('');
  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0' }}>
        <div>
          <h1>Тест-кейси</h1>
          <div className="sub">{TEST_CASES.length} кейсів · 5 наборів · 78% автоматизовано</div>
        </div>
        <div className="right">
          <button className="btn"><Ic.Download sz={13}/> Експорт</button>
          <button className="btn"><Ic.Play sz={13}/> Запустити ран</button>
          <button className="btn primary"><Ic.Plus sz={13}/> Новий кейс</button>
        </div>
      </div>
      <div className="filters">
        <input className="search-input" placeholder="Пошук кейсів…" value={q} onChange={e => setQ(e.target.value)}/>
        <button className="chip applied"><span style={{ color: 'var(--fg-3)' }}>Набір:</span><span className="v">Authentication</span><Ic.X sz={11}/></button>
        <button className="chip"><Ic.Plus sz={11}/> Фільтр</button>
        <span className="spacer"/>
        <button className="btn sm"><Ic.Sort sz={12}/> Сортувати</button>
      </div>
      <div className="scroll">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', height: '100%' }}>
          <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-2)', padding: '12px 8px' }}>
            <div className="sb-section" style={{ padding: '4px 8px 6px' }}>Набори</div>
            <div className="sb-nav">
              <button className="sb-item active"><Ic.Folder sz={14}/><span>Усі</span><span className="sb-count">{TEST_CASES.length}</span></button>
              {TEST_SUITES.map(s => (
                <button key={s.id} className="sb-item">
                  <Ic.Folder sz={14}/>
                  <span>{s.name}</span>
                  <span className="sb-count">{s.count}</span>
                </button>
              ))}
            </div>
            <div className="sb-section" style={{ padding: '14px 8px 6px' }}>Тип</div>
            <div className="sb-nav">
              <button className="sb-item"><Ic.Lightning sz={14}/><span>Автоматизовані</span><span className="sb-count">112</span></button>
              <button className="sb-item"><Ic.User sz={14}/><span>Manual</span><span className="sb-count">30</span></button>
              <button className="sb-item"><Ic.Star sz={14}/><span>Smoke</span><span className="sb-count">24</span></button>
            </div>
          </aside>

          <div className="tbl-wrap">
            <table className="table">
              <thead><tr>
                <th className="checkbox-col"><input type="checkbox" className="cb"/></th>
                <th>ID</th>
                <th>Тайтл</th>
                <th>Набір</th>
                <th>Пріоритет</th>
                <th>Останній статус</th>
                <th>Тип</th>
                <th>Кроків</th>
                <th>Автор</th>
                <th>Останній ран</th>
              </tr></thead>
              <tbody>
                {TEST_CASES.map(t => (
                  <tr key={t.id} onClick={() => goto('test-detail')}>
                    <td className="checkbox-col"><input type="checkbox" className="cb"/></td>
                    <td className="id-cell">{t.id}</td>
                    <td className="title-cell">{t.title}</td>
                    <td><span className="tag">{TEST_SUITES.find(s => s.id === t.suite)?.name}</span></td>
                    <td><PriorityBadge value={t.priority}/></td>
                    <td>
                      {t.status === 'pass' && <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Passed</span>}
                      {t.status === 'fail' && <span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Failed</span>}
                      {t.status === 'skip' && <span className="pill closed"><span className="dot" style={{ background: 'var(--st-closed-dot)' }}/>Skipped</span>}
                      {t.status === 'pending' && <span className="pill closed"><span className="dot" style={{ background: 'var(--fg-4)' }}/>Pending</span>}
                    </td>
                    <td>
                      {t.automated
                        ? <span className="tag" style={{ color: 'var(--accent-soft-fg)', borderColor: 'var(--accent-soft)', background: 'var(--accent-soft)' }}><Ic.Lightning sz={10} style={{ marginRight: 3 }}/>Auto</span>
                        : <span className="tag">Manual</span>}
                    </td>
                    <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{t.steps}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar user={t.author}/><span style={{ fontSize: 12.5 }}>{userById(t.author).name.split(' ')[0]}</span></div></td>
                    <td className="muted">{t.lastRun}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function TestCaseDetail({ goto }) {
  const t = TEST_CASES[0];
  return (
    <div className="scroll">
      <div className="detail">
        <div className="detail-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button className="btn ghost sm" onClick={() => goto('tests')}><Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }}/> Тест-кейси</button>
            <span style={{ color: 'var(--fg-4)' }}>/</span>
            <span className="id-cell" style={{ fontSize: 13 }}>{t.id}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm"><Ic.Edit sz={12}/> Редагувати</button>
              <button className="btn sm"><Ic.Play sz={12}/> Запустити</button>
              <button className="btn sm"><Ic.More sz={13}/></button>
            </div>
          </div>
          <h1 className="detail-title">{t.title}</h1>
          <div className="detail-meta">
            <span className="id">{t.id}</span>
            <span>·</span>
            <span>автор <b style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{userById(t.author).name}</b></span>
            <span>·</span>
            <PriorityBadge value={t.priority}/>
            <span className="tag" style={{ color: 'var(--accent-soft-fg)', background: 'var(--accent-soft)', borderColor: 'transparent' }}><Ic.Lightning sz={10} style={{ marginRight: 3 }}/>Automated</span>
          </div>

          <div className="section">
            <h3>Передумови</h3>
            <div className="prose">
              <ul>
                <li>Тестовий акаунт <code>qa-2fa@acme.com</code> з підтвердженою email-адресою</li>
                <li>Доступний email-провайдер для отримання коду (mailtrap)</li>
                <li>Браузер: Chrome 124+ або Firefox 124+</li>
              </ul>
            </div>
          </div>

          <div className="section">
            <h3>Кроки <span className="count">{t.steps} кроків</span></h3>
            <div className="steps">
              {[
                { txt: 'Відкрити acme.com та залогуватись як qa-2fa@acme.com', exp: 'Користувач на дашборді.' },
                { txt: 'Перейти Settings → Security', exp: 'Сторінка з секцією 2FA, тогл вимкнений.' },
                { txt: 'Натиснути «Enable 2FA via email»', exp: 'Відкривається модалка з підтвердженням email.' },
                { txt: 'Натиснути «Send code» та ввести код з email', exp: 'Поле підсвічене зеленим, кнопка «Confirm» активна.' },
                { txt: 'Натиснути «Confirm»', exp: 'Тогл «2FA enabled» зелений, відображається бейдж recovery-codes.' },
                { txt: 'Зробити logout та залогуватись повторно', exp: 'На login-екрані з\'являється поле для 2FA-коду.' },
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="num">{i + 1}</div>
                  <div className="body">{s.txt}<div className="expected">→ {s.exp}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Очікуваний результат</h3>
            <div className="prose">
              <p>Користувач успішно вмикає 2FA через email-код. Після logout/login система запитує код, валідує його та надає доступ. Налаштування зберігаються між сесіями.</p>
            </div>
          </div>

          <div className="section">
            <h3>Останні рани <span className="count">останні 5</span></h3>
            <div className="card" style={{ padding: 0 }}>
              {[
                { run: 'TR-58', when: '2 год тому', who: 'om', status: 'pass', dur: '2.4 с' },
                { run: 'TR-57', when: 'вчора · 16:42', who: 'ds', status: 'pass', dur: '2.1 с' },
                { run: 'TR-56', when: 'вчора · 09:14', who: 'ci', status: 'pass', dur: '2.3 с' },
                { run: 'TR-55', when: '3 дні тому', who: 'ci', status: 'fail', dur: '12.4 с' },
                { run: 'TR-54', when: '4 дні тому', who: 'np', status: 'pass', dur: '2.2 с' },
              ].map((r, i) => (
                <div key={i} className="list-row" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, borderBottom: i < 4 ? '1px solid var(--divider)' : 'none' }}>
                  <span className={`tr-status-icon ${r.status}`}>{r.status === 'pass' ? <Ic.Check sz={10}/> : <Ic.X sz={10}/>}</span>
                  <b style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.run}</b>
                  <span style={{ color: 'var(--fg-3)' }}>{r.who === 'ci' ? 'CI · GitHub Actions' : userById(r.who).name}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--fg-3)', fontSize: 12 }}>{r.dur}</span>
                  <span style={{ color: 'var(--fg-3)', fontSize: 12 }}>{r.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="detail-side">
          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Властивості</h4>
              <div className="side-row"><span className="lbl">Набір</span><span className="val"><Ic.Folder sz={13}/><span>Authentication</span></span></div>
              <div className="side-row"><span className="lbl">Пріоритет</span><span className="val"><PriorityBadge value={t.priority}/></span></div>
              <div className="side-row"><span className="lbl">Тип</span><span className="val"><span className="tag" style={{ color: 'var(--accent-soft-fg)', background: 'var(--accent-soft)', borderColor: 'transparent' }}><Ic.Lightning sz={10} style={{ marginRight: 3 }}/>Automated</span></span></div>
              <div className="side-row"><span className="lbl">Сер. час</span><span className="val mono" style={{ fontFamily: 'var(--font-mono)' }}>2.3 с</span></div>
              <div className="side-row"><span className="lbl">Стабільність</span><span className="val">98.4%</span></div>
              <div className="side-row"><span className="lbl">Автор</span><span className="val"><Avatar user={t.author}/><span>{userById(t.author).name}</span></span></div>
              <div className="side-row"><span className="lbl">Платформи</span><span className="val"><span className="tag">Web</span><span className="tag">iOS</span></span></div>
            </div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Pass-rate · 30 днів</h4>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>96</span>
                <span style={{ color: 'var(--fg-3)' }}>%</span>
                <span style={{ marginLeft: 'auto', color: 'var(--st-resolved-fg)', fontSize: 12 }}>+1.2%</span>
              </div>
              <Sparkline data={[88, 92, 91, 94, 95, 93, 96, 96, 97, 96]} w={280} h={48} color="var(--st-resolved-dot)"/>
            </div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Звʼязані баги</h4>
              <div className="side-row"><span className="val"><span className="id-cell">BUG-2041</span><StatusPill value="open"/></span></div>
              <div className="side-row"><span className="val"><span className="id-cell">BUG-1987</span><StatusPill value="closed"/></span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Test run
function TestRunScreen({ goto }) {
  const [active, setActive] = React.useState(2);
  const cases = [
    { id: 'TC-104', title: 'Користувач може увімкнути 2FA через email-код', status: 'pass', dur: '2.4с' },
    { id: 'TC-103', title: 'Скидання паролю відправляє лист протягом 30 секунд', status: 'pass', dur: '1.8с' },
    { id: 'TC-102', title: 'Sign-in через Google зберігає сесію 30 днів', status: 'fail', dur: '12.4с' },
    { id: 'TC-101', title: 'Невірний пароль після 5 спроб блокує акаунт на 15 хв', status: 'running', dur: '—' },
    { id: 'TC-100', title: 'Logout очищує всі активні сесії на пристроях', status: 'pending', dur: '—' },
    { id: 'TC-088', title: 'Оплата карткою Visa проходить за 1 крок', status: 'pending', dur: '—' },
    { id: 'TC-087', title: 'Failed payment показує зрозумілу помилку', status: 'pending', dur: '—' },
    { id: 'TC-086', title: 'Перехід на річний план застосовує знижку 20%', status: 'pending', dur: '—' },
    { id: 'TC-072', title: 'Зміна аватара через drag-and-drop оновлює превʼю', status: 'skip', dur: '—' },
    { id: 'TC-071', title: 'Видалення акаунта потребує підтвердження email', status: 'pass', dur: '3.1с' },
  ];
  const total = cases.length;
  const done = cases.filter(c => c.status !== 'pending' && c.status !== 'running').length;
  const passed = cases.filter(c => c.status === 'pass').length;
  const failed = cases.filter(c => c.status === 'fail').length;
  const skipped = cases.filter(c => c.status === 'skip').length;
  const pct = Math.round((done / total) * 100);
  const cur = cases[active];

  return (
    <>
      <div className="run-controls">
        <div className="run-title">
          <button className="btn ghost icon" onClick={() => goto('tests')}><Ic.Chev sz={14} style={{ transform: 'rotate(180deg)' }}/></button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>TR-58 · Smoke v4.18</div>
            <div style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>Олена Мельник · 14:22 · Chrome 124 · macOS</div>
          </div>
        </div>
        <button className="btn"><Ic.Pause sz={13}/> Пауза</button>
        <button className="btn"><Ic.Stop sz={13}/> Зупинити</button>
        <button className="btn"><Ic.Skip sz={13}/> Пропустити</button>
        <div className="progress-wrap">
          <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>{done} / {total} кейсів</span>
          <BarStack parts={[
            { value: passed, color: 'var(--st-resolved-dot)' },
            { value: failed, color: 'var(--st-open-dot)' },
            { value: skipped, color: 'var(--st-closed-dot)' },
            { value: total - done, color: 'var(--bg-2)' },
          ]}/>
          <span className="pct">{pct}%</span>
        </div>
        <span className="run-stats">
          <span style={{ color: 'var(--st-resolved-fg)' }}>● {passed} pass</span>
          <span style={{ color: 'var(--st-open-fg)' }}>● {failed} fail</span>
          <span style={{ color: 'var(--st-closed-fg)' }}>● {skipped} skip</span>
        </span>
      </div>
      <div className="tr-runner">
        <div className="tr-list">
          <h4>Черга <span style={{ color: 'var(--fg-4)' }}>{total}</span></h4>
          {cases.map((c, i) => (
            <div key={c.id} className={`tr-row ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}>
              <span className={`tr-status-icon ${c.status}`}>
                {c.status === 'pass' && <Ic.Check sz={10}/>}
                {c.status === 'fail' && <Ic.X sz={10}/>}
                {c.status === 'skip' && <Ic.Skip sz={9}/>}
                {c.status === 'running' && <Ic.Play sz={9}/>}
              </span>
              <div className="nm"><span className="id">{c.id}</span>{c.title}</div>
              <span className="when">{c.dur}</span>
              <button className="btn icon ghost sm"><Ic.More sz={12}/></button>
            </div>
          ))}
        </div>

        <div className="tr-detail">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className="id-cell">{cur.id}</span>
            {cur.status === 'fail' && <span className="pill open"><span className="dot" style={{ background: 'var(--st-open-dot)' }}/>Failed</span>}
            {cur.status === 'pass' && <span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/>Passed</span>}
            {cur.status === 'running' && <span className="pill progress"><span className="dot" style={{ background: 'var(--st-progress-dot)' }}/>Running…</span>}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm"><Ic.Bug sz={12}/> Створити баг</button>
              <button className="btn sm"><Ic.Refresh sz={12}/> Перезапустити</button>
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em' }}>{cur.title}</h2>

          <div className="section">
            <h3>Кроки виконання</h3>
            <div className="steps">
              {[
                { txt: 'Відкрити acme.com та натиснути «Sign in with Google»', status: 'pass', dur: '0.8с' },
                { txt: 'Авторизуватись у Google-попапі (qa-google@acme.com)', status: 'pass', dur: '4.2с' },
                { txt: 'Дочекатись редіректу на дашборд', status: 'pass', dur: '1.1с' },
                { txt: 'Закрити браузер та відкрити повторно', status: 'pass', dur: '2.0с' },
                { txt: 'Перейти на acme.com — перевірити що сесія активна', status: 'fail', dur: '4.3с', err: 'Expected: dashboard. Got: login screen. Сесія не зберігається — cookie sf_session має domain=.acme.com замість .acme.com з secure-flag.' },
              ].map((s, i) => (
                <div key={i} className="step" style={s.status === 'fail' ? { borderColor: 'var(--st-open-bg)', background: 'var(--st-open-bg)' } : undefined}>
                  <div className="num" style={s.status === 'pass' ? { background: 'var(--st-resolved-dot)', color: 'white', borderColor: 'transparent' } : s.status === 'fail' ? { background: 'var(--st-open-dot)', color: 'white', borderColor: 'transparent' } : undefined}>
                    {s.status === 'pass' ? <Ic.Check sz={11}/> : s.status === 'fail' ? <Ic.X sz={11}/> : i + 1}
                  </div>
                  <div className="body">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{s.txt}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--fg-3)' }}>{s.dur}</span>
                    </div>
                    {s.err && <div className="expected" style={{ color: 'var(--st-open-fg)', marginTop: 6 }}>✕ {s.err}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Артефакти</h3>
            <div className="attach-grid">
              <div className="attach" style={{ background: 'linear-gradient(135deg,#FCE8E4,#E04B43)' }}>
                <span className="size">Screenshot</span>
                <span className="label"><Ic.Image sz={11}/> failure-step-5.png</span>
              </div>
              <div className="attach" style={{ background: 'linear-gradient(135deg,#1F1E1A,#3D3C38)' }}>
                <span className="size">Video · 0:42</span>
                <span className="label">▶ playback.mp4</span>
              </div>
              <div className="attach" style={{ background: 'linear-gradient(135deg,#ECEDFB,#5E6AD2)' }}>
                <span className="size">HAR · 1.2 MB</span>
                <span className="label">network.har</span>
              </div>
              <div className="attach" style={{ background: 'linear-gradient(135deg,#FBF1DC,#D4951F)' }}>
                <span className="size">Logs · 18 KB</span>
                <span className="label">console.log</span>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Логи</h3>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.7, color: 'var(--fg-2)', maxHeight: 220, overflow: 'auto' }}>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:04</span> <span style={{ color: 'var(--st-resolved-fg)' }}>INFO</span> Starting test TC-102</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:05</span> <span style={{ color: 'var(--st-resolved-fg)' }}>INFO</span> Navigating to https://acme.com</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:06</span> <span style={{ color: 'var(--st-resolved-fg)' }}>INFO</span> Click [data-test=signin-google]</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:10</span> <span style={{ color: 'var(--st-resolved-fg)' }}>INFO</span> Auth completed in 4.2s</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:12</span> <span style={{ color: 'var(--st-progress-fg)' }}>WARN</span> sf_session cookie missing secure-flag</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:14</span> <span style={{ color: 'var(--st-open-fg)' }}>FAIL</span> Expected element [data-test=dashboard], got [data-test=login-form]</div>
              <div><span style={{ color: 'var(--fg-4)' }}>14:22:14</span> <span style={{ color: 'var(--st-open-fg)' }}>ERROR</span> AssertionError: session not persisted across browser restart</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.TestCasesList = TestCasesList;
window.TestCaseDetail = TestCaseDetail;
window.TestRunScreen = TestRunScreen;
