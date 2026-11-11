import { apiDelete, apiGet, apiPost } from './api'

export const getFavorites = () => apiGet('/api/favorites')
export const addFavorite = (dogId) =>
  apiPost(`/api/favorites/${encodeURIComponent(dogId)}`)
export const removeFavorite = (dogId) =>
  apiDelete(`/api/favorites/${encodeURIComponent(dogId)}`)
