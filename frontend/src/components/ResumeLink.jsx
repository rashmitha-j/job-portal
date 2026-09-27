import { useState } from 'react'
import { openResume } from '../api/resumeService'

// Opens a resume (authenticated download) in a new tab
export default function ResumeLink({ resumeKey, label = 'View resume', className = 'btn btn-secondary btn-sm' }) {
  const [error, setError] = useState('')
  const [opening, setOpening] = useState(false)

  const handleClick = async () => {
    setError('')
    setOpening(true)
    try {
      await openResume(resumeKey)
    } catch (err) {
      setError(err.status === 404 ? 'Resume is not available' : err.message)
    } finally {
      setOpening(false)
    }
  }

  return (
    <span className="resume-link">
      <button type="button" className={className} onClick={handleClick} disabled={opening || !resumeKey}>
        {opening ? 'Opening…' : label}
      </button>
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </span>
  )
}
