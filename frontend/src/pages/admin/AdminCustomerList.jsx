import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

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

function formatDate(dateString) {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminCustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const addToast = useToastStore(s => s.show)

  async function fetchCustomers() {
    setLoading(true)
    let query = supabase
      .from('profiles')
      .select('*, bookings(count)')
      .eq('role', 'consumer')

    if (search.trim()) query = query.ilike('full_name', `%${search.trim()}%`)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) {
      addToast('Failed to load customers', 'error')
    } else {
      setCustomers(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearchKeyDown(e) {
    if (e.key === 'Enter') fetchCustomers()
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
        Customer List
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
        Search and view customer profiles
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
        <button
          onClick={fetchCustomers}
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
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '4rem 0' }}>Loading customers…</p>
      ) : customers.length === 0 ? (
        <p style={{ color: 'var(--cream-muted)', textAlign: 'center', padding: '4rem 0' }}>No customers found.</p>
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
                {['Name', 'Role', 'Joined', 'Bookings', 'Actions'].map((col) => (
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
              {customers.map((p) => {
                const bookingCount = p.bookings?.[0]?.count ?? 0

                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid rgba(200,150,60,0.06)',
                    }}
                  >
                    {/* Name */}
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 500, color: 'var(--cream)' }}>
                      {p.full_name || '—'}
                    </td>

                    {/* Role */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)', textTransform: 'capitalize' }}>
                      {p.role || '—'}
                    </td>

                    {/* Joined date */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)' }}>
                      {formatDate(p.created_at)}
                    </td>

                    {/* Booking count */}
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--cream-muted)', textAlign: 'center' }}>
                      {bookingCount}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                      <Link
                        to={`/admin/customers/${p.id}`}
                        style={{ ...actionBtn('var(--gold)'), textDecoration: 'none' }}
                      >
                        View
                      </Link>
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
