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

  it('gets the session from the backend in live mode', async () => {
    localStorage.setItem('token', 'backend-test-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: 2, role: 'admin' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiGet('/api/auth/me')).resolves.toMatchObject({ id: 2, role: 'admin' })
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/auth\/me$/)
    expect(options.headers.get('Authorization')).toBe('Bearer backend-test-token')
  })

  it('sends the file as multipart with the existing bearer token', async () => {
    localStorage.setItem('token', 'backend-test-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ image_url: 'https://storage.example/dog.jpg' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const form = new FormData()
    form.append('file', new File(['photo'], 'dog.jpg', { type: 'image/jpeg' }))

    await apiPost('/api/uploads/dogs', form)

    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/uploads\/dogs$/)
    expect(options.headers.get('Authorization')).toBe('Bearer backend-test-token')
    expect(options.headers.has('Content-Type')).toBe(false)
    expect(options.body).toBe(form)
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
