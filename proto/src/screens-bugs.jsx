// Bug list + bug detail screens
function FilterChip({ label, value, onRemove }) {
  return (
    <button className={`chip applied`}>
      <span style={{ color: 'var(--fg-3)' }}>{label}:</span>
      <span className="v">{value}</span>
      {onRemove && <Ic.X sz={11} onClick={(e) => { e.stopPropagation(); onRemove(); }}/>}
    </button>
  );
}

function BugListFilters({ view, setView, q, setQ, filters, removeFilter }) {
  return (
    <div className="filters">
      <input className="search-input" placeholder="Пошук за ID, тайтлом, тегами…" value={q} onChange={e => setQ(e.target.value)}/>
      {filters.map((f, i) => <FilterChip key={i} label={f.label} value={f.value} onRemove={() => removeFilter(i)}/>)}
      <button className="chip"><Ic.Plus sz={11}/> Фільтр</button>
      <span className="spacer"/>
      <div className="seg">
        <button className={view === 'table' ? 'active' : ''} onClick={() => setView('table')}><Ic.Sort sz={12}/> Таблиця</button>
        <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}><Ic.Layout sz={12}/> Канбан</button>
      </div>
      <button className="btn sm"><Ic.Sort sz={12}/> Сорт <Ic.ChevDown sz={11}/></button>
      <button className="btn sm"><Ic.Eye sz={12}/> Колонки</button>
    </div>
  );
}

function BugTable({ bugs, goto }) {
  const [sort, setSort] = React.useState({ key: 'updated', dir: 'desc' });
  const [selected, setSelected] = React.useState(new Set());
  const toggle = (id) => {
    const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n);
  };
  const Sortable = ({ k, children }) => (
    <th className="sortable" onClick={() => setSort(s => ({ key: k, dir: s.key === k && s.dir === 'desc' ? 'asc' : 'desc' }))}>
      <span className="th-inner">{children}{sort.key === k && (sort.dir === 'desc' ? <Ic.ChevDown sz={11}/> : <Ic.ChevUp sz={11}/>)}</span>
    </th>
  );
  return (
    <div className="tbl-wrap">
      <table className="table">
        <thead>
          <tr>
            <th className="checkbox-col"><input type="checkbox" className="cb"/></th>
            <Sortable k="id">ID</Sortable>
            <Sortable k="title">Тайтл</Sortable>
            <Sortable k="status">Статус</Sortable>
            <Sortable k="priority">Пріоритет</Sortable>
            <th>Власник</th>
            <th>Проєкт</th>
            <th>Теги</th>
            <th><Ic.Comment sz={12}/></th>
            <th><Ic.Paperclip sz={12}/></th>
            <Sortable k="updated">Оновлено</Sortable>
          </tr>
        </thead>
        <tbody>
          {bugs.map(b => (
            <tr key={b.id} className={selected.has(b.id) ? 'selected' : ''} onClick={() => goto('bug-detail')}>
              <td className="checkbox-col" onClick={(e) => { e.stopPropagation(); toggle(b.id); }}>
                <input type="checkbox" className="cb" checked={selected.has(b.id)} readOnly/>
              </td>
              <td className="id-cell">{b.id}</td>
              <td className="title-cell">{b.title}</td>
              <td><StatusPill value={b.status}/></td>
              <td><PriorityBadge value={b.priority}/></td>
              <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar user={b.assignee}/><span style={{ fontSize: 12.5 }}>{userById(b.assignee).name.split(' ')[0]}</span></div></td>
              <td><span className="tag" style={{ background: 'transparent' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: PROJECTS.find(p => p.id === b.project)?.color, display: 'inline-block', marginRight: 5 }}/>
                {PROJECTS.find(p => p.id === b.project)?.name}
              </span></td>
              <td><div style={{ display: 'flex', gap: 4 }}>{b.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}</div></td>
              <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.comments}</td>
              <td className="muted" style={{ fontVariantNumeric: 'tabular-nums' }}>{b.attachments || ''}</td>
              <td className="muted">{b.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kanban({ bugs, goto }) {
  const cols = [
    { key: 'open', label: 'Open' },
    { key: 'progress', label: 'In Progress' },
    { key: 'blocked', label: 'Blocked' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
  ];
  return (
    <div className="kanban">
      {cols.map(c => {
        const items = bugs.filter(b => b.status === c.key);
        return (
          <div key={c.key} className="kcol">
            <div className="kcol-head">
              <span className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--st-${c.key}-dot)` }}/>
              <b style={{ fontSize: 12.5, fontWeight: 600 }}>{c.label}</b>
              <span className="count">{items.length}</span>
              <div className="right">
                <button className="btn icon ghost sm"><Ic.Plus sz={12}/></button>
                <button className="btn icon ghost sm"><Ic.More sz={12}/></button>
              </div>
            </div>
            <div className="kcol-list">
              {items.map(b => (
                <div key={b.id} className="kcard" onClick={() => goto('bug-detail')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="id">{b.id}</span>
                    <PriorityBadge value={b.priority}/>
                  </div>
                  <div className="title">{b.title}</div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {b.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                  <div className="meta">
                    <Avatar user={b.assignee}/>
                    <span>{b.updated}</span>
                    <span className="right">
                      {b.comments > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic.Comment sz={11}/>{b.comments}</span>}
                      {b.attachments > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}><Ic.Paperclip sz={11}/>{b.attachments}</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BugList({ goto }) {
  const [view, setView] = React.useState('table');
  const [q, setQ] = React.useState('');
  const [filters, setFilters] = React.useState([
    { key: 'status', label: 'Статус', value: 'Open, In Progress' },
    { key: 'project', label: 'Проєкт', value: 'Web App' },
  ]);
  const removeFilter = (i) => setFilters(f => f.filter((_, j) => j !== i));
  const filtered = BUGS.filter(b => !q || (b.title + b.id).toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="page-head" style={{ padding: '20px 24px 0', maxWidth: 'unset' }}>
        <div>
          <h1>Баги</h1>
          <div className="sub">{filtered.length} відкритих · сортовано за оновленням</div>
        </div>
        <div className="right">
          <button className="btn"><Ic.Download sz={13}/> Експорт CSV</button>
          <button className="btn primary"><Ic.Plus sz={13}/> Новий баг <span className="kbd" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', color: 'rgba(255,255,255,0.85)' }}>C</span></button>
        </div>
      </div>
      <BugListFilters view={view} setView={setView} q={q} setQ={setQ} filters={filters} removeFilter={removeFilter}/>
      <div className="scroll">
        {view === 'table' ? <BugTable bugs={filtered} goto={goto}/> : <Kanban bugs={filtered} goto={goto}/>}
      </div>
    </>
  );
}

// Bug detail
function BugDetail({ goto }) {
  const b = BUGS[0];
  const reporter = userById(b.reporter);
  const assignee = userById(b.assignee);

  return (
    <div className="scroll">
      <div className="detail">
        <div className="detail-main">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <button className="btn ghost sm" onClick={() => goto('bugs')}><Ic.Chev sz={12} style={{ transform: 'rotate(180deg)' }}/> Усі баги</button>
            <span style={{ color: 'var(--fg-4)' }}>/</span>
            <span className="id-cell" style={{ fontSize: 13 }}>{b.id}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="btn sm"><Ic.Star sz={12}/></button>
              <button className="btn sm"><Ic.Link sz={12}/> Поділитись</button>
              <button className="btn sm"><Ic.More sz={13}/></button>
            </div>
          </div>
          <h1 className="detail-title">{b.title}</h1>
          <div className="detail-meta">
            <span className="id">{b.id}</span>
            <span>·</span>
            <span>відкрито <b style={{ color: 'var(--fg-2)', fontWeight: 500 }}>{reporter.name}</b> {b.created}</span>
            <span>·</span>
            <StatusPill value={b.status}/>
            <PriorityBadge value={b.priority}/>
          </div>

          <div className="ai-card" style={{ marginTop: 18 }}>
            <div className="head"><Ic.AI sz={14} style={{ color: 'var(--accent)' }}/><b>AI підсумок</b></div>
            <p>Користувачі повідомляють, що після виходу з акаунта (через UI або інактивність) налаштування 2FA скидаються на дефолтні. Затронуто authentication-flow на web — на iOS не відтворюється. Найімовірніша причина — secure-cookie не зберігає 2FA-claim під час soft-logout.</p>
            <ul>
              <li>Схожі баги: <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>BUG-1987</span>, <span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>BUG-1654</span></li>
              <li>Запропонований власник: <b>Олена Мельник</b> (auth-team, 12 закритих суміжних)</li>
            </ul>
          </div>

          <div className="section">
            <h3>Опис</h3>
            <div className="prose">
              <p>Після виходу з акаунту через кнопку <code>Logout</code> або по таймауту (15 хв) налаштування 2FA, які користувач увімкнув на сторінці <code>/settings/security</code>, скидаються на значення за замовчуванням (вимкнено). Проблема відтворюється стабільно у production-середовищі.</p>
              <p>Затронутий тільки web-клієнт. На iOS-застосунку поведінка коректна — стан 2FA зберігається.</p>
            </div>
          </div>

          <div className="section">
            <h3>Кроки відтворення <span className="count">5 кроків</span></h3>
            <div className="steps">
              {[
                { txt: 'Залогуватись на acme.com з тестового акаунта (qa-2fa@acme.com).', exp: null },
                { txt: 'Перейти у Settings → Security і увімкнути 2FA через email-код.', exp: 'Очікується: тогл «2FA enabled» зелений, з\'являється QR-код.' },
                { txt: 'Натиснути Logout (правий верхній кут → Sign out).', exp: null },
                { txt: 'Залогуватись назад тим самим акаунтом.', exp: null },
                { txt: 'Перейти у Settings → Security.', exp: 'Очікується: 2FA увімкнено. Фактично: тогл вимкнений, налаштування скинуті.' },
              ].map((s, i) => (
                <div key={i} className="step">
                  <div className="num">{i + 1}</div>
                  <div className="body">
                    {s.txt}
                    {s.exp && <div className="expected">{s.exp}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h3>Вкладення <span className="count">{b.attachments} файли</span></h3>
            <div className="attach-grid">
              {[
                { bg: 'linear-gradient(135deg,#FCE8E4,#F4A261)', name: 'screenshot-2fa-modal.png', size: '482 KB' },
                { bg: 'linear-gradient(135deg,#DDEFDC,#4CA85C)', name: 'console-error.log', size: '14 KB' },
                { bg: 'linear-gradient(135deg,#ECEDFB,#5E6AD2)', name: 'network-har.json', size: '2.1 MB' },
                { bg: 'linear-gradient(160deg,#1F1E1A,#3D3C38)', name: 'reproduction.mov', size: '8.7 MB' },
              ].map((a, i) => (
                <div key={i} className="attach" style={{ background: a.bg }}>
                  <span className="size">{a.size}</span>
                  <span className="label"><Ic.Image sz={11}/> {a.name}</span>
                </div>
              ))}
              <div className="attach" style={{ background: 'transparent', border: '1.5px dashed var(--border-strong)', display: 'grid', placeItems: 'center', color: 'var(--fg-3)' }}>
                <div style={{ textAlign: 'center', fontSize: 12 }}>
                  <Ic.Upload sz={18} style={{ marginBottom: 6 }}/>
                  <div>Перетягніть файли</div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Коментарі <span className="count">{COMMENTS_2041.length}</span></h3>
            <div>
              {COMMENTS_2041.map((c, i) => {
                const u = userById(c.who);
                return (
                  <div key={i} className="comment">
                    <Avatar user={u} size="lg"/>
                    <div>
                      <div className="head"><b>{u.name}</b><span className="when">{c.when}</span></div>
                      <div className="body"><p>{c.body}</p></div>
                    </div>
                  </div>
                );
              })}
              <div className="comment-input" style={{ marginTop: 14 }}>
                <Avatar user={USERS[0]} size="lg"/>
                <div className="box">
                  <textarea placeholder="Напишіть коментар або /команду…" defaultValue=""/>
                  <div className="actions">
                    <button className="btn ghost sm"><Ic.Paperclip sz={13}/></button>
                    <button className="btn ghost sm"><Ic.Image sz={13}/></button>
                    <button className="btn ghost sm">@</button>
                    <span className="right">
                      <button className="btn sm">Скасувати</button>
                      <button className="btn primary sm">Надіслати <span className="kbd" style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'transparent', color: 'rgba(255,255,255,0.85)' }}>⌘↵</span></button>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section">
            <h3>Історія змін</h3>
            <div className="history">
              {HISTORY_2041.map((h, i) => (
                <div key={i} className="h-row">
                  <div className="ico">
                    {{ created: <Ic.Plus sz={11}/>, attach: <Ic.Paperclip sz={11}/>, assign: <Ic.User sz={11}/>,
                       priority: <Ic.Flag sz={11}/>, link: <Ic.Link sz={11}/>, tag: <Ic.Tag sz={11}/>,
                       comment: <Ic.Comment sz={11}/>, status: <Ic.Refresh sz={11}/> }[h.kind] || <Ic.Activity sz={11}/>}
                  </div>
                  <div><b>{userById(h.who).name}</b> {h.verb}</div>
                  <span className="when">{h.when}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <aside className="detail-side">
          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Властивості</h4>
              <div className="side-row"><span className="lbl">Статус</span><span className="val"><StatusPill value={b.status}/></span></div>
              <div className="side-row"><span className="lbl">Пріоритет</span><span className="val"><PriorityBadge value={b.priority}/></span></div>
              <div className="side-row"><span className="lbl">Власник</span><span className="val"><Avatar user={assignee}/><span>{assignee.name}</span></span></div>
              <div className="side-row"><span className="lbl">Репортер</span><span className="val"><Avatar user={reporter}/><span>{reporter.name}</span></span></div>
              <div className="side-row"><span className="lbl">Watchers</span><span className="val"><AvatarStack ids={['ds','np','ak','mt','iv']}/></span></div>
              <div className="side-row"><span className="lbl">Проєкт</span><span className="val"><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#5E6AD2' }}/><span>Web App</span></span></div>
              <div className="side-row"><span className="lbl">Реліз</span><span className="val"><span className="tag">v4.18 «Trillium»</span></span></div>
              <div className="side-row"><span className="lbl">Середовище</span><span className="val"><span className="tag">{b.env}</span></span></div>
              <div className="side-row"><span className="lbl">Браузер</span><span className="val"><span className="tag">Chrome 124</span></span></div>
              <div className="side-row" style={{ alignItems: 'flex-start' }}>
                <span className="lbl">Теги</span>
                <span className="val" style={{ flexWrap: 'wrap' }}>
                  {b.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  <button className="chip" style={{ height: 20, padding: '0 6px', fontSize: 11 }}><Ic.Plus sz={10}/></button>
                </span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Звʼязки</h4>
              <div className="side-row"><span className="lbl">Pull request</span><span className="val"><Ic.Github sz={13}/><span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>acme/web#4128</span></span></div>
              <div className="side-row"><span className="lbl">Тест-кейс</span><span className="val"><Ic.Beaker sz={13}/><span style={{ color: 'var(--accent-soft-fg)', fontWeight: 500 }}>TC-104</span></span></div>
              <div className="side-row"><span className="lbl">Дублікат до</span><span className="val muted">—</span></div>
              <div className="side-row"><span className="lbl">Блокує</span><span className="val"><span className="id-cell">BUG-2040</span></span></div>
            </div>
          </div>

          <div className="card" style={{ padding: 14 }}>
            <div className="side-section">
              <h4>Активність</h4>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--fg-3)' }}>
                <div><div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{b.comments}</div>коментарів</div>
                <div><div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>{b.attachments}</div>файлів</div>
                <div><div style={{ fontSize: 18, fontWeight: 600, color: 'var(--fg)', fontVariantNumeric: 'tabular-nums' }}>5</div>watchers</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.BugList = BugList;
window.BugDetail = BugDetail;
