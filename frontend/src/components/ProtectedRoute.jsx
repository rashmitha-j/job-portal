import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { Loader } from './StatusMessage'

// Logged-out users go to /login (and come back afterwards);
// logged-in users without an allowed role go to the jobs page with a notice.
export default function ProtectedRoute({ roles }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return <Loader label="Checking your session…" />

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <Navigate to="/jobs" replace state={{ notice: 'You do not have access to that page.' }} />
    )
  }

  return <Outlet />
}
