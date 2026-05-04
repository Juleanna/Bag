import { Link } from 'react-router-dom'
import { Ic } from '../../icons/Ic'
import { useTweaks } from '../../context/TweaksContext'
import { useLanding } from '../../context/LandingContext'
import { useAuth } from '../../context/AuthContext'

export function SaasNav() {
  const { tweaks, set } = useTweaks()
  const { lang, setLang, preview, setPreview } = useLanding()
  const { user } = useAuth()

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className="saas-nav">
      <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <span className="mark">B</span>
        <span>BugTracker</span>
      </Link>
      <div className="links">
        <a onClick={() => scrollTo('features')}>Можливості</a>
        <a onClick={() => scrollTo('use-cases')}>Для кого</a>
        <a onClick={() => scrollTo('integrations')}>Інтеграції</a>
        <a onClick={() => scrollTo('faq')}>FAQ</a>
      </div>
      <div className="right">
        {/* Перемикач мови uk/en — segmented control */}
        <div className="seg">
          <button
            type="button"
            className={lang === 'uk' ? 'active' : ''}
            onClick={() => setLang('uk')}
          >
            UK
          </button>
          <button
            type="button"
            className={lang === 'en' ? 'active' : ''}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>

        {/* Перемикач preview-режиму (тільки для staff) */}
        {user?.is_staff && (
          <button
            className={`btn ${preview ? 'primary' : ''}`}
            onClick={() => setPreview(!preview)}
            title="Перегляд із чорновиками"
          >
            <Ic.Eye sz={12} />
            {preview ? 'Preview ON' : 'Preview'}
          </button>
        )}

        <button
          className="btn ghost icon"
          onClick={() => set('theme', tweaks.theme === 'dark' ? 'light' : 'dark')}
          title="Тема"
        >
          {tweaks.theme === 'dark' ? <Ic.Sun sz={14} /> : <Ic.Moon sz={14} />}
        </button>
        <Link to="/login" className="btn">
          Увійти
        </Link>
        <Link to="/register" className="btn primary">
          Спробувати
        </Link>
      </div>
    </nav>
  )
}
