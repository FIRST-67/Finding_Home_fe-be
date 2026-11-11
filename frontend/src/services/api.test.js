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

  it('adds the bearer token and leaves FormData content type to the browser', async () => {
    localStorage.setItem('finding-home-token', 'test-token')
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ image_url: '/dog.jpg' }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const formData = new FormData()
    formData.append('image', new Blob(['image'], { type: 'image/jpeg' }), 'dog.jpg')

    await apiPost('/api/dogs/1/image', formData)

    const [, options] = fetchMock.mock.calls[0]
    expect(options.headers.get('Authorization')).toBe('Bearer test-token')
    expect(options.headers.has('Content-Type')).toBe(false)
    expect(options.body).toBe(formData)
  })

  it('clears saved auth and calls the unauthorized handler on 401', async () => {
    localStorage.setItem('finding-home-token', 'expired-token')
    localStorage.setItem('finding-home-user', JSON.stringify({ id: 'user-1' }))
    const onUnauthorized = vi.fn()
    const removeHandler = setUnauthorizedHandler(onUnauthorized)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Session expired' }),
    }))

    await expect(apiGet('/api/me')).rejects.toMatchObject({ message: 'Session expired', status: 401 })
    expect(localStorage.getItem('finding-home-token')).toBeNull()
    expect(localStorage.getItem('finding-home-user')).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
    removeHandler()
  })
})
