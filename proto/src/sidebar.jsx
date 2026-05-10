// Sidebar
function Sidebar({ route, setRoute, onOpenPalette }) {
  const Item = ({ id, icon: Icon, label, count, hot }) => (
    <button className={`sb-item ${route === id ? 'active' : ''}`} onClick={() => setRoute(id)}>
      <Icon sz={15}/>
      <span>{label}</span>
      {count != null && <span className="sb-count" style={hot ? { color: 'var(--st-open-fg)', fontWeight: 500 } : undefined}>{count}</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="sb-head">
        <button className="sb-logo" onClick={() => setRoute('new-workspace')} title="Новий простір" style={{ border: 'none', cursor: 'pointer' }}>B</button>
        <div className="sb-brand">
          <b>BugForge</b>
          <span>Acme · Web team</span>
        </div>
        <button onClick={() => setRoute('new-workspace')} title="Створити простір" style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 4, color: 'var(--fg-3)', display: 'grid', placeItems: 'center', borderRadius: 6 }}>
          <Ic.Plus sz={14}/>
        </button>
      </div>

      <button className="sb-search" onClick={onOpenPalette}>
        <Ic.Search sz={13}/>
        <span className="grow">Швидкий пошук…</span>
        <span className="kbd">⌘K</span>
      </button>

      <div className="sb-section">Робочий простір</div>
      <div className="sb-nav">
        <Item id="dashboard" icon={Ic.Layout} label="Огляд" />
        <Item id="bugs" icon={Ic.Bug} label="Баги" count={47} hot />
        <Item id="tests" icon={Ic.Beaker} label="Тест-кейси" count={142} />
        <Item id="run" icon={Ic.Play} label="Test Runs" count={3} />
        <Item id="sprints" icon={Ic.Lightning} label="Спринти" />
        <Item id="reports" icon={Ic.Chart} label="Звіти" />
        <Item id="templates" icon={Ic.Layout} label="Шаблони" />
        <Item id="inbox" icon={Ic.Inbox} label="Інбокс" count="12" hot />
        <Item id="profile" icon={Ic.User} label="Особистий кабінет" />
      </div>

      <div className="sb-section">Розробникам</div>
      <div className="sb-nav">
        <Item id="integrations" icon={Ic.Link} label="Інтеграції" />
        <Item id="webhooks" icon={Ic.Link} label="Webhooks" />
      </div>

      <div className="sb-section">
        Проєкти
        <button className="add"><Ic.Plus sz={12}/></button>
      </div>
      <div className="sb-nav">
        {PROJECTS.map(p => (
          <button key={p.id} className="sb-project">
            <span className="pdot" style={{ background: p.color }}/>
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      <div className="sb-section">Інтеграції</div>
      <div className="sb-nav">
        <button className="sb-item"><Ic.Github sz={14}/><span>GitHub</span><span className="sb-count">acme/web</span></button>
        <button className="sb-item"><Ic.Slack sz={14}/><span>Slack</span><span className="sb-count">#qa</span></button>
      </div>

      <div className="sb-foot">
        <div className="sb-avatar" style={{ background: USERS[0].color }}>{USERS[0].initials}</div>
        <div className="sb-foot-meta">
          <b>{USERS[0].name}</b>
          <span>QA Lead</span>
        </div>
        <button className="btn icon ghost" title="Налаштування"><Ic.Settings sz={14}/></button>
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;
