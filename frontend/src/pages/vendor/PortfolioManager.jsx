import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

export default function PortfolioManager() {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)

  const [listing,   setListing]   = useState(null)
  const [photos,    setPhotos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [form,      setForm]      = useState({ album_name: 'Portfolio', caption: '', event_tag: '' })
  const fileRef = useRef()

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        setListing(data)
        supabase.from('portfolio_photos').select('*').eq('vendor_id', data.id).order('album_name').order('display_order')
          .then(({ data: p }) => { setPhotos(p || []); setLoading(false) })
      })
  }, [user])

  async function uploadPhoto(e) {
    const file = e.target.files?.[0]
    if (!file || !listing) return
    if (!form.album_name.trim()) { show('Please enter an album name', 'error'); return }

    setUploading(true)
    // Upload to Supabase Storage
    const path = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`
    const { data: stored, error: uploadErr } = await supabase.storage
      .from('vendor-photos')
      .upload(path, file, { upsert: false })

    if (uploadErr) { show(`Upload failed: ${uploadErr.message}`, 'error'); setUploading(false); fileRef.current.value = ''; return }

    const { data: { publicUrl } } = supabase.storage.from('vendor-photos').getPublicUrl(stored.path)

    const { data: inserted, error: dbErr } = await supabase.from('portfolio_photos').insert({
      vendor_id:     listing.id,
      url:           publicUrl,
      caption:       form.caption.trim() || null,
      album_name:    form.album_name.trim(),
      event_tag:     form.event_tag.trim() || null,
      display_order: photos.filter(p => p.album_name === form.album_name).length,
    }).select().single()

    setUploading(false)
    fileRef.current.value = ''

    if (dbErr) { show('Photo saved to storage but DB insert failed.', 'error'); return }
    setPhotos(prev => [...prev, inserted])
    show('Photo added!')
  }

  async function deletePhoto(photo) {
    // Extract storage path from URL
    const urlPath = photo.url.split('/vendor-photos/')[1]
    if (urlPath) await supabase.storage.from('vendor-photos').remove([urlPath])
    await supabase.from('portfolio_photos').delete().eq('id', photo.id)
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    show('Photo removed')
  }

  // Group by album
  const albums = {}
  photos.forEach(ph => {
    if (!albums[ph.album_name]) albums[ph.album_name] = []
    albums[ph.album_name].push(ph)
  })

  if (loading) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Loading…</p></main>
  if (!listing) return (
    <main style={page}>
      <p style={{ color: 'var(--cream-muted)' }}>Complete your vendor profile first before managing your portfolio.</p>
    </main>
  )

  return (
    <main style={page}>
      <h1 style={heading}>Portfolio Manager</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Upload photos of your past work, grouped by album.</p>

      {/* Upload form */}
      <div style={card}>
        <h2 style={subheading}>Add Photo</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={label}>Album Name *</label>
            <input
              type="text"
              value={form.album_name}
              onChange={e => setForm(f => ({ ...f, album_name: e.target.value }))}
              placeholder="e.g. Wedding Day, Reception"
              style={input}
            />
          </div>
          <div>
            <label style={label}>Caption</label>
            <input
              type="text"
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              placeholder="Brief description"
              style={input}
            />
          </div>
          <div>
            <label style={label}>Event Tag</label>
            <input
              type="text"
              value={form.event_tag}
              onChange={e => setForm(f => ({ ...f, event_tag: e.target.value }))}
              placeholder="e.g. Reception, Ceremony"
              style={input}
            />
          </div>
        </div>
        <label style={{ display: 'inline-block', padding: '0.7rem 1.5rem', background: uploading ? 'rgba(200,150,60,0.4)' : 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.9rem', cursor: uploading ? 'not-allowed' : 'pointer' }}>
          {uploading ? 'Uploading…' : '+ Upload Photo'}
          <input ref={fileRef} type="file" accept="image/*" onChange={uploadPhoto} disabled={uploading} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Albums */}
      {Object.keys(albums).length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🖼️</p>
          <p style={{ color: 'var(--cream-muted)' }}>No photos yet. Upload your first photo above.</p>
        </div>
      ) : (
        Object.entries(albums).map(([albumName, albumPhotos]) => (
          <div key={albumName} style={{ marginTop: '2rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '0.75rem', borderBottom: '1px solid rgba(200,150,60,0.12)', paddingBottom: '0.5rem' }}>
              {albumName} <span style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>({albumPhotos.length} photos)</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {albumPhotos.map(ph => (
                <div key={ph.id} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', background: 'var(--void-3)' }}>
                  <img src={ph.url} alt={ph.caption || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,9,6,0)', transition: 'background 180ms', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,9,6,0.6)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,9,6,0)'}
                  >
                    <button
                      onClick={() => deletePhoto(ph)}
                      style={{ opacity: 0, background: 'rgba(200,50,50,0.85)', border: 'none', color: '#fff', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', transition: 'opacity 180ms' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.parentElement.style.background = 'rgba(11,9,6,0.6)' }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0' }}
                    >
                      Delete
                    </button>
                  </div>
                  {ph.caption && <p style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(11,9,6,0.7)', color: 'var(--cream)', fontSize: '0.68rem', padding: '0.3rem 0.5rem', margin: 0 }}>{ph.caption}</p>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </main>
  )
}

const page      = { maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }
const card      = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(200,150,60,0.12)' }
const heading   = { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }
const subheading = { fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: '1rem' }
const label     = { display: 'block', fontSize: '0.75rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.06em' }
const input     = { width: '100%', padding: '0.65rem 0.9rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }
