import axios from 'axios'
import { getToken } from '../utils/tokenStorage'
import { startWaking, stopWaking } from './serverStatus'

// The backend runs on Render's free tier, which sleeps when idle and can take
// up to 2 minutes to answer the first request after waking up.
const REQUEST_TIMEOUT_MS = 90_000
const WAKE_RETRY_INTERVAL_MS = 10_000
const WAKE_MAX_DURATION_MS = 120_000
// A cold server often holds requests open instead of failing them, so the banner
// also appears once a request has been pending this long
const WAKE_BANNER_DELAY_MS = 5_000

const SAFE_METHODS = ['get', 'head', 'options']

const api = axios.create({
  // No default Content-Type: axios sets JSON for objects and multipart (with boundary) for FormData
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: REQUEST_TIMEOUT_MS,
})

// Called when an authenticated request is rejected with 401 (expired/invalid token)
let onUnauthorized = null
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.firstSentAt = Date.now()
  config.wakeBannerTimer = setTimeout(() => showWakeBanner(config), WAKE_BANNER_DELAY_MS)
  return config
})

// Each request counts towards the banner at most once, until it settles
function showWakeBanner(config) {
  clearTimeout(config.wakeBannerTimer)
  if (config.showingWakeBanner) return
  config.showingWakeBanner = true
  startWaking()
}

function hideWakeBanner(config) {
  clearTimeout(config.wakeBannerTimer)
  if (!config.showingWakeBanner) return
  config.showingWakeBanner = false
  stopWaking()
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// True when no HTTP response came back at all. Render's own 502/503 pages while the
// server wakes up have no CORS headers, so the browser reports those this way too.
function isServerUnreachable(error) {
  return Boolean(error.config && error.request && !error.response && !axios.isCancel(error))
}

// A timed-out POST/PUT/PATCH/DELETE may already have been processed by the server,
// so those are only retried when the connection failed, never after a timeout.
function canRetry(error) {
  const method = error.config.method?.toLowerCase()
  return SAFE_METHODS.includes(method) || error.code !== 'ECONNABORTED'
}

// Retries every WAKE_RETRY_INTERVAL_MS until WAKE_MAX_DURATION_MS after the request was
// first sent. Resolves with the response, or rejects with the last attempt's error.
async function retryWhileWaking(error) {
  const { config } = error
  const deadline = config.firstSentAt + WAKE_MAX_DURATION_MS
  let lastError = error

  showWakeBanner(config)
  while (Date.now() + WAKE_RETRY_INTERVAL_MS < deadline) {
    await wait(WAKE_RETRY_INTERVAL_MS)
    try {
      // Plain axios (not `api`) so the retry doesn't re-enter these interceptors;
      // no attempt may run past the overall deadline
      const timeout = Math.min(REQUEST_TIMEOUT_MS, deadline - Date.now())
      return await axios.request({ ...config, timeout })
    } catch (retryError) {
      lastError = retryError
      if (!isServerUnreachable(retryError) || !canRetry(retryError)) break
    }
  }
  throw lastError
}

// Normalize errors to an Error with the server's message and the HTTP status
function normalizeError(error) {
  const status = error.response?.status
  const message = error.response
    ? error.response.data?.message || `Request failed with status ${status}`
    : error.request
      ? 'The server is not responding. It may still be starting up; please try again in a minute.'
      : error.message

  if (status === 401 && error.config?.headers?.Authorization && onUnauthorized) {
    onUnauthorized()
  }

  const normalized = new Error(message)
  normalized.status = status
  return normalized
}

api.interceptors.response.use(
  (response) => {
    hideWakeBanner(response.config)
    return response
  },
  async (error) => {
    const { config } = error
    try {
      if (isServerUnreachable(error) && canRetry(error)) {
        return await retryWhileWaking(error)
      }
    } catch (retryError) {
      error = retryError
    } finally {
      if (config) hideWakeBanner(config)
    }
    throw normalizeError(error)
  },
)

// Unwraps the { success, message, data } envelope
export const unwrap = (response) => response.data.data

export default api
