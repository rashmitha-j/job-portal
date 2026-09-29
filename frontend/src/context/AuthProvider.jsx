import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContext'
import * as authService from '../api/authService'
import { setUnauthorizedHandler } from '../api/client'
import { getToken, setToken, clearToken } from '../utils/tokenStorage'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // True while a stored token is being checked against /auth/me
  const [initializing, setInitializing] = useState(() => Boolean(getToken()))

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  // Restore the session from a stored token
  useEffect(() => {
    if (!getToken()) return
    let active = true
    authService
      .getMe()
      .then(({ user }) => active && setUser(user))
      // Only a 401 means the token is invalid; keep it if the server was just unreachable
      .catch((error) => active && error.status === 401 && clearToken())
      .finally(() => active && setInitializing(false))
    return () => {
      active = false
    }
  }, [])

  // Any 401 on an authenticated request means the token is no longer valid
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const startSession = useCallback(({ user, token }) => {
    setToken(token)
    setUser(user)
    return user
  }, [])

  const login = useCallback(
    (credentials) => authService.login(credentials).then(startSession),
    [startSession],
  )
  const register = useCallback(
    (data) => authService.register(data).then(startSession),
    [startSession],
  )

  const value = useMemo(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
