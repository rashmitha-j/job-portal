import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as candidateService from '../../api/candidateService'
import useFetch from '../../hooks/useFetch'
import StatusBadge from '../../components/StatusBadge'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { formatDate } from '../../utils/format'

export default function CandidateDashboardPage() {
  const fetchDashboard = useCallback(() => candidateService.getDashboard(), [])
  const { data, loading, error, reload } = useFetch(fetchDashboard)

  if (loading) return <Loader label="Loading your dashboard…" />
  if (error) return <ErrorMessage message={error.message} onRetry={reload} />

  const { user, profile, savedCount, applicationsCount, statusCounts, recentApplications } = data
  const inProgress = (statusCounts.shortlisted || 0) + (statusCounts.interview || 0)

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Welcome, {user.name}</h1>
          <p className="muted">Here's where your job search stands.</p>
        </div>
        <Link to="/jobs" className="btn btn-primary">
          Browse jobs
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="card profile-summary" aria-labelledby="completion-heading">
          <div className="profile-summary-header">
            <h2 id="completion-heading">Profile completion</h2>
            <strong>{profile.completion.percent}%</strong>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-valuenow={profile.completion.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completion"
          >
            <div className="progress-bar" style={{ width: `${profile.completion.percent}%` }} />
          </div>
          {profile.completion.missing.length > 0 ? (
            <p className="muted small">Missing: {profile.completion.missing.join(', ')}</p>
          ) : (
            <p className="muted small">Your profile is complete.</p>
          )}
          {!profile.hasResume && (
            <div className="alert alert-info">Upload a resume to start applying for jobs.</div>
          )}
          <p className="muted small">
            {user.email}
            {profile.location && ` · ${profile.location}`}
          </p>
          <Link to="/candidate/profile" className="btn btn-secondary btn-sm">
            {profile.exists ? 'Edit profile' : 'Create profile'}
          </Link>
        </section>

        <div className="stat-grid">
          <Link to="/candidate/applications" className="card stat-tile">
            <span className="stat-value">{applicationsCount}</span>
            <span className="stat-label">Applications</span>
          </Link>
          <Link to="/candidate/saved-jobs" className="card stat-tile">
            <span className="stat-value">{savedCount}</span>
            <span className="stat-label">Saved jobs</span>
          </Link>
          <div className="card stat-tile">
            <span className="stat-value">{inProgress}</span>
            <span className="stat-label">In progress</span>
          </div>
          <div className="card stat-tile">
            <span className="stat-value">{statusCounts.selected || 0}</span>
            <span className="stat-label">Selected</span>
          </div>
        </div>
      </div>

      <section className="card recent-applications" aria-labelledby="recent-heading">
        <div className="entry-section-header">
          <h2 id="recent-heading">Recent applications</h2>
          {applicationsCount > 0 && <Link to="/candidate/applications">View all →</Link>}
        </div>
        {recentApplications.length === 0 ? (
          <EmptyState title="No applications yet">
            <Link to="/jobs" className="btn btn-primary btn-sm">
              Find jobs to apply for
            </Link>
          </EmptyState>
        ) : (
          <ul className="simple-list">
            {recentApplications.map((application) => (
              <li key={application._id}>
                <div>
                  {application.job ? (
                    <Link to={`/jobs/${application.job._id}`} className="list-title">
                      {application.job.title}
                    </Link>
                  ) : (
                    <span className="list-title">Job no longer available</span>
                  )}
                  <p className="muted small">
                    {application.job?.company?.name} · Applied {formatDate(application.appliedAt)}
                  </p>
                </div>
                <StatusBadge status={application.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="quick-links" aria-label="Quick links">
        <Link to="/jobs" className="card quick-link">
          Browse Jobs
        </Link>
        <Link to="/candidate/profile" className="card quick-link">
          Profile
        </Link>
        <Link to="/candidate/saved-jobs" className="card quick-link">
          Saved Jobs
        </Link>
        <Link to="/candidate/applications" className="card quick-link">
          Applications
        </Link>
      </nav>
    </section>
  )
}
