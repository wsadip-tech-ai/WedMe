import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'
import { BUDGET_RANGES } from '../../lib/budgetRanges'
import AIChatModal from './AIChatModal'

const TIER_LABEL = { economy: 'Economy', mid: 'Mid-Range', premium: 'Premium' }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WDAYS  = ['S','M','T','W','T','F','S']
const WDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// ── SVG chevrons ───────────────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ── Availability calendar (customer read-only) ─────────────────────────────────
function AvailCalendar({ availability, onSelectDate, onSelectTimeRange }) {
  const [view, setView]     = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [selected, setSelected] = useState(null) // 'YYYY-MM-DD'
  const [rangeStart, setRangeStart] = useState(null) // hour int (8-21)
  const [rangeEnd, setRangeEnd]     = useState(null) // hour int (9-22)

  const { y, m } = view
  const today    = new Date(); today.setHours(0,0,0,0)
  const firstDow = new Date(y, m, 1).getDay()
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const cells    = Array(firstDow).fill(null).concat(Array.from({ length: daysInMo }, (_,i) => i+1))

  function prev() { setView(v => { const d = new Date(v.y, v.m - 1); return { y: d.getFullYear(), m: d.getMonth() } }) }
  function next() { setView(v => { const d = new Date(v.y, v.m + 1); return { y: d.getFullYear(), m: d.getMonth() } }) }

  function keyOf(day) { return `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` }
  function isPast(day) { return new Date(y, m, day) < today }
  function isToday(day) { return new Date(y, m, day).getTime() === today.getTime() }

  function selectDay(day) {
    const key = keyOf(day)
    setSelected(prev => prev === key ? null : key)
    setRangeStart(null)
    setRangeEnd(null)
  }

  function clickHour(h) {
    const status = selectedSlots[h]
    if (status !== 'available') return

    if (rangeStart === null) {
      // First click — set start
      setRangeStart(h)
      setRangeEnd(h + 1)
    } else if (rangeEnd !== null && h >= rangeStart) {
      // Second click — extend to this hour (end = h+1 since it's end-exclusive)
      // Validate all hours in range are available
      let valid = true
      for (let hr = rangeStart; hr <= h; hr++) {
        if (selectedSlots[hr] !== 'available') { valid = false; break }
      }
      if (valid) {
        setRangeEnd(h + 1)
      }
    } else {
      // Click before start — reset
      setRangeStart(h)
      setRangeEnd(h + 1)
    }
  }

  const HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
  function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }
  const selectedSlots = selected ? (availability[selected] || {}) : {}
  const selectedAvailCount = Object.values(selectedSlots).filter(s => s === 'available').length

  const availableDays = cells.filter(d => {
    if (!d || isPast(d)) return false
    const slots = availability[keyOf(d)] || {}
    return Object.values(slots).includes('available')
  }).length

  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: reduce) { .avail-cell { transition: none !important; } }
        .avail-cell:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
        .avail-cell.can-book:active { transform: scale(0.9); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button
          onClick={prev}
          aria-label="Previous month"
          style={calNavBtn}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,150,60,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ChevronLeft />
        </button>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--cream)' }}>{MONTHS[m]}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--cream-muted)', marginLeft: '0.45rem' }}>{y}</span>
        </div>
        <button
          onClick={next}
          aria-label="Next month"
          style={calNavBtn}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,150,60,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Weekday labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '6px' }}>
        {WDAYS.map((d, i) => (
          <div key={i} aria-label={WDAYS_FULL[i]} style={{ textAlign: 'center', fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,239,230,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.2rem 0' }}>{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div role="grid" aria-label={`${MONTHS[m]} ${y} availability`} style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} role="gridcell" aria-hidden="true" />

          const key        = keyOf(day)
          const dateSlots  = availability[key] || {}
          const hourStatuses = Object.values(dateSlots)
          const hasAvailable = hourStatuses.includes('available')
          const hasBlocked   = hourStatuses.includes('blocked')
          const allAvailable = hourStatuses.length === 14 && hourStatuses.every(s => s === 'available')
          const past       = isPast(day)
          const todayDay   = isToday(day)
          const canBook    = hasAvailable && !past
          const isSelected = selected === key

          const bg = isSelected      ? 'var(--gold)'
                   : canBook && allAvailable ? 'rgba(200,150,60,0.28)'
                   : canBook          ? 'rgba(200,150,60,0.14)'
                   : hasBlocked && !hasAvailable ? 'rgba(140,30,30,0.15)'
                   : 'transparent'

          const textCol = isSelected ? 'var(--void)'
                        : past       ? 'rgba(245,239,230,0.18)'
                        : canBook    ? 'var(--gold)'
                        : hasBlocked && !hasAvailable ? 'rgba(200,70,70,0.6)'
                        : 'rgba(245,239,230,0.4)'

          const borderCol = isSelected  ? 'var(--gold)'
                          : todayDay    ? 'rgba(200,150,60,0.7)'
                          : canBook     ? 'rgba(200,150,60,0.3)'
                          : 'transparent'

          return (
            <button
              key={day}
              role="gridcell"
              className={`avail-cell${canBook ? ' can-book' : ''}`}
              disabled={!canBook}
              onClick={() => canBook && selectDay(day)}
              aria-label={`${day} ${MONTHS[m]}${hasAvailable ? ', available' : hasBlocked ? ', unavailable' : ''}${isSelected ? ', selected' : ''}`}
              aria-pressed={isSelected}
              title={canBook ? 'Click to select this date' : past ? 'Past date' : hasBlocked && !hasAvailable ? 'Unavailable' : undefined}
              style={{
                minHeight: '44px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '8px',
                border: `1.5px solid ${borderCol}`,
                background: bg,
                color: textCol,
                fontSize: '0.85rem',
                fontWeight: isSelected ? 700 : canBook ? 500 : 400,
                cursor: canBook ? 'pointer' : 'default',
                fontFamily: 'var(--font-body)',
                transition: 'background 130ms ease, border-color 130ms ease, color 130ms ease, transform 80ms ease',
                outline: 'none',
              }}
              onMouseEnter={e => { if (!canBook) return; e.currentTarget.style.background = isSelected ? 'var(--gold-light, #e5c26a)' : 'rgba(200,150,60,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.background = bg }}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(200,150,60,0.04)', borderRadius: '8px', border: '1px solid rgba(200,150,60,0.1)' }}>
        {[
          { bg: 'rgba(200,150,60,0.18)', border: 'rgba(200,150,60,0.3)', label: 'Available — click to book' },
          { bg: 'rgba(140,30,30,0.15)',  border: 'rgba(200,70,70,0.25)', label: 'Unavailable' },
          { bg: 'transparent',           border: 'rgba(200,150,60,0.7)', label: 'Today' },
        ].map(({ bg, border, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.73rem', color: 'var(--cream-muted)' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: bg, border: `1.5px solid ${border}`, flexShrink: 0, display: 'inline-block' }} />
            {label}
          </span>
        ))}
      </div>

      {/* Hourly availability preview — interactive time selection */}
      {selected && selectedAvailCount > 0 && (
        <div style={{ marginTop: '1.25rem', padding: '1rem 1.15rem', background: 'rgba(200,150,60,0.04)', borderRadius: '10px', border: '1px solid rgba(200,150,60,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Select Your Hours</p>
              <p style={{ color: 'var(--cream)', fontSize: '0.88rem' }}>
                {new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            {rangeStart !== null && rangeEnd !== null && (
              <button
                onClick={() => onSelectTimeRange(new Date(selected + 'T00:00:00'), rangeStart, rangeEnd)}
                style={{ padding: '0.5rem 1.1rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                Book {hourLabel(rangeStart)} – {hourLabel(rangeEnd)}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {HOURS.map(h => {
              const status = selectedSlots[h]
              const isAvail = status === 'available'
              const isBlocked = status === 'blocked'
              const inRange = rangeStart !== null && rangeEnd !== null && h >= rangeStart && h < rangeEnd
              const isStart = h === rangeStart

              const bg = inRange   ? 'rgba(200,150,60,0.4)'
                       : isAvail   ? 'rgba(200,150,60,0.15)'
                       : isBlocked ? 'rgba(140,30,30,0.12)'
                       : 'rgba(255,255,255,0.03)'
              const col = inRange   ? 'var(--cream)'
                        : isAvail   ? 'var(--gold)'
                        : isBlocked ? 'rgba(200,70,70,0.5)'
                        : 'rgba(245,239,230,0.25)'
              const bdr = inRange   ? 'var(--gold)'
                        : isAvail   ? 'rgba(200,150,60,0.25)'
                        : isBlocked ? 'rgba(200,70,70,0.15)'
                        : 'rgba(200,150,60,0.06)'

              return (
                <button key={h}
                  onClick={() => clickHour(h)}
                  disabled={!isAvail}
                  title={isAvail ? (rangeStart === null ? 'Click to set start time' : `Click to set end time (${hourLabel(h+1)})`) : isBlocked ? 'Unavailable' : ''}
                  style={{
                    padding: '0.45rem 0.2rem', textAlign: 'center', borderRadius: '6px',
                    fontSize: '0.68rem', fontWeight: inRange ? 700 : isAvail ? 500 : 400,
                    background: bg, color: col,
                    border: `1.5px solid ${bdr}`,
                    cursor: isAvail ? 'pointer' : 'default',
                    transition: 'background 130ms, border-color 130ms',
                    outline: 'none',
                  }}
                >
                  {hourLabel(h)}
                </button>
              )
            })}
          </div>

          {/* Selection hint */}
          <p style={{ marginTop: '0.6rem', fontSize: '0.73rem', color: 'var(--cream-muted)', textAlign: 'center' }}>
            {rangeStart === null
              ? `${selectedAvailCount} hours available — tap an available slot to start`
              : rangeEnd && rangeEnd - rangeStart >= 1
                ? `Selected: ${hourLabel(rangeStart)} – ${hourLabel(rangeEnd)} (${rangeEnd - rangeStart} hr${rangeEnd - rangeStart > 1 ? 's' : ''}) — tap another slot to adjust, or click Book`
                : 'Now tap another slot to set end time'
            }
          </p>

          {/* Reset link */}
          {rangeStart !== null && (
            <p style={{ textAlign: 'center', marginTop: '0.3rem' }}>
              <button onClick={() => { setRangeStart(null); setRangeEnd(null) }}
                style={{ background: 'none', border: 'none', color: 'var(--cream-muted)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}>
                Clear selection
              </button>
            </p>
          )}
        </div>
      )}

      {/* Available count for this month */}
      {availableDays > 0 && !selected && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gold)', textAlign: 'center' }}>
          {availableDays} date{availableDays !== 1 ? 's' : ''} available this month — click one to see hours
        </p>
      )}
    </div>
  )
}

const calNavBtn = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '44px', height: '44px',
  background: 'transparent',
  border: '1px solid rgba(200,150,60,0.22)',
  borderRadius: '8px',
  color: 'var(--gold)',
  cursor: 'pointer',
  transition: 'background 140ms',
  outline: 'none',
  padding: 0,
}

// Responsive CSS injected into profile page
const PROFILE_CSS = `
  .profile-album-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 0.75rem; }
  .profile-hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  @media (max-width: 480px) {
    .profile-album-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
    .profile-hero-actions { flex-direction: column; gap: 0.5rem; }
    .profile-hero-actions a, .profile-hero-actions button { width: 100%; text-align: center; box-sizing: border-box; }
  }
  @media (prefers-reduced-motion: reduce) {
    .avail-cell { transition: none !important; }
  }
`

// ── Enquiry modal ─────────────────────────────────────────────────────────────
function EnquiryModal({ vendor, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)
  const [message, setMessage]       = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!user) { show('Sign in to send an enquiry', 'error'); return }
    if (!message.trim()) { show('Please enter your question', 'error'); return }
    setSubmitting(true)

    const { error } = await supabase.from('enquiries').insert({
      vendor_id:    vendor.id,
      from_user_id: user.id,
      message:      message.trim(),
    })
    setSubmitting(false)
    if (error) { show('Failed to send enquiry. Please try again.', 'error'); return }
    show('Enquiry sent! The vendor will get back to you.')
    onSuccess()
  }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Ask a Question</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.25rem' }}>{vendor.name}</h2>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Send a general enquiry — no commitment required.</p>

        <form onSubmit={submit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={fieldLabel}>Your question or message</label>
            <textarea
              rows={5}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Hi, I have a question about your services…"
              style={textareaStyle}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={submitBtn}>
              {submitting ? 'Sending…' : 'Send Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Booking modal ──────────────────────────────────────────────────────────────
function BookingModal({ vendor, packages, availability, selectedDate, preStartHour, preEndHour, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)
  const [dateNotFixed, setDateNotFixed] = useState(!selectedDate)
  const [day, setDay]       = useState(selectedDate ? selectedDate.getDate() : '')
  const [month, setMonth]   = useState(selectedDate ? selectedDate.getMonth() : new Date().getMonth())
  const [year, setYear]     = useState(selectedDate ? selectedDate.getFullYear() : new Date().getFullYear())
  const [startHour, setStartHour] = useState(preStartHour != null ? String(preStartHour) : '')
  const [endHour, setEndHour]     = useState(preEndHour != null ? String(preEndHour) : '')
  const [budgetRange, setBudgetRange] = useState('')
  const [packageId, setPackageId] = useState('')
  const [note, setNote]           = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ALL_HOURS = [8,9,10,11,12,13,14,15,16,17,18,19,20,21]
  function hourLabel(h) { return h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h-12}:00 PM` }

  const dateStr = day && month !== '' && year
    ? `${year}-${String(Number(month) + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    : null

  const dateSlots = dateStr ? (availability[dateStr] || {}) : {}
  const availableHours = ALL_HOURS.filter(h => dateSlots[h] === 'available')
  const daysInMonth = month !== '' && year ? new Date(year, Number(month) + 1, 0).getDate() : 31
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const currentYear = new Date().getFullYear()

  async function submit(e) {
    e.preventDefault()
    if (!user) { show('Sign in to book', 'error'); return }
    if (!dateNotFixed && !dateStr) { show('Please select a date', 'error'); return }
    if (!dateNotFixed && startHour !== '' && endHour !== '' && Number(endHour) <= Number(startHour)) {
      show('End time must be after start time', 'error'); return
    }
    setSubmitting(true)
    const { error } = await supabase.from('bookings').insert({
      vendor_id:     vendor.id,
      customer_id:   user.id,
      package_id:    packageId || null,
      booking_date:  dateNotFixed ? null : dateStr,
      start_hour:    dateNotFixed || startHour === '' ? null : Number(startHour),
      end_hour:      dateNotFixed || endHour === '' ? null : Number(endHour),
      budget_range:  budgetRange || null,
      customer_note: note || null,
    })
    setSubmitting(false)
    if (error) { show('Booking failed. Please try again.', 'error'); return }
    show(dateNotFixed ? 'Interest registered! The vendor will reach out.' : 'Booking request sent! The vendor will confirm shortly.')
    onSuccess()
  }

  const budgetOptions = BUDGET_RANGES[vendor.category] || []

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <p style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          {dateNotFixed ? 'Register Interest' : 'Book a Date'}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.25rem' }}>{vendor.name}</h2>

        <form onSubmit={submit}>
          {/* Date not fixed toggle */}
          <div onClick={() => setDateNotFixed(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', padding: '0.6rem 0.8rem', background: dateNotFixed ? 'rgba(200,150,60,0.1)' : 'rgba(200,150,60,0.04)', borderRadius: '8px', border: `1px solid rgba(200,150,60,${dateNotFixed ? '0.3' : '0.12'})`, cursor: 'pointer', userSelect: 'none' }}>
            <div style={{ width: '36px', height: '20px', background: dateNotFixed ? 'var(--gold)' : 'rgba(200,150,60,0.2)', borderRadius: '10px', position: 'relative', transition: 'background 200ms', flexShrink: 0 }}>
              <div style={{ width: '16px', height: '16px', background: dateNotFixed ? 'var(--void)' : 'rgba(245,239,230,0.4)', borderRadius: '50%', position: 'absolute', top: '2px', left: dateNotFixed ? '18px' : '2px', transition: 'left 200ms' }} />
            </div>
            <span style={{ fontSize: '0.82rem', color: dateNotFixed ? 'var(--gold)' : 'var(--cream-muted)' }}>I don't have a fixed date yet</span>
          </div>

          {/* Date picker */}
          {!dateNotFixed && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Select Date</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select value={day} onChange={e => setDay(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Day</option>
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={month} onChange={e => { setMonth(e.target.value); setDay('') }} style={{ ...selectStyle, flex: 2 }}>
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={year} onChange={e => setYear(e.target.value)} style={{ ...selectStyle, flex: 1.2 }}>
                  <option value={currentYear}>{currentYear}</option>
                  <option value={currentYear + 1}>{currentYear + 1}</option>
                </select>
              </div>
            </div>
          )}

          {/* Time range */}
          {!dateNotFixed && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Time Range</label>
              {dateStr && availableHours.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--cream-muted)', marginBottom: '0.4rem', fontStyle: 'italic' }}>
                  Availability not published for this date — all hours shown
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select value={startHour} onChange={e => { setStartHour(e.target.value); if (endHour && Number(e.target.value) >= Number(endHour)) setEndHour('') }} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">Start</option>
                  {(availableHours.length > 0 ? availableHours : ALL_HOURS).map(h => (
                    <option key={h} value={h}>{hourLabel(h)}</option>
                  ))}
                </select>
                <span style={{ color: 'var(--cream-muted)', fontSize: '0.82rem' }}>to</span>
                <select value={endHour} onChange={e => setEndHour(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="">End</option>
                  {(availableHours.length > 0 ? availableHours : ALL_HOURS)
                    .filter(h => startHour === '' || h > Number(startHour))
                    .map(h => <option key={h+1} value={h + 1}>{hourLabel(h + 1 <= 22 ? h + 1 : 22)}</option>)
                  }
                </select>
              </div>
            </div>
          )}

          {/* Budget range */}
          {budgetOptions.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Your Budget</label>
              <select value={budgetRange} onChange={e => setBudgetRange(e.target.value)} style={selectStyle}>
                <option value="">— Not decided yet —</option>
                {budgetOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Package selector */}
          {packages.length > 0 && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={fieldLabel}>Select Package</label>
              <select value={packageId} onChange={e => setPackageId(e.target.value)} style={selectStyle}>
                <option value="">— No specific package —</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.price_label ? ` — ${p.price_label}` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Note */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={fieldLabel}>Note to vendor (optional)</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              placeholder={dateNotFixed ? "I'm interested in your services, my event is tentatively planned for…" : "Hi, I'd like to book your services for my event…"}
              style={textareaStyle} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={submitting} style={submitBtn}>
              {submitting ? 'Sending…' : dateNotFixed ? 'Register Interest' : 'Request Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function VendorProfile() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuthStore()
  const show       = useToastStore(s => s.show)

  const [vendor,      setVendor]      = useState(null)
  const [photos,      setPhotos]      = useState([])   // portfolio_photos rows
  const [packages,    setPackages]    = useState([])
  const [availability, setAvailability] = useState({}) // { 'YYYY-MM-DD': 'available'|'blocked' }
  const [shortlisted, setShortlisted] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [bookingDate,   setBookingDate]   = useState(null) // opens modal when set
  const [bookingStart,  setBookingStart]  = useState(null) // pre-selected start hour
  const [bookingEnd,    setBookingEnd]    = useState(null) // pre-selected end hour
  const [lightbox,      setLightbox]      = useState(null) // { url, caption }
  const [showEnquiry,   setShowEnquiry]   = useState(false)
  const [showAIChat,    setShowAIChat]    = useState(false)
  const [showBookNow,   setShowBookNow]   = useState(false)

  useEffect(() => {
    async function load() {
      const [
        { data: v },
        { data: p },
        { data: pkgs },
        { data: avail },
      ] = await Promise.all([
        supabase.from('vendor_listings').select('*').eq('id', id).single(),
        supabase.from('portfolio_photos').select('*').eq('vendor_id', id).order('album_name').order('display_order'),
        supabase.from('packages').select('*').eq('vendor_id', id).order('display_order'),
        supabase.from('availability').select('date,start_hour,status').eq('vendor_id', id),
      ])
      setVendor(v)
      setPhotos(p || [])
      setPackages(pkgs || [])
      const map = {}
      ;(avail || []).forEach(r => {
        if (!map[r.date]) map[r.date] = {}
        map[r.date][r.start_hour] = r.status
      })
      setAvailability(map)
      setLoading(false)
    }
    load()
    if (user) {
      supabase.from('shortlists').select('vendor_id').match({ user_id: user.id, vendor_id: id }).maybeSingle()
        .then(({ data }) => setShortlisted(!!data))
    }
  }, [id, user])

  async function toggleShortlist() {
    if (!user) { show('Sign in to shortlist vendors', 'error'); return }
    if (shortlisted) {
      await supabase.from('shortlists').delete().match({ user_id: user.id, vendor_id: id })
      setShortlisted(false); show('Removed from shortlist')
    } else {
      await supabase.from('shortlists').insert({ user_id: user.id, vendor_id: id })
      setShortlisted(true); show('Added to shortlist ♡')
    }
  }

  if (loading) return <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>Loading…</main>
  if (!vendor)  return (
    <main style={{ padding: '6rem 1.5rem', textAlign: 'center', color: 'var(--cream-muted)' }}>
      Vendor not found.{' '}
      <button onClick={() => navigate('/vendors')} style={{ color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer' }}>
        Browse vendors
      </button>
    </main>
  )

  // ── Hero photo: first portfolio photo, else first vendor photo_url
  const heroUrl = photos[0]?.url || vendor.photo_urls?.[0] || null

  // ── Group portfolio photos by album
  const albums = {}
  photos.forEach(ph => {
    if (!albums[ph.album_name]) albums[ph.album_name] = []
    albums[ph.album_name].push(ph)
  })
  const albumNames = Object.keys(albums)

  const hasCalendar = Object.keys(availability).length > 0

  return (
    <main style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '5rem' }}>
      <style>{PROFILE_CSS}</style>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(260px, 48vw, 480px)', overflow: 'hidden', marginBottom: '0' }}>
        {heroUrl ? (
          <img src={heroUrl} alt={vendor.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--void-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>🎪</div>
        )}
        {/* Gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,9,6,0.1) 0%, rgba(11,9,6,0.8) 75%, var(--void) 100%)' }} />
        {/* Vendor identity */}
        <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
            <span style={pill}>{vendor.category}</span>
            <span style={pillMuted}>{TIER_LABEL[vendor.tier] || vendor.tier}</span>
            <span style={pillMuted}>📍 {vendor.city}</span>
            {vendor.status === 'verified' && <span style={{ ...pill, background: 'rgba(76,175,125,0.15)', color: '#4caf7d', borderColor: 'rgba(76,175,125,0.3)' }}>✓ Verified</span>}
            {vendor.status === 'unverified' && <span style={{ ...pill, background: 'rgba(251,188,5,0.12)', color: '#fbbc05', borderColor: 'rgba(251,188,5,0.25)' }}>Unverified</span>}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 400, color: 'var(--cream)', lineHeight: 1.1, marginBottom: '0.75rem' }}>
            {vendor.name}
          </h1>
          <div className="profile-hero-actions">
            <button onClick={toggleShortlist} style={shortlistBtn(shortlisted)}>
              {shortlisted ? '♥ Shortlisted' : '♡ Shortlist'}
            </button>
            {hasCalendar && (
              <button
                onClick={() => document.getElementById('availability-section')?.scrollIntoView({ behavior: 'smooth' })}
                style={bookBtn}
              >
                Check Availability & Book
              </button>
            )}
            <button
              onClick={() => { if (!user) { show('Sign in to book', 'error'); return } setShowBookNow(true) }}
              style={enquiryBtn}
            >
              Book Now
            </button>
            <button
              onClick={() => { if (!user) { show('Sign in to chat', 'error'); return } setShowAIChat(true) }}
              style={{ ...enquiryBtn, background: 'rgba(200,150,60,0.12)', borderColor: 'rgba(200,150,60,0.35)' }}
            >
              🤖 Ask AI
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.5rem' }}>

        {/* ── About ─────────────────────────────────────────────── */}
        {(vendor.price_range || vendor.bio) && (
          <section style={{ ...card, marginTop: '2.5rem' }}>
            <h2 style={sectionTitle}>About</h2>
            {vendor.price_range && (
              <p style={{ color: 'var(--gold)', fontSize: '1.05rem', fontWeight: 500, marginBottom: vendor.bio ? '0.75rem' : 0 }}>
                {vendor.category === 'catering' ? `Starting from ${vendor.price_range}` : vendor.price_range}
              </p>
            )}
            {vendor.bio && <p style={{ color: 'var(--cream-muted)', lineHeight: 1.75 }}>{vendor.bio}</p>}
          </section>
        )}

        {/* ── Portfolio Albums ───────────────────────────────────── */}
        {albumNames.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <p style={eyebrow}>Portfolio</p>
            <h2 style={sectionHeading}>Our Work</h2>
            {albumNames.map(albumName => (
              <div key={albumName} style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(200,150,60,0.12)' }}>
                  {albumName}
                </h3>
                <div className="profile-album-grid">
                  {albums[albumName].map(ph => (
                    <div
                      key={ph.id}
                      onClick={() => setLightbox(ph)}
                      style={{ position: 'relative', aspectRatio: '4/3', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', background: 'var(--void-3)' }}
                    >
                      <img src={ph.url} alt={ph.caption || albumName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 300ms' }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                      {(ph.caption || ph.event_tag) && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,9,6,0)', transition: 'background 220ms', display: 'flex', alignItems: 'flex-end' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(11,9,6,0.55)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(11,9,6,0)'}
                        >
                          <div style={{ padding: '0.6rem 0.75rem', opacity: 0, transition: 'opacity 220ms' }}
                            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.parentElement.style.background = 'rgba(11,9,6,0.55)' }}
                            onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.parentElement.style.background = 'rgba(11,9,6,0)' }}
                          >
                            {ph.caption && <p style={{ color: 'var(--cream)', fontSize: '0.78rem', marginBottom: ph.event_tag ? '0.2rem' : 0 }}>{ph.caption}</p>}
                            {ph.event_tag && <span style={{ background: 'rgba(200,150,60,0.25)', color: 'var(--gold)', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{ph.event_tag}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Packages ──────────────────────────────────────────── */}
        {packages.length > 0 && (
          <section style={{ marginTop: '3rem' }}>
            <p style={eyebrow}>What we offer</p>
            <h2 style={sectionHeading}>Service Packages</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
              {packages.map(pkg => (
                <div key={pkg.id} style={{
                  ...card,
                  border: pkg.is_featured ? '1px solid rgba(200,150,60,0.5)' : '1px solid rgba(200,150,60,0.15)',
                  position: 'relative',
                }}>
                  {pkg.is_featured && (
                    <span style={{ position: 'absolute', top: '-1px', right: '1rem', background: 'var(--gold)', color: 'var(--void)', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '0 0 6px 6px', letterSpacing: '0.08em' }}>
                      POPULAR
                    </span>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', marginBottom: '0.4rem' }}>{pkg.name}</h3>
                  {pkg.price_per_plate && <p style={{ color: 'var(--gold)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.25rem' }}>{pkg.price_per_plate}</p>}
                  {pkg.price_label && <p style={{ color: pkg.price_per_plate ? 'var(--cream-muted)' : 'var(--gold)', fontSize: pkg.price_per_plate ? '0.85rem' : '1.05rem', fontWeight: pkg.price_per_plate ? 400 : 600, marginBottom: '0.5rem' }}>{pkg.price_per_plate ? `Total: ${pkg.price_label}` : pkg.price_label}</p>}
                  {pkg.duration && <p style={{ color: 'var(--cream-muted)', fontSize: '0.78rem', marginBottom: '0.6rem' }}>⏱ {pkg.duration}</p>}
                  {pkg.description && <p style={{ color: 'var(--cream-muted)', fontSize: '0.85rem', lineHeight: 1.65 }}>{pkg.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Availability Calendar ─────────────────────────────── */}
        <section id="availability-section" style={{ marginTop: '3rem' }}>
          <p style={eyebrow}>When we're free</p>
          <h2 style={sectionHeading}>Availability</h2>
          {hasCalendar ? (
            <div style={card}>
              <AvailCalendar
                availability={availability}
                onSelectDate={d => {
                  if (!user) { show('Sign in to book a date', 'error'); return }
                  setBookingStart(null)
                  setBookingEnd(null)
                  setBookingDate(d)
                }}
                onSelectTimeRange={(d, start, end) => {
                  if (!user) { show('Sign in to book a date', 'error'); return }
                  setBookingStart(start)
                  setBookingEnd(end)
                  setBookingDate(d)
                }}
              />
              {!user && (
                <p style={{ marginTop: '1rem', fontSize: '0.82rem', color: 'var(--cream-muted)', textAlign: 'center' }}>
                  <a href="/login" style={{ color: 'var(--gold)' }}>Sign in</a> to book an available date.
                </p>
              )}
            </div>
          ) : (
            <div style={{ ...card, textAlign: 'center', padding: '2.5rem' }}>
              <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</p>
              <p style={{ color: 'var(--cream-muted)', fontSize: '0.9rem' }}>This vendor hasn't published their availability yet. Contact them directly.</p>
            </div>
          )}
        </section>

      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {lightbox && (
        <div style={overlay} onClick={() => setLightbox(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption || ''} style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', display: 'block' }} />
            {(lightbox.caption || lightbox.event_tag) && (
              <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                {lightbox.caption && <p style={{ color: 'var(--cream)', fontSize: '0.9rem' }}>{lightbox.caption}</p>}
                {lightbox.event_tag && <span style={{ background: 'rgba(200,150,60,0.2)', color: 'var(--gold)', fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{lightbox.event_tag}</span>}
              </div>
            )}
            <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: '-1rem', right: '-1rem', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.3)', color: 'var(--cream)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
      )}

      {/* ── Booking Modal ─────────────────────────────────────────── */}
      {bookingDate && (
        <BookingModal
          vendor={vendor}
          packages={packages}
          availability={availability}
          selectedDate={bookingDate}
          preStartHour={bookingStart}
          preEndHour={bookingEnd}
          onClose={() => { setBookingDate(null); setBookingStart(null); setBookingEnd(null) }}
          onSuccess={() => { setBookingDate(null); setBookingStart(null); setBookingEnd(null) }}
        />
      )}

      {/* ── Book Now Modal ────────────────────────────────────────── */}
      {showBookNow && (
        <BookingModal
          vendor={vendor}
          packages={packages}
          availability={availability}
          selectedDate={null}
          onClose={() => setShowBookNow(false)}
          onSuccess={() => setShowBookNow(false)}
        />
      )}

      {/* ── Enquiry Modal ──────────────────────────────────────────── */}
      {showEnquiry && (
        <EnquiryModal
          vendor={vendor}
          onClose={() => setShowEnquiry(false)}
          onSuccess={() => setShowEnquiry(false)}
        />
      )}

      {/* ── AI Chat Modal ──────────────────────────────────────────── */}
      {showAIChat && (
        <AIChatModal
          vendor={vendor}
          onClose={() => setShowAIChat(false)}
        />
      )}
    </main>
  )
}

// ── Shared style objects ───────────────────────────────────────────────────────
const card       = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(200,150,60,0.12)' }
const eyebrow    = { fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.4rem' }
const sectionHeading = { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 400, color: 'var(--cream)', marginBottom: '1.5rem' }
const sectionTitle   = { fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream)', marginBottom: '0.75rem' }
const pill       = { background: 'var(--gold-muted)', color: 'var(--gold)', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '99px', border: '1px solid rgba(200,150,60,0.3)' }
const pillMuted  = { background: 'rgba(200,150,60,0.06)', color: 'rgba(245,239,230,0.7)', fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '99px' }
const shortlistBtn = (active) => ({
  padding: '0.6rem 1.2rem', background: 'transparent',
  border: `1px solid rgba(200,150,60,${active ? '0.7' : '0.4'})`,
  borderRadius: '8px', color: active ? 'var(--gold)' : 'var(--cream-muted)',
  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.88rem',
})
const bookBtn    = { padding: '0.6rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer' }
const enquiryBtn = { padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.4)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.88rem', cursor: 'pointer' }
const overlay    = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }
const modal      = { background: 'var(--void-2)', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '480px', border: '1px solid rgba(200,150,60,0.25)' }
const fieldLabel = { display: 'block', fontSize: '0.78rem', color: 'var(--cream-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }
const selectStyle = { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }
const textareaStyle = { width: '100%', padding: '0.75rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }
const cancelBtn  = { padding: '0.65rem 1.2rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.3)', borderRadius: '8px', color: 'var(--cream-muted)', cursor: 'pointer', fontFamily: 'var(--font-body)' }
const submitBtn  = { padding: '0.65rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' }
