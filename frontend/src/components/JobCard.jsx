import { Link } from 'react-router-dom'
import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../constants/jobOptions'
import { formatExperience, formatSalary, timeAgo } from '../utils/format'

const MAX_VISIBLE_SKILLS = 6

export default function JobCard({ job }) {
  const skills = job.skills || []
  const hiddenSkills = skills.length - MAX_VISIBLE_SKILLS

  return (
    <article className="card job-card">
      <Link to={`/jobs/${job._id}`} className="job-card-link">
        <div className="job-card-header">
          <div>
            <h3 className="job-card-title">{job.title}</h3>
            <p className="job-card-company">{job.company?.name || 'Unknown company'}</p>
          </div>
          <span className="job-card-date">{timeAgo(job.createdAt)}</span>
        </div>

        <ul className="job-meta">
          <li>{job.location}</li>
          <li>{WORK_MODE_LABELS[job.workMode] || job.workMode}</li>
          <li>{JOB_TYPE_LABELS[job.jobType] || job.jobType}</li>
          <li>{formatExperience(job.experience)}</li>
        </ul>
        <p className="job-salary">{formatSalary(job.salary)}</p>

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
      </Link>
    </article>
  )
}
