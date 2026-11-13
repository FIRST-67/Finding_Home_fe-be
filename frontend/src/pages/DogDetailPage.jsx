import { useCallback, useEffect, useState } from 'react'
import { Heart, MapPin, PawPrint } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import DogImage from '../components/DogImage'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import PawLoader from '../components/PawLoader'
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
  const [celebratingDog, setCelebratingDog] = useState(null)
  const celebrating = favorite && celebratingDog === dogId
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
    setCelebratingDog(null)
    setSavingFavorite(true)
    setActionError('')
    try {
      if (favorite) await removeFavorite(dogId)
      else {
        await addFavorite(dogId)
        setCelebratingDog(dogId)
      }
      setFavorite(!favorite)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setSavingFavorite(false)
    }
  }

  if (loading) return <PawLoader>กำลังโหลดข้อมูลน้องหมา...</PawLoader>
  if (error) return <ErrorMessage message={error} onRetry={loadDog} />
  if (!dog) return <EmptyState>ไม่พบข้อมูลน้องหมา</EmptyState>

  const canAdopt = dog.status === 'available' && user?.role !== 'admin'
  const age = Number(dog.age_years) < 1
    ? `${Number(dog.age_years) * 12} เดือน`
    : `${dog.age_years} ปี`
  const healthDetails = dog.health_status || dog.vaccination_status
  const location = dog.location || dog.province
  return (
    <article className="dog-detail">
      <DogImage src={dog.image_url} alt={dog.name} breed={dog.breed_name} loading="eager" />
      <div className="dog-detail__body">
        <p className="eyebrow">ทำความรู้จักเพื่อนใหม่</p>
        <div className="dog-detail__title">
          <h1>{dog.name}</h1>
          <span className={`dog-card__status${dog.status === 'available' ? ' dog-card__status--available' : ' dog-card__status--adopted'}`}>
            {dog.status === 'available' ? 'พร้อมหาบ้าน' : 'ได้บ้านแล้ว'}
          </span>
        </div>
        <p className="dog-detail__facts">
          {dog.breed_name || 'ไม่ทราบสายพันธุ์'} <span>·</span> {dog.age_years == null ? 'ไม่ทราบอายุ' : age} <span>·</span> {dog.gender === 'female' ? 'เพศเมีย' : 'เพศผู้'}
        </p>
        {location && <p className="dog-detail__location"><MapPin size={16} aria-hidden="true" />{location}</p>}
        <section className="detail-panel">
          <h2>นิสัยและการดูแล</h2>
          <p>{dog.description || 'ศูนย์ช่วยเหลือยังไม่ได้เพิ่มรายละเอียดน้องหมา'}</p>
        </section>
        <section className="detail-panel">
          <h2>สุขภาพและวัคซีน</h2>
          <p>{healthDetails || 'ยังไม่มีข้อมูลสุขภาพและวัคซีน กรุณาสอบถามผู้ดูแลก่อนรับเลี้ยง'}</p>
        </section>
        <section className="detail-panel">
          <h2>รายละเอียดการรับเลี้ยง</h2>
          <p>{dog.status === 'available' ? 'น้องกำลังรอพบครอบครัวที่พร้อมดูแลระยะยาว' : 'น้องได้พบครอบครัวแล้ว'}</p>
        </section>
        {actionError && <ErrorMessage message={actionError} />}
        <div className="button-row dog-detail__actions">
          {user?.role !== 'admin' && (
            <button
              className={`button-link button-link--secondary favorite-action${celebrating ? ' is-celebrating' : ''}`}
              type="button"
              disabled={savingFavorite}
              onClick={toggleFavorite}
            >
              {celebrating && (
                <span className="favorite-action__paws" aria-hidden="true" onAnimationEnd={() => setCelebratingDog(null)}>
                  <PawPrint size={13} /><PawPrint size={11} /><PawPrint size={14} />
                </span>
              )}
              {savingFavorite ? 'กำลังบันทึก...' : (
                <>
                  <Heart size={16} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
                  {favorite ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                </>
              )}
            </button>
          )}
          {canAdopt && (
            isAuthenticated
              ? <Link className="button-link" to={`/dogs/${dogId}/adoption`}>รับเลี้ยงน้องคนนี้</Link>
              : <button className="button-link" type="button" onClick={() => navigate('/login', { state: { from: `/dogs/${dogId}/adoption` } })}>รับเลี้ยงน้องคนนี้</button>
          )}
        </div>
      </div>
    </article>
  )
}
