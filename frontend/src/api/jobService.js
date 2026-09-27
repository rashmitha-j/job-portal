import api, { unwrap } from './client'

// Resolves to { jobs, pagination }
export const getJobs = (params) => api.get('/jobs', { params }).then(unwrap)
export const getMyJobs = (params) => api.get('/jobs/recruiter/my-jobs', { params }).then(unwrap)

// Resolve to a job
export const getJob = (id) => api.get(`/jobs/${id}`).then(unwrap)
export const createJob = (data) => api.post('/jobs', data).then(unwrap)
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data).then(unwrap)

export const deleteJob = (id) => api.delete(`/jobs/${id}`).then(unwrap)
