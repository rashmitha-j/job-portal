import { Navigate, Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Loader } from './StatusMessage'

// Login/register pages: already-authenticated users are sent to the jobs page
export default function GuestRoute() {
  const { user, initializing } = useAuth()

  if (initializing) return <Loader label="Checking your session…" />
  if (user) return <Navigate to="/jobs" replace />

  return <Outlet />
}
