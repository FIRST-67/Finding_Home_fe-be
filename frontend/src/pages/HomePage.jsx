import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdoptionSteps from '../components/AdoptionSteps'
import DogCard from '../components/DogCard'
import DogCardSkeletons from '../components/DogCardSkeletons'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import HeroCarousel from '../components/HeroCarousel'
import useReveal from '../hooks/useReveal'
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

function FeaturedDogs({ dogs }) {
  const sectionHeadingReveal = useReveal()

  return (
    <section>
      <div
        className={`section-heading reveal${sectionHeadingReveal.isRevealed ? ' is-revealed' : ''}`}
        ref={sectionHeadingReveal.ref}
      >
        <div>
          <p className="eyebrow">เพื่อนใหม่ของคุณ</p>
          <h2>น้องหมาที่กำลังหาบ้าน</h2>
        </div>
        <Link to="/explore">ดูทั้งหมด <span aria-hidden="true">→</span></Link>
      </div>
      <div className="grid home-featured-grid">
        {dogs.slice(0, 8).map((dog, index) => (
          <DogCard key={dog.id} dog={dog} style={{ '--stagger-delay': `${index * 60}ms` }} />
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  const [dogs, setDogs] = useState([])
  const [heroDogs, setHeroDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getDogs({ status: 'available', limit: 50 })
      const availableDogsById = new Map()
      for (const dog of response.data) {
        if (dog.status === 'available' && !availableDogsById.has(dog.id)) {
          availableDogsById.set(dog.id, dog)
        }
      }
      const availableDogs = [...availableDogsById.values()]
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

  return (
    <div className="home-page">
      <section className={`home-intro${!loading && !heroDogs.length ? ' home-intro--no-photo' : ''}`}>
        <svg className="home-intro__paw-pattern" viewBox="0 0 360 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <pattern id="hero-paw-print" width="112" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)">
              <g fill="currentColor">
                <ellipse cx="22" cy="33" rx="6" ry="9" transform="rotate(-24 22 33)" />
                <ellipse cx="39" cy="20" rx="6" ry="9" transform="rotate(-8 39 20)" />
                <ellipse cx="56" cy="20" rx="6" ry="9" transform="rotate(8 56 20)" />
                <ellipse cx="73" cy="33" rx="6" ry="9" transform="rotate(24 73 33)" />
                <path d="M47 36c-11 0-22 11-22 22 0 7 6 10 11 8 4-1 7-3 11-3s7 2 11 3c5 2 11-1 11-8 0-11-11-22-22-22z" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-paw-print)" />
        </svg>
        <div className="home-intro__copy">
          <p className="eyebrow">ยินดีต้อนรับสู่ Finding Home</p>
          <h1>พบเพื่อนซี้<br />ที่ใช่สำหรับคุณ</h1>
          <p>ทุกตัวกำลังรอโอกาสได้เริ่มต้นชีวิตใหม่ในบ้านที่แสนรัก</p>
          <Link className="button-link" to="/explore">ค้นหาน้องหมา <span aria-hidden="true">→</span></Link>
        </div>
        <HeroCarousel dogs={heroDogs} loading={loading} />
      </section>

      {loading && <DogCardSkeletons />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && dogs.length === 0 && (
        <EmptyState>ยังไม่มีน้องหมาที่พร้อมหาบ้านในขณะนี้</EmptyState>
      )}
      {!loading && !error && dogs.length > 0 && <FeaturedDogs dogs={dogs} />}

      <AdoptionSteps />
    </div>
  )
}
