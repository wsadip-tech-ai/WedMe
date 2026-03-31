import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useToastStore } from '../../store/useToastStore'
import { BUDGET_RANGES } from '../../lib/budgetRanges'

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = ['photography', 'makeup', 'catering', 'decor', 'music', 'mehendi', 'pandit', 'venue']
const TIERS = ['economy', 'mid', 'premium']
const TABS = ['profile', 'bookings', 'enquiries', 'packages', 'documents', 'chats']

const STATUS_BADGE = {
  unverified: { background: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  verified:   { background: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  suspended:  { background: 'rgba(220,80,80,0.12)', color: 'rgba(220,80,80,0.9)' },
}

const BOOKING_STATUS_BADGE = {
  pending:   { background: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  confirmed: { background: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  declined:  { background: 'rgba(220,53,69,0.15)', color: '#dc3545' },
  cancelled: { background: 'rgba(220,80,80,0.12)', color: 'rgba(220,80,80,0.9)' },
  completed: { background: 'rgba(76,175,125,0.1)', color: '#4caf7d' },
}

const ENQUIRY_STATUS_BADGE = {
  pending:   { background: 'rgba(251,188,5,0.15)', color: '#fbbc05' },
  replied:   { background: 'rgba(76,175,125,0.15)', color: '#4caf7d' },
  closed:    { background: 'rgba(180,180,180,0.12)', color: 'rgba(200,200,200,0.7)' },
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const card = {
  background: 'var(--void-2)',
  borderRadius: '12px',
  border: '1px solid rgba(200,150,60,0.12)',
  padding: '1.25rem',
}

const inputStyle = {
  background: 'var(--void-3)',
  border: '1px solid rgba(200,150,60,0.2)',
  borderRadius: '8px',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
  padding: '0.7rem 1rem',
  fontSize: '0.9rem',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  color: 'var(--cream-muted)',
  fontSize: '0.78rem',
  fontFamily: 'var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: '0.4rem',
  fontWeight: 600,
}

function StatusBadge({ status, map }) {
  const s = (map || STATUS_BADGE)[status] || { background: 'rgba(200,150,60,0.1)', color: 'var(--cream-muted)' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.25rem 0.7rem',
      borderRadius: '6px',
      fontSize: '0.78rem',
      fontWeight: 600,
      textTransform: 'capitalize',
      background: s.background,
      color: s.color,
    }}>
      {status || 'unknown'}
    </span>
  )
}

function EmptyState({ message }) {
  return (
    <p style={{ color: 'var(--cream-muted)', fontSize: '0.875rem', padding: '2rem 0', textAlign: 'center' }}>
      {message}
    </p>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminVendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useToastStore(s => s.show)

  const [vendor, setVendor] = useState(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Profile tab
  const [form, setForm] = useState({})

  // Bookings tab
  const [bookings, setBookings] = useState(null)

  // Enquiries tab
  const [enquiries, setEnquiries] = useState(null)

  // Packages tab
  const [packages, setPackages] = useState(null)

  // Chats tab
  const [chatSessions, setChatSessions] = useState(null)
  const [expandedChat, setExpandedChat] = useState(null)
  const [chatMessages, setChatMessages] = useState({})

  // Documents tab
  const [pdfs, setPdfs] = useState(null)
  const [noteRow, setNoteRow] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // ── Fetch vendor ─────────────────────────────────────────────────────────

  async function fetchVendor() {
    setLoading(true)
    const { data, error } = await supabase
      .from('vendor_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      addToast('Failed to load vendor', 'error')
      navigate('/admin/vendors')
      return
    }

    setVendor(data)
    setForm({
      name: data.name || '',
      category: data.category || '',
      city: data.city || '',
      tier: data.tier || '',
      bio: data.bio || '',
      price_range: data.price_range || '',
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchVendor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ── Lazy tab data ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (activeTab === 'bookings' && bookings === null) fetchBookings()
    if (activeTab === 'enquiries' && enquiries === null) fetchEnquiries()
    if (activeTab === 'packages' && packages === null) fetchPackages()
    if (activeTab === 'documents' && pdfs === null) fetchDocuments()
    if (activeTab === 'chats' && chatSessions === null) fetchChatSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  async function fetchBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(full_name), packages(name, price_label)')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })

    if (error) addToast('Failed to load bookings', 'error')
    else setBookings(data || [])
  }

  async function fetchEnquiries() {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*, profiles(full_name)')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })

    if (error) addToast('Failed to load enquiries', 'error')
    else setEnquiries(data || [])
  }

  async function fetchPackages() {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('vendor_id', id)
      .order('display_order')

    if (error) addToast('Failed to load packages', 'error')
    else setPackages(data || [])
  }

  async function fetchDocuments() {
    const [{ data: pdfData, error: pdfErr }, { data: noteData, error: noteErr }] = await Promise.all([
      supabase.from('vendor_documents').select('*').eq('vendor_id', id).eq('type', 'pdf'),
      supabase.from('vendor_documents').select('*').eq('vendor_id', id).eq('type', 'note').maybeSingle(),
    ])

    if (pdfErr) addToast('Failed to load documents', 'error')
    else setPdfs(pdfData || [])

    if (!noteErr && noteData) {
      setNoteRow(noteData)
      setNoteText(noteData.text_content || '')
    } else {
      setNoteRow(null)
      setNoteText('')
    }
  }

  async function fetchChatSessions() {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*, profiles(full_name)')
      .eq('vendor_id', id)
      .order('created_at', { ascending: false })
    if (error) addToast('Failed to load chats', 'error')
    else setChatSessions(data || [])
  }

  async function fetchChatMessages(sessionId) {
    if (chatMessages[sessionId]) return // already loaded
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    setChatMessages(prev => ({ ...prev, [sessionId]: data || [] }))
  }

  // ── Status actions ────────────────────────────────────────────────────────

  async function updateStatus(newStatus) {
    const { error } = await supabase
      .from('vendor_listings')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      addToast('Status update failed', 'error')
    } else {
      addToast(`Vendor ${newStatus}`, 'success')
      fetchVendor()
    }
  }

  // ── Delete vendor ─────────────────────────────────────────────────────────

  async function handleDelete() {
    const confirmed = window.confirm(
      `This will permanently delete ${vendor.name} and all their data. This cannot be undone. Continue?`
    )
    if (!confirmed) return

    const { error } = await supabase.from('vendor_listings').delete().eq('id', id)

    if (error) {
      addToast('Delete failed', 'error')
    } else {
      addToast('Vendor deleted', 'success')
      navigate('/admin/vendors')
    }
  }

  // ── Profile save ──────────────────────────────────────────────────────────

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('vendor_listings')
      .update({ ...form })
      .eq('id', id)

    if (error) {
      addToast('Save failed', 'error')
    } else {
      addToast('Profile saved', 'success')
      fetchVendor()
    }
    setSaving(false)
  }

  function handleFormChange(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'category') updated.price_range = ''
      return updated
    })
  }

  // ── PDF upload ────────────────────────────────────────────────────────────

  async function handlePdfUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPdf(true)

    try {
      const path = `${id}/${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('vendor-documents')
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('vendor-documents')
        .getPublicUrl(path)

      const { error: insertErr } = await supabase
        .from('vendor_documents')
        .insert({ vendor_id: id, type: 'pdf', url: publicUrl, filename: file.name })

      if (insertErr) throw insertErr

      addToast('PDF uploaded', 'success')
      fetchDocuments()
    } catch (err) {
      addToast('PDF upload failed', 'error')
    } finally {
      setUploadingPdf(false)
      e.target.value = ''
    }
  }

  async function handlePdfRemove(doc) {
    try {
      const path = `${id}/${doc.filename}`
      await supabase.storage.from('vendor-documents').remove([path])
      await supabase.from('vendor_documents').delete().eq('id', doc.id)
      addToast('PDF removed', 'success')
      fetchDocuments()
    } catch {
      addToast('Failed to remove PDF', 'error')
    }
  }

  // ── Note save ─────────────────────────────────────────────────────────────

  async function handleNoteSave() {
    setSavingNote(true)

    try {
      if (noteRow) {
        const { error } = await supabase
          .from('vendor_documents')
          .update({ text_content: noteText })
          .eq('id', noteRow.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('vendor_documents')
          .insert({ vendor_id: id, type: 'note', text_content: noteText })
        if (error) throw error
      }
      addToast('Notes saved', 'success')
      fetchDocuments()
    } catch {
      addToast('Failed to save notes', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  function formatHour(h) {
    if (h == null) return null
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:00 ${period}`
  }

  // ─── Loading state ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
        Loading…
      </main>
    )
  }

  const badgeStyle = STATUS_BADGE[vendor.status] || {}

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }}>

      {/* ── Back link ── */}
      <Link
        to="/admin/vendors"
        style={{
          display: 'inline-block',
          color: 'var(--cream-muted)',
          fontSize: '0.82rem',
          fontFamily: 'var(--font-body)',
          textDecoration: 'none',
          marginBottom: '1.75rem',
          letterSpacing: '0.02em',
        }}
      >
        ← Back to Vendors
      </Link>

      {/* ── Header card ── */}
      <div style={{ ...card, marginBottom: '1.75rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}>
          {/* Name + meta */}
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.6rem,4vw,2rem)',
              fontWeight: 400,
              color: 'var(--cream)',
              margin: 0,
              marginBottom: '0.4rem',
            }}>
              {vendor.name}
            </h1>
            <p style={{
              color: 'var(--cream-muted)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-body)',
              margin: 0,
              marginBottom: '0.65rem',
              textTransform: 'capitalize',
            }}>
              {[vendor.category, vendor.city, vendor.tier].filter(Boolean).join(' · ')}
            </p>
            <StatusBadge status={vendor.status} map={STATUS_BADGE} />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {vendor.status === 'unverified' && (
              <button
                onClick={() => updateStatus('verified')}
                style={btnStyle('#4caf7d')}
              >
                Verify
              </button>
            )}
            {vendor.status !== 'suspended' && (
              <button
                onClick={() => updateStatus('suspended')}
                style={btnStyle('rgba(220,80,80,0.9)')}
              >
                Suspend
              </button>
            )}
            {vendor.status === 'suspended' && (
              <button
                onClick={() => updateStatus('verified')}
                style={btnStyle('#4caf7d')}
              >
                Restore
              </button>
            )}
            <button
              onClick={handleDelete}
              style={btnStyle('rgba(220,80,80,0.9)', true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid rgba(200,150,60,0.15)',
        marginBottom: '1.75rem',
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                color: isActive ? 'var(--gold)' : 'var(--cream-muted)',
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                padding: '0.6rem 1.1rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
                marginBottom: '-1px',
                transition: 'color 0.15s',
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ── */}

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSave}>
          <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
            <h2 style={sectionHeading}>Profile Details</h2>

            <div style={fieldGrid}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Category */}
              <div>
                <label style={labelStyle}>Category *</label>
                <select
                  required
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label style={labelStyle}>City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  style={inputStyle}
                />
              </div>

              {/* Tier */}
              <div>
                <label style={labelStyle}>Tier</label>
                <select
                  value={form.tier}
                  onChange={(e) => handleFormChange('tier', e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select tier</option>
                  {TIERS.map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Price range */}
              <div>
                <label style={labelStyle}>Price Range</label>
                <select
                  value={form.price_range}
                  onChange={(e) => handleFormChange('price_range', e.target.value)}
                  style={inputStyle}
                  disabled={!form.category}
                >
                  <option value="">{form.category ? 'Select price range' : 'Select a category first'}</option>
                  {(BUDGET_RANGES[form.category] || []).map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => handleFormChange('bio', e.target.value)}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={saving}
                style={primaryBtn}
              >
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bookings tab */}
      {activeTab === 'bookings' && (
        <div style={card}>
          <h2 style={sectionHeading}>Bookings</h2>
          {bookings === null ? (
            <EmptyState message="Loading bookings…" />
          ) : bookings.length === 0 ? (
            <EmptyState message="No bookings yet." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', color: 'var(--cream)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(200,150,60,0.15)' }}>
                    {['Customer', 'Date', 'Time', 'Status', 'Package', 'Budget'].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const dateStr = b.event_date
                      ? new Date(b.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Date TBD'
                    const timeStr = (b.start_hour != null && b.end_hour != null)
                      ? `${formatHour(b.start_hour)} – ${formatHour(b.end_hour)}`
                      : null

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(200,150,60,0.06)' }}>
                        <td style={tdStyle}>
                          <Link
                            to={`/admin/customers/${b.customer_id}`}
                            style={{ color: 'var(--gold)', textDecoration: 'none', fontWeight: 500 }}
                          >
                            {b.profiles?.full_name || 'Unknown'}
                          </Link>
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)' }}>{dateStr}</td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)', whiteSpace: 'nowrap' }}>
                          {timeStr || '—'}
                        </td>
                        <td style={tdStyle}>
                          <StatusBadge status={b.status} map={BOOKING_STATUS_BADGE} />
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)' }}>
                          {b.packages ? `${b.packages.name}${b.packages.price_label ? ` · ${b.packages.price_label}` : ''}` : '—'}
                        </td>
                        <td style={{ ...tdStyle, color: 'var(--cream-muted)', whiteSpace: 'nowrap' }}>
                          {b.budget_range || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Enquiries tab */}
      {activeTab === 'enquiries' && (
        <div style={card}>
          <h2 style={sectionHeading}>Enquiries</h2>
          {enquiries === null ? (
            <EmptyState message="Loading enquiries…" />
          ) : enquiries.length === 0 ? (
            <EmptyState message="No enquiries yet." />
          ) : (
            <div style={{ display: 'grid', gap: '0' }}>
              {enquiries.map((e, i) => (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    padding: '1rem 0',
                    borderBottom: i < enquiries.length - 1 ? '1px solid rgba(200,150,60,0.08)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--cream)', fontWeight: 500, fontSize: '0.9rem' }}>
                        {e.profiles?.full_name || 'Unknown Customer'}
                      </span>
                      <StatusBadge status={e.status} map={ENQUIRY_STATUS_BADGE} />
                    </div>
                    {e.message && (
                      <p style={{
                        color: 'var(--cream-muted)',
                        fontSize: '0.85rem',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {e.message}
                      </p>
                    )}
                  </div>
                  <span style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Packages tab */}
      {activeTab === 'packages' && (
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ ...sectionHeading, margin: 0 }}>Packages</h2>
            <span style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
              Read-only
            </span>
          </div>

          {packages === null ? (
            <div style={card}><EmptyState message="Loading packages…" /></div>
          ) : packages.length === 0 ? (
            <div style={card}><EmptyState message="No packages yet." /></div>
          ) : (
            packages.map((pkg) => (
              <div key={pkg.id} style={{ ...card, position: 'relative' }}>
                {pkg.featured && (
                  <span style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(200,150,60,0.18)',
                    color: 'var(--gold)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    fontFamily: 'var(--font-body)',
                  }}>
                    POPULAR
                  </span>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'baseline', marginBottom: '0.4rem' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 400,
                    fontSize: '1.15rem',
                    color: 'var(--cream)',
                    margin: 0,
                  }}>
                    {pkg.name}
                  </h3>
                  {pkg.price_label && (
                    <span style={{ color: 'var(--gold)', fontSize: '0.9rem', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                      {pkg.price_label}
                    </span>
                  )}
                  {pkg.duration && (
                    <span style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>
                      · {pkg.duration}
                    </span>
                  )}
                </div>
                {pkg.description && (
                  <p style={{ color: 'var(--cream-muted)', fontSize: '0.875rem', margin: 0, lineHeight: 1.6, fontFamily: 'var(--font-body)' }}>
                    {pkg.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* PDF section */}
          <div style={card}>
            <h2 style={sectionHeading}>PDF Documents</h2>
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-body)', marginBottom: '1.25rem' }}>
              Upload brochures, menus, or portfolios for AI chatbot knowledge.
            </p>

            {/* PDF list */}
            {pdfs === null ? (
              <EmptyState message="Loading documents…" />
            ) : pdfs.length === 0 ? (
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>No PDFs uploaded yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {pdfs.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--void-3)',
                      borderRadius: '8px',
                      padding: '0.65rem 1rem',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <span style={{ color: 'rgba(220,80,80,0.8)', fontSize: '0.9rem' }}>PDF</span>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: 'var(--cream)',
                          fontSize: '0.875rem',
                          fontFamily: 'var(--font-body)',
                          textDecoration: 'none',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.filename}
                      </a>
                    </div>
                    <button
                      onClick={() => handlePdfRemove(doc)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(220,80,80,0.8)',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontFamily: 'var(--font-body)',
                        flexShrink: 0,
                        padding: '0.2rem 0.4rem',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload input */}
            <div>
              <label style={{ ...labelStyle, cursor: 'pointer', display: 'inline-block' }}>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={uploadingPdf}
                  style={{ display: 'none' }}
                />
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(200,150,60,0.12)',
                  border: '1px solid rgba(200,150,60,0.25)',
                  borderRadius: '8px',
                  color: 'var(--gold)',
                  padding: '0.55rem 1.1rem',
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-body)',
                  cursor: uploadingPdf ? 'wait' : 'pointer',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}>
                  {uploadingPdf ? 'Uploading…' : '+ Upload PDF'}
                </span>
              </label>
            </div>
          </div>

          {/* Text notes section */}
          <div style={card}>
            <h2 style={sectionHeading}>Admin Notes</h2>
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', fontFamily: 'var(--font-body)', marginBottom: '1rem' }}>
              Free-form notes for AI chatbot context (e.g., special offerings, awards, important details).
            </p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              rows={8}
              placeholder="Enter notes about this vendor…"
              style={{ ...inputStyle, resize: 'vertical', marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleNoteSave}
                disabled={savingNote}
                style={primaryBtn}
              >
                {savingNote ? 'Saving…' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chats tab */}
      {activeTab === 'chats' && (
        <div style={card}>
          <h2 style={sectionHeading}>AI Chat Sessions</h2>
          {chatSessions === null ? (
            <EmptyState message="Loading chats…" />
          ) : chatSessions.length === 0 ? (
            <EmptyState message="No AI chat sessions yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {chatSessions.map(s => (
                <div key={s.id} style={{ background: 'var(--void-3)', borderRadius: '10px', border: '1px solid rgba(200,150,60,0.08)', overflow: 'hidden' }}>
                  <button
                    onClick={() => {
                      const next = expandedChat === s.id ? null : s.id
                      setExpandedChat(next)
                      if (next) fetchChatMessages(next)
                    }}
                    style={{ width: '100%', padding: '0.8rem 1rem', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}
                  >
                    <div>
                      <p style={{ color: 'var(--cream)', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{s.profiles?.full_name || 'Customer'}</p>
                      <p style={{ color: 'var(--cream-muted)', fontSize: '0.75rem' }}>{new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <span style={{ color: 'var(--cream-muted)' }}>{expandedChat === s.id ? '▲' : '▼'}</span>
                  </button>
                  {expandedChat === s.id && (
                    <div style={{ padding: '0 1rem 1rem', borderTop: '1px solid rgba(200,150,60,0.06)' }}>
                      {!chatMessages[s.id] ? (
                        <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', padding: '0.75rem 0' }}>Loading…</p>
                      ) : chatMessages[s.id].length === 0 ? (
                        <p style={{ color: 'var(--cream-muted)', fontSize: '0.82rem', padding: '0.75rem 0' }}>No messages.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.75rem' }}>
                          {chatMessages[s.id].map(m => (
                            <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'customer' ? 'flex-end' : 'flex-start' }}>
                              <div style={{
                                maxWidth: '80%', padding: '0.5rem 0.75rem',
                                background: m.role === 'customer' ? 'rgba(200,150,60,0.15)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${m.role === 'customer' ? 'rgba(200,150,60,0.2)' : 'rgba(200,150,60,0.06)'}`,
                                borderRadius: m.role === 'customer' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                              }}>
                                {m.role === 'assistant' && <p style={{ fontSize: '0.6rem', color: 'var(--cream-muted)', marginBottom: '0.15rem' }}>🤖 AI</p>}
                                <p style={{ color: 'var(--cream)', fontSize: '0.82rem', lineHeight: 1.5 }}>{m.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

// ─── Style constants (outside component to avoid re-creation) ─────────────────

const sectionHeading = {
  fontFamily: 'var(--font-display)',
  fontWeight: 400,
  fontSize: '1.2rem',
  color: 'var(--cream)',
  margin: 0,
  marginBottom: '1.25rem',
}

const fieldGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
}

const primaryBtn = {
  background: 'var(--gold)',
  border: 'none',
  borderRadius: '8px',
  color: 'var(--void)',
  padding: '0.65rem 1.5rem',
  fontSize: '0.9rem',
  fontWeight: 700,
  fontFamily: 'var(--font-body)',
  cursor: 'pointer',
  letterSpacing: '0.02em',
}

const thStyle = {
  textAlign: 'left',
  padding: '0.65rem 0.85rem',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  color: 'var(--cream-muted)',
  fontSize: '0.78rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
}

const tdStyle = {
  padding: '0.75rem 0.85rem',
  color: 'var(--cream)',
}

function btnStyle(color, isDanger = false) {
  return {
    background: isDanger ? 'rgba(220,80,80,0.1)' : `${color}1a`,
    border: `1px solid ${color}44`,
    borderRadius: '8px',
    color: color,
    padding: '0.45rem 1rem',
    fontSize: '0.82rem',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.02em',
  }
}
