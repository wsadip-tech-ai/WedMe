import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const EMPTY_FORM = { name: '', description: '', price_label: '', price_per_plate: '', duration: '', is_featured: false }

export default function PackageManager() {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)

  const [listing,  setListing]  = useState(null)
  const [category, setCategory] = useState(null)
  const [packages, setPackages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [editing,  setEditing]  = useState(null) // package id being edited
  const [saving,   setSaving]   = useState(false)

  const isCatering = category === 'catering'

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id, category').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        setListing(data)
        setCategory(data.category)
        supabase.from('packages').select('*').eq('vendor_id', data.id).order('display_order')
          .then(({ data: p }) => { setPackages(p || []); setLoading(false) })
      })
  }, [user])

  function startEdit(pkg) {
    setEditing(pkg.id)
    setForm({ name: pkg.name, description: pkg.description || '', price_label: pkg.price_label || '', price_per_plate: pkg.price_per_plate || '', duration: pkg.duration || '', is_featured: pkg.is_featured })
  }

  function cancelEdit() { setEditing(null); setForm(EMPTY_FORM) }

  async function savePackage(e) {
    e.preventDefault()
    if (!listing || !form.name.trim()) return
    setSaving(true)

    const payload = {
      name:            form.name.trim(),
      description:     form.description.trim() || null,
      price_label:     form.price_label.trim() || null,
      price_per_plate: isCatering && form.price_per_plate.trim() ? form.price_per_plate.trim() : null,
      duration:        form.duration.trim() || null,
      is_featured:     form.is_featured,
    }

    if (editing) {
      const { error } = await supabase.from('packages').update(payload).eq('id', editing)
      if (error) { show('Failed to update package', 'error'); setSaving(false); return }
      setPackages(prev => prev.map(p => p.id === editing ? { ...p, ...payload } : p))
      show('Package updated')
    } else {
      const { data, error } = await supabase.from('packages').insert({
        ...payload,
        vendor_id: listing.id,
        display_order: packages.length,
      }).select().single()
      if (error) { show('Failed to create package', 'error'); setSaving(false); return }
      setPackages(prev => [...prev, data])
      show('Package added!')
    }

    setSaving(false)
    cancelEdit()
  }

  async function deletePackage(id) {
    await supabase.from('packages').delete().eq('id', id)
    setPackages(prev => prev.filter(p => p.id !== id))
    show('Package removed')
  }

  if (loading) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Loading…</p></main>
  if (!listing) return <main style={page}><p style={{ color: 'var(--cream-muted)' }}>Set up your vendor profile first.</p></main>

  return (
    <main style={page}>
      <h1 style={heading}>Service Packages</h1>
      <p style={{ color: 'var(--cream-muted)', marginBottom: '2rem' }}>Define the packages you offer. Customers will see these on your profile.</p>

      {/* Form */}
      <div style={card}>
        <h2 style={subheading}>{editing ? 'Edit Package' : 'Add New Package'}</h2>
        <form onSubmit={savePackage}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={label}>Package Name *</label>
              <input required type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Silver Package" style={input} />
            </div>
            <div>
              <label style={label}>{isCatering ? 'Total Package Price' : 'Price'}</label>
              <input type="text" value={form.price_label} onChange={e => setForm(f => ({ ...f, price_label: e.target.value }))} placeholder={isCatering ? 'e.g. NPR 1,50,000' : 'e.g. NPR 45,000'} style={input} />
            </div>
            {isCatering && (
              <div>
                <label style={label}>Price Per Plate</label>
                <input type="text" value={form.price_per_plate} onChange={e => setForm(f => ({ ...f, price_per_plate: e.target.value }))} placeholder="e.g. NPR 800/plate" style={input} />
              </div>
            )}
            <div>
              <label style={label}>Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 6 hours / Full day" style={input} />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={label}>Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What's included in this package?" style={{ ...input, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
            <label htmlFor="featured" style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', cursor: 'pointer' }}>Mark as popular / featured</label>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" disabled={saving} style={goldBtn}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Package'}</button>
            {editing && <button type="button" onClick={cancelEdit} style={ghostBtn}>Cancel</button>}
          </div>
        </form>
      </div>

      {/* Package list */}
      {packages.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', marginTop: '1.5rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📦</p>
          <p style={{ color: 'var(--cream-muted)' }}>No packages yet. Add your first one above.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {packages.map(pkg => (
            <div key={pkg.id} style={{ ...card, position: 'relative', border: pkg.is_featured ? '1px solid rgba(200,150,60,0.5)' : '1px solid rgba(200,150,60,0.12)' }}>
              {pkg.is_featured && (
                <span style={{ position: 'absolute', top: '-1px', right: '1rem', background: 'var(--gold)', color: 'var(--void)', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0 0 6px 6px', letterSpacing: '0.08em' }}>POPULAR</span>
              )}
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--cream)', marginBottom: '0.3rem' }}>{pkg.name}</h3>
              {pkg.price_per_plate && <p style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '0.15rem' }}>{pkg.price_per_plate}</p>}
              {pkg.price_label && <p style={{ color: pkg.price_per_plate ? 'var(--cream-muted)' : 'var(--gold)', fontWeight: pkg.price_per_plate ? 400 : 600, fontSize: pkg.price_per_plate ? '0.82rem' : '1rem', marginBottom: '0.25rem' }}>{pkg.price_per_plate ? `Total: ${pkg.price_label}` : pkg.price_label}</p>}
              {pkg.duration    && <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', marginBottom: '0.5rem' }}>⏱ {pkg.duration}</p>}
              {pkg.description && <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>{pkg.description}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => startEdit(pkg)} style={{ ...ghostBtn, fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>Edit</button>
                <button onClick={() => deletePackage(pkg.id)} style={{ background: 'transparent', border: '1px solid rgba(220,80,80,0.3)', borderRadius: '6px', color: 'rgba(220,80,80,0.8)', cursor: 'pointer', fontSize: '0.78rem', padding: '0.35rem 0.75rem', fontFamily: 'var(--font-body)' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
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
const goldBtn   = { padding: '0.65rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' }
const ghostBtn  = { padding: '0.65rem 1.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.35)', borderRadius: '8px', color: 'var(--cream-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }
