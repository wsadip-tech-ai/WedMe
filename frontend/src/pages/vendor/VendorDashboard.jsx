import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
const DASH_STYLE = `
  .dash-quicklinks { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 0.75rem; margin-bottom: 2.5rem; }
  .dash-stats      { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 1rem; margin-bottom: 2rem; }
  @media (max-width: 480px) {
    .dash-quicklinks { grid-template-columns: repeat(2,1fr); }
    .dash-stats      { grid-template-columns: repeat(2,1fr); }
  }
  .quick-link { min-height: 44px; display: flex; align-items: center; justify-content: center; }
  .quick-link:hover { opacity: 0.85; }
`

export default function VendorDashboard() {
  const { user } = useAuthStore()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enquiries, setEnquiries] = useState([])
  const [shortlistCount, setShortlistCount] = useState(0)
  const [pendingBookings, setPendingBookings] = useState(0)
  const [recentBookings, setRecentBookings] = useState([])
  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('*').eq('owner_id', user.id).maybeSingle().then(async ({ data }) => {
      setListing(data)
      if (data) {
        const [{ data: recent }, { count: sCount }, { count: bCount }, { data: recentB }] = await Promise.all([
          supabase.from('enquiries').select('*, profiles(full_name)').eq('vendor_id', data.id).order('created_at', { ascending: false }).limit(3),
          supabase.from('shortlists').select('*', { count: 'exact', head: true }).eq('vendor_id', data.id),
          supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('vendor_id', data.id).eq('status', 'pending'),
          supabase.from('bookings').select('*, profiles(full_name), packages(name, price_label)').eq('vendor_id', data.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(3),
        ])
        setEnquiries(recent || []); setShortlistCount(sCount || 0)
        setPendingBookings(bCount || 0); setRecentBookings(recentB || [])
      }
      setLoading(false)
    })
  }, [user])
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const card = { background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.15)', borderRadius: '12px', padding: '1.5rem' }
  const quickLink = (primary) => ({
    padding: '0.65rem 1rem', textAlign: 'center', textDecoration: 'none',
    borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-body)',
    background: primary ? 'var(--gold)' : 'transparent',
    border: primary ? 'none' : '1px solid rgba(200,150,60,0.4)',
    color: primary ? 'var(--void)' : 'var(--gold)',
    fontWeight: primary ? 600 : 400,
  })
  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!listing) return (<main style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}><p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎪</p><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Complete your profile</h1><p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Set up your vendor listing so couples can discover you.</p><Link to="/vendor/onboarding" style={{ padding: '0.85rem 2rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Set Up Profile →</Link></main>)
  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <style>{DASH_STYLE}</style>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem,5vw,2.4rem)', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Hello, {name}</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>{listing.name} — {listing.city}</p>
      <div className="dash-stats">
        <div style={card}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>{pendingBookings}</div><div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>Pending bookings</div></div>
        <div style={card}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>{enquiries.filter(e=>e.status==='pending').length}</div><div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>Pending enquiries</div></div>
        <div style={card}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>{shortlistCount}</div><div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>Times shortlisted</div></div>
        <div style={card}><div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem', textTransform: 'capitalize' }}>{listing.tier}</div><div style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>Service tier</div></div>
      </div>
      <div className="dash-quicklinks">
        <Link to="/vendor/bookings"     className="quick-link" style={quickLink(true)}>Booking Requests</Link>
        <Link to="/vendor/portfolio"    className="quick-link" style={quickLink(false)}>Portfolio</Link>
        <Link to="/vendor/packages"     className="quick-link" style={quickLink(false)}>Packages</Link>
        <Link to="/vendor/availability" className="quick-link" style={quickLink(false)}>Availability</Link>
        <Link to="/vendor/profile/edit" className="quick-link" style={quickLink(false)}>Edit Profile</Link>
        <Link to="/vendor/enquiries"    className="quick-link" style={quickLink(false)}>Enquiries</Link>
        <Link to="/vendor/chats" className="quick-link" style={quickLink(false)}>AI Chats</Link>
      </div>
      {recentBookings.length > 0 && (<div style={{ ...card, marginBottom: '1.5rem' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '1rem' }}>Pending Booking Requests</h2>{recentBookings.map((b) => (<div key={b.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid rgba(200,150,60,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}><div><p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{b.profiles?.full_name || 'Customer'}</p><p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>
  {b.booking_date
    ? `📅 ${new Date(b.booking_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : '📅 Date TBD'
  }
  {b.start_hour != null && b.end_hour != null && ` · 🕐 ${b.start_hour > 12 ? b.start_hour - 12 : b.start_hour}${b.start_hour >= 12 ? 'PM' : 'AM'}–${b.end_hour > 12 ? b.end_hour - 12 : b.end_hour}${b.end_hour >= 12 ? 'PM' : 'AM'}`}
  {b.packages ? ` · 📦 ${b.packages.name}` : ''}
</p></div><span style={{ background: 'rgba(251,188,5,0.15)', color: '#fbbc05', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', flexShrink: 0 }}>pending</span></div>))}{pendingBookings > 3 && <Link to="/vendor/bookings" style={{ display: 'block', textAlign: 'center', color: 'var(--gold)', fontSize: '0.82rem', marginTop: '0.75rem', textDecoration: 'none' }}>View all {pendingBookings} requests →</Link>}</div>)}
      {enquiries.length > 0 && (<div style={card}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '1rem' }}>Recent Enquiries</h2>{enquiries.map((e) => (<div key={e.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid rgba(200,150,60,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}><div><p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{e.profiles?.full_name || 'Anonymous'}</p><p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '380px' }}>{e.message}</p></div><span style={{ background: e.status === 'pending' ? 'rgba(251,188,5,0.15)' : 'rgba(76,175,125,0.15)', color: e.status === 'pending' ? '#fbbc05' : 'var(--success)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', flexShrink: 0 }}>{e.status}</span></div>))}</div>)}
    </main>
  )
}
