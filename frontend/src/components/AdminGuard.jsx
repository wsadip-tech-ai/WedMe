import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { useToastStore } from '../store/useToastStore'
import { ADMIN_EMAILS } from '../lib/constants'

export function AdminGuard({ children }) {
  const { user, loading } = useAuthStore()
  const show = useToastStore(s => s.show)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!ADMIN_EMAILS.includes(user.email)) {
    show('Access denied', 'error')
    return <Navigate to="/" replace />
  }

  return children
}
