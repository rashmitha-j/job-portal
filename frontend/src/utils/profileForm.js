// Conversions between the candidate profile API shape and the (all-string) form state

export const EMPTY_EDUCATION = { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }
export const EMPTY_EXPERIENCE = { title: '', company: '', location: '', startYear: '', endYear: '', description: '' }

const PHONE_PATTERN = /^\+?[0-9\s()-]{7,20}$/
const LINKEDIN_PATTERN = /^https?:\/\/([a-z0-9-]+\.)*linkedin\.com(\/\S*)?$/i
const GITHUB_PATTERN = /^https?:\/\/(www\.)?github\.com(\/\S*)?$/i

const toText = (value) => (value == null ? '' : String(value))
const toYear = (text) => (text.trim() === '' ? undefined : Number(text))

const entryToForm = (entry, empty) => Object.fromEntries(Object.keys(empty).map((key) => [key, toText(entry[key])]))

export function profileToFormValues(profile) {
  return {
    phone: profile?.phone || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    skills: (profile?.skills || []).join(', '),
    linkedinUrl: profile?.linkedinUrl || '',
    githubUrl: profile?.githubUrl || '',
    education: (profile?.education || []).map((e) => entryToForm(e, EMPTY_EDUCATION)),
    experience: (profile?.experience || []).map((e) => entryToForm(e, EMPTY_EXPERIENCE)),
  }
}

export function parseSkills(text) {
  return [...new Set(text.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean))]
}

export function formValuesToPayload(values) {
  const trimEntry = (entry) =>
    Object.fromEntries(
      Object.entries(entry).map(([key, value]) => [key, key.endsWith('Year') ? toYear(value) : value.trim()]),
    )
  return {
    phone: values.phone.trim(),
    location: values.location.trim(),
    bio: values.bio.trim(),
    skills: parseSkills(values.skills),
    linkedinUrl: values.linkedinUrl.trim(),
    githubUrl: values.githubUrl.trim(),
    education: values.education.map(trimEntry),
    experience: values.experience.map(trimEntry),
  }
}

function validateYears(entry, errors, prefix) {
  const maxYear = new Date().getFullYear() + 10
  for (const field of ['startYear', 'endYear']) {
    const text = entry[field].trim()
    if (text && (!/^\d{4}$/.test(text) || Number(text) < 1950 || Number(text) > maxYear)) {
      errors[`${prefix}.${field}`] = `Enter a year between 1950 and ${maxYear}`
    }
  }
  if (!errors[`${prefix}.endYear`] && entry.startYear && entry.endYear && Number(entry.endYear) < Number(entry.startYear)) {
    errors[`${prefix}.endYear`] = 'End year cannot be before start year'
  }
}

// Client-side checks for quick feedback; the API validates everything again.
// Keys are field names, or "education.0.degree"-style paths for list entries.
export function validateProfileForm(values) {
  const errors = {}
  if (values.phone.trim() && !PHONE_PATTERN.test(values.phone.trim())) {
    errors.phone = 'Use 7–20 digits; +, spaces, dashes and brackets are allowed'
  }
  if (values.location.length > 100) errors.location = 'Must be at most 100 characters'
  if (values.bio.length > 2000) errors.bio = 'Must be at most 2000 characters'

  const skills = parseSkills(values.skills)
  if (skills.length > 50) errors.skills = 'Add at most 50 skills'
  else if (skills.some((s) => s.length > 50)) errors.skills = 'Each skill must be at most 50 characters'

  if (values.linkedinUrl.trim() && !LINKEDIN_PATTERN.test(values.linkedinUrl.trim())) {
    errors.linkedinUrl = 'Enter a linkedin.com URL starting with https://'
  }
  if (values.githubUrl.trim() && !GITHUB_PATTERN.test(values.githubUrl.trim())) {
    errors.githubUrl = 'Enter a github.com URL starting with https://'
  }

  values.education.forEach((entry, i) => {
    const prefix = `education.${i}`
    if (!entry.institution.trim()) errors[`${prefix}.institution`] = 'Institution is required'
    if (!entry.degree.trim()) errors[`${prefix}.degree`] = 'Degree is required'
    validateYears(entry, errors, prefix)
  })
  values.experience.forEach((entry, i) => {
    const prefix = `experience.${i}`
    if (!entry.title.trim()) errors[`${prefix}.title`] = 'Job title is required'
    if (!entry.company.trim()) errors[`${prefix}.company`] = 'Company is required'
    if (entry.description.length > 2000) errors[`${prefix}.description`] = 'Must be at most 2000 characters'
    validateYears(entry, errors, prefix)
  })

  return errors
}
