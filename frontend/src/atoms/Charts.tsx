/**
 * SVG-діаграми: Sparkline, BarStack, DonutChart.
 * Перенесено з proto/src/atoms.jsx + screens-overview.jsx.
 */

interface SparklineProps {
  data: number[]
  w?: number
  h?: number
  color?: string
}

export function Sparkline({ data, w = 96, h = 28, color = 'var(--accent)' }: SparklineProps) {
  if (data.length === 0) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w
    const y = h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2
    return [x, y]
  })
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ')
  const fillD = `${d} L${w},${h} L0,${h} Z`
  const id = `spark-${color.replace(/[^a-z]/gi, '')}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.18" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#${id})`} />
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export interface BarStackPart {
  value: number
  color: string
  label?: string
}

export function BarStack({ parts }: { parts: BarStackPart[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div className="bar-stack">
      {parts.map((p, i) => (
        <span
          key={i}
          style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
          title={`${p.label || ''}: ${p.value}`}
        />
      ))}
    </div>
  )
}

export interface DonutPart {
  label: string
  value: number
  color: string
}

export function DonutChart({ size = 160, parts }: { size?: number; parts: DonutPart[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0)
  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 12} fill="var(--bg-2)" />
        <text
          x={size / 2}
          y={size / 2 + 4}
          textAnchor="middle"
          fontSize="13"
          fill="var(--fg-3)"
        >
          немає даних
        </text>
      </svg>
    )
  }
  const r = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  let angle = -90
  const segs = parts.map(p => {
    const start = angle
    const span = (p.value / total) * 360
    angle += span
    const end = angle
    const sa = (start * Math.PI) / 180
    const ea = (end * Math.PI) / 180
    const x1 = cx + r * Math.cos(sa)
    const y1 = cy + r * Math.sin(sa)
    const x2 = cx + r * Math.cos(ea)
    const y2 = cy + r * Math.sin(ea)
    const large = span > 180 ? 1 : 0
    return {
      d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`,
      color: p.color,
    }
  })
  return (
    <svg width={size} height={size}>
      {segs.map((s, i) => (
        <path key={i} d={s.d} fill={s.color} />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.62} fill="var(--surface)" />
      <text
        x={cx}
        y={cy - 2}
        textAnchor="middle"
        fontSize="22"
        fontWeight="600"
        fill="var(--fg)"
        letterSpacing="-0.02em"
      >
        {total}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10.5" fill="var(--fg-3)">
        всього
      </text>
    </svg>
  )
}
