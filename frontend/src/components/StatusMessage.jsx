export function Loader({ label = 'Loading…' }) {
  return (
    <div className="status status-loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="status status-error" role="alert">
      <p>{message || 'Something went wrong.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="status status-empty">
      <p className="status-title">{title}</p>
      {children}
    </div>
  )
}
