import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

const links = [
  { to: '/admin',           label: 'Dashboard' },
  { to: '/admin/vendors',   label: 'Vendors' },
  { to: '/admin/customers', label: 'Customers' },
]

export function AdminNav() {
  const { signOut } = useAuthStore()
  const navigate    = useNavigate()
  const location    = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav
      role="navigation"
      aria-label="Admin navigation"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'rgba(11,9,6,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(200,150,60,0.15)',
      }}
    >
      <Link
        to="/admin"
        style={{
          fontFamily: 'var(--font-display)', fontSize: '1.35rem',
          color: 'var(--gold)', textDecoration: 'none', fontWeight: 400,
          letterSpacing: '0.04em',
        }}
      >
        WedMe <span style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: '0.3rem' }}>Admin</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {links.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              color: location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to))
                ? 'var(--cream)' : 'var(--cream-muted)',
              textDecoration: 'none', fontSize: '0.875rem',
              letterSpacing: '0.04em', transition: 'color 160ms',
            }}
          >
            {label}
          </Link>
        ))}
        <span style={{ color: 'rgba(200,150,60,0.2)' }}>|</span>
        <Link to="/" style={{ color: 'var(--cream-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
          Back to site
        </Link>
        <button
          onClick={handleSignOut}
          style={{
            background: 'none', border: '1px solid rgba(200,150,60,0.35)',
            borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-body)',
            fontSize: '0.82rem', padding: '0.3rem 0.75rem', cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </nav>
  )
}
