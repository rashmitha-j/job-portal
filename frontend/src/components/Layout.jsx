import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  // One-time messages passed via navigate(..., { state: { notice } })
  const notice = useLocation().state?.notice

  return (
    <>
      <Navbar />
      <main className="container page">
        {notice && (
          <div className="alert alert-info" role="status">
            {notice}
          </div>
        )}
        <Outlet />
      </main>
    </>
  )
}
