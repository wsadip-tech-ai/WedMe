import { Link } from 'react-router-dom'
export default function NotFound() {
  return (
    <main style={{ minHeight: '80dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '6rem', color: 'var(--gold)', opacity: 0.3, lineHeight: 1, marginBottom: '1rem' }}>404</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.75rem' }}>Page not found</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
      <Link to="/" style={{ padding: '0.75rem 1.75rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Go Home</Link>
    </main>
  )
}
