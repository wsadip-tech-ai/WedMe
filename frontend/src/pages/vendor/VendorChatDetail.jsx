import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

export default function VendorChatDetail() {
  const { sessionId } = useParams()
  const show = useToastStore(s => s.show)
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    if (!reply.trim() || sending) return
    setSending(true)
    const { error } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role: 'vendor',
      content: reply.trim(),
    })
    if (error) {
      show('Failed to send reply', 'error')
      setSending(false)
      return
    }
    // Clear needs_vendor flag
    await supabase.from('chat_sessions').update({ needs_vendor: false }).eq('id', sessionId)
    setMessages(prev => [...prev, { id: Date.now(), role: 'vendor', content: reply.trim(), created_at: new Date().toISOString() }])
    setReply('')
    setSending(false)
    show('Reply sent!')
  }

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!session) return <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Conversation not found.</main>

  return (
    <main style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <Link to="/vendor/chats" style={{ display: 'inline-block', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
        ← Back to Chats
      </Link>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
          {session.profiles?.full_name || 'Customer'}
        </h1>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>
          {new Date(session.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {session.needs_vendor && <span style={{ marginLeft: '0.75rem', background: 'rgba(251,188,5,0.15)', color: '#fbbc05', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '99px' }}>Needs your reply</span>}
        </p>
      </div>

      {/* Messages */}
      <div style={{ background: 'var(--void-2)', borderRadius: '12px', border: '1px solid rgba(200,150,60,0.12)', padding: '1.25rem', marginBottom: '1.25rem', maxHeight: '500px', overflowY: 'auto' }}>
        {!messages.length ? (
          <p style={{ textAlign: 'center', color: 'var(--cream-muted)' }}>No messages yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg) => {
              const isCustomer = msg.role === 'customer'
              const isVendor = msg.role === 'vendor'
              const isAI = msg.role === 'assistant'

              const align = isCustomer ? 'flex-end' : 'flex-start'
              const bg = isCustomer ? 'rgba(200,150,60,0.15)'
                       : isVendor ? 'rgba(76,175,125,0.12)'
                       : 'var(--void-3)'
              const border = isCustomer ? 'rgba(200,150,60,0.2)'
                           : isVendor ? 'rgba(76,175,125,0.2)'
                           : 'rgba(200,150,60,0.06)'
              const radius = isCustomer ? '12px 12px 2px 12px'
                           : '12px 12px 12px 2px'
              const label = isAI ? '🤖 AI Assistant'
                          : isVendor ? '💼 You (Vendor)'
                          : null

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: align }}>
                  {label && <span style={{ fontSize: '0.65rem', color: 'var(--cream-muted)', marginBottom: '0.2rem', paddingLeft: '0.25rem' }}>{label}</span>}
                  <div style={{ maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: radius, background: bg, border: `1px solid ${border}` }}>
                    <p style={{ color: 'var(--cream)', fontSize: '0.88rem', lineHeight: 1.55, margin: 0 }}>{msg.content}</p>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--cream-muted)', marginTop: '0.2rem', paddingLeft: isCustomer ? 0 : '0.25rem', paddingRight: isCustomer ? '0.25rem' : 0 }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Vendor reply input */}
      <div style={{ background: 'var(--void-2)', borderRadius: '12px', border: '1px solid rgba(200,150,60,0.12)', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.6rem' }}>Reply to customer</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
            placeholder="Type your reply..."
            disabled={sending}
            style={{
              flex: 1, padding: '0.6rem 0.85rem',
              background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.15)',
              borderRadius: '8px', color: 'var(--cream)',
              fontFamily: 'var(--font-body)', fontSize: '0.88rem', outline: 'none',
            }}
          />
          <button
            onClick={sendReply}
            disabled={!reply.trim() || sending}
            style={{
              padding: '0.6rem 1.2rem', background: 'var(--gold)',
              border: 'none', borderRadius: '8px', color: 'var(--void)',
              fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.85rem',
              cursor: reply.trim() && !sending ? 'pointer' : 'default',
              opacity: reply.trim() && !sending ? 1 : 0.5,
            }}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  )
}
