import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/useAuthStore'
import { useToastStore } from '../../store/useToastStore'

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WDAYS    = ['S','M','T','W','T','F','S']
const WDAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// ── SVG icons (no emojis) ──────────────────────────────────────────────────────
const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function AvailabilityManager() {
  const { user } = useAuthStore()
  const show     = useToastStore(s => s.show)

  const [listing,      setListing]      = useState(null)
  const [availability, setAvailability] = useState({})
  const [loading,      setLoading]      = useState(true)
  const [toggling,     setToggling]     = useState(new Set())
  const [view, setView] = useState(() => {
    const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }
  })
  const { y, m } = view
  const today = new Date(); today.setHours(0,0,0,0)

  const [selectedDate, setSelectedDate] = useState(null) // 'YYYY-MM-DD'
  const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
  function hourLabel(h) { return h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM` }

  useEffect(() => {
    if (!user) return
    supabase.from('vendor_listings').select('id').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) { setLoading(false); return }
        setListing(data)
        supabase.from('availability').select('date,start_hour,status').eq('vendor_id', data.id)
          .then(({ data: avail }) => {
            const map = {}
            ;(avail || []).forEach(r => {
              if (!map[r.date]) map[r.date] = {}
              map[r.date][r.start_hour] = r.status
            })
            setAvailability(map)
            setLoading(false)
          })
      })
  }, [user])

  function prevMonth() {
    setView(v => { const d = new Date(v.y, v.m - 1); return { y: d.getFullYear(), m: d.getMonth() } })
  }
  function nextMonth() {
    setView(v => { const d = new Date(v.y, v.m + 1); return { y: d.getFullYear(), m: d.getMonth() } })
  }

  function dateKey(day) {
    return `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  }

  function isPast(day) {
    return new Date(y, m, day) < today
  }

  function isToday(day) {
    const d = new Date(y, m, day)
    return d.getTime() === today.getTime()
  }

  function selectDate(day) {
    if (isPast(day)) return
    const key = dateKey(day)
    setSelectedDate(prev => prev === key ? null : key)
  }

  async function toggleHour(hour) {
    if (!listing || !selectedDate) return
    const dateSlots = availability[selectedDate] || {}
    const current = dateSlots[hour]
    const nextStatus = current === 'available' ? 'blocked' : current === 'blocked' ? null : 'available'

    const slotKey = `${selectedDate}-${hour}`
    setToggling(prev => new Set(prev).add(slotKey))

    if (nextStatus === null) {
      const { error } = await supabase.from('availability').delete()
        .match({ vendor_id: listing.id, date: selectedDate, start_hour: hour })
      if (!error) setAvailability(prev => {
        const n = { ...prev }
        if (n[selectedDate]) {
          const slots = { ...n[selectedDate] }
          delete slots[hour]
          if (Object.keys(slots).length === 0) delete n[selectedDate]
          else n[selectedDate] = slots
        }
        return n
      })
    } else {
      const { error } = await supabase.from('availability').upsert(
        { vendor_id: listing.id, date: selectedDate, start_hour: hour, end_hour: hour + 1, status: nextStatus },
        { onConflict: 'vendor_id,date,start_hour' }
      )
      if (!error) setAvailability(prev => ({
        ...prev,
        [selectedDate]: { ...(prev[selectedDate] || {}), [hour]: nextStatus }
      }))
      else show('Failed to update', 'error')
    }

    setToggling(prev => { const n = new Set(prev); n.delete(slotKey); return n })
  }

  // Keyboard navigation on the calendar grid
  function handleKeyDown(e, day) {
    const daysInMo = new Date(y, m + 1, 0).getDate()
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDate(day) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (day < daysInMo) focusCellDay(day + 1) }
    else if (e.key === 'ArrowLeft')  { e.preventDefault(); if (day > 1) focusCellDay(day - 1) }
    else if (e.key === 'ArrowDown')  { e.preventDefault(); if (day + 7 <= daysInMo) focusCellDay(day + 7) }
    else if (e.key === 'ArrowUp')    { e.preventDefault(); if (day - 7 >= 1) focusCellDay(day - 7) }
  }

  function focusCellDay(day) {
    const el = document.getElementById(`cal-day-${day}`)
    if (el) el.focus()
  }

  // Month stats for current view
  const monthPrefix = `${y}-${String(m+1).padStart(2,'0')}`
  const monthDates = Object.keys(availability).filter(k => k.startsWith(monthPrefix))
  let monthAvail = 0, monthBlocked = 0
  monthDates.forEach(d => {
    const slots = availability[d] || {}
    Object.values(slots).forEach(s => { if (s === 'available') monthAvail++; else if (s === 'blocked') monthBlocked++ })
  })

  const firstDow = new Date(y, m, 1).getDay()
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const totalSlots = daysInMo * 14
  const cells    = Array(firstDow).fill(null).concat(Array.from({ length: daysInMo }, (_,i) => i+1))

  if (loading) return (
    <main style={page}>
      <div style={skeleton} />
    </main>
  )
  if (!listing) return (
    <main style={page}>
      <p style={{ color: 'var(--cream-muted)' }}>Set up your vendor profile first.</p>
    </main>
  )

  return (
    <main style={page}>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .cal-cell { transition: none !important; }
        }
        .cal-cell:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
        }
        .cal-cell:not(:disabled):active {
          transform: scale(0.92);
        }
        .nav-btn:focus-visible {
          outline: 2px solid var(--gold);
          outline-offset: 2px;
          border-radius: 8px;
        }
        @media (max-width: 640px) {
          .avail-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={{ marginBottom: '0.35rem' }}>
        <h1 style={heading}>Availability Calendar</h1>
        <p style={{ color: 'var(--cream-muted)', fontSize: '0.9rem' }}>
          Click a date to manage hourly slots. Use arrow keys to navigate between days.
        </p>
      </div>

      {/* Legend strip */}
      <div style={legendStrip}>
        {[
          { color: 'rgba(200,150,60,0.25)', border: 'rgba(200,150,60,0.5)', text: 'var(--gold)', label: 'Available', hint: 'Customers can request a booking' },
          { color: 'rgba(160,40,40,0.22)', border: 'rgba(200,80,80,0.4)', text: 'rgba(220,90,90,0.9)', label: 'Blocked', hint: 'You are unavailable' },
          { color: 'rgba(255,255,255,0.04)', border: 'rgba(200,150,60,0.12)', text: 'var(--cream-muted)', label: 'Not set', hint: 'Click to mark available' },
        ].map(({ color, border, text, label, hint }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '16px', height: '16px', borderRadius: '5px', background: color, border: `1.5px solid ${border}`, flexShrink: 0 }} />
            <span style={{ color: 'var(--cream)', fontSize: '0.8rem', fontWeight: 500 }}>{label}</span>
            <span style={{ color: 'var(--cream-muted)', fontSize: '0.75rem', display: 'none' }} className="hint">{hint}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
          <span style={{ width: '16px', height: '16px', borderRadius: '5px', border: '2px solid var(--gold)', background: 'transparent', flexShrink: 0 }} />
          <span style={{ color: 'var(--cream)', fontSize: '0.8rem', fontWeight: 500 }}>Today</span>
        </div>
      </div>

      <div className="avail-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 240px', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Calendar ──────────────────────────────────────────── */}
        <div style={calCard}>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button
              onClick={prevMonth}
              className="nav-btn"
              aria-label="Previous month"
              style={navBtnStyle}
            >
              <ChevronLeft />
            </button>

            <div style={{ textAlign: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--cream)', letterSpacing: '0.02em' }}>
                {MONTHS[m]}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--cream-muted)', marginLeft: '0.5rem' }}>
                {y}
              </span>
            </div>

            <button
              onClick={nextMonth}
              className="nav-btn"
              aria-label="Next month"
              style={navBtnStyle}
            >
              <ChevronRight />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '6px' }}>
            {WDAYS.map((d, i) => (
              <div
                key={i}
                aria-label={WDAYS_FULL[i]}
                style={{
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(245,239,230,0.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '0.25rem 0',
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div
            role="grid"
            aria-label={`${MONTHS[m]} ${y} availability calendar`}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}
          >
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />

              const key      = dateKey(day)
              const dateSlots = availability[key] || {}
              const hourStatuses = Object.values(dateSlots)
              const hasAvailable = hourStatuses.includes('available')
              const hasBlocked   = hourStatuses.includes('blocked')
              const allAvailable = hourStatuses.length === 14 && hourStatuses.every(s => s === 'available')
              const past     = isPast(day)
              const todayDay = isToday(day)
              const isSelected = selectedDate === key

              const bg      = past          ? 'transparent'
                            : isSelected    ? 'rgba(200,150,60,0.35)'
                            : allAvailable  ? 'rgba(200,150,60,0.25)'
                            : hasAvailable  ? 'rgba(200,150,60,0.12)'
                            : hasBlocked    ? 'rgba(160,40,40,0.15)'
                            : 'rgba(255,255,255,0.04)'

              const textCol = past          ? 'rgba(245,239,230,0.2)'
                            : isSelected    ? 'var(--gold)'
                            : hasAvailable  ? 'var(--gold)'
                            : hasBlocked    ? 'rgba(220,90,90,0.9)'
                            : 'rgba(245,239,230,0.55)'

              const borderCol = isSelected  ? 'var(--gold)'
                              : todayDay    ? 'var(--gold)'
                              : hasAvailable ? 'rgba(200,150,60,0.25)'
                              : hasBlocked   ? 'rgba(200,80,80,0.2)'
                              : 'transparent'

              const hoverTitle = past ? '' : 'Click to manage hourly slots'

              const busy = toggling.has(key)

              return (
                <button
                  id={`cal-day-${day}`}
                  key={day}
                  role="gridcell"
                  className="cal-cell"
                  disabled={past || busy}
                  onClick={() => selectDate(day)}
                  onKeyDown={e => handleKeyDown(e, day)}
                  aria-label={`${day} ${MONTHS[m]} ${y}${hasAvailable || hasBlocked ? ', has slots set' : ''}${past ? ', past' : ''}`}
                  title={hoverTitle}
                  style={{
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '8px',
                    border: `1.5px solid ${borderCol}`,
                    background: bg,
                    color: textCol,
                    fontSize: '0.85rem',
                    fontWeight: hasAvailable || hasBlocked ? 600 : 400,
                    cursor: past ? 'default' : busy ? 'wait' : 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'background 140ms ease, border-color 140ms ease, color 140ms ease, transform 80ms ease',
                    opacity: busy ? 0.55 : 1,
                    position: 'relative',
                    outline: 'none',
                  }}
                  onMouseEnter={e => {
                    if (past || busy) return
                    const el = e.currentTarget
                    if (hasAvailable) el.style.background = 'rgba(200,150,60,0.32)'
                    else if (hasBlocked) el.style.background = 'rgba(160,40,40,0.32)'
                    else el.style.background = 'rgba(200,150,60,0.1)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = bg
                  }}
                >
                  {busy ? (
                    <span style={{
                      width: '12px', height: '12px', borderRadius: '50%',
                      border: '2px solid currentColor', borderTopColor: 'transparent',
                      display: 'inline-block',
                      animation: 'spin 600ms linear infinite',
                    }} />
                  ) : day}
                </button>
              )
            })}
          </div>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {selectedDate && !isPast(parseInt(selectedDate.split('-')[2])) && (
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(200,150,60,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Hourly Slots</p>
                  <p style={{ color: 'var(--cream)', fontSize: '0.95rem' }}>
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button onClick={async () => {
                    const rows = HOURS.map(h => ({ vendor_id: listing.id, date: selectedDate, start_hour: h, end_hour: h + 1, status: 'available' }))
                    const { error } = await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
                    if (!error) {
                      const allSlots = {}; HOURS.forEach(h => { allSlots[h] = 'available' })
                      setAvailability(prev => ({ ...prev, [selectedDate]: allSlots }))
                      show('All hours marked available')
                    }
                  }} style={slotActionBtn}>All Available</button>
                  <button onClick={async () => {
                    const { error } = await supabase.from('availability').delete().eq('vendor_id', listing.id).eq('date', selectedDate)
                    if (!error) {
                      setAvailability(prev => { const n = { ...prev }; delete n[selectedDate]; return n })
                      show('Day cleared')
                    }
                  }} style={{ ...slotActionBtn, color: 'rgba(220,90,90,0.85)', borderColor: 'rgba(200,80,80,0.25)' }}>Clear Day</button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {HOURS.map(h => {
                  const dateSlots = availability[selectedDate] || {}
                  const status = dateSlots[h]
                  const slotKey = `${selectedDate}-${h}`
                  const busy = toggling.has(slotKey)
                  const slotBg = status === 'available' ? 'rgba(200,150,60,0.2)' : status === 'blocked' ? 'rgba(160,40,40,0.2)' : 'rgba(255,255,255,0.04)'
                  const slotColor = status === 'available' ? 'var(--gold)' : status === 'blocked' ? 'rgba(220,90,90,0.9)' : 'rgba(245,239,230,0.55)'
                  const slotBorder = status === 'available' ? 'rgba(200,150,60,0.35)' : status === 'blocked' ? 'rgba(200,80,80,0.3)' : 'rgba(200,150,60,0.1)'
                  return (
                    <button key={h} onClick={() => toggleHour(h)} disabled={busy}
                      title={status === 'available' ? `${hourLabel(h)}: Mark blocked` : status === 'blocked' ? `${hourLabel(h)}: Clear` : `${hourLabel(h)}: Mark available`}
                      style={{ padding: '0.5rem 0.25rem', background: slotBg, border: `1px solid ${slotBorder}`, borderRadius: '6px', color: slotColor, fontSize: '0.72rem', fontWeight: status ? 600 : 400, cursor: busy ? 'wait' : 'pointer', fontFamily: 'var(--font-body)', opacity: busy ? 0.5 : 1, transition: 'background 140ms, color 140ms', outline: 'none', textAlign: 'center' }}>
                      {busy ? '…' : hourLabel(h)}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Right panel ───────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Month stats */}
          <div style={statCard}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              {MONTHS[m]} Summary
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <StatRow color="var(--gold)" count={monthAvail} label="available slots" />
              <StatRow color="rgba(220,90,90,0.9)" count={monthBlocked} label="blocked slots" />
              <StatRow color="rgba(245,239,230,0.35)" count={totalSlots - monthAvail - monthBlocked} label="not set" />
            </div>
          </div>

          {/* Quick actions */}
          <div style={statCard}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <QuickBtn label="Mark all weekdays available" onClick={() => bulkSetWeekdays('available', y, m, listing, setAvailability, show)} />
              <QuickBtn label="Block all weekends" onClick={() => bulkSetWeekends('blocked', y, m, listing, setAvailability, show)} />
              <QuickBtn label="Clear entire month" danger onClick={() => bulkClearMonth(y, m, listing, setAvailability, show)} />
            </div>
          </div>

          {/* Tip */}
          <div style={{ ...statCard, background: 'rgba(200,150,60,0.05)', borderColor: 'rgba(200,150,60,0.18)' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tip</p>
            <p style={{ color: 'var(--cream-muted)', fontSize: '0.8rem', lineHeight: 1.65 }}>
              Only hours marked <strong style={{ color: 'var(--gold)' }}>available</strong> appear bookable to customers.
              Click a date to manage its hourly slots.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}

// ── Stat row ──────────────────────────────────────────────────────────────────
function StatRow({ color, count, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color, lineHeight: 1, minWidth: '2rem', textAlign: 'right' }}>{count}</span>
      <span style={{ color: 'var(--cream-muted)', fontSize: '0.8rem' }}>{label}</span>
    </div>
  )
}

// ── Quick action button ───────────────────────────────────────────────────────
function QuickBtn({ label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left',
        padding: '0.5rem 0.75rem',
        background: danger ? 'rgba(160,40,40,0.1)' : 'rgba(200,150,60,0.07)',
        border: `1px solid ${danger ? 'rgba(200,80,80,0.25)' : 'rgba(200,150,60,0.2)'}`,
        borderRadius: '7px',
        color: danger ? 'rgba(220,90,90,0.85)' : 'var(--cream-muted)',
        fontSize: '0.78rem', cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'background 140ms, color 140ms',
        outline: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? 'rgba(160,40,40,0.2)' : 'rgba(200,150,60,0.14)'; e.currentTarget.style.color = danger ? 'rgba(220,90,90,1)' : 'var(--cream)' }}
      onMouseLeave={e => { e.currentTarget.style.background = danger ? 'rgba(160,40,40,0.1)' : 'rgba(200,150,60,0.07)'; e.currentTarget.style.color = danger ? 'rgba(220,90,90,0.85)' : 'var(--cream-muted)' }}
    >
      {label}
    </button>
  )
}

// ── Bulk helpers ──────────────────────────────────────────────────────────────
async function bulkUpsertHourly(dates, status, listing, setAvailability, show) {
  if (!dates.length) return
  const rows = []
  for (const date of dates) {
    for (let h = 8; h <= 21; h++) {
      rows.push({ vendor_id: listing.id, date, start_hour: h, end_hour: h + 1, status })
    }
  }
  const { error } = await supabase.from('availability').upsert(rows, { onConflict: 'vendor_id,date,start_hour' })
  if (!error) {
    setAvailability(prev => {
      const next = { ...prev }
      for (const date of dates) {
        const slots = {}
        for (let h = 8; h <= 21; h++) slots[h] = status
        next[date] = { ...(next[date] || {}), ...slots }
      }
      return next
    })
  }
  return !error
}

async function bulkSetWeekdays(status, y, m, listing, setAvailability, show) {
  if (!listing) return
  const today = new Date(); today.setHours(0,0,0,0)
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const dates = []
  for (let d = 1; d <= daysInMo; d++) {
    const date = new Date(y, m, d)
    if (date < today) continue
    const dow = date.getDay()
    if (dow >= 1 && dow <= 5) dates.push(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }
  const ok = await bulkUpsertHourly(dates, status, listing, setAvailability, show)
  if (ok) show(`${dates.length} weekdays × 14 hours marked as ${status}`)
}

async function bulkSetWeekends(status, y, m, listing, setAvailability, show) {
  if (!listing) return
  const today = new Date(); today.setHours(0,0,0,0)
  const daysInMo = new Date(y, m + 1, 0).getDate()
  const dates = []
  for (let d = 1; d <= daysInMo; d++) {
    const date = new Date(y, m, d)
    if (date < today) continue
    const dow = date.getDay()
    if (dow === 0 || dow === 6) dates.push(`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
  }
  const ok = await bulkUpsertHourly(dates, status, listing, setAvailability, show)
  if (ok) show(`${dates.length} weekend days ${status}`)
}

async function bulkClearMonth(y, m, listing, setAvailability, show) {
  if (!listing) return
  const prefix = `${y}-${String(m+1).padStart(2,'0')}`
  const { error } = await supabase.from('availability')
    .delete()
    .eq('vendor_id', listing.id)
    .gte('date', `${prefix}-01`)
    .lte('date', `${prefix}-31`)
  if (!error) {
    setAvailability(prev => {
      const next = { ...prev }
      Object.keys(next).filter(k => k.startsWith(prefix)).forEach(k => delete next[k])
      return next
    })
    show('Month cleared')
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const page       = { maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem' }
const heading    = { fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.3rem' }
const calCard    = { background: 'var(--void-2)', borderRadius: '16px', padding: '1.75rem', border: '1px solid rgba(200,150,60,0.14)' }
const statCard   = { background: 'var(--void-2)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(200,150,60,0.12)' }
const skeleton   = { background: 'var(--void-2)', borderRadius: '16px', height: '400px', opacity: 0.5 }
const navBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '40px', height: '40px',
  background: 'transparent',
  border: '1px solid rgba(200,150,60,0.25)',
  borderRadius: '8px',
  color: 'var(--gold)',
  cursor: 'pointer',
  transition: 'background 140ms, border-color 140ms',
  outline: 'none',
}
const legendStrip = {
  display: 'flex', flexWrap: 'wrap', gap: '1rem',
  margin: '1rem 0 1.5rem',
  padding: '0.75rem 1.25rem',
  background: 'var(--void-2)',
  borderRadius: '10px',
  border: '1px solid rgba(200,150,60,0.1)',
}
const slotActionBtn = {
  padding: '0.35rem 0.7rem', fontSize: '0.72rem',
  background: 'rgba(200,150,60,0.07)', border: '1px solid rgba(200,150,60,0.2)',
  borderRadius: '6px', color: 'var(--cream-muted)', cursor: 'pointer',
  fontFamily: 'var(--font-body)', outline: 'none',
}
