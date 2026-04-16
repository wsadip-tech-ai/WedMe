import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Handles the redirect back from Supabase confirmation emails.
// Supabase appends ?code=... (PKCE flow). The client auto-exchanges it
// and fires onAuthStateChange with SIGNED_IN — we just wait and redirect.
export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Set up the listener BEFORE checking session so we never miss the event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe()
        const role = session.user?.user_metadata?.role
        navigate(role === 'vendor' ? '/vendor/onboarding' : '/onboarding', { replace: true })
      }
    })

    // If the session was already established before this component mounted, redirect now.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe()
        const role = session.user?.user_metadata?.role
        navigate(role === 'vendor' ? '/vendor/onboarding' : '/onboarding', { replace: true })
      }
    })

    // Fallback: if nothing happens in 8s, something went wrong — send to login.
    const fallback = setTimeout(() => {
      subscription.unsubscribe()
      navigate('/login?error=confirmation_failed', { replace: true })
    }, 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(fallback)
    }
  }, [navigate])

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--void)' }}>
      <p style={{ color: 'var(--cream-muted)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', letterSpacing: '0.04em' }}>
        Confirming your account…
      </p>
    </main>
  )
}
