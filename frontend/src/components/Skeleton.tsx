/**
 * Skeleton — плейсхолдер з shimmer-анімацією для станів завантаження.
 * Використовуйте замість спінера, щоб уникнути layout-shift.
 */
interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 6,
  className = '',
  style,
}: SkeletonProps) {
  return (
    <div
      className={`bt-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  )
}

/** Згрупований skeleton для рядків таблиці. */
export function SkeletonRows({ count = 6, height = 40 }: { count?: number; height?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  )
}

/** Skeleton-картка для дашборду. */
export function SkeletonCard({ height = 120 }: { height?: number }) {
  return <Skeleton height={height} borderRadius={12} />
}
