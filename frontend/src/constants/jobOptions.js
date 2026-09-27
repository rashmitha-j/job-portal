// Mirrors backend/src/models/constants.js; keep the values in sync

export const JOB_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
]

export const WORK_MODE_OPTIONS = [
  { value: 'onsite', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
]

// Candidate's years of experience, used by the jobs filter
export const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Fresher' },
  { value: '1', label: '1 year' },
  { value: '2', label: '2 years' },
  { value: '3', label: '3 years' },
  { value: '5', label: '5 years' },
  { value: '8', label: '8 years' },
  { value: '10', label: '10+ years' },
]

export const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP']

const toLabelMap = (options) => Object.fromEntries(options.map((o) => [o.value, o.label]))
export const JOB_TYPE_LABELS = toLabelMap(JOB_TYPE_OPTIONS)
export const WORK_MODE_LABELS = toLabelMap(WORK_MODE_OPTIONS)

// Query-string keys used by the jobs search/filter UI (match GET /api/jobs parameters)
export const FILTER_KEYS = ['search', 'location', 'jobType', 'workMode', 'experience']
