import { apiGet, apiPost, apiPut } from './api'

export const register = (details) => apiPost('/api/auth/register', details)
export const login = (credentials) => apiPost('/api/auth/login', credentials)
export const getProfile = () => apiGet('/api/me')
export const updateProfile = (details) => apiPut('/api/me', details)
export const changePassword = (passwords) => apiPut('/api/me/password', passwords)
