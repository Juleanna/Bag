/**
 * TranslatableInput — інпут з вкладками мов (uk / en) для редагування
 * перекладного поля. Значення — dict {uk, en}.
 */
import { useState } from 'react'
import type { Lang, LangText } from '../../api/landing'

interface Props {
  label: string
  value: LangText
  onChange: (next: Record<Lang, string>) => void
  textarea?: boolean
  full?: boolean
  rows?: number
}

const LANG_LABELS: Record<Lang, string> = {
  uk: 'UK',
  en: 'EN',
}

function asDict(v: LangText): Record<Lang, string> {
  if (typeof v === 'string') return { uk: v, en: '' }
  return { uk: v.uk || '', en: v.en || '' }
}

export function TranslatableInput({
  label,
  value,
  onChange,
  textarea,
  full,
  rows = 3,
}: Props) {
  const [active, setActive] = useState<Lang>('uk')
  const dict = asDict(value)
  const text = dict[active] || ''

  const handleChange = (newText: string) => {
    onChange({ ...dict, [active]: newText })
  }

  return (
    <div className="field" style={full ? { gridColumn: '1 / -1' } : undefined}>
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 6,
          minHeight: 24,
        }}
      >
        <span>{label}</span>
        <div className="lang-toggle">
          {(['uk', 'en'] as Lang[]).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setActive(l)}
              className={active === l ? 'active' : ''}
              title={l === 'uk' ? 'Українська' : 'English'}
            >
              {LANG_LABELS[l]}
              {!dict[l] && <span className="empty-dot" />}
            </button>
          ))}
        </div>
      </label>
      {textarea ? (
        <textarea
          className="inp"
          rows={rows}
          value={text}
          onChange={e => handleChange(e.target.value)}
        />
      ) : (
        <input
          className="inp"
          value={text}
          onChange={e => handleChange(e.target.value)}
        />
      )}
    </div>
  )
}
