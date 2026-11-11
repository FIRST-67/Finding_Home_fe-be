import { beforeEach, describe, expect, it } from 'vitest'
import { mockAdoptionRequests, mockDogs, mockFavorites } from './data'
import { mockRequest } from './api'

async function login(email, password = 'password123') {
  const session = await mockRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    headers: new Headers(),
  })
  return new Headers({ Authorization: `Bearer ${session.token}` })
}

describe('mock API contract', () => {
  beforeEach(() => {
    mockAdoptionRequests.splice(0)
    mockFavorites.clear()
    mockDogs[0].status = 'available'
    mockDogs[1].status = 'available'
    mockDogs[2].status = 'adopted'
  })

  it('returns paginated dog data using the contract fields', async () => {
    const result = await mockRequest('/api/dogs?page=1&limit=1&status=available', {
      headers: new Headers(),
    })

    expect(result).toMatchObject({ page: 1, limit: 1, total: 2 })
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      id: expect.any(Number),
      breed_name: expect.any(String),
      age_years: expect.any(Number),
      status: 'available',
    })
    expect(result.data[0]).not.toHaveProperty('breed')
  })

  it('adds and removes favorites with contract request shapes', async () => {
    const headers = await login('member@example.com')
    const added = await mockRequest('/api/favorites', {
      method: 'POST',
      body: { dog_id: 1 },
      headers,
    })
    expect(added).toEqual({ dog_id: 1 })
    expect(await mockRequest('/api/favorites', { headers })).toHaveLength(1)
    expect(await mockRequest('/api/favorites/1', { method: 'DELETE', headers })).toBeNull()
    expect(await mockRequest('/api/favorites', { headers })).toHaveLength(0)
  })

  it('creates, lists, and approves adoption requests per contract', async () => {
    const memberHeaders = await login('member@example.com')
    const request = await mockRequest('/api/adoption-requests', {
      method: 'POST',
      body: { dog_id: 1, message: 'มีบ้านพร้อมดูแล' },
      headers: memberHeaders,
    })
    expect(request).toMatchObject({
      dog_id: 1,
      dog_name: mockDogs[0].name,
      user_id: 1,
      status: 'pending',
    })
    expect(await mockRequest('/api/adoption-requests/me', { headers: memberHeaders })).toHaveLength(1)

    const adminHeaders = await login('admin@example.com')
    const listing = await mockRequest('/api/adoption-requests?status=pending', { headers: adminHeaders })
    expect(listing).toMatchObject({ page: 1, limit: 12, total: 1 })
    const updated = await mockRequest(`/api/adoption-requests/${request.id}`, {
      method: 'PATCH',
      body: { status: 'approved' },
      headers: adminHeaders,
    })
    expect(updated.status).toBe('approved')
    expect(mockDogs[0].status).toBe('adopted')
  })
})
