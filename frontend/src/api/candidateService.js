import api, { unwrap } from './client'

// Resolves to the profile, or null if the candidate has not created one yet
export const getProfile = () => api.get('/candidate/profile').then(unwrap)
export const saveProfile = (data) => api.put('/candidate/profile', data).then(unwrap)

// Resolves to the updated profile
export function uploadResume(file) {
  const form = new FormData()
  form.append('resume', file)
  return api.post('/candidate/profile/resume', form).then(unwrap)
}

export const getDashboard = () => api.get('/candidate/dashboard').then(unwrap)
