import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as companyService from '../../api/companyService'
import { ErrorMessage, Loader } from '../../components/StatusMessage'

const EMPTY_COMPANY = { name: '', description: '', website: '', location: '', logo: '' }
const URL_PATTERN = /^https?:\/\/\S+\.\S+/i

const toFormValues = (company) =>
  Object.fromEntries(Object.keys(EMPTY_COMPANY).map((key) => [key, company?.[key] || '']))

function validate(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Company name is required'
  if (values.website.trim() && !URL_PATTERN.test(values.website.trim())) {
    errors.website = 'Enter a full URL starting with http:// or https://'
  }
  if (values.logo.trim() && !URL_PATTERN.test(values.logo.trim())) {
    errors.logo = 'Enter a full image URL starting with http:// or https://'
  }
  return errors
}

export default function CompanyProfilePage() {
  const [company, setCompany] = useState(null)
  const [values, setValues] = useState(EMPTY_COMPANY)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  // 404 means "no company yet", which shows the create form
  useEffect(() => {
    let active = true
    companyService
      .getMyCompany()
      .then((data) => {
        if (!active) return
        setCompany(data)
        setValues(toFormValues(data))
      })
      .catch((err) => active && err.status !== 404 && setLoadError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [reloadKey])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const payload = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]))
    setSaving(true)
    setServerError('')
    setSuccess('')
    try {
      const saved = company
        ? await companyService.updateCompany(company._id, payload)
        : await companyService.createCompany(payload)
      setSuccess(company ? 'Company profile updated.' : 'Company profile created. You can now post jobs.')
      setCompany(saved)
      setValues(toFormValues(saved))
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader label="Loading company profile…" />
  const retryLoad = () => {
    setLoading(true)
    setLoadError(null)
    setReloadKey((k) => k + 1)
  }

  if (loadError) return <ErrorMessage message={loadError.message} onRetry={retryLoad} />

  const field = (name, label, props = {}, hint) => (
    <div className={`field ${errors[name] ? 'field-invalid' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {props.rows ? (
        <textarea id={name} name={name} value={values[name]} onChange={handleChange} {...props} />
      ) : (
        <input id={name} name={name} value={values[name]} onChange={handleChange} {...props} />
      )}
      {hint && !errors[name] && <small className="field-hint">{hint}</small>}
      {errors[name] && <small className="field-error">{errors[name]}</small>}
    </div>
  )

  return (
    <section className="narrow">
      <div className="page-header">
        <div>
          <h1>{company ? 'Company profile' : 'Create your company profile'}</h1>
          <p className="muted">
            {company ? 'This information is shown on your job postings.' : 'You need a company profile before posting jobs.'}
          </p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        {success && (
          <div className="alert alert-success" role="status">
            {success}{' '}
            <Link to="/recruiter/jobs/new">Post a job →</Link>
          </div>
        )}
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}

        {field('name', 'Company name *', { maxLength: 150 })}
        {field('description', 'About the company', { rows: 5, maxLength: 5000 })}
        <div className="form-grid">
          {field('location', 'Location', { maxLength: 100, placeholder: 'e.g. Bengaluru' })}
          {field('website', 'Website', { type: 'url', placeholder: 'https://example.com' })}
        </div>
        {field('logo', 'Logo URL', { type: 'url', placeholder: 'https://example.com/logo.png' }, 'Link to an image of your logo')}

        {values.logo && URL_PATTERN.test(values.logo) && (
          <img src={values.logo} alt="Logo preview" className="company-logo" />
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : company ? 'Save changes' : 'Create company'}
          </button>
        </div>
      </form>
    </section>
  )
}
