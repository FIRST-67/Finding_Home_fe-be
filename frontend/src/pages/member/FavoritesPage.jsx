import { useCallback, useEffect, useState } from 'react'
import DogCard from '../../components/DogCard'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getFavorites } from '../../services/favorites'

export default function FavoritesPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <section>
      <h1>น้องหมาที่คุณชื่นชอบ</h1>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !dogs.length && <EmptyState>ยังไม่มีรายการโปรด ลองเลือกน้องหมาที่ถูกใจ</EmptyState>}
      {!loading && !error && Boolean(dogs.length) && (
        <div className="grid">{dogs.map((dog) => <DogCard key={dog.id} dog={dog} />)}</div>
      )}
    </section>
  )
}
