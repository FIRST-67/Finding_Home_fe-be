import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import DogCard from '../../components/DogCard'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import PawLoader from '../../components/PawLoader'
import { getFavorites, removeFavorite } from '../../services/favorites'

export default function FavoritesPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setDogs(await getFavorites())
    } catch (loadError) {
      setDogs([])
      setError(loadError.message || 'โหลดรายการโปรดไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function toggleFavorite(dog) {
    setRemovingId(dog.id)
    setError('')
    try {
      await removeFavorite(dog.id)
      setDogs((current) => current.filter((entry) => entry.id !== dog.id))
    } catch (removeError) {
      setError(removeError.message || 'นำออกจากรายการโปรดไม่สำเร็จ')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <section className="favorites-page">
      <header className="page-intro">
        <p className="eyebrow">เก็บไว้ในใจ</p>
        <h1>น้องหมาที่คุณชื่นชอบ</h1>
        <p>เพื่อนสี่ขาที่คุณสนใจและอยากทำความรู้จัก</p>
      </header>
      {loading && <PawLoader />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !dogs.length && (
        <EmptyState illustrated action={<Link className="button-link" to="/explore">ไปค้นหาน้องหมา</Link>}>
          ยังไม่มีน้องหมาในรายการโปรด
        </EmptyState>
      )}
      {!loading && !error && Boolean(dogs.length) && (
        <div className="grid">{dogs.map((dog) => (
          <DogCard
            key={dog.id}
            dog={dog}
            isFavorite
            onFavoriteToggle={toggleFavorite}
            removing={removingId === dog.id}
          />
        ))}</div>
      )}
    </section>
  )
}
