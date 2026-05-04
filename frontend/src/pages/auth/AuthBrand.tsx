import { Link } from 'react-router-dom'

/**
 * Логотип у верхньому лівому куті auth-форми. Клік — повернення на лендінг.
 */
export function AuthBrand() {
  return (
    <Link to="/" className="brand" style={{ textDecoration: 'none', color: 'inherit' }}>
      <span className="mark">B</span> BugTracker
    </Link>
  )
}
