import { mockRequest } from './mock/api'
import ApiError from './ApiError'

export { ApiError }

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://finding-home-dfe0.onrender.com').replace(/\/+$/, '')
const TOKEN_KEY = 'token'
const USER_KEY = 'finding-home-user'

export const isMockMode = import.meta.env.VITE_USE_MOCK === 'true'
// Endpoints marked as pending in the API contract stay mocked until the backend implements them.
const MOCK_ONLY_ENDPOINTS = [
  '/api/auth',
  '/api/profile',
  '/api/adoption-requests',
  '/api/favorites',
]

let unauthorizedHandler

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = undefined
  }
}

function shouldMockEndpoint(path) {
  const endpoint = path.split('?')[0]
  return isMockMode || MOCK_ONLY_ENDPOINTS.some(
    (prefix) => endpoint === prefix || endpoint.startsWith(`${prefix}/`),
  )
}

function getStoredToken() {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)
}

function clearStoredAuth() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

function responseMessage(body, status) {
  if (body && typeof body === 'object') {
    if (body.message || body.error) return body.message || body.error
  }
  if (typeof body === 'string' && body.trim()) return body
  return `Request failed (${status})`
}

// Centralize auth headers, JSON/FormData handling, and API errors for every service.
export async function request(path, options = {}) {
  const { method = 'GET', body, headers = {}, ...fetchOptions } = options
  const token = getStoredToken()
  const requestHeaders = new Headers(headers)
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  if (token && !requestHeaders.has('Authorization')) {
    requestHeaders.set('Authorization', `Bearer ${token}`)
  }
  if (isFormData) requestHeaders.delete('Content-Type')

  if (shouldMockEndpoint(path)) {
    try {
      return await mockRequest(path, { method, body, headers: requestHeaders })
    } catch (error) {
      if (error?.status === 401 && token) {
        clearStoredAuth()
        if (unauthorizedHandler) unauthorizedHandler()
      }
      throw error
    }
  }

  let requestBody = body
  if (body !== undefined && !isFormData && typeof body !== 'string') {
    requestBody = JSON.stringify(body)
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      method,
      headers: requestHeaders,
      body: requestBody,
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
  }

  const text = response.status === 204 ? '' : await response.text()
  let responseBody = null
  if (text) {
    try {
      responseBody = JSON.parse(text)
    } catch {
      responseBody = text
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      clearStoredAuth()
      if (unauthorizedHandler) unauthorizedHandler()
    }
    throw new ApiError(responseMessage(responseBody, response.status), response.status)
  }

  return responseBody
}

export const apiGet = (path, options) => request(path, { ...options, method: 'GET' })
export const apiPost = (path, body, options) => request(path, { ...options, method: 'POST', body })
export const apiPut = (path, body, options) => request(path, { ...options, method: 'PUT', body })
export const apiPatch = (path, body, options) => request(path, { ...options, method: 'PATCH', body })
export const apiDelete = (path, options) => request(path, { ...options, method: 'DELETE' })

export const checkHealth = () => apiGet('/api/health')
