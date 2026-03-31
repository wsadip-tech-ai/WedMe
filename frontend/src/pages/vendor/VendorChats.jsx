import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

export default function VendorChats() {
  const { user } = useAuthStore()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [listing, setListing] = useState(null)

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle().then(async ({ data }) => {
      if (!data) { setLoading(false); return }
      setListing(data)
      const { data: sess } = await supabase
        .from('chat_sessions')
        .select('*, profiles(full_name)')
        .eq('vendor_id', data.id)
        .order('created_at', { ascending: false })
      setSessions(sess || [])
      setLoading(false)
    })
  }, [user])

  const card = {
    background: 'var(--void-2)',
    border: '1px solid rgba(200,150,60,0.12)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    textDecoration: 'none',
  }

  if (loading) return (
    <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
      Loading…
    </main>
  )

  if (!listing) return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
      Set up your vendor profile first.
    </main>
  )

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
        AI Chats
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>
        Review conversations between customers and your AI assistant.
      </p>

      {!sessions.length ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--cream-muted)', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.12)', borderRadius: '12px' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤖</p>
          <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--cream)' }}>No AI chat conversations yet.</p>
          <p style={{ fontSize: '0.85rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.6 }}>
            When customers visit your listing, they can chat with your AI assistant. Those conversations will appear here for your review.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/vendor/chats/${session.id}`}
              style={card}
            >
              <div>
                <p style={{ color: 'var(--cream)', fontSize: '0.92rem', fontWeight: 500, marginBottom: '0.2rem' }}>
                  {session.profiles?.full_name || 'Anonymous Customer'}
                  {session.needs_vendor && <span style={{ marginLeft: '0.5rem', background: 'rgba(251,188,5,0.15)', color: '#fbbc05', fontSize: '0.68rem', padding: '0.12rem 0.45rem', borderRadius: '99px' }}>Needs reply</span>}
                </p>
                <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>
                  {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span style={{ color: session.needs_vendor ? '#fbbc05' : 'var(--gold)', fontSize: '0.88rem', flexShrink: 0 }}>{session.needs_vendor ? 'Reply →' : 'View →'}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
