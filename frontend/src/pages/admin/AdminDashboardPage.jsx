import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getDogs } from '../../services/dogs'
import { getAllRequests } from '../../services/requests'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({ dogs: [], requests: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [dogs, requests] = await Promise.all([getDogs(), getAllRequests()])
      setSummary({ dogs, requests })
    } catch (loadError) {
      setError(loadError.message || 'โหลดข้อมูลภาพรวมไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <section>
      <div className="section-heading">
        <div><p className="eyebrow">พื้นที่ผู้ดูแลระบบ</p><h1>แดชบอร์ด</h1></div>
        <Link className="button-link" to="/admin/dogs">จัดการสุนัข</Link>
      </div>
      {loading && <Loading />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && (
        <>
          <div className="stats-grid">
            <article className="stat-card"><span>สุนัขทั้งหมด</span><strong>{summary.dogs.length}</strong></article>
            <article className="stat-card"><span>คำขอรอพิจารณา</span><strong>{summary.requests.filter((request) => request.status === 'pending').length}</strong></article>
          </div>
          {!summary.dogs.length && !summary.requests.length && <EmptyState>ยังไม่มีข้อมูลสุนัขหรือคำขอรับเลี้ยง</EmptyState>}
          <div className="admin-links">
            <Link to="/admin/dogs">จัดการข้อมูลสุนัข</Link>
            <Link to="/admin/requests">พิจารณาคำขอรับเลี้ยง</Link>
          </div>
        </>
      )}
    </section>
  )
}
