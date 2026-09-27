import { useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as jobService from '../../api/jobService'
import useAuth from '../../hooks/useAuth'
import useFetch from '../../hooks/useFetch'
import JobForm from '../../components/JobForm'
import { EmptyState, ErrorMessage, Loader } from '../../components/StatusMessage'
import { jobToFormValues } from '../../utils/jobForm'

export default function EditJobPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const fetchJob = useCallback(() => jobService.getJob(id), [id])
  const { data: job, loading, error, reload } = useFetch(fetchJob)
  const initialValues = useMemo(() => (job ? jobToFormValues(job) : null), [job])

  const handleSubmit = async (payload) => {
    await jobService.updateJob(id, payload)
    navigate(`/jobs/${id}`, { state: { notice: 'Job updated successfully.' } })
  }

  if (loading) return <Loader label="Loading job…" />

  if (error?.status === 404 || error?.status === 400) {
    return (
      <EmptyState title="Job not found">
        <Link to="/recruiter/jobs" className="btn btn-primary">
          Back to my jobs
        </Link>
      </EmptyState>
    )
  }
  if (error) return <ErrorMessage message={error.message} onRetry={reload} />

  // The API rejects edits by anyone else; this just avoids showing a form that cannot be saved
  if (job.recruiter !== user._id) {
    return (
      <EmptyState title="You can only edit jobs you posted">
        <Link to="/recruiter/jobs" className="btn btn-primary">
          Back to my jobs
        </Link>
      </EmptyState>
    )
  }

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h1>Edit job</h1>
          <p className="muted">{job.title}</p>
        </div>
      </div>
      <JobForm
        initialValues={initialValues}
        submitLabel="Save changes"
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/jobs/${id}`)}
      />
    </section>
  )
}
