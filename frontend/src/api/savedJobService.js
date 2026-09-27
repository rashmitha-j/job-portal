import api, { unwrap } from './client'

// Resolves to { savedJobs, pagination }
export const getSavedJobs = (params) => api.get('/saved-jobs', { params }).then(unwrap)

// Resolves to { saved }
export const getSavedStatus = (jobId) => api.get(`/saved-jobs/${jobId}`).then(unwrap)

export const saveJob = (jobId) => api.post(`/saved-jobs/${jobId}`).then(unwrap)
export const unsaveJob = (jobId) => api.delete(`/saved-jobs/${jobId}`).then(unwrap)
