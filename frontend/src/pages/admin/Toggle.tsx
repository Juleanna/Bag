/** Простий toggle-перемикач (для is_visible / show_*). */

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
}

export function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <span
      className={checked ? 'toggle on' : 'toggle'}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span />
    </span>
  )
}
