import { JOB_TYPE_LABELS, WORK_MODE_LABELS } from '../constants/jobOptions'

// Coloured work-mode and job-type pills shared by job cards and job details
export default function JobBadges({ workMode, jobType }) {
  return (
    <ul className="job-badges">
      {workMode && <li className={`pill pill-mode-${workMode}`}>{WORK_MODE_LABELS[workMode] || workMode}</li>}
      {jobType && <li className={`pill pill-type pill-type-${jobType}`}>{JOB_TYPE_LABELS[jobType] || jobType}</li>}
    </ul>
  )
}
