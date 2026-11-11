import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DogImage from '../components/DogImage'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { getDog } from '../services/dogs'
import { addFavorite, getFavorites, removeFavorite } from '../services/favorites'

export default function DogDetailPage() {
  const { dogId } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [dog, setDog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [actionError, setActionError] = useState('')
  const [savingFavorite, setSavingFavorite] = useState(false)

  const loadDog = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDog(await getDog(dogId))
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลสุนัขไม่สำเร็จ')
      setDog(null)
    } finally {
      setLoading(false)
    }
  }, [dogId])

  useEffect(() => {
    loadDog()
  }, [loadDog])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'member') return
    getFavorites()
      .then((favorites) => setFavorite(favorites.some((entry) => String(entry.id) === dogId)))
      .catch((favoriteError) => setActionError(favoriteError.message || 'โหลดรายการโปรดไม่สำเร็จ'))
  }, [dogId, isAuthenticated, user?.role])

  async function toggleFavorite() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/dogs/${dogId}` } })
      return
    }
    if (user?.role !== 'member') return
    setSavingFavorite(true)
    setActionError('')
    try {
      if (favorite) await removeFavorite(dogId)
      else await addFavorite(dogId)
      setFavorite(!favorite)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setSavingFavorite(false)
    }
  }

  if (loading) return <Loading>กำลังโหลดข้อมูลน้องหมา...</Loading>
  if (error) return <ErrorMessage message={error} onRetry={loadDog} />
  if (!dog) return <EmptyState>ไม่พบข้อมูลน้องหมา</EmptyState>

  const canAdopt = dog.status === 'available' && user?.role !== 'admin'
  const age = Number(dog.age_years) < 1
    ? `${Number(dog.age_years) * 12} เดือน`
    : `${dog.age_years} ปี`
  return (
    <article className="dog-detail">
      <DogImage src={dog.image_url} alt={dog.name} loading="eager" />
      <div className="dog-detail__body">
        <p className="eyebrow">กำลังมองหาบ้าน</p>
        <h1>{dog.name}</h1>
        <p className="dog-detail__facts">
          {dog.breed_name || 'ไม่ทราบสายพันธุ์'} · {dog.age_years == null ? 'ไม่ทราบอายุ' : age} · {dog.gender === 'female' ? 'เพศเมีย' : 'เพศผู้'}
        </p>
        <p>{dog.description || 'ยังไม่มีรายละเอียดเพิ่มเติม'}</p>
        <p>สถานะ: {dog.status === 'available' ? 'พร้อมหาบ้าน' : 'ได้บ้านแล้ว'}</p>
        {actionError && <ErrorMessage message={actionError} />}
        <div className="button-row">
          {user?.role !== 'admin' && (
            <button type="button" disabled={savingFavorite} onClick={toggleFavorite}>
              {savingFavorite ? 'กำลังบันทึก...' : favorite ? '♥ นำออกจากรายการโปรด' : '♡ เพิ่มในรายการโปรด'}
            </button>
          )}
          {canAdopt && (
            isAuthenticated
              ? <Link className="button-link" to={`/dogs/${dogId}/adoption`}>ขอรับเลี้ยง</Link>
              : <button type="button" onClick={() => navigate('/login', { state: { from: `/dogs/${dogId}/adoption` } })}>ขอรับเลี้ยง</button>
          )}
        </div>
      </div>
    </article>
  )
}
