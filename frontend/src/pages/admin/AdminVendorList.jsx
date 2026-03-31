import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

const CATEGORIES = ['All', 'photography', 'makeup', 'catering', 'decor', 'music', 'mehendi', 'pandit', 'venue']
const STATUSES = ['All', 'unverified', 'verified', 'suspended']

const STATUS_BADGE = {
  unverified: {
    background: 'rgba(251,188,5,0.15)',
    color: '#fbbc05',
  },
  verified: {
    background: 'rgba(76,175,125,0.15)',
    color: '#4caf7d',
  },
  suspended: {
    background: 'rgba(220,80,80,0.12)',
    color: 'rgba(220,80,80,0.9)',
  },
}

const inputStyle = {
  background: 'var(--void-2)',
  border: '1px solid rgba(200,150,60,0.2)',
  borderRadius: '8px',
  color: 'var(--cream)',
  padding: '0.55rem 0.85rem',
  fontSize: '0.88rem',
  fontFamily: 'var(--font-body)',
  outline: 'none',
  minWidth: '180px',
}

const actionBtn = (color) => ({
  background: 'none',
  border: 'none',
  color,
  cursor: 'pointer',
  fontSize: '0.82rem',
  fontFamily: 'var(--font-body)',
  padding: '0 0.25rem',
})

export default function AdminVendorList() {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [status, setStatus] = useState('All')
  const { addToast } = useToastStore()

  async function fetchVendors() {
    setLoading(true)
    let query = supabase
      .from('vendor_listings')
      .select('*, bookings(count)')

    if (category !== 'All') query = query.eq('category', category)
    if (status !== 'All') query = query.eq('status', status)
    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) {
      addToast('Failed to load vendors', 'error')
    } else {
      setVendors(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVendors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status])

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') fetchVendors()
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('vendor_listings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      addToast('Status update failed', 'error')
    } else {
      addToast(`Vendor ${newStatus}`, 'success')
      fetchVendors()
    }
  }

  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.7rem,4vw,2.2rem)',
        fontWeight: 400,
        color: 'var(--cream)',
        marginBottom: '0.4rem',
      }}>
        Vendor List
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Search, filter, and manage vendor listings
      </p>

      {/* Filters bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        marginBottom: '1.75rem',
        alignItems: 'center',
      }}>
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ ...inputStyle, flexGrow: 1, maxWidth: '320px' }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={inputStyle}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={inputStyle}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button
          onClick={fetchVendors}
          style={{
            background: 'var(--gold)',
            border: 'none',
            borderRadius: '8px',
            color: 'var(--void)',
            padding: '0.55rem 1.2rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '4rem 0' }}>Loading vendors…</p>
      ) : vendors.length === 0 ? (
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '4rem 0' }}>No vendors found.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            color: 'var(--cream)',
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(200,150,60,0.15)' }}>
                {['Name', 'Category', 'City', 'Tier', 'Status', 'Bookings', 'Actions'].map((col) => (
                  <th key={col} style={{
                    textAlign: 'left',
                    padding: '0.65rem 0.85rem',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    color: 'var(--cream-muted)',
                    fontSize: '0.78rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendors.map((v) => {
                const isSuspended = v.status === 'suspended'
                const bookingCount = v.bookings?.[0]?.count ?? 0
                const badge = STATUS_BADGE[v.status] || {}

                return (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: '1px solid rgba(200,150,60,0.06)',
                      opacity: isSuspended ? 0.5 : 1,
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 500, color: 'var(--cream)' }}>
                      {v.name}
                    </td>

                    {/* Category */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)', textTransform: 'capitalize' }}>
                      {v.category || '—'}
                    </td>

                    {/* City */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)' }}>
                      {v.city || '—'}
                    </td>

                    {/* Tier */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)', textTransform: 'capitalize' }}>
                      {v.tier || '—'}
                    </td>

                    {/* Status badge */}
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        background: badge.background || 'transparent',
                        color: badge.color || 'var(--cream-muted)',
                      }}>
                        {v.status || 'unverified'}
                      </span>
                    </td>

                    {/* Booking count */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)', textAlign: 'center' }}>
                      {bookingCount}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                      <Link
                        to={`/admin/vendors/${v.id}`}
                        style={{ ...actionBtn('var(--gold)'), textDecoration: 'none', marginRight: '0.5rem' }}
                      >
                        View
                      </Link>

                      {v.status === 'unverified' && (
                        <button
                          onClick={() => updateStatus(v.id, 'verified')}
                          style={{ ...actionBtn('#4caf7d'), marginRight: '0.5rem' }}
                        >
                          Verify
                        </button>
                      )}

                      {(v.status === 'unverified' || v.status === 'verified') && (
                        <button
                          onClick={() => updateStatus(v.id, 'suspended')}
                          style={actionBtn('rgba(220,80,80,0.9)')}
                        >
                          Suspend
                        </button>
                      )}

                      {v.status === 'suspended' && (
                        <button
                          onClick={() => updateStatus(v.id, 'verified')}
                          style={actionBtn('#4caf7d')}
                        >
                          Restore
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
