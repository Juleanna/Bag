// App shell + routing + tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "accent": "#5E6AD2",
  "density": "comfortable",
  "fontSize": 14,
  "sidebarWidth": 240,
  "showAiSummary": true,
  "borderRadius": 12
}/*EDITMODE-END*/;

function adjustAccent(hex, amt = -10) {
  // simple hex shift
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function withAlpha(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n>>16)&255}, ${(n>>8)&255}, ${n&255}, ${a})`;
}

const CRUMBS = {
  dashboard:    [{ icon: Ic.Layout, label: 'Огляд' }],
  bugs:         [{ icon: Ic.Bug, label: 'Баги' }],
  'bug-detail': [{ icon: Ic.Bug, label: 'Баги', go: 'bugs' }, { label: 'BUG-2041', mono: true }],
  tests:        [{ icon: Ic.Beaker, label: 'Тест-кейси' }],
  'test-detail':[{ icon: Ic.Beaker, label: 'Тест-кейси', go: 'tests' }, { label: 'TC-104', mono: true }],
  run:          [{ icon: Ic.Play, label: 'Test Runs', go: 'tests' }, { label: 'TR-58 · Smoke v4.18', mono: false }],
  reports:      [{ icon: Ic.Chart, label: 'Звіти' }],
  inbox:        [{ icon: Ic.Inbox, label: 'Інбокс' }],
  profile:      [{ icon: Ic.User, label: 'Особистий кабінет' }],
  'new-bug':    [{ icon: Ic.Bug, label: 'Баги', go: 'bugs' }, { label: 'Новий' }],
  'new-test':   [{ icon: Ic.Beaker, label: 'Тест-кейси', go: 'tests' }, { label: 'Новий' }],
  'new-project':[{ icon: Ic.Layout, label: 'Проєкти', go: 'dashboard' }, { label: 'Новий' }],
};

function Topbar({ route, goto, onOpenNotif, onOpenHelp }) {
  const cs = CRUMBS[route] || [];
  const [createOpen, setCreateOpen] = React.useState(false);
  const setNotifOpen = (v) => v && onOpenNotif();
  const setHelpOpen = (v) => v && onOpenHelp();
  return (
    <div className="topbar">
      <div className="tb-crumbs">
        <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5E6AD2' }}/> Web App
        </span>
        <span className="sep">/</span>
        {cs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">/</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: c.go ? 'pointer' : 'default', fontFamily: c.mono ? 'var(--font-mono)' : 'inherit', fontSize: c.mono ? 12.5 : 13 }}
                  onClick={() => c.go && goto(c.go)}>
              {c.icon && <c.icon sz={13}/>}
              {i === cs.length - 1 ? <b>{c.label}</b> : <span>{c.label}</span>}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="tb-actions">
        <button className="btn ghost icon" title="Сповіщення" onClick={() => setNotifOpen(true)}>
          <Ic.Bell sz={14}/>
          <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: 'var(--st-open-dot)', border: '1.5px solid var(--surface)' }}/>
        </button>
        <button className="btn ghost icon" title="Допомога (?)" onClick={() => setHelpOpen(true)}><Ic.Help sz={14}/></button>
        <button className="btn"><Ic.Refresh sz={12}/> Sync</button>
        <div style={{ position: 'relative' }}>
          <button className="btn primary" onClick={() => setCreateOpen(o => !o)}>
            <Ic.Plus sz={13}/> Створити
            <span className="kbd" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', color: 'rgba(255,255,255,0.85)' }}>C</span>
          </button>
          {createOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setCreateOpen(false)}/>
              <div className="create-menu">
                <button onClick={() => { setCreateOpen(false); goto('new-bug'); }}>
                  <span className="cm-ico" style={{ background: 'var(--st-open-bg)', color: 'var(--st-open-fg)' }}><Ic.Bug sz={13}/></span>
                  <div><b>Новий баг</b><span>Зафіксувати дефект з кроками</span></div>
                  <span className="kbd">C</span>
                </button>
                <button onClick={() => { setCreateOpen(false); goto('new-test'); }}>
                  <span className="cm-ico" style={{ background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)' }}><Ic.Beaker sz={13}/></span>
                  <div><b>Новий тест-кейс</b><span>Сценарій для manual / auto</span></div>
                  <span className="kbd">⇧ C</span>
                </button>
                <button onClick={() => { setCreateOpen(false); goto('run'); }}>
                  <span className="cm-ico" style={{ background: 'var(--st-progress-bg)', color: 'var(--st-progress-fg)' }}><Ic.Play sz={13}/></span>
                  <div><b>Test Run</b><span>Запустити вибірку кейсів</span></div>
                  <span className="kbd">R</span>
                </button>
                <div className="cm-sep"/>
                <button onClick={() => { setCreateOpen(false); goto('new-project'); }}>
                  <span className="cm-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' }}><Ic.Layout sz={13}/></span>
                  <div><b>Проєкт</b><span>Новий QA-простір</span></div>
                </button>
                <button>
                  <span className="cm-ico" style={{ background: 'var(--bg-2)', color: 'var(--fg-2)' }}><Ic.Users sz={13}/></span>
                  <div><b>Запросити людей</b><span>Email / Slack-handle</span></div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState('dashboard');
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);

  // apply theme & density to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', t.theme);
    document.documentElement.setAttribute('data-density', t.density);
  }, [t.theme, t.density]);

  // apply accent + radius + font
  const styleVars = {
    '--accent': t.accent,
    '--accent-soft': withAlpha(t.accent, 0.13),
    '--accent-soft-fg': adjustAccent(t.accent, -30),
    '--base-fz': `${t.fontSize}px`,
    '--radius-lg': `${t.borderRadius}px`,
    '--sidebar-w': `${t.sidebarWidth}px`,
  };

  // Cmd-K shortcut
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); setPaletteOpen(true);
      }
      else if ((e.metaKey || e.ctrlKey) && /^[1-4]$/.test(e.key)) {
        e.preventDefault();
        const map = { '1': 'dashboard', '2': 'bugs', '3': 'tests', '4': 'run' };
        setRoute(map[e.key]);
      }
      else if (e.key === '?' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); setHelpOpen(o => !o);
      }
      else if (e.key.toLowerCase() === 'c' && !e.metaKey && !e.ctrlKey && !e.shiftKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); setRoute('new-bug');
      }
      else if (e.key === 'C' && e.shiftKey && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); setRoute('new-test');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const goto = (r) => setRoute(r);

  return (
    <div className="app" style={styleVars} data-screen-label={`BugForge / ${route}`}>
      <Sidebar route={route} setRoute={setRoute} onOpenPalette={() => setPaletteOpen(true)}/>
      <main className="main">
        <Topbar route={route} goto={goto} onOpenNotif={() => setNotifOpen(true)} onOpenHelp={() => setHelpOpen(true)}/>
        <div className="scroll" style={{ display: 'flex', flexDirection: 'column' }}>
          {route === 'dashboard'    && <Dashboard goto={goto}/>}
          {route === 'bugs'         && <BugList goto={goto}/>}
          {route === 'bug-detail'   && <BugDetail goto={goto}/>}
          {route === 'tests'        && <TestCasesList goto={goto}/>}
          {route === 'test-detail'  && <TestCaseDetail goto={goto}/>}
          {route === 'run'          && <TestRunScreen goto={goto}/>}
          {route === 'reports'      && <Reports goto={goto}/>}
          {route === 'inbox'        && <Inbox goto={goto}/>}
          {route === 'profile'      && <Profile goto={goto}/>}
          {route === 'new-bug'      && <NewBug goto={goto}/>}
          {route === 'new-test'     && <NewTestCase goto={goto}/>}
          {route === 'new-project'  && <NewProject goto={goto}/>}
        </div>
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} goto={goto}/>
      <NotificationsPopover open={notifOpen} onClose={() => setNotifOpen(false)} onOpenInbox={() => goto('inbox')}/>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} goto={goto}/>

      <TweaksPanel title="BugForge · Tweaks">
        <TweakSection label="Тема">
          <TweakRadio label="Режим" value={t.theme}
            options={[{ value: 'light', label: '☀ Light' }, { value: 'dark', label: '☾ Dark' }]}
            onChange={(v) => setTweak('theme', v)}/>
          <TweakColor label="Акцент" value={t.accent} onChange={(v) => setTweak('accent', v)}/>
          <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
            {['#5E6AD2','#0EA5E9','#10B981','#D97757','#9665C9','#1F1E1A'].map(c => (
              <button key={c} onClick={() => setTweak('accent', c)}
                      style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid rgba(0,0,0,0.1)', cursor: 'pointer', boxShadow: t.accent === c ? '0 0 0 2px white, 0 0 0 4px ' + c : 'none' }}/>
            ))}
          </div>
        </TweakSection>
        <TweakSection label="Layout">
          <TweakRadio label="Щільність" value={t.density}
            options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfy' }]}
            onChange={(v) => setTweak('density', v)}/>
          <TweakSlider label="Базовий шрифт" value={t.fontSize} min={12} max={16} unit="px" onChange={(v) => setTweak('fontSize', v)}/>
          <TweakSlider label="Сайдбар" value={t.sidebarWidth} min={200} max={300} unit="px" onChange={(v) => setTweak('sidebarWidth', v)}/>
          <TweakSlider label="Заокруглення" value={t.borderRadius} min={4} max={20} unit="px" onChange={(v) => setTweak('borderRadius', v)}/>
        </TweakSection>
        <TweakSection label="Швидка навігація">
          <TweakButton label="Огляд" onClick={() => setRoute('dashboard')} secondary/>
          <TweakButton label="Список багів" onClick={() => setRoute('bugs')} secondary/>
          <TweakButton label="Картка бага" onClick={() => setRoute('bug-detail')} secondary/>
          <TweakButton label="Тест-кейси" onClick={() => setRoute('tests')} secondary/>
          <TweakButton label="Картка кейса" onClick={() => setRoute('test-detail')} secondary/>
          <TweakButton label="Test Run" onClick={() => setRoute('run')} secondary/>
          <TweakButton label="Звіти" onClick={() => setRoute('reports')} secondary/>
          <TweakButton label="Інбокс" onClick={() => setRoute('inbox')} secondary/>
          <TweakButton label="Особистий кабінет" onClick={() => setRoute('profile')} secondary/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
