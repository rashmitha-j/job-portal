// Shared enum values so models, validation and (later) APIs stay in sync

export const USER_ROLES = ['candidate', 'recruiter', 'admin']

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'interview', 'rejected', 'selected']

export const JOB_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance']

export const WORK_MODES = ['onsite', 'remote', 'hybrid']

// Allowed status changes: Applied → Shortlisted → Interview → Selected, or Rejected at any open stage.
// Selected and Rejected are final.
export const APPLICATION_STATUS_TRANSITIONS = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['selected', 'rejected'],
  selected: [],
  rejected: [],
}
