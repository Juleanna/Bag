// Landing page for SaaS BugForge
// All sections, controlled by tweaks.

function SaasNav({ goto, theme, setTheme }) {
  return (
    <nav className="saas-nav">
      <div className="brand" onClick={() => goto('landing')}>
        <span className="mark">B</span>
        <span>BugForge</span>
      </div>
      <div className="links" style={{ display: window.innerWidth < 800 ? 'none' : 'flex' }}>
        <a onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Можливості</a>
        <a onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })}>Для кого</a>
        <a onClick={() => document.getElementById('integrations')?.scrollIntoView({ behavior: 'smooth' })}>Інтеграції</a>
        <a onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</a>
      </div>
      <div className="right">
        <button className="btn ghost icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Тема">
          {theme === 'dark' ? <Ic.Sun sz={14}/> : <Ic.Moon sz={14}/>}
        </button>
        <button className="btn" onClick={() => goto('signin')}>Увійти</button>
        <button className="btn primary" onClick={() => goto('signup')}>Спробувати</button>
      </div>
    </nav>
  );
}

function Hero({ variant, goto }) {
  const variants = {
    bold: {
      eyebrow: <>Нове <span className="badge">v4.18</span> AI-резюме багів</>,
      titleA: 'QA-платформа,',
      titleAccent: 'що ловить дефекти',
      titleB: 'до того, як їх побачить юзер.',
      lede: 'BugForge об\'єднує баг-трекер, тест-кейси й runs у єдиному робочому просторі. Без зайвого, без чату-смітника, без втрати контексту.',
    },
    calm: {
      eyebrow: <>QA-платформа <span className="badge">2026</span></>,
      titleA: 'Один простір для',
      titleAccent: 'багів, тестів і runs.',
      titleB: '',
      lede: 'BugForge замінює Jira + TestRail + half of Slack. Швидкий, тихий, з гарячими клавішами на кожен крок.',
    },
    dev: {
      eyebrow: <>Built for QA &amp; Dev <span className="badge">опен-бета</span></>,
      titleA: 'Жодного бага',
      titleAccent: 'без власника й кроків репро.',
      titleB: '',
      lede: 'Структурований трекер з шаблонами, AI-резюме, інтеграцією GitHub та Slack. Все, що QA-команда насправді використовує — і нічого зайвого.',
    },
  };
  const v = variants[variant] || variants.bold;
  return (
    <section className="hero">
      <div className="hero-grid-bg"/>
      <div className="hero-mesh"/>
      <div className="hero-inner">
        <div className="hero-eyebrow">
          <span className="badge">NEW</span>
          {v.eyebrow}
          <Ic.Chev sz={12}/>
        </div>
        <h1>
          {v.titleA} <span className="accent">{v.titleAccent}</span>{v.titleB && <> {v.titleB}</>}
        </h1>
        <p className="lede">{v.lede}</p>
        <div className="hero-ctas">
          <button className="btn-lg primary" onClick={() => goto('signup')}>
            Почати безкоштовно <Ic.Chev sz={14}/>
          </button>
          <button className="btn-lg secondary" onClick={() => goto('app')}>
            <Ic.Play sz={12}/> Подивитися застосунок
          </button>
        </div>
        <div className="hero-foot">
          <span><Ic.Check sz={12} style={{verticalAlign:'middle', marginRight: 4, color: 'var(--st-resolved-fg)'}}/> 14 днів безкоштовно</span>
          <span className="dot"/>
          <span>Без картки</span>
          <span className="dot"/>
          <span>SOC 2 · GDPR</span>
        </div>
      </div>

      <div className="mockup-wrap">
        <div className="mockup-frame">
          <div className="mockup-bar">
            <div className="lights"><span/><span/><span/></div>
            <div className="url"><Ic.Globe sz={10}/> app.bugforge.io/dashboard</div>
            <div style={{width: 56}}/>
          </div>
          <iframe className="mockup-iframe" src="BugForge.html" title="BugForge preview" loading="lazy"/>
        </div>
        <div className="mockup-floats">
          <div className="mock-float f1">
            <span className="dot" style={{background: 'var(--st-resolved-dot)'}}/>
            <div>
              <div style={{fontWeight: 600}}>BUG-2041 закрито</div>
              <div style={{color: 'var(--fg-3)', fontSize: 11}}>2 хв тому · Maria K.</div>
            </div>
          </div>
          <div className="mock-float f2">
            <Ic.AI sz={14} style={{color: 'var(--accent)'}}/>
            <div>
              <div style={{fontWeight: 600}}>AI · резюме готове</div>
              <div style={{color: 'var(--fg-3)', fontSize: 11}}>3 кроки репро</div>
            </div>
          </div>
          <div className="mock-float f3">
            <span className="dot" style={{background: 'var(--st-progress-dot)'}}/>
            <div>
              <div style={{fontWeight: 600}}>Smoke v4.18 · 87%</div>
              <div style={{color: 'var(--fg-3)', fontSize: 11}}>23 / 26 пройдено</div>
            </div>
          </div>
        </div>
      </div>

      <div className="logo-bar">
        <h6>Понад 800 команд довіряють BugForge</h6>
        <div className="row">
          <span className="lg"><Ic.Spark sz={16}/> Northwind</span>
          <span className="lg"><Ic.Lightning sz={16}/> Voltway</span>
          <span className="lg"><Ic.Layout sz={16}/> Plinth</span>
          <span className="lg"><Ic.Star sz={16}/> Stellar</span>
          <span className="lg"><Ic.Globe sz={16}/> Meridian</span>
          <span className="lg"><Ic.Beaker sz={16}/> Orbital</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="section-wrap">
      <div className="section-head">
        <span className="kicker">Можливості</span>
        <h2>Усе, що треба QA — і нічого зайвого</h2>
        <p>Фокус на трьох речах: фіксація дефектів, керування тест-кейсами та запуски. Без overhead'у Jira і без хаосу Trello.</p>
      </div>
      <div className="feat-grid">
        <div className="feat-card featured">
          <div className="feat-ico"><Ic.Bug sz={22}/></div>
          <h3>Структуровані баги</h3>
          <p>Шаблон з кроками репро, очікуваним і фактичним результатом, скриншотами, середовищем. AI генерує резюме та пропонує дублікати — заповнення прискорюється у 3×.</p>
          <div className="feat-vis">
            <div className="feat-vis-row"><span className="pill open"><span className="dot" style={{background:'currentColor'}}/>OPEN</span> BUG-2041 · Login throws 500</div>
            <div className="feat-vis-row"><span className="pill progress"><span className="dot" style={{background:'currentColor'}}/>IN PROGRESS</span> BUG-2039 · CSV import truncates</div>
            <div className="feat-vis-row"><span className="pill resolved"><span className="dot" style={{background:'currentColor'}}/>RESOLVED</span> BUG-2034 · Tooltip clipping</div>
          </div>
        </div>
        <div className="feat-card">
          <div className="feat-ico" style={{background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)'}}><Ic.Beaker sz={22}/></div>
          <h3>Тест-кейси</h3>
          <p>Manual і авто-тести в одній бібліотеці. Версіонування, теги, прив'язка до фіч. Імпорт із TestRail і Xray в один клік.</p>
        </div>
        <div className="feat-card">
          <div className="feat-ico" style={{background: 'var(--st-progress-bg)', color: 'var(--st-progress-fg)'}}><Ic.Play sz={22}/></div>
          <h3>Test runs</h3>
          <p>Запускайте підмножини тестів за тегом, версією, платформою. Live-прогрес, історія, графіки flakiness.</p>
        </div>
        <div className="feat-card">
          <div className="feat-ico" style={{background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)'}}><Ic.AI sz={22}/></div>
          <h3>AI-помічник</h3>
          <p>Резюме баг-репортів, генерація тест-кейсів з юзер-сторі, виявлення дублікатів. Не disrupt — допомагає там, де є рутина.</p>
        </div>
        <div className="feat-card featured">
          <div className="feat-ico" style={{background: 'var(--st-blocked-bg)', color: 'var(--st-blocked-fg)'}}><Ic.Chart sz={22}/></div>
          <h3>Звіти, що відповідають на питання</h3>
          <p>Скільки багів відкрито за тиждень? Хто закриває швидше? Що блокує реліз? Готові дашборди + експорт у CSV/PDF.</p>
          <div className="feat-vis">
            <div className="feat-vis-row" style={{justifyContent:'space-between'}}>
              <span>Open / Closed (тиждень)</span>
              <span><span style={{color:'var(--st-open-fg)'}}>▌▌▌▌</span><span style={{color:'var(--st-resolved-fg)'}}>▌▌▌▌▌▌</span></span>
            </div>
            <div className="feat-vis-row" style={{justifyContent:'space-between'}}>
              <span>MTTR · Q2</span>
              <span style={{color:'var(--st-resolved-fg)'}}>↓ 38%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  return (
    <section id="use-cases" className="section-wrap" style={{paddingTop: 32}}>
      <div className="section-head">
        <span className="kicker">Для кого</span>
        <h2>Підходить вашій ролі</h2>
        <p>BugForge приходить у команду без революцій — і одразу прибирає три-чотири інші вкладки з браузера.</p>
      </div>
      <div className="uc-grid">
        <div className="uc-card">
          <div className="uc-icon" style={{background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)'}}><Ic.User sz={20}/></div>
          <h4>QA-інженерам</h4>
          <p>Швидко фіксувати, шукати дублікати, тримати тест-кейси під контролем.</p>
          <ul className="uc-list">
            <li><Ic.Check sz={14}/> Шаблон бага з валідацією</li>
            <li><Ic.Check sz={14}/> Колекції тест-кейсів і smoke-набори</li>
            <li><Ic.Check sz={14}/> Live test runs + flakiness</li>
          </ul>
        </div>
        <div className="uc-card">
          <div className="uc-icon" style={{background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)'}}><Ic.Github sz={20}/></div>
          <h4>Розробникам</h4>
          <p>Лінк баг ↔ коміт, контекст без походів у Slack, коментарі поряд із кодом.</p>
          <ul className="uc-list">
            <li><Ic.Check sz={14}/> GitHub PR-зв'язки</li>
            <li><Ic.Check sz={14}/> Cmd+K на все</li>
            <li><Ic.Check sz={14}/> Markdown + code-блоки</li>
          </ul>
        </div>
        <div className="uc-card">
          <div className="uc-icon" style={{background: 'var(--st-progress-bg)', color: 'var(--st-progress-fg)'}}><Ic.Chart sz={20}/></div>
          <h4>Тімлідам і PM</h4>
          <p>Відповіді на &quot;що блокує?&quot; і &quot;куди йдемо?&quot; — без щоденних статусів.</p>
          <ul className="uc-list">
            <li><Ic.Check sz={14}/> Дашборд проєкту</li>
            <li><Ic.Check sz={14}/> Reports &amp; SLA</li>
            <li><Ic.Check sz={14}/> Експорт стейкхолдерам</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  const items = [
    { name: 'GitHub', mark: 'Gh', color: '#1F1E1A' },
    { name: 'GitLab', mark: 'Gl', color: '#FC6D26' },
    { name: 'Slack', mark: 'Sl', color: '#4A154B' },
    { name: 'Jira', mark: 'Ji', color: '#0052CC' },
    { name: 'Linear', mark: 'Ln', color: '#5E6AD2' },
    { name: 'Figma', mark: 'Fg', color: '#A259FF' },
    { name: 'Sentry', mark: 'Se', color: '#362D59' },
    { name: 'Datadog', mark: 'Dd', color: '#632CA6' },
    { name: 'Notion', mark: 'No', color: '#1F1E1A' },
    { name: 'Webhook', mark: 'Wh', color: '#6E6C63' },
    { name: 'Cypress', mark: 'Cy', color: '#17202C' },
    { name: 'Playwright', mark: 'Pw', color: '#2EAD33' },
  ];
  return (
    <section id="integrations" className="section-wrap" style={{paddingTop: 32}}>
      <div className="section-head">
        <span className="kicker">Інтеграції</span>
        <h2>Підключається до того, що вже є</h2>
        <p>30+ інтеграцій з SCM, чатами, CI/CD та observability. REST API і webhooks — для всього іншого.</p>
      </div>
      <div className="int-grid">
        {items.map(i => (
          <div className="int-tile" key={i.name}>
            <div className="int-mark" style={{background: i.color}}>{i.mark}</div>
            <span>{i.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricsSection() {
  return (
    <section className="section-wrap" style={{paddingTop: 32, paddingBottom: 32}}>
      <div className="metrics-big">
        <div className="metric-big"><div className="num">3.2×</div><div className="lbl">швидше створення багу</div></div>
        <div className="metric-big"><div className="num">−38%</div><div className="lbl">MTTR за 90 днів</div></div>
        <div className="metric-big"><div className="num">12k+</div><div className="lbl">тест-кейсів у середньому</div></div>
        <div className="metric-big"><div className="num">99.98%</div><div className="lbl">SLA uptime у 2025</div></div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="section-wrap" style={{paddingTop: 32}}>
      <div className="section-head">
        <span className="kicker">Відгуки</span>
        <h2>Що кажуть QA-команди</h2>
      </div>
      <div className="test-grid">
        <div className="test-card">
          <div className="quote">«Ми викинули таблицю в Confluence та три плагіни до Jira. BugForge просто роботу робить — і не плутається під ногами.»</div>
          <div className="who">
            <div className="av" style={{background: '#5E6AD2'}}>МК</div>
            <div><b>Марія Коваленко</b><span>Head of QA, Voltway</span></div>
          </div>
        </div>
        <div className="test-card featured">
          <div className="quote" style={{fontSize: 18}}>«AI-резюме економить нам кожному QA по 30+ хв на день. За квартал ми закрили на 41% більше тікетів — без додаткових людей.»</div>
          <div className="who">
            <div className="av" style={{background: 'rgba(255,255,255,0.25)'}}>ОП</div>
            <div><b>Олексій Перчик</b><span>QA Lead, Northwind</span></div>
          </div>
        </div>
        <div className="test-card">
          <div className="quote">«Гарячі клавіші — справжні. Cmd+K, C, Shift+C, /. Команда перестала шукати, де &quot;Створити&quot; і просто пише.»</div>
          <div className="who">
            <div className="av" style={{background: '#9665C9'}}>АС</div>
            <div><b>Анастасія Світла</b><span>Senior QA, Plinth</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = React.useState(0);
  const items = [
    { q: 'Скільки коштує?', a: 'Free для команд до 5 людей з лімітом 100 активних багів. Pro — $12 / місяць за користувача, без лімітів. Enterprise — кастомний SSO/SLA. 14 днів безкоштовного Pro без картки.' },
    { q: 'Чи можна імпортувати з Jira / TestRail?', a: 'Так. Імпорт-майстер підтримує Jira (через REST), TestRail (CSV/XML), Linear, GitHub Issues. Зв\'язки, коментарі, attachments — переносяться.' },
    { q: 'Чи є on-prem версія?', a: 'У нас є Self-Hosted на Enterprise-плані: Docker + Postgres, оновлення раз на 2 тижні. Звертайтесь sales@bugforge.io.' },
    { q: 'Що з безпекою?', a: 'SOC 2 Type II, GDPR, дані в EU/US-регіонах на ваш вибір. SAML SSO, SCIM-провіжен, audit log — на Enterprise.' },
    { q: 'Чи є API?', a: 'REST + GraphQL. Webhooks для event-driven flow. SDK для JS і Python. Документація: docs.bugforge.io/api.' },
    { q: 'Як AI обробляє наші дані?', a: 'AI-фічі вимикаються одним перемикачем. Дані не використовуються для тренування моделей. На Enterprise-плані — own-key режим (BYOK для OpenAI / Anthropic).' },
  ];
  return (
    <section id="faq" className="section-wrap" style={{paddingTop: 32}}>
      <div className="section-head">
        <span className="kicker">FAQ</span>
        <h2>Часті питання</h2>
      </div>
      <div className="faq-wrap">
        {items.map((it, i) => (
          <div key={i} className={open === i ? 'faq-item open' : 'faq-item'}>
            <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              {it.q}
              <Ic.ChevDown sz={16} className="chev"/>
            </button>
            <div className="faq-a">{it.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaStrip({ goto }) {
  return (
    <section className="cta-strip">
      <h2>Спробуйте BugForge сьогодні</h2>
      <p>14 днів Pro безкоштовно. Без картки. 5 хвилин на онбординг команди.</p>
      <div className="btns">
        <button className="btn-lg primary" onClick={() => goto('signup')}>Створити акаунт <Ic.Chev sz={14}/></button>
        <button className="btn-lg secondary" onClick={() => goto('signin')}>Увійти</button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <>
      <footer className="footer">
        <div className="col-brand">
          <div style={{display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15}}>
            <span style={{width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14}}>B</span>
            BugForge
          </div>
          <p>QA-платформа з фокусом на швидкість, ясність та інтеграції з тим, що ваша команда вже використовує.</p>
        </div>
        <div>
          <h6>Продукт</h6>
          <ul><li><a>Можливості</a></li><li><a>Інтеграції</a></li><li><a>Тарифи</a></li><li><a>Дорожня карта</a></li><li><a>Changelog</a></li></ul>
        </div>
        <div>
          <h6>Ресурси</h6>
          <ul><li><a>Документація</a></li><li><a>API</a></li><li><a>Гайди</a></li><li><a>Блог</a></li><li><a>Спільнота</a></li></ul>
        </div>
        <div>
          <h6>Компанія</h6>
          <ul><li><a>Про нас</a></li><li><a>Робота</a></li><li><a>Контакти</a></li><li><a>Преса</a></li></ul>
        </div>
        <div>
          <h6>Юридичне</h6>
          <ul><li><a>Конфіденційність</a></li><li><a>Умови</a></li><li><a>Безпека</a></li><li><a>DPA</a></li></ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <span>© 2026 BugForge Inc. Усі права застережено.</span>
        <span>Зроблено в Києві · Львові · Лісабоні</span>
      </div>
    </>
  );
}

Object.assign(window, { SaasNav, Hero, Features, UseCases, Integrations, MetricsSection, Testimonials, FAQ, CtaStrip, Footer });
