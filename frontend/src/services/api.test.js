import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { apiGet, apiPost, isMockMode, setUnauthorizedHandler } from './api'

describe.skipIf(isMockMode)('API client', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('adds the bearer token and serializes JSON requests', async () => {
    localStorage.setItem('token', 'test-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 1 }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const body = { sample: true }

    await apiPost('/api/test', body)

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer test-token')
    expect(options.headers.get('Content-Type')).toBe('application/json')
    expect(options.body).toBe(JSON.stringify(body))
  })

  it('uses the contract mock for endpoints not implemented by the backend', async () => {
    localStorage.setItem('token', 'mock-token-1')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const user = await apiGet('/api/auth/me')

    expect(user).toMatchObject({ id: 1, role: 'member' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads dogs from the configured backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ data: [], page: 1, limit: 12, total: 0 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiGet('/api/dogs')

    expect(fetchMock).toHaveBeenCalledWith(
      `${(import.meta.env.VITE_API_URL || 'https://finding-home-dfe0.onrender.com').replace(/\/+$/, '')}/api/dogs`,
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('clears saved auth and calls the unauthorized handler on 401', async () => {
    localStorage.setItem('token', 'expired-token')
    localStorage.setItem('finding-home-user', JSON.stringify({ id: 'user-1' }))
    const onUnauthorized = vi.fn()
    const removeHandler = setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Session expired' }),
    }))

    await expect(apiGet('/api/test')).rejects.toMatchObject({ message: 'Session expired', status: 401 })
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('finding-home-user')).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
    removeHandler()
  })
})
