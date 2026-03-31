import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { VendorCard } from '../components/VendorCard'

const HERO_PHOTO =
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80'

const CATEGORIES = [
  { key: 'all',         label: 'All' },
  { key: 'photography', label: '📷 Photography' },
  { key: 'venue',       label: '🏛 Venue' },
  { key: 'makeup',      label: '💄 Makeup' },
  { key: 'catering',    label: '🍽 Catering' },
  { key: 'decor',       label: '🌸 Decor' },
  { key: 'music',       label: '🎵 Music' },
  { key: 'mehendi',     label: '🪷 Mehendi' },
  { key: 'pandit',      label: '🙏 Pandit' },
]

const STEPS = [
  { num: '01', title: 'Discover', desc: 'Browse vetted wedding & event vendors across Nepal. Filter by category and city.' },
  { num: '02', title: 'Compare',  desc: 'View portfolios, service packages, and real availability — all in one place.' },
  { num: '03', title: 'Book',     desc: 'Pick a date, choose a package, and confirm directly — no middlemen, no commission.' },
]

export default function LandingPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [vendors, setVendors]               = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    let cancelled = false
    async function fetchVendors() {
      setLoading(true)
      let q = supabase.from('vendor_listings').select('*').neq('status', 'suspended')
      if (activeCategory !== 'all') q = q.eq('category', activeCategory)
      q = q.order('created_at', { ascending: false }).limit(activeCategory === 'all' ? 6 : 3)
      const { data } = await q
      if (!cancelled) {
        setVendors(data || [])
        setLoading(false)
      }
    }
    fetchVendors()
    return () => { cancelled = true }
  }, [activeCategory])

  const activeCat = CATEGORIES.find(c => c.key === activeCategory)

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        {/* Background photo */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url("${HERO_PHOTO}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }} />

        {/* Gradient overlay — fades to --void at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,9,6,0.35) 0%, rgba(11,9,6,0.72) 55%, var(--void) 100%)',
        }} />

        {/* Spinning mandala (depth layer) */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '680px', height: '680px',
          opacity: 0.05, pointerEvents: 'none',
          animation: 'spin 120s linear infinite',
        }}>
          <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#c8963c" strokeWidth="0.4">
            <circle cx="100" cy="100" r="90"/>
            <circle cx="100" cy="100" r="70"/>
            <circle cx="100" cy="100" r="50"/>
            <circle cx="100" cy="100" r="30"/>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map(a => (
              <line key={a} x1="100" y1="100"
                x2={100 + 90 * Math.cos(a * Math.PI / 180)}
                y2={100 + 90 * Math.sin(a * Math.PI / 180)} />
            ))}
            {[0,45,90,135].map(a => (
              <ellipse key={a} cx="100" cy="100" rx="90" ry="30"
                transform={`rotate(${a} 100 100)`} />
            ))}
          </svg>
        </div>
        <style>{`@keyframes spin { to { transform: translate(-50%,-50%) rotate(360deg); } }`}</style>

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 2,
          textAlign: 'center', padding: '6rem 1.5rem 4rem',
          maxWidth: '720px',
        }}>
          <p style={{
            fontSize: '0.75rem', letterSpacing: '0.28em', color: 'var(--gold)',
            textTransform: 'uppercase', marginBottom: '1.25rem',
          }}>
            Your Wedding &amp; Event Planning Platform
          </p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
            fontWeight: 400, color: 'var(--cream)',
            lineHeight: 1.08, marginBottom: '1.4rem',
          }}>
            Your Perfect Wedding<br />Begins Here
          </h1>
          <p style={{
            color: 'var(--cream-muted)', fontSize: '1.05rem',
            maxWidth: '480px', margin: '0 auto 2.5rem', lineHeight: 1.75,
          }}>
            Discover and connect with the finest photographers, venues, makeup artists,
            and more — wherever your celebration takes place.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/vendors" style={{
              padding: '0.9rem 2.2rem', background: 'var(--gold)',
              borderRadius: '6px', color: 'var(--void)',
              fontFamily: 'var(--font-body)', fontWeight: 700,
              fontSize: '0.9rem', textDecoration: 'none', letterSpacing: '0.04em',
            }}>
              Find Vendors
            </Link>
            <Link to="/register" style={{
              padding: '0.9rem 2.2rem', background: 'transparent',
              border: '1px solid rgba(200,150,60,0.55)', borderRadius: '6px',
              color: 'var(--gold)', fontFamily: 'var(--font-body)',
              fontSize: '0.9rem', textDecoration: 'none',
            }}>
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Vendors ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <p style={{
          fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--gold)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem',
        }}>
          Featured Vendors
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: 'var(--cream)',
          textAlign: 'center', marginBottom: '2.5rem',
        }}>
          Find Your Perfect Vendors
        </h2>

        {/* Category pills */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
          justifyContent: 'center', marginBottom: '2.5rem',
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={activeCategory === cat.key}
              style={{
                padding: '0.45rem 1.1rem',
                background: activeCategory === cat.key ? 'var(--gold)' : 'transparent',
                border: `1px solid ${activeCategory === cat.key ? 'var(--gold)' : 'rgba(200,150,60,0.35)'}`,
                borderRadius: '999px',
                color: activeCategory === cat.key ? 'var(--void)' : 'var(--cream-muted)',
                fontFamily: 'var(--font-body)', fontSize: '0.82rem',
                fontWeight: activeCategory === cat.key ? 700 : 400,
                cursor: 'pointer', transition: 'all 180ms',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Vendor grid */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                background: 'var(--void-2)', borderRadius: '12px',
                aspectRatio: '3/4', opacity: 0.4,
              }} />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--cream-muted)' }}>
            <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</p>
            <p>No vendors found in this category yet.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}>
            {vendors.map(v => (
              <VendorCard key={v.id} vendor={v} shortlisted={false} />
            ))}
          </div>
        )}

        {/* View all link */}
        {!loading && vendors.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link
              to={activeCategory === 'all' ? '/vendors' : `/vendors?category=${activeCategory}`}
              style={{
                color: 'var(--gold)', fontFamily: 'var(--font-body)',
                fontSize: '0.88rem', letterSpacing: '0.06em',
                textDecoration: 'none', borderBottom: '1px solid rgba(200,150,60,0.4)',
                paddingBottom: '0.15rem',
              }}
            >
              View all {activeCat?.key === 'all' ? '' : activeCat?.label.replace(/^\S+\s/, '')}{' '}
              vendors →
            </Link>
          </div>
        )}
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section style={{
        padding: '5rem 1.5rem',
        maxWidth: '900px', margin: '0 auto',
        borderTop: '1px solid rgba(200,150,60,0.08)',
      }}>
        <p style={{
          fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--gold)',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: '0.6rem',
        }}>
          How it works
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 400, color: 'var(--cream)',
          textAlign: 'center', marginBottom: '3.5rem',
        }}>
          Three steps to your dream wedding
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '2rem',
        }}>
          {STEPS.map(step => (
            <div key={step.num} style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '3rem',
                color: 'var(--gold)', opacity: 0.35, lineHeight: 1, marginBottom: '0.75rem',
              }}>
                {step.num}
              </p>
              <h3 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem',
                color: 'var(--cream)', marginBottom: '0.5rem',
              }}>
                {step.title}
              </h3>
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(200,150,60,0.1)',
        padding: '2rem 1.5rem', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          color: 'var(--gold)', marginBottom: '0.4rem',
        }}>
          WedMe
        </p>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>
          © 2026 WedMe. Crafted for every celebration.
        </p>
      </footer>
    </main>
  )
}
