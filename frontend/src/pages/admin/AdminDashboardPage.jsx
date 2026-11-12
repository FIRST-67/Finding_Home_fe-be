import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/EmptyState'
import ErrorMessage from '../../components/ErrorMessage'
import Loading from '../../components/Loading'
import { getDogs } from '../../services/dogs'
import { getAllRequests } from '../../services/requests'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({
    dogCount: 0,
    availableDogCount: 0,
    adoptedDogCount: 0,
    pendingRequestCount: 0,
  })
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
        availableDogCount: availableDogs.total,
        adoptedDogCount: adoptedDogs.total,
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
            <article className="stat-card"><span>พร้อมรับเลี้ยง</span><strong>{summary.availableDogCount}</strong></article>
            <article className="stat-card"><span>รับเลี้ยงแล้ว</span><strong>{summary.adoptedDogCount}</strong></article>
            <article className="stat-card"><span>คำขอรอพิจารณา</span><strong>{summary.pendingRequestCount}</strong></article>
          </div>
          {!summary.dogCount && !summary.pendingRequestCount && <EmptyState>ยังไม่มีข้อมูลสุนัขหรือคำขอรับเลี้ยง</EmptyState>}
          <div className="admin-links">
            <Link className="button-link" to="/admin/dogs">จัดการข้อมูลสุนัข</Link>
            <Link className="button-link" to="/admin/requests">พิจารณาคำขอรับเลี้ยง</Link>
          </div>
        </>
      )}
    </section>
  )
}
