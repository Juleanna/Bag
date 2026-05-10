// Invite people screen — invite teammates to the workspace
function InvitePeople({ goto }) {
  const ROLES = [
    { id: 'admin',  label: 'Адмін',     desc: 'Повний доступ + білінг і налаштування' },
    { id: 'member', label: 'Учасник',   desc: 'Створює баги, кейси, runs' },
    { id: 'qa',     label: 'QA',        desc: 'Як учасник + керує тест-планами' },
    { id: 'viewer', label: 'Гість',     desc: 'Тільки перегляд і коментарі' },
  ];

  const [rows, setRows] = React.useState([
    { email: '', role: 'member' },
    { email: '', role: 'member' },
    { email: '', role: 'member' },
  ]);
  const [project, setProject] = React.useState('all');
  const [bulk, setBulk] = React.useState('');
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [link, setLink] = React.useState('https://app.bugforge.io/invite/wb-7xQk2A8r');
  const [copied, setCopied] = React.useState(false);
  const [linkRole, setLinkRole] = React.useState('member');
  const [domainAuto, setDomainAuto] = React.useState(true);
  const [sent, setSent] = React.useState(false);

  const setRow = (i, k, v) => setRows(rs => rs.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const addRow = () => setRows(rs => [...rs, { email: '', role: 'member' }]);
  const rmRow = (i) => setRows(rs => rs.filter((_, j) => j !== i));
  const applyBulk = () => {
    const list = bulk.split(/[\s,;\n]+/).map(s => s.trim()).filter(s => s.includes('@'));
    if (!list.length) return;
    setRows(list.map(e => ({ email: e, role: 'member' })));
    setBulk(''); setBulkOpen(false);
  };
  const copyLink = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  const validRows = rows.filter(r => r.email.includes('@'));
  const sendAll = () => {
    if (!validRows.length) return;
    setSent(true);
    setTimeout(() => setSent(false), 2400);
  };

  // pending — mock list
  const PENDING = [
    { email: 'tetiana.k@acme.com',     role: 'member', sent: '2 год тому',   color: '#5E6AD2' },
    { email: 'roman.shevchuk@acme.com',role: 'qa',     sent: 'вчора',        color: '#9665C9' },
    { email: 'designer@figma-team.io', role: 'viewer', sent: '3 дні тому',   color: '#D97757' },
  ];

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>
          Запросити людей
        </h1>
        <p style={{ margin: '6px 0 0', color: 'var(--fg-3)', fontSize: 14 }}>
          Додайте колег до простору <b style={{ color: 'var(--fg-2)' }}>Acme · Web team</b>. Запрошення дійсне 7 днів.
        </p>
      </div>

      {/* Sent toast */}
      {sent && (
        <div style={{
          background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)',
          padding: '10px 14px', borderRadius: 10, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 500,
        }}>
          <Ic.Check sz={16}/>
          Надіслано {validRows.length} {validRows.length === 1 ? 'запрошення' : 'запрошень'}.
        </div>
      )}

      {/* Email rows */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Запросити по email</h3>
          <div className="right">
            <button className="btn sm ghost" onClick={() => setBulkOpen(o => !o)}>
              <Ic.Upload sz={12}/> Вставити список
            </button>
          </div>
        </div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bulkOpen && (
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 12, marginBottom: 4 }}>
              <textarea className="inp" value={bulk} onChange={e => setBulk(e.target.value)}
                placeholder="Вставте email-и через кому, пробіл чи з нового рядка…"
                style={{ width: '100%', minHeight: 80, fontFamily: 'var(--font-mono)', fontSize: 12.5 }}/>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                <button className="btn sm" onClick={() => { setBulk(''); setBulkOpen(false); }}>Скасувати</button>
                <button className="btn sm primary" onClick={applyBulk}>Розпарсити</button>
              </div>
            </div>
          )}

          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 28px', gap: 8, alignItems: 'center' }}>
              <input className="inp" type="email" placeholder="email@company.com"
                     value={r.email} onChange={e => setRow(i, 'email', e.target.value)}/>
              <select className="inp" value={r.role} onChange={e => setRow(i, 'role', e.target.value)} style={{ cursor: 'pointer' }}>
                {ROLES.map(R => <option key={R.id} value={R.id}>{R.label}</option>)}
              </select>
              <button className="btn ghost icon" onClick={() => rmRow(i)} title="Видалити" disabled={rows.length === 1}
                      style={{ opacity: rows.length === 1 ? 0.4 : 1 }}>
                <Ic.X sz={12}/>
              </button>
            </div>
          ))}

          <button className="btn sm ghost" onClick={addRow} style={{ alignSelf: 'flex-start', marginTop: 4 }}>
            <Ic.Plus sz={12}/> Додати ще
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, marginTop: 4, borderTop: '1px solid var(--divider)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--fg-3)' }}>Доступ до проєктів:</span>
            <select className="inp small" value={project} onChange={e => setProject(e.target.value)}
                    style={{ width: 'auto', minWidth: 160, height: 28, cursor: 'pointer' }}>
              <option value="all">Усі проєкти</option>
              <option value="web">Web App</option>
              <option value="ios">iOS App</option>
              <option value="api">Public API</option>
              <option value="admin">Admin Panel</option>
            </select>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button className="btn" onClick={() => goto('dashboard')}>Скасувати</button>
              <button className="btn primary" onClick={sendAll} disabled={!validRows.length}
                      style={{ opacity: validRows.length ? 1 : 0.5 }}>
                <Ic.Spark sz={12}/> Надіслати {validRows.length > 0 && `(${validRows.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite link */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <h3>Посилання-запрошення</h3>
          <span className="tag" style={{ marginLeft: 8 }}>Дійсне 7 днів</span>
        </div>
        <div className="card-body bordered" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.55 }}>
            Будь-хто з посиланням може приєднатися до простору. Доступ — як у обраній ролі.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 8 }}>
            <input className="inp" readOnly value={link} style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5 }}/>
            <select className="inp" value={linkRole} onChange={e => setLinkRole(e.target.value)} style={{ cursor: 'pointer' }}>
              {ROLES.map(R => <option key={R.id} value={R.id}>{R.label}</option>)}
            </select>
            <button className={copied ? 'btn primary' : 'btn'} onClick={copyLink} style={{ minWidth: 110, justifyContent: 'center' }}>
              {copied ? <><Ic.Check sz={12}/> Скопійовано</> : <><Ic.Link sz={12}/> Копіювати</>}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn sm ghost" onClick={() => setLink('https://app.bugforge.io/invite/' + Math.random().toString(36).slice(2, 12))}>
              <Ic.Refresh sz={11}/> Згенерувати нове
            </button>
            <button className="btn sm ghost"><Ic.X sz={11}/> Відкликати</button>
          </div>
        </div>
      </div>

      {/* Domain auto-join */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ paddingTop: 16, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Ic.Globe sz={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <b style={{ fontSize: 14 }}>Авто-приєднання за доменом</b>
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                  Будь-хто з email на <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'var(--bg-2)', padding: '1px 6px', borderRadius: 4 }}>@acme.com</code> приєднається автоматично як <b>Учасник</b>.
                </p>
              </div>
              <span className={domainAuto ? 'toggle on' : 'toggle'} onClick={() => setDomainAuto(d => !d)}>
                <span/>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending invites */}
      <div className="card">
        <div className="card-head">
          <h3>Очікують підтвердження</h3>
          <span className="tag" style={{ marginLeft: 6 }}>{PENDING.length}</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {PENDING.map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr auto auto auto', gap: 12, alignItems: 'center',
              padding: '12px 18px', borderTop: '1px solid var(--divider)',
            }}>
              <div className="avatar lg" style={{ background: p.color, width: 32, height: 32 }}>
                {p.email[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email}</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>надіслано {p.sent}</div>
              </div>
              <span className="tag">{ROLES.find(R => R.id === p.role)?.label || p.role}</span>
              <button className="btn sm ghost"><Ic.Refresh sz={11}/> Повторити</button>
              <button className="btn sm ghost" title="Відкликати"><Ic.X sz={12}/></button>
            </div>
          ))}
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--fg-3)', textAlign: 'center' }}>
        Користувачі вашої поточної ролі:&nbsp;
        {ROLES.map((R, i) => (
          <React.Fragment key={R.id}>
            {i > 0 && ' · '}
            <b style={{ color: 'var(--fg-2)' }}>{R.label}</b> — {R.desc.toLowerCase()}
          </React.Fragment>
        ))}
      </p>
    </div>
  );
}

window.InvitePeople = InvitePeople;
