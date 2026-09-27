import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as savedJobService from '../../api/savedJobService'
import useFetch from '../../hooks/useFetch'
import JobCard from '../../components/JobCard'
import Pagination from '../../components/Pagination'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { formatDate } from '../../utils/format'

const PAGE_SIZE = 10

export default function SavedJobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const [removingId, setRemovingId] = useState(null)
  const [actionError, setActionError] = useState('')

  const fetchSaved = useCallback(() => savedJobService.getSavedJobs({ page, limit: PAGE_SIZE }), [page])
  const { data, loading, error, reload } = useFetch(fetchSaved)

  const goToPage = (nextPage) => setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {})

  const handleRemove = async (jobId) => {
    setRemovingId(jobId)
    setActionError('')
    try {
      await savedJobService.unsaveJob(jobId)
      if (data.savedJobs.length === 1 && page > 1) goToPage(page - 1)
      else reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Saved jobs</h1>
          <p className="muted">Jobs you bookmarked to review later.</p>
        </div>
      </div>

      {actionError && (
        <div className="alert alert-error" role="alert">
          {actionError}
        </div>
      )}

      {loading && <Loader label="Loading saved jobs…" />}
      {!loading && error && <ErrorMessage message={error.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          {data.savedJobs.length === 0 ? (
            <EmptyState title="No saved jobs yet">
              <p className="muted">Use “Save job” on any job to keep it here.</p>
              <Link to="/jobs" className="btn btn-primary">
                Browse jobs
              </Link>
            </EmptyState>
          ) : (
            <div className="job-list">
              {data.savedJobs.map(({ _id, job, savedAt }) => (
                <div key={_id} className="saved-job">
                  <JobCard job={job} />
                  <div className="saved-job-footer">
                    <span className="muted small">Saved {formatDate(savedAt)}</span>
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => handleRemove(job._id)}
                      disabled={removingId === job._id}
                    >
                      {removingId === job._id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}
