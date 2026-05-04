import { Ic } from '../../icons/Ic'

/**
 * Права частина auth-екранів — градієнтна сторона з відгуком і списком фічей.
 */
export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="auth-aside-inner">
        <div>
          <span className="quote-mark">&ldquo;</span>
          <div className="quote">
            BugTracker замінив три інструменти й зекономив команді 6 годин на тиждень. Рідкісний випадок,
            коли &laquo;все в одному&raquo; справді працює.
          </div>
          <div className="who" style={{ marginTop: 24 }}>
            <div className="av">МК</div>
            <div>
              <b>Марія Коваленко</b>
              <span>Head of QA · Voltway</span>
            </div>
          </div>
        </div>
        <div className="feature-list">
          <div className="row">
            <Ic.Check sz={16} /> Безкоштовно для невеликих команд
          </div>
          <div className="row">
            <Ic.Check sz={16} /> Імпорт через REST API
          </div>
          <div className="row">
            <Ic.Check sz={16} /> CSRF + secure cookies
          </div>
          <div className="row">
            <Ic.Check sz={16} /> 30+ інтеграцій з коробки
          </div>
        </div>
      </div>
    </aside>
  )
}
