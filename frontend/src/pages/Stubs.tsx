import { useNavigate } from 'react-router-dom'
import { Ic } from '../icons/Ic'

interface StubProps {
  icon: typeof Ic.Bug
  title: string
  description: string
}

function Stub({ icon: Icon, title, description }: StubProps) {
  const navigate = useNavigate()
  return (
    <div className="page" style={{ display: 'grid', placeItems: 'center', padding: 60 }}>
      <div className="bt-stub">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'var(--accent-soft)',
            color: 'var(--accent-soft-fg)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon sz={28} />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => navigate('/dashboard')}>
            <Ic.Layout sz={13} /> На огляд
          </button>
          <button className="btn primary" onClick={() => navigate('/bugs')}>
            <Ic.Bug sz={13} /> До багів
          </button>
        </div>
      </div>
    </div>
  )
}

export const TestsPage = () => (
  <Stub
    icon={Ic.Beaker}
    title="Тест-кейси · Скоро"
    description="Розділ для зберігання сценаріїв тестування. Потребує окремих моделей у бекенді (TestSuite, TestCase, TestStep). У поточній версії замість тест-кейсів керування працює через задачі (Issues)."
  />
)

export const RunsPage = () => (
  <Stub
    icon={Ic.Play}
    title="Test Runs · Скоро"
    description="Запуск підбірок тест-кейсів і фіксація результатів. Потребує бекенд-моделей TestRun і TestResult."
  />
)

export const ReportsPage = () => (
  <Stub
    icon={Ic.Chart}
    title="Розширені звіти · Скоро"
    description="Базова статистика вже доступна на сторінці Огляд. Тут будуть: експорт у PDF/CSV, кастомні дашборди, фільтри по вікнах часу."
  />
)
