import { useSyncExternalStore } from 'react'
import { isServerWaking, subscribe } from '../api/serverStatus'

// Shown while requests are retrying because the backend (Render free tier) is asleep
export default function ServerWakeBanner() {
  const waking = useSyncExternalStore(subscribe, isServerWaking)

  if (!waking) return null

  return (
    <div className="alert alert-info wake-banner" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>Waking up the server, this can take up to a minute…</span>
    </div>
  )
}
