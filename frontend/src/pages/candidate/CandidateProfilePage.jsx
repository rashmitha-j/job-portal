import { useCallback, useState } from 'react'
import * as candidateService from '../../api/candidateService'
import useAuth from '../../hooks/useAuth'
import useFetch from '../../hooks/useFetch'
import ProfileForm from '../../components/profile/ProfileForm'
import ProfileView from '../../components/profile/ProfileView'
import ResumeUpload from '../../components/profile/ResumeUpload'
import { ErrorMessage, Loader } from '../../components/StatusMessage'

// True until the candidate has saved any profile details (a resume alone doesn't count)
const hasDetails = (p) =>
  Boolean(p && (p.phone || p.location || p.bio || p.linkedinUrl || p.githubUrl || p.skills?.length || p.education?.length || p.experience?.length))

export default function CandidateProfilePage() {
  const { user } = useAuth()
  const fetchProfile = useCallback(() => candidateService.getProfile(), [])
  const { data, loading, error, reload } = useFetch(fetchProfile)

  // Latest profile after saves/uploads on this page (undefined = use fetched data)
  const [updated, setUpdated] = useState(undefined)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState('')

  if (loading) return <Loader label="Loading your profile…" />
  if (error) return <ErrorMessage message={error.message} onRetry={reload} />

  const profile = updated !== undefined ? updated : data
  // A profile without details goes straight to the form
  const showForm = editing || !hasDetails(profile)

  const handleSave = async (payload) => {
    const saved = await candidateService.saveProfile(payload)
    setUpdated(saved)
    setEditing(false)
    setNotice(hasDetails(profile) ? 'Profile updated.' : 'Profile saved.')
  }

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h1>My profile</h1>
          <p className="muted">
            {user.name} · {user.email}
          </p>
        </div>
        {!showForm && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setNotice('')
              setEditing(true)
            }}
          >
            Edit profile
          </button>
        )}
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      <div className="stack">
        <ResumeUpload resume={profile?.resume} onUploaded={setUpdated} />

        {showForm ? (
          <>
            {!hasDetails(profile) && (
              <div className="alert alert-info">Tell recruiters about yourself. All fields are optional.</div>
            )}
            <ProfileForm
              profile={profile}
              onSubmit={handleSave}
              onCancel={hasDetails(profile) ? () => setEditing(false) : undefined}
            />
          </>
        ) : (
          <div className="card">
            <ProfileView profile={profile} />
          </div>
        )}
      </div>
    </section>
  )
}
