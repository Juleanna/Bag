import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../api/client'
import { useToast } from '../context/ToastContext'

export function NewProjectPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const created = await apiPost<{ id: number }>('/projects/', { name, description })
      toast.show('Проєкт створено', 'success')
      navigate(`/bugs?project=${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка створення')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <div className="page-head">
        <div>
          <h1>Новий проєкт</h1>
          <div className="sub">QA-простір для одного продукту чи команди</div>
        </div>
      </div>
      <form className="card" style={{ padding: 22 }} onSubmit={submit}>
        {error && <div className="bt-error-banner">{error}</div>}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Назва *</label>
          <input
            className="inp"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
            placeholder="Web App"
          />
        </div>
        <div className="field">
          <label>Опис</label>
          <textarea
            className="inp"
            rows={4}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Призначення проєкту, стек, посилання на репозиторій"
          />
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 18, justifyContent: 'flex-end' }}>
          <button type="button" className="btn ghost" onClick={() => navigate('/dashboard')}>
            Скасувати
          </button>
          <button type="submit" className="btn primary" disabled={submitting || !name}>
            {submitting ? 'Створення…' : 'Створити проєкт'}
          </button>
        </div>
      </form>
    </div>
  )
}
