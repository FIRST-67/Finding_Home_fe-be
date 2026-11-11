import { useCallback, useEffect, useState } from 'react'
import DogCard from '../components/DogCard'
import EmptyState from '../components/EmptyState'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import { getDogs } from '../services/dogs'

export default function HomePage() {
  const [dogs, setDogs] = useState([])
  const [filters, setFilters] = useState({ q: '', breed: '', size: '', age: '', gender: '' })
  const [appliedFilters, setAppliedFilters] = useState({ status: 'available' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (nextFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await getDogs(nextFilters)
      setDogs(data)
    } catch (err) {
      setError(err.message || 'โหลดรายการสุนัขไม่สำเร็จ')
      setDogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(appliedFilters)
  }, [appliedFilters, load])

  function handleSubmit(e) {
    e.preventDefault()
    setAppliedFilters({
      q: filters.q.trim(),
      breed: filters.breed.trim(),
      size: filters.size,
      age: filters.age.trim(),
      gender: filters.gender,
      status: 'available',
    })
  }

  return (
    <>
      <section className="home-intro">
        <p className="eyebrow">เพื่อนซี้ตัวใหม่กำลังรอคุณ</p>
        <h1>ช่วยน้องหมาไร้บ้าน<br />ได้พบครอบครัวที่อบอุ่น</h1>
        <p>เลือกดูน้องๆ ที่พร้อมเริ่มต้นชีวิตใหม่ไปด้วยกัน</p>
      </section>
      <form className="search" onSubmit={handleSubmit}>
        <input
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          placeholder="ค้นหาชื่อหรือสายพันธุ์"
          aria-label="ค้นหาชื่อหรือสายพันธุ์"
        />
        <input
          value={filters.breed}
          onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
          placeholder="สายพันธุ์"
          aria-label="สายพันธุ์"
        />
        <select
          value={filters.size}
          onChange={(e) => setFilters({ ...filters, size: e.target.value })}
          aria-label="ขนาด"
        >
          <option value="">ทุกขนาด</option>
          <option value="small">เล็ก</option>
          <option value="medium">กลาง</option>
          <option value="large">ใหญ่</option>
        </select>
        <select
          value={filters.age}
          onChange={(e) => setFilters({ ...filters, age: e.target.value })}
          aria-label="ช่วงอายุ"
        >
          <option value="">ทุกช่วงอายุ</option>
          <option value="เด็ก">ลูกสุนัข</option>
          <option value="ปี">โตเต็มวัย</option>
          <option value="สูงวัย">สูงวัย</option>
        </select>
        <select
          value={filters.gender}
          onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
          aria-label="เพศ"
        >
          <option value="">ทุกเพศ</option>
          <option value="male">เพศผู้</option>
          <option value="female">เพศเมีย</option>
        </select>
        <button type="submit">ค้นหา</button>
      </form>

      {loading && <Loading>กำลังค้นหาน้องหมา...</Loading>}
      {!loading && error && <ErrorMessage message={error} onRetry={() => load(appliedFilters)} />}
      {!loading && !error && dogs.length === 0 && (
        <EmptyState>ยังไม่มีน้องหมาที่ตรงกับเงื่อนไข ลองปรับตัวกรองอีกครั้ง</EmptyState>
      )}
      {!loading && !error && dogs.length > 0 && (
        <section className="grid">
          {dogs.map((dog) => (
            <DogCard key={dog.id} dog={dog} />
          ))}
        </section>
      )}
    </>
  )
}
