import { useState } from 'react'
import { EXPERIENCE_OPTIONS, FILTER_KEYS, JOB_TYPE_OPTIONS, WORK_MODE_OPTIONS } from '../constants/jobOptions'

// Text inputs apply on submit; dropdowns apply immediately. `onApply` receives all filter values.
export default function JobFilters({ filters, onApply }) {
  const [draft, setDraft] = useState(filters)

  const update = (name, value, applyNow) => {
    const next = { ...draft, [name]: value }
    setDraft(next)
    if (applyNow) onApply(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onApply(draft)
  }

  const handleClear = () => {
    const empty = Object.fromEntries(FILTER_KEYS.map((key) => [key, '']))
    setDraft(empty)
    onApply(empty)
  }

  const hasFilters = FILTER_KEYS.some((key) => filters[key])

  const select = (name, label, options, allLabel) => (
    <label className="filter-field">
      <span className="sr-only">{label}</span>
      <select value={draft[name]} onChange={(e) => update(name, e.target.value, true)} aria-label={label}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <form className="card filters" onSubmit={handleSubmit} role="search">
      <div className="filters-main">
        <label className="filter-field filter-search">
          <span className="sr-only">Search</span>
          <input
            type="search"
            placeholder="Search by title, skill or keyword"
            value={draft.search}
            onChange={(e) => update('search', e.target.value)}
            aria-label="Search jobs"
          />
        </label>
        <label className="filter-field">
          <span className="sr-only">Location</span>
          <input
            type="text"
            placeholder="Location"
            value={draft.location}
            onChange={(e) => update('location', e.target.value)}
            aria-label="Location"
          />
        </label>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
      </div>

      <div className="filters-extra">
        {select('jobType', 'Job type', JOB_TYPE_OPTIONS, 'All job types')}
        {select('workMode', 'Work mode', WORK_MODE_OPTIONS, 'All work modes')}
        {select('experience', 'Your experience', EXPERIENCE_OPTIONS, 'Any experience')}
        {hasFilters && (
          <button type="button" className="btn btn-link" onClick={handleClear}>
            Clear filters
          </button>
        )}
      </div>
    </form>
  )
}
