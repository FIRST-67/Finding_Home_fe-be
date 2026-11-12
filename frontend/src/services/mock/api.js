import ApiError from '../ApiError'
import { mockAdoptionRequests, mockDogs, mockFavorites, mockUsers } from './data'

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function getUserId(headers) {
  const authorization = headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  const userId = token.startsWith('mock-token-') ? Number(token.slice('mock-token-'.length)) : NaN
  return Number.isInteger(userId) ? userId : null
}

function getUser(headers) {
  const userId = getUserId(headers)
  return mockUsers.find((user) => user.id === userId)
}

function requireUser(headers) {
  const user = getUser(headers)
  if (!user) throw new ApiError('unauthorized', 401)
  return user
}

function requireAdmin(headers) {
  const user = requireUser(headers)
  if (user.role !== 'admin') throw new ApiError('forbidden', 403)
  return user
}

function requireMember(headers) {
  const user = requireUser(headers)
  if (user.role !== 'member') throw new ApiError('forbidden', 403)
  return user
}

function publicUser(user) {
  const { password, ...details } = user
  return details
}

function readBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body)
    } catch {
      throw new ApiError('invalid request body', 400)
    }
  }
  return body || {}
}

function positiveInt(value, fallback, max = 50) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

function paginate(items, searchParams) {
  const page = positiveInt(searchParams.get('page'), 1)
  const limit = positiveInt(searchParams.get('limit'), 12)
  const start = (page - 1) * limit
  return {
    data: clone(items.slice(start, start + limit)),
    page,
    limit,
    total: items.length,
  }
}

function publicDog(dog) {
  return clone(dog)
}

function publicRequest(request) {
  const dog = mockDogs.find((entry) => entry.id === request.dog_id)
  const user = mockUsers.find((entry) => entry.id === request.user_id)
  return {
    id: request.id,
    dog_id: request.dog_id,
    dog_name: dog?.name || request.dog_name || '',
    dog_image_url: dog?.image_url || request.dog_image_url || '',
    user_id: request.user_id,
    user_name: user?.name || request.user_name || '',
    message: request.message,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
  }
}

function validateDog(dog) {
  if (!dog.name?.trim()) throw new ApiError('name is required', 400)
  if (!['male', 'female'].includes(dog.gender)) throw new ApiError('gender must be male or female', 400)
  if (dog.age_years !== undefined && (!Number.isFinite(Number(dog.age_years)) || Number(dog.age_years) < 0)) {
    throw new ApiError('age_years must be at least 0', 400)
  }
  if (dog.status !== undefined && !['available', 'adopted'].includes(dog.status)) {
    throw new ApiError('status must be available or adopted', 400)
  }
}

export async function mockRequest(path, { method = 'GET', body, headers }) {
  const url = new URL(path, 'http://mock.local')
  const route = url.pathname
  const payload = readBody(body)
  const now = () => new Date().toISOString()

  if (route === '/api/health' && method === 'GET') return { status: 'ok' }
  if (route === '/api/db-check' && method === 'GET') {
    return { database: 'connected', time: now() }
  }

  if (route === '/api/auth/login' && method === 'POST') {
    const user = mockUsers.find(
      (candidate) => candidate.email === payload.email && candidate.password === payload.password,
    )
    if (!user) throw new ApiError('invalid email or password', 401)
    return { token: `mock-token-${user.id}`, user: publicUser(user) }
  }

  if (route === '/api/auth/register' && method === 'POST') {
    if (!payload.name?.trim() || payload.name.length > 50) throw new ApiError('name must be 1 to 50 characters', 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email || '')) throw new ApiError('email is invalid', 400)
    if ((payload.password || '').length < 8) throw new ApiError('password must be at least 8 characters', 400)
    if (mockUsers.some((user) => user.email === payload.email)) {
      throw new ApiError('email already registered', 409)
    }
    const id = Math.max(0, ...mockUsers.map((user) => user.id)) + 1
    const user = {
      id,
      name: payload.name,
      email: payload.email,
      phone: payload.phone || '',
      password: payload.password,
      role: 'member',
      created_at: now(),
    }
    mockUsers.push(user)
    return { token: `mock-token-${user.id}`, user: publicUser(user) }
  }

  if (route === '/api/auth/logout' && method === 'POST') {
    requireUser(headers)
    return null
  }
  if (route === '/api/auth/me' && method === 'GET') {
    return clone(publicUser(requireUser(headers)))
  }
  if (route === '/api/profile' && method === 'GET') {
    return clone(publicUser(requireUser(headers)))
  }
  if (route === '/api/profile' && method === 'PUT') {
    const user = requireUser(headers)
    if (!payload.name?.trim()) throw new ApiError('name is required', 400)
    user.name = payload.name
    user.phone = payload.phone || ''
    return clone(publicUser(user))
  }
  if (route === '/api/profile/password' && method === 'PUT') {
    const user = requireUser(headers)
    if (user.password !== payload.current_password) {
      throw new ApiError('current password is incorrect', 401)
    }
    if ((payload.new_password || '').length < 8) {
      throw new ApiError('new password must be at least 8 characters', 400)
    }
    user.password = payload.new_password
    return null
  }

  if (route === '/api/dogs' && method === 'GET') {
    const filters = url.searchParams
    const status = filters.get('status') || 'available'
    let dogs = mockDogs.filter((dog) => {
      if (filters.get('breed_id') && String(dog.breed_id) !== filters.get('breed_id')) return false
      if (filters.get('gender') && dog.gender !== filters.get('gender')) return false
      if (status && dog.status !== status) return false
      if (filters.get('q') && !dog.name.toLowerCase().includes(filters.get('q').toLowerCase())) return false
      return true
    })
    dogs = dogs.sort((a, b) => b.id - a.id)
    return paginate(dogs, filters)
  }

  const dogMatch = route.match(/^\/api\/dogs\/([^/]+)$/)
  if (dogMatch) {
    const dogId = Number(decodeURIComponent(dogMatch[1]))
    const dogIndex = mockDogs.findIndex((dog) => dog.id === dogId)
    if (method === 'GET') {
      if (dogIndex < 0) throw new ApiError('dog not found', 404)
      return publicDog(mockDogs[dogIndex])
    }
    if (method === 'PUT') {
      requireAdmin(headers)
      if (dogIndex < 0) throw new ApiError('dog not found', 404)
      if (payload.status === undefined) throw new ApiError('status is required', 400)
      validateDog(payload)
      Object.assign(mockDogs[dogIndex], payload, { age_years: Number(payload.age_years || 0) })
      return publicDog(mockDogs[dogIndex])
    }
    if (method === 'DELETE') {
      requireAdmin(headers)
      if (dogIndex < 0) throw new ApiError('dog not found', 404)
      mockDogs.splice(dogIndex, 1)
      for (let index = mockAdoptionRequests.length - 1; index >= 0; index -= 1) {
        if (mockAdoptionRequests[index].dog_id === dogId) mockAdoptionRequests.splice(index, 1)
      }
      for (const [userId, favorites] of mockFavorites) {
        mockFavorites.set(userId, favorites.filter((id) => id !== dogId))
      }
      return null
    }
  }

  if (route === '/api/dogs' && method === 'POST') {
    requireAdmin(headers)
    if (Object.hasOwn(payload, 'status')) throw new ApiError('status must not be provided', 400)
    validateDog(payload)
    const dog = {
      id: Math.max(0, ...mockDogs.map((entry) => entry.id)) + 1,
      name: payload.name,
      breed_id: payload.breed_id || null,
      breed_name: payload.breed_name || '',
      age_years: Number(payload.age_years || 0),
      gender: payload.gender,
      description: payload.description || '',
      image_url: payload.image_url || '',
      status: 'available',
      created_at: now(),
    }
    mockDogs.unshift(dog)
    return publicDog(dog)
  }

  if (route === '/api/favorites' && method === 'GET') {
    const user = requireMember(headers)
    const favoriteIds = mockFavorites.get(user.id) || []
    return clone(mockDogs.filter((dog) => favoriteIds.includes(dog.id)))
  }
  if (route === '/api/favorites' && method === 'POST') {
    const user = requireMember(headers)
    const dogId = Number(payload.dog_id)
    if (!mockDogs.some((dog) => dog.id === dogId)) throw new ApiError('dog not found', 404)
    const favorites = mockFavorites.get(user.id) || []
    if (!favorites.includes(dogId)) favorites.push(dogId)
    mockFavorites.set(user.id, favorites)
    return { dog_id: dogId }
  }
  const favoriteMatch = route.match(/^\/api\/favorites\/([^/]+)$/)
  if (favoriteMatch && method === 'DELETE') {
    const user = requireMember(headers)
    const dogId = Number(decodeURIComponent(favoriteMatch[1]))
    const favorites = mockFavorites.get(user.id) || []
    mockFavorites.set(user.id, favorites.filter((id) => id !== dogId))
    return null
  }

  if (route === '/api/adoption-requests' && method === 'POST') {
    const user = requireMember(headers)
    if (!payload.message?.trim()) throw new ApiError('message is required', 400)
    const dogId = Number(payload.dog_id)
    const dog = mockDogs.find((entry) => entry.id === dogId)
    if (!dog) throw new ApiError('dog not found', 404)
    if (dog.status !== 'available') throw new ApiError('dog is not available', 409)
    if (mockAdoptionRequests.some((entry) =>
      entry.user_id === user.id && entry.dog_id === dogId && entry.status === 'pending')) {
      throw new ApiError('you already have a pending request', 409)
    }
    const timestamp = now()
    const request = {
      id: Math.max(0, ...mockAdoptionRequests.map((entry) => entry.id)) + 1,
      dog_id: dogId,
      user_id: user.id,
      message: payload.message,
      status: 'pending',
      created_at: timestamp,
      updated_at: timestamp,
    }
    mockAdoptionRequests.unshift(request)
    return publicRequest(request)
  }
  if (route === '/api/adoption-requests/me' && method === 'GET') {
    const user = requireMember(headers)
    return clone(mockAdoptionRequests
      .filter((entry) => entry.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(publicRequest))
  }
  if (route === '/api/adoption-requests' && method === 'GET') {
    requireAdmin(headers)
    const filters = url.searchParams
    let requests = mockAdoptionRequests
    if (filters.get('status')) requests = requests.filter((entry) => entry.status === filters.get('status'))
    requests = requests.slice().sort((a, b) => b.created_at.localeCompare(a.created_at))
    return paginate(requests.map(publicRequest), filters)
  }
  const requestMatch = route.match(/^\/api\/adoption-requests\/([^/]+)$/)
  if (requestMatch) {
    const requestId = Number(decodeURIComponent(requestMatch[1]))
    const request = mockAdoptionRequests.find((entry) => entry.id === requestId)
    if (method === 'DELETE') {
      const user = requireMember(headers)
      if (!request) throw new ApiError('request not found', 404)
      if (request.user_id !== user.id) throw new ApiError('not your request', 403)
      if (request.status !== 'pending') throw new ApiError('only pending requests can be cancelled', 409)
      request.status = 'cancelled'
      request.updated_at = now()
      return null
    }
    if (method === 'PATCH') {
      requireAdmin(headers)
      if (!request) throw new ApiError('request not found', 404)
      if (!['approved', 'rejected'].includes(payload.status)) {
        throw new ApiError('status must be approved or rejected', 400)
      }
      if (request.status !== 'pending') throw new ApiError('request is no longer pending', 409)
      const dog = mockDogs.find((entry) => entry.id === request.dog_id)
      request.status = payload.status
      request.updated_at = now()
      if (payload.status === 'approved' && dog) {
        dog.status = 'adopted'
        for (const other of mockAdoptionRequests) {
          if (other.dog_id === dog.id && other.id !== request.id && other.status === 'pending') {
            other.status = 'rejected'
            other.updated_at = now()
          }
        }
      }
      return publicRequest(request)
    }
  }

  throw new ApiError('not found', 404)
}
