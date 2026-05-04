import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ic } from '../../icons/Ic'
import { useLanding } from '../../context/LandingContext'
import { t } from '../../api/landing'
import type { ColorVariant, IconName } from '../../api/landing'

/** Мапа icon-name → React-компонент. */
const ICON_MAP: Record<IconName, typeof Ic.Bug> = {
  Bug: Ic.Bug,
  Beaker: Ic.Beaker,
  Play: Ic.Play,
  Layout: Ic.Layout,
  Chart: Ic.Chart,
  Comment: Ic.Comment,
  Bell: Ic.Bell,
  Lightning: Ic.Lightning,
  AI: Ic.AI,
  User: Ic.User,
  Users: Ic.Users,
  Github: Ic.Github,
  Slack: Ic.Slack,
  Spark: Ic.Spark,
  Star: Ic.Star,
  Globe: Ic.Globe,
  Refresh: Ic.Refresh,
  Settings: Ic.Settings,
  Lock: Ic.Lock,
  Activity: Ic.Activity,
}

/** Мапа color-variant → CSS-кольори фону+тексту іконки. */
const COLOR_STYLES: Record<ColorVariant, { background: string; color: string }> = {
  accent: { background: 'var(--accent-soft)', color: 'var(--accent-soft-fg)' },
  resolved: { background: 'var(--st-resolved-bg)', color: 'var(--st-resolved-fg)' },
  progress: { background: 'var(--st-progress-bg)', color: 'var(--st-progress-fg)' },
  blocked: { background: 'var(--st-blocked-bg)', color: 'var(--st-blocked-fg)' },
  open: { background: 'var(--st-open-bg)', color: 'var(--st-open-fg)' },
  closed: { background: 'var(--st-closed-bg)', color: 'var(--st-closed-fg)' },
}

export function IconByName({ name, sz = 22 }: { name: IconName; sz?: number }) {
  const Component = ICON_MAP[name] || Ic.Bug
  return <Component sz={sz} />
}

export { ICON_MAP, COLOR_STYLES }

// ============================================================================
// Features
// ============================================================================

export function Features() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_features) return null
  const s = data.settings
  return (
    <section id="features" className="section-wrap">
      <div className="section-head">
        <span className="kicker">{t(s.features_kicker, lang)}</span>
        <h2>{t(s.features_title, lang)}</h2>
        <p>{t(s.features_subtitle, lang)}</p>
      </div>
      <div className="feat-grid">
        {data.features.map(f => (
          <div key={f.id} className={f.featured ? 'feat-card featured' : 'feat-card'}>
            <div className="feat-ico" style={COLOR_STYLES[f.color_variant]}>
              <IconByName name={f.icon} sz={22} />
            </div>
            <h3>{t(f.title, lang)}</h3>
            <p>{t(f.description, lang)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Use cases
// ============================================================================

export function UseCases() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_use_cases) return null
  const s = data.settings
  return (
    <section id="use-cases" className="section-wrap" style={{ paddingTop: 32 }}>
      <div className="section-head">
        <span className="kicker">{t(s.use_cases_kicker, lang)}</span>
        <h2>{t(s.use_cases_title, lang)}</h2>
        <p>{t(s.use_cases_subtitle, lang)}</p>
      </div>
      <div className="uc-grid">
        {data.use_cases.map(u => {
          // bullets можуть приходити як рядок з \n або як dict
          const bulletsText = t(u.bullets, lang)
          const bullets = bulletsText.split('\n').map(s => s.trim()).filter(Boolean)
          return (
            <div key={u.id} className="uc-card">
              <div className="uc-icon" style={COLOR_STYLES[u.color_variant]}>
                <IconByName name={u.icon} sz={20} />
              </div>
              <h4>{t(u.title, lang)}</h4>
              <p>{t(u.description, lang)}</p>
              {bullets.length > 0 && (
                <ul className="uc-list">
                  {bullets.map((b, i) => (
                    <li key={i}>
                      <Ic.Check sz={14} /> {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ============================================================================
// Integrations (з логотипами)
// ============================================================================

export function Integrations() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_integrations) return null
  const s = data.settings
  return (
    <section id="integrations" className="section-wrap" style={{ paddingTop: 32 }}>
      <div className="section-head">
        <span className="kicker">{t(s.integrations_kicker, lang)}</span>
        <h2>{t(s.integrations_title, lang)}</h2>
        <p>{t(s.integrations_subtitle, lang)}</p>
      </div>
      <div className="int-grid">
        {data.integrations.map(i => (
          <div className="int-tile" key={i.id}>
            {i.logo_url ? (
              <img
                src={i.logo_url}
                alt={i.name}
                className="int-mark"
                style={{ objectFit: 'contain', background: 'transparent' }}
              />
            ) : (
              <div className="int-mark" style={{ background: i.color }}>
                {i.mark}
              </div>
            )}
            <span>{i.name}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Metrics
// ============================================================================

export function MetricsSection() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_metrics) return null
  if (data.metrics.length === 0) return null
  return (
    <section className="section-wrap" style={{ paddingTop: 32, paddingBottom: 32 }}>
      <div className="metrics-big">
        {data.metrics.map(m => (
          <div key={m.id} className="metric-big">
            <div className="num">{m.value}</div>
            <div className="lbl">{t(m.label, lang)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// Testimonials
// ============================================================================

export function Testimonials() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_testimonials) return null
  const s = data.settings
  return (
    <section className="section-wrap" style={{ paddingTop: 32 }}>
      <div className="section-head">
        <span className="kicker">{t(s.testimonials_kicker, lang)}</span>
        <h2>{t(s.testimonials_title, lang)}</h2>
      </div>
      <div className="test-grid">
        {data.testimonials.map(item => (
          <div
            key={item.id}
            className={item.featured ? 'test-card featured' : 'test-card'}
          >
            <div className="quote">{t(item.quote, lang)}</div>
            <div className="who">
              <div
                className="av"
                style={{
                  background: item.featured ? 'rgba(255,255,255,0.25)' : item.avatar_color,
                }}
              >
                {item.avatar_initials}
              </div>
              <div>
                <b>{item.author_name}</b>
                <span>{t(item.author_role, lang)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// FAQ
// ============================================================================

export function FAQ() {
  const { data, lang } = useLanding()
  const [open, setOpen] = useState(0)
  if (!data?.settings.show_faq) return null
  const s = data.settings
  return (
    <section id="faq" className="section-wrap" style={{ paddingTop: 32 }}>
      <div className="section-head">
        <span className="kicker">{t(s.faq_kicker, lang)}</span>
        <h2>{t(s.faq_title, lang)}</h2>
      </div>
      <div className="faq-wrap">
        {data.faq.map((it, i) => (
          <div key={it.id} className={open === i ? 'faq-item open' : 'faq-item'}>
            <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              {t(it.question, lang)}
              <Ic.ChevDown sz={16} className="chev" />
            </button>
            <div className="faq-a">{t(it.answer, lang)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============================================================================
// CTA strip
// ============================================================================

export function CtaStrip() {
  const { data, lang } = useLanding()
  if (!data?.settings.show_cta_strip) return null
  const s = data.settings
  return (
    <section className="cta-strip">
      <h2>{t(s.cta_title, lang)}</h2>
      <p>{t(s.cta_subtitle, lang)}</p>
      <div className="btns">
        <Link to={s.cta_primary_link} className="btn-lg primary">
          {t(s.cta_primary_text, lang)} <Ic.Chev sz={14} />
        </Link>
        <Link to={s.cta_secondary_link} className="btn-lg secondary">
          {t(s.cta_secondary_text, lang)}
        </Link>
      </div>
    </section>
  )
}

// ============================================================================
// Footer
// ============================================================================

export function Footer() {
  const { data, lang } = useLanding()
  const brandText =
    t(data?.settings.footer_brand_text, lang) ||
    'Баг-трекер з фокусом на швидкість, ясність та інтеграції.'
  const copyright = t(data?.settings.footer_copyright, lang) || 'Зроблено в Україні 🇺🇦'

  return (
    <>
      <footer className="footer">
        <div className="col-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 15 }}>
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'var(--accent)',
                color: 'white',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              B
            </span>
            BugTracker
          </div>
          <p>{brandText}</p>
        </div>
        <div>
          <h6>Продукт</h6>
          <ul>
            <li><a>Можливості</a></li>
            <li><a>Інтеграції</a></li>
            <li><a>Тарифи</a></li>
          </ul>
        </div>
        <div>
          <h6>Ресурси</h6>
          <ul>
            <li><a>Документація</a></li>
            <li><a>API</a></li>
            <li><a>Блог</a></li>
          </ul>
        </div>
        <div>
          <h6>Компанія</h6>
          <ul>
            <li><a>Про нас</a></li>
            <li><a>Контакти</a></li>
          </ul>
        </div>
        <div>
          <h6>Юридичне</h6>
          <ul>
            <li><a>Конфіденційність</a></li>
            <li><a>Умови</a></li>
          </ul>
        </div>
      </footer>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} BugTracker. Усі права застережено.</span>
        <span>{copyright}</span>
      </div>
    </>
  )
}
