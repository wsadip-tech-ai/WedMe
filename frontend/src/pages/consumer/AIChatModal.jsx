import { useState, useRef, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'

const SUGGESTED_QUESTIONS = [
  'What packages do you offer?',
  'What are your prices?',
  'Are you available for my date?',
]

export default function AIChatModal({ vendor, onClose, onEscalate }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const { show: showToast } = useToastStore()

  // Auto-scroll to bottom on new messages or sending state change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function sendMessage(text) {
    const messageText = text ?? input
    if (!messageText.trim() || sending) return

    const optimisticMsg = { role: 'customer', content: messageText.trim() }
    setMessages((prev) => [...prev, optimisticMsg])
    setInput('')
    setSending(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not signed in')
      }
      console.log('[AIChatModal] Sending to edge function, vendor:', vendor.id)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          vendor_id: vendor.id,
          session_id: sessionId,
          message: messageText.trim(),
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error('[AIChatModal] Edge function error:', res.status, errText)
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()

      if (data.error) {
        console.error('[AIChatModal] API error:', data.error)
        throw new Error(data.error)
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ])
      setSessionId(data.session_id)
    } catch (err) {
      console.error('[AIChatModal] Error:', err)
      showToast('Failed to get response', 'error')
      // Remove the optimistic customer message
      setMessages((prev) => prev.filter((m) => m !== optimisticMsg))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleSuggestedQuestion(q) {
    sendMessage(q)
  }

  const canSend = input.trim().length > 0 && !sending

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.78)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--void-2)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(200,150,60,0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid rgba(200,150,60,0.1)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '0.25rem',
            }}
          >
            Ask AI
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              color: 'var(--cream)',
            }}
          >
            {vendor.name}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              background: 'none',
              border: 'none',
              color: 'var(--cream-muted)',
              fontSize: '1.4rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
          }}
        >
          {/* Welcome state */}
          {messages.length === 0 && !sending && (
            <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🤖</div>
              <p
                style={{
                  color: 'var(--cream-muted)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  marginBottom: '1.25rem',
                }}
              >
                Hi! I can answer questions about {vendor.name}'s services, pricing, and availability.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  justifyContent: 'center',
                }}
              >
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSuggestedQuestion(q)}
                    style={{
                      background: 'rgba(200,150,60,0.08)',
                      border: '1px solid rgba(200,150,60,0.15)',
                      borderRadius: 99,
                      color: 'var(--gold)',
                      fontSize: '0.78rem',
                      padding: '0.35rem 0.8rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'customer' ? 'flex-end' : 'flex-start',
                marginBottom: '0.85rem',
              }}
            >
              {msg.role === 'assistant' && (
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: 'var(--cream-muted)',
                    marginBottom: '0.2rem',
                  }}
                >
                  🤖 AI Assistant
                </div>
              )}
              <div
                style={
                  msg.role === 'customer'
                    ? {
                        background: 'rgba(200,150,60,0.15)',
                        border: '1px solid rgba(200,150,60,0.2)',
                        borderRadius: '12px 12px 2px 12px',
                        padding: '0.6rem 0.85rem',
                        maxWidth: '80%',
                      }
                    : {
                        background: 'var(--void-3)',
                        border: '1px solid rgba(200,150,60,0.08)',
                        borderRadius: '12px 12px 12px 2px',
                        padding: '0.6rem 0.85rem',
                        maxWidth: '80%',
                      }
                }
              >
                <span
                  style={{
                    color: 'var(--cream)',
                    fontSize: '0.88rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.content}
                </span>
              </div>
            </div>
          ))}

          {/* Sending indicator */}
          {sending && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginBottom: '0.85rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--cream-muted)',
                  marginBottom: '0.2rem',
                }}
              >
                🤖 AI Assistant
              </div>
              <div
                style={{
                  background: 'var(--void-3)',
                  border: '1px solid rgba(200,150,60,0.08)',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '0.6rem 0.85rem',
                  maxWidth: '80%',
                }}
              >
                <span
                  style={{
                    color: 'var(--cream-muted)',
                    fontSize: '0.88rem',
                    animation: 'pulse 1.2s ease-in-out infinite',
                  }}
                >
                  ...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid rgba(200,150,60,0.1)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              disabled={sending}
              style={{
                flex: 1,
                padding: '0.6rem 0.85rem',
                background: 'var(--void-3)',
                border: '1px solid rgba(200,150,60,0.15)',
                borderRadius: 8,
                color: 'var(--cream)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.88rem',
                outline: 'none',
                opacity: sending ? 0.6 : 1,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              style={{
                padding: '0.6rem 1rem',
                background: 'var(--gold)',
                border: 'none',
                borderRadius: 8,
                color: 'var(--void)',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: canSend ? 'pointer' : 'not-allowed',
                opacity: canSend ? 1 : 0.5,
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>

          {/* Escalation link */}
          <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
            <span style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>
              Need a human?{' '}
            </span>
            <span
              onClick={onEscalate}
              style={{
                color: 'var(--gold)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Send enquiry to vendor →
            </span>
          </div>
        </div>
      </div>

      {/* Pulse animation for sending indicator */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
