import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { supabase } from '../lib/supabase'
import { ADMIN_EMAIL } from '../lib/constants'

// ── Hamburger / Close SVGs ─────────────────────────────────────────────────────
function HamburgerIcon({ open }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <style>{`
        .ham-line { transition: transform 260ms cubic-bezier(.4,0,.2,1), opacity 200ms; transform-origin: center; }
      `}</style>
      {open ? (
        <>
          <line className="ham-line" x1="4"  y1="4"  x2="18" y2="18" />
          <line className="ham-line" x1="18" y1="4"  x2="4"  y2="18" />
        </>
      ) : (
        <>
          <line className="ham-line" x1="3" y1="6"  x2="19" y2="6"  />
          <line className="ham-line" x1="3" y1="11" x2="19" y2="11" />
          <line className="ham-line" x1="3" y1="16" x2="19" y2="16" />
        </>
      )}
    </svg>
  )
}

export function Nav() {
  const { user, role, signOut } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)
  const [pendingChats, setPendingChats] = useState(0)

  // Fetch pending chat count for vendors
  useEffect(() => {
    if (!user || role !== 'vendor') { setPendingChats(0); return }
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (!data) return
      supabase.from('chat_sessions').select('*', { count: 'exact', head: true }).eq('vendor_id', data.id).eq('needs_vendor', true)
        .then(({ count }) => setPendingChats(count || 0))
    })
  }, [user, role, location.pathname]) // refetch on route change

  // Close drawer on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  // Build nav links per role
  const links = !user ? [
    { to: '/vendors',  label: 'Discover' },
    { to: '/login',    label: 'Sign In' },
  ] : role === 'consumer' ? [
    { to: '/vendors',     label: 'Discover' },
    { to: '/shortlist',   label: 'Shortlist' },
    { to: '/my-bookings', label: 'My Bookings' },
    { to: '/dashboard',   label: 'Dashboard' },
  ] : [
    { to: '/vendor/dashboard',    label: 'Dashboard' },
    { to: '/vendor/bookings',     label: 'Bookings' },
    { to: '/vendor/chats',        label: 'Chats', badge: pendingChats },
    { to: '/vendor/profile/edit', label: 'My Profile' },
  ]

  return (
    <>
      <style>{`
        /* ── Desktop: show links, hide burger ── */
        .nav-desktop-links { display: flex; }
        .nav-burger         { display: none; }

        /* ── Mobile ≤ 768px ── */
        @media (max-width: 768px) {
          .nav-desktop-links { display: none !important; }
          .nav-burger         { display: flex !important; }
        }

        /* Drawer link hover */
        .drawer-link:hover  { color: var(--gold) !important; transform: translateX(6px); }
        .drawer-link:focus-visible { outline: 2px solid var(--gold); outline-offset: 4px; border-radius: 4px; }
        .nav-link-item:hover { color: var(--cream) !important; }
        .nav-link-item:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; border-radius: 4px; }
        .nav-cta:hover { opacity: 0.88; }

        @media (prefers-reduced-motion: reduce) {
          .drawer-link, .nav-drawer { transition: none !important; }
        }
      `}</style>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1.5rem',
          background: 'rgba(11,9,6,0.88)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(200,150,60,0.1)',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          aria-label="WedMe home"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.5rem',
            color: 'var(--gold)',
            textDecoration: 'none',
            fontWeight: 400,
            letterSpacing: '0.04em',
            flexShrink: 0,
          }}
        >
          WedMe
        </Link>

        {/* ── Desktop links ──────────────────────────────────── */}
        <ul
          className="nav-desktop-links"
          style={{ alignItems: 'center', gap: '1.5rem', listStyle: 'none', margin: 0, padding: 0 }}
        >
          {links.map(({ to, label, badge }) => (
            <li key={to} style={{ position: 'relative' }}>
              <Link
                to={to}
                className="nav-link-item"
                style={{
                  color: location.pathname === to ? 'var(--cream)' : 'var(--cream-muted)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  letterSpacing: '0.04em',
                  transition: 'color 160ms',
                }}
              >
                {label}
                {badge > 0 && <span style={{ marginLeft: '0.35rem', background: '#fbbc05', color: 'var(--void)', fontSize: '0.6rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '99px', verticalAlign: 'top' }}>{badge}</span>}
              </Link>
            </li>
          ))}

          {isAdmin && (
            <li>
              <Link to="/admin" className="nav-link-item"
                style={{ color: location.pathname.startsWith('/admin') ? 'var(--cream)' : 'var(--gold)', textDecoration: 'none', fontSize: '0.875rem', letterSpacing: '0.04em', fontWeight: 600 }}>
                Admin
              </Link>
            </li>
          )}

          {/* CTA / Auth action */}
          <li>
            {!user ? (
              <Link
                to="/register"
                className="nav-cta"
                style={{
                  background: 'var(--gold)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'var(--void)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  padding: '0.4rem 1.1rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'opacity 160ms',
                }}
              >
                Join Free
              </Link>
            ) : (
              <button
                onClick={handleSignOut}
                style={{
                  background: 'none',
                  border: '1px solid rgba(200,150,60,0.35)',
                  borderRadius: '6px',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  padding: '0.35rem 0.9rem',
                  cursor: 'pointer',
                  transition: 'border-color 160ms',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,150,60,0.7)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,150,60,0.35)'}
              >
                Sign Out
              </button>
            )}
          </li>
        </ul>

        {/* ── Hamburger (mobile only) ────────────────────────── */}
        <button
          className="nav-burger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          style={{
            background: 'transparent',
            border: '1px solid rgba(200,150,60,0.28)',
            borderRadius: '8px',
            color: 'var(--gold)',
            cursor: 'pointer',
            padding: '0.45rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '44px',
            minHeight: '44px',
            outline: 'none',
          }}
        >
          <HamburgerIcon open={open} />
        </button>
      </nav>

      {/* ── Mobile drawer overlay ──────────────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 48,
          background: 'rgba(11,9,6,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 260ms ease',
        }}
      />

      {/* Drawer panel */}
      <div
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="nav-drawer"
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: 'min(320px, 85vw)',
          zIndex: 49,
          background: 'var(--void-2)',
          borderLeft: '1px solid rgba(200,150,60,0.15)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 280ms cubic-bezier(.4,0,.2,1)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <Link
            to="/"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--gold)', textDecoration: 'none' }}
          >
            WedMe
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'transparent',
              border: '1px solid rgba(200,150,60,0.25)',
              borderRadius: '8px',
              color: 'var(--cream-muted)',
              cursor: 'pointer',
              padding: '0.45rem',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              outline: 'none',
            }}
          >
            <HamburgerIcon open={true} />
          </button>
        </div>

        {/* Drawer nav links */}
        <nav aria-label="Mobile navigation">
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {links.map(({ to, label, badge }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="drawer-link"
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.75rem',
                    fontWeight: 400,
                    color: location.pathname === to ? 'var(--gold)' : 'var(--cream)',
                    textDecoration: 'none',
                    padding: '0.6rem 0',
                    borderBottom: '1px solid rgba(200,150,60,0.07)',
                    transition: 'color 160ms, transform 160ms',
                  }}
                >
                  {label}
                  {badge > 0 && <span style={{ marginLeft: '0.5rem', background: '#fbbc05', color: 'var(--void)', fontSize: '0.75rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '99px', verticalAlign: 'middle' }}>{badge}</span>}
                </Link>
              </li>
            ))}
            {isAdmin && (
              <li>
                <Link to="/admin" className="drawer-link"
                  style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 400, color: 'var(--gold)', textDecoration: 'none', padding: '0.6rem 0', borderBottom: '1px solid rgba(200,150,60,0.07)' }}>
                  Admin
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom section */}
        <div style={{ borderTop: '1px solid rgba(200,150,60,0.1)', paddingTop: '1.5rem' }}>
          {!user ? (
            <Link
              to="/register"
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.85rem',
                background: 'var(--gold)',
                borderRadius: '10px',
                color: 'var(--void)',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.95rem',
                letterSpacing: '0.04em',
              }}
            >
              Join Free
            </Link>
          ) : (
            <div>
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
                Signed in as {user.user_metadata?.full_name || user.email}
              </p>
              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'transparent',
                  border: '1px solid rgba(200,150,60,0.3)',
                  borderRadius: '10px',
                  color: 'var(--gold)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
