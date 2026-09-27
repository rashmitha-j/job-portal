import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as jobService from '../api/jobService'
import useFetch from '../hooks/useFetch'
import JobCard from '../components/JobCard'
import JobFilters from '../components/JobFilters'
import { FILTER_KEYS } from '../constants/jobOptions'
import Pagination from '../components/Pagination'
import { EmptyState, ErrorMessage, Loader } from '../components/StatusMessage'

const PAGE_SIZE = 10

export default function JobsPage() {
  // Filters live in the URL so results are shareable and survive back/forward
  const [searchParams, setSearchParams] = useSearchParams()
  const paramsKey = searchParams.toString()

  const filters = useMemo(() => {
    const params = new URLSearchParams(paramsKey)
    return Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) || '']))
  }, [paramsKey])
  const page = Math.max(1, Number(new URLSearchParams(paramsKey).get('page')) || 1)

  const fetchJobs = useCallback(() => {
    const query = { page, limit: PAGE_SIZE }
    for (const key of FILTER_KEYS) {
      if (filters[key]) query[key] = filters[key]
    }
    return jobService.getJobs(query)
  }, [filters, page])

  const { data, loading, error, reload } = useFetch(fetchJobs)

  const applyFilters = (next) => {
    const params = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = next[key]?.trim()
      if (value) params.set(key, value)
    }
    setSearchParams(params)
  }

  const goToPage = (nextPage) => {
    const params = new URLSearchParams(paramsKey)
    params.set('page', String(nextPage))
    setSearchParams(params)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const total = data?.pagination.total ?? 0

  return (
    <section>
      <div className="page-header">
        <div>
          <h1>Find your next job</h1>
          <p className="muted">Browse openings from companies hiring now.</p>
        </div>
      </div>

      {/* Remount when applied filters change (e.g. back button) so inputs stay in sync */}
      <JobFilters key={FILTER_KEYS.map((k) => filters[k]).join('|')} filters={filters} onApply={applyFilters} />

      {loading && <Loader label="Loading jobs…" />}

      {!loading && error && <ErrorMessage message={error.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <p className="results-count muted">
            {total === 0 ? 'No jobs found' : `${total} job${total === 1 ? '' : 's'} found`}
          </p>

          {data.jobs.length === 0 ? (
            <EmptyState title="No jobs match your search">
              <p className="muted">Try different keywords or clear some filters.</p>
            </EmptyState>
          ) : (
            <div className="job-list">
              {data.jobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={goToPage} />
        </>
      )}
    </section>
  )
}
