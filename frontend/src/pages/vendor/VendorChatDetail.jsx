import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function VendorChatDetail() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    Promise.all([
      supabase.from('chat_sessions').select('*, profiles(full_name)').eq('id', sessionId).single(),
      supabase.from('chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true }),
    ]).then(([{ data: sess }, { data: msgs }]) => {
      setSession(sess || null)
      setMessages(msgs || [])
      setLoading(false)
    })
  }, [sessionId])

  if (loading) return (
    <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
      Loading…
    </main>
  )

  if (!session) return (
    <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
      Conversation not found.
    </main>
  )

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link
        to="/vendor/chats"
        style={{ display: 'inline-block', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '1.75rem' }}
      >
        ← Back to Chats
      </Link>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
          {session.profiles?.full_name || 'Anonymous Customer'}
        </h1>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>
          {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {!messages.length ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--cream-muted)', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.12)', borderRadius: '12px' }}>
          No messages in this conversation.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((msg) => {
            const isCustomer = msg.role === 'user'
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isCustomer ? 'flex-end' : 'flex-start',
                }}
              >
                {!isCustomer && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--cream-muted)', marginBottom: '0.3rem', paddingLeft: '0.25rem' }}>
                    🤖 AI
                  </span>
                )}
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: isCustomer ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isCustomer ? 'rgba(200,150,60,0.15)' : 'var(--void-3)',
                  }}
                >
                  <p style={{ color: 'var(--cream)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>
                    {msg.content}
                  </p>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--cream-muted)', marginTop: '0.3rem', paddingLeft: isCustomer ? 0 : '0.25rem', paddingRight: isCustomer ? '0.25rem' : 0 }}>
                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
