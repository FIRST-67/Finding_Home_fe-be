import { beforeEach, describe, expect, it } from 'vitest'
import { mockDogs } from './data'
import { mockRequest } from './api'

describe('mock API', () => {
  beforeEach(() => {
    mockDogs[0].image_url = null
  })

  it('supports dog listings and stores uploaded images as data URLs', async () => {
    const login = await mockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@example.com', password: 'password123' },
      headers: new Headers(),
    })
    const headers = new Headers({ Authorization: `Bearer ${login.token}` })
    const dogs = await mockRequest('/api/dogs?status=available', { headers })
    expect(dogs.length).toBeGreaterThan(0)

    const formData = new FormData()
    formData.append('image', new File(['mock image'], 'mali.jpg', { type: 'image/jpeg' }))
    const result = await mockRequest('/api/dogs/dog-1/image', {
      method: 'POST',
      body: formData,
      headers,
    })

    expect(result.image_url).toMatch(/^data:image\/jpeg;base64,/)
    expect(mockDogs[0].image_url).toBe(result.image_url)
  })

  it('rejects admin actions from a member account', async () => {
    const login = await mockRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'member@example.com', password: 'password123' },
      headers: new Headers(),
    })
    const headers = new Headers({ Authorization: `Bearer ${login.token}` })
    const formData = new FormData()
    formData.append('image', new File(['mock image'], 'mali.jpg', { type: 'image/jpeg' }))

    await expect(mockRequest('/api/dogs/dog-1/image', {
      method: 'POST',
      body: formData,
      headers,
    })).rejects.toMatchObject({ status: 403 })
  })
})
