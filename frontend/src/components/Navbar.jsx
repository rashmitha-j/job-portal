import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  const handleLogout = () => {
    logout()
    close()
    navigate('/jobs')
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/jobs" className="brand" onClick={close}>
          JobPortal
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="main-nav"
          aria-label="Toggle navigation"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="main-nav" className={`nav ${open ? 'nav-open' : ''}`}>
          <NavLink to="/jobs" end onClick={close}>
            Browse Jobs
          </NavLink>

          {user?.role === 'recruiter' && (
            <>
              <NavLink to="/recruiter/jobs" onClick={close}>
                My Jobs
              </NavLink>
              <NavLink to="/recruiter/company" onClick={close}>
                Company
              </NavLink>
            </>
          )}

          {user?.role === 'candidate' && (
            <>
              <NavLink to="/candidate/dashboard" onClick={close}>
                Dashboard
              </NavLink>
              <NavLink to="/candidate/saved-jobs" onClick={close}>
                Saved Jobs
              </NavLink>
              <NavLink to="/candidate/applications" onClick={close}>
                My Applications
              </NavLink>
              <NavLink to="/candidate/profile" onClick={close}>
                Profile
              </NavLink>
            </>
          )}

          <div className="nav-auth">
            {user ? (
              <>
                <span className="nav-user">
                  {user.name} <span className="badge">{user.role}</span>
                </span>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={close}>
                  Log in
                </NavLink>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
