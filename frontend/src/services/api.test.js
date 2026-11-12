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

  it('sends login requests to the backend and returns its session token', async () => {
    const session = { token: 'signed-token', user: { id: 2, role: 'admin' } }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(session),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiPost('/api/auth/login', {
      email: 'admin@example.com',
      password: 'password123',
    })

    expect(result).toEqual(session)
    expect(fetchMock).toHaveBeenCalledWith(
      `${(import.meta.env.VITE_API_URL || 'https://finding-home-dfe0.onrender.com').replace(/\/+$/, '')}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
      }),
    )
  })

  it('sends dog creation to the backend with the saved session token', async () => {
    localStorage.setItem('token', 'signed-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 4 }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await apiPost('/api/dogs', { name: 'Mochi' })

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe(
      `${(import.meta.env.VITE_API_URL || 'https://finding-home-dfe0.onrender.com').replace(/\/+$/, '')}/api/dogs`,
    )
    expect(options.headers.get('Authorization')).toBe('Bearer signed-token')
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
