import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'

/**
 * Wraps a route requiring authentication.
 * @param {string} [role] - If provided, user must have this role (consumer | vendor).
 */
export function AuthGuard({ role, children }) {
  const { user, role: userRole, loading } = useAuthStore()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to="/" replace />

  return children
}
