import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdoptionSteps from '../components/AdoptionSteps'
import DogCard from '../components/DogCard'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import HeroCarousel from '../components/HeroCarousel'
import Loading from '../components/Loading'
import { getDogs } from '../services/dogs'

function shuffle(dogs) {
  const shuffled = [...dogs]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const currentDog = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = currentDog
  }
  return shuffled
}

export default function HomePage() {
  const [dogs, setDogs] = useState([])
  const [heroDogs, setHeroDogs] = useState([])
  const [query, setQuery] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getDogs({ status: 'available', limit: 50 })
      const availableDogs = response.data.filter((dog) => dog.status === 'available')
      setDogs(availableDogs)
      setHeroDogs(shuffle(availableDogs).slice(0, 6))
    } catch (loadError) {
      setError(loadError.message || 'โหลดรายการสุนัขไม่สำเร็จ')
      setDogs([])
      setHeroDogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function handleSubmit(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (gender) params.set('sex', gender)
    const search = params.toString()
    navigate(`/explore${search ? `?${search}` : ''}`)
  }

  const breeds = [...new Set(dogs.map((dog) => dog.breed_name).filter(Boolean))]

  return (
    <div className="home-page">
      <section className={`home-intro${!loading && !heroDogs.length ? ' home-intro--no-photo' : ''}`}>
        <div className="home-intro__copy">
          <p className="eyebrow">ยินดีต้อนรับสู่ Finding Home</p>
          <h1>พบเพื่อนซี้<br />ที่ใช่สำหรับคุณ</h1>
          <p>ทุกตัวกำลังรอโอกาสได้เริ่มต้นชีวิตใหม่ในบ้านที่แสนรัก</p>
          <Link className="button-link" to="/explore">ค้นหาน้องหมา <span aria-hidden="true">→</span></Link>
        </div>
        <HeroCarousel dogs={heroDogs} loading={loading} />
      </section>

      <form className="search search--home" onSubmit={handleSubmit}>
        <label className="search__field">
          <span aria-hidden="true">⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาตามชื่อหรือสายพันธุ์"
            aria-label="ค้นหาตามชื่อหรือสายพันธุ์"
          />
        </label>
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value)}
          aria-label="เพศ"
        >
          <option value="">ทุกเพศ</option>
          <option value="male">เพศผู้</option>
          <option value="female">เพศเมีย</option>
        </select>
        <button type="submit">ค้นหา</button>
      </form>

      {breeds.length > 1 && (
        <section className="breed-filter" aria-label="เลือกสายพันธุ์">
          <span className="breed-filter__label">สายพันธุ์</span>
          <div className="breed-filter__items">
            {breeds.map((breed) => (
              <Link
                className="breed-filter__chip"
                key={breed}
                to={`/explore?breed=${encodeURIComponent(breed)}`}
              >
                {breed}
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading && <Loading>กำลังค้นหาน้องหมา...</Loading>}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && dogs.length === 0 && (
        <EmptyState>ยังไม่มีน้องหมาที่พร้อมหาบ้านในขณะนี้</EmptyState>
      )}
      {!loading && !error && dogs.length > 0 && (
        <section className="dog-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">เพื่อนใหม่ของคุณ</p>
              <h2>น้องหมาที่กำลังหาบ้าน</h2>
            </div>
            <Link to="/explore">ดูทั้งหมด <span aria-hidden="true">→</span></Link>
          </div>
          <div className="grid">
            {dogs.slice(0, 4).map((dog) => <DogCard key={dog.id} dog={dog} />)}
          </div>
        </section>
      )}

      <AdoptionSteps />
    </div>
  )
}
