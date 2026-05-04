import { NavLink, Outlet } from 'react-router-dom'
import { Ic } from '../../icons/Ic'

const SECTIONS = [
  { to: '/admin/landing', label: 'Hero', icon: Ic.Star, end: true },
  { to: '/admin/landing/settings', label: 'Налаштування', icon: Ic.Settings },
]

const ITEMS = [
  { to: '/admin/landing/features', label: 'Можливості', icon: Ic.Spark },
  { to: '/admin/landing/use-cases', label: 'Для кого', icon: Ic.Users },
  { to: '/admin/landing/integrations', label: 'Інтеграції', icon: Ic.Link },
  { to: '/admin/landing/metrics', label: 'Метрики', icon: Ic.Chart },
  { to: '/admin/landing/testimonials', label: 'Відгуки', icon: Ic.Comment },
  { to: '/admin/landing/faq', label: 'FAQ', icon: Ic.Help },
]

const SYSTEM = [
  { to: '/admin/landing/changelog', label: 'Журнал змін', icon: Ic.Activity },
]

/**
 * Лейаут адмін-панелі лендінгу: лівий sidebar зі секціями + контент справа.
 * RequireStaff робиться у App.tsx.
 */
export function AdminLandingLayout() {
  return (
    <div className="admin-panel">
      <aside className="admin-aside">
        <h3>Загальне</h3>
        {SECTIONS.map(s => (
          <NavLink
            key={s.to}
            to={s.to}
            end={s.end}
            className={({ isActive }) => `item ${isActive ? 'active' : ''}`}
          >
            <s.icon sz={14} />
            <span>{s.label}</span>
          </NavLink>
        ))}

        <h3>Секції лендінгу</h3>
        {ITEMS.map(s => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) => `item ${isActive ? 'active' : ''}`}
          >
            <s.icon sz={14} />
            <span>{s.label}</span>
          </NavLink>
        ))}

        <h3>Система</h3>
        {SYSTEM.map(s => (
          <NavLink
            key={s.to}
            to={s.to}
            className={({ isActive }) => `item ${isActive ? 'active' : ''}`}
          >
            <s.icon sz={14} />
            <span>{s.label}</span>
          </NavLink>
        ))}

        <h3>Перегляд</h3>
        <NavLink to="/" className="item" target="_blank" rel="noopener noreferrer">
          <Ic.Eye sz={14} />
          <span>Переглянути лендінг</span>
        </NavLink>
      </aside>

      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  )
}
