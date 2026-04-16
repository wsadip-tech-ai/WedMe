import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock useAuthStore
const mockStore = vi.hoisted(() => ({
  user: null,
  role: null,
  loading: false,
}))

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => mockStore,
}))

const { AuthGuard } = await import('../components/AuthGuard.jsx')

function renderWithRouter(ui, { initialEntries = ['/protected'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/protected" element={ui} />
      </Routes>
    </MemoryRouter>
  )
}

describe('AuthGuard', () => {
  beforeEach(() => {
    mockStore.user = null
    mockStore.role = null
    mockStore.loading = false
  })

  it('renders nothing while loading', () => {
    mockStore.loading = true
    const { container } = renderWithRouter(
      <AuthGuard><div>Protected</div></AuthGuard>
    )
    expect(container.firstChild).toBeNull()
  })

  it('redirects to /login when no user', () => {
    renderWithRouter(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('renders children when user is authenticated with no role requirement', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'consumer'
    renderWithRouter(<AuthGuard><div>Protected</div></AuthGuard>)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })

  it('renders children when user role matches required role', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'vendor'
    renderWithRouter(<AuthGuard role="vendor"><div>Vendor Area</div></AuthGuard>)
    expect(screen.getByText('Vendor Area')).toBeInTheDocument()
  })

  it('redirects to / when user role does not match required role', () => {
    mockStore.user = { id: 'u1' }
    mockStore.role = 'consumer'
    renderWithRouter(<AuthGuard role="vendor"><div>Vendor Area</div></AuthGuard>)
    expect(screen.getByText('Home Page')).toBeInTheDocument()
  })
})
