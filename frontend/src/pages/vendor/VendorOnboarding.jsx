import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'
import { BUDGET_RANGES } from '../../lib/budgetRanges'
const CATEGORIES = ['photography','makeup','catering','decor','music','mehendi','pandit','venue']
const TIERS = [{ value: 'economy', label: '🌿 Economy', desc: 'Budget-friendly' },{ value: 'mid', label: '⭐ Mid-Range', desc: 'Great value' },{ value: 'premium', label: '💎 Premium', desc: 'Luxury' }]
const f = { label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' }, input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box' }, select: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }, textarea: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' } }
export default function VendorOnboarding() {
  const { user } = useAuthStore()
  const show = useToastStore((s) => s.show)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'photography', city: '', tier: 'mid', bio: '', price_range: '' })
  function set(key, val) {
    setForm((p) => {
      const next = { ...p, [key]: val }
      if (key === 'category') next.price_range = ''
      return next
    })
  }
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.city.trim()) { show('Name and city are required', 'error'); return }
    setSaving(true)
    const { error } = await supabase.from('vendor_listings').insert({ ...form, owner_id: user.id })
    setSaving(false)
    if (error) { show(error.message, 'error'); return }
    show('Profile created! Welcome to WedMe.'); navigate('/vendor/dashboard')
  }
  return (
    <main style={{ maxWidth: '560px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.35rem' }}>Set Up Your Profile</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2.5rem' }}>Tell couples about your business</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="vo-name" style={f.label}>Business name *</label>
        <input id="vo-name" type="text" required value={form.name} onChange={(e) => set('name', e.target.value)} style={f.input} placeholder="e.g. Shutter & Bloom Photography" />
        <label htmlFor="vo-cat" style={f.label}>Category *</label>
        <select id="vo-cat" value={form.category} onChange={(e) => set('category', e.target.value)} style={f.select}>{CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}</select>
        <label htmlFor="vo-city" style={f.label}>City you serve *</label>
        <input id="vo-city" type="text" required value={form.city} onChange={(e) => set('city', e.target.value)} style={f.input} placeholder="e.g. Mumbai" />
        <fieldset style={{ border: 'none', marginBottom: '1.25rem', padding: 0 }}>
          <legend style={{ ...f.label, marginBottom: '0.75rem' }}>Service tier</legend>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
            {TIERS.map((t) => (<button key={t.value} type="button" onClick={() => set('tier', t.value)} aria-pressed={form.tier === t.value} style={{ padding: '0.75rem 0.5rem', border: form.tier === t.value ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)', borderRadius: '10px', background: form.tier === t.value ? 'var(--gold-muted)' : 'var(--void-3)', cursor: 'pointer', textAlign: 'center' }}><div style={{ fontSize: '0.85rem', color: form.tier === t.value ? 'var(--gold-light)' : 'var(--cream)', fontWeight: 600 }}>{t.label}</div><div style={{ fontSize: '0.7rem', color: 'var(--cream-muted)', marginTop: '0.2rem' }}>{t.desc}</div></button>))}
          </div>
        </fieldset>
        <label htmlFor="vo-bio" style={f.label}>About your service</label>
        <textarea id="vo-bio" rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} style={f.textarea} placeholder="Tell couples what makes your service special…" />
        <label htmlFor="vo-price" style={f.label}>Price range</label>
        <select id="vo-price" value={form.price_range} onChange={(e) => set('price_range', e.target.value)} style={f.select}>
          <option value="">— Select price range —</option>
          {(BUDGET_RANGES[form.category] || []).map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="submit" disabled={saving} style={{ width: '100%', padding: '0.85rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>{saving ? 'Creating profile…' : 'Create My Profile →'}</button>
      </form>
    </main>
  )
}
