import { Ic } from '../icons/Ic'

interface Props {
  open: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { section: 'Навігація', items: [
    { key: '⌘ K', label: 'Швидкий пошук' },
    { key: '?', label: 'Ця довідка' },
    { key: '⌘ 1', label: 'Огляд' },
    { key: '⌘ 2', label: 'Баги' },
    { key: '⌘ 3', label: 'Тест-кейси' },
    { key: '⌘ 4', label: 'Test Runs' },
  ]},
  { section: 'Дії', items: [
    { key: 'C', label: 'Новий баг' },
    { key: '⇧ C', label: 'Новий тест-кейс' },
    { key: 'R', label: 'Новий Test Run' },
    { key: 'Esc', label: 'Закрити модальне вікно' },
  ]},
]

export function HelpModal({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="cp-overlay" onClick={onClose}>
      <div
        className="cp"
        style={{ width: 480, padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Ic.Help sz={16} />
          <b style={{ fontSize: 14 }}>Гарячі клавіші</b>
          <button
            className="btn ghost icon"
            style={{ marginLeft: 'auto' }}
            onClick={onClose}
            title="Закрити"
          >
            <Ic.X sz={14} />
          </button>
        </div>
        <div style={{ padding: '16px 20px', maxHeight: 420, overflow: 'auto' }}>
          {SHORTCUTS.map(s => (
            <div key={s.section} className="kbd-section">
              <h5>{s.section}</h5>
              {s.items.map(it => (
                <div key={it.label} className="kbd-row">
                  <span>{it.label}</span>
                  <span>
                    {it.key.split(' ').map((k, i) => (
                      <span key={i} className="kbd">
                        {k}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
