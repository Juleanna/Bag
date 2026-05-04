// Atoms — small reusable bits used across screens.

const STATUS = {
  open:     { label: 'Open',        cls: 'open',     dot: 'var(--st-open-dot)' },
  progress: { label: 'In Progress', cls: 'progress', dot: 'var(--st-progress-dot)' },
  resolved: { label: 'Resolved',    cls: 'resolved', dot: 'var(--st-resolved-dot)' },
  closed:   { label: 'Closed',      cls: 'closed',   dot: 'var(--st-closed-dot)' },
  blocked:  { label: 'Blocked',     cls: 'blocked',  dot: 'var(--st-blocked-dot)' },
};
const PRIORITY = {
  critical: { label: 'Critical', cls: 'critical' },
  high:     { label: 'High',     cls: 'high' },
  medium:   { label: 'Medium',   cls: 'medium' },
  low:      { label: 'Low',      cls: 'low' },
};

function StatusPill({ value }) {
  const s = STATUS[value] || STATUS.open;
  return (
    <span className={`pill ${s.cls}`}>
      <span className="dot" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function PriorityBadge({ value }) {
  const p = PRIORITY[value] || PRIORITY.medium;
  const dots = { critical: 4, high: 3, medium: 2, low: 1 }[value] || 2;
  return (
    <span className={`pri ${p.cls}`}>
      <span className="pri-icon">
        <svg width="9" height="9" viewBox="0 0 9 9">
          {dots >= 4 && <rect x="0" y="0" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>}
          {dots >= 3 && <rect x="5.5" y="0" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>}
          {dots >= 2 && <rect x="0" y="5.5" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>}
          {dots >= 1 && <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.7" fill="currentColor"/>}
        </svg>
      </span>
      {p.label}
    </span>
  );
}

function Avatar({ user, size = 'sm' }) {
  const u = typeof user === 'string' ? userById(user) : user;
  return (
    <span className={`avatar ${size === 'lg' ? 'lg' : ''}`} title={u.name} style={{ background: u.color }}>
      {u.initials}
    </span>
  );
}

function AvatarStack({ ids = [], max = 3 }) {
  const shown = ids.slice(0, max);
  return (
    <span className="avatar-stack">
      {shown.map(id => <Avatar key={id} user={id} />)}
      {ids.length > max && (
        <span className="avatar" style={{ background: 'var(--bg-2)', color: 'var(--fg-3)' }}>
          +{ids.length - max}
        </span>
      )}
    </span>
  );
}

function Sparkline({ data, w = 96, h = 28, color = 'var(--accent)' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2;
    return [x, y];
  });
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const fillD = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-z]/gi,'')}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#spark-grad-${color.replace(/[^a-z]/gi,'')})`}/>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BarStack({ parts }) {
  // parts: [{ value, color }]
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="bar-stack">
      {parts.map((p, i) => (
        <span key={i} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.label || ''}: ${p.value}`}/>
      ))}
    </div>
  );
}

window.STATUS = STATUS;
window.PRIORITY = PRIORITY;
window.StatusPill = StatusPill;
window.PriorityBadge = PriorityBadge;
window.Avatar = Avatar;
window.AvatarStack = AvatarStack;
window.Sparkline = Sparkline;
window.BarStack = BarStack;
