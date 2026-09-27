import { useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as applicationService from '../../api/applicationService'
import useFetch from '../../hooks/useFetch'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { APPLICATION_STATUSES, STATUS_LABELS } from '../../constants/applicationStatus'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 10

export default function MyApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const status = APPLICATION_STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : ''

  const fetchApplications = useCallback(
    () => applicationService.getMyApplications({ page, limit: PAGE_SIZE, ...(status && { status }) }),
    [page, status],
  )
  const { data, loading, error, reload } = useFetch(fetchApplications)

  const setParams = (next) => {
    const params = {}
    if (next.status) params.status = next.status
    if (next.page > 1) params.page = String(next.page)
    setSearchParams(params)
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>My applications</h1>
          <p className="muted">Track the status of every job you applied to.</p>
        </div>
        <label className="filter-field inline-filter">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(e) => setParams({ status: e.target.value, page: 1 })} aria-label="Filter by status">
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && <Loader label="Loading applications…" />}
      {!loading && error && <ErrorMessage message={error.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {data.applications.length === 0 ? (
            <EmptyState title={status ? `No ${STATUS_LABELS[status].toLowerCase()} applications` : 'No applications yet'}>
              <Link to="/jobs" className="btn btn-primary">
                Browse jobs
              </Link>
            </EmptyState>
          ) : (
            <ul className="application-list">
              {data.applications.map((application) => (
                <li key={application._id} className="card application-row">
                  <div className="application-main">
                    {application.job ? (
                      <Link to={`/jobs/${application.job._id}`} className="list-title">
                        {application.job.title}
                      </Link>
                    ) : (
                      <span className="list-title">Job no longer available</span>
                    )}
                    <p className="muted">
                      {application.job?.company?.name}
                      {application.job?.location && ` · ${application.job.location}`}
                    </p>
                    <p className="muted small">
                      Applied {formatDate(application.appliedAt)} · Updated {formatDate(application.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </li>
              ))}
            </ul>
          )}
          <Pagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            onPageChange={(p) => setParams({ status, page: p })}
          />
        </>
      )}
    </section>
  )
}
