import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email.trim() || !form.password) {
      setError('Email and password are required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const user = await login({ email: form.email.trim(), password: form.password })
      // Return to the page that required login, otherwise a sensible home for the role
      const from = location.state?.from
      const fallback = user.role === 'recruiter' ? '/recruiter/jobs' : user.role === 'candidate' ? '/candidate/dashboard' : '/jobs'
      navigate(from ? `${from.pathname}${from.search || ''}` : fallback, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <div className="auth-heading">
          <h1>Welcome back</h1>
          <p className="muted">Log in to apply, track applications or manage your job posts.</p>
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
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
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted form-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </section>
  )
}
