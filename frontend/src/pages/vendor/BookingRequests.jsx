import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const STATUS_STYLE = {
  pending:   { background: 'rgba(251,188,5,0.12)',  color: '#fbbc05' },
  confirmed: { background: 'rgba(76,175,125,0.12)', color: '#4caf7d' },
  declined:  { background: 'rgba(220,80,80,0.12)',  color: 'rgba(220,80,80,0.9)' },
  tentative: { background: 'rgba(130,170,220,0.12)', color: 'rgba(130,170,220,0.9)' },
}

export default function BookingRequests() {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)

  const [bookings,        setBookings]        = useState([])
  const [loading,         setLoading]         = useState(true)
  const [fetchError,      setFetchError]      = useState(null)
  const [vendorListingId, setVendorListingId] = useState(null)
  const [vendorNote,      setVendorNote]      = useState({})
  const [updating,        setUpdating]        = useState(null)

  useEffect(() => {
    if (!user) return

    async function load() {
      setFetchError(null)

      // Step 1: find this vendor's listing
      const { data: listings, error: listingErr } = await supabase
        .from('vendor_listings')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)

      if (listingErr) {
        console.error('[BookingRequests] listing fetch error:', listingErr)
        setFetchError(`Listing error: ${listingErr.message}`)
        setLoading(false)
        return
      }
      if (!listings || listings.length === 0) {
        console.warn('[BookingRequests] no vendor listing found for user:', user.id)
        setFetchError('No vendor listing found for your account.')
        setLoading(false)
        return
      }

      const listingId = listings[0].id
      setVendorListingId(listingId)
      console.log('[BookingRequests] listing id:', listingId)

      // Step 2: fetch bookings for this listing
      const { data, error: bookingErr } = await supabase
        .from('bookings')
        .select('*, profiles(full_name), packages(name, price_label)')
        .eq('vendor_id', listingId)
        .order('booking_date', { ascending: true })

      if (bookingErr) {
        console.error('[BookingRequests] bookings fetch error:', bookingErr)
        setFetchError(`Bookings error: ${bookingErr.message}`)
        setLoading(false)
        return
      }

      console.log('[BookingRequests] bookings found:', data?.length ?? 0, data)
      setBookings(data || [])
      setLoading(false)
    }

    load()
  }, [user])

  async function respond(booking, status) {
    setUpdating(booking.id)
    const note = vendorNote[booking.id] || null

    const { error } = await supabase.from('bookings')
      .update({ status, vendor_note: note })
      .eq('id', booking.id)

    if (error) { show('Failed to update booking', 'error'); setUpdating(null); return }

    // When confirming: block the specific hours so they can't be double-booked
    if (status === 'confirmed' && vendorListingId && booking.booking_date) {
      if (booking.start_hour != null && booking.end_hour != null) {
        const rows = []
        for (let h = booking.start_hour; h < booking.end_hour; h++) {
          rows.push({ vendor_id: vendorListingId, date: booking.booking_date, start_hour: h, end_hour: h + 1, status: 'blocked' })
        }
        await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
      } else {
        const rows = []
        for (let h = 8; h <= 21; h++) {
          rows.push({ vendor_id: vendorListingId, date: booking.booking_date, start_hour: h, end_hour: h + 1, status: 'blocked' })
        }
        await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
      }
    }

    setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status, vendor_note: note } : b))
    show(status === 'confirmed' ? 'Booking confirmed! The date is now blocked.' : 'Booking declined.')
    setUpdating(null)
  }

  if (loading) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Loading…</p></main>
  if (fetchError) return (
    <main style={page}>
      <p style={{ color: '#e57373', background: 'rgba(229,115,115,0.1)', border: '1px solid rgba(229,115,115,0.3)', borderRadius: '8px', padding: '1rem 1.25rem', fontSize: '0.9rem' }}>
        {fetchError}
      </p>
    </main>
  )

  const pending    = bookings.filter(b => b.status === 'pending' && b.booking_date)
  const tentative  = bookings.filter(b => b.status === 'pending' && !b.booking_date)
  const resolved   = bookings.filter(b => b.status !== 'pending')

  return (
    <main style={page}>
      <h1 style={heading}>Booking Requests</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '0.5rem' }}>
        Review and respond to booking requests from customers.
      </p>
      {/* Pending */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={sectionHeading}>
          Pending <span style={{ background: 'rgba(251,188,5,0.15)', color: '#fbbc05', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px', marginLeft: '0.5rem', fontFamily: 'var(--font-body)' }}>{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <div style={emptyBox}><p style={{ color: 'var(--cream-muted)' }}>No pending requests. 🎉</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map(b => <BookingCard key={b.id} b={b} vendorNote={vendorNote} setVendorNote={setVendorNote} respond={respond} updating={updating} />)}
          </div>
        )}
      </section>

      {/* Tentative */}
      {tentative.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={sectionHeading}>
            Tentative <span style={{ background: 'rgba(130,170,220,0.15)', color: 'rgba(130,170,220,0.9)', fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '99px', marginLeft: '0.5rem', fontFamily: 'var(--font-body)' }}>{tentative.length}</span>
          </h2>
          <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>Customers interested but haven't decided on a date yet.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tentative.map(b => <BookingCard key={b.id} b={b} vendorNote={vendorNote} setVendorNote={setVendorNote} respond={respond} updating={updating} />)}
          </div>
        </section>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 style={sectionHeading}>Past Requests</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {resolved.map(b => <BookingCard key={b.id} b={b} vendorNote={vendorNote} setVendorNote={setVendorNote} respond={respond} updating={updating} resolved />)}
          </div>
        </section>
      )}
    </main>
  )
}

function BookingCard({ b, vendorNote, setVendorNote, respond, updating, resolved }) {
  const st        = STATUS_STYLE[b.status] || STATUS_STYLE.pending
  function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
  const dateLabel = b.booking_date
    ? new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null
  const timeLabel = b.start_hour != null && b.end_hour != null
    ? `${hourLabel(b.start_hour)} – ${hourLabel(b.end_hour)}`
    : null
  const customer  = b.profiles

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <div>
          <p style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 500 }}>{customer?.full_name || 'Customer'}</p>
          {customer?.email && <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', marginTop: '0.1rem' }}>{customer.email}</p>}
        </div>
        <span style={{ ...st, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0 }}>
          {b.status}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        {dateLabel ? <span style={meta}>📅 {dateLabel}</span> : <span style={{ ...meta, color: 'rgba(130,170,220,0.8)' }}>📅 Date not decided</span>}
        {timeLabel && <span style={meta}>🕐 {timeLabel}</span>}
        {b.packages && <span style={meta}>📦 {b.packages.name}{b.packages.price_label ? ` — ${b.packages.price_label}` : ''}</span>}
        {b.budget_range && <span style={meta}>💰 {b.budget_range}</span>}
      </div>

      {b.customer_note && (
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
          Customer note: "{b.customer_note}"
        </p>
      )}

      {!resolved && (
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>Your note to customer (optional)</label>
          <textarea
            rows={2}
            value={vendorNote[b.id] ?? b.vendor_note ?? ''}
            onChange={e => setVendorNote(prev => ({ ...prev, [b.id]: e.target.value }))}
            placeholder="e.g. Looking forward to working with you!"
            style={textarea}
          />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              onClick={() => respond(b, 'confirmed')}
              disabled={updating === b.id}
              style={{ padding: '0.6rem 1.3rem', background: 'rgba(76,175,125,0.2)', border: '1px solid rgba(76,175,125,0.4)', borderRadius: '8px', color: '#4caf7d', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.88rem' }}
            >
              {updating === b.id ? '…' : '✓ Confirm'}
            </button>
            <button
              onClick={() => respond(b, 'declined')}
              disabled={updating === b.id}
              style={{ padding: '0.6rem 1.3rem', background: 'rgba(220,80,80,0.12)', border: '1px solid rgba(220,80,80,0.3)', borderRadius: '8px', color: 'rgba(220,80,80,0.9)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}
            >
              {updating === b.id ? '…' : '✕ Decline'}
            </button>
          </div>
        </div>
      )}

      {resolved && b.vendor_note && (
        <p style={{ color: 'var(--gold)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
          Your note: "{b.vendor_note}"
        </p>
      )}
    </div>
  )
}

const page         = { maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }
const card         = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(200,150,60,0.12)' }
const emptyBox     = { background: 'var(--void-2)', borderRadius: '12px', padding: '2rem', textAlign: 'center', border: '1px solid rgba(200,150,60,0.12)' }
const heading      = { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }
const sectionHeading = { fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1rem' }
const meta         = { color: 'var(--cream-muted)', fontSize: '0.82rem' }
const labelStyle   = { display: 'block', fontSize: '0.73rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }
const textarea     = { width: '100%', padding: '0.65rem 0.9rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }
