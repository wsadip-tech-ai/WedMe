import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const BUDGETS = ['Under ₹5L', '₹5L – ₹15L', '₹15L – ₹50L', '₹50L+']
const EVENTS = ['Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception']
const s = {
  page: { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' },
  card: { width: '100%', maxWidth: '500px', background: 'var(--void-2)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '16px', padding: '2.5rem 2rem' },
  progress: { display: 'flex', gap: '0.4rem', marginBottom: '2rem' },
  dot: (active, done) => ({ flex: 1, height: '3px', borderRadius: '2px', background: done || active ? 'var(--gold)' : 'rgba(200,150,60,0.2)', transition: 'background 300ms' }),
  heading: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 400, color: 'var(--cream)', marginBottom: '0.4rem' },
  sub: { color: 'var(--cream-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' },
  label: { display: 'block', fontSize: '0.8rem', color: 'var(--cream-muted)', marginBottom: '0.35rem', letterSpacing: '0.06em', textTransform: 'uppercase' },
  input: { width: '100%', padding: '0.7rem 1rem', background: 'var(--void-3)', border: '1px solid rgba(200,150,60,0.2)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-body)', fontSize: '1rem', marginBottom: '1.25rem', outline: 'none', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.7rem', marginBottom: '1.5rem' },
  card2: (active) => ({ padding: '0.9rem', border: active ? '2px solid var(--gold)' : '1px solid rgba(200,150,60,0.2)', borderRadius: '10px', background: active ? 'var(--gold-muted)' : 'var(--void-3)', cursor: 'pointer', textAlign: 'center', fontSize: '0.85rem', color: active ? 'var(--gold-light)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', transition: 'all 200ms' }),
  checkRow: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.5rem' },
  chip: (active) => ({ padding: '0.45rem 1rem', border: active ? '1.5px solid var(--gold)' : '1px solid rgba(200,150,60,0.25)', borderRadius: '999px', background: active ? 'var(--gold-muted)' : 'transparent', cursor: 'pointer', fontSize: '0.85rem', color: active ? 'var(--gold-light)' : 'var(--cream-muted)', fontFamily: 'var(--font-body)', transition: 'all 200ms' }),
  row: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' },
  btn: { padding: '0.7rem 1.5rem', background: 'var(--gold)', border: 'none', borderRadius: '8px', color: 'var(--void)', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer' },
  backBtn: { padding: '0.7rem 1.25rem', background: 'transparent', border: '1px solid rgba(200,150,60,0.35)', borderRadius: '8px', color: 'var(--cream-muted)', fontFamily: 'var(--font-body)', cursor: 'pointer' },
}
export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [events, setEvents] = useState([])
  const navigate = useNavigate()
  function toggleEvent(e) { setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]) }
  function finish() { if (!events.length) return; localStorage.setItem('wedme_onboarding', JSON.stringify({ date, city, budget, events })); navigate('/dashboard') }
  return (
    <main style={s.page}>
      <div style={s.card}>
        <div style={s.progress}>{[0,1,2].map((i) => <div key={i} style={s.dot(step === i, step > i)} />)}</div>
        {step === 0 && (<><h1 style={s.heading}>Tell us about your wedding</h1><p style={s.sub}>Step 1 of 3 — Basic details</p><label htmlFor="weddingDate" style={s.label}>Wedding date</label><input id="weddingDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={s.input} /><label htmlFor="city" style={s.label}>Your city</label><input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} style={s.input} placeholder="e.g. Mumbai" /><div style={s.row}><button style={s.btn} onClick={() => setStep(1)}>Next →</button></div></>)}
        {step === 1 && (<><h1 style={s.heading}>What's your budget?</h1><p style={s.sub}>Step 2 of 3 — Budget range</p><div style={s.grid}>{BUDGETS.map((b) => (<button key={b} type="button" style={s.card2(budget === b)} onClick={() => setBudget(b)}>{b}</button>))}</div><div style={s.row}><button style={s.backBtn} onClick={() => setStep(0)}>← Back</button><button style={s.btn} onClick={() => setStep(2)} disabled={!budget}>Next →</button></div></>)}
        {step === 2 && (<><h1 style={s.heading}>Which events?</h1><p style={s.sub}>Step 3 of 3 — Select all that apply</p><div style={s.checkRow}>{EVENTS.map((e) => (<button key={e} type="button" style={s.chip(events.includes(e))} onClick={() => toggleEvent(e)}>{e}</button>))}</div><div style={s.row}><button style={s.backBtn} onClick={() => setStep(1)}>← Back</button><button style={s.btn} onClick={finish} disabled={!events.length}>Find Vendors →</button></div></>)}
      </div>
    </main>
  )
}
