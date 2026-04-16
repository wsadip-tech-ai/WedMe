import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const STATUS_STYLE = {
  pending:   { bg: 'rgba(251,188,5,0.12)',  color: '#fbbc05' },
  confirmed: { bg: 'rgba(76,175,125,0.12)', color: '#4caf7d' },
  declined:  { bg: 'rgba(220,80,80,0.12)',  color: 'rgba(220,80,80,0.9)' },
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const onboarding = JSON.parse(localStorage.getItem('wedme_onboarding') || '{}')
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'

  const [shortlistCount, setShortlistCount] = useState(0)
  const [bookings,       setBookings]       = useState([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('shortlists').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('bookings')
        .select('id, status, booking_date, vendor_listings(name, category), packages(name)')
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: true })
        .limit(3),
    ]).then(([{ count }, { data: bks }]) => {
      setShortlistCount(count || 0)
      setBookings(bks || [])
      setLoading(false)
    })
  }, [user])

  const pendingCount   = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length

  const card = { background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.15)', borderRadius: '12px', padding: '1.5rem' }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <style>{`
        .dash-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 2rem; }
        .dash-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        @media (max-width: 520px) {
          .dash-stats { grid-template-columns: repeat(2,1fr); }
          .dash-actions a { flex: 1; text-align: center; }
        }
      `}</style>

      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,2.5rem)', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
        Welcome back, {name}
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Your wedding planning hub</p>

      {/* Wedding details if onboarded */}
      {onboarding.date && (
        <div style={{ ...card, marginBottom: '1.5rem', borderColor: 'rgba(200,150,60,0.3)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Your Wedding</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.88rem', color: 'var(--cream-muted)' }}>
            {onboarding.date   && <span>📅 {new Date(onboarding.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
            {onboarding.city   && <span>📍 {onboarding.city}</span>}
            {onboarding.budget && <span>Budget: {onboarding.budget}</span>}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="dash-stats">
        <div style={card}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: 'var(--gold)', lineHeight: 1 }}>{shortlistCount}</div>
          <div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginTop: '0.3rem' }}>Shortlisted</div>
        </div>
        <div style={card}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#fbbc05', lineHeight: 1 }}>{pendingCount}</div>
          <div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginTop: '0.3rem' }}>Bookings pending</div>
        </div>
        <div style={card}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#4caf7d', lineHeight: 1 }}>{confirmedCount}</div>
          <div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginTop: '0.3rem' }}>Confirmed</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="dash-actions" style={{ marginBottom: '2.5rem' }}>
        <Link to="/vendors"     style={ctaBtn}>Find Vendors</Link>
        <Link to="/my-bookings" style={ghostBtn}>My Bookings</Link>
        <Link to="/shortlist"   style={ghostBtn}>Shortlist ({shortlistCount})</Link>
      </div>

      {/* Recent bookings */}
      {!loading && bookings.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)' }}>Recent Bookings</h2>
            <Link to="/my-bookings" style={{ color: 'var(--gold)', fontSize: '0.8rem', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {bookings.map((b, idx) => {
              const st      = STATUS_STYLE[b.status] || STATUS_STYLE.pending
              const dateStr = new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '0.85rem 0', borderBottom: idx < bookings.length - 1 ? '1px solid rgba(200,150,60,0.07)' : 'none' }}>
                  <div>
                    <p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{b.vendor_listings?.name}</p>
                    <p style={{ color: 'var(--cream-muted)', fontSize: '0.75rem' }}>{dateStr}{b.packages ? ` · ${b.packages.name}` : ''}</p>
                  </div>
                  <span style={{ background: st.bg, color: st.color, fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    {b.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

const ctaBtn  = { padding: '0.75rem 1.5rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', minHeight: '44px', display: 'flex', alignItems: 'center' }
const ghostBtn = { padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.9rem', minHeight: '44px', display: 'flex', alignItems: 'center' }
