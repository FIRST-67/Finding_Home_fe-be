import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentUser, logout as logoutRequest } from '../services/auth'
import { setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'token'
const USER_KEY = 'finding-home-user'

function readStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readStoredUser)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const setSession = useCallback(({ token: nextToken, user: nextUser }) => {
    if (!nextToken || !nextUser) throw new Error('ข้อมูลการเข้าสู่ระบบไม่ครบถ้วน')
    // Keep the session in one place so the API client can attach the token.
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const updateUser = useCallback((nextUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    logoutRequest().catch((error) => console.error('เรียก logout API ไม่สำเร็จ:', error))
    clearSession()
    navigate('/', { replace: true })
  }, [clearSession, navigate])

  useEffect(() => setUnauthorizedHandler(() => {
    const returnTo = `${location.pathname}${location.search}`
    clearSession()
    navigate('/login', { replace: true, state: { from: returnTo } })
  }), [clearSession, location.pathname, location.search, navigate])

  useEffect(() => {
    if (!token) return undefined
    let active = true
    Promise.resolve()
      .then(() => getCurrentUser())
      .then((currentUser) => {
        if (!active) return
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
        setUser(currentUser)
      })
      .catch((error) => {
        if (error.status !== 401) console.error('ตรวจสอบ session ไม่สำเร็จ:', error)
      })
    return () => { active = false }
  }, [token])

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    setSession,
    updateUser,
    logout,
  }), [token, user, setSession, updateUser, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth ต้องใช้ภายใน AuthProvider')
  return context
}
