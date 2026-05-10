/**
 * Онбординг для нових користувачів — двоступеневий:
 *  1. Якщо немає просторів → пропонуємо створити простір.
 *  2. Якщо простір є, але немає проєктів → пропонуємо створити проєкт.
 *
 * Модал blocking — застосунок не має сенсу без простору/проєкту.
 * Зникає автоматично через події workspace:created / project:created.
 */
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'
import { listAll } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface ShortItem {
  id: number
}

type Stage = 'workspace' | 'project' | 'none'

export function OnboardingPrompt() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [stage, setStage] = useState<Stage>('none')

  const refresh = async () => {
    try {
      const ws = await listAll<ShortItem>('/workspaces/?page_size=1').catch(
        () => [] as ShortItem[]
      )
      if (ws.length === 0) {
        setStage('workspace')
        return
      }
      const ps = await listAll<ShortItem>('/projects/?page_size=1').catch(
        () => [] as ShortItem[]
      )
      if (ps.length === 0) {
        setStage('project')
        return
      }
      setStage('none')
    } catch {
      /* мовчки */
    }
  }

  useEffect(() => {
    if (!user) {
      setStage('none')
      return
    }
    void refresh()
    const onChange = () => void refresh()
    window.addEventListener('workspace:created', onChange)
    window.addEventListener('workspace:deleted', onChange)
    window.addEventListener('project:created', onChange)
    window.addEventListener('project:deleted', onChange)
    return () => {
      window.removeEventListener('workspace:created', onChange)
      window.removeEventListener('workspace:deleted', onChange)
      window.removeEventListener('project:created', onChange)
      window.removeEventListener('project:deleted', onChange)
    }
  }, [user])

  // На сторінках створення модал не потрібен — користувач уже там
  const onCreatePage =
    location.pathname.startsWith('/workspaces/new') ||
    location.pathname.startsWith('/projects/new')

  const startWorkspace = () => navigate('/workspaces/new')
  const startProject = () => navigate('/projects/new')

  if (stage === 'none' || !user || onCreatePage) return null

  const userName = user.first_name || user.username

  const isStageWorkspace = stage === 'workspace'

  return (
    <div className="confirm-overlay">
      <div
        className="confirm-dialog onboarding-dialog"
        role="dialog"
        aria-modal="true"
      >
        <div className="onboarding-hero">
          <div className="onboarding-icon">
            {isStageWorkspace ? <Ic.Spark sz={28} /> : <Ic.Layout sz={28} />}
          </div>
          <h3>
            {isStageWorkspace
              ? `Вітаємо, ${userName}! 👋`
              : 'Створіть перший проєкт'}
          </h3>
          <p>
            {isStageWorkspace ? (
              <>
                Щоб почати, створіть <b>робочий простір</b>. Це окрема
                організація з власними проєктами, учасниками і білінгом —
                після створення ви зможете додавати проєкти та задачі.
              </>
            ) : (
              <>
                Простір є — тепер додайте <b>проєкт</b>. Це конкретний продукт
                всередині простору, де ви фіксуєте баги, тест-кейси та сплануєте
                спринти.
              </>
            )}
          </p>
        </div>

        {isStageWorkspace ? (
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Layout sz={14} />
              </span>
              <div>
                <b>Декілька проєктів</b>
                <span>Web App, iOS, API — все в одному просторі</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Users sz={14} />
              </span>
              <div>
                <b>Команда з ролями</b>
                <span>Спостерігачі, учасники, менеджери</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Bug sz={14} />
              </span>
              <div>
                <b>Баги, тести, спринти</b>
                <span>Все необхідне для якості продукту</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="onboarding-features">
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Bug sz={14} />
              </span>
              <div>
                <b>Баги</b>
                <span>Створення, призначення, відстеження статусів</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Beaker sz={14} />
              </span>
              <div>
                <b>Тест-кейси й Test Runs</b>
                <span>Структуровані сценарії та звіти про прогон</span>
              </div>
            </div>
            <div className="onboarding-feature">
              <span className="onboarding-feature-ico">
                <Ic.Calendar sz={14} />
              </span>
              <div>
                <b>Спринти</b>
                <span>Двотижневі ітерації з burndown-графіком</span>
              </div>
            </div>
          </div>
        )}

        <div className="confirm-actions" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="btn primary"
            onClick={isStageWorkspace ? startWorkspace : startProject}
          >
            <Ic.Plus sz={12} />{' '}
            {isStageWorkspace ? 'Створити простір' : 'Створити проєкт'}
          </button>
        </div>
      </div>
    </div>
  )
}
