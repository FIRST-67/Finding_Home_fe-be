import { useEffect, useState } from 'react'
import { getBreeds, searchBreeds } from '../services/api'
import BreedCard from '../components/BreedCard'
import StatusMessage from '../components/StatusMessage'

export default function HomePage() {
  const [breeds, setBreeds] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(term = '') {
    setLoading(true)
    setError('')
    try {
      const data = term ? await searchBreeds(term) : await getBreeds()
      setBreeds(data)
    } catch (err) {
      setError(err.message)
      setBreeds([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function handleSubmit(e) {
    e.preventDefault()
    load(query.trim())
  }

  return (
    <>
      <form className="search" onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาสายพันธุ์ เช่น husky"
          aria-label="ค้นหาสายพันธุ์"
        />
        <button type="submit">ค้นหา</button>
      </form>

      {loading && <StatusMessage type="loading">กำลังโหลดข้อมูล...</StatusMessage>}
      {!loading && error && <StatusMessage type="error">{error}</StatusMessage>}
      {!loading && !error && breeds.length === 0 && (
        <StatusMessage type="empty">ไม่พบสายพันธุ์ที่ค้นหา ลองใช้คำอื่น</StatusMessage>
      )}
      {!loading && !error && breeds.length > 0 && (
        <section className="grid">
          {breeds.map((b) => (
            <BreedCard key={b.id} breed={b} />
          ))}
        </section>
      )}
    </>
  )
}
