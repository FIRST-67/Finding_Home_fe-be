import { apiDelete, apiGet, apiPost, apiPut } from './api'
import ApiError from './ApiError'
import { validateImageFile } from '../utils/validators'

export function getDogs(filters = {}) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  }
  const queryString = query.toString()
  const suffix = queryString ? `?${queryString}` : ''
  return apiGet(`/api/dogs${suffix}`)
}

export const getDog = (dogId) => apiGet(`/api/dogs/${encodeURIComponent(dogId)}`)
export const createDog = (dog) => apiPost('/api/dogs', dog)
export const updateDog = (dogId, dog) =>
  apiPut(`/api/dogs/${encodeURIComponent(dogId)}`, dog)
export const deleteDog = (dogId) =>
  apiDelete(`/api/dogs/${encodeURIComponent(dogId)}`)

export function uploadDogImage(dogId, file) {
  const validationError = validateImageFile(file)
  if (validationError) throw new ApiError(validationError)
  const formData = new FormData()
  formData.append('image', file)
  // The shared client leaves multipart Content-Type unset so fetch adds its boundary.
  return apiPost(`/api/dogs/${encodeURIComponent(dogId)}/image`, formData)
}
