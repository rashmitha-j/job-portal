import { Link, Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import ServerWakeBanner from './ServerWakeBanner'

export default function Layout() {
  // One-time messages passed via navigate(..., { state: { notice } })
  const notice = useLocation().state?.notice

  return (
    <div className="app-shell">
      <Navbar />
      <main className="container page">
        <ServerWakeBanner />
        {notice && (
          <div className="alert alert-info" role="status">
            {notice}
          </div>
        )}
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-brand">
            <span className="brand-mark" aria-hidden="true">J</span> JobPortal
          </p>
          <nav className="footer-links" aria-label="Footer">
            <Link to="/jobs">Browse jobs</Link>
          </nav>
          <p className="footer-copy">© {new Date().getFullYear()} JobPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
