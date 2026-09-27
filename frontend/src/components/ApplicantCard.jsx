import { useState } from 'react'
import * as applicationService from '../api/applicationService'
import StatusBadge from './StatusBadge'
import ResumeLink from './ResumeLink'
import ProfileView from './profile/ProfileView'
import { NEXT_STATUSES, STATUS_LABELS } from '../constants/applicationStatus'
import { formatDate } from '../utils/format'

// One applicant on the recruiter's Applicants page, with status controls.
// `onStatusChange(from, to)` lets the page keep its status-tab counts in sync.
export default function ApplicantCard({ application, onStatusChange }) {
  const [status, setStatus] = useState(application.status)
  const nextOptions = NEXT_STATUSES[status] || []
  const [nextStatus, setNextStatus] = useState(nextOptions[0] || '')
  const [updating, setUpdating] = useState(false)
  const [feedback, setFeedback] = useState({ type: '', text: '' })
  const [showDetails, setShowDetails] = useState(false)

  const { candidate, profile } = application
  const skills = profile?.skills || []

  const handleUpdate = async () => {
    if (!nextStatus) return
    setUpdating(true)
    setFeedback({ type: '', text: '' })
    try {
      const updated = await applicationService.updateApplicationStatus(application._id, nextStatus)
      onStatusChange?.(status, updated.status)
      setStatus(updated.status)
      setNextStatus(NEXT_STATUSES[updated.status][0] || '')
      setFeedback({ type: 'success', text: `Status updated to ${STATUS_LABELS[updated.status]}.` })
    } catch (err) {
      setFeedback({ type: 'error', text: err.message })
    } finally {
      setUpdating(false)
    }
  }

  return (
    <li className="card applicant-card">
      <div className="applicant-header">
        <div className="applicant-identity">
          <h3>{candidate?.name || 'Deleted user'}</h3>
          {candidate?.email && (
            <a href={`mailto:${candidate.email}`} className="small">
              {candidate.email}
            </a>
          )}
          <p className="muted small">
            Applied {formatDate(application.appliedAt)}
            {profile?.location && ` · ${profile.location}`}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {skills.length > 0 ? (
        <ul className="tags">
          {skills.map((skill) => (
            <li key={skill} className="tag">
              {skill}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No skills listed.</p>
      )}

      <div className="applicant-actions">
        <ResumeLink resumeKey={application.resume} label={`Resume${application.resumeName ? `: ${application.resumeName}` : ''}`} />
        <button type="button" className="btn btn-link" onClick={() => setShowDetails((s) => !s)} aria-expanded={showDetails}>
          {showDetails ? 'Hide profile' : 'View profile'}
        </button>

        <div className="status-control">
          {nextOptions.length > 0 ? (
            <>
              <label className="sr-only" htmlFor={`status-${application._id}`}>
                New status for {candidate?.name}
              </label>
              <select
                id={`status-${application._id}`}
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                disabled={updating}
              >
                {nextOptions.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating…' : 'Update status'}
              </button>
            </>
          ) : (
            <span className="muted small">Final decision made</span>
          )}
        </div>
      </div>

      {feedback.text && (
        <div className={`alert alert-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      )}

      {showDetails && (
        <div className="applicant-details">
          {profile ? <ProfileView profile={profile} compact /> : <p className="muted">This candidate has no profile details.</p>}
        </div>
      )}
    </li>
  )
}
