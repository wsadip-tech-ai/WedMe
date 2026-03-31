import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const STATUS_STYLE = {
  pending:   { background: 'rgba(251,188,5,0.12)',  color: '#fbbc05' },
  confirmed: { background: 'rgba(76,175,125,0.12)', color: '#4caf7d' },
  declined:  { background: 'rgba(220,80,80,0.12)',  color: 'rgba(220,80,80,0.9)' },
}

export default function MyBookings() {
  const { user }  = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('bookings')
      .select('*, vendor_listings(name, category, city), packages(name, price_label)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setBookings(data || []); setLoading(false) })
  }, [user])

  if (loading) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Loading…</p></main>

  return (
    <main style={page}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
        My Bookings
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Track your booking requests and confirmations.</p>

      {bookings.length === 0 ? (
        <div style={emptyBox}>
          <p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📅</p>
          <p style={{ color: 'var(--cream-muted)', marginBottom: '1.5rem' }}>No bookings yet.</p>
          <Link to="/vendors" style={goldLink}>Browse Vendors →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(b => {
            const v   = b.vendor_listings
            const pkg = b.packages
            const st  = STATUS_STYLE[b.status] || STATUS_STYLE.pending
            function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
            const dateLabel = b.booking_date
              ? new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
              : null
            const timeLabel = b.start_hour != null && b.end_hour != null
              ? `${hourLabel(b.start_hour)} – ${hourLabel(b.end_hour)}`
              : null
            return (
              <div key={b.id} style={bookingCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <Link to={`/vendors/${b.vendor_id}`} style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)', textDecoration: 'none' }}>
                      {v?.name || 'Vendor'}
                    </Link>
                    <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                      {v?.category} · {v?.city}
                    </p>
                  </div>
                  <span style={{ ...st, fontSize: '0.72rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
                    {b.status}
                  </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {dateLabel ? <span style={meta}>📅 {dateLabel}</span> : <span style={{ ...meta, fontStyle: 'italic' }}>📅 Date not decided yet</span>}
                  {timeLabel && <span style={meta}>🕐 {timeLabel}</span>}
                  {pkg && <span style={meta}>📦 {pkg.name}{pkg.price_label ? ` — ${pkg.price_label}` : ''}</span>}
                  {b.budget_range && <span style={meta}>💰 {b.budget_range}</span>}
                </div>

                {b.customer_note && (
                  <p style={{ marginTop: '0.75rem', color: 'var(--cream-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Your note: "{b.customer_note}"
                  </p>
                )}
                {b.vendor_note && (
                  <p style={{ marginTop: '0.5rem', color: 'var(--gold)', fontSize: '0.85rem' }}>
                    Vendor's note: "{b.vendor_note}"
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

const page       = { maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }
const bookingCard = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(200,150,60,0.12)' }
const emptyBox   = { background: 'var(--void-2)', borderRadius: '12px', padding: '3rem', textAlign: 'center', border: '1px solid rgba(200,150,60,0.12)' }
const goldLink   = { color: 'var(--gold)', textDecoration: 'none', fontSize: '0.9rem', borderBottom: '1px solid rgba(200,150,60,0.4)', paddingBottom: '0.1rem' }
const meta       = { color: 'var(--cream-muted)', fontSize: '0.82rem' }
