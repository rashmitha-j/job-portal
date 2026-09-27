const TOKEN_KEY = 'jobportal_token'

// localStorage can throw (private mode, blocked storage), so every access is guarded

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Session will simply not persist across reloads
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to clear
  }
}
