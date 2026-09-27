import api, { unwrap } from './client'

// Candidate
export const applyToJob = (jobId) => api.post(`/applications/jobs/${jobId}`).then(unwrap)
export const getMyApplications = (params) => api.get('/applications/me', { params }).then(unwrap)
// Resolves to the candidate's application for this job, or null
export const getMyApplicationForJob = (jobId) => api.get(`/applications/me/jobs/${jobId}`).then(unwrap)

// Recruiter: resolves to { job, applications, statusCounts, pagination }
export const getJobApplicants = (jobId, params) => api.get(`/applications/jobs/${jobId}`, { params }).then(unwrap)
export const updateApplicationStatus = (id, status) =>
  api.patch(`/applications/${id}/status`, { status }).then(unwrap)

export const getApplication = (id) => api.get(`/applications/${id}`).then(unwrap)
