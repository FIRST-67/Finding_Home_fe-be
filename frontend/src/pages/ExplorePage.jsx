import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import DogCard from '../components/DogCard'
import DogCardSkeletons from '../components/DogCardSkeletons'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import useReveal from '../hooks/useReveal'
import { getDogs } from '../services/dogs'

const EMPTY_FILTERS = { q: '', breed: '', age: '', size: '', gender: '', location: '' }

function matchesAge(dog, age) {
  if (!age) return true
  if (dog.age_years == null) return false
  if (age === 'puppy') return Number(dog.age_years) < 1
  if (age === 'young') return Number(dog.age_years) >= 1 && Number(dog.age_years) < 4
  return Number(dog.age_years) >= 4
}

export default function ExplorePage() {
  const [dogs, setDogs] = useState([])
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    q: searchParams.get('q') || '',
    breed: searchParams.get('breed') || '',
    gender: searchParams.get('sex') || '',
  }))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const resultsHeadingReveal = useReveal()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getDogs({ status: 'available', page: 1, limit: 50 })
      setDogs(response.data)
    } catch (loadError) {
      setDogs([])
      setError(loadError.message || 'โหลดรายการสุนัขไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const breeds = [...new Set(dogs.map((dog) => dog.breed_name).filter(Boolean))]
  const filteredDogs = useMemo(() => dogs.filter((dog) => {
    const query = filters.q.trim().toLocaleLowerCase()
    const matchesQuery = !query
      || `${dog.name} ${dog.breed_name || ''}`.toLocaleLowerCase().includes(query)
    const matchesBreed = !filters.breed || dog.breed_name === filters.breed
    const matchesSize = !filters.size || dog.size === filters.size
    const location = dog.location || dog.province || ''
    const matchesLocation = !filters.location
      || location.toLocaleLowerCase().includes(filters.location.trim().toLocaleLowerCase())
    return matchesQuery
      && matchesBreed
      && matchesAge(dog, filters.age)
      && matchesSize
      && matchesLocation
      && (!filters.gender || dog.gender === filters.gender)
  }), [dogs, filters])

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  return (
    <section className="explore-page">
      <header className="page-intro">
        <p className="eyebrow">เพื่อนซี้รอคุณอยู่</p>
        <h1>ค้นหาน้องหมา</h1>
        <p>เลือกดูสมาชิกสี่ขาที่พร้อมเริ่มต้นชีวิตใหม่ไปด้วยกัน</p>
      </header>

      <div className="explore-filters">
        <label className="explore-filters__search">
          <span>ค้นหาชื่อหรือสายพันธุ์</span>
          <input name="q" value={filters.q} onChange={updateFilter} placeholder="เช่น มะลิ หรือ ไทยผสม" />
        </label>
        <label>
          <span>สายพันธุ์</span>
          <select name="breed" value={filters.breed} onChange={updateFilter}>
            <option value="">ทุกสายพันธุ์</option>
            {breeds.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
          </select>
        </label>
        <label>
          <span>ช่วงอายุ</span>
          <select name="age" value={filters.age} onChange={updateFilter}>
            <option value="">ทุกช่วงวัย</option>
            <option value="puppy">ต่ำกว่า 1 ปี</option>
            <option value="young">1–3 ปี</option>
            <option value="adult">4 ปีขึ้นไป</option>
          </select>
        </label>
        <label>
          <span>ขนาด</span>
          <select name="size" value={filters.size} onChange={updateFilter}>
            <option value="">ทุกขนาด</option>
            <option value="small">เล็ก</option>
            <option value="medium">กลาง</option>
            <option value="large">ใหญ่</option>
          </select>
        </label>
        <label>
          <span>เพศ</span>
          <select name="gender" value={filters.gender} onChange={updateFilter}>
            <option value="">ทุกเพศ</option>
            <option value="male">เพศผู้</option>
            <option value="female">เพศเมีย</option>
          </select>
        </label>
        <label>
          <span>พื้นที่</span>
          <input name="location" value={filters.location} onChange={updateFilter} placeholder="จังหวัดหรือพื้นที่" />
        </label>
      </div>

      <div
        className={`section-heading explore-results-heading reveal${resultsHeadingReveal.isRevealed ? ' is-revealed' : ''}`}
        ref={resultsHeadingReveal.ref}
      >
        <div>
          <p className="eyebrow">พร้อมพบครอบครัวใหม่</p>
          <h2>น้องหมาทั้งหมด</h2>
        </div>
        {!loading && !error && <span>{filteredDogs.length} ตัว</span>}
      </div>
      {loading && <DogCardSkeletons count={8} />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && filteredDogs.length === 0 && (
        <EmptyState>ยังไม่พบน้องหมาที่ตรงกับตัวกรอง ลองปรับเงื่อนไขอีกครั้ง</EmptyState>
      )}
      {!loading && !error && filteredDogs.length > 0 && (
        <div className="grid" role="region" aria-label="dog results">
          {filteredDogs.map((dog, index) => (
            <DogCard key={dog.id} dog={dog} style={{ '--stagger-delay': `${index * 60}ms` }} />
          ))}
        </div>
      )}
    </section>
  )
}
