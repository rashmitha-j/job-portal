import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

const PASSWORD_MIN_LENGTH = 8

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Name, email and password are required')
      return
    }
    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await register({ ...form, name: form.name.trim(), email: form.email.trim() })
      // New users start by setting up what they need: a company (recruiters) or a profile and resume (candidates)
      navigate(user.role === 'recruiter' ? '/recruiter/company' : '/candidate/profile', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>Create an account</h1>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <fieldset className="role-picker">
          <legend>I am a…</legend>
          {[
            { value: 'candidate', label: 'Job seeker' },
            { value: 'recruiter', label: 'Recruiter' },
          ].map((option) => (
            <label key={option.value} className={form.role === option.value ? 'selected' : ''}>
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={form.role === option.value}
                onChange={handleChange}
              />
              {option.label}
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" name="name" autoComplete="name" maxLength={100} value={form.name} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={handleChange} />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
          />
          <small className="field-hint">At least {PASSWORD_MIN_LENGTH} characters</small>
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
        <p className="muted form-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  )
}
