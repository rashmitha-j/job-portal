// Mirrors backend/src/models/constants.js; keep the values in sync

export const APPLICATION_STATUSES = ['applied', 'shortlisted', 'interview', 'selected', 'rejected']

export const STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  selected: 'Selected',
  rejected: 'Rejected',
}

// Applied → Shortlisted → Interview → Selected, or Rejected at any open stage
export const NEXT_STATUSES = {
  applied: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['selected', 'rejected'],
  selected: [],
  rejected: [],
}
