import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'
import { BUDGET_RANGES } from '../../lib/budgetRanges'
const CATEGORIES = ['photography','makeup','catering','decor','music','mehendi','pandit','venue']
const TIERS = ['economy','mid','premium']
const f = { label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' }, input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', outline: 'none', boxSizing: 'border-box' }, select: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }, textarea: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' } }
export default function EditProfile() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const [listing, setListing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'photography', city: '', tier: 'mid', bio: '', price_range: '', photo_urls: [] })
  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('*').eq('owner_id', user.id).maybeSingle().then(({ data }) => {
      if (data) { setListing(data); setForm({ name: data.name, category: data.category, city: data.city, tier: data.tier, bio: data.bio || '', price_range: data.price_range || '', photo_urls: data.photo_urls || [] }) }
    })
  }, [user])
  function set(key, val) {
    setForm((p) => {
      const next = { ...p, [key]: val }
      if (key === 'category') next.price_range = ''
      return next
    })
  }
  async function uploadPhotos(files) {
    setUploading(true)
    const newUrls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('vendor-photos').upload(path, file, { upsert: false })
      if (error) { show(`Upload failed: ${error.message}`, 'error'); continue }
      const { data: { publicUrl } } = supabase.storage.from('vendor-photos').getPublicUrl(path)
      newUrls.push(publicUrl)
    }
    set('photo_urls', [...form.photo_urls, ...newUrls])
    setUploading(false)
    if (newUrls.length) show(`${newUrls.length} photo${newUrls.length > 1 ? 's' : ''} uploaded`)
  }
  async function removePhoto(url) { set('photo_urls', form.photo_urls.filter((u) => u !== url)) }
  async function handleSave(e) {
    e.preventDefault()
    if (!listing) return
    setSaving(true)
    const { error } = await supabase.from('vendor_listings').update({ ...form }).eq('id', listing.id)
    setSaving(false)
    if (error) { show(error.message, 'error'); return }
    show('Profile saved!')
  }
  if (!listing) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  return (
    <main style={{ maxWidth: '620px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Edit Profile</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Update your listing details</p>
      <form onSubmit={handleSave}>
        <label htmlFor="ep-name" style={f.label}>Business name *</label><input id="ep-name" type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} style={f.input} />
        <label htmlFor="ep-cat" style={f.label}>Category</label><select id="ep-cat" value={form.category} onChange={(e) => set('category', e.target.value)} style={f.select}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select>
        <label htmlFor="ep-city" style={f.label}>City *</label><input id="ep-city" type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} style={f.input} />
        <label htmlFor="ep-tier" style={f.label}>Service tier</label><select id="ep-tier" value={form.tier} onChange={(e) => set('tier', e.target.value)} style={f.select}>{TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}</select>
        <label htmlFor="ep-bio" style={f.label}>About your service</label><textarea id="ep-bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} style={f.textarea} />
        <label htmlFor="ep-price" style={f.label}>Price range</label>
        <select id="ep-price" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.select}>
          <option value="">— Select price range —</option>
          {(BUDGET_RANGES[form.category] || []).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ ...f.label, marginBottom: '0.75rem' }}>Portfolio photos</p>
          {form.photo_urls.length > 0 && (<div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>{form.photo_urls.map((url) => (<div key={url} style={{ position: 'relative', width: '90px', height: '70px', borderRadius: '6px', overflow: 'hidden' }}><img src={url} alt="Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /><button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo" style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button></div>))}</div>)}
          <label htmlFor="ep-photos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.85rem' }}>{uploading ? '⏳ Uploading…' : '📷 Add photos'}<input id="ep-photos" type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => e.target.files?.length && uploadPhotos(Array.from(e.target.files))} /></label>
        </div>
        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: '0.85rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>{saving ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </main>
  )
}
