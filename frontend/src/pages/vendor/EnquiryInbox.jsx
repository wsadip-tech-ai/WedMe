import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'
const SC = { pending: { bg: 'rgba(251,188,5,0.12)', color: '#fbbc05', border: 'rgba(251,188,5,0.3)' }, read: { bg: 'rgba(200,150,60,0.12)', color: 'var(--gold)', border: 'rgba(200,150,60,0.3)' }, replied: { bg: 'rgba(76,175,125,0.12)', color: 'var(--success)', border: 'rgba(76,175,125,0.3)' } }
export default function EnquiryInbox() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const [listing, setListing] = useState(null)
  const [enquiries, setEnquiries] = useState([])
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle().then(async ({ data }) => {
      if (!data) { setLoading(false); return }
      setListing(data)
      const { data: enqs } = await supabase.from('enquiries').select('*, profiles(full_name)').eq('vendor_id', data.id).order('created_at', { ascending: false })
      setEnquiries(enqs || []); setLoading(false)
    })
  }, [user])
  async function markRead(id) {
    await supabase.from('enquiries').update({ status: 'read' }).eq('id', id)
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'read' } : e)); show('Marked as read')
  }
  const filters = ['All','pending','read','replied']
  const shown = filter === 'All' ? enquiries : enquiries.filter((e) => e.status === filter)
  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!listing) return <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Set up your vendor profile first.</main>
  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Enquiry Inbox</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>{enquiries.filter(e=>e.status==='pending').length} pending · {enquiries.length} total</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(200,150,60,0.12)', paddingBottom: '0.75rem' }}>
        {filters.map((ft) => (<button key={ft} onClick={() => setFilter(ft)} style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: filter === ft ? '1px solid var(--gold)' : '1px solid transparent', background: filter === ft ? 'var(--gold-muted)' : 'transparent', color: filter === ft ? 'var(--gold)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' }}>{ft.charAt(0).toUpperCase()+ft.slice(1)}</button>))}
      </div>
      {!shown.length ? (<div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--cream-muted)' }}><p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📬</p><p>No enquiries {filter !== 'All' ? `with status "${filter}"` : 'yet'}.</p></div>)
      : (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>{shown.map((e) => { const col = SC[e.status]||SC.pending; const isOpen = expanded === e.id; return (<div key={e.id} style={{ background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.12)', borderRadius: '12px', overflow: 'hidden' }}><button onClick={() => { setExpanded(isOpen ? null : e.id); if (!isOpen && e.status === 'pending') markRead(e.id) }} style={{ width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textAlign: 'left' }}><div><p style={{ color: 'var(--cream)', fontSize: '0.92rem', fontWeight: 500, marginBottom: '0.2rem' }}>{e.profiles?.full_name || 'Anonymous'}</p><p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '400px' }}>{e.message}</p></div><div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}><span style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: col.bg, color: col.color, border: `1px solid ${col.border}` }}>{e.status}</span><span style={{ color: 'var(--cream-muted)', fontSize: '0.75rem' }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</span><span style={{ color: 'var(--cream-muted)' }}>{isOpen ? '▲' : '▼'}</span></div></button>{isOpen && (<div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(200,150,60,0.08)' }}><p style={{ color: 'var(--cream)', lineHeight: 1.7, paddingTop: '1rem', fontSize: '0.92rem' }}>{e.message}</p>{e.status === 'pending' && (<button onClick={() => markRead(e.id)} style={{ marginTop: '0.75rem', padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.35)', borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '0.82rem', cursor: 'pointer' }}>✓ Mark as Read</button>)}</div>)}</div>) })}</div>)}
    </main>
  )
}
