import api, { unwrap } from './client'

// Each resolves to { user, token }
export const register = (data) => api.post('/auth/register', data).then(unwrap)
export const login = (credentials) => api.post('/auth/login', credentials).then(unwrap)

// Resolves to { user }
export const getMe = () => api.get('/auth/me').then(unwrap)
