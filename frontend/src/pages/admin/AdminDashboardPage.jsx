import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getDogs } from '../../services/dogs'
import { getAllRequests } from '../../services/requests'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({ dogCount: 0, pendingRequestCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [availableDogs, adoptedDogs, pendingRequests] = await Promise.all([
        getDogs({ status: 'available', limit: 1 }),
        getDogs({ status: 'adopted', limit: 1 }),
        getAllRequests({ status: 'pending', limit: 1 }),
      ])
      setSummary({
        dogCount: availableDogs.total + adoptedDogs.total,
        pendingRequestCount: pendingRequests.total,
      })
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
            <article className="stat-card"><span>สุนัขทั้งหมด</span><strong>{summary.dogCount}</strong></article>
            <article className="stat-card"><span>คำขอรอพิจารณา</span><strong>{summary.pendingRequestCount}</strong></article>
          </div>
          {!summary.dogCount && !summary.pendingRequestCount && <EmptyState>ยังไม่มีข้อมูลสุนัขหรือคำขอรับเลี้ยง</EmptyState>}
          <div className="admin-links">
            <Link to="/admin/dogs">จัดการข้อมูลสุนัข</Link>
            <Link to="/admin/requests">พิจารณาคำขอรับเลี้ยง</Link>
          </div>
        </>
      )}
    </section>
  )
}
