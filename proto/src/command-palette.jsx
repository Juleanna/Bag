// Command palette (⌘K)
function CommandPalette({ open, onClose, goto }) {
  const [q, setQ] = React.useState('');
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { if (open) { setQ(''); setIdx(0); } }, [open]);

  const all = [
    { section: 'Навігація', items: [
      { id: 'go-dashboard', label: 'Перейти до Огляду', meta: '⌘1', icon: <Ic.Layout sz={14}/>, run: () => goto('dashboard') },
      { id: 'go-bugs', label: 'Перейти до Багів', meta: '⌘2', icon: <Ic.Bug sz={14}/>, run: () => goto('bugs') },
      { id: 'go-tests', label: 'Перейти до Тест-кейсів', meta: '⌘3', icon: <Ic.Beaker sz={14}/>, run: () => goto('tests') },
      { id: 'go-run', label: 'Перейти до Test Run', meta: '⌘4', icon: <Ic.Play sz={14}/>, run: () => goto('run') },
    ] },
    { section: 'Дії', items: [
      { id: 'new-bug', label: 'Створити новий баг', meta: 'C', icon: <Ic.Plus sz={14}/>, run: () => goto('bug-detail') },
      { id: 'new-tc', label: 'Створити тест-кейс', icon: <Ic.Plus sz={14}/>, run: () => goto('test-detail') },
      { id: 'start-run', label: 'Запустити тест-ран', meta: 'R', icon: <Ic.Play sz={14}/>, run: () => goto('run') },
    ] },
    { section: 'Останні', items: [
      { id: 'b-2041', label: 'BUG-2041 · Не зберігаються налаштування 2FA', icon: <Ic.Bug sz={14}/>, run: () => goto('bug-detail') },
      { id: 'b-2040', label: 'BUG-2040 · Падіння застосунку при відкритті профілю', icon: <Ic.Bug sz={14}/>, run: () => goto('bug-detail') },
      { id: 'tc-104', label: 'TC-104 · Користувач може увімкнути 2FA через email-код', icon: <Ic.Beaker sz={14}/>, run: () => goto('test-detail') },
    ] },
  ];

  const filtered = all.map(s => ({ ...s, items: s.items.filter(it => !q || it.label.toLowerCase().includes(q.toLowerCase())) })).filter(s => s.items.length);
  const flat = filtered.flatMap(s => s.items);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setIdx(i => Math.min(flat.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx(i => Math.max(0, i - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); flat[idx]?.run(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, idx, flat, onClose]);

  if (!open) return null;
  let cursor = 0;
  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp" onClick={e => e.stopPropagation()}>
        <input className="cp-input" autoFocus placeholder="Швидко знайти або виконати дію…" value={q} onChange={e => { setQ(e.target.value); setIdx(0); }}/>
        <div className="cp-list">
          {filtered.map(s => (
            <div key={s.section}>
              <div className="cp-section">{s.section}</div>
              {s.items.map(it => {
                const myIdx = cursor++;
                return (
                  <div key={it.id} className={`cp-item ${myIdx === idx ? 'active' : ''}`}
                       onMouseEnter={() => setIdx(myIdx)}
                       onClick={() => { it.run(); onClose(); }}>
                    {it.icon}
                    <span>{it.label}</span>
                    {it.meta && <span className="meta kbd">{it.meta}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.CommandPalette = CommandPalette;
