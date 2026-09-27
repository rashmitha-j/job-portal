import { useState } from 'react'
import {
  EMPTY_EDUCATION,
  EMPTY_EXPERIENCE,
  formValuesToPayload,
  profileToFormValues,
  validateProfileForm,
} from '../../utils/profileForm'

const MAX_EDUCATION = 10
const MAX_EXPERIENCE = 20

function Field({ id, label, error, hint, children }) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}

// Create/edit form for the candidate profile. `onSubmit` receives the API payload.
export default function ProfileForm({ profile, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => profileToFormValues(profile))
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const clearError = (key) => errors[key] && setErrors((prev) => ({ ...prev, [key]: undefined }))

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    clearError(name)
  }

  const updateEntry = (list, index, field, value) => {
    setValues((prev) => ({
      ...prev,
      [list]: prev[list].map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    }))
    clearError(`${list}.${index}.${field}`)
  }
  const addEntry = (list, empty) => setValues((prev) => ({ ...prev, [list]: [...prev[list], { ...empty }] }))
  const removeEntry = (list, index) => {
    setValues((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== index) }))
    // Error keys are index-based, so re-validate on next submit
    setErrors({})
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validateProfileForm(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setServerError('')
    setSubmitting(true)
    try {
      await onSubmit(formValuesToPayload(values))
    } catch (err) {
      setServerError(err.message)
      setSubmitting(false)
    }
  }

  const input = (name, props = {}) => (
    <input id={name} name={name} value={values[name]} onChange={handleChange} {...props} />
  )

  const entryInput = (list, index, field, props = {}) => {
    const id = `${list}-${index}-${field}`
    return (
      <input
        id={id}
        value={values[list][index][field]}
        onChange={(e) => updateEntry(list, index, field, e.target.value)}
        {...props}
      />
    )
  }

  const hasErrors = Object.values(errors).some(Boolean)

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate aria-label="Candidate profile">
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}
      {hasErrors && (
        <div className="alert alert-error" role="alert">
          Please fix the highlighted fields.
        </div>
      )}

      <h2>Basic information</h2>
      <div className="form-grid">
        <Field id="phone" label="Phone" error={errors.phone}>
          {input('phone', { type: 'tel', placeholder: '+91 98765 43210', maxLength: 20 })}
        </Field>
        <Field id="location" label="Location" error={errors.location}>
          {input('location', { placeholder: 'e.g. Bengaluru', maxLength: 100 })}
        </Field>
      </div>
      <Field id="bio" label="About you" error={errors.bio} hint={`${values.bio.length}/2000`}>
        <textarea id="bio" name="bio" rows={4} maxLength={2000} value={values.bio} onChange={handleChange} />
      </Field>
      <Field id="skills" label="Skills" error={errors.skills} hint="Comma-separated, e.g. react, node.js, sql">
        {input('skills', { placeholder: 'react, node.js, sql' })}
      </Field>
      <div className="form-grid">
        <Field id="linkedinUrl" label="LinkedIn URL" error={errors.linkedinUrl}>
          {input('linkedinUrl', { type: 'url', placeholder: 'https://www.linkedin.com/in/you' })}
        </Field>
        <Field id="githubUrl" label="GitHub URL" error={errors.githubUrl}>
          {input('githubUrl', { type: 'url', placeholder: 'https://github.com/you' })}
        </Field>
      </div>

      <section className="entry-section" aria-labelledby="education-heading">
        <div className="entry-section-header">
          <h2 id="education-heading">Education</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => addEntry('education', EMPTY_EDUCATION)}
            disabled={values.education.length >= MAX_EDUCATION}
          >
            + Add education
          </button>
        </div>
        {values.education.length === 0 && <p className="muted">No education added yet.</p>}
        {values.education.map((entry, i) => (
          <fieldset key={i} className="entry-card">
            <legend className="sr-only">Education {i + 1}</legend>
            <div className="form-grid">
              <Field id={`education-${i}-institution`} label="Institution *" error={errors[`education.${i}.institution`]}>
                {entryInput('education', i, 'institution', { maxLength: 150 })}
              </Field>
              <Field id={`education-${i}-degree`} label="Degree *" error={errors[`education.${i}.degree`]}>
                {entryInput('education', i, 'degree', { maxLength: 100, placeholder: 'e.g. B.Tech' })}
              </Field>
              <Field id={`education-${i}-fieldOfStudy`} label="Field of study">
                {entryInput('education', i, 'fieldOfStudy', { maxLength: 100 })}
              </Field>
              <Field id={`education-${i}-startYear`} label="Start year" error={errors[`education.${i}.startYear`]}>
                {entryInput('education', i, 'startYear', { inputMode: 'numeric', placeholder: 'YYYY', maxLength: 4 })}
              </Field>
              <Field id={`education-${i}-endYear`} label="End year" error={errors[`education.${i}.endYear`]}>
                {entryInput('education', i, 'endYear', { inputMode: 'numeric', placeholder: 'YYYY', maxLength: 4 })}
              </Field>
            </div>
            <button type="button" className="btn btn-link btn-remove" onClick={() => removeEntry('education', i)}>
              Remove
            </button>
          </fieldset>
        ))}
      </section>

      <section className="entry-section" aria-labelledby="experience-heading">
        <div className="entry-section-header">
          <h2 id="experience-heading">Experience</h2>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => addEntry('experience', EMPTY_EXPERIENCE)}
            disabled={values.experience.length >= MAX_EXPERIENCE}
          >
            + Add experience
          </button>
        </div>
        {values.experience.length === 0 && <p className="muted">No experience added yet.</p>}
        {values.experience.map((entry, i) => (
          <fieldset key={i} className="entry-card">
            <legend className="sr-only">Experience {i + 1}</legend>
            <div className="form-grid">
              <Field id={`experience-${i}-title`} label="Job title *" error={errors[`experience.${i}.title`]}>
                {entryInput('experience', i, 'title', { maxLength: 100 })}
              </Field>
              <Field id={`experience-${i}-company`} label="Company *" error={errors[`experience.${i}.company`]}>
                {entryInput('experience', i, 'company', { maxLength: 150 })}
              </Field>
              <Field id={`experience-${i}-location`} label="Location">
                {entryInput('experience', i, 'location', { maxLength: 100 })}
              </Field>
              <Field id={`experience-${i}-startYear`} label="Start year" error={errors[`experience.${i}.startYear`]}>
                {entryInput('experience', i, 'startYear', { inputMode: 'numeric', placeholder: 'YYYY', maxLength: 4 })}
              </Field>
              <Field
                id={`experience-${i}-endYear`}
                label="End year"
                error={errors[`experience.${i}.endYear`]}
                hint="Leave empty if current"
              >
                {entryInput('experience', i, 'endYear', { inputMode: 'numeric', placeholder: 'YYYY', maxLength: 4 })}
              </Field>
            </div>
            <Field id={`experience-${i}-description`} label="Description" error={errors[`experience.${i}.description`]}>
              <textarea
                id={`experience-${i}-description`}
                rows={3}
                maxLength={2000}
                value={entry.description}
                onChange={(e) => updateEntry('experience', i, 'description', e.target.value)}
              />
            </Field>
            <button type="button" className="btn btn-link btn-remove" onClick={() => removeEntry('experience', i)}>
              Remove
            </button>
          </fieldset>
        ))}
      </section>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  )
}
