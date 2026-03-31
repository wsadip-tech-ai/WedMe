import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useToastStore } from '../store/useToastStore'
const PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%231c1710" width="400" height="300"/%3E%3Ctext fill="%23c8963c" font-size="48" text-anchor="middle" x="200" y="165"%3E%F0%9F%8E%AA%3C/text%3E%3C/svg%3E'
const CAT = { photography: '📷 Photography', makeup: '💄 Makeup', catering: '🍽 Catering', decor: '🌸 Decor', music: '🎵 Music', mehendi: '🪷 Mehendi', pandit: '🙏 Pandit', venue: '🏛 Venue' }
export function VendorCard({ vendor, shortlisted = false, onShortlistChange }) {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  async function toggleShortlist() {
    if (!user) { show('Sign in to save vendors to your shortlist', 'error'); return }
    if (shortlisted) { await supabase.from('shortlists').delete().match({ user_id: user.id, vendor_id: vendor.id }); show('Removed from shortlist') }
    else { await supabase.from('shortlists').insert({ user_id: user.id, vendor_id: vendor.id }); show('Added to shortlist ♡') }
    onShortlistChange?.()
  }
  const photo = vendor.photo_urls?.[0] || PLACEHOLDER
  const profileUrl = `/vendors/${vendor.id}`
  return (
    <div style={{ background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.15)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'border-color 160ms, transform 160ms' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,150,60,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,150,60,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      {/* Clickable image area */}
      <Link to={profileUrl} style={{ display: 'block', position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={photo} alt={`${vendor.name} photo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
      </Link>

      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <Link to={profileUrl} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.2, flex: 1, marginRight: '0.5rem' }}>{vendor.name}</h3>
            <span style={{ background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '99px', whiteSpace: 'nowrap', border: '1px solid rgba(200,150,60,0.3)' }}>{CAT[vendor.category] || vendor.category}</span>
          </div>
        </Link>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>📍 {vendor.city}</p>
        {vendor.status === 'unverified' && (
          <span style={{ fontSize: '0.68rem', color: '#fbbc05', background: 'rgba(251,188,5,0.12)', padding: '0.12rem 0.45rem', borderRadius: '99px', alignSelf: 'flex-start' }}>Unverified</span>
        )}
        {vendor.status === 'verified' && (
          <span style={{ fontSize: '0.68rem', color: '#4caf7d', background: 'rgba(76,175,125,0.12)', padding: '0.12rem 0.45rem', borderRadius: '99px', alignSelf: 'flex-start' }}>✓ Verified</span>
        )}
        {vendor.price_range && <p style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 500 }}>{vendor.price_range}</p>}

        {/* Action buttons row */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
          <Link to={profileUrl} style={{ flex: 1, textAlign: 'center', padding: '0.55rem', background: 'var(--gold-muted)', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '7px', color: 'var(--gold)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Profile →</Link>
          <button onClick={toggleShortlist} aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'} style={{ padding: '0.55rem 0.75rem', background: shortlisted ? 'rgba(200,150,60,0.15)' : 'transparent', border: `1px solid rgba(200,150,60,${shortlisted ? '0.4' : '0.25'})`, borderRadius: '7px', color: shortlisted ? 'var(--gold)' : 'var(--cream-muted)', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{shortlisted ? '♥' : '♡'}</button>
        </div>
      </div>
    </div>
  )
}
