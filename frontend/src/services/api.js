// ศูนย์รวมการเรียก Backend – ทุกหน้าให้เรียกผ่านไฟล์นี้
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`)
  }
  return body
}

export const getBreeds = ({ limit = 12, page = 0 } = {}) =>
  request(`/api/breeds?limit=${limit}&page=${page}`)

export const searchBreeds = (q) =>
  request(`/api/breeds/search?q=${encodeURIComponent(q)}`)

export const checkHealth = () => request('/api/health')
