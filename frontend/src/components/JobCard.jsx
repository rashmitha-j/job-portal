import { Link } from 'react-router-dom'
import CompanyAvatar from './CompanyAvatar'
import JobBadges from './JobBadges'
import { formatExperience, formatSalary, timeAgo } from '../utils/format'

const MAX_VISIBLE_SKILLS = 5

export default function JobCard({ job }) {
  const skills = job.skills || []
  const hiddenSkills = skills.length - MAX_VISIBLE_SKILLS
  const companyName = job.company?.name || 'Unknown company'

  return (
    <article className="card job-card">
      <Link to={`/jobs/${job._id}`} className="job-card-link">
        <div className="job-card-header">
          <CompanyAvatar name={companyName} />
          <div className="job-card-heading">
            <h3 className="job-card-title">{job.title}</h3>
            <p className="job-card-company">{companyName}</p>
          </div>
          <span className="job-card-date">{timeAgo(job.createdAt)}</span>
        </div>

        <JobBadges workMode={job.workMode} jobType={job.jobType} />

        <ul className="job-meta">
          <li>{job.location}</li>
          <li>{formatExperience(job.experience)}</li>
        </ul>

        {skills.length > 0 && (
          <ul className="tags">
            {skills.slice(0, MAX_VISIBLE_SKILLS).map((skill) => (
              <li key={skill} className="tag">
                {skill}
              </li>
            ))}
            {hiddenSkills > 0 && <li className="tag tag-muted">+{hiddenSkills} more</li>}
          </ul>
        )}

        <div className="job-card-footer">
          <p className="job-salary">{formatSalary(job.salary)}</p>
          {/* The whole card is the link; this is its visual call to action */}
          <span className="btn btn-outline btn-sm job-card-cta">View details</span>
        </div>
      </Link>
    </article>
  )
}
