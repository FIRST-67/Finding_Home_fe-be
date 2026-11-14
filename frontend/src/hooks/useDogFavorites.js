import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addFavorite, getFavorites, removeFavorite } from '../services/favorites'

export default function useDogFavorites() {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [favoriteIds, setFavoriteIds] = useState(() => new Set())
  const [savingIds, setSavingIds] = useState(() => new Set())
  const [error, setError] = useState('')
  const pendingIds = useRef(new Set())
  const isMember = user?.role === 'member'
  const canFavorite = user?.role !== 'admin'

  useEffect(() => {
    let active = true
    if (!isAuthenticated || !isMember) {
      setFavoriteIds(new Set())
      setError('')
      return () => { active = false }
    }

    getFavorites()
      .then((favorites) => {
        if (active) setFavoriteIds(new Set(favorites.map((dog) => String(dog.id))))
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || 'โหลดรายการโปรดไม่สำเร็จ')
      })

    return () => { active = false }
  }, [isAuthenticated, isMember])

  const toggleFavorite = useCallback(async (dog) => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: { from: `${location.pathname}${location.search}` },
      })
      return
    }
    if (!isMember) return

    const dogId = String(dog.id)
    if (pendingIds.current.has(dogId)) return

    pendingIds.current.add(dogId)
    setSavingIds((current) => new Set(current).add(dogId))
    setError('')
    try {
      if (favoriteIds.has(dogId)) {
        await removeFavorite(dog.id)
        setFavoriteIds((current) => {
          const next = new Set(current)
          next.delete(dogId)
          return next
        })
      } else {
        await addFavorite(dog.id)
        setFavoriteIds((current) => new Set(current).add(dogId))
      }
    } catch (saveError) {
      setError(saveError.message || 'บันทึกรายการโปรดไม่สำเร็จ')
    } finally {
      pendingIds.current.delete(dogId)
      setSavingIds((current) => {
        const next = new Set(current)
        next.delete(dogId)
        return next
      })
    }
  }, [favoriteIds, isAuthenticated, isMember, location.pathname, location.search, navigate])

  return {
    canFavorite,
    favoriteIds,
    savingIds,
    error,
    toggleFavorite,
  }
}
