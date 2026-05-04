// Auth screens — Sign in & Sign up (2 steps), split-screen layout

function AuthAside({ children }) {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <div>
          <span className="quote-mark">"</span>
          <div className="quote">BugForge замінив три інструменти й зекономив команді 6 годин на тиждень. Рідкісний випадок, коли &quot;все в одному&quot; справді працює.</div>
          <div className="who" style={{marginTop: 24}}>
            <div className="av">МК</div>
            <div><b>Марія Коваленко</b><span>Head of QA · Voltway</span></div>
          </div>
        </div>
        <div className="feature-list">
          <div className="row"><Ic.Check sz={16}/> 14 днів Pro без картки</div>
          <div className="row"><Ic.Check sz={16}/> Імпорт із Jira, TestRail, Linear</div>
          <div className="row"><Ic.Check sz={16}/> SOC 2 · GDPR · SAML SSO</div>
          <div className="row"><Ic.Check sz={16}/> 30+ інтеграцій з коробки</div>
        </div>
        {children}
      </div>
    </aside>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

function SignIn({ goto }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <div className="auth-form-top">
          <div className="brand" onClick={() => goto('landing')}>
            <span className="mark">B</span> BugForge
          </div>
          <div className="alt">Немає акаунту? <a onClick={() => goto('signup')}>Зареєструватися</a></div>
        </div>
        <div className="auth-form-body">
          <h1>З поверненням</h1>
          <p className="sub">Увійдіть до вашого QA-простору.</p>

          <button className="oauth-btn" onClick={() => goto('app')}>
            <GoogleIcon/> Продовжити з Google
          </button>
          <div className="oauth-divider">або email</div>

          <div className="auth-field">
            <label>Email</label>
            <input className="auth-input" type="email" placeholder="you@team.com" value={email} onChange={e => setEmail(e.target.value)}/>
          </div>
          <div className="auth-field">
            <label>Пароль <a onClick={() => alert('Лист для скидання надіслано (демо)')}>Забули?</a></label>
            <input className="auth-input" type="password" placeholder="••••••••" value={pw} onChange={e => setPw(e.target.value)}/>
          </div>
          <label className="auth-checkbox">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}/>
            Запам'ятати мене на цьому пристрої
          </label>
          <button className="auth-submit" onClick={() => goto('app')}>Увійти →</button>
          <div className="auth-foot" style={{marginTop: 16}}>
            Захищено SSO для команд.{' '}
            <a onClick={() => alert('SSO — для Enterprise (демо)')}>Увійти через SAML</a>
          </div>
        </div>
        <div className="auth-form-footer">
          <span>© 2026 BugForge</span>
          <span><a>Конфіденційність</a> · <a>Умови</a></span>
        </div>
      </div>
      <AuthAside/>
    </div>
  );
}

function SignUp({ goto }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name: '', email: '', pw: '',
    workspace: '', size: 'team', role: 'qa-lead',
  });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  return (
    <div className="auth-shell">
      <div className="auth-form-side">
        <div className="auth-form-top">
          <div className="brand" onClick={() => goto('landing')}>
            <span className="mark">B</span> BugForge
          </div>
          <div className="alt">Вже є акаунт? <a onClick={() => goto('signin')}>Увійти</a></div>
        </div>
        <div className="auth-form-body">
          {step === 1 && (
            <>
              <div className="steps-meta">Крок 1 з 2 · Акаунт</div>
              <div className="steps-bar"><div className="step-pip active"/><div className="step-pip"/></div>
              <h1>Створіть акаунт</h1>
              <p className="sub">14 днів Pro безкоштовно. Без картки.</p>

              <button className="oauth-btn" onClick={() => setStep(2)}>
                <GoogleIcon/> Зареєструватися з Google
              </button>
              <div className="oauth-divider">або email</div>

              <div className="auth-field">
                <label>Ім'я</label>
                <input className="auth-input" type="text" placeholder="Олена Петренко" value={data.name} onChange={e => set('name', e.target.value)}/>
              </div>
              <div className="auth-field">
                <label>Робочий email</label>
                <input className="auth-input" type="email" placeholder="you@team.com" value={data.email} onChange={e => set('email', e.target.value)}/>
              </div>
              <div className="auth-field">
                <label>Пароль</label>
                <input className="auth-input" type="password" placeholder="Мінімум 8 символів" value={data.pw} onChange={e => set('pw', e.target.value)}/>
                <span className="hint">Літери, цифри і хоча б один спецсимвол.</span>
              </div>
              <button className="auth-submit" onClick={() => setStep(2)}>Далі →</button>
              <div className="auth-foot" style={{marginTop: 14}}>
                Натискаючи &quot;Далі&quot;, ви погоджуєтесь з <a>Умовами</a> та <a>Політикою конфіденційності</a>.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <button className="back-link" onClick={() => setStep(1)}>
                <Ic.Chev sz={12} style={{transform: 'rotate(180deg)'}}/> Назад
              </button>
              <div className="steps-meta">Крок 2 з 2 · Команда</div>
              <div className="steps-bar"><div className="step-pip done"/><div className="step-pip active"/></div>
              <h1>Налаштуйте простір</h1>
              <p className="sub">Як називати ваш QA-простір? Цю інформацію можна змінити пізніше.</p>

              <div className="auth-field">
                <label>Назва команди / компанії</label>
                <input className="auth-input" type="text" placeholder="Voltway QA" value={data.workspace} onChange={e => set('workspace', e.target.value)}/>
                <span className="hint">URL: bugforge.io/<b>{(data.workspace || 'voltway-qa').toLowerCase().replace(/\s+/g,'-')}</b></span>
              </div>

              <div className="auth-field">
                <label>Розмір команди</label>
                <div className="workspace-grid">
                  {[
                    { id: 'solo', icon: <Ic.User sz={14}/>, color: 'var(--accent-soft)', fg: 'var(--accent-soft-fg)', t: 'Я один', s: '1 людина' },
                    { id: 'small', icon: <Ic.Users sz={14}/>, color: 'var(--st-resolved-bg)', fg: 'var(--st-resolved-fg)', t: 'Невелика', s: '2–10 людей' },
                    { id: 'team', icon: <Ic.Layout sz={14}/>, color: 'var(--st-progress-bg)', fg: 'var(--st-progress-fg)', t: 'Команда', s: '11–50 людей' },
                    { id: 'big', icon: <Ic.Spark sz={14}/>, color: 'var(--st-blocked-bg)', fg: 'var(--st-blocked-fg)', t: 'Велика', s: '50+ людей' },
                  ].map(o => (
                    <button key={o.id}
                      className={data.size === o.id ? 'workspace-pick selected' : 'workspace-pick'}
                      onClick={() => set('size', o.id)}>
                      <div className="ico" style={{background: o.color, color: o.fg}}>{o.icon}</div>
                      <b>{o.t}</b><span>{o.s}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label>Ваша роль</label>
                <select className="auth-input" value={data.role} onChange={e => set('role', e.target.value)} style={{cursor: 'pointer'}}>
                  <option value="qa-lead">QA Lead / Head of QA</option>
                  <option value="qa">QA Engineer</option>
                  <option value="dev">Розробник</option>
                  <option value="pm">Product / Project Manager</option>
                  <option value="founder">Засновник / CTO</option>
                  <option value="other">Інше</option>
                </select>
              </div>

              <button className="auth-submit" onClick={() => goto('app')}>Створити простір →</button>
            </>
          )}
        </div>
        <div className="auth-form-footer">
          <span>© 2026 BugForge</span>
          <span><a>Допомога</a></span>
        </div>
      </div>
      <AuthAside/>
    </div>
  );
}

Object.assign(window, { SignIn, SignUp, AuthAside });
