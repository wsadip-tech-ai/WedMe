import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// ── Supabase mock ─────────────────────────────────────────────────────────────
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: mockSelect,
    }),
  },
}))

// ── Auth store mock (no user) ─────────────────────────────────────────────────
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: () => ({ user: null }),
}))

// ── Toast store mock ──────────────────────────────────────────────────────────
vi.mock('../store/useToastStore', () => ({
  useToastStore: () => ({ show: vi.fn() }),
}))

const FAKE_VENDORS = [
  {
    id: 'v1',
    name: 'Lens & Light Studio',
    category: 'photography',
    city: 'Thamel, Kathmandu',
    price_range: 'NPR 40,000+',
    tier: 'mid',
    photo_urls: [],
  },
  {
    id: 'v2',
    name: 'Frame Stories Nepal',
    category: 'photography',
    city: 'Lazimpat, Kathmandu',
    price_range: 'NPR 60,000+',
    tier: 'premium',
    photo_urls: [],
  },
]

function setup() {
  // Chain: .select().eq().order().limit() → { data, error }
  mockLimit.mockResolvedValue({ data: FAKE_VENDORS, error: null })
  mockOrder.mockReturnValue({ limit: mockLimit })
  mockEq.mockReturnValue({ order: mockOrder })
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder })
  // For "All" tab: select().order().limit() — no .eq()
  mockOrder.mockReturnValue({ limit: mockLimit })

  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

// Dynamic import so mock is applied before module loads
const { default: LandingPage } = await import('../pages/LandingPage.jsx')

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hero headline', async () => {
    setup()
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
  })

  it('renders category filter pills', async () => {
    setup()
    expect(screen.getByRole('button', { name: /photography/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /venue/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /makeup/i })).toBeInTheDocument()
  })

  it('shows vendor cards after data loads', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Lens & Light Studio')).toBeInTheDocument()
    })
    expect(screen.getByText('Frame Stories Nepal')).toBeInTheDocument()
  })

  it('re-fetches when a category tab is clicked', async () => {
    setup()
    await waitFor(() => screen.getByText('Lens & Light Studio'))
    const venueBtn = screen.getByRole('button', { name: /venue/i })
    fireEvent.click(venueBtn)
    await waitFor(() => {
      expect(mockSelect).toHaveBeenCalledTimes(2)
    })
  })
})
