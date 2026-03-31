import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS = ['profile', 'bookings', 'shortlists', 'enquiries']

const BOOKING_STATUS_BADGE = {
  pending:   { background: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  confirmed: { background: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  declined:  { background: 'rgba(220,53,69,0.15)', color: '#dc3545' },
  cancelled: { background: 'rgba(220,80,80,0.12)', color: 'rgba(220,80,80,0.9)' },
  completed: { background: 'rgba(76,175,125,0.1)', color: '#4caf7d' },
}

const ENQUIRY_STATUS_BADGE = {
  pending:   { background: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  replied:   { background: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  closed:    { background: 'rgba(180,180,180,0.12)', color: 'rgba(200,200,200,0.7)' },
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const card = {
  background: 'var(--void-2)',
  borderRadius: '12px',
  border: '1px solid rgba(200,150,60,0.12)',
  padding: '1.25rem',
}

const inputStyle = {
  background: 'var(--void-3)',
  border: '1px solid rgba(200,150,60,0.2)',
  borderRadius: '8px',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
  padding: '0.7rem 1rem',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  color: 'var(--cream-muted)',
  fontSize: '0.78rem',
  fontFamily: 'var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

const readOnlyValueStyle = {
  color: 'var(--cream)',
  fontSize: '0.9rem',
  fontFamily: 'var(--font-body)',
  padding: '0.7rem 0',
  textTransform: 'capitalize',
}

function StatusBadge({ status, map }) {
  const s = (map || {})[status] || { background: 'rgba(200,150,60,0.1)', color: 'var(--cream-muted)' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.7rem',
      borderRadius: '6px',
      fontSize: '0.78rem',
      fontWeight: 600,
      textTransform: 'capitalize',
      background: s.background,
      color: s.color,
    }}>
      {status || 'unknown'}
    </span>
  )
}

function EmptyState({ message }) {
  return (
    <p style={{ color: 'var(--cream-muted)', fontSize: '0.875rem', padding: '2rem 0', textAlign: 'center' }}>
      {message}
    </p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [customer, setCustomer] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Profile tab
  const [fullName, setFullName] = useState('')

  // Bookings tab
  const [bookings, setBookings] = useState(null)

  // Shortlists tab
  const [shortlists, setShortlists] = useState(null)

  // Enquiries tab
  const [enquiries, setEnquiries] = useState(null)

  // ── Fetch customer ────────────────────────────────────────────────────────

  async function fetchCustomer() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      addToast('Failed to load customer', 'error')
      navigate('/admin/customers')
      return
    }

    setCustomer(data)
    setFullName(data.full_name || '')
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Lazy tab data ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'bookings' && bookings === null) fetchBookings()
    if (activeTab === 'shortlists' && shortlists === null) fetchShortlists()
    if (activeTab === 'enquiries' && enquiries === null) fetchEnquiries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function fetchBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, vendor_listings(name, category, city), packages(name, price_label)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })

    if (error) addToast('Failed to load bookings', 'error')
    else setBookings(data || [])
  }

  async function fetchShortlists() {
    const { data, error } = await supabase
      .from('shortlists')
      .select('*, vendor_listings(name, category, city)')
      .eq('user_id', id)

    if (error) addToast('Failed to load shortlists', 'error')
    else setShortlists(data || [])
  }

  async function fetchEnquiries() {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*, vendor_listings(name)')
      .eq('from_user_id', id)
      .order('created_at', { ascending: false })

    if (error) addToast('Failed to load enquiries', 'error')
    else setEnquiries(data || [])
  }

  // ── Profile save ──────────────────────────────────────────────────────────

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', id)

    if (error) {
      addToast('Save failed', 'error')
    } else {
      addToast('Profile saved', 'success')
      setEditing(false)
      fetchCustomer()
    }
    setSaving(false)
  }

  // ── Delete customer ───────────────────────────────────────────────────────

  async function handleDelete() {
    const confirmed = window.confirm(
      'This will permanently delete this customer and all their bookings, shortlists, and enquiries.'
    )
    if (!confirmed) return

    const { error } = await supabase.from('profiles').delete().eq('id', id)

    if (error) {
      addToast('Delete failed', 'error')
    } else {
      addToast('Customer deleted', 'success')
      navigate('/admin/customers')
    }
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
        Loading…
      </main>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const joinedDate = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—'

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Back link ── */}
      <Link
        to="/admin/customers"
        style={{
          display: 'inline-block',
          color: 'var(--cream-muted)',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-body)',
          textDecoration: 'none',
          marginBottom: '1.75rem',
          letterSpacing: '0.02em',
        }}
      >
        ← Back to Customers
      </Link>

      {/* ── Header card ── */}
      <div style={{ ...card, marginBottom: '1.75rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          {/* Name + meta */}
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem,4vw,2rem)',
              fontWeight: 400,
              color: 'var(--cream)',
              margin: 0,
              marginBottom: '0.4rem',
            }}>
              {customer.full_name || 'Unnamed Customer'}
            </h1>
            <p style={{
              color: 'var(--cream-muted)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              margin: 0,
              marginBottom: '0.1rem',
              textTransform: 'capitalize',
            }}>
              {customer.role || 'consumer'}
            </p>
            <p style={{
              color: 'var(--cream-muted)',
              fontSize: '0.82rem',
              fontFamily: 'var(--font-body)',
              margin: 0,
            }}>
              Joined {joinedDate}
            </p>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveTab('profile')
                setEditing((prev) => !prev)
              }}
              style={btnStyle('var(--gold)')}
            >
              {editing ? 'Cancel Edit' : 'Edit'}
            </button>
            <button
              onClick={handleDelete}
              style={btnStyle('rgba(220,80,80,0.9)', true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid rgba(200,150,60,0.15)',
        marginBottom: '1.75rem',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                color: isActive ? 'var(--gold)' : 'var(--cream-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                padding: '0.6rem 1.1rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave}>
          <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
            <h2 style={sectionHeading}>Profile Details</h2>

            {/* Full name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              {editing ? (
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={inputStyle}
                  autoFocus
                />
              ) : (
                <p style={readOnlyValueStyle}>{customer.full_name || '—'}</p>
              )}
            </div>

            {/* Role (read-only) */}
            <div>
              <label style={labelStyle}>Role</label>
              <p style={readOnlyValueStyle}>{customer.role || '—'}</p>
            </div>

            {/* Joined date (read-only) */}
            <div>
              <label style={labelStyle}>Joined</label>
              <p style={{ ...readOnlyValueStyle, textTransform: 'none' }}>{joinedDate}</p>
            </div>

            {editing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={primaryBtn}
                >
                  {saving ? 'Saving…' : 'Save Profile'}
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div style={card}>
          <h2 style={sectionHeading}>Bookings</h2>
          {bookings === null ? (
            <EmptyState message="Loading bookings…" />
          ) : bookings.length === 0 ? (
            <EmptyState message="No bookings yet." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--cream)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(200,150,60,0.15)' }}>
                    {['Vendor', 'Date', 'Time', 'Status', 'Package', 'Budget'].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const dateStr = b.event_date
                      ? new Date(b.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Date TBD'
                    const timeStr = (b.start_hour != null && b.end_hour != null)
                      ? `${formatHour(b.start_hour)} – ${formatHour(b.end_hour)}`
                      : null

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(200,150,60,0.06)' }}>
                        <td style={tdStyle}>
                          <Link
                            to={`/admin/vendors/${b.vendor_id}`}
                            style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {b.vendor_listings?.name || 'Unknown Vendor'}
                          </Link>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)' }}>{dateStr}</td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)', whiteSpace: 'nowrap' }}>
                          {timeStr || '—'}
                        </td>
                        <td style={tdStyle}>
                          <StatusBadge status={b.status} map={BOOKING_STATUS_BADGE} />
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)' }}>
                          {b.packages
                            ? `${b.packages.name}${b.packages.price_label ? ` · ${b.packages.price_label}` : ''}`
                            : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)', whiteSpace: 'nowrap' }}>
                          {b.budget_range || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Shortlists tab */}
      {activeTab === 'shortlists' && (
        <div style={card}>
          <h2 style={sectionHeading}>Shortlisted Vendors</h2>
          {shortlists === null ? (
            <EmptyState message="Loading shortlists…" />
          ) : shortlists.length === 0 ? (
            <EmptyState message="No vendors shortlisted yet." />
          ) : (
            <div style={{ display: 'grid', gap: '0' }}>
              {shortlists.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.85rem 0',
                    borderBottom: i < shortlists.length - 1 ? '1px solid rgba(200,150,60,0.08)' : 'none',
                  }}
                >
                  <Link
                    to={`/admin/vendors/${s.vendor_id}`}
                    style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                  >
                    {s.vendor_listings?.name || 'Unknown Vendor'}
                  </Link>
                  <span style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                    {[s.vendor_listings?.category, s.vendor_listings?.city].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enquiries tab */}
      {activeTab === 'enquiries' && (
        <div style={card}>
          <h2 style={sectionHeading}>Enquiries</h2>
          {enquiries === null ? (
            <EmptyState message="Loading enquiries…" />
          ) : enquiries.length === 0 ? (
            <EmptyState message="No enquiries sent yet." />
          ) : (
            <div style={{ display: 'grid', gap: '0' }}>
              {enquiries.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem 0',
                    borderBottom: i < enquiries.length - 1 ? '1px solid rgba(200,150,60,0.08)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--cream)', fontWeight: 500, fontSize: '0.9rem' }}>
                        {e.vendor_listings?.name || 'Unknown Vendor'}
                      </span>
                      <StatusBadge status={e.status} map={ENQUIRY_STATUS_BADGE} />
                    </div>
                    {e.message && (
                      <p style={{
                        color: 'var(--cream-muted)',
                        fontSize: '0.85rem',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {e.message}
                      </p>
                    )}
                  </div>
                  <span style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  )
}

// ─── Style constants (outside component to avoid re-creation) ─────────────────

const sectionHeading = {
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: '1.2rem',
  color: 'var(--cream)',
  margin: 0,
  marginBottom: '1.25rem',
}

const primaryBtn = {
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '8px',
  color: 'var(--void)',
  padding: '0.65rem 1.5rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  letterSpacing: '0.02em',
}

const thStyle = {
  textAlign: 'left',
  padding: '0.65rem 0.85rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  color: 'var(--cream-muted)',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.75rem 0.85rem',
  color: 'var(--cream)',
}

function btnStyle(color, isDanger = false) {
  return {
    background: isDanger ? 'rgba(220,80,80,0.1)' : 'rgba(200,150,60,0.12)',
    border: isDanger ? '1px solid rgba(220,80,80,0.4)' : '1px solid rgba(200,150,60,0.25)',
    borderRadius: '8px',
    color: color,
    padding: '0.45rem 1rem',
    fontSize: '0.82rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  }
}

function formatHour(h) {
  if (h == null) return null
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:00 ${period}`
}
