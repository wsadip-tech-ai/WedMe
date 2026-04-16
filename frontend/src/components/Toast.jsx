import { useToastStore } from '../store/useToastStore'
export function Toast() {
  const toasts = useToastStore((s) => s.toasts)
  if (!toasts.length) return null
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem' }} aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', fontFamily: 'var(--font-body)', fontSize: '0.9rem', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.4)', background: t.type === 'error' ? '#c62828' : '#2e7d52', color: '#fff', border: `1px solid ${t.type === 'error' ? '#ef5350' : '#4caf7d'}`, maxWidth: '320px' }}>{t.message}</div>
      ))}
    </div>
  )
}
