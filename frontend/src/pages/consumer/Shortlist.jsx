import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { VendorCard } from '../../components/VendorCard'
export default function Shortlist() {
  const { user } = useAuthStore()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  async function fetchShortlist() {
    if (!user) return
    const { data } = await supabase.from('shortlists').select('vendor_id, vendor_listings(*)').eq('user_id', user.id).order('created_at', { ascending: false })
    setVendors((data || []).map((r) => r.vendor_listings).filter(Boolean))
    setLoading(false)
  }
  useEffect(() => { fetchShortlist() }, [user])
  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  return (
    <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>My Shortlist</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} saved</p>
      {!vendors.length ? (<div style={{ textAlign: 'center', padding: '4rem 1rem' }}><p style={{ fontSize: '3rem', marginBottom: '1rem' }}>♡</p><p style={{ color: 'var(--cream-muted)', marginBottom: '1.5rem' }}>You haven't saved any vendors yet.</p><Link to="/vendors" style={{ padding: '0.75rem 1.75rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Browse Vendors</Link></div>)
      : (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>{vendors.map((v) => (<VendorCard key={v.id} vendor={v} shortlisted={true} onShortlistChange={fetchShortlist} />))}</div>)}
    </main>
  )
}
