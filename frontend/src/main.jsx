// frontend/src/main.jsx
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
} from 'react-router-dom'
import './styles/globals.css'

import { useAuthStore } from './store/useAuthStore'
import { supabase } from './lib/supabase'
import { AuthGuard } from './components/AuthGuard'
import { Nav } from './components/Nav'
import { Toast } from './components/Toast'

import LandingPage from './pages/LandingPage'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/consumer/Onboarding'
import Dashboard from './pages/consumer/Dashboard'
import VendorDiscovery from './pages/consumer/VendorDiscovery'
import VendorProfile from './pages/consumer/VendorProfile'
import Shortlist from './pages/consumer/Shortlist'
import VendorOnboarding from './pages/vendor/VendorOnboarding'
import VendorDashboard from './pages/vendor/VendorDashboard'
import EditProfile from './pages/vendor/EditProfile'
import EnquiryInbox from './pages/vendor/EnquiryInbox'
import PortfolioManager from './pages/vendor/PortfolioManager'
import PackageManager from './pages/vendor/PackageManager'
import AvailabilityManager from './pages/vendor/AvailabilityManager'
import BookingRequests from './pages/vendor/BookingRequests'
import MyBookings from './pages/consumer/MyBookings'
import AuthCallback from './pages/auth/AuthCallback'
import NotFound from './pages/NotFound'
import { AdminGuard } from './components/AdminGuard'
import { AdminNav } from './components/AdminNav'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminVendorList from './pages/admin/AdminVendorList'
import AdminVendorDetail from './pages/admin/AdminVendorDetail'
import AdminCustomerList from './pages/admin/AdminCustomerList'
import AdminCustomerDetail from './pages/admin/AdminCustomerDetail'

function AppRoot() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <>
      <Toast />
      <Nav />
      <div style={{ paddingTop: '60px' }}>
        <Outlet />
      </div>
    </>
  )
}

function AdminRoot() {
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setUser(session?.user ?? null) }
    )
    return () => subscription.unsubscribe()
  }, [setUser])

  return (
    <>
      <Toast />
      <AdminNav />
      <div style={{ paddingTop: '60px' }}>
        <Outlet />
      </div>
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <AdminRoot />,
    children: [
      { path: '/admin', element: <AdminGuard><AdminDashboard /></AdminGuard> },
      { path: '/admin/vendors', element: <AdminGuard><AdminVendorList /></AdminGuard> },
      { path: '/admin/vendors/:id', element: <AdminGuard><AdminVendorDetail /></AdminGuard> },
      { path: '/admin/customers', element: <AdminGuard><AdminCustomerList /></AdminGuard> },
      { path: '/admin/customers/:id', element: <AdminGuard><AdminCustomerDetail /></AdminGuard> },
    ],
  },
  {
    element: <AppRoot />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/auth/callback', element: <AuthCallback /> },

      // Consumer routes (require consumer role)
      {
        path: '/onboarding',
        element: <AuthGuard role="consumer"><Onboarding /></AuthGuard>,
      },
      {
        path: '/dashboard',
        element: <AuthGuard role="consumer"><Dashboard /></AuthGuard>,
      },
      {
        path: '/vendors',
        element: <VendorDiscovery />,
      },
      {
        path: '/vendors/:id',
        element: <VendorProfile />,
      },
      {
        path: '/shortlist',
        element: <AuthGuard role="consumer"><Shortlist /></AuthGuard>,
      },
      {
        path: '/my-bookings',
        element: <AuthGuard role="consumer"><MyBookings /></AuthGuard>,
      },

      // Vendor routes (require vendor role)
      {
        path: '/vendor/onboarding',
        element: <AuthGuard role="vendor"><VendorOnboarding /></AuthGuard>,
      },
      {
        path: '/vendor/dashboard',
        element: <AuthGuard role="vendor"><VendorDashboard /></AuthGuard>,
      },
      {
        path: '/vendor/profile/edit',
        element: <AuthGuard role="vendor"><EditProfile /></AuthGuard>,
      },
      {
        path: '/vendor/enquiries',
        element: <AuthGuard role="vendor"><EnquiryInbox /></AuthGuard>,
      },
      {
        path: '/vendor/portfolio',
        element: <AuthGuard role="vendor"><PortfolioManager /></AuthGuard>,
      },
      {
        path: '/vendor/packages',
        element: <AuthGuard role="vendor"><PackageManager /></AuthGuard>,
      },
      {
        path: '/vendor/availability',
        element: <AuthGuard role="vendor"><AvailabilityManager /></AuthGuard>,
      },
      {
        path: '/vendor/bookings',
        element: <AuthGuard role="vendor"><BookingRequests /></AuthGuard>,
      },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
