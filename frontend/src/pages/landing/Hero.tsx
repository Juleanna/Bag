import { Link } from 'react-router-dom'
import { Ic } from '../../icons/Ic'
import { Avatar } from '../../atoms/Avatar'
import { StatusPill, PriorityBadge } from '../../atoms/Status'
import { useLanding } from '../../context/LandingContext'
import { t } from '../../api/landing'

/**
 * Hero-секція. Контент тягнеться з API (/api/landing/);
 * fallback-дефолти у JSX на випадок коли API не відповів.
 */
export function Hero() {
  const { data, lang } = useLanding()
  const h = data?.hero
  const txt = (v: unknown, fallback: string) =>
    h ? (t(v as never, lang) || fallback) : fallback

  return (
    <section className="hero">
      <div className="hero-grid-bg" />
      <div className="hero-mesh" />
      <div className="hero-inner">
        <div className="hero-eyebrow">
          <span className="badge">{h?.eyebrow_badge ?? 'NEW'}</span>
          {txt(h?.eyebrow_text, 'AI-резюме багів')}
          {h?.eyebrow_version && <span className="badge">{h.eyebrow_version}</span>}
          <Ic.Chev sz={12} />
        </div>
        <h1>
          {txt(h?.title_a, 'Баг-трекер,')}{' '}
          <span className="accent">{txt(h?.title_accent, 'що ловить дефекти')}</span>{' '}
          {txt(h?.title_b, 'до того, як їх побачить юзер.')}
        </h1>
        <p className="lede">
          {txt(
            h?.lede,
            "BugTracker об'єднує задачі, коментарі та сповіщення у єдиному робочому просторі."
          )}
        </p>
        <div className="hero-ctas">
          <Link to={h?.primary_cta_link ?? '/register'} className="btn-lg primary">
            {txt(h?.primary_cta_text, 'Почати безкоштовно')} <Ic.Chev sz={14} />
          </Link>
          <Link to={h?.secondary_cta_link ?? '/login'} className="btn-lg secondary">
            <Ic.Play sz={12} /> {txt(h?.secondary_cta_text, 'Подивитися застосунок')}
          </Link>
        </div>
        <div className="hero-foot">
          <span>
            <Ic.Check
              sz={12}
              style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--st-resolved-fg)' }}
            />{' '}
            {txt(h?.foot_text_1, 'Безкоштовно для невеликих команд')}
          </span>
          <span className="dot" />
          <span>{txt(h?.foot_text_2, 'Без картки')}</span>
          <span className="dot" />
          <span>{txt(h?.foot_text_3, 'SOC 2 · GDPR')}</span>
        </div>
      </div>

      <div className="mockup-wrap">
        <div className="mockup-frame">
          <div className="mockup-bar">
            <div className="lights">
              <span />
              <span />
              <span />
            </div>
            <div className="url">
              <Ic.Globe sz={10} /> app.bugtracker.io/dashboard
            </div>
            <div style={{ width: 56 }} />
          </div>
          <DashboardSnapshot />
        </div>
        <div className="mockup-floats">
          <div className="mock-float f1">
            <span className="dot" style={{ background: 'var(--st-resolved-dot)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>BUG-2041 закрито</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 11 }}>2 хв тому · Maria K.</div>
            </div>
          </div>
          <div className="mock-float f2">
            <Ic.AI sz={14} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>AI · резюме готове</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 11 }}>3 кроки репро</div>
            </div>
          </div>
          <div className="mock-float f3">
            <span className="dot" style={{ background: 'var(--st-progress-dot)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Spring v2.4 · 87%</div>
              <div style={{ color: 'var(--fg-3)', fontSize: 11 }}>23 / 26 задач закрито</div>
            </div>
          </div>
        </div>
      </div>

      <div className="logo-bar">
        <h6>Понад 800 команд довіряють BugTracker</h6>
        <div className="row">
          <span className="lg"><Ic.Spark sz={16} /> Northwind</span>
          <span className="lg"><Ic.Lightning sz={16} /> Voltway</span>
          <span className="lg"><Ic.Layout sz={16} /> Plinth</span>
          <span className="lg"><Ic.Star sz={16} /> Stellar</span>
          <span className="lg"><Ic.Globe sz={16} /> Meridian</span>
          <span className="lg"><Ic.Beaker sz={16} /> Orbital</span>
        </div>
      </div>
    </section>
  )
}

function DashboardSnapshot() {
  const fakeUser = { id: 1, username: 'maria', first_name: 'Марія', last_name: 'К' }
  return (
    <div style={{ height: 720, background: 'var(--bg)', padding: 24, overflow: 'hidden' }}>
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Доброго ранку, Олено 👋</h2>
      <div style={{ color: 'var(--fg-3)', fontSize: 13, marginTop: 4 }}>
        14 відкритих · 32 закрито за тиждень
      </div>

      <div className="metrics" style={{ marginTop: 20 }}>
        {[
          { l: 'Відкриті', v: '14' },
          { l: 'Закриті', v: '32' },
          { l: 'У роботі', v: '7' },
          { l: 'Готово', v: '89%' },
        ].map(m => (
          <div key={m.l} className="card metric">
            <div className="metric-lbl">{m.l}</div>
            <div className="metric-val">{m.v}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 16, padding: 18 }}>
        <h3 style={{ margin: 0, marginBottom: 12, fontSize: 14 }}>Найгарячіші баги</h3>
        {[
          { id: 2041, t: 'Не зберігаються налаштування 2FA', s: 'open' as const, p: 'high' as const },
          { id: 2040, t: 'Падіння при відкритті профілю офлайн', s: 'in_progress' as const, p: 'high' as const },
          { id: 2039, t: 'Кнопка "Зберегти" зникає на мобільних', s: 'in_progress' as const, p: 'medium' as const },
          { id: 2034, t: 'Контраст тексту нижче WCAG AA', s: 'open' as const, p: 'low' as const },
        ].map(b => (
          <div
            key={b.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              borderBottom: '1px solid var(--divider)',
            }}
          >
            <span className="id-cell">BUG-{b.id}</span>
            <span style={{ flex: 1, fontSize: 13 }}>{b.t}</span>
            <PriorityBadge value={b.p} />
            <StatusPill value={b.s} />
            <Avatar user={fakeUser} />
          </div>
        ))}
      </div>
    </div>
  )
}
