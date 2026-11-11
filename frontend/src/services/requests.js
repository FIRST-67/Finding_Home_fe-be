import { apiGet, apiPost, apiPut } from './api'

export const createAdoptionRequest = (details) => apiPost('/api/adoption-requests', details)
export const getMyRequests = () => apiGet('/api/adoption-requests/mine')
export const getAllRequests = () => apiGet('/api/adoption-requests')
export const updateRequestStatus = (requestId, status) =>
  apiPut(`/api/adoption-requests/${encodeURIComponent(requestId)}`, { status })
