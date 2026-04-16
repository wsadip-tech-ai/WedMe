import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// Mock supabase before importing the store
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

// Import after mock is set up
const { useAuthStore } = await import('../store/useAuthStore.js')

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useAuthStore.setState({ user: null, role: null, loading: true })
  })

  it('starts with null user and loading true', () => {
    const { result } = renderHook(() => useAuthStore())
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(true)
  })

  it('setUser populates user, role, and sets loading false', () => {
    const { result } = renderHook(() => useAuthStore())
    const fakeUser = { id: 'abc', user_metadata: { role: 'consumer' } }

    act(() => {
      result.current.setUser(fakeUser)
    })

    expect(result.current.user).toEqual(fakeUser)
    expect(result.current.role).toBe('consumer')
    expect(result.current.loading).toBe(false)
  })

  it('setUser with null clears state', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setUser(null)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('clearUser sets user and role to null, loading false', () => {
    const { result } = renderHook(() => useAuthStore())
    useAuthStore.setState({ user: { id: 'x' }, role: 'vendor', loading: false })

    act(() => {
      result.current.clearUser()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('signOut calls supabase.auth.signOut and clears state', async () => {
    const { supabase } = await import('../lib/supabase')
    const { result } = renderHook(() => useAuthStore())
    useAuthStore.setState({ user: { id: 'x' }, role: 'vendor', loading: false })

    await act(async () => {
      await result.current.signOut()
    })

    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })

  it('signOut clears state even if supabase.auth.signOut throws', async () => {
    const { supabase } = await import('../lib/supabase')
    supabase.auth.signOut.mockRejectedValueOnce(new Error('network error'))
    const { result } = renderHook(() => useAuthStore())
    useAuthStore.setState({ user: { id: 'x' }, role: 'consumer', loading: false })

    await act(async () => {
      await result.current.signOut()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.role).toBeNull()
  })
})
