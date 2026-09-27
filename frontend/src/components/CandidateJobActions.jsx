import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import * as savedJobService from '../api/savedJobService'
import * as applicationService from '../api/applicationService'
import * as candidateService from '../api/candidateService'
import useFetch from '../hooks/useFetch'
import StatusBadge from './StatusBadge'
import { formatDate } from '../utils/format'

// Save/unsave and apply controls shown to candidates on Job Details
export default function CandidateJobActions({ jobId }) {
  const fetchState = useCallback(
    () =>
      Promise.all([
        savedJobService.getSavedStatus(jobId),
        applicationService.getMyApplicationForJob(jobId),
        candidateService.getProfile(),
      ]).then(([{ saved }, application, profile]) => ({ saved, application, hasResume: Boolean(profile?.resume) })),
    [jobId],
  )
  const { data, loading, error, reload } = useFetch(fetchState)

  // Local changes made on this page (override the fetched values)
  const [saved, setSaved] = useState(null)
  const [application, setApplication] = useState(null)
  const [pending, setPending] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })

  if (loading) return <p className="muted candidate-actions">Loading…</p>
  if (error) {
    return (
      <div className="candidate-actions">
        <span className="field-error">Could not load your application status.</span>
        <button type="button" className="btn btn-link" onClick={reload}>
          Retry
        </button>
      </div>
    )
  }

  const isSaved = saved ?? data.saved
  const currentApplication = application ?? data.application

  const toggleSave = async () => {
    setPending('save')
    setMessage({ type: '', text: '' })
    try {
      if (isSaved) {
        await savedJobService.unsaveJob(jobId)
        setSaved(false)
      } else {
        await savedJobService.saveJob(jobId)
        setSaved(true)
      }
    } catch (err) {
      // Already in the requested state (e.g. changed in another tab)
      if (err.status === 409) setSaved(true)
      else if (err.status === 404 && isSaved) setSaved(false)
      else setMessage({ type: 'error', text: err.message })
    } finally {
      setPending('')
    }
  }

  const apply = async () => {
    setPending('apply')
    setMessage({ type: '', text: '' })
    try {
      const created = await applicationService.applyToJob(jobId)
      setApplication(created)
      setMessage({ type: 'success', text: 'Application submitted! Track it under My Applications.' })
    } catch (err) {
      if (err.status === 409) {
        setApplication(await applicationService.getMyApplicationForJob(jobId))
      }
      setMessage({ type: 'error', text: err.message })
    } finally {
      setPending('')
    }
  }

  return (
    <div className="candidate-actions">
      {message.text && (
        <div className={`alert alert-${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
          {message.text}
        </div>
      )}

      {!currentApplication && !data.hasResume && (
        <div className="alert alert-info">
          Upload your resume before applying. <Link to="/candidate/profile">Go to your profile →</Link>
        </div>
      )}

      <div className="candidate-actions-row">
        {currentApplication ? (
          <div className="applied-state">
            <StatusBadge status={currentApplication.status} />
            <span className="muted">
              Applied on {formatDate(currentApplication.appliedAt)} ·{' '}
              <Link to="/candidate/applications">View my applications</Link>
            </span>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={apply}
            disabled={!data.hasResume || pending !== ''}
          >
            {pending === 'apply' ? 'Applying…' : 'Apply now'}
          </button>
        )}

        <button
          type="button"
          className={`btn ${isSaved ? 'btn-secondary' : 'btn-outline'}`}
          onClick={toggleSave}
          disabled={pending !== ''}
          aria-pressed={isSaved}
        >
          {pending === 'save' ? 'Saving…' : isSaved ? '★ Saved' : '☆ Save job'}
        </button>
      </div>
    </div>
  )
}
