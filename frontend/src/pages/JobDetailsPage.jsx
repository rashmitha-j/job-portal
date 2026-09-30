import { useCallback, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as jobService from '../api/jobService'
import useAuth from '../hooks/useAuth'
import useFetch from '../hooks/useFetch'
import { EmptyState, ErrorMessage, Loader } from '../components/StatusMessage'
import CandidateJobActions from '../components/CandidateJobActions'
import CompanyAvatar from '../components/CompanyAvatar'
import JobBadges from '../components/JobBadges'
import { formatDate, formatExperience, formatSalary } from '../utils/format'

export default function JobDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchJob = useCallback(() => jobService.getJob(id), [id])
  const { data: job, loading, error, reload } = useFetch(fetchJob)

  if (loading) return <Loader label="Loading job…" />

  if (error) {
    if (error.status === 404 || error.status === 400) {
      return (
        <EmptyState title="Job not found">
          <p className="muted">This job may have been removed.</p>
          <Link to="/jobs" className="btn btn-primary">
            Browse jobs
          </Link>
        </EmptyState>
      )
    }
    return <ErrorMessage message={error.message} onRetry={reload} />
  }

  // Only the recruiter who posted the job sees management controls (the API enforces this too)
  const isOwner = user?.role === 'recruiter' && user._id === job.recruiter
  const company = job.company

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setActionError('')
    try {
      await jobService.deleteJob(job._id)
      navigate('/recruiter/jobs', { state: { notice: `"${job.title}" was deleted.` } })
    } catch (err) {
      setActionError(err.message)
      setDeleting(false)
    }
  }

  return (
    <article className="job-details">
      <Link to="/jobs" className="back-link">
        ← Back to jobs
      </Link>

      <div className="details-layout">
        <div className="details-main">
          <header className="card details-header">
            <div className="details-title-row">
              <CompanyAvatar name={company?.name || job.title} size="lg" />
              <div className="details-title">
                <h1>{job.title}</h1>
                <p className="job-card-company">{company?.name}</p>
              </div>
            </div>
            <JobBadges workMode={job.workMode} jobType={job.jobType} />

            <dl className="details-facts">
              <div>
                <dt>Location</dt>
                <dd>{job.location}</dd>
              </div>
              <div>
                <dt>Experience</dt>
                <dd>{formatExperience(job.experience)}</dd>
              </div>
              <div className="fact-wide">
                <dt>Salary</dt>
                <dd className="details-salary">{formatSalary(job.salary)}</dd>
              </div>
              <div>
                <dt>Posted</dt>
                <dd>{formatDate(job.createdAt)}</dd>
              </div>
            </dl>

            {isOwner && (
              <div className="owner-actions">
                {actionError && (
                  <div className="alert alert-error" role="alert">
                    {actionError}
                  </div>
                )}
                <Link to={`/recruiter/jobs/${job._id}/edit`} className="btn btn-secondary">
                  Edit job
                </Link>
                <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting…' : 'Delete job'}
                </button>
              </div>
            )}
            {user?.role === 'candidate' && <CandidateJobActions jobId={job._id} />}

            {!user && (
              <div className="candidate-actions">
                <Link to="/login" state={{ from: location }} className="btn btn-primary">
                  Log in to apply
                </Link>
              </div>
            )}
          </header>

          <section className="card">
            <h2>Skills</h2>
            <ul className="tags">
              {job.skills.map((skill) => (
                <li key={skill} className="tag">
                  {skill}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h2>Job description</h2>
            <p className="prewrap">{job.description}</p>
          </section>
        </div>

        {company && (
          <aside className="card details-aside">
            <h2>About the company</h2>
            <div className="company-identity">
              {company.logo ? (
                <img src={company.logo} alt={`${company.name} logo`} className="company-logo" />
              ) : (
                <CompanyAvatar name={company.name} />
              )}
              <div>
                <p className="company-name">{company.name}</p>
                {company.location && <p className="muted small">{company.location}</p>}
              </div>
            </div>
            {company.description && <p className="prewrap">{company.description}</p>}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                Visit website ↗
              </a>
            )}
          </aside>
        )}
      </div>
    </article>
  )
}
