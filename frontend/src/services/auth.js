import { apiGet, apiPost, apiPut } from './api'

export const register = (details) => apiPost('/api/auth/register', details)
export const login = (credentials) => apiPost('/api/auth/login', credentials)
export const logout = () => apiPost('/api/auth/logout')
export const getCurrentUser = () => apiGet('/api/auth/me')
export const getProfile = () => apiGet('/api/profile')
export const updateProfile = (details) => apiPut('/api/profile', details)
export const changePassword = (passwords) => apiPut('/api/profile/password', passwords)
