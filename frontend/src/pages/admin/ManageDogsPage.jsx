import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import DogImage from '../../components/DogImage'
import { deleteDog, getDogs } from '../../services/dogs'

export default function ManageDogsPage() {
  const [dogs, setDogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [available, adopted] = await Promise.all([
        getDogs({ status: 'available', page: 1, limit: 50 }),
        getDogs({ status: 'adopted', page: 1, limit: 50 }),
      ])
      setDogs([...available.data, ...adopted.data])
    } catch (loadError) {
      setDogs([])
      setError(loadError.message || 'โหลดข้อมูลสุนัขไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  async function remove(dog) {
    if (!window.confirm(`ยืนยันลบข้อมูล${dog.name}?`)) return
    try {
      await deleteDog(dog.id)
      setDogs((current) => current.filter((entry) => entry.id !== dog.id))
    } catch (deleteError) {
      setError(deleteError.message || 'ลบข้อมูลไม่สำเร็จ')
    }
  }

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">พื้นที่ผู้ดูแลระบบ</p><h1>จัดการสุนัข</h1></div>
        <Link className="button-link" to="/admin/dogs/new">เพิ่มสุนัข</Link>
      </div>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !dogs.length && <EmptyState>ยังไม่มีข้อมูลสุนัข เพิ่มข้อมูลตัวแรกได้เลย</EmptyState>}
      {!loading && !error && Boolean(dogs.length) && (
        <div className="table-scroll">
          <table>
            <thead><tr><th>รูป</th><th>ชื่อ</th><th>สายพันธุ์</th><th>สถานะ</th><th>จัดการ</th></tr></thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.id}>
                  <td><DogImage className="admin-dog-image" src={dog.image_url} alt={dog.name} /></td>
                  <td>{dog.name}</td><td>{dog.breed_name}</td><td>{dog.status}</td>
                  <td>
                    <div className="button-row">
                      <Link className="button-link button-link--small" to={`/admin/dogs/${dog.id}/edit`}>แก้ไข</Link>
                      <button className="button-danger" type="button" onClick={() => remove(dog)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
