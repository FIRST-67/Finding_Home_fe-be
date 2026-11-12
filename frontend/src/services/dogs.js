import { apiDelete, apiGet, apiPost, apiPut } from './api'

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

export async function uploadDogImage(file) {
  const form = new FormData()
  form.append('file', file)
  const response = await apiPost('/api/uploads/dogs', form)
  if (!response?.image_url) throw new Error('เซิร์ฟเวอร์ไม่ส่งลิงก์รูปภาพกลับมา')
  return response.image_url
}
