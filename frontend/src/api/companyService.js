import api, { unwrap } from './client'

// Each resolves to a company
export const getMyCompany = () => api.get('/companies/my-company').then(unwrap)
export const getCompany = (id) => api.get(`/companies/${id}`).then(unwrap)
export const createCompany = (data) => api.post('/companies', data).then(unwrap)
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data).then(unwrap)
