import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const s = {
  page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { width: '100%', maxWidth: '420px', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '16px', padding: '2.5rem 2rem' },
  heading: { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.4rem' },
  sub: { color: 'var(--cream-muted)', fontSize: '0.9rem', marginBottom: '2rem' },
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '0.8rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' },
  googleBtn: { width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0', color: 'var(--cream-muted)', fontSize: '0.8rem' },
  line: { flex: 1, height: '1px', background: 'rgba(200,150,60,0.15)' },
  error: { color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'rgba(229,115,115,0.1)', borderRadius: '6px', border: '1px solid rgba(229,115,115,0.3)' },
  footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--cream-muted)' },
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError(err.message); return }
    setUser(data.user)
    const role = data.user?.user_metadata?.role
    navigate(role === 'vendor' ? '/vendor/dashboard' : '/dashboard')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Welcome Back</h1>
        <p style={s.sub}>Sign in to continue your journey</p>
        {error && <div style={s.error} role="alert">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="email" style={s.label}>Email address</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} placeholder="you@example.com" />
          <label htmlFor="password" style={s.label}>Password</label>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} style={s.input} placeholder="••••••••" />
          <button type="submit" style={s.btn} disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>
        <div style={s.divider}><span style={s.line} /> or <span style={s.line} /></div>
        <button style={s.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <p style={s.footer}>New here? <Link to="/register" style={{ color: 'var(--gold)' }}>Create an account</Link></p>
      </div>
    </main>
  )
}
