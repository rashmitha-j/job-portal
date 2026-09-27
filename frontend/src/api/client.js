import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

const api = axios.create({
  // No default Content-Type: axios sets JSON for objects and multipart (with boundary) for FormData
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
  return config
})

// Normalize errors to an Error with the server's message and the HTTP status
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = error.response
      ? error.response.data?.message || `Request failed with status ${status}`
      : error.request
        ? 'Unable to reach the server. Please try again.'
        : error.message

    if (status === 401 && error.config?.headers?.Authorization && onUnauthorized) {
      onUnauthorized()
    }

    const normalized = new Error(message)
    normalized.status = status
    return Promise.reject(normalized)
  },
)

// Unwraps the { success, message, data } envelope
export const unwrap = (response) => response.data.data

export default api
