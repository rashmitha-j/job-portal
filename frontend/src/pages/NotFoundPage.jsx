import { Link } from 'react-router-dom'
import { EmptyState } from '../components/StatusMessage'

export default function NotFoundPage() {
  return (
    <EmptyState title="Page not found">
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/jobs" className="btn btn-primary">
        Browse jobs
      </Link>
    </EmptyState>
  )
}
