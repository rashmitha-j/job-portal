import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as jobService from '../../api/jobService'
import * as companyService from '../../api/companyService'
import useFetch from '../../hooks/useFetch'
import JobForm from '../../components/JobForm'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'

export default function CreateJobPage() {
  const navigate = useNavigate()

  // Jobs are posted under the recruiter's company, so it must exist first
  const fetchCompany = useCallback(() => companyService.getMyCompany(), [])
  const { data: company, loading, error, reload } = useFetch(fetchCompany)

  const handleSubmit = async (payload) => {
    const job = await jobService.createJob(payload)
    navigate(`/jobs/${job._id}`, { state: { notice: 'Job posted successfully.' } })
  }

  if (loading) return <Loader />

  if (error?.status === 404) {
    return (
      <EmptyState title="Set up your company first">
        <p className="muted">Jobs are posted under your company profile.</p>
        <Link to="/recruiter/company" className="btn btn-primary">
          Create company profile
        </Link>
      </EmptyState>
    )
  }
  if (error) return <ErrorMessage message={error.message} onRetry={reload} />

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h1>Post a job</h1>
          <p className="muted">
            Posting as <strong>{company.name}</strong>
          </p>
        </div>
      </div>
      <JobForm submitLabel="Post job" onSubmit={handleSubmit} onCancel={() => navigate('/recruiter/jobs')} />
    </section>
  )
}
