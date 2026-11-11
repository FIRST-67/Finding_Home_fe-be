import ApiError from '../ApiError'
import { mockAdoptionRequests, mockDogs, mockFavorites, mockUsers } from './data'

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value))
}

function getUserId(headers) {
  const authorization = headers.get('Authorization') || ''
  const token = authorization.replace(/^Bearer\s+/i, '')
  return token.startsWith('mock-token-') ? token.slice('mock-token-'.length) : null
}

function getUser(headers) {
  const userId = getUserId(headers)
  return mockUsers.find((user) => user.id === userId)
}

function requireUser(headers) {
  const user = getUser(headers)
  if (!user) throw new ApiError('กรุณาเข้าสู่ระบบอีกครั้ง', 401)
  return user
}

function requireAdmin(headers) {
  const user = requireUser(headers)
  if (user.role !== 'admin') throw new ApiError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403)
  return user
}

function requireMember(headers) {
  const user = requireUser(headers)
  if (user.role !== 'member') throw new ApiError('คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้', 403)
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
      throw new ApiError('รูปแบบข้อมูลไม่ถูกต้อง', 400)
    }
  }
  return body || {}
}

function readDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new ApiError('อ่านไฟล์รูปไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

export async function mockRequest(path, { method = 'GET', body, headers }) {
  const url = new URL(path, 'http://mock.local')
  const route = url.pathname
  const payload = body instanceof FormData ? body : readBody(body)

  if (route === '/api/health' && method === 'GET') return { status: 'ok' }

  if (route === '/api/auth/login' && method === 'POST') {
    const user = mockUsers.find(
      (candidate) => candidate.email === payload.email && candidate.password === payload.password,
    )
    if (!user) throw new ApiError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401)
    return { token: `mock-token-${user.id}`, user: publicUser(user) }
  }

  if (route === '/api/auth/register' && method === 'POST') {
    if (mockUsers.some((user) => user.email === payload.email)) {
      throw new ApiError('อีเมลนี้ถูกใช้งานแล้ว', 409)
    }
    const user = {
      id: `user-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: 'member',
    }
    mockUsers.push(user)
    return { token: `mock-token-${user.id}`, user: publicUser(user) }
  }

  if (route === '/api/me' && method === 'GET') return clone(publicUser(requireUser(headers)))
  if (route === '/api/me' && method === 'PUT') {
    const user = requireUser(headers)
    Object.assign(user, payload)
    return clone(publicUser(user))
  }
  if (route === '/api/me/password' && method === 'PUT') {
    const user = requireUser(headers)
    if (user.password !== payload.oldPassword) throw new ApiError('รหัสผ่านเดิมไม่ถูกต้อง', 400)
    user.password = payload.newPassword
    return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' }
  }

  if (route === '/api/dogs' && method === 'GET') {
    const filters = Object.fromEntries(url.searchParams)
    const dogs = mockDogs.filter((dog) => {
      if (filters.breed && !dog.breed.toLowerCase().includes(filters.breed.toLowerCase())) return false
      if (filters.size && dog.size !== filters.size) return false
      if (filters.age && !dog.age.includes(filters.age)) return false
      if (filters.gender && dog.gender !== filters.gender) return false
      if (filters.status && dog.status !== filters.status) return false
      if (filters.q && !`${dog.name} ${dog.breed}`.toLowerCase().includes(filters.q.toLowerCase())) return false
      return true
    })
    return clone(dogs)
  }

  const dogMatch = route.match(/^\/api\/dogs\/([^/]+)(?:\/(image))?$/)
  if (dogMatch) {
    const [, dogId, imageRoute] = dogMatch
    const dogIndex = mockDogs.findIndex((dog) => dog.id === decodeURIComponent(dogId))
    if (method === 'POST' && imageRoute) {
      requireAdmin(headers)
      const dog = mockDogs[dogIndex]
      if (!dog) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
      const file = payload.get('image')
      if (!file) throw new ApiError('กรุณาเลือกไฟล์รูปภาพ', 400)
      dog.image_url = await readDataUrl(file)
      return { image_url: dog.image_url }
    }
    if (imageRoute) throw new ApiError('ไม่พบ endpoint นี้', 404)
    if (method === 'GET') {
      if (!mockDogs[dogIndex]) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
      return clone(mockDogs[dogIndex])
    }
    if (method === 'PUT') {
      requireAdmin(headers)
      if (!mockDogs[dogIndex]) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
      Object.assign(mockDogs[dogIndex], payload)
      return clone(mockDogs[dogIndex])
    }
    if (method === 'DELETE') {
      requireAdmin(headers)
      if (dogIndex < 0) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
      mockDogs.splice(dogIndex, 1)
      return { message: 'ลบข้อมูลสุนัขแล้ว' }
    }
  }

  if (route === '/api/dogs' && method === 'POST') {
    requireAdmin(headers)
    const dog = { ...payload, id: `dog-${Date.now()}`, image_url: payload.image_url || null }
    mockDogs.unshift(dog)
    return clone(dog)
  }

  if (route === '/api/favorites' && method === 'GET') {
    const user = requireMember(headers)
    return clone(mockDogs.filter((dog) => (mockFavorites.get(user.id) || []).includes(dog.id)))
  }
  const favoriteMatch = route.match(/^\/api\/favorites\/([^/]+)$/)
  if (favoriteMatch) {
    const user = requireMember(headers)
    const dogId = decodeURIComponent(favoriteMatch[1])
    const favorites = mockFavorites.get(user.id) || []
    if (method === 'POST') {
      if (!mockDogs.some((dog) => dog.id === dogId)) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
      if (!favorites.includes(dogId)) favorites.push(dogId)
      mockFavorites.set(user.id, favorites)
      return { message: 'เพิ่มรายการโปรดแล้ว' }
    }
    if (method === 'DELETE') {
      mockFavorites.set(user.id, favorites.filter((id) => id !== dogId))
      return { message: 'นำออกจากรายการโปรดแล้ว' }
    }
  }

  if (route === '/api/adoption-requests' && method === 'POST') {
    const user = requireMember(headers)
    const dog = mockDogs.find((entry) => entry.id === payload.dogId)
    if (!dog) throw new ApiError('ไม่พบข้อมูลสุนัข', 404)
    const adoptionRequest = {
      ...payload,
      id: `request-${Date.now()}`,
      userId: user.id,
      dog: clone(dog),
      status: 'pending',
    }
    mockAdoptionRequests.unshift(adoptionRequest)
    return clone(adoptionRequest)
  }
  if (route === '/api/adoption-requests/mine' && method === 'GET') {
    const user = requireMember(headers)
    return clone(mockAdoptionRequests.filter((entry) => entry.userId === user.id))
  }
  if (route === '/api/adoption-requests' && method === 'GET') {
    requireAdmin(headers)
    return clone(mockAdoptionRequests)
  }
  const adoptionMatch = route.match(/^\/api\/adoption-requests\/([^/]+)$/)
  if (adoptionMatch && method === 'PUT') {
    requireAdmin(headers)
    const adoptionRequest = mockAdoptionRequests.find(
      (entry) => entry.id === decodeURIComponent(adoptionMatch[1]),
    )
    if (!adoptionRequest) throw new ApiError('ไม่พบคำขอรับเลี้ยง', 404)
    adoptionRequest.status = payload.status
    return clone(adoptionRequest)
  }

  throw new ApiError('ไม่พบข้อมูลที่ร้องขอ', 404)
}
