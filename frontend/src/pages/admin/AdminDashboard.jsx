import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const DASH_STYLE = `
  .admin-stats   { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap: 1rem; margin-bottom: 2.5rem; }
  .admin-activity { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
  @media (max-width: 640px) {
    .admin-stats    { grid-template-columns: repeat(2,1fr); }
    .admin-activity { grid-template-columns: 1fr; }
  }
`

const card = {
  background: 'var(--void-2)',
  borderRadius: '12px',
  border: '1px solid rgba(200,150,60,0.12)',
  padding: '1.25rem',
}

function statusBadge(status) {
  const map = {
    pending:   { bg: 'rgba(251,188,5,0.15)',   color: '#fbbc05' },
    confirmed: { bg: 'rgba(76,175,125,0.15)',  color: '#4caf7d' },
    declined:  { bg: 'rgba(220,53,69,0.15)',   color: '#dc3545' },
  }
  const s = map[status] || { bg: 'rgba(200,150,60,0.1)', color: 'var(--cream-muted)' }
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontSize: '0.7rem', padding: '0.2rem 0.5rem',
      borderRadius: '4px', flexShrink: 0, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  )
}

function ActivityRow({ name, vendor, status, date }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      gap: '0.75rem', padding: '0.75rem 0',
      borderBottom: '1px solid rgba(200,150,60,0.08)',
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: 'var(--cream)', fontSize: '0.875rem', marginBottom: '0.15rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {name || 'Unknown'}
        </p>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {vendor || '—'} · {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        </p>
      </div>
      {statusBadge(status)}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVendors: null,
    unverifiedVendors: null,
    totalCustomers: null,
    totalBookings: null,
    pendingBookings: null,
    totalEnquiries: null,
    pendingEnquiries: null,
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [recentEnquiries, setRecentEnquiries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [
        { count: totalVendors },
        { count: unverifiedVendors },
        { count: totalCustomers },
        { count: totalBookings },
        { count: pendingBookings },
        { count: totalEnquiries },
        { count: pendingEnquiries },
        { data: bookings },
        { data: enquiries },
      ] = await Promise.all([
        supabase.from('vendor_listings').select('*', { count: 'exact', head: true }),
        supabase.from('vendor_listings').select('*', { count: 'exact', head: true }).eq('status', 'unverified'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'consumer'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }),
        supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*, profiles(full_name), vendor_listings(name)').order('created_at', { ascending: false }).limit(5),
        supabase.from('enquiries').select('*, profiles(full_name), vendor_listings(name)').order('created_at', { ascending: false }).limit(5),
      ])

      setStats({ totalVendors, unverifiedVendors, totalCustomers, totalBookings, pendingBookings, totalEnquiries, pendingEnquiries })
      setRecentBookings(bookings || [])
      setRecentEnquiries(enquiries || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
        Loading…
      </main>
    )
  }

  return (
    <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <style>{DASH_STYLE}</style>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.8rem,5vw,2.4rem)',
        fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem',
      }}>
        Admin Dashboard
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem', fontFamily: 'var(--font-body)' }}>
        Platform overview
      </p>

      {/* Stats grid */}
      <div className="admin-stats">
        {/* Total Vendors */}
        <Link to="/admin/vendors" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>
              {stats.totalVendors ?? '—'}
            </div>
            <div style={{ color: 'var(--cream)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>
              Total Vendors
            </div>
            {stats.unverifiedVendors > 0 && (
              <div style={{ color: '#fbbc05', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
                {stats.unverifiedVendors} unverified
              </div>
            )}
          </div>
        </Link>

        {/* Total Customers */}
        <Link to="/admin/customers" style={{ textDecoration: 'none' }}>
          <div style={{ ...card, cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>
              {stats.totalCustomers ?? '—'}
            </div>
            <div style={{ color: 'var(--cream)', fontSize: '0.875rem', fontFamily: 'var(--font-body)' }}>
              Total Customers
            </div>
          </div>
        </Link>

        {/* Total Bookings */}
        <div style={card}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>
            {stats.totalBookings ?? '—'}
          </div>
          <div style={{ color: 'var(--cream)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>
            Total Bookings
          </div>
          {stats.pendingBookings > 0 && (
            <div style={{ color: '#fbbc05', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
              {stats.pendingBookings} pending
            </div>
          )}
        </div>

        {/* Total Enquiries */}
        <div style={card}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>
            {stats.totalEnquiries ?? '—'}
          </div>
          <div style={{ color: 'var(--cream)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginBottom: '0.25rem' }}>
            Total Enquiries
          </div>
          {stats.pendingEnquiries > 0 && (
            <div style={{ color: '#fbbc05', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
              {stats.pendingEnquiries} pending
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="admin-activity">
        {/* Recent Bookings */}
        <div style={card}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.2rem',
            color: 'var(--cream)', fontWeight: 400, marginBottom: '0.75rem',
          }}>
            Recent Bookings
          </h2>
          {recentBookings.length === 0 ? (
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>No bookings yet.</p>
          ) : (
            recentBookings.map((b) => (
              <ActivityRow
                key={b.id}
                name={b.profiles?.full_name}
                vendor={b.vendor_listings?.name}
                status={b.status}
                date={b.created_at}
              />
            ))
          )}
        </div>

        {/* Recent Enquiries */}
        <div style={card}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.2rem',
            color: 'var(--cream)', fontWeight: 400, marginBottom: '0.75rem',
          }}>
            Recent Enquiries
          </h2>
          {recentEnquiries.length === 0 ? (
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>No enquiries yet.</p>
          ) : (
            recentEnquiries.map((e) => (
              <ActivityRow
                key={e.id}
                name={e.profiles?.full_name}
                vendor={e.vendor_listings?.name}
                status={e.status}
                date={e.created_at}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
