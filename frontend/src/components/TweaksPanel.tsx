import { useState } from 'react'
import { Ic } from '../icons/Ic'
import { useTweaks } from '../context/TweaksContext'

const ACCENT_PRESETS = ['#5E6AD2', '#0EA5E9', '#10B981', '#D97757', '#9665C9', '#1F1E1A']

export function TweaksPanel() {
  const { tweaks, set, reset } = useTweaks()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        title="Налаштування вигляду"
        style={{
          position: 'fixed',
          right: 14,
          bottom: 14,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--fg-2)',
          cursor: 'pointer',
          zIndex: 80,
        }}
      >
        <Ic.Settings sz={16} />
      </button>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 14,
            bottom: 60,
            width: 280,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 81,
            padding: 14,
            maxHeight: '70vh',
            overflow: 'auto',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}
          >
            <b style={{ fontSize: 13 }}>Налаштування вигляду</b>
            <button
              className="btn ghost sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setOpen(false)}
            >
              <Ic.X sz={12} />
            </button>
          </div>

          <Section label="Тема">
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn sm ${tweaks.theme === 'light' ? 'primary' : ''}`}
                onClick={() => set('theme', 'light')}
              >
                <Ic.Sun sz={12} /> Light
              </button>
              <button
                className={`btn sm ${tweaks.theme === 'dark' ? 'primary' : ''}`}
                onClick={() => set('theme', 'dark')}
              >
                <Ic.Moon sz={12} /> Dark
              </button>
            </div>
          </Section>

          <Section label="Акцент">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ACCENT_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => set('accent', c)}
                  title={c}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: c,
                    border: '1px solid rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    boxShadow: tweaks.accent === c ? `0 0 0 2px var(--surface), 0 0 0 4px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
          </Section>

          <Section label="Щільність">
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                className={`btn sm ${tweaks.density === 'compact' ? 'primary' : ''}`}
                onClick={() => set('density', 'compact')}
              >
                Compact
              </button>
              <button
                className={`btn sm ${tweaks.density === 'comfortable' ? 'primary' : ''}`}
                onClick={() => set('density', 'comfortable')}
              >
                Comfy
              </button>
            </div>
          </Section>

          <Slider label="Шрифт" value={tweaks.fontSize} min={12} max={16} unit="px" onChange={v => set('fontSize', v)} />
          <Slider
            label="Сайдбар"
            value={tweaks.sidebarWidth}
            min={200}
            max={300}
            unit="px"
            onChange={v => set('sidebarWidth', v)}
          />
          <Slider
            label="Заокруглення"
            value={tweaks.borderRadius}
            min={4}
            max={20}
            unit="px"
            onChange={v => set('borderRadius', v)}
          />

          <button
            className="btn ghost sm"
            style={{ marginTop: 10 }}
            onClick={reset}
          >
            <Ic.Refresh sz={12} /> Скинути
          </button>
        </div>
      )}
    </>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          fontSize: 11,
          color: 'var(--fg-3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--fg-3)',
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--fg-2)' }}>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  )
}
