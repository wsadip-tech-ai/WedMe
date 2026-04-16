import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

const s = {
  page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { width: '100%', maxWidth: '460px', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '16px', padding: '2.5rem 2rem' },
  heading: { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.4rem' },
  sub: { color: 'var(--cream-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' },
  roleRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' },
  roleCard: (active) => ({ padding: '1rem', border: active ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)', borderRadius: '10px', background: active ? 'var(--gold-muted)' : 'var(--void-3)', cursor: 'pointer', textAlign: 'center', transition: 'all 200ms ease' }),
  roleIcon: { fontSize: '1.5rem', display: 'block', marginBottom: '0.35rem' },
  roleLabel: (active) => ({ fontSize: '0.82rem', fontWeight: 600, color: active ? 'var(--gold-light)' : 'var(--cream-muted)', letterSpacing: '0.04em' }),
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', outline: 'none', boxSizing: 'border-box' },
  btn: { width: '100%', padding: '0.8rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' },
  googleBtn: { width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  divider: { display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem 0', color: 'var(--cream-muted)', fontSize: '0.8rem' },
  line: { flex: 1, height: '1px', background: 'rgba(200,150,60,0.15)' },
  error: { color: 'var(--error)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'rgba(229,115,115,0.1)', borderRadius: '6px', border: '1px solid rgba(229,115,115,0.3)' },
  success: { color: 'var(--success)', fontSize: '0.9rem', padding: '0.75rem 0.8rem', background: 'rgba(76,175,125,0.1)', borderRadius: '6px', border: '1px solid rgba(76,175,125,0.3)', marginBottom: '1rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--cream-muted)' },
}

export default function Register() {
  const [role, setRole] = useState('consumer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    if (data.user && !data.session) { setSuccess('Check your email to confirm your account, then sign in.'); return }
    if (data.user) { setUser(data.user); navigate(role === 'vendor' ? '/vendor/onboarding' : '/onboarding') }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, queryParams: { role } } })
  }

  return (
    <main style={s.page}>
      <div style={s.card}>
        <h1 style={s.heading}>Begin Your Journey</h1>
        <p style={s.sub}>Create your WedMe account</p>
        {error && <div style={s.error} role="alert">{error}</div>}
        {success && <div style={s.success} role="status">{success}</div>}
        <div style={s.roleRow} role="group" aria-label="Account type">
          <button type="button" style={s.roleCard(role === 'consumer')} onClick={() => setRole('consumer')} aria-pressed={role === 'consumer'}>
            <span style={s.roleIcon}>💑</span><span style={s.roleLabel(role === 'consumer')}>Planning a Wedding</span>
          </button>
          <button type="button" style={s.roleCard(role === 'vendor')} onClick={() => setRole('vendor')} aria-pressed={role === 'vendor'}>
            <span style={s.roleIcon}>🎪</span><span style={s.roleLabel(role === 'vendor')}>I'm a Vendor</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="fullName" style={s.label}>Full name</label>
          <input id="fullName" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={s.input} placeholder="Priya Sharma" />
          <label htmlFor="email" style={s.label}>Email address</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} style={s.input} placeholder="you@example.com" />
          <label htmlFor="password" style={s.label}>Password</label>
          <input id="password" type="password" required autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} style={s.input} placeholder="Min. 6 characters" />
          <button type="submit" style={s.btn} disabled={loading}>{loading ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <div style={s.divider}><span style={s.line} /> or <span style={s.line} /></div>
        <button style={s.googleBtn} onClick={handleGoogle} type="button">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Continue with Google
        </button>
        <p style={s.footer}>Already have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link></p>
      </div>
    </main>
  )
}
