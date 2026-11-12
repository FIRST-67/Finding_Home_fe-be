import { apiDelete, apiGet, apiPatch, apiPost } from './api'

export const createAdoptionRequest = (details) => apiPost('/api/adoption-requests', details)
export const getMyRequests = () => apiGet('/api/adoption-requests/me')
export const getAllRequests = (filters = {}) => {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  }
  const queryString = query.toString()
  return apiGet(`/api/adoption-requests${queryString ? `?${queryString}` : ''}`)
}
export const updateRequestStatus = (requestId, status) =>
  apiPatch(`/api/adoption-requests/${encodeURIComponent(requestId)}`, { status })
export const cancelRequest = (requestId) =>
  apiDelete(`/api/adoption-requests/${encodeURIComponent(requestId)}`)
