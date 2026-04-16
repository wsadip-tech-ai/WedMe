# Sprint 4 — Vendor Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all vendor-side pages: onboarding form, dashboard with stats, profile editor with photo upload, and enquiry inbox.

**Architecture:** All pages behind `AuthGuard role="vendor"`. Photo upload goes to Supabase Storage bucket `vendor-photos/{userId}/{filename}` and URLs are appended to `vendor_listings.photo_urls`. Enquiry inbox reads from `enquiries` joined with `profiles`.

**Tech Stack:** React 18, Supabase JS SDK v2 (from/select/insert/update/storage/upload), inline styles with CSS vars.

---

## Task 1: Vendor Onboarding

**File:** `frontend/src/pages/vendor/VendorOnboarding.jsx`

- [ ] **Step 1: Write VendorOnboarding.jsx**

```jsx
// frontend/src/pages/vendor/VendorOnboarding.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const CATEGORIES = ['photography','makeup','catering','decor','music','mehendi','pandit','venue']
const TIERS = [
  { value: 'economy', label: '🌿 Economy', desc: 'Budget-friendly services' },
  { value: 'mid', label: '⭐ Mid-Range', desc: 'Great value for money' },
  { value: 'premium', label: '💎 Premium', desc: 'Luxury experiences' },
]

const fieldStyle = {
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
}

export default function VendorOnboarding() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'photography', city: '', tier: 'mid', bio: '', price_range: '' })

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.city.trim()) { show('Name and city are required', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('vendor_listings').insert({ ...form, owner_id: user.id })
    setSaving(false)
    if (error) { show(error.message, 'error'); return }
    show('Profile created! Welcome to WedMe.')
    navigate('/vendor/dashboard')
  }

  return (
    <main style={{ maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Set Up Your Profile</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Tell couples about your business</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name" style={fieldStyle.label}>Business name *</label>
        <input id="name" type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} style={fieldStyle.input} placeholder="e.g. Shutter & Bloom Photography" />

        <label htmlFor="category" style={fieldStyle.label}>Category *</label>
        <select id="category" value={form.category} onChange={(e) => set('category', e.target.value)} style={fieldStyle.select}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>

        <label htmlFor="city" style={fieldStyle.label}>City you serve *</label>
        <input id="city" type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} style={fieldStyle.input} placeholder="e.g. Mumbai" />

        <fieldset style={{ border: 'none', marginBottom: '1.25rem', padding: 0 }}>
          <legend style={{ ...fieldStyle.label, marginBottom: '0.75rem' }}>Service tier</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            {TIERS.map((t) => (
              <button key={t.value} type="button"
                onClick={() => set('tier', t.value)}
                aria-pressed={form.tier === t.value}
                style={{ padding: '0.75rem 0.5rem', border: form.tier === t.value ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)', borderRadius: '10px', background: form.tier === t.value ? 'var(--gold-muted)' : 'var(--void-3)', cursor: 'pointer', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', color: form.tier === t.value ? 'var(--gold-light)' : 'var(--cream)', fontWeight: 600 }}>{t.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--cream-muted)', marginTop: '0.2rem' }}>{t.desc}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <label htmlFor="bio" style={fieldStyle.label}>About your service</label>
        <textarea id="bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} style={fieldStyle.textarea} placeholder="Tell couples what makes your service special…" />

        <label htmlFor="priceRange" style={fieldStyle.label}>Price range</label>
        <input id="priceRange" type="text" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={fieldStyle.input} placeholder="e.g. ₹50K – ₹1.5L" />

        <button type="submit" disabled={saving} style={{ width: '100%', padding: '0.85rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
          {saving ? 'Creating profile…' : 'Create My Profile →'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/vendor/VendorOnboarding.jsx && git commit -m "feat(sprint-4): Vendor onboarding form"
```

---

## Task 2: Vendor Dashboard

**File:** `frontend/src/pages/vendor/VendorDashboard.jsx`

- [ ] **Step 1: Write VendorDashboard.jsx**

```jsx
// frontend/src/pages/vendor/VendorDashboard.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'

export default function VendorDashboard() {
  const { user } = useAuthStore()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enquiries, setEnquiries] = useState([])
  const [shortlistCount, setShortlistCount] = useState(0)

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('*').eq('owner_id', user.id).maybeSingle()
      .then(async ({ data }) => {
        setListing(data)
        if (data) {
          const [{ count: eCount }, { data: recent }, { count: sCount }] = await Promise.all([
            supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('vendor_id', data.id).eq('status', 'pending'),
            supabase.from('enquiries').select('*, profiles(full_name)').eq('vendor_id', data.id).order('created_at', { ascending: false }).limit(3),
            supabase.from('shortlists').select('*', { count: 'exact', head: true }).eq('vendor_id', data.id),
          ])
          setEnquiries(recent || [])
          setShortlistCount(sCount || 0)
        }
        setLoading(false)
      })
  }, [user])

  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'there'
  const card = { background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.15)', borderRadius: '12px', padding: '1.5rem' }

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>

  if (!listing) return (
    <main style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
      <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎪</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--cream)', marginBottom: '0.75rem' }}>Complete your profile</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Set up your vendor listing so couples can discover you.</p>
      <Link to="/vendor/onboarding" style={{ padding: '0.85rem 2rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none' }}>Set Up Profile →</Link>
    </main>
  )

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>
        Hello, {name} 👋
      </h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>{listing.name} — {listing.city}</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { num: enquiries.length > 0 ? '🔴' : '✓', label: `${enquiries.filter(e=>e.status==='pending').length} pending enquiries` },
          { num: shortlistCount, label: 'Times shortlisted' },
          { num: listing.tier, label: 'Service tier' },
        ].map((s, i) => (
          <div key={i} style={card}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1, marginBottom: '0.3rem' }}>{s.num}</div>
            <div style={{ color: 'var(--cream-muted)', fontSize: '0.85rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <Link to="/vendor/enquiries" style={{ padding: '0.7rem 1.5rem', background: 'var(--gold)', borderRadius: '8px', color: 'var(--void)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>📬 View Enquiries</Link>
        <Link to="/vendor/profile/edit" style={{ padding: '0.7rem 1.5rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.9rem' }}>✏️ Edit Profile</Link>
      </div>

      {enquiries.length > 0 && (
        <div style={card}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--cream)', marginBottom: '1rem' }}>Recent Enquiries</h2>
          {enquiries.map((e) => (
            <div key={e.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid rgba(200,150,60,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div>
                <p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{e.profiles?.full_name || 'Anonymous'}</p>
                <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '380px' }}>{e.message}</p>
              </div>
              <span style={{ background: e.status === 'pending' ? 'rgba(251,188,5,0.15)' : 'rgba(76,175,125,0.15)', color: e.status === 'pending' ? '#fbbc05' : 'var(--success)', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', flexShrink: 0 }}>{e.status}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/vendor/VendorDashboard.jsx && git commit -m "feat(sprint-4): Vendor dashboard with stats and enquiry preview"
```

---

## Task 3: Edit Profile with photo upload

**File:** `frontend/src/pages/vendor/EditProfile.jsx`

- [ ] **Step 1: Write EditProfile.jsx**

```jsx
// frontend/src/pages/vendor/EditProfile.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const CATEGORIES = ['photography','makeup','catering','decor','music','mehendi','pandit','venue']
const TIERS = ['economy','mid','premium']

const f = {
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.1rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
}

export default function EditProfile() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const [listing, setListing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'photography', city: '', tier: 'mid', bio: '', price_range: '', photo_urls: [] })

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('*').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) { setListing(data); setForm({ name: data.name, category: data.category, city: data.city, tier: data.tier, bio: data.bio || '', price_range: data.price_range || '', photo_urls: data.photo_urls || [] }) }
      })
  }, [user])

  function set(key, val) { setForm((prev) => ({ ...prev, [key]: val })) }

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

  async function removePhoto(url) {
    set('photo_urls', form.photo_urls.filter((u) => u !== url))
  }

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
        <label htmlFor="ep-name" style={f.label}>Business name *</label>
        <input id="ep-name" type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} style={f.input} />

        <label htmlFor="ep-category" style={f.label}>Category</label>
        <select id="ep-category" value={form.category} onChange={(e) => set('category', e.target.value)} style={f.select}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>

        <label htmlFor="ep-city" style={f.label}>City *</label>
        <input id="ep-city" type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} style={f.input} />

        <label htmlFor="ep-tier" style={f.label}>Service tier</label>
        <select id="ep-tier" value={form.tier} onChange={(e) => set('tier', e.target.value)} style={f.select}>
          {TIERS.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>

        <label htmlFor="ep-bio" style={f.label}>About your service</label>
        <textarea id="ep-bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} style={f.textarea} />

        <label htmlFor="ep-price" style={f.label}>Price range</label>
        <input id="ep-price" type="text" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.input} placeholder="e.g. ₹50K – ₹1.5L" />

        {/* Photo upload */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ ...f.label, marginBottom: '0.75rem' }}>Portfolio photos</p>
          {form.photo_urls.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.75rem' }}>
              {form.photo_urls.map((url) => (
                <div key={url} style={{ position: 'relative', width: '90px', height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
                  <img src={url} alt="Portfolio" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(url)} aria-label="Remove photo"
                    style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <label htmlFor="ep-photos" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', cursor: 'pointer', color: 'var(--gold)', fontSize: '0.85rem' }}>
            {uploading ? '⏳ Uploading…' : '📷 Add photos'}
            <input id="ep-photos" type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={(e) => e.target.files?.length && uploadPhotos(Array.from(e.target.files))} />
          </label>
        </div>

        <button type="submit" disabled={saving || uploading} style={{ width: '100%', padding: '0.85rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/vendor/EditProfile.jsx && git commit -m "feat(sprint-4): Edit profile with Supabase Storage photo upload"
```

---

## Task 4: Enquiry Inbox

**File:** `frontend/src/pages/vendor/EnquiryInbox.jsx`

- [ ] **Step 1: Write EnquiryInbox.jsx**

```jsx
// frontend/src/pages/vendor/EnquiryInbox.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const STATUS_COLORS = {
  pending: { bg: 'rgba(251,188,5,0.12)', color: '#fbbc05', border: 'rgba(251,188,5,0.3)' },
  read: { bg: 'rgba(200,150,60,0.12)', color: 'var(--gold)', border: 'rgba(200,150,60,0.3)' },
  replied: { bg: 'rgba(76,175,125,0.12)', color: 'var(--success)', border: 'rgba(76,175,125,0.3)' },
}

export default function EnquiryInbox() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const [listing, setListing] = useState(null)
  const [enquiries, setEnquiries] = useState([])
  const [filter, setFilter] = useState('All')
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle()
      .then(async ({ data }) => {
        if (!data) { setLoading(false); return }
        setListing(data)
        const { data: enqs } = await supabase
          .from('enquiries')
          .select('*, profiles(full_name)')
          .eq('vendor_id', data.id)
          .order('created_at', { ascending: false })
        setEnquiries(enqs || [])
        setLoading(false)
      })
  }, [user])

  async function markRead(id) {
    await supabase.from('enquiries').update({ status: 'read' }).eq('id', id)
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, status: 'read' } : e))
    show('Marked as read')
  }

  const filters = ['All', 'pending', 'read', 'replied']
  const shown = filter === 'All' ? enquiries : enquiries.filter((e) => e.status === filter)

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!listing) return <main style={{ padding: '4rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Set up your vendor profile first.</main>

  return (
    <main style={{ maxWidth: '760px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Enquiry Inbox</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>{enquiries.filter(e => e.status === 'pending').length} pending · {enquiries.length} total</p>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid rgba(200,150,60,0.12)', paddingBottom: '0.75rem' }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: filter === f ? '1px solid var(--gold)' : '1px solid transparent', background: filter === f ? 'var(--gold-muted)' : 'transparent', color: filter === f ? 'var(--gold)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', fontSize: '0.85rem', cursor: 'pointer' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {!shown.length ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--cream-muted)' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📬</p>
          <p>No enquiries {filter !== 'All' ? `with status "${filter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {shown.map((e) => {
            const col = STATUS_COLORS[e.status] || STATUS_COLORS.pending
            const isOpen = expanded === e.id
            return (
              <div key={e.id} style={{ background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.12)', borderRadius: '12px', overflow: 'hidden' }}>
                <button onClick={() => { setExpanded(isOpen ? null : e.id); if (!isOpen && e.status === 'pending') markRead(e.id) }}
                  style={{ width: '100%', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
                  <div>
                    <p style={{ color: 'var(--cream)', fontSize: '0.92rem', fontWeight: 500, marginBottom: '0.2rem' }}>{e.profiles?.full_name || 'Anonymous'}</p>
                    <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '400px' }}>{e.message}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '4px', background: col.bg, color: col.color, border: `1px solid ${col.border}` }}>{e.status}</span>
                    <span style={{ color: 'var(--cream-muted)', fontSize: '0.75rem' }}>{new Date(e.created_at).toLocaleDateString('en-IN')}</span>
                    <span style={{ color: 'var(--cream-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>
                {isOpen && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: '1px solid rgba(200,150,60,0.08)' }}>
                    <p style={{ color: 'var(--cream)', lineHeight: 1.7, paddingTop: '1rem', fontSize: '0.92rem' }}>{e.message}</p>
                    {e.status === 'pending' && (
                      <button onClick={() => markRead(e.id)} style={{ marginTop: '0.75rem', padding: '0.45rem 1rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.35)', borderRadius: '6px', color: 'var(--gold)', fontFamily: 'var(--font-body)', fontSize: '0.82rem', cursor: 'pointer' }}>✓ Mark as Read</button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Build + checks**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6/frontend" && npm run build 2>&1 | tail -5 && npm run lint:a11y && npm run perf:smoke
```

- [ ] **Step 3: Commit**
```bash
cd "C:/Users/wsadi/.openclaw/workspace/paperclip-office/data/instances/default/workspaces/85915a1c-d37b-4bed-9763-f2773b9331b6" && git add -f frontend/src/pages/vendor/ && git commit -m "feat(sprint-4): Enquiry inbox with expand + mark-as-read"
```
