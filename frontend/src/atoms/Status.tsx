import type { IssueStatus, IssuePriority } from '../api/types'

// Базова мапа дефолтних статусів. Використовується як fallback, коли
// для проєкту немає кастомного WorkflowStatus.
export const STATUS_MAP: Record<
  string,
  { label: string; cls: string; dot: string }
> = {
  open: { label: 'Відкрито', cls: 'open', dot: 'var(--st-open-dot)' },
  in_progress: { label: 'В процесі', cls: 'progress', dot: 'var(--st-progress-dot)' },
  blocked: { label: 'Заблоковано', cls: 'blocked', dot: 'var(--st-blocked-dot)' },
  done: { label: 'Готово', cls: 'resolved', dot: 'var(--st-resolved-dot)' },
  cancelled: { label: 'Скасовано', cls: 'closed', dot: 'var(--st-closed-dot)' },
}

export const PRIORITY_MAP: Record<
  IssuePriority,
  { label: string; cls: string; dots: number }
> = {
  low: { label: 'Низький', cls: 'low', dots: 1 },
  medium: { label: 'Середній', cls: 'medium', dots: 2 },
  high: { label: 'Високий', cls: 'high', dots: 3 },
  critical: { label: 'Критичний', cls: 'critical', dots: 4 },
}

/**
 * StatusPill — підтримує два режими:
 *   1. Тільки value → беремо все з STATUS_MAP (legacy fallback).
 *   2. value + label/color → довільний кастомний статус (з WorkflowStatus).
 */
export function StatusPill({
  value,
  label,
  color,
}: {
  value: IssueStatus
  label?: string
  color?: string
}) {
  const s = STATUS_MAP[value]
  const finalLabel = label ?? s?.label ?? value
  const finalColor = color ?? s?.dot ?? 'var(--st-open-dot)'
  return (
    <span className={`pill ${s?.cls || 'open'}`}>
      <span className="dot" style={{ background: finalColor }} />
      {finalLabel}
    </span>
  )
}

export function PriorityBadge({ value }: { value: IssuePriority }) {
  const p = PRIORITY_MAP[value] || PRIORITY_MAP.medium
  const dots = p.dots
  return (
    <span className={`pri ${p.cls}`}>
      <span className="pri-icon">
        <svg width="9" height="9" viewBox="0 0 9 9">
          {dots >= 4 && <rect x="0" y="0" width="3.5" height="3.5" rx="0.7" fill="currentColor" />}
          {dots >= 3 && <rect x="5.5" y="0" width="3.5" height="3.5" rx="0.7" fill="currentColor" />}
          {dots >= 2 && <rect x="0" y="5.5" width="3.5" height="3.5" rx="0.7" fill="currentColor" />}
          {dots >= 1 && <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.7" fill="currentColor" />}
        </svg>
      </span>
      {p.label}
    </span>
  )
}
