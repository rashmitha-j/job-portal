const yearRange = (start, end, openEndedLabel) => {
  if (!start && !end) return ''
  return `${start || '?'} – ${end || openEndedLabel}`
}

// Read-only display of a candidate profile (used by the candidate and on recruiter applicant cards)
export default function ProfileView({ profile, compact = false }) {
  const { phone, location, bio, skills = [], education = [], experience = [], linkedinUrl, githubUrl } = profile

  return (
    <div className="profile-view">
      {(phone || location) && (
        <p className="muted">{[location, phone].filter(Boolean).join(' · ')}</p>
      )}
      {bio && <p className="prewrap">{bio}</p>}

      {(linkedinUrl || githubUrl) && (
        <p className="profile-links">
          {linkedinUrl && (
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer">
              LinkedIn ↗
            </a>
          )}
          {githubUrl && (
            <a href={githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          )}
        </p>
      )}

      {!compact && (
        <>
          <h3>Skills</h3>
          {skills.length ? (
            <ul className="tags">
              {skills.map((skill) => (
                <li key={skill} className="tag">
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No skills added.</p>
          )}
        </>
      )}

      <h3>Experience</h3>
      {experience.length ? (
        <ul className="timeline">
          {experience.map((item, i) => (
            <li key={i}>
              <strong>{item.title}</strong> · {item.company}
              {item.location && <span className="muted"> · {item.location}</span>}
              <div className="muted small">{yearRange(item.startYear, item.endYear, 'Present')}</div>
              {item.description && <p className="prewrap small">{item.description}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No experience added.</p>
      )}

      <h3>Education</h3>
      {education.length ? (
        <ul className="timeline">
          {education.map((item, i) => (
            <li key={i}>
              <strong>{item.degree}</strong>
              {item.fieldOfStudy && <span>, {item.fieldOfStudy}</span>} · {item.institution}
              <div className="muted small">{yearRange(item.startYear, item.endYear, 'Present')}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No education added.</p>
      )}
    </div>
  )
}
