import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as jobService from '../../api/jobService'
import * as companyService from '../../api/companyService'
import useFetch from '../../hooks/useFetch'
import Pagination from '../../components/Pagination'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../../constants/jobOptions'
import { formatDate, formatSalary } from '../../utils/format'

const PAGE_SIZE = 10

// Resolves to null when the recruiter has no company yet
const fetchMyCompanyOrNull = () =>
  companyService.getMyCompany().catch((err) => {
    if (err.status === 404) return null
    throw err
  })

export default function RecruiterJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [deletingId, setDeletingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [actionNotice, setActionNotice] = useState('')

  const fetchData = useCallback(
    () =>
      Promise.all([fetchMyCompanyOrNull(), jobService.getMyJobs({ page, limit: PAGE_SIZE })]).then(
        ([company, result]) => ({ company, ...result }),
      ),
    [page],
  )
  const { data, loading, error, reload } = useFetch(fetchData)

  const goToPage = (nextPage) => setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {})

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return
    setDeletingId(job._id)
    setActionError('')
    setActionNotice('')
    try {
      await jobService.deleteJob(job._id)
      setActionNotice(`"${job.title}" was deleted.`)
      // Step back if the last job on this page was removed
      if (data.jobs.length === 1 && page > 1) goToPage(page - 1)
      else reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>My jobs</h1>
          <p className="muted">Jobs you have posted.</p>
        </div>
        {data?.company && (
          <Link to="/recruiter/jobs/new" className="btn btn-primary">
            + Post a job
          </Link>
        )}
      </div>

      {actionNotice && (
        <div className="alert alert-success" role="status">
          {actionNotice}
        </div>
      )}
      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {loading && <Loader label="Loading your jobs…" />}
      {!loading && error && <ErrorMessage message={error.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {!data.company && (
            <div className="alert alert-info">
              Create your company profile before posting jobs.{' '}
              <Link to="/recruiter/company">Set up company profile →</Link>
            </div>
          )}

          {data.jobs.length === 0 ? (
            <EmptyState title="You haven't posted any jobs yet">
              {data.company && (
                <Link to="/recruiter/jobs/new" className="btn btn-primary">
                  Post your first job
                </Link>
              )}
            </EmptyState>
          ) : (
            <ul className="recruiter-job-list">
              {data.jobs.map((job) => (
                <li key={job._id} className="card recruiter-job">
                  <div className="recruiter-job-info">
                    <Link to={`/jobs/${job._id}`} className="recruiter-job-title">
                      {job.title}
                    </Link>
                    <p className="muted">
                      {job.location} · {WORK_MODE_LABELS[job.workMode]} · {JOB_TYPE_LABELS[job.jobType]} ·{' '}
                      {formatSalary(job.salary)}
                    </p>
                    <p className="muted small">Posted {formatDate(job.createdAt)}</p>
                  </div>
                  <div className="recruiter-job-actions">
                    <Link to={`/recruiter/jobs/${job._id}/applicants`} className="btn btn-primary btn-sm">
                      Applicants ({job.applicantsCount ?? 0})
                    </Link>
                    <Link to={`/jobs/${job._id}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
                    <Link to={`/recruiter/jobs/${job._id}/edit`} className="btn btn-secondary btn-sm">
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(job)}
                      disabled={deletingId === job._id}
                    >
                      {deletingId === job._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}
