// Dashboard / Overview screen
function MetricCard({ icon, label, value, unit, delta, deltaKind, since, sparkData, sparkColor }) {
  return (
    <div className="card metric">
      <div className="metric-lbl">{icon}<span>{label}</span></div>
      <div className="metric-val">{value}{unit && <span className="unit">{unit}</span>}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className={`metric-delta ${deltaKind}`}>
          {deltaKind === 'up' && <Ic.ChevUp sz={11}/>}
          {deltaKind === 'down' && <Ic.ChevDown sz={11}/>}
          {delta}
          <span className="since">{since}</span>
        </span>
        {sparkData && <Sparkline data={sparkData} color={sparkColor || 'var(--accent)'} w={88} h={26}/>}
      </div>
    </div>
  );
}

function BurndownChart() {
  const data = BURNDOWN;
  const W = 720, H = 200, P = { l: 36, r: 12, t: 12, b: 26 };
  const innerW = W - P.l - P.r, innerH = H - P.t - P.b;
  const max = Math.max(...data.map(d => d.open)) + 10;
  const min = Math.min(...data.map(d => d.open)) - 10;
  const x = (i) => P.l + (i / (data.length - 1)) * innerW;
  const y = (v) => P.t + innerH - ((v - min) / (max - min)) * innerH;
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.open)}`).join(' ');
  const fillPath = `${linePath} L${x(data.length-1)},${P.t+innerH} L${x(0)},${P.t+innerH} Z`;
  const barW = innerW / data.length * 0.34;

  // Y ticks
  const ticks = 4;
  const tickVals = Array.from({length: ticks+1}, (_, i) => Math.round(min + (max-min) * i / ticks));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="bd-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.16"/>
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {tickVals.map((v, i) => (
        <g key={i}>
          <line x1={P.l} x2={W-P.r} y1={y(v)} y2={y(v)} stroke="var(--divider)" strokeDasharray="2 3"/>
          <text x={P.l - 6} y={y(v) + 3} fontSize="10" fill="var(--fg-3)" textAnchor="end" fontFamily="var(--font-mono)">{v}</text>
        </g>
      ))}
      {data.map((d, i) => (
        <g key={i}>
          <rect x={x(i) - barW - 1} y={y(min) - (d.opened * (innerH / (max-min))) } width={barW} height={d.opened * (innerH / (max-min))} fill="var(--st-open-dot)" opacity="0.55" rx="1.5"/>
          <rect x={x(i) + 1} y={y(min) - (d.closed * (innerH / (max-min))) } width={barW} height={d.closed * (innerH / (max-min))} fill="var(--st-resolved-dot)" opacity="0.55" rx="1.5"/>
        </g>
      ))}
      <path d={fillPath} fill="url(#bd-grad)"/>
      <path d={linePath} stroke="var(--accent)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.open)} r={i === data.length - 1 ? 4 : 0} fill="var(--accent)" stroke="var(--surface)" strokeWidth="2"/>
      ))}
      {data.map((d, i) => (
        i % 2 === 0 ? <text key={i} x={x(i)} y={H - 8} fontSize="10" fill="var(--fg-3)" textAnchor="middle" fontFamily="var(--font-mono)">{d.d}</text> : null
      ))}
    </svg>
  );
}

function DonutChart({ size = 160, parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = size / 2 - 12, cx = size / 2, cy = size / 2;
  let angle = -90;
  const segs = parts.map(p => {
    const start = angle, span = (p.value / total) * 360;
    angle += span;
    const end = angle;
    const sa = (start * Math.PI) / 180, ea = (end * Math.PI) / 180;
    const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
    const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
    const large = span > 180 ? 1 : 0;
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`, color: p.color, value: p.value, label: p.label };
  });
  return (
    <svg width={size} height={size}>
      {segs.map((s, i) => <path key={i} d={s.d} fill={s.color}/>)}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--surface)"/>
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="600" fill="var(--fg)" fontFamily="var(--font-sans)" letterSpacing="-0.02em">{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--fg-3)" fontFamily="var(--font-sans)">всього</text>
    </svg>
  );
}

function ActivityRow({ a }) {
  const u = userById(a.who);
  const Icon = {
    closed: Ic.Check2, assign: Ic.User, comment: Ic.Comment, status: Ic.Refresh,
    created: Ic.Plus, run: Ic.Play, attach: Ic.Paperclip,
  }[a.kind] || Ic.Activity;
  return (
    <div className="act-row">
      <Avatar user={u}/>
      <div className="body">
        <b>{u.name}</b> {a.verb} <span className="lnk">{a.what}</span>
        <div style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 2 }}>{a.detail}</div>
      </div>
      <span className="when">{a.when}</span>
    </div>
  );
}

function Dashboard({ goto }) {
  const openByPriority = [
    { label: 'Critical', value: 6, color: 'var(--pri-critical)' },
    { label: 'High', value: 14, color: 'var(--pri-high)' },
    { label: 'Medium', value: 19, color: 'var(--pri-medium)' },
    { label: 'Low', value: 8, color: 'var(--pri-low)' },
  ];
  const passRate = [
    { label: 'Passed', value: 168, color: 'var(--st-resolved-dot)' },
    { label: 'Failed', value: 14, color: 'var(--st-open-dot)' },
    { label: 'Skipped', value: 8, color: 'var(--st-closed-dot)' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Доброго ранку, Олено 👋</h1>
          <div className="sub">Реліз <b style={{ color: 'var(--fg)' }}>v4.18 «Trillium»</b> · до релізу 6 днів · 47 відкритих багів</div>
        </div>
        <div className="right">
          <button className="btn"><Ic.Calendar sz={14}/> Останні 14 днів <Ic.ChevDown sz={12}/></button>
          <button className="btn"><Ic.Folder sz={14}/> Усі проєкти <Ic.ChevDown sz={12}/></button>
          <button className="btn primary"><Ic.Plus sz={14}/> Новий баг</button>
        </div>
      </div>

      <div className="metrics" style={{ marginBottom: 16 }}>
        <MetricCard icon={<Ic.Bug sz={13}/>} label="Відкриті баги" value="47" delta="+6 за тиждень" deltaKind="up" since=""
          sparkData={BURNDOWN.map(b => b.open)} sparkColor="var(--st-open-dot)"/>
        <MetricCard icon={<Ic.Check2 sz={13}/>} label="Закриті за тиждень" value="89" delta="+22%" deltaKind="down" since="vs минулий"
          sparkData={BURNDOWN.map(b => b.closed)} sparkColor="var(--st-resolved-dot)"/>
        <MetricCard icon={<Ic.Beaker sz={13}/>} label="Прогрес тестування" value="86" unit="%" delta="142 / 165 кейсів" deltaKind="flat" since=""
          sparkData={[78, 79, 81, 82, 83, 84, 85, 86]} sparkColor="var(--accent)"/>
        <MetricCard icon={<Ic.Clock sz={13}/>} label="Сер. час до резолва" value="2.4" unit="дн" delta="−0.8 дн" deltaKind="down" since="за місяць"
          sparkData={[3.4, 3.2, 3.0, 2.9, 2.7, 2.5, 2.4]} sparkColor="var(--accent)"/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Burndown · відкриті баги</h3>
            <span className="sub">останні 14 днів</span>
            <div className="right">
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--st-open-dot)', borderRadius: 2, opacity: 0.7 }}/> Відкрито
              </span>
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 8, height: 8, background: 'var(--st-resolved-dot)', borderRadius: 2, opacity: 0.7 }}/> Закрито
              </span>
              <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 16, height: 2, background: 'var(--accent)', borderRadius: 2 }}/> Залишок
              </span>
            </div>
          </div>
          <div className="card-body"><BurndownChart/></div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Розподіл за пріоритетом</h3>
            <div className="right"><button className="btn ghost sm">Деталі <Ic.Chev sz={11}/></button></div>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <DonutChart parts={openByPriority}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {openByPriority.map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }}/>
                  <span style={{ color: 'var(--fg-2)' }}>{p.label}</span>
                  <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: 'var(--fg-3)' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-head">
            <h3>Найгарячіші баги</h3>
            <span className="sub">потребують уваги</span>
            <div className="right"><button className="btn sm" onClick={() => goto('bugs')}>Усі баги <Ic.Chev sz={11}/></button></div>
          </div>
          <table className="table">
            <thead><tr>
              <th style={{ paddingLeft: 18 }}>Баг</th>
              <th>Пріоритет</th>
              <th>Статус</th>
              <th>Власник</th>
              <th className="right" style={{ paddingRight: 18 }}>Оновлено</th>
            </tr></thead>
            <tbody>
              {BUGS.slice(0, 5).map(b => (
                <tr key={b.id} onClick={() => goto('bug-detail')}>
                  <td style={{ paddingLeft: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="id-cell">{b.id}</span>
                      <span className="title-cell" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.title}</span>
                    </div>
                  </td>
                  <td><PriorityBadge value={b.priority}/></td>
                  <td><StatusPill value={b.status}/></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar user={b.assignee}/><span style={{ fontSize: 12.5 }}>{userById(b.assignee).name.split(' ')[0]}</span></div></td>
                  <td className="right muted" style={{ paddingRight: 18 }}>{b.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Активність команди</h3>
            <div className="right"><span className="pill resolved"><span className="dot" style={{ background: 'var(--st-resolved-dot)' }}/> live</span></div>
          </div>
          <div className="activity">
            {ACTIVITY.map((a, i) => <ActivityRow key={i} a={a}/>)}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head">
          <h3>Прогрес тестування · v4.18</h3>
          <span className="sub">142 з 165 кейсів</span>
          <div className="right"><button className="btn sm" onClick={() => goto('run')}><Ic.Play sz={12}/> Запустити ран</button></div>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, paddingTop: 4, paddingBottom: 18 }}>
          {TEST_SUITES.map((s, i) => {
            const passed = [22, 28, 16, 18, 41][i];
            const failed = [1, 1, 0, 2, 3][i];
            const total = s.count;
            const remaining = total - passed - failed;
            const pct = Math.round((passed / total) * 100);
            return (
              <div key={s.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <b style={{ fontWeight: 550 }}>{s.name}</b>
                  <span style={{ color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                </div>
                <BarStack parts={[
                  { value: passed, color: 'var(--st-resolved-dot)', label: 'passed' },
                  { value: failed, color: 'var(--st-open-dot)', label: 'failed' },
                  { value: remaining, color: 'var(--bg-2)', label: 'pending' },
                ]}/>
                <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--fg-3)', fontVariantNumeric: 'tabular-nums' }}>
                  <span><span style={{ color: 'var(--st-resolved-fg)' }}>●</span> {passed}</span>
                  <span><span style={{ color: 'var(--st-open-fg)' }}>●</span> {failed}</span>
                  <span><span style={{ color: 'var(--fg-4)' }}>●</span> {remaining}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
