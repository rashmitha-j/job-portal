import { useRef, useState } from 'react'
import * as candidateService from '../../api/candidateService'
import ResumeLink from '../ResumeLink'
import { formatDate } from '../../utils/format'

const MAX_BYTES = 5 * 1024 * 1024

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`)

// Shows the current resume and uploads/replaces it. `onUploaded` receives the updated profile.
export default function ResumeUpload({ resume, onUploaded }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const chosen = e.target.files?.[0] || null
    setSuccess('')
    setError('')
    setFile(null)
    if (!chosen) return
    // Quick client-side checks; the server re-validates type, content and size
    if (chosen.type !== 'application/pdf' || !chosen.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed')
      return
    }
    if (chosen.size > MAX_BYTES) {
      setError('Resume must be at most 5 MB')
      return
    }
    setFile(chosen)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const profile = await candidateService.uploadResume(file)
      setSuccess(resume ? 'Resume replaced.' : 'Resume uploaded.')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploaded(profile)
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="card resume-card" aria-labelledby="resume-heading">
      <h2 id="resume-heading">Resume</h2>

      {resume ? (
        <div className="resume-current">
          <div>
            <p className="resume-name">📄 {resume.originalName}</p>
            <p className="muted small">
              {formatSize(resume.size)} · uploaded {formatDate(resume.uploadedAt)}
            </p>
          </div>
          <ResumeLink resumeKey={resume.key} />
        </div>
      ) : (
        <p className="muted">No resume uploaded yet. You need one to apply for jobs.</p>
      )}

      {success && (
        <div className="alert alert-success" role="status">
          {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <div className="resume-upload-row">
        <label className="sr-only" htmlFor="resume-file">
          Resume PDF
        </label>
        <input
          ref={inputRef}
          id="resume-file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button type="button" className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? 'Uploading…' : resume ? 'Replace resume' : 'Upload resume'}
        </button>
      </div>
      <small className="field-hint">PDF only, up to 5 MB.</small>
    </section>
  )
}
