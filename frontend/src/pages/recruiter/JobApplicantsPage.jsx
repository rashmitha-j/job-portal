import { useCallback, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import * as applicationService from '../../api/applicationService'
import useFetch from '../../hooks/useFetch'
import ApplicantCard from '../../components/ApplicantCard'
import Pagination from '../../components/Pagination'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../../constants/applicationStatus'

const PAGE_SIZE = 10

export default function JobApplicantsPage() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const status = APPLICATION_STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : ''

  const fetchApplicants = useCallback(
    () => applicationService.getJobApplicants(id, { page, limit: PAGE_SIZE, ...(status && { status }) }),
    [id, page, status],
  )
  const { data, loading, error, reload } = useFetch(fetchApplicants)

  // Tab counts adjusted locally after status changes; tied to the response they were based on,
  // so a refetch (page/filter change) starts again from the server's counts
  const [adjusted, setAdjusted] = useState({ source: null, counts: null })

  const handleStatusChange = (from, to) => {
    setAdjusted((prev) => {
      const base = prev.source === data ? prev.counts : data.statusCounts
      return {
        source: data,
        counts: { ...base, [from]: Math.max(0, (base[from] || 0) - 1), [to]: (base[to] || 0) + 1 },
      }
    })
  }

  const setParams = (next) => {
    const params = {}
    if (next.status) params.status = next.status
    if (next.page > 1) params.page = String(next.page)
    setSearchParams(params)
  }

  if (loading) return <Loader label="Loading applicants…" />

  if (error) {
    if ([400, 403, 404].includes(error.status)) {
      return (
        <EmptyState title={error.status === 403 ? 'You can only view applicants for jobs you posted' : 'Job not found'}>
          <Link to="/recruiter/jobs" className="btn btn-primary">
            Back to my jobs
          </Link>
        </EmptyState>
      )
    }
    return <ErrorMessage message={error.message} onRetry={reload} />
  }

  const { job, applications, pagination } = data
  const statusCounts = adjusted.source === data ? adjusted.counts : data.statusCounts
  const totalApplicants = Object.values(statusCounts).reduce((sum, n) => sum + n, 0)

  return (
    <section>
      <Link to="/recruiter/jobs" className="back-link">
        ← Back to my jobs
      </Link>
      <div className="page-header">
        <div>
          <h1>Applicants</h1>
          <p className="muted">
            <Link to={`/jobs/${job._id}`}>{job.title}</Link> · {totalApplicants} applicant{totalApplicants === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="status-tabs" role="group" aria-label="Filter applicants by status">
        <button
          type="button"
          className={`chip ${status === '' ? 'chip-active' : ''}`}
          onClick={() => setParams({ status: '', page: 1 })}
          aria-pressed={status === ''}
        >
          All ({totalApplicants})
        </button>
        {APPLICATION_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${status === s ? 'chip-active' : ''}`}
            onClick={() => setParams({ status: s, page: 1 })}
            aria-pressed={status === s}
          >
            {STATUS_LABELS[s]} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {applications.length === 0 ? (
        <EmptyState title={status ? `No ${STATUS_LABELS[status].toLowerCase()} applicants` : 'No applicants yet'}>
          <p className="muted">Applications will appear here as candidates apply.</p>
        </EmptyState>
      ) : (
        <ul className="applicant-list">
          {applications.map((application) => (
            <ApplicantCard key={application._id} application={application} onStatusChange={handleStatusChange} />
          ))}
        </ul>
      )}

      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => setParams({ status, page: p })} />
    </section>
  )
}
