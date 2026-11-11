import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'finding-home-token'
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
    clearSession()
    navigate('/', { replace: true })
  }, [clearSession, navigate])

  useEffect(() => setUnauthorizedHandler(() => {
    const returnTo = `${location.pathname}${location.search}`
    clearSession()
    navigate('/login', { replace: true, state: { from: returnTo } })
  }), [clearSession, location.pathname, location.search, navigate])

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
