import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { VendorCard } from '../../components/VendorCard'
const CATEGORIES = ['All','photography','makeup','catering','decor','music','mehendi','pandit','venue']
export default function VendorDiscovery() {
  const { user } = useAuthStore()
  const [vendors, setVendors] = useState([])
  const [shortlisted, setShortlisted] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [cityFilter, setCityFilter] = useState('')
  async function fetchData() {
    setLoading(true)
    let q = supabase.from('vendor_listings').select('*')
    if (category !== 'All') q = q.eq('category', category)
    if (cityFilter.trim()) q = q.ilike('city', `%${cityFilter.trim()}%`)
    q = q.neq('status', 'suspended')
    const { data } = await q.order('created_at', { ascending: false })
    setVendors(data || [])
    if (user) { const { data: sl } = await supabase.from('shortlists').select('vendor_id').eq('user_id', user.id); setShortlisted(new Set((sl || []).map((r) => r.vendor_id))) }
    setLoading(false)
  }
  useEffect(() => { fetchData() }, [category, cityFilter, user])
  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Find Vendors</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Discover the best wedding professionals</p>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" style={{ padding: '0.6rem 1rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', cursor: 'pointer' }}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
        <label htmlFor="citySearch" className="sr-only">Filter by city</label>
        <input id="citySearch" type="text" placeholder="Filter by city…" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} style={{ padding: '0.6rem 1rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', width: '180px', outline: 'none' }} />
      </div>
      {loading && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>{[1,2,3].map((i) => (<div key={i} style={{ background: 'var(--void-2)', borderRadius: '12px', aspectRatio: '3/4', opacity: 0.4 }} />))}</div>)}
      {!loading && !vendors.length && (<div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--cream-muted)' }}><p style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</p><p>No vendors found. Try adjusting your search.</p></div>)}
      {!loading && vendors.length > 0 && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>{vendors.map((v) => (<VendorCard key={v.id} vendor={v} shortlisted={shortlisted.has(v.id)} onShortlistChange={fetchData} />))}</div>)}
    </main>
  )
}
