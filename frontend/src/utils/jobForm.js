// Conversions between the job API shape and the (all-string) form state

export const EMPTY_JOB_FORM = {
  title: '',
  description: '',
  location: '',
  jobType: 'full-time',
  workMode: 'onsite',
  experienceMin: '0',
  experienceMax: '',
  salaryMin: '',
  salaryMax: '',
  currency: 'INR',
  skills: '',
}

const toText = (n) => (n == null ? '' : String(n))
const toNumber = (text) => (text.trim() === '' ? undefined : Number(text))

export function jobToFormValues(job) {
  return {
    title: job.title || '',
    description: job.description || '',
    location: job.location || '',
    jobType: job.jobType || 'full-time',
    workMode: job.workMode || 'onsite',
    experienceMin: toText(job.experience?.min ?? 0),
    experienceMax: toText(job.experience?.max),
    salaryMin: toText(job.salary?.min),
    salaryMax: toText(job.salary?.max),
    currency: job.salary?.currency || 'INR',
    skills: (job.skills || []).join(', '),
  }
}

export function parseSkills(text) {
  return [...new Set(text.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))]
}

export function formValuesToPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    jobType: values.jobType,
    workMode: values.workMode,
    experience: { min: toNumber(values.experienceMin) ?? 0, max: toNumber(values.experienceMax) },
    salary: {
      min: toNumber(values.salaryMin),
      max: toNumber(values.salaryMax),
      currency: values.currency,
    },
    skills: parseSkills(values.skills),
  }
}

const isNonNegative = (text) => text.trim() === '' || (Number.isFinite(Number(text)) && Number(text) >= 0)

// Client-side checks for quick feedback; the API validates everything again
export function validateJobForm(values) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Title is required'
  if (!values.description.trim()) errors.description = 'Description is required'
  if (!values.location.trim()) errors.location = 'Location is required'

  const skills = parseSkills(values.skills)
  if (skills.length === 0) errors.skills = 'Add at least one skill'
  else if (skills.length > 30) errors.skills = 'Add at most 30 skills'

  for (const field of ['experienceMin', 'experienceMax', 'salaryMin', 'salaryMax']) {
    if (!isNonNegative(values[field])) errors[field] = 'Enter a non-negative number'
  }

  const expMin = toNumber(values.experienceMin) ?? 0
  const expMax = toNumber(values.experienceMax)
  if (!errors.experienceMax && expMax != null && expMax < expMin) {
    errors.experienceMax = 'Must be at least the minimum'
  }
  if (!errors.experienceMin && expMin > 50) errors.experienceMin = 'Must be at most 50'
  if (!errors.experienceMax && expMax > 50) errors.experienceMax = 'Must be at most 50'

  const salMin = toNumber(values.salaryMin)
  const salMax = toNumber(values.salaryMax)
  if (!errors.salaryMax && salMin != null && salMax != null && salMax < salMin) {
    errors.salaryMax = 'Must be at least the minimum'
  }

  return errors
}
