import { useState } from 'react'
import { CURRENCY_OPTIONS, JOB_TYPE_OPTIONS, WORK_MODE_OPTIONS } from '../constants/jobOptions'
import { EMPTY_JOB_FORM, formValuesToPayload, validateJobForm } from '../utils/jobForm'

function Field({ label, name, error, hint, children }) {
  return (
    <div className={`field ${error ? 'field-invalid' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <small className="field-hint">{hint}</small>}
      {error && <small className="field-error">{error}</small>}
    </div>
  )
}

// Shared by Create Job and Edit Job. `onSubmit` receives the API payload and returns a promise.
export default function JobForm({ initialValues = EMPTY_JOB_FORM, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validateJobForm(values)
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

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="alert alert-error" role="alert">
          {serverError}
        </div>
      )}

      <Field label="Job title *" name="title" error={errors.title}>
        {input('title', { maxLength: 150, placeholder: 'e.g. React Developer' })}
      </Field>

      <Field label="Description *" name="description" error={errors.description}>
        <textarea
          id="description"
          name="description"
          rows={8}
          maxLength={10000}
          value={values.description}
          onChange={handleChange}
          placeholder="Responsibilities, requirements, benefits…"
        />
      </Field>

      <div className="form-grid">
        <Field label="Location *" name="location" error={errors.location}>
          {input('location', { maxLength: 100, placeholder: 'e.g. Bengaluru' })}
        </Field>
        <Field label="Job type *" name="jobType">
          <select id="jobType" name="jobType" value={values.jobType} onChange={handleChange}>
            {JOB_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Work mode *" name="workMode">
          <select id="workMode" name="workMode" value={values.workMode} onChange={handleChange}>
            {WORK_MODE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="form-grid">
        <legend>Experience (years)</legend>
        <Field label="Minimum *" name="experienceMin" error={errors.experienceMin}>
          {input('experienceMin', { type: 'number', min: 0, max: 50, step: 'any' })}
        </Field>
        <Field label="Maximum" name="experienceMax" error={errors.experienceMax} hint="Leave empty for no upper limit">
          {input('experienceMax', { type: 'number', min: 0, max: 50, step: 'any' })}
        </Field>
      </fieldset>

      <fieldset className="form-grid">
        <legend>Annual salary</legend>
        <Field label="Minimum" name="salaryMin" error={errors.salaryMin}>
          {input('salaryMin', { type: 'number', min: 0, placeholder: 'e.g. 600000' })}
        </Field>
        <Field label="Maximum" name="salaryMax" error={errors.salaryMax} hint="Leave both empty if not disclosed">
          {input('salaryMax', { type: 'number', min: 0, placeholder: 'e.g. 1200000' })}
        </Field>
        <Field label="Currency" name="currency">
          <select id="currency" name="currency" value={values.currency} onChange={handleChange}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <Field label="Skills *" name="skills" error={errors.skills} hint="Comma-separated, e.g. react, javascript, css">
        {input('skills', { placeholder: 'react, javascript, css' })}
      </Field>

      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
